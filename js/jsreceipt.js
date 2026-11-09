/* Чек заказа: генерация, скачивание, предпросмотр */
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parsePrice(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    var cleaned = String(str)
      .replace(/\s+/g, '')
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    var n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  function formatMoney(n) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function nowString() {
    var d = new Date();
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() +
           ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function orderNumber() {
    var d = new Date();
    return 'ORD-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
           '-' + Math.floor(Math.random() * 9000 + 1000);
  }

  var cartTotalEl = document.getElementById('cartTotal');
  var checkoutBtn = document.getElementById('cartCheckout');
  var modal       = document.getElementById('checkoutModal');
  var modalClose  = document.getElementById('checkoutClose');
  var orderForm   = document.getElementById('checkoutForm');
  var previewBtn  = document.getElementById('receiptPreviewBtn');
  var downloadBtn = document.getElementById('receiptDownloadBtn');

  function updateTotal() {
    if (!cartTotalEl || !window.Cart) return;
    var items = window.Cart.load();
    var sum = items.reduce(function (s, it) {
      return s + parsePrice(it.price) * (Number(it.qty) || 1);
    }, 0);
    cartTotalEl.textContent = 'Итого: ' + formatMoney(sum);
    if (checkoutBtn) checkoutBtn.disabled = items.length === 0;
  }

  if (window.Cart && typeof window.Cart.onChange === 'function') {
    window.Cart.onChange(updateTotal);
  }
  updateTotal();

  function openModal() {
    if (!window.Cart || window.Cart.load().length === 0) {
      alert('Корзина пуста');
      return;
    }
    var cartClose = document.getElementById('cartClose');
    if (cartClose) cartClose.click();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  if (checkoutBtn) checkoutBtn.addEventListener('click', openModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });

  function buildReceiptHTML() {
    var items = window.Cart.load();
    if (!items.length) return null;

    var customerName = orderForm ? orderForm.elements['customerName'].value.trim() : '';
    var customerPhone = orderForm ? orderForm.elements['customerPhone'].value.trim() : '';
    var comment = orderForm ? orderForm.elements['customerComment'].value.trim() : '';

    var total = 0;
    var rows = items.map(function (item, idx) {
      var unit = parsePrice(item.price);
      var qty = Number(item.qty) || 1;
      var lineSum = unit * qty;
      total += lineSum;

      var name = escapeHtml(item.title);
      if (item.tabName) {
        name += '<br><small style="color:#888">' + escapeHtml(item.tabName) + '</small>';
      }
      var art = item.article ? escapeHtml(item.article) : '—';

      return '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td>' + art + '</td>' +
        '<td>' + name + '</td>' +
        '<td class="num">' + qty + ' ' + escapeHtml(item.priceUnit || 'шт.') + '</td>' +
        '<td class="num">' + formatMoney(unit) + '</td>' +
        '<td class="num">' + formatMoney(lineSum) + '</td>' +
      '</tr>';
    }).join('');

    var orderNum = orderNumber();
    var dateStr = nowString();

    var custBlock = '';
    if (customerName) custBlock += '<div><b>Покупатель:</b> ' + escapeHtml(customerName) + '</div>';
    if (customerPhone) custBlock += '<div><b>Телефон:</b> ' + escapeHtml(customerPhone) + '</div>';
    if (comment) custBlock += '<div><b>Комментарий:</b> ' + escapeHtml(comment) + '</div>';

    return '<!DOCTYPE html>\n<html lang="ru"><head><meta charset="UTF-8">' +
      '<title>Чек ' + escapeHtml(orderNum) + '</title>' +
      '<style>' +
      '*{box-sizing:border-box}' +
      'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;' +
        'max-width:820px;margin:40px auto;padding:24px;color:#222;line-height:1.5}' +
      'h1{font-size:22px;margin:0 0 6px;letter-spacing:1px}' +
      '.sub{color:#777;font-size:13px;margin-bottom:20px}' +
      '.meta{display:flex;flex-wrap:wrap;gap:20px;margin:16px 0;font-size:14px}' +
      '.meta > div{flex:1 1 200px}' +
      '.customer{background:#f7f7f7;padding:12px 16px;border-radius:8px;margin:16px 0;font-size:14px}' +
      'table{width:100%;border-collapse:collapse;margin:20px 0;font-size:14px}' +
      'th,td{border:1px solid #ddd;padding:10px 12px;text-align:left;vertical-align:top}' +
      'th{background:#f5f5f5;font-weight:600}' +
      'td.num{text-align:right;white-space:nowrap}' +
      '.total{text-align:right;font-size:20px;font-weight:700;padding:12px 0;' +
        'border-top:2px solid #222;margin-top:8px}' +
      '.footer{margin-top:36px;padding-top:16px;border-top:1px solid #ddd;' +
        'font-size:12px;color:#777}' +
      '.actions{margin-top:24px;text-align:center}' +
      '.actions button{background:#1a1a1a;color:#fff;border:0;padding:12px 28px;' +
        'border-radius:8px;font-size:15px;cursor:pointer}' +
      '.actions button:hover{opacity:.85}' +
      '@media print{body{margin:0;padding:16px}.actions{display:none}}' +
      '</style></head><body>' +
      '<h1>ДВЕРИ — Чек заказа</h1>' +
      '<div class="sub">Благодарим за обращение</div>' +
      '<div class="meta">' +
        '<div><b>Номер заказа:</b><br>' + escapeHtml(orderNum) + '</div>' +
        '<div><b>Дата:</b><br>' + escapeHtml(dateStr) + '</div>' +
      '</div>' +
      (custBlock ? '<div class="customer">' + custBlock + '</div>' : '') +
      '<table><thead><tr>' +
        '<th>№</th><th>Артикул</th><th>Наименование</th>' +
        '<th>Кол-во</th><th>Цена</th><th>Сумма</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="total">Итого: ' + formatMoney(total) + '</div>' +
      '<div class="footer">Этот документ не является фискальным чеком. ' +
        'Он сформирован для предварительного согласования заказа. ' +
        'Для оформления свяжитесь с менеджером.</div>' +
      '<div class="actions">' +
        '<button onclick="window.print()">Распечатать / Сохранить в PDF</button>' +
      '</div>' +
      '</body></html>';
  }

  function downloadHTML(html, filename) {
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      var html = buildReceiptHTML();
      if (!html) { alert('Корзина пуста'); return; }
      var d = new Date();
      var fn = 'чек-ДВЕРИ-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.html';
      downloadHTML(html, fn);
    });
  }

  if (previewBtn) {
    previewBtn.addEventListener('click', function () {
      var html = buildReceiptHTML();
      if (!html) { alert('Корзина пуста'); return; }
      var w = window.open('', '_blank');
      if (!w) { alert('Разрешите всплывающие окна, чтобы увидеть предпросмотр'); return; }
      w.document.open();
      w.document.write(html);
      w.document.close();
    });
  }
})();