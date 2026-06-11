/* Aligned Goods — Buy button handler.
 *
 * Loaded on /aligned/ and every /aligned/<shelf>/ page. Any element with
 * [data-buy-good="<entry-id>"] becomes a checkout trigger: it POSTs to
 * /api/checkout-session with { kind: 'good' }, then redirects the browser to
 * the Stripe Checkout URL the server returns.
 *
 * The PRICE is never sent from here — the server looks it up from
 * aligned-goods.json (entry.sell.price), so the button can't be tampered into
 * a cheaper charge. This file only carries the good's id + quantity.
 */
(function () {
  var css = [
    '.gcard-buy{display:inline-flex;align-items:center;gap:6px;margin-top:0.7rem;font-family:"Jost",system-ui,sans-serif;font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;font-weight:500;color:#0B1C3D;background:#C4973A;border:1px solid #C4973A;border-radius:2px;padding:9px 18px;cursor:pointer;transition:background .2s,transform .2s;line-height:1;align-self:flex-start}',
    '.gcard-buy:hover{background:#E0C06A;border-color:#E0C06A;transform:translateY(-1px)}',
    '.gcard-buy[data-busy]{opacity:.6;cursor:default;transform:none}',
    '.gcard-buy .price{font-weight:600;letter-spacing:0.06em}',
    '.gcard-buy-note{display:block;margin-top:5px;font-size:0.56rem;letter-spacing:0.12em;text-transform:uppercase;color:#7090B8;opacity:0.8}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  document.addEventListener('click', function (ev) {
    var btn = ev.target && ev.target.closest && ev.target.closest('[data-buy-good]');
    if (!btn) return;
    ev.preventDefault();
    if (btn.dataset.busy) return;

    var goodId = btn.getAttribute('data-buy-good');
    var qty = parseInt(btn.getAttribute('data-qty') || '1', 10) || 1;
    var original = btn.innerHTML;
    btn.dataset.busy = '1';
    btn.textContent = 'Opening checkout…';

    fetch('/api/checkout-session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'good', good_id: goodId, quantity: qty })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (d) {
        if (d && d.url) { window.location.href = d.url; return; }
        throw new Error(d && d.error ? d.error : 'Checkout is unavailable right now.');
      })
      .catch(function (e) {
        btn.innerHTML = original;
        delete btn.dataset.busy;
        alert('Sorry — ' + (e.message || 'checkout is unavailable right now.'));
      });
  });
})();
