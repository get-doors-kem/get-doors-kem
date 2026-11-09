var CART_KEY = "doors_cart_v1";

var Cart = {
  load: function () {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var data = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(data)) return [];
      return data
        .filter(function (x) { return x && x.id && x.title; })
        .map(function (x) {
          return {
            id: String(x.id),
            title: String(x.title).slice(0, 120),
            price: String(x.price || "").slice(0, 40),
            priceUnit: String(x.priceUnit || "").slice(0, 30),
            image: typeof x.image === "string" ? x.image : "",
            tabId: String(x.tabId || ""),
            tabName: String(x.tabName || "").slice(0, 40),
            article: String(x.article || "").slice(0, 60),
            qty: Math.max(1, Math.min(99, Number(x.qty) || 1))
          };
        });
    } catch (e) {
      return [];
    }
  },

  save: function (items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("cart save failed", e);
    }
    this.notify();
  },

  count: function () {
    return this.load().reduce(function (sum, x) { return sum + x.qty; }, 0);
  },

  add: function (item, qty) {
    if (!item) return;
    qty = Math.max(1, Math.min(99, Number(qty) || 1));
    var id = String(item.id || item.title || ("tmp-" + Date.now()));
    var items = this.load();
    var found = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) { found = items[i]; break; }
    }
    if (found) {
      found.qty = Math.min(99, found.qty + qty);
    } else {
      items.push({
        id: id,
        title: String(item.title || "Товар").slice(0, 120),
        price: String(item.price || "").slice(0, 40),
        priceUnit: String(item.priceUnit || "").slice(0, 30),
        image: typeof item.image === "string" ? item.image : "",
        tabId: String(item.tabId || ""),
        tabName: String(item.tabName || "").slice(0, 40),
        article: String(item.article || "").slice(0, 60),
        qty: qty
      });
    }
    this.save(items);
    return this.load();
  },

  setQty: function (id, qty) {
    id = String(id);
    qty = Number(qty) || 0;
    var items = this.load();
    if (qty <= 0) {
      items = items.filter(function (x) { return x.id !== id; });
    } else {
      items = items.map(function (x) {
        if (x.id !== id) return x;
        return {
          id: x.id,
          title: x.title,
          price: x.price,
          priceUnit: x.priceUnit,
          image: x.image,
          tabId: x.tabId || "",
          tabName: x.tabName || "",
          article: x.article || "",
          qty: Math.min(99, qty)
        };
      });
    }
    this.save(items);
  },

  remove: function (id) {
    id = String(id);
    this.save(this.load().filter(function (x) { return x.id !== id; }));
  },

  clear: function () {
    this.save([]);
  },

  listeners: [],

  onChange: function (fn) {
    if (typeof fn === "function") this.listeners.push(fn);
  },

  notify: function () {
    var items = this.load();
    this.listeners.forEach(function (fn) {
      try { fn(items); } catch (e) { console.error(e); }
    });
  }
};

window.Cart = Cart;


