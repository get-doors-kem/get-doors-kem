const DATA_KEY = "doors_shop_v3";

const DEFAULT_DATA = {
  version: 3,
  tabs: [
    { id: "tab-doors", name: "Двери", order: 0 },
    { id: "tab-services", name: "Установка", order: 1 }
  ],
  items: [
    {
      id: "svc-install-interior",
      tabId: "tab-services",
      title: "Установка межкомнатной двери",
      description: "Демонтаж старой двери по желанию, подготовка проёма, установка коробки, полотна, наличников. Регулировка.",
      price: "от 3 500 ₽",
      priceUnit: "за услугу",
      images: [],
      createdAt: 1
    },
    {
      id: "svc-install-entry",
      tabId: "tab-services",
      title: "Установка входной двери",
      description: "Монтаж входной двери с усилением проёма при необходимости, установка фурнитуры, герметизация, регулировка.",
      price: "от 7 500 ₽",
      priceUnit: "за услугу",
      images: [],
      createdAt: 2
    },
    {
      id: "svc-extend",
      tabId: "tab-services",
      title: "Расширение / сужение проёма",
      description: "Изменение размеров дверного проёма под новое полотно. Работа с бетоном, кирпичом или гипсокартоном.",
      price: "от 4 000 ₽",
      priceUnit: "за услугу",
      images: [],
      createdAt: 3
    },
    {
      id: "svc-hardware",
      tabId: "tab-services",
      title: "Установка замков и фурнитуры",
      description: "Врезка замков, установка ручек, доводчиков, петель. Замена фурнитуры на уже установленных дверях.",
      price: "от 1 500 ₽",
      priceUnit: "за ед.",
      images: [],
      createdAt: 4
    }
  ]
};


function formatArticle(input) {
  var raw = String(input == null ? "" : input).trim();
  if (!raw) return "";
  // Keep only digits for auto pattern XXX-XXX-XXX
  var digits = raw.replace(/\D/g, "");
  if (!digits) {
    // no digits — keep cleaned limited text
    return raw.slice(0, 60);
  }
  // Group as 3-3-3... (e.g. 123123123 → 123-123-123)
  var parts = digits.match(/.{1,3}/g) || [];
  return parts.join("-").slice(0, 60);
}

function normalizeArticle(it) {
  return formatArticle((it && it.article) || "").slice(0, 60);
}

function normalizePriceUnit(it) {
  var u = String((it && it.priceUnit) || "").trim().slice(0, 30);
  return u;
}


/** Format price for display: 3000 → "3 000 ₽", "от 3000" → "от 3 000 ₽" */
function formatMoney(input) {
  var raw = String(input == null ? "" : input).trim();
  if (!raw) return "";

  // Keep simple non-numeric labels as-is
  if (!/\d/.test(raw)) return raw;

  // Extract prefix (e.g. "от ", "до ") before first digit
  var m = raw.match(/^(\D*?)([\d\s.,]+)\s*(₽|руб\.?|рублей|руб)?\s*$/i);
  if (!m) {
    // fallback: format all digit groups
    return raw.replace(/\d[\d\s.,]*/g, function (chunk) {
      var digits = chunk.replace(/[^\d]/g, "");
      if (!digits) return chunk;
      return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
    });
  }
  var prefix = (m[1] || "").trim();
  var digits = (m[2] || "").replace(/[^\d]/g, "");
  if (!digits) return raw;
  var formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (prefix ? prefix + " " : "") + formatted + " ₽";
}

function normalizePriceInput(input) {
  return formatMoney(input);
}

