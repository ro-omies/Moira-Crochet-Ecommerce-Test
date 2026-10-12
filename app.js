const $ = (s) => document.querySelector(s);
const money = (n) => '$' + n.toFixed(2);
const page = document.body.dataset.page;
let cart = JSON.parse(localStorage.getItem('moira-cart') || '[]');

/* ===== Estructura común: cabecera, pie, carrito, checkout ===== */
function buildLayout() {
  const links = [
    ['inicio', 'index.html', 'Inicio'],
    ['tienda', 'tienda.html', 'Tienda'],
    ['contacto', 'contacto.html', 'Contacto']
  ];
  const nav = links.map(([id, href, label]) =>
    `<a href="${href}" class="${page === id || (page === 'producto' && id === 'tienda') ? 'on' : ''}">${label}</a>`).join('');

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="top" id="top">
      <button class="menu-btn" id="menuBtn" aria-label="Abrir menú" aria-expanded="false" aria-controls="mainNav">
        <span></span><span></span><span></span>
      </button>
      <a class="logo" href="index.html">Moira<span>Crochet</span></a>
      <nav class="nav" id="mainNav" aria-label="Principal">${nav}</nav>
      <button class="cart-btn" id="openCart" aria-label="Abrir carrito">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z"/>
          <path d="M9 8V7a3 3 0 0 1 6 0v1"/>
        </svg>
        <span class="badge" id="cartCount" hidden>0</span>
      </button>
    </header>`);

  document.body.insertAdjacentHTML('beforeend', `
    <footer class="foot">
      <div class="foot-in">
        <div class="foot-brand">
          <a class="logo" href="index.html">Moira<span>Crochet</span></a>
          <p>Piezas tejidas y moldeadas a mano, por encargo.</p>
        </div>
        <nav class="foot-links" aria-label="Pie de página">
          ${links.map(([, href, label]) => `<a href="${href}">${label}</a>`).join('')}
        </nav>
        <div class="foot-cats">
          ${['Amigurumis', 'Llaveros', 'Colgantes', 'Porcelana fría'].map((c) => `<a href="tienda.html?cat=${encodeURIComponent(c)}">${c}</a>`).join('')}
        </div>
      </div>
      <p class="foot-note">Proyecto de muestra, no es una tienda real</p>
    </footer>

    <aside class="drawer" id="drawer" aria-label="Carrito" hidden>
      <div class="d-head"><h2>Tu carrito</h2><button class="close" data-close aria-label="Cerrar">×</button></div>
      <div id="cartItems" class="d-body"></div>
      <div class="d-foot">
        <div class="total"><span>Total</span><b id="cartTotal">$0.00</b></div>
        <button class="btn" id="checkoutBtn">Finalizar compra</button>
      </div>
    </aside>

    <div class="overlay" id="checkout" hidden>
      <div class="modal">
        <button class="close" data-close aria-label="Cerrar">×</button>
        <form id="form" novalidate>
          <h2>Datos de entrega</h2>
          <label class="field">Nombre completo<input name="nombre"></label>
          <label class="field">Correo<input name="correo" type="email"></label>
          <label class="field">Dirección<input name="direccion"></label>
          <label class="field">Método de pago
            <select name="pago"><option>Efectivo al recibir</option><option>Transferencia</option></select>
          </label>
          <p class="error" id="formError" role="alert"></p>
          <button class="btn" type="submit">Confirmar pedido</button>
        </form>
        <div id="done" hidden>
          <h2>¡Pedido recibido!</h2>
          <p id="doneMsg"></p>
          <button class="btn" data-close>Seguir comprando</button>
        </div>
      </div>
    </div>

    <div class="toast" id="toast" role="status"></div>`);
}

/* ===== Productos ===== */
const thumb = (p) => p.img
  ? `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">`
  : p.emoji;

const card = (p) => `
  <article class="card">
    <a class="art" href="producto.html?id=${p.id}" style="background:${p.color}" aria-label="Ver ${p.name}">${thumb(p)}</a>
    <div class="card-b">
      <small>${p.cat}</small>
      <h3><a class="name" href="producto.html?id=${p.id}">${p.name}</a></h3>
      <div class="row">
        <span class="price">${money(p.price)}</span>
        <button class="add" data-add="${p.id}">Añadir</button>
      </div>
    </div>
  </article>`;

/* ===== Carrito ===== */
function save() {
  localStorage.setItem('moira-cart', JSON.stringify(cart));
  renderCart();
}

function addToCart(id, n = 1) {
  const it = cart.find((i) => i.id === id);
  it ? (it.qty += n) : cart.push({ id, qty: n });
  save();
  toast('Añadido al carrito');
}

function changeQty(id, d) {
  const it = cart.find((i) => i.id === id);
  it.qty += d;
  if (it.qty <= 0) cart = cart.filter((i) => i.id !== id);
  save();
}

function renderCart() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.qty * PRODUCTS.find((p) => p.id === i.id).price, 0);
  $('#cartCount').textContent = count;
  $('#cartCount').hidden = !count;
  $('#openCart').setAttribute('aria-label', count ? `Abrir carrito, ${count} artículos` : 'Abrir carrito');
  $('#cartTotal').textContent = money(total);
  $('#checkoutBtn').disabled = !count;
  $('#cartItems').innerHTML = count
    ? cart.map((i) => {
        const p = PRODUCTS.find((x) => x.id === i.id);
        return `<div class="item">
          <div class="th" style="background:${p.color}">${thumb(p)}</div>
          <div><b>${p.name}</b>
            <div class="qty"><button data-dec="${p.id}" aria-label="Quitar uno">−</button>${i.qty}<button data-inc="${p.id}" aria-label="Añadir uno">+</button></div>
          </div>
          <div style="text-align:right"><b>${money(p.price * i.qty)}</b><br><button class="rm" data-rm="${p.id}">Quitar</button></div>
        </div>`;
      }).join('')
    : '<p class="empty">Tu carrito está vacío. Añade algo de la tienda.</p>';
}