(function () {
  var menu = document.getElementById("publicMenu");
  var catalog = document.getElementById("catalog");
  var empty = document.getElementById("empty");
  var count = document.getElementById("count");
  var search = document.getElementById("search");
  var pageTitle = document.getElementById("pageTitle");
  var productPage = document.getElementById("productPage");
  var productBack = document.getElementById("productBack");
  var productTitle = document.getElementById("productTitle");
  var productDesc = document.getElementById("productDesc");
  var productPrice = document.getElementById("productPrice");
  var productArticle = document.getElementById("productArticle");
  var gallery = document.getElementById("gallery");
  var galleryImg = document.getElementById("galleryImg");
  var galleryPrev = document.getElementById("galleryPrev");
  var galleryNext = document.getElementById("galleryNext");
  var galleryDots = document.getElementById("galleryDots");
  var galleryFs = document.getElementById("galleryFs");
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxPrev = document.getElementById("lightboxPrev");
  var lightboxNext = document.getElementById("lightboxNext");
  var lightboxDots = document.getElementById("lightboxDots");
  var cartBtn = document.getElementById("cartBtn");
  var cartBadge = document.getElementById("cartBadge");
  var cartOverlay = document.getElementById("cartOverlay");
  var cartDrawer = document.getElementById("cartDrawer");
  var cartBody = document.getElementById("cartBody");
  var cartClose = document.getElementById("cartClose");
  var cartClear = document.getElementById("cartClear");
  var cartOrder = document.getElementById("cartOrder");
  var cartTotal = document.getElementById("cartTotal");
  var cartTotalValue = document.getElementById("cartTotalValue");
  var orderOverlay = document.getElementById("orderOverlay");
  var orderMeta = document.getElementById("orderMeta");
  var orderDownload = document.getElementById("orderDownload");
  var orderClose = document.getElementById("orderClose");
  var addToCartBtn = document.getElementById("addToCartBtn");
  var lastOrderItems = null;
  var productQtyVal = document.getElementById("productQtyVal");
  var productQtyDec = document.getElementById("productQtyDec");
  var productQtyInc = document.getElementById("productQtyInc");
  var productQty = 1;

  var params = new URLSearchParams(location.search);
  var activeTabId = params.get("tab") || "";
  var currentItem = null;
  var slideIndex = 0;

  function placeholder() {
    return "data:image/svg+xml," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
      '<rect fill="#e8e4de" width="100%" height="100%"/>' +
      '<text x="50%" y="50%" fill="#8a847c" font-family="sans-serif" font-size="22" text-anchor="middle">Нет фото</text>' +
      "</svg>"
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function formatPrice(it) {
    if (!it.price) return "";
    var p = typeof formatMoney === "function" ? formatMoney(it.price) : it.price;
    return p + (it.priceUnit ? " " + it.priceUnit : "");
  }


  function cartPayloadFromItem(it) {
    var imgs = itemImages(it);
    var tabId = String(it.tabId || "");
    var tabName = "";
    try {
      var tabs = Shop.tabs();
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].id === tabId) { tabName = tabs[i].name; break; }
      }
    } catch (e) {}
    if (!tabName) {
      if (tabId.indexOf("service") !== -1) tabName = "Услуги";
      else if (tabId.indexOf("door") !== -1) tabName = "Двери";
      else tabName = "Товары";
    }
    return {
      id: String(it.id || ""),
      title: it.title,
      price: it.price || "",
      priceUnit: it.priceUnit || "",
      article: it.article ? (typeof formatArticle === "function" ? formatArticle(it.article) : it.article) : "",
      image: imgs[0] || "",
      tabId: tabId,
      tabName: tabName
    };
  }

  function setProductQty(n) {
    productQty = Math.max(1, Math.min(99, n));
    if (productQtyVal) productQtyVal.textContent = String(productQty);
  }

  function itemImages(it) {
    if (it.images && it.images.length) return it.images;
    if (it.image) return [it.image];
    return [];
  }

  function renderMenu() {
    var tabs = Shop.tabs();
    if (!tabs.length) {
      menu.innerHTML = "";
      return;
    }
    if (!activeTabId || !tabs.some(function (t) { return t.id === activeTabId; })) {
      activeTabId = tabs[0].id;
    }
    menu.innerHTML = tabs.map(function (t) {
      return '<a href="?tab=' + encodeURIComponent(t.id) + '" class="' +
        (t.id === activeTabId ? "is-active" : "") +
        '" data-tab="' + escapeAttr(t.id) + '">' + escapeHtml(t.name) + "</a>";
    }).join("");

    Array.prototype.forEach.call(menu.querySelectorAll("a"), function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        closeProduct();
        activeTabId = a.getAttribute("data-tab");
        history.replaceState(null, "", "?tab=" + encodeURIComponent(activeTabId));
        renderMenu();
        render(search.value);
      });
    });

    var current = null;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === activeTabId) { current = tabs[i]; break; }
    }
    pageTitle.textContent = current ? current.name : "Каталог";
    document.title = (current ? current.name + " — " : "") + "Каталог";
  }

  function render(filter) {
    filter = filter || "";
    var q = filter.trim().toLowerCase();
    var items = Shop.itemsByTab(activeTabId);
    if (q) {
      items = items.filter(function (it) {
        return it.title.toLowerCase().indexOf(q) !== -1 ||
          String(it.description || "").toLowerCase().indexOf(q) !== -1;
      });
    }

    catalog.innerHTML = "";
    count.textContent = items.length ? items.length + " шт." : "";
    empty.hidden = items.length > 0;

    items.forEach(function (it, index) {
      var imgs = itemImages(it);
      var cover = imgs[0] || placeholder();
      var card = document.createElement("article");
      card.className = "item";
      card.setAttribute("data-id", String(it.id));
      card.style.animationDelay = (index * 40) + "ms";
      card.tabIndex = 0;
      card.innerHTML =
        '<div class="item__frame">' +
        '<img class="item__img" src="' + cover + '" alt="' + escapeAttr(it.title) + '" />' +
        "</div>" +
        '<div class="item__body">' +
        "<h3>" + escapeHtml(it.title) + "</h3>" +
        "<p>" + escapeHtml(it.description || "Без описания") + "</p>" +
        (it.article ? '<div class="item__article">' + escapeHtml("арт. " + it.article) + "</div>" : "") +
        (it.price ? '<div class="item__price">' + escapeHtml(formatPrice(it)) + "</div>" : "") +
        '<div class="item__cart-row">' +
        '<div class="qty-stepper qty-stepper--sm" data-card-qty>' +
        '<button type="button" class="qty-btn" data-card-act="dec" aria-label="Меньше">−</button>' +
        '<span class="qty-stepper__val">1</span>' +
        '<button type="button" class="qty-btn" data-card-act="inc" aria-label="Больше">+</button>' +
        "</div>" +
        '<button type="button" class="btn btn--cart btn--cart-sm" data-card-add>В корзину</button>' +
        "</div>" +
        "</div>";
      var qtySpan = card.querySelector(".qty-stepper__val");
      card._cardQty = 1;
      card.querySelector('[data-card-act="dec"]').addEventListener("click", function (e) {
        e.stopPropagation();
        card._cardQty = Math.max(1, (card._cardQty || 1) - 1);
        qtySpan.textContent = String(card._cardQty);
      });
      card.querySelector('[data-card-act="inc"]').addEventListener("click", function (e) {
        e.stopPropagation();
        card._cardQty = Math.min(99, (card._cardQty || 1) + 1);
        qtySpan.textContent = String(card._cardQty);
      });
      card.querySelector("[data-card-add]").addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var qty = card._cardQty || 1;
        addItemToCart(it, qty, e.currentTarget);
        setAddButtonState(e.currentTarget, true, false);
      });
      card.addEventListener("click", function () { openProduct(it); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProduct(it);
        }
      });
      catalog.appendChild(card);
    });
    syncAddButtonsFromCart();
  }

  function openProduct(it) {
    currentItem = it;
    slideIndex = 0;
    setProductQty(1);
    syncAddButtonsFromCart();
    productTitle.textContent = it.title;
    productDesc.textContent = it.description || "Описание не указано";
    if (productArticle) {
      if (it.article) {
        productArticle.textContent = "Артикул: " + it.article;
        productArticle.hidden = false;
      } else {
        productArticle.textContent = "";
        productArticle.hidden = true;
      }
    }
    productPrice.textContent = formatPrice(it);
    productPrice.hidden = !it.price;
    updateGallery();
    productPage.hidden = false;
    requestAnimationFrame(function () {
      productPage.classList.add("is-open");
    });
    document.body.classList.add("no-scroll");
  }

  function closeProduct() {
    if (lightbox && lightbox.classList.contains("is-open")) closeLightbox();
    productPage.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    setTimeout(function () {
      if (!productPage.classList.contains("is-open")) {
        productPage.hidden = true;
        currentItem = null;
      }
    }, 320);
  }

  function updateGallery() {
    if (!currentItem) return;
    var imgs = itemImages(currentItem);
    var src = imgs[slideIndex] || placeholder();
    galleryImg.classList.remove("is-show");
    // force reflow for fade
    void galleryImg.offsetWidth;
    galleryImg.src = src;
    galleryImg.alt = currentItem.title;
    requestAnimationFrame(function () {
      galleryImg.classList.add("is-show");
    });

    var multi = imgs.length > 1;
    galleryPrev.hidden = !multi;
    galleryNext.hidden = !multi;
    galleryDots.hidden = !multi;
    galleryDots.innerHTML = "";
    imgs.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "gallery__dot" + (i === slideIndex ? " is-active" : "");
      dot.textContent = String(i + 1);
      dot.setAttribute("aria-label", "Фото " + (i + 1));
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
        slideIndex = i;
        updateGallery();
      });
      galleryDots.appendChild(dot);
    });
  }

  function step(delta) {
    if (!currentItem) return;
    var imgs = itemImages(currentItem);
    if (imgs.length <= 1) return;
    slideIndex = (slideIndex + delta + imgs.length) % imgs.length;
    updateGallery();
  }

  galleryPrev.addEventListener("click", function (e) {
    e.stopPropagation();
    step(-1);
  });
  galleryNext.addEventListener("click", function (e) {
    e.stopPropagation();
    step(1);
  });

  function updateLightbox() {
    if (!currentItem) return;
    var imgs = itemImages(currentItem);
    var src = imgs[slideIndex] || placeholder();
    lightboxImg.classList.remove("is-show");
    void lightboxImg.offsetWidth;
    lightboxImg.src = src;
    lightboxImg.alt = currentItem.title;
    requestAnimationFrame(function () {
      lightboxImg.classList.add("is-show");
    });
    var multi = imgs.length > 1;
    lightboxPrev.hidden = !multi;
    lightboxNext.hidden = !multi;
    lightboxDots.hidden = !multi;
    lightboxDots.innerHTML = "";
    imgs.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "lightbox__dot" + (i === slideIndex ? " is-active" : "");
      dot.textContent = String(i + 1);
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
        slideIndex = i;
        updateGallery();
        updateLightbox();
      });
      lightboxDots.appendChild(dot);
    });
  }

  function openLightbox() {
    if (!currentItem) return;
    updateLightbox();
    lightbox.hidden = false;
    requestAnimationFrame(function () {
      lightbox.classList.add("is-open");
    });
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    setTimeout(function () {
      if (!lightbox.classList.contains("is-open")) {
        lightbox.hidden = true;
      }
    }, 280);
  }

  if (galleryFs) {
    galleryFs.addEventListener("click", function (e) {
      e.stopPropagation();
      openLightbox();
    });
  }
  galleryImg.addEventListener("dblclick", function () {
    openLightbox();
  });
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  lightboxPrev.addEventListener("click", function (e) {
    e.stopPropagation();
    step(-1);
    updateLightbox();
  });
  lightboxNext.addEventListener("click", function (e) {
    e.stopPropagation();
    step(1);
    updateLightbox();
  });

  productBack.addEventListener("click", closeProduct);
  document.addEventListener("keydown", function (e) {
    var orderOpen = orderOverlay && !orderOverlay.hidden && orderOverlay.classList.contains("is-open");
    if (orderOpen) {
      if (e.key === "Escape") closeOrderSuccess();
      return;
    }
    var lbOpen = lightbox && !lightbox.hidden && lightbox.classList.contains("is-open");
    if (lbOpen) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") { step(-1); updateLightbox(); }
      if (e.key === "ArrowRight") { step(1); updateLightbox(); }
      return;
    }
    if (cartDrawer && cartDrawer.classList.contains("is-open")) {
      if (e.key === "Escape") { closeCart(); return; }
    }
    if (productPage.hidden || !productPage.classList.contains("is-open")) return;
    if (e.key === "Escape") closeProduct();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  search.addEventListener("input", function () { render(search.value); });
  renderMenu();
  render();
  function placeholderThumb() {
    return "data:image/svg+xml," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="#e8e4de" width="100%" height="100%"/></svg>'
    );
  }

  function updateCartBadge() {
    var n = Cart.count();
    if (!cartBadge) return;
    cartBadge.textContent = String(n);
    cartBadge.hidden = n < 1;
  }

  function parsePriceNumber(priceStr) {
    var digits = String(priceStr || "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  }

  function priceHasFrom(priceStr) {
    return /^\s*от\b/i.test(String(priceStr || "").trim());
  }

  function formatTotalRub(n) {
    var digits = String(Math.round(n) || 0);
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
  }

  function nowStamp() {
    var now = new Date();
    var pad = function (n) { return n < 10 ? "0" + n : String(n); };
    return {
      dateStr:
        pad(now.getDate()) + "." +
        pad(now.getMonth() + 1) + "." +
        now.getFullYear() + " · " +
        pad(now.getHours()) + ":" +
        pad(now.getMinutes()),
      filePart:
        now.getFullYear() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) +
        "-" +
        pad(now.getHours()) +
        pad(now.getMinutes())
    };
  }

  function summarizeCart(items) {
    var total = 0;
    var anyFrom = false;
    var count = 0;
    items.forEach(function (it) {
      var qty = Math.max(1, Number(it.qty) || 1);
      count += qty;
      var unitPrice = parsePriceNumber(it.price);
      if (unitPrice > 0) total += unitPrice * qty;
      if (priceHasFrom(it.price)) anyFrom = true;
    });
    return { total: total, anyFrom: anyFrom, count: count };
  }

  function updateCartTotal(items) {
    if (!cartTotal || !cartTotalValue) return;
    if (!items || !items.length) {
      cartTotal.hidden = true;
      return;
    }
    var s = summarizeCart(items);
    cartTotal.hidden = false;
    cartTotalValue.textContent = (s.anyFrom ? "от " : "") + formatTotalRub(s.total);
  }

  function buildReceiptHtml(items) {
    var stamp = nowStamp();
    var s = summarizeCart(items);
    var rows = items.map(function (it, i) {
      var qty = Math.max(1, Number(it.qty) || 1);
      var unitPrice = parsePriceNumber(it.price);
      var lineSum = unitPrice * qty;
      var priceFmt = typeof formatMoney === "function" ? formatMoney(it.price || "") : (it.price || "");
      var unitPart = it.priceUnit ? " " + escapeHtml(it.priceUnit) : "";
      var priceShow = priceFmt ? escapeHtml(priceFmt) + unitPart : "—";
      return (
        '<tr>' +
          '<td class="n">' + (i + 1) + '</td>' +
          '<td class="title">' +
            '<div class="name">' + escapeHtml(it.title || "Товар") + '</div>' +
            (it.article ? '<div class="art">арт. ' + escapeHtml(it.article) + '</div>' : '') +
          '</td>' +
          '<td class="price">' + priceShow + '</td>' +
          '<td class="qty">' + qty + '</td>' +
          '<td class="sum">' + (unitPrice > 0 ? escapeHtml(formatTotalRub(lineSum)) : "—") + '</td>' +
        '</tr>'
      );
    }).join("");

    return (
'<!DOCTYPE html>\n' +
'<html lang="ru">\n<head>\n' +
'<meta charset="UTF-8" />\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
'<title>Чек — ДВЕРИ</title>\n' +
'<style>\n' +
'  :root {\n' +
'    --bg: #f4f2ef; --card: #fffefb; --text: #1c1b1a; --muted: #6b6560;\n' +
'    --line: #e4dfd8; --accent: #2f4a3c; --accent-soft: rgba(47,74,60,0.08);\n' +
'  }\n' +
'  * { box-sizing: border-box; }\n' +
'  body {\n' +
'    margin: 0; padding: 32px 16px 48px;\n' +
'    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;\n' +
'    background: var(--bg); color: var(--text); line-height: 1.45;\n' +
'  }\n' +
'  .sheet {\n' +
'    width: min(100%, 640px); margin: 0 auto; background: var(--card);\n' +
'    border: 1px solid var(--line); border-radius: 16px;\n' +
'    box-shadow: 0 12px 36px rgba(28,27,26,0.08); overflow: hidden;\n' +
'  }\n' +
'  .head {\n' +
'    padding: 28px 28px 20px; border-bottom: 1px solid var(--line);\n' +
'    background: linear-gradient(180deg, #fffefb 0%, #f7f3ee 100%);\n' +
'  }\n' +
'  .brand {\n' +
'    font-weight: 700; letter-spacing: 0.1em; font-size: 13px;\n' +
'    color: var(--accent); margin: 0 0 10px;\n' +
'  }\n' +
'  h1 { margin: 0 0 6px; font-size: 26px; font-weight: 700; }\n' +
'  .date { margin: 0; color: var(--muted); font-size: 14px; }\n' +
'  .body { padding: 8px 0 0; }\n' +
'  table { width: 100%; border-collapse: collapse; }\n' +
'  th {\n' +
'    text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.04em;\n' +
'    text-transform: uppercase; color: var(--muted); padding: 12px 16px;\n' +
'    border-bottom: 1px solid var(--line); background: var(--accent-soft);\n' +
'  }\n' +
'  td { padding: 14px 16px; border-bottom: 1px solid var(--line); vertical-align: top; font-size: 14px; }\n' +
'  tr:last-child td { border-bottom: 0; }\n' +
'  .n { width: 36px; color: var(--muted); }\n' +
'  .name { font-weight: 600; }\n' +
'  .art { margin-top: 3px; font-size: 12px; color: var(--muted); }\n' +
'  .price, .qty, .sum { white-space: nowrap; }\n' +
'  .qty { text-align: center; width: 48px; }\n' +
'  .sum { text-align: right; font-weight: 600; color: var(--accent); width: 110px; }\n' +
'  .foot {\n' +
'    padding: 18px 28px 24px; border-top: 1px solid var(--line);\n' +
'    display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 10px;\n' +
'  }\n' +
'  .total-label { font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }\n' +
'  .total-value { font-size: 24px; font-weight: 700; color: var(--accent); }\n' +
'  .hint { margin: 0; width: 100%; font-size: 12px; color: var(--muted); }\n' +
'  .thanks {\n' +
'    padding: 0 28px 24px; color: var(--muted); font-size: 13px;\n' +
'  }\n' +
'  @media print {\n' +
'    body { background: #fff; padding: 0; }\n' +
'    .sheet { box-shadow: none; border: 0; border-radius: 0; width: 100%; }\n' +
'  }\n' +
'</style>\n</head>\n<body>\n' +
'<div class="sheet">\n' +
'  <div class="head">\n' +
'    <p class="brand">ДВЕРИ</p>\n' +
'    <h1>Чек заказа</h1>\n' +
'    <p class="date">' + escapeHtml(stamp.dateStr) + '</p>\n' +
'  </div>\n' +
'  <div class="body">\n' +
'    <table>\n' +
'      <thead><tr><th>#</th><th>Позиция</th><th>Цена</th><th>Кол-во</th><th>Сумма</th></tr></thead>\n' +
'      <tbody>\n' + rows + '\n      </tbody>\n' +
'    </table>\n' +
'  </div>\n' +
'  <div class="foot">\n' +
'    <span class="total-label">Итого' + (s.anyFrom ? ' (от)' : '') + '</span>\n' +
'    <span class="total-value">' + escapeHtml(formatTotalRub(s.total)) + '</span>\n' +
(s.anyFrom ? '    <p class="hint">Цены «от» — ориентировочные, точную сумму уточнит менеджер</p>\n' : '') +
'  </div>\n' +
'  <p class="thanks">Спасибо за заказ · продажа и установка дверей</p>\n' +
'</div>\n</body>\n</html>\n'
    );
  }

  function downloadReceipt(items) {
    var html = buildReceiptHtml(items);
    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    var a = document.createElement("a");
    var stamp = nowStamp();
    a.href = URL.createObjectURL(blob);
    a.download = "chek-" + stamp.filePart + ".html";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 500);
  }

  function openOrderSuccess(items) {
    lastOrderItems = items.slice();
    var s = summarizeCart(items);
    if (orderMeta) {
      orderMeta.innerHTML =
        '<span><strong>' + s.count + '</strong> поз.</span>' +
        '<span class="order-card__sep">·</span>' +
        '<span><strong>' + escapeHtml((s.anyFrom ? "от " : "") + formatTotalRub(s.total)) + '</strong></span>';
    }
    if (orderOverlay) {
      orderOverlay.hidden = false;
      requestAnimationFrame(function () {
        orderOverlay.classList.add("is-open");
      });
    }
  }

  function closeOrderSuccess() {
    if (!orderOverlay) return;
    orderOverlay.classList.remove("is-open");
    setTimeout(function () {
      if (!orderOverlay.classList.contains("is-open")) {
        orderOverlay.hidden = true;
      }
    }, 280);
  }

  function placeOrder() {
    var items = Cart.load();
    if (!items.length) {
      showCartToast("Корзина пуста");
      return;
    }
    closeCart();
    openOrderSuccess(items);
    Cart.clear();
    renderCart();
    syncAddButtonsFromCart();
  }

  function updateOrderButton() {
    if (!cartOrder) return;
    var n = Cart.count();
    cartOrder.disabled = n < 1;
  }

  function renderCart() {
    var items = Cart.load();
    updateOrderButton();
    updateCartTotal(items);
    if (!items.length) {
      cartBody.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
      return;
    }
    // group by tabName (fallback tabId)
    var order = [];
    var groups = {};
    items.forEach(function (it) {
      var key = it.tabName || it.tabId || "Товары";
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(it);
    });
    // Prefer typical order: Двери, Установка/Услуги, then rest
    order.sort(function (a, b) {
      function rank(n) {
        var s = String(n).toLowerCase();
        if (s.indexOf("двер") !== -1) return 0;
        if (s.indexOf("установ") !== -1 || s.indexOf("услуг") !== -1) return 1;
        return 2;
      }
      var d = rank(a) - rank(b);
      return d !== 0 ? d : String(a).localeCompare(String(b), "ru");
    });

    cartBody.innerHTML = order.map(function (section) {
      var list = groups[section];
      var lines = list.map(function (it) {
        var priceFmt = (typeof formatMoney === "function" ? formatMoney(it.price || "") : (it.price || ""));
        var priceLine = escapeHtml(priceFmt) + (it.priceUnit ? " " + escapeHtml(it.priceUnit) : "");
        return (
          '<div class="cart-line" data-id="' + escapeAttr(it.id) + '">' +
            '<img src="' + (it.image || placeholderThumb()) + '" alt="" />' +
            '<div class="cart-line__info">' +
              '<div class="cart-line__title">' + escapeHtml(it.title) + '</div>' +
              (it.article ? '<div class="cart-line__article">' + escapeHtml("арт. " + it.article) + '</div>' : '') +
              (priceLine ? '<div class="cart-line__price">' + priceLine + '</div>' : '') +
              '<div class="cart-line__qty">' +
                '<button type="button" class="qty-btn" data-act="dec" aria-label="Меньше">−</button>' +
                '<span>' + it.qty + '</span>' +
                '<button type="button" class="qty-btn" data-act="inc" aria-label="Больше">+</button>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="cart-line__del" data-act="rm" aria-label="Удалить">×</button>' +
          '</div>'
        );
      }).join("");
      return (
        '<section class="cart-section">' +
          '<h3 class="cart-section__title">' + escapeHtml(section) +
          ' <span class="cart-section__count">' + list.length + '</span></h3>' +
          lines +
        '</section>'
      );
    }).join("");
  }

  function openCart() {
    if (!cartDrawer || !cartOverlay) {
      alert("Корзина не найдена на странице");
      return;
    }
    renderCart();
    cartOverlay.hidden = false;
    cartDrawer.hidden = false;
    cartOverlay.classList.add("is-open");
    cartDrawer.classList.add("is-open");
  }

  function closeCart() {
    if (!cartDrawer || !cartOverlay) return;
    cartOverlay.classList.remove("is-open");
    cartDrawer.classList.remove("is-open");
  }

  function showCartToast(text) {
    var el = document.getElementById("cartToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "cartToast";
      el.className = "cart-toast";
      document.body.appendChild(el);
    }
    el.innerHTML = text;
    el.classList.add("is-show");
    clearTimeout(showCartToast._t);
    showCartToast._t = setTimeout(function () {
      el.classList.remove("is-show");
    }, 2200);
  }



  var CARD_ADD_LABEL = "В корзину";
  var CARD_ADDED_LABEL = "Добавлено";

  function cartIdSet() {
    var set = {};
    try {
      Cart.load().forEach(function (x) { set[String(x.id)] = true; });
    } catch (e) {}
    return set;
  }

  function setAddButtonState(btn, inCart, isProductPage) {
    if (!btn) return;
    var svgCart = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.2 14h9.6c.8 0 1.5-.5 1.7-1.2l2.3-6.5c.1-.4 0-.8-.2-1.1-.3-.3-.6-.4-1-.4H6.1L5.6 3.2C5.5 2.5 4.9 2 4.2 2H2v2h2l3.6 9.6L6.2 16c-.2.4-.2.8 0 1.2.2.3.6.5 1 .5H19v-2H8.4l.8-1.6z"/></svg>';
    var svgOk = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
    if (inCart) {
      btn.classList.add("is-added");
      if (isProductPage) btn.innerHTML = svgOk + " Добавлено";
      else btn.textContent = CARD_ADDED_LABEL;
    } else {
      btn.classList.remove("is-added");
      if (isProductPage) btn.innerHTML = svgCart + " В корзину";
      else btn.textContent = CARD_ADD_LABEL;
    }
  }


  function syncAddButtonsFromCart() {
    var inCart = cartIdSet();
    var cards = catalog ? catalog.querySelectorAll(".item[data-id]") : [];
    Array.prototype.forEach.call(cards, function (card) {
      var id = card.getAttribute("data-id");
      var addBtn = card.querySelector("[data-card-add]");
      setAddButtonState(addBtn, !!inCart[id], false);
    });
    if (currentItem && addToCartBtn) {
      setAddButtonState(addToCartBtn, !!inCart[String(currentItem.id)], true);
    }
  }

  function playAddToCartAnim(fromEl) {
    var target = cartBtn;
    if (!target) return;
    var startRect;
    if (fromEl && fromEl.getBoundingClientRect) {
      startRect = fromEl.getBoundingClientRect();
    } else {
      startRect = { left: window.innerWidth / 2, top: window.innerHeight * 0.35, width: 40, height: 40 };
    }
    var endRect = target.getBoundingClientRect();
    var sx = startRect.left + startRect.width / 2;
    var sy = startRect.top + Math.min(20, startRect.height / 2);
    var ex = endRect.left + endRect.width / 2;
    var ey = endRect.top + endRect.height / 2;

    var flyer = document.createElement("div");
    flyer.className = "cart-flyer cart-flyer--box";
    flyer.innerHTML =
      '<svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true">' +
      // closed cardboard box
      '<path fill="#c4a574" d="M6 16 L20 9 L34 16 L34 30 L20 37 L6 30 Z"/>' +
      '<path fill="#a8875a" d="M6 16 L20 23 L20 37 L6 30 Z"/>' +
      '<path fill="#d4b896" d="M20 23 L34 16 L34 30 L20 37 Z"/>' +
      '<path fill="#b8956a" d="M6 16 L20 9 L34 16 L20 23 Z"/>' +
      '<path stroke="#8b6b3f" stroke-width="1.2" fill="none" d="M20 9 L20 23"/>' +
      '<path stroke="#8b6b3f" stroke-width="1" fill="none" opacity="0.5" d="M10 18 L16 21"/>' +
      '</svg>';
    flyer.style.left = sx + "px";
    flyer.style.top = sy + "px";
    document.body.appendChild(flyer);

    // arc fall: mid control point higher/side then down into cart
    var dx = ex - sx;
    var dy = ey - sy;
    // start slightly up
    requestAnimationFrame(function () {
      flyer.classList.add("is-fall");
      flyer.style.setProperty("--dx", dx + "px");
      flyer.style.setProperty("--dy", dy + "px");
    });

    setTimeout(function () {
      if (flyer.parentNode) flyer.parentNode.removeChild(flyer);
    }, 700);
  }

  function addItemToCart(it, qty, fromEl) {
    if (typeof Cart === "undefined" || !Cart || typeof Cart.add !== "function") {
      console.error("Cart missing");
      alert("Ошибка корзины. Обновите страницу (Ctrl+F5).");
      return;
    }
    var payload = cartPayloadFromItem(it);
    if (!payload.id) {
      alert("У товара нет id — не удалось добавить");
      return;
    }
    Cart.add(payload, qty || 1);
    updateCartBadge();
    if (cartDrawer && cartDrawer.classList.contains("is-open")) renderCart();
    showCartToast("Добавлено: <strong>" + escapeHtml(payload.title) + "</strong> × " + (qty || 1));
    try { playAddToCartAnim(fromEl); } catch (e) {}
    syncAddButtonsFromCart();
  }

  if (cartBtn) cartBtn.addEventListener("click", openCart);
  if (cartClose) cartClose.addEventListener("click", closeCart);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCart);
  if (cartClear) {
    cartClear.addEventListener("click", function () {
      if (!Cart.load().length) return;
      if (confirm("Очистить корзину?")) {
        Cart.clear();
        renderCart();
        syncAddButtonsFromCart();
      }
    });
  }

  if (cartOrder) {
    cartOrder.addEventListener("click", function () {
      placeOrder();
    });
  }
  if (orderDownload) {
    orderDownload.addEventListener("click", function () {
      if (lastOrderItems && lastOrderItems.length) {
        downloadReceipt(lastOrderItems);
        showCartToast("Чек скачан");
      }
    });
  }
  if (orderClose) {
    orderClose.addEventListener("click", closeOrderSuccess);
  }
  if (orderOverlay) {
    orderOverlay.addEventListener("click", function (e) {
      if (e.target === orderOverlay) closeOrderSuccess();
    });
  }

  if (cartBody) {
    cartBody.addEventListener("click", function (e) {
      var line = e.target.closest(".cart-line");
      if (!line) return;
      var id = line.getAttribute("data-id");
      var act = e.target.getAttribute("data-act") || e.target.closest("[data-act]") && e.target.closest("[data-act]").getAttribute("data-act");
      if (!act) return;
      var items = Cart.load();
      var item = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) { item = items[i]; break; }
      }
      if (!item && act !== "rm") return;
      if (act === "inc") Cart.setQty(id, item.qty + 1);
      if (act === "dec") Cart.setQty(id, item.qty - 1);
      if (act === "rm") Cart.remove(id);
      renderCart();
      syncAddButtonsFromCart();
    });
  }

  if (productQtyDec) {
    productQtyDec.addEventListener("click", function () { setProductQty(productQty - 1); });
  }
  if (productQtyInc) {
    productQtyInc.addEventListener("click", function () { setProductQty(productQty + 1); });
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", function () {
      if (!currentItem) return;
      addItemToCart(currentItem, productQty, addToCartBtn);
      setAddButtonState(addToCartBtn, true, true);
    });
  }

  Cart.onChange(function () {
    updateCartBadge();
    updateOrderButton();
    if (cartDrawer && cartDrawer.classList.contains("is-open")) renderCart();
    syncAddButtonsFromCart();
  });
  updateCartBadge();
  updateOrderButton();
  renderCart();

  renderMenu();
  render();
})();
