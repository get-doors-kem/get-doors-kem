const CART_KEY = "doors_cart_v1";

const Cart = {
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
