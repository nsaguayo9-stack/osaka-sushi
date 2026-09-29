import './style.css';

const SHEET_URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vSaTHaLU2Tebhx_9mWYRjj7m3IJgxHV8AR8Vpxs0cInmfcUCdZRAUR-oX0oihFApw/pub?gid=1949346353&single=true&output=csv';
const PHONE='56932675337';
const money=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);
const state={items:[],filter:'Todos',query:'',cart:JSON.parse(localStorage.getItem('osaka-cart')||'[]'),selected:null,live:false};
const $=s=>document.querySelector(s);
const icon=(type)=>({bag:'<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',close:'<path d="M5 5l14 14M19 5 5 19"/>',minus:'<path d="M5 12h14"/>',plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',insta:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7"/>'})[type];
const svg=t=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon(t)}</svg>`;
function parseCSV(s){
  const out=[];let row=[],field='',quoted=false;
  for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&s[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))out.push(row);row=[];field='';}else field+=c;}
  row.push(field);if(row.some(x=>x.trim()))out.push(row);
  const headers=out.shift().map(x=>x.replace(/^\uFEFF/,'').trim().toLowerCase());
  return out.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));
}
function price(v){const n=Number(String(v||'').replace(/[^0-9]/g,''));return Number.isFinite(n)?n:0;}
function inStock(v){return !['no','n','0','false','agotado','sin stock'].includes(String(v||'').trim().toLowerCase());}
async function loadCatalog(){
  let raw,stale=false;
  try{const r=await fetch('/api/catalog',{cache:'no-store'});if(!r.ok)throw Error('API no disponible');raw=await r.text();}
  catch{try{const r=await fetch(SHEET_URL,{cache:'no-store'});if(!r.ok)throw Error('Sheet no disponible');raw=await r.text();}catch{const r=await fetch('/catalogo-inicial.csv');raw=await r.text();stale=true;}}
  const data=parseCSV(raw);
  if(!data.length||!data[0].categoria)throw Error('Formato de catálogo inválido');
  state.items=data.map((r,i)=>({id:r.id||`fila-${i+1}`,category:r.categoria||'Otros',name:r.nombre||'Producto',desc:r.descripcion||'',options:r.opciones_tamanos||'',price:price(r.precio),stock:inStock(r.stock),photo:r.foto||''})).filter(x=>x.price>0);
  state.live=!stale;
  state.cart=state.cart.filter(line=>{const current=state.items.find(p=>p.id===line.id);if(!current?.stock)return false;line.price=current.price;line.name=current.name;return true;});
  localStorage.setItem('osaka-cart',JSON.stringify(state.cart));
  if(stale)$('#status').textContent='Google Sheets no responde. Puedes revisar la carta inicial; los pedidos se habilitarán al recuperar la conexión.';
  else $('#status').textContent='Carta actualizada desde Google Sheets';
  renderFilters();renderProducts();renderCart();
}
function productCard(p){
  const card=document.createElement('article');card.className='product-card'+(p.photo?' has-photo':'')+(!p.stock?' soldout':'');
  if(p.photo){const img=document.createElement('img');img.className='product-photo';img.alt=p.name;img.loading='lazy';img.src=p.photo;img.onerror=()=>{img.remove();card.classList.remove('has-photo');};card.append(img);}
  const body=document.createElement('div');body.className='product-body';
  const cat=document.createElement('span');cat.className='eyebrow';cat.textContent=p.category;body.append(cat);
  const title=document.createElement('h3');title.textContent=p.name;body.append(title);
  if(p.desc){const d=document.createElement('p');d.className='description';d.textContent=p.desc;body.append(d);}
  if(p.options){const o=document.createElement('p');o.className='options';o.textContent=p.options;body.append(o);}
  const foot=document.createElement('div');foot.className='product-foot';
  const amount=document.createElement('strong');amount.textContent=money(p.price);foot.append(amount);
  const add=document.createElement('button');add.type='button';add.className='add-button';add.textContent=p.stock?'Agregar':'Agotado';add.disabled=!p.stock;add.onclick=()=>choose(p);foot.append(add);body.append(foot);card.append(body);return card;
}
function renderFilters(){const cats=['Todos',...new Set(state.items.map(x=>x.category))];const box=$('#filters');box.replaceChildren();for(const cat of cats){const b=document.createElement('button');b.type='button';b.className='filter'+(cat===state.filter?' active':'');b.textContent=cat;b.onclick=()=>{state.filter=cat;renderFilters();renderProducts();};box.append(b);}}
function renderProducts(){const q=state.query.toLocaleLowerCase('es');const list=state.items.filter(x=>(state.filter==='Todos'||x.category===state.filter)&&(`${x.name} ${x.desc} ${x.category}`.toLocaleLowerCase('es').includes(q)));const grid=$('#product-grid');grid.replaceChildren(...list.map(productCard));$('#results').textContent=`${list.length} producto${list.length===1?'':'s'}`;$('#empty').hidden=!!list.length;}
function choose(p){if(p.id==='OSK-005'||p.category==='Sándwiches'&&p.name!=='Tortuga'){state.selected=p;$('#option-title').textContent=p.name;const field=$('#option-value');field.value='';field.placeholder=p.id==='OSK-005'?'Ej.: pollo teriyaki':'Escribe la proteína que prefieres';$('#option-dialog').showModal();field.focus();}else addCart(p,'');}
function save(){localStorage.setItem('osaka-cart',JSON.stringify(state.cart));renderCart();}
function addCart(p,choice){const key=p.id+'|'+choice;const line=state.cart.find(x=>x.key===key);if(line)line.qty++;else state.cart.push({key,id:p.id,name:p.name,price:p.price,choice,qty:1});save();toggleCart(true);}
function renderCart(){const box=$('#cart-lines');box.replaceChildren();for(const line of state.cart){const row=document.createElement('div');row.className='cart-line';const info=document.createElement('div');const name=document.createElement('strong');name.textContent=line.name;info.append(name);if(line.choice){const choice=document.createElement('small');choice.textContent=line.choice;info.append(choice);}const amt=document.createElement('span');amt.textContent=money(line.price*line.qty);info.append(amt);row.append(info);const controls=document.createElement('div');controls.className='quantity';for(const [symbol,delta] of [['−',-1],[String(line.qty),0],['+',1]]){if(delta===0){const count=document.createElement('span');count.textContent=symbol;controls.append(count);}else{const b=document.createElement('button');b.type='button';b.textContent=symbol;b.setAttribute('aria-label',delta<0?'Quitar uno':'Agregar uno');b.onclick=()=>{line.qty+=delta;if(line.qty<=0)state.cart=state.cart.filter(x=>x!==line);save();};controls.append(b);}}row.append(controls);box.append(row);}
  const total=state.cart.reduce((n,x)=>n+x.price*x.qty,0),count=state.cart.reduce((n,x)=>n+x.qty,0);$('#cart-total').textContent=money(total);$('#cart-count').textContent=count;$('#cart-empty').hidden=!!count;$('#checkout').disabled=!count||!state.live;}
function checkout(){if(!state.cart.length||!state.live)return;const lines=state.cart.map(x=>`• ${x.qty} × ${x.name}${x.choice?` (${x.choice})`:''} — ${money(x.price*x.qty)}`);const total=state.cart.reduce((n,x)=>n+x.price*x.qty,0);const message=`Hola, quiero hacer un pedido en Osaka Sushi & Wok:\n\n${lines.join('\n')}\n\nTotal: ${money(total)}\n\nMi nombre y dirección son:`;window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');}
$('#app').innerHTML=`
 <header class="site-header"><a class="brand" href="#inicio" aria-label="Osaka Sushi, inicio"><img src="/assets/logo.png" alt="Osaka Sushi & Wok"/></a><nav aria-label="Principal"><a href="#carta">La carta</a><a href="#nosotros">Osaka</a><a href="https://www.instagram.com/osakasushi.calama/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">${svg('insta')}</a></nav><button class="cart-trigger" id="cart-open" type="button" aria-label="Abrir carrito">${svg('bag')}<span id="cart-count">0</span></button></header>
 <main id="inicio"><section class="hero"><div class="hero-inner"><p class="hero-kicker">SUSHI & WOK · CALAMA</p><h1>El antojo<br/><em>tiene nombre.</em></h1><p>Rolls, wok y favoritos para compartir. Elige lo tuyo y haz tu pedido por WhatsApp.</p><a class="primary-cta" href="#carta">Explorar la carta ${svg('arrow')}</a></div><span class="hero-index">OSAKA / SABOR QUE UNE</span></section>
 <section class="intro" id="nosotros"><div><span class="section-kicker">HECHO PARA ANTOJARSE</span><h2>Una carta para<br/><em>cada momento.</em></h2></div><p>Desde sushi burgers y rolls hasta platos al wok, sándwiches y opciones para picar. Encuentra tu favorito y arma tu pedido en pocos pasos.</p></section>
 <section class="feature"><div class="feature-number">01 / 03</div><div><span class="section-kicker">PARA COMPARTIR</span><h2>Elige, combina<br/>y disfruta.</h2><p>Tablas, promociones y sabores para la noche en Calama.</p><a href="#carta" id="promo-link">Ver promociones ${svg('arrow')}</a></div><div class="feature-art" aria-hidden="true"><span>OSAKA</span><div class="circle-one"></div><div class="circle-two"></div></div></section>
 <section class="catalog" id="carta"><div class="catalog-heading"><div><span class="section-kicker">LA CARTA</span><h2>Tu próximo favorito<br/><em>está aquí.</em></h2></div><p>Revisa opciones y precios, agrégalas al carrito y envíanos el pedido.</p></div><div class="catalog-tools"><div class="search">${svg('search')}<input id="search" type="search" placeholder="Buscar en la carta" aria-label="Buscar productos"/></div><span id="results"></span></div><div class="filters" id="filters" aria-label="Filtrar categorías"></div><div id="status" class="status" role="status">Cargando carta…</div><div class="product-grid" id="product-grid"></div><p id="empty" hidden>No encontramos productos con esa búsqueda.</p></section>
 <section class="last-cta"><span class="section-kicker">TU ANTOJO, A UN MENSAJE</span><h2>¿Ya elegiste?</h2><p>Agrega tus favoritos al carrito y termina tu pedido por WhatsApp.</p><button type="button" id="bottom-cart">Ver mi carrito ${svg('arrow')}</button></section></main>
 <footer><img src="/assets/logo.png" alt="Osaka Sushi & Wok"/><div><span>Calama, Chile</span><span>19:30 a 02:30</span></div><a href="https://www.instagram.com/osakasushi.calama/" target="_blank" rel="noopener noreferrer">Instagram ${svg('arrow')}</a></footer>
 <div class="drawer-scrim" id="scrim"></div><aside class="cart-drawer" id="cart-drawer" aria-hidden="true" aria-label="Carrito de compras"><div class="drawer-head"><div><span class="section-kicker">TU PEDIDO</span><h2>Carrito</h2></div><button type="button" id="cart-close" aria-label="Cerrar carrito">${svg('close')}</button></div><div class="cart-lines" id="cart-lines"></div><p id="cart-empty">Tu carrito está vacío. Explora la carta y agrega algo rico.</p><div class="drawer-bottom"><div class="total"><span>Total</span><strong id="cart-total">$0</strong></div><small>El pedido se confirma directamente por WhatsApp.</small><button id="checkout" type="button">Pedir por WhatsApp ${svg('arrow')}</button></div></aside>
 <dialog id="option-dialog"><form method="dialog" id="option-form"><button class="dialog-close" type="button" id="option-close" aria-label="Cerrar">${svg('close')}</button><span class="section-kicker">PERSONALIZA TU PEDIDO</span><h2 id="option-title"></h2><label for="option-value">¿Qué proteína prefieres?</label><input id="option-value" required maxlength="100" autocomplete="off"/><button type="submit">Agregar al carrito</button></form></dialog>`;
$('#search').addEventListener('input',e=>{state.query=e.target.value;renderProducts();});
const toggleCart=open=>{$('#cart-drawer').classList.toggle('open',open);$('#cart-drawer').setAttribute('aria-hidden',String(!open));$('#scrim').classList.toggle('visible',open);document.body.classList.toggle('lock-scroll',open);};
$('#cart-open').onclick=()=>toggleCart(true);$('#bottom-cart').onclick=()=>toggleCart(true);$('#cart-close').onclick=()=>toggleCart(false);$('#scrim').onclick=()=>toggleCart(false);$('#checkout').onclick=checkout;
$('#option-close').onclick=()=>$('#option-dialog').close();$('#option-form').onsubmit=e=>{e.preventDefault();const val=$('#option-value').value.trim();if(!val)return;addCart(state.selected,val);$('#option-dialog').close();toggleCart(true);};
$('#promo-link').onclick=()=>{state.filter='Promociones';renderFilters();renderProducts();};
renderCart();loadCatalog().catch(()=>{$('#status').textContent='No pudimos cargar la carta. Intenta recargar la página.';});