function normalizeImages(it) {
  var images = [];
  if (Array.isArray(it.images)) {
    it.images.forEach(function (img) {
      if (typeof img === "string" && img) images.push(img);
    });
  }
  if (!images.length && typeof it.image === "string" && it.image) {
    images.push(it.image);
  }
  return images.slice(0, 12);
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function migrateFromOld() {
  try {
    const products = JSON.parse(localStorage.getItem("doors_catalog_v1") || "null");
    const services = JSON.parse(localStorage.getItem("doors_services_v1") || "null");
    if (!Array.isArray(products) && !Array.isArray(services)) return null;

    const tabs = [
      { id: "tab-doors", name: "Двери", order: 0 },
      { id: "tab-services", name: "Установка", order: 1 }
    ];
    const items = [];
    if (Array.isArray(products)) {
      products.forEach(function (it, i) {
        if (!it || !it.title) return;
        items.push({
          id: String(it.id || uid()),
          tabId: "tab-doors",
          title: String(it.title).slice(0, 120),
          description: String(it.description || "").slice(0, 1000),
          price: normalizePriceInput(String(it.price || "")).slice(0, 40),
          priceUnit: normalizePriceUnit(it),
          article: normalizeArticle(it),
          images: normalizeImages(it),
          createdAt: it.createdAt || Date.now() + i
        });
      });
    }
    if (Array.isArray(services) && services.length) {
      services.forEach(function (it, i) {
        if (!it || !it.title) return;
        items.push({
          id: String(it.id || uid()),
          tabId: "tab-services",
          title: String(it.title).slice(0, 120),
          description: String(it.description || "").slice(0, 1000),
          price: normalizePriceInput(String(it.price || "")).slice(0, 40),
          priceUnit: normalizePriceUnit(it),
          article: normalizeArticle(it),
          images: normalizeImages(it),
          createdAt: it.createdAt || Date.now() + i
        });
      });
    } else {
      DEFAULT_DATA.items.forEach(function (it) { items.push(Object.assign({}, it)); });
    }
    return { version: 3, tabs: tabs, items: items };
  } catch (e) {
    return null;
  }
}

const Shop = {
  load: function () {
    try {
      var raw = localStorage.getItem(DATA_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && Array.isArray(data.tabs) && Array.isArray(data.items)) {
          return {
            version: 3,
            tabs: data.tabs
              .filter(function (t) { return t && t.id && t.name; })
              .map(function (t, i) {
                return {
                  id: String(t.id),
                  name: String(t.name).slice(0, 40),
                  order: typeof t.order === "number" ? t.order : i
                };
              })
              .sort(function (a, b) { return a.order - b.order; }),
            items: data.items
              .filter(function (it) { return it && it.title && it.tabId; })
              .map(function (it) {
                return {
                  id: String(it.id || uid()),
                  tabId: String(it.tabId),
                  title: String(it.title).slice(0, 120),
                  description: String(it.description || "").slice(0, 1000),
                  price: normalizePriceInput(String(it.price || "")).slice(0, 40),
                  priceUnit: normalizePriceUnit(it),
                  article: normalizeArticle(it),
                  images: normalizeImages(it),
                  createdAt: it.createdAt || Date.now()
                };
              })
          };
        }
      }
    } catch (e) {}
    var migrated = migrateFromOld();
    if (migrated) {
      this.save(migrated);
      return migrated;
    }
    var fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.save(fresh);
    return fresh;
  },

  save: function (data) {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  },

  tabs: function () {
    return this.load().tabs.slice().sort(function (a, b) { return a.order - b.order; });
  },

  itemsByTab: function (tabId) {
    return this.load().items.filter(function (it) { return it.tabId === tabId; });
  },

  addTab: function (name) {
    var data = this.load();
    var clean = String(name || "").trim().slice(0, 40);
    if (!clean) throw new Error("Введите название вкладки");
    if (data.tabs.some(function (t) { return t.name.toLowerCase() === clean.toLowerCase(); })) {
      throw new Error("Такая вкладка уже есть");
    }
    var maxOrder = 0;
    data.tabs.forEach(function (t) { if (t.order > maxOrder) maxOrder = t.order; });
    var tab = { id: uid(), name: clean, order: data.tabs.length ? maxOrder + 1 : 0 };
    data.tabs.push(tab);
    this.save(data);
    return tab;
  },

  renameTab: function (id, name) {
    var data = this.load();
    var clean = String(name || "").trim().slice(0, 40);
    if (!clean) throw new Error("Введите название");
    var tab = null;
    for (var i = 0; i < data.tabs.length; i++) {
      if (data.tabs[i].id === id) { tab = data.tabs[i]; break; }
    }
    if (!tab) throw new Error("Вкладка не найдена");
    tab.name = clean;
    this.save(data);
    return tab;
  },

  removeTab: function (id) {
    var data = this.load();
    if (data.tabs.length <= 1) throw new Error("Нужна хотя бы одна вкладка");
    data.tabs = data.tabs.filter(function (t) { return t.id !== id; });
    data.items = data.items.filter(function (it) { return it.tabId !== id; });
    this.save(data);
  },

  addItem: function (item) {
    var data = this.load();
    data.items.unshift({
      id: item.id || uid(),
      tabId: item.tabId,
      title: String(item.title || "").slice(0, 120),
      description: String(item.description || "").slice(0, 1000),
      price: normalizePriceInput(String(item.price || "")).slice(0, 40),
      priceUnit: normalizePriceUnit(item),
      article: normalizeArticle(item),
      images: normalizeImages(item),
      createdAt: Date.now()
    });
    this.save(data);
  },

  updateItem: function (id, patch) {
    var data = this.load();
    data.items = data.items.map(function (it) {
      if (it.id !== id) return it;
      return {
        id: it.id,
        tabId: patch.tabId !== undefined ? patch.tabId : it.tabId,
        title: patch.title !== undefined ? String(patch.title).slice(0, 120) : it.title,
        description: patch.description !== undefined ? String(patch.description).slice(0, 1000) : it.description,
        price: patch.price !== undefined ? normalizePriceInput(String(patch.price)).slice(0, 40) : it.price,
        priceUnit: patch.priceUnit !== undefined ? normalizePriceUnit(patch) : (it.priceUnit || ""),
        article: patch.article !== undefined ? normalizeArticle(patch) : (it.article || ""),
        images: patch.images !== undefined ? normalizeImages({ images: patch.images }) : it.images,
        createdAt: it.createdAt
      };
    });
    this.save(data);
  },

  removeItem: function (id) {
    var data = this.load();
    data.items = data.items.filter(function (it) { return it.id !== id; });
    this.save(data);
  },

  clearTabItems: function (tabId) {
    var data = this.load();
    data.items = data.items.filter(function (it) { return it.tabId !== tabId; });
    this.save(data);
  },

  exportJson: function () {
    return JSON.stringify(this.load(), null, 2);
  },

  importJson: function (text) {
    var data = JSON.parse(text);
    if (data && data.version === 3 && Array.isArray(data.tabs) && Array.isArray(data.items)) {
      this.save(data);
      return;
    }
    if (Array.isArray(data)) {
      var next = JSON.parse(JSON.stringify(DEFAULT_DATA));
      next.items = data.filter(function (it) { return it && it.title; }).map(function (it) {
        return {
          id: String(it.id || uid()),
          tabId: "tab-doors",
          title: String(it.title).slice(0, 120),
          description: String(it.description || "").slice(0, 1000),
          price: normalizePriceInput(String(it.price || "")).slice(0, 40),
          priceUnit: normalizePriceUnit(it),
          article: normalizeArticle(it),
          images: normalizeImages(it),
          createdAt: it.createdAt || Date.now()
        };
      });
      this.save(next);
      return;
    }
    if (data && Array.isArray(data.products)) {
      var next2 = JSON.parse(JSON.stringify(DEFAULT_DATA));
      next2.items = [];
      (data.products || []).forEach(function (it) {
        if (!it || !it.title) return;
        next2.items.push({
          id: String(it.id || uid()),
          tabId: "tab-doors",
          title: String(it.title).slice(0, 120),
          description: String(it.description || "").slice(0, 1000),
          price: normalizePriceInput(String(it.price || "")).slice(0, 40),
          priceUnit: normalizePriceUnit(it),
          article: normalizeArticle(it),
          images: normalizeImages(it),
          createdAt: it.createdAt || Date.now()
        });
      });
      (data.services || []).forEach(function (it) {
        if (!it || !it.title) return;
        next2.items.push({
          id: String(it.id || uid()),
          tabId: "tab-services",
          title: String(it.title).slice(0, 120),
          description: String(it.description || "").slice(0, 1000),
          price: normalizePriceInput(String(it.price || "")).slice(0, 40),
          priceUnit: normalizePriceUnit(it),
          article: normalizeArticle(it),
          images: normalizeImages(it),
          createdAt: it.createdAt || Date.now()
        });
      });
      this.save(next2);
      return;
    }
    throw new Error("Неверный формат файла");
  }
};

function fileToDataUrl(file, maxSide, quality) {
  maxSide = maxSide || 1200;
  quality = quality || 0.82;
  return new Promise(function (resolve, reject) {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Нужен файл изображения"));
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () { reject(new Error("Не удалось прочитать файл")); };
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var width = img.width;
        var height = img.height;
        var scale = Math.min(1, maxSide / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = function () { reject(new Error("Повреждённое изображение")); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
