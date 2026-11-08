(function () {
  var tabsEl = document.getElementById("tabs");
  var btnAddTab = document.getElementById("btnAddTab");
  var tabTools = document.getElementById("tabTools");
  var btnRenameTab = document.getElementById("btnRenameTab");
  var btnDeleteTab = document.getElementById("btnDeleteTab");
  var form = document.getElementById("itemForm");
  var formTitle = document.getElementById("formTitle");
  var editId = document.getElementById("editId");
  var title = document.getElementById("title");
  var price = document.getElementById("price");
  var unitPicker = document.getElementById("unitPicker");
  var unitPickerBtn = document.getElementById("unitPickerBtn");
  var unitPickerValue = document.getElementById("unitPickerValue");
  var unitPickerMenu = document.getElementById("unitPickerMenu");
  var unitPickerList = document.getElementById("unitPickerList");
  var unitCustomField = document.getElementById("unitCustomField");
  var priceUnitCustom = document.getElementById("priceUnitCustom");
  var btnCustomUnit = document.getElementById("btnCustomUnit");
  var btnSaveCustomUnit = document.getElementById("btnSaveCustomUnit");
  var selectedUnit = "";
  var description = document.getElementById("description");
  var article = document.getElementById("article");
  var submitBtn = document.getElementById("submitBtn");
  var cancelEdit = document.getElementById("cancelEdit");
  var dropZone = document.getElementById("dropZone");
  var fileInput = document.getElementById("fileInput");
  var dropHint = document.getElementById("dropHint");
  var thumbs = document.getElementById("thumbs");
  var adminList = document.getElementById("adminList");
  var adminEmpty = document.getElementById("adminEmpty");
  var adminCount = document.getElementById("adminCount");
  var btnClearTab = document.getElementById("btnClearTab");
  var btnExport = document.getElementById("btnExport");
  var importFile = document.getElementById("importFile");

  var tabModal = document.getElementById("tabModal");
  var tabModalTitle = document.getElementById("tabModalTitle");
  var tabModalClose = document.getElementById("tabModalClose");
  var tabNameInput = document.getElementById("tabNameInput");
  var tabModalSave = document.getElementById("tabModalSave");

  var activeTabId = "";
  var imagesData = [];
  var tabModalMode = "add";

  var CUSTOM_UNITS_KEY = "doors_custom_units_v1";
  var BASE_UNITS = [
    { value: "", label: "Без уточнения" },
    { value: "за ед.", label: "За единицу" },
    { value: "за шт.", label: "За штуку" },
    { value: "за час", label: "За час" },
    { value: "за м²", label: "За м²" },
    { value: "за комплект", label: "За комплект" },
    { value: "за услугу", label: "За услугу" }
  ];

  function loadCustomUnits() {
    try {
      var raw = localStorage.getItem(CUSTOM_UNITS_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(function (x) { return typeof x === "string" && x.trim(); }) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomUnits(list) {
    localStorage.setItem(CUSTOM_UNITS_KEY, JSON.stringify(list.slice(0, 30)));
  }

  function allUnits() {
    var list = BASE_UNITS.slice();
    loadCustomUnits().forEach(function (u) {
      if (!list.some(function (x) { return x.value === u; })) {
        list.push({ value: u, label: u });
      }
    });
    return list;
  }

  function labelForUnit(value) {
    var units = allUnits();
    for (var i = 0; i < units.length; i++) {
      if (units[i].value === value) return units[i].label;
    }
    return value || "Единица цены";
  }

  function closeUnitMenu() {
    unitPickerMenu.hidden = true;
    unitPickerBtn.setAttribute("aria-expanded", "false");
    unitPicker.classList.remove("is-open");
  }

  function openUnitMenu() {
    renderUnitList();
    unitPickerMenu.hidden = false;
    unitPickerBtn.setAttribute("aria-expanded", "true");
    unitPicker.classList.add("is-open");
  }

  function renderUnitList() {
    var units = allUnits();
    unitPickerList.innerHTML = units.map(function (u) {
      var active = selectedUnit === u.value ? " is-active" : "";
      return '<button type="button" class="unit-picker__option' + active + '" role="option" data-value="' +
        String(u.value).replace(/"/g, "&quot;") + '">' +
        '<span>' + escapeHtml(u.label) + '</span>' +
        (selectedUnit === u.value ? '<span class="unit-picker__check">✓</span>' : "") +
        "</button>";
    }).join("");
  }

  function setUnitUI(unit) {
    selectedUnit = unit || "";
    unitPickerValue.textContent = labelForUnit(selectedUnit);
    unitPickerValue.classList.toggle("is-placeholder", !selectedUnit);
    unitCustomField.hidden = true;
    priceUnitCustom.value = "";
    closeUnitMenu();
  }

  function getSelectedUnit() {
    return selectedUnit || "";
  }

  function fillCustomUnits() {
    /* options rendered on open */
  }

  unitPickerBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (unitPickerMenu.hidden) openUnitMenu();
    else closeUnitMenu();
  });

  unitPickerList.addEventListener("click", function (e) {
    var opt = e.target.closest(".unit-picker__option");
    if (!opt) return;
    selectedUnit = opt.getAttribute("data-value") || "";
    unitPickerValue.textContent = labelForUnit(selectedUnit);
    unitPickerValue.classList.toggle("is-placeholder", !selectedUnit);
    unitCustomField.hidden = true;
    closeUnitMenu();
  });

  btnCustomUnit.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeUnitMenu();
    unitCustomField.hidden = false;
    priceUnitCustom.value = "";
    priceUnitCustom.focus();
  });

  function commitCustomUnit() {
    var v = (priceUnitCustom.value || "").trim().slice(0, 30);
    if (!v) {
      unitCustomField.hidden = true;
      return;
    }
    var list = loadCustomUnits();
    if (list.indexOf(v) === -1) {
      list.push(v);
      saveCustomUnits(list);
    }
    selectedUnit = v;
    unitPickerValue.textContent = v;
    unitPickerValue.classList.remove("is-placeholder");
    unitCustomField.hidden = true;
    priceUnitCustom.value = "";
  }

  btnSaveCustomUnit.addEventListener("click", function (e) {
    e.preventDefault();
    commitCustomUnit();
  });
  priceUnitCustom.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitCustomUnit();
    }
  });

  document.addEventListener("click", function (e) {
    if (!unitPicker.contains(e.target) && !unitCustomField.contains(e.target)) {
      closeUnitMenu();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeUnitMenu();
  });


  function placeholder() {
    return "data:image/svg+xml," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="#e8e4de" width="100%" height="100%"/></svg>'
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderThumbs() {
    thumbs.innerHTML = "";
    dropHint.hidden = imagesData.length > 0;
    imagesData.forEach(function (src, i) {
      var el = document.createElement("div");
      el.className = "thumb";
      el.innerHTML =
        '<img src="' + src + '" alt="" />' +
        '<button type="button" class="thumb__del" data-i="' + i + '" aria-label="Удалить фото">×</button>';
      thumbs.appendChild(el);
    });
  }

  thumbs.addEventListener("click", function (e) {
    var btn = e.target.closest(".thumb__del");
    if (!btn) return;
    var i = Number(btn.getAttribute("data-i"));
    imagesData.splice(i, 1);
    renderThumbs();
  });

  function handleFiles(files) {
    if (!files || !files.length) return;
    var list = Array.prototype.slice.call(files, 0, 12 - imagesData.length);
    var chain = Promise.resolve();
    list.forEach(function (file) {
      chain = chain.then(function () {
        return fileToDataUrl(file).then(function (dataUrl) {
          if (imagesData.length < 12) imagesData.push(dataUrl);
        });
      });
    });
    chain.then(renderThumbs).catch(function (err) {
      alert(err.message || "Ошибка загрузки изображения");
      renderThumbs();
    });
  }

  dropZone.addEventListener("click", function (e) {
    if (e.target.closest(".thumb__del")) return;
    fileInput.click();
  });
  fileInput.addEventListener("change", function () {
    handleFiles(fileInput.files);
    fileInput.value = "";
  });
  ["dragenter", "dragover"].forEach(function (ev) {
    dropZone.addEventListener(ev, function (e) {
      e.preventDefault();
      dropZone.classList.add("is-over");
    });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    dropZone.addEventListener(ev, function (e) {
      e.preventDefault();
      dropZone.classList.remove("is-over");
    });
  });
  dropZone.addEventListener("drop", function (e) {
    handleFiles(e.dataTransfer.files);
  });

  function renderTabs() {
    var tabs = Shop.tabs();
    if (!tabs.length) {
      activeTabId = "";
      tabsEl.innerHTML = "";
      tabTools.hidden = true;
      return;
    }
    if (!activeTabId || !tabs.some(function (t) { return t.id === activeTabId; })) {
      activeTabId = tabs[0].id;
    }
    tabsEl.innerHTML = tabs.map(function (t) {
      return '<button type="button" class="tab ' + (t.id === activeTabId ? "is-active" : "") +
        '" data-id="' + t.id + '">' + escapeHtml(t.name) + "</button>";
    }).join("");
    tabTools.hidden = false;
  }

  tabsEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".tab");
    if (!btn) return;
    activeTabId = btn.getAttribute("data-id");
    resetForm();
    renderTabs();
    renderList();
  });

  function openTabModal(mode) {
    tabModalMode = mode;
    tabModalTitle.textContent = mode === "add" ? "Новая вкладка" : "Переименовать вкладку";
    if (mode === "rename") {
      var tab = null;
      var tabs = Shop.tabs();
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].id === activeTabId) { tab = tabs[i]; break; }
      }
      tabNameInput.value = tab ? tab.name : "";
    } else {
      tabNameInput.value = "";
    }
    tabModal.hidden = false;
    setTimeout(function () { tabNameInput.focus(); }, 50);
  }

  function closeTabModal() {
    tabModal.hidden = true;
  }

  btnAddTab.addEventListener("click", function () { openTabModal("add"); });
  btnRenameTab.addEventListener("click", function () { openTabModal("rename"); });
  tabModalClose.addEventListener("click", closeTabModal);
  tabModal.addEventListener("click", function (e) {
    if (e.target === tabModal) closeTabModal();
  });

  tabModalSave.addEventListener("click", function () {
    try {
      if (tabModalMode === "add") {
        var tab = Shop.addTab(tabNameInput.value);
        activeTabId = tab.id;
      } else {
        Shop.renameTab(activeTabId, tabNameInput.value);
      }
      closeTabModal();
      resetForm();
      renderTabs();
      renderList();
    } catch (err) {
      alert(err.message || String(err));
    }
  });

  tabNameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      tabModalSave.click();
    }
  });

  btnDeleteTab.addEventListener("click", function () {
    var tabs = Shop.tabs();
    var tab = null;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === activeTabId) { tab = tabs[i]; break; }
    }
    if (!tab) return;
    if (!confirm('Удалить вкладку «' + tab.name + '» и все позиции в ней?')) return;
    try {
      Shop.removeTab(activeTabId);
      activeTabId = "";
      resetForm();
      renderTabs();
      renderList();
    } catch (err) {
      alert(err.message || String(err));
    }
  });

  function resetForm() {
    form.reset();
    editId.value = "";
    imagesData = [];
    setUnitUI("");
    if (article) article.value = "";
    var ad = document.getElementById("articleDetails");
    if (ad) ad.open = false;
    renderThumbs();
    formTitle.textContent = "Новая позиция";
    submitBtn.textContent = "Добавить";
    cancelEdit.hidden = true;
    fileInput.value = "";
  }

  function startEdit(item) {
    editId.value = item.id;
    title.value = item.title;
    price.value = item.price ? formatMoney(item.price) : "";
    setUnitUI(item.priceUnit || "");
    description.value = item.description || "";
    if (article) article.value = item.article ? formatArticle(item.article) : "";
    imagesData = (item.images && item.images.length) ? item.images.slice() : (item.image ? [item.image] : []);
    renderThumbs();
    formTitle.textContent = "Редактирование";
    submitBtn.textContent = "Сохранить";
    cancelEdit.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  cancelEdit.addEventListener("click", resetForm);

  if (price) {
    price.addEventListener("blur", function () {
      if (!price.value.trim()) return;
      price.value = formatMoney(price.value);
    });
    price.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        price.value = formatMoney(price.value);
      }
    });
  }

  if (article) {
    article.addEventListener("blur", function () {
      if (!article.value.trim()) return;
      article.value = formatArticle(article.value);
    });
    article.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        article.value = formatArticle(article.value);
      }
    });
  }


  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!activeTabId) {
      alert("Сначала создайте вкладку");
      return;
    }
    var unit = getSelectedUnit();
    var payload = {
      title: title.value.trim(),
      price: price.value.trim(),
      priceUnit: unit,
      description: description.value.trim(),
      article: article ? article.value.trim() : "",
      images: imagesData.slice(),
      tabId: activeTabId
    };
    if (!payload.title) {
      alert("Укажите название");
      return;
    }
    if (editId.value) {
      Shop.updateItem(editId.value, payload);
    } else {
      Shop.addItem(payload);
    }
    resetForm();
    renderList();
  });

  function coverOf(it) {
    if (it.images && it.images[0]) return it.images[0];
    if (it.image) return it.image;
    return placeholder();
  }

  function renderList() {
    if (!activeTabId) {
      adminList.innerHTML = "";
      adminCount.textContent = "";
      adminEmpty.hidden = false;
      return;
    }
    var items = Shop.itemsByTab(activeTabId);
    adminList.innerHTML = "";
    adminCount.textContent = items.length ? "(" + items.length + ")" : "";
    adminEmpty.hidden = items.length > 0;

    items.forEach(function (it) {
      var n = (it.images && it.images.length) || (it.image ? 1 : 0);
      var row = document.createElement("div");
      row.className = "row";
      row.innerHTML =
        '<img src="' + coverOf(it) + '" alt="" />' +
        "<div><h3>" + escapeHtml(it.title) + "</h3>" +
        "<p>" + escapeHtml(it.article ? "арт. " + it.article + " · " : "") +
        escapeHtml(it.price ? (typeof formatMoney === "function" ? formatMoney(it.price) : it.price) + (it.priceUnit ? " " + it.priceUnit : "") + " · " : "") +
        escapeHtml(it.description || "Без описания") +
        (n > 1 ? " · " + n + " фото" : "") +
        "</p></div>" +
        '<div class="row__actions">' +
        '<button type="button" class="btn btn--ghost btn--small" data-act="edit">Изменить</button>' +
        '<button type="button" class="btn btn--danger btn--small" data-act="del">Удалить</button>' +
        "</div>";
      row.querySelector('[data-act="edit"]').addEventListener("click", function () { startEdit(it); });
      row.querySelector('[data-act="del"]').addEventListener("click", function () {
        if (confirm('Удалить «' + it.title + '»?')) {
          Shop.removeItem(it.id);
          if (editId.value === it.id) resetForm();
          renderList();
        }
      });
      adminList.appendChild(row);
    });
  }

  btnClearTab.addEventListener("click", function () {
    if (!activeTabId) return;
    if (confirm("Удалить все позиции в этом разделе?")) {
      Shop.clearTabItems(activeTabId);
      resetForm();
      renderList();
    }
  });

  btnExport.addEventListener("click", function () {
    var blob = new Blob([Shop.exportJson()], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "doors-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  importFile.addEventListener("change", function () {
    var file = importFile.files[0];
    if (!file) return;
    file.text().then(function (text) {
      Shop.importJson(text);
      activeTabId = "";
      resetForm();
      renderTabs();
      renderList();
      alert("Данные загружены");
    }).catch(function (err) {
      alert("Не удалось загрузить: " + (err.message || err));
    });
    importFile.value = "";
  });

  Shop.load();
  fillCustomUnits();
  renderTabs();
  renderList();
  renderThumbs();
})();
