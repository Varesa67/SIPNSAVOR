// cart.js — full drawer + checkout + receipt + form verification
(function(){

const CART_KEY = 'sns_cart_v1';
const SNAP_KEY = CART_KEY + '_last';

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* -------------------------
ELEMENTS
-------------------------*/

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
const confirmPayment = $('#confirm-payment');
const closePayment = $('#close-payment');

const nameInput = $('#cust-name');
const emailInput = $('#cust-email');
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

/* -------------------------
DATA
-------------------------*/

const FLAVORS = {

Croffles: [
{name:'Chocolate',price:95},
{name:'Vanilla & Milk',price:95},
{name:'Matcha',price:100},
{name:'Java Chip',price:105},
{name:'Mocha',price:95},
{name:'Cookies & Cream',price:105},
{name:'Blueberry',price:95},
{name:'Red Velvet',price:95},
{name:'Butterscotch',price:95},
{name:'Biscoff',price:140}
],

Frappe: [
{name:'Chocolate Frappe',price:95},
{name:'Vanilla & Milk Frappe',price:95},
{name:'Matcha Frappe',price:100},
{name:'Java Chip Frappe',price:105},
{name:'Mocha Frappe',price:95},
{name:'Cookies & Cream Frappe',price:105},
{name:'Blueberry Frappe',price:95},
{name:'Red Velvet Frappe',price:95},
{name:'Butterscotch Frappe',price:95},
{name:'Biscoff Frappe',price:140}
]

};

/* -------------------------
STORAGE
-------------------------*/

const getCart = () => {
try{
return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}catch{
return [];
}
};

const saveCart = items =>
localStorage.setItem(CART_KEY, JSON.stringify(items));

const snapshotCart = items =>
localStorage.setItem(SNAP_KEY, JSON.stringify(items));

/* -------------------------
STATE
-------------------------*/

let cart = getCart();
let fulfillment = 'delivery';

const peso = n => '₱' + (n || 0);

/* -------------------------
VALIDATION
-------------------------*/

function validName(name){
return /^[A-Za-z\s]{2,}$/.test(name.trim());
}

function validEmail(email){
return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validPhone(phone){
return /^(09\d{9}|\+639\d{9})$/.test(phone.trim());
}

function validAccount(acc){
return /^[0-9]{8,13}$/.test(acc.trim());
}

function showError(input){
input.style.borderColor = 'red';
}

function clearError(input){
input.style.borderColor = '';
}

/* -------------------------
CART RENDER
-------------------------*/

function updateBadge(){
if(countBadge) countBadge.textContent = cart.length;
}

function renderCart(){

cartContent.innerHTML = '';
let total = 0;

cart.forEach((item,i)=>{

total += (item.price||0)*(item.qty||1);

const row = document.createElement('div');
row.className = 'cart-item';

row.innerHTML = `
<img src="${item.img||''}">
<div class="meta">
<div class="title">${item.title}</div>
${item.variant?`<div class="note">${item.variant}</div>`:''}
<div class="note">${peso(item.price)}</div>
</div>

<div class="actions">

<div class="qty">
<button data-dec="${i}">-</button>
<span>${item.qty||1}</span>
<button data-inc="${i}">+</button>
</div>

<button class="remove-btn" data-rem="${i}">
Remove
</button>

</div>
`;

cartContent.appendChild(row);

});

totalPriceEl.textContent = peso(total);

updateBadge();

saveCart(cart);

}

/* -------------------------
DRAWER
-------------------------*/

function openDrawer(){
cartDrawer.classList.add('active');
}

function closeDrawer(){
cartDrawer.classList.remove('active');
}

if(cartBtn) cartBtn.onclick = openDrawer;
if(cartClose) cartClose.onclick = closeDrawer;

cartContent.addEventListener('click', e => {

const t = e.target;

if(t.dataset.inc){
const i = +t.dataset.inc;
cart[i].qty++;
renderCart();
}

if(t.dataset.dec){
const i = +t.dataset.dec;
cart[i].qty = Math.max(1,cart[i].qty-1);
renderCart();
}

if(t.dataset.rem){
const i = +t.dataset.rem;
cart.splice(i,1);
renderCart();
}

});

/* -------------------------
PRODUCT DETAIL
-------------------------*/

$$('.card,.menu-item').forEach(card=>{

card.onclick = e => {

if(e.target.closest('.btn')) return;

const title = card.dataset.title || 'Item';
const desc = card.dataset.desc || '';
const img = card.dataset.img || '';
const price = parseInt(card.dataset.price||0);

showProductDetail({title,desc,img,price});

};

});

function showProductDetail({title,desc,img,price}){

detailImg.src = img;
detailTitle.textContent = title;
detailDesc.textContent = desc;

if(FLAVORS[title]){

flavorSection.hidden = false;

flavorSelect.innerHTML = '';

FLAVORS[title].forEach(f=>{

const opt = document.createElement('option');
opt.value = f.price;
opt.textContent = `${f.name} — ${peso(f.price)}`;

flavorSelect.appendChild(opt);

});

popupPrice.textContent = peso(FLAVORS[title][0].price);

}else{

flavorSection.hidden = true;
popupPrice.textContent = peso(price);

}

productModal.hidden = false;

}

detailClose.onclick = () => productModal.hidden = true;

flavorSelect.onchange = () => {

popupPrice.textContent =
peso(parseInt(flavorSelect.value));

};

popupAddCart.onclick = ()=>{

const price =
parseInt(popupPrice.textContent.replace(/\D/g,'')) || 0;

cart.push({

title:detailTitle.textContent,
price,
img:detailImg.src,
qty:1,
variant:flavorSection.hidden
? ''
: flavorSelect.options[flavorSelect.selectedIndex].text

});

renderCart();

productModal.hidden = true;

openDrawer();

};

/* -------------------------
CHECKOUT
-------------------------*/

if(orderBtn)
orderBtn.onclick = ()=>{

if(cart.length===0){
alert('Cart is empty');
return;
}

startCheckout();

};

function startCheckout(){

snapshotCart(cart);

buildSummary();

updateTotals();

validateForm();

paymentModal.hidden = false;

}

/* -------------------------
SUMMARY
-------------------------*/

function buildSummary(){

sumItems.innerHTML = '';

cart.forEach(it=>{

const row = document.createElement('div');

row.className='summary-item';

row.innerHTML=`

<img src="${it.img}">

<div class="meta">
<div>${it.title}</div>
${it.variant?`<div>${it.variant}</div>`:''}
</div>

<div>${peso(it.price*it.qty)}</div>

`;

sumItems.appendChild(row);

});

}

/* -------------------------
TOTALS
-------------------------*/

function calcSubtotal(){
return cart.reduce((n,i)=>n+i.price*i.qty,0);
}

function calcDelivery(sub){
if(fulfillment==='pickup') return 0;
return sub>=500 ? 0 : 40;
}

function updateTotals(){

const sub = calcSubtotal();

const del = calcDelivery(sub);

sumSubtotal.textContent = peso(sub);
sumDelivery.textContent = peso(del);
sumTotal.textContent = peso(sub+del);

rowDelivery.style.display =
fulfillment==='delivery'
? 'flex'
: 'none';

}

/* -------------------------
FULFILLMENT
-------------------------*/

fulfillBtns.forEach(btn=>{

btn.onclick = ()=>{

fulfillBtns.forEach(b=>b.classList.remove('active'));

btn.classList.add('active');

fulfillment = btn.dataset.fulfill;

addrWrap.style.display =
fulfillment==='delivery'
? 'block'
: 'none';

updateTotals();

validateForm();

};

});

/* -------------------------
FORM VALIDATION
-------------------------*/

[nameInput,emailInput,phoneInput,addressInput,methodInput,accountInput]

.forEach(el=>{

if(el)
el.addEventListener('input',validateForm);

});

function validateForm(){

const n = validName(nameInput.value);
const e = validEmail(emailInput.value);
const p = validPhone(phoneInput.value);
const a = fulfillment==='pickup'
? true
: addressInput.value.trim().length>4;
const m = methodInput.value !== '';
const ac = validAccount(accountInput.value);

n ? clearError(nameInput) : showError(nameInput);
e ? clearError(emailInput) : showError(emailInput);
p ? clearError(phoneInput) : showError(phoneInput);
ac ? clearError(accountInput) : showError(accountInput);

const ok = n && e && p && a && m && ac && cart.length>0;

confirmPayment.disabled = !ok;

}

/* -------------------------
PAYMENT
-------------------------*/

closePayment.onclick = ()=> paymentModal.hidden = true;

confirmPayment.onclick = ()=>{

if(confirmPayment.disabled) return;

loader.hidden = false;

setTimeout(()=>{

loader.hidden = true;

paymentModal.hidden = true;

generateReceipt();

cart = [];

renderCart();

},1400);

};

/* -------------------------
RECEIPT
-------------------------*/

function generateReceipt(){

const items =
JSON.parse(localStorage.getItem(SNAP_KEY)||'[]');

let sub=0;

let html='';

items.forEach(it=>{

const line = it.price*it.qty;

sub+=line;

html += `
<div>
${it.title}
${it.variant?`(${it.variant})`:''}
— ${peso(it.price)} × ${it.qty}
= ${peso(line)}
</div>
`;

});

const del = calcDelivery(sub);

const orderNum =
Math.floor(Math.random()*90000)+10000;

receiptContent.innerHTML = `

<b>Order #${orderNum}</b><br><br>

<b>Name:</b> ${nameInput.value}<br>
<b>Email:</b> ${emailInput.value}<br>
<b>Phone:</b> ${phoneInput.value}<br>

${fulfillment==='delivery'
? `<b>Address:</b> ${addressInput.value}<br>`
: ''}

<br>

<b>Items:</b><br>

${html}

<br>

<b>Subtotal:</b> ${peso(sub)}<br>

${fulfillment==='delivery'
? `<b>Delivery:</b> ${peso(del)}<br>`
: ''}

<b>Total:</b> ${peso(sub+del)}

`;

receiptModal.hidden = false;

}

closeReceipt.onclick = () =>
receiptModal.hidden = true;

/* -------------------------
INIT
-------------------------*/

renderCart();

})(); 