let tt;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => t.classList.remove('show'), 1800);
}

const setMenu = (open) => {
  $('#top').classList.toggle('open', open);
  $('#menuBtn').setAttribute('aria-expanded', open);
  $('#menuBtn').setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
};

const closeAll = () => {
  setMenu(false);
  $('#drawer').hidden = true;
  $('#checkout').hidden = true;
};

/* ===== Páginas ===== */
function homePage() {
  const cats = [...new Set(PRODUCTS.map((p) => p.cat))];
  const icon = { 'Amigurumis': '🧸', 'Llaveros': '🔑', 'Colgantes': '🌙', 'Porcelana fría': '🌼' };
  $('#cats').innerHTML = cats.map((c) => `
    <a class="cat-card" href="tienda.html?cat=${encodeURIComponent(c)}" style="background:${PRODUCTS.find((p) => p.cat === c).color}">
      ${icon[c] || '🧶'}<span>${c}</span>
      <small>${PRODUCTS.filter((p) => p.cat === c).length} productos</small>
    </a>`).join('');
  $('#featured').innerHTML = PRODUCTS.slice(0, 4).map(card).join('');
}

function shopPage() {
  const params = new URLSearchParams(location.search);
  const state = { cat: params.get('cat') || 'Todo', q: '', sort: '' };
  const cats = ['Todo', ...new Set(PRODUCTS.map((p) => p.cat))];

  const draw = () => {
    $('#chips').innerHTML = cats.map((c) =>
      `<button class="chip" aria-pressed="${c === state.cat}" data-cat="${c}">${c}</button>`).join('');
    const list = PRODUCTS.filter((p) =>
      (state.cat === 'Todo' || p.cat === state.cat) &&
      (p.name + ' ' + p.cat).toLowerCase().includes(state.q.toLowerCase()));
    if (state.sort) list.sort((a, b) => (state.sort === 'asc' ? a.price - b.price : b.price - a.price));
    $('#grid').innerHTML = list.map(card).join('');
    $('#empty').hidden = list.length > 0;
  };

  $('#chips').addEventListener('click', (e) => {
    if (e.target.dataset.cat) { state.cat = e.target.dataset.cat; draw(); }
  });
  $('#search').addEventListener('input', (e) => { state.q = e.target.value; draw(); });
  $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; draw(); });
  draw();
}

