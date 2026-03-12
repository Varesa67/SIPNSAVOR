
// cart.js — full drawer + checkout + receipt (improved order UX)
(function(){
  const CART_KEY = 'sns_cart_v1';
  const SNAP_KEY = CART_KEY + '_last';
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Elements
  const cartBtn = $('#cart-btn');
  const cartDrawer = $('#cart-container');
  const cartClose = $('#cart-close');
  const cartContent = $('#cart-content');
  const totalPriceEl = $('.total-price');
  const countBadge = $('[data-cart-count]');
  const orderBtn = $('#cart-order-btn');

  const productModal = $('#product-detail-modal');
  const detailImg = $('#detail-img');
  const detailTitle = $('#detail-title');
  const detailDesc = $('#detail-desc');
  const popupPrice = $('#popup-price');
  const flavorSection = $('#flavor-section');
  const flavorSelect = $('#flavor-select');
  const popupAddCart = $('#popup-add-cart');
  const popupOrder = $('#popup-order');
  const detailClose = $('#detail-close');

  const paymentModal = $('#payment-modal');
  const loader = $('#loader');
  const paymentMsg = $('#payment-msg');
  const confirmPayment = $('#confirm-payment');
  const closePayment = $('#close-payment');
  const nameInput = $('#cust-name');
  const phoneInput = $('#cust-phone');
  const addressInput = $('#cust-address');
  const methodInput = $('#paymethod');
  const accountInput = $('#cust-account');

  const fulfillBtns = $$('.toggle-btn');
  const addrWrap = $('[data-field="address"]');
  const rowDelivery = $('#row-delivery');
  const sumItems = $('#summary-items');
  const sumSubtotal = $('#sum-subtotal');
  const sumDelivery = $('#sum-delivery');
  const sumTotal = $('#sum-total');

  const receiptModal = $('#receipt-modal');
  const receiptContent = $('#receipt-content');
  const closeReceipt = $('#close-receipt');

  // Data
  const FLAVORS = {
    'Croffles': [
      {name:'Chocolate', price:95}, {name:'Vanilla & Milk', price:95}, {name:'Matcha', price:100},
      {name:'Java Chip', price:105}, {name:'Mocha', price:95}, {name:'Cookies & Cream', price:105},
      {name:'Blueberry', price:95}, {name:'Red Velvet', price:95}, {name:'Butterscotch', price:95}, {name:'Biscoff', price:140}
    ],
    'Frappe': [
      {name:'Chocolate Frappe', price:95}, {name:'Vanilla & Milk Frappe', price:95}, {name:'Matcha Frappe', price:100},
      {name:'Java Chip Frappe', price:105}, {name:'Mocha Frappe', price:95}, {name:'Cookies & Cream Frappe', price:105},
      {name:'Blueberry Frappe', price:95}, {name:'Red Velvet Frappe', price:95}, {name:'Butterscotch Frappe', price:95}, {name:'Biscoff Frappe', price:140}
    ]
  };

  // Storage helpers
  const getCart = ()=>{ try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } };
  const saveCart = (items)=> localStorage.setItem(CART_KEY, JSON.stringify(items));
  const snapshotCart = (items)=> localStorage.setItem(SNAP_KEY, JSON.stringify(items));

  // State
  let cart = getCart();
  let fulfillment = 'delivery'; // 'delivery' | 'pickup'

  const peso = n => '₱' + (n||0).toString();

  // UI helpers
  function updateBadge(){ if(countBadge) countBadge.textContent = cart.length; }

  function renderCart(){
    cartContent.innerHTML = '';
    let total = 0;
    cart.forEach((item, i)=>{
      total += (item.price||0) * (item.qty||1);
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${item.img||''}" alt="${item.title||'Item'}"/>
        <div class="meta">
          <div class="title">${item.title}</div>
          ${item.variant?`<div class="note">${item.variant}</div>`:''}
          <div class="note">${peso(item.price)}</div>
        </div>
        <div class="actions">
          <div class="qty">
            <button aria-label="Decrease" data-dec="${i}">-</button>
            <span>${item.qty||1}</span>
            <button aria-label="Increase" data-inc="${i}">+</button>
          </div>
          <button class="remove-btn" aria-label="Remove" data-rem="${i}">Remove</button>
        </div>`;
      cartContent.appendChild(row);
    });
    totalPriceEl.textContent = peso(total);
    updateBadge();
    saveCart(cart);
  }

  function openDrawer(){ cartDrawer.classList.add('active'); cartDrawer.setAttribute('aria-hidden','false'); }
  function closeDrawer(){ cartDrawer.classList.remove('active'); cartDrawer.setAttribute('aria-hidden','true'); }

  // Drawer events
  if(cartBtn) cartBtn.addEventListener('click', openDrawer);
  if(cartClose) cartClose.addEventListener('click', closeDrawer);

  cartContent.addEventListener('click', (e)=>{
    const t = e.target;
    if(t.dataset.inc){ const i = +t.dataset.inc; cart[i].qty=(cart[i].qty||1)+1; renderCart(); }
    if(t.dataset.dec){ const i = +t.dataset.dec; cart[i].qty=Math.max(1,(cart[i].qty||1)-1); renderCart(); }
    if(t.dataset.rem){ const i = +t.dataset.rem; cart.splice(i,1); renderCart(); }
  });

  // Product open (cards on index + menu)
  $$('.card, .menu-item').forEach(card=>{
    card.addEventListener('click', (e)=>{
      if(e.target && e.target.closest('.btn')) return;
      const title = card.dataset.title || card.querySelector('h3')?.textContent?.trim() || 'Item';
      const desc = card.dataset.desc || '';
      const img = card.dataset.img || card.querySelector('img')?.getAttribute('src') || '';
      const price = parseInt(card.dataset.price||'0',10) || 0;
      const flavors = card.dataset.flavors || null;
      showProductDetail({title, desc, img, price, flavors});
    });
  });

  // Quick add from grid (menu page)
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.menu-item .btn');
    if(!btn) return;
    const card = btn.closest('.menu-item');
    const title = card.dataset.title;
    const price = parseInt(card.dataset.price||'0',10) || 0;
    const img = card.dataset.img || card.querySelector('img')?.getAttribute('src') || '';
    cart.push({title, price, img, qty:1});
    renderCart();
    openDrawer();
  });

  function showProductDetail({title, desc, img, price, flavors}){
    detailImg.src = img||'';
    detailTitle.textContent = title;
    detailDesc.textContent = desc;

    const flavorKey = title in FLAVORS ? title : (flavors==='frappe' ? 'Frappe' : flavors==='croffles' ? 'Croffles' : null);
    if(flavorKey && FLAVORS[flavorKey]){
      flavorSection.hidden = false;
      flavorSelect.innerHTML = '';
      FLAVORS[flavorKey].forEach(f=>{
        const opt = document.createElement('option');
        opt.value = f.price;
        opt.textContent = `${f.name} — ${peso(f.price)}`;
        flavorSelect.appendChild(opt);
      });
      popupPrice.textContent = peso(FLAVORS[flavorKey][0].price);
    } else {
      flavorSection.hidden = true;
      popupPrice.textContent = peso(price);
    }
    productModal.hidden = false;
  }
  const closeProductDetail = ()=>{ productModal.hidden = true; };
  detailClose.addEventListener('click', closeProductDetail);

  flavorSelect.addEventListener('change', ()=>{ popupPrice.textContent = peso(parseInt(flavorSelect.value,10)||0); });

  popupAddCart.addEventListener('click', ()=>{
    const base = parseInt((popupPrice.textContent||'0').replace(/[^0-9]/g,''),10) || 0;
    const img = detailImg.getAttribute('src')||'';
    const title = detailTitle.textContent;
    const variant = flavorSection.hidden ? '' : flavorSelect.options[flavorSelect.selectedIndex].text.split(' — ')[0];
    cart.push({ title, price: base, img, qty:1, variant });
    renderCart();
    closeProductDetail();
    openDrawer();
  });

  popupOrder.addEventListener('click', ()=>{ closeProductDetail(); startCheckout(); });

  if(orderBtn) orderBtn.addEventListener('click', ()=>{ if(cart.length===0){ alert('Cart is empty'); return; } startCheckout(); });

  function startCheckout(){
    snapshotCart(cart);
    buildSummary();
    updateTotals();
    validateForm();
    paymentModal.hidden = false;
    loader.hidden = true; paymentMsg.hidden = true;
  }

  // Build summary list from current cart
  function buildSummary(){
    sumItems.innerHTML = '';
    cart.forEach(it=>{
      const row = document.createElement('div');
      row.className = 'summary-item';
      row.innerHTML = `
        <img src="${it.img||''}" alt="${it.title}" />
        <div class="meta">
          <div class="t">${it.title}</div>
          ${it.variant?`<div class="v">${it.variant}</div>`:''}
        </div>
        <div class="amt">${peso((it.price||0)*(it.qty||1))}</div>`;
      sumItems.appendChild(row);
    });
  }

  function calcSubtotal(){ return cart.reduce((n,it)=> n + (it.price||0)*(it.qty||1), 0); }
  function calcDelivery(subtotal){
    if(fulfillment==='pickup') return 0;
    // Flat fee ₱40, but free delivery for subtotal >= ₱500
    return subtotal >= 500 ? 0 : 40;
  }
  function updateTotals(){
    const sub = calcSubtotal();
    const del = calcDelivery(sub);
    sumSubtotal.textContent = peso(sub);
    sumDelivery.textContent = peso(del);
    sumTotal.textContent = peso(sub + del);
    rowDelivery.style.display = (fulfillment==='delivery') ? 'flex' : 'none';
  }

  // Fulfillment toggle
  fulfillBtns.forEach(btn=> btn.addEventListener('click', ()=>{
    fulfillBtns.forEach(b=> b.classList.remove('active'));
    btn.classList.add('active');
    fulfillment = btn.dataset.fulfill;
    // Address required only for delivery
    addrWrap.style.display = fulfillment==='delivery' ? 'block' : 'none';
    updateTotals();
    validateForm();
  }));

  // Form validation enabling Confirm button
  [nameInput, phoneInput, addressInput, methodInput, accountInput].forEach(el=> el && el.addEventListener('input', validateForm));
  function validateForm(){
    const hasName = nameInput.value.trim().length>1;
    const hasPhone = phoneInput.value.trim().length>=7;
    const hasAddr = fulfillment==='pickup' ? true : addressInput.value.trim().length>4;
    const hasMethod = methodInput.value !== '';
    const hasAcct = accountInput.value.trim().length>3;
    const ok = hasName && hasPhone && hasAddr && hasMethod && hasAcct && cart.length>0;
    confirmPayment.disabled = !ok;
  }

  closePayment.addEventListener('click', ()=>{ paymentModal.hidden = true; loader.hidden = true; });

  confirmPayment.addEventListener('click', ()=>{
    if(confirmPayment.disabled) return;
    loader.hidden = false;
    setTimeout(()=>{
      loader.hidden = true;
      paymentModal.hidden = true;
      generateReceipt();
      cart = [];
      renderCart();
      nameInput.value = phoneInput.value = addressInput.value = accountInput.value = '';
      methodInput.value='';
    }, 1400);
  });

  function generateReceipt(){
    const items = JSON.parse(localStorage.getItem(SNAP_KEY)||'[]');
    let sub = 0; let itemsHTML='';
    items.forEach(it=>{ const line=(it.price||0)*(it.qty||1); sub += line; itemsHTML += `<div>${it.title}${it.variant?` (${it.variant})`:''} — ${peso(it.price)} × ${it.qty||1} = ${peso(line)}</div>`; });
    const del = fulfillment==='pickup' ? 0 : (sub>=500?0:40);
    const orderNumber = Math.floor(Math.random()*90000)+10000;
    receiptContent.innerHTML = `
      <b>Order Number:</b> #${orderNumber}<br/><br/>
      <b>Fulfillment:</b> ${fulfillment==='pickup'?'Pickup':'Delivery'}<br/>
      <b>Name:</b> ${nameInput.value}<br/>
      <b>Phone:</b> ${phoneInput.value}<br/>
      ${fulfillment==='delivery'?`<b>Address:</b> ${addressInput.value}<br/>`:''}
      <b>Payment:</b> ${methodInput.value}<br/><br/>
      <b>Items:</b><br/>${itemsHTML}<br/>
      <b>Subtotal:</b> ${peso(sub)}<br/>
      ${fulfillment==='delivery'?`<b>Delivery Fee:</b> ${peso(del)}<br/>`:''}
      <b>Total:</b> ${peso(sub+del)}
    `;
    receiptModal.hidden = false;
  }

  closeReceipt.addEventListener('click', ()=>{ receiptModal.hidden = true; });

  // Init
  renderCart();
})();