function productPage() {
  const id = +new URLSearchParams(location.search).get('id');
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) {
    $('#detail').innerHTML = '<p class="empty">No encontramos este producto. <a href="tienda.html">Volver a la tienda</a></p>';
    return;
  }
  document.title = `Moira Crochet · ${p.name}`;
  $('#crumbs').innerHTML = `<a href="tienda.html">Tienda</a><i aria-hidden="true">›</i><a href="tienda.html?cat=${encodeURIComponent(p.cat)}">${p.cat}</a><i aria-hidden="true">›</i><span aria-current="page">${p.name}</span>`;
  $('#detail').innerHTML = `
    <div class="d-art" style="background:${p.color}">${thumb(p)}</div>
    <div class="d-info">
      <small>${p.cat}</small>
      <h1>${p.name}</h1>
      <p class="price">${money(p.price)}</p>
      <p>${p.desc}</p>
      <ul>${p.details.map((d) => `<li>${d}</li>`).join('')}</ul>
      <div class="buy">
        <div class="qty"><button id="minus" aria-label="Menos">−</button><span id="n">1</span><button id="plus" aria-label="Más">+</button></div>
        <button class="btn" id="buy">Añadir al carrito</button>
      </div>
    </div>`;
  let n = 1;
  $('#minus').onclick = () => { n = Math.max(1, n - 1); $('#n').textContent = n; };
  $('#plus').onclick = () => { n++; $('#n').textContent = n; };
  $('#buy').onclick = () => { addToCart(p.id, n); $('#drawer').hidden = false; };
  $('#related').innerHTML = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4).map(card).join('');
}

function contactPage() {
  $('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    $('#contactOk').textContent = '';
    if (!f.nombre.value.trim() || !f.mensaje.value.trim()) {
      $('#contactError').textContent = 'Escribe tu nombre y qué quieres encargar.';
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(f.correo.value)) {
      $('#contactError').textContent = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
      return;
    }
    $('#contactError').textContent = '';
    $('#contactOk').textContent = `Gracias, ${f.nombre.value.split(' ')[0]}. Recibimos tu mensaje (simulación).`;
    f.reset();
  });
}

/* ===== Eventos globales ===== */
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.dataset.add) addToCart(+t.dataset.add);
  if (t.dataset.inc) changeQty(+t.dataset.inc, 1);
  if (t.dataset.dec) changeQty(+t.dataset.dec, -1);
  if (t.dataset.rm) { cart = cart.filter((i) => i.id !== +t.dataset.rm); save(); }
  if (t.closest('#menuBtn')) setMenu(!$('#top').classList.contains('open'));
  else if (!t.closest('#mainNav')) setMenu(false);
  if (t.hasAttribute('data-close') || t.classList.contains('overlay')) closeAll();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

buildLayout();
renderCart();

$('#openCart').addEventListener('click', () => { $('#drawer').hidden = false; });
$('#checkoutBtn').addEventListener('click', () => {
  $('#drawer').hidden = true;
  $('#form').hidden = false;
  $('#done').hidden = true;
  $('#formError').textContent = '';
  $('#checkout').hidden = false;
});
$('#form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  if (!f.nombre.value.trim() || !f.direccion.value.trim()) {
    $('#formError').textContent = 'Completa tu nombre y tu dirección para continuar.';
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(f.correo.value)) {
    $('#formError').textContent = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
    return;
  }
  const num = 'MC-' + Math.floor(1000 + Math.random() * 9000);
  $('#doneMsg').textContent = `Gracias, ${f.nombre.value.split(' ')[0]}. Tu pedido ${num} quedó registrado (simulación).`;
  cart = [];
  save();
  f.reset();
  $('#form').hidden = true;
  $('#done').hidden = false;
});

({ inicio: homePage, tienda: shopPage, producto: productPage, contacto: contactPage })[page]();