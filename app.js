/* Логика демо-магазина: маршруты, страницы, корзина, избранное, оформление заказа.
   Маршрут хранится в адресе после # (например #cat-frap, #p-120, #cart),
   поэтому любую страницу можно открыть по прямой ссылке. */
(function () {
  'use strict';

  const { CATEGORIES, PRODUCTS } = window.SHOP;
  const byId = {}; PRODUCTS.forEach((p) => (byId[p.id] = p));
  const catBy = {}; CATEGORIES.forEach((c) => (catBy[c.slug] = c));
  ShopSearch.build(PRODUCTS, CATEGORIES);

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const view = $('#view');
  const PAGE_TITLE = document.title; // у каждого демо свой заголовок вкладки
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';
  const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return n + ' ' + (m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c); };
  const goods = (n) => plural(n, 'товар', 'товара', 'товаров');

  // ---------- Хранилище (корзина, избранное) — переживает перезагрузку ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('stu_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('stu_' + k, JSON.stringify(v)); } catch (e) { /* приватный режим — работаем без сохранения */ } },
  };
  let cart = store.get('cart', {});     // { id: количество }
  let favs = store.get('favs', []);     // [id]
  let lastOrder = store.get('order', null);
  let searchQuery = store.get('q', '');

  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  function setQty(id, qty) {
    qty = Math.max(0, Math.min(999, qty | 0));
    if (qty) cart[id] = qty; else delete cart[id];
    store.set('cart', cart);
    updateCounters();
  }
  function toggleFav(id) {
    favs = favs.includes(id) ? favs.filter((x) => x !== id) : favs.concat(id);
    store.set('favs', favs);
    updateCounters();
    return favs.includes(id);
  }
  function updateCounters() {
    $$('[data-count="cart"]').forEach((b) => { b.textContent = cartCount(); b.dataset.n = cartCount(); });
    $$('[data-count="fav"]').forEach((b) => { b.textContent = favs.length; b.dataset.n = favs.length; });
  }

  // ---------- Иконки ----------
  const IC = {
    heart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>',
    box: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z"/><path d="M4 7.5 12 11l8-3.5M12 11v9"/></svg>',
    truck: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    sync: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 12a8 8 0 0 1-14.3 4.9M4 12A8 8 0 0 1 18.3 7.1"/><path d="M18 3v4.5h-4.5M6 21v-4.5h4.5"/></svg>',
    card: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>',
    doc: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    check: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    filter: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    stock: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  };

  // ---------- Общие блоки ----------
  function stockHtml(p, long) {
    if (p.stock <= 0) return '<span class="stock order">Под заказ' + (long ? ', 3–5 дней' : '') + '</span>';
    if (p.stock <= 3) return '<span class="stock low">Осталось ' + p.stock + ' шт.</span>';
    return '<span class="stock in">В наличии' + (long ? ': ' + p.stock + ' шт.' : '') + '</span>';
  }
  const discount = (p) => (p.old ? Math.round((1 - p.price / p.old) * 100) : 0);
  function labels(p) {
    let s = '';
    if (p.old) s += '<span class="lbl-sale">−' + discount(p) + '%</span>';
    if (p.hit) s += '<span class="lbl-hit">Хит</span>';
    if (p.isNew) s += '<span class="lbl-new">Новинка</span>';
    return s ? '<div class="labels">' + s + '</div>' : '';
  }
  function buyControl(p) {
    const q = cart[p.id];
    if (q) return '<div class="stepper" data-id="' + p.id + '"><button type="button" data-step="-1" aria-label="Меньше">−</button><input type="number" inputmode="numeric" min="0" value="' + q + '" aria-label="Количество"><button type="button" data-step="1" aria-label="Больше">+</button></div>';
    return '<button class="btn btn-primary" type="button" data-buy="' + p.id + '">' + (p.stock > 0 ? 'В корзину' : 'Заказать') + '</button>';
  }
  function card(p) {
    return '<article class="card" data-card="' + p.id + '">' +
      '<a class="card-img" href="#p-' + p.id + '"><img loading="lazy" src="' + productImage(p.img) + '" alt="' + esc(p.name) + '">' +
        (productImageAlt(p.img) ? '<img class="alt' + (p.img.photo2 ? ' alt-photo' : '') + '" loading="lazy" src="' + productImageAlt(p.img) + '" alt="" aria-hidden="true">' : '') + labels(p) + '</a>' +
      '<button type="button" class="fav' + (favs.includes(p.id) ? ' on' : '') + '" data-fav="' + p.id + '" aria-label="В избранное">' + IC.heart + '</button>' +
      '<div class="price-row"><span class="price' + (p.old ? ' sale' : '') + '">' + money(p.price) + '</span>' + (p.old ? '<span class="old">' + money(p.old) + '</span>' : '') + '</div>' +
      '<div class="brand">' + esc(p.brand || catBy[p.cat].short) + '</div>' +
      '<a class="name" href="#p-' + p.id + '">' + esc(p.name) + '</a>' +
      stockHtml(p) +
      '<div class="actions">' + buyControl(p) + '</div></article>';
  }
  const crumbs = (items) => '<nav class="crumbs wrap" aria-label="Навигация по разделам"><a href="#home">Главная</a>' + items.map((i) => '<span>' + (i[1] ? '<a href="' + i[1] + '">' + esc(i[0]) + '</a>' : esc(i[0])) + '</span>').join('') + '</nav>';
  const typesOf = (slug) => Array.from(new Set(PRODUCTS.filter((p) => p.cat === slug).map((p) => p.type))).sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }));

  // ---------- Тост ----------
  let toastT;
  function toast(html) {
    const t = $('#toast');
    t.innerHTML = html; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 3200);
  }

  // =====================================================================
  // ГЛАВНАЯ
  // =====================================================================
  function pageHome() {
    // Сначала хиты, заданные вручную (SHOP.HITS); когда их 5 и больше — в блоке только они
    const pinned = (window.SHOP.HITS || []).map((id) => byId[id]).filter(Boolean);
    const hits = pinned.length >= 5 ? pinned : pinned.concat(PRODUCTS.filter((p) => p.hit && !pinned.includes(p)));
    const sale = PRODUCTS.filter((p) => p.old).sort((a, b) => discount(b) - discount(a));
    const slides = [
      { cls: 't-lemon', eyebrow: 'Отопительный сезон', title: 'Стальные радиаторы со склада', text: 'Типы 11, 22, 33 и нижнее подключение. Подберём по площади комнаты за минуту.', btn: 'Выбрать радиатор', href: '#cat-radiatory', img: { kind: 'radiator', color: 'белый', h: 500, l: 1200, panels: 2 } },
      { cls: 'dark', eyebrow: 'FRAP и G-Lauf', title: 'Смесители для кухни и ванной', text: 'Хром, чёрный матовый, золото. Гарантия производителя до 5 лет.', btn: 'Смотреть смесители', href: '#cat-frap', img: { kind: 'faucet-kitchen', color: 'золото' } },
      { cls: 't-sand', eyebrow: 'Для монтажа', title: 'Всё для водоснабжения VALTEC', text: 'Шаровые краны, коллекторы, фитинги и металлопластиковая труба.', btn: 'Перейти в Valtec', href: '#cat-valtec', img: { kind: 'valve', color: 'красный' } },
    ];
    view.innerHTML =
      '<div class="wrap hero">' +
        '<div class="slides" id="slides">' + slides.map((s) =>
          '<a class="slide ' + s.cls + '" href="' + s.href + '"><div class="copy"><span class="eyebrow">' + s.eyebrow + '</span><h2>' + s.title + '</h2><p>' + s.text + '</p><span class="btn btn-primary">' + s.btn + '</span></div><img src="' + productImage(s.img) + '" alt=""></a>').join('') +
        '</div><div class="dots" id="dots">' + slides.map((_, i) => '<button type="button" aria-label="Слайд ' + (i + 1) + '"' + (i ? '' : ' class="on"') + '></button>').join('') + '</div>' +
      '</div>' +
      '<section class="section wrap"><div class="sec-head"><h2>Каталог</h2></div><div class="cats">' +
        CATEGORIES.map((c) => '<a class="cat-tile t-' + c.tone + '" href="#cat-' + c.slug + '"><b>' + c.name + '</b><small>' + goods(PRODUCTS.filter((p) => p.cat === c.slug).length) + '</small><img src="' + productImage(c.img) + '" alt=""></a>').join('') +
      '</div></section>' +
      '<section class="section wrap"><div class="perks">' +
        '<div class="perk">' + IC.stock + '<b>Точные остатки</b><span>Наличие на сайте обновляется из 1С. Видно, сколько штук на складе.</span></div>' +
        '<div class="perk">' + IC.box + '<b>Самовывоз со склада</b><span>Товар в наличии можно забрать в день заказа.</span></div>' +
        '<div class="perk">' + IC.truck + '<b>Доставка по городу и области</b><span>Привезём на объект или домой в удобное время.</span></div>' +
        '<div class="perk">' + IC.doc + '<b>Оплата по счёту</b><span>Для юрлиц и монтажных организаций, с закрывающими документами.</span></div>' +
      '</div></section>' +
      '<section class="section wrap"><div class="sec-head"><h2>Хиты продаж</h2></div><div class="rail">' + hits.map(card).join('') + '</div></section>' +
      '<section class="section wrap"><div class="calc">' +
        '<div><h2>Какой радиатор нужен для комнаты?</h2><p class="muted">Введите площадь: посчитаем мощность по норме 100 Вт на 1 м² при потолке до 2,7 м и покажем подходящие модели.</p></div>' +
        '<div><form class="calc-form" id="calc"><div class="field"><label for="calc-area">Площадь, м²</label><input class="input" id="calc-area" type="number" inputmode="decimal" min="3" max="80" value="16"></div>' +
        '<div class="field"><label for="calc-win">Окон</label><select class="input" id="calc-win"><option value="1">1</option><option value="2">2</option></select></div>' +
        '<button class="btn btn-primary btn-lg" type="submit">Подобрать</button></form><p class="calc-out" id="calc-out"></p></div>' +
      '</div></section>' +
      (sale.length ? '<section class="section wrap"><div class="sec-head"><h2>Скидки</h2></div><div class="rail">' + sale.map(card).join('') + '</div></section>' : '');

    // Слайдер: точки + автопрокрутка (отключается, если пользователь просит меньше анимации)
    const sl = $('#slides'), dots = $$('#dots button');
    let cur = 0;
    const go = (i) => { cur = (i + slides.length) % slides.length; sl.scrollTo({ left: sl.clientWidth * cur + 12 * cur, behavior: 'smooth' }); };
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    sl.addEventListener('scroll', () => { const i = Math.round(sl.scrollLeft / (sl.clientWidth + 12)); dots.forEach((d, j) => d.classList.toggle('on', i === j)); cur = i; }, { passive: true });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const t = setInterval(() => { if (!document.body.contains(sl)) return clearInterval(t); if (!sl.matches(':hover')) go(cur + 1); }, 6000);
    }

    // Калькулятор радиатора
    const calc = () => {
      const area = Math.max(0, parseFloat($('#calc-area').value) || 0);
      const need = Math.round(area * 100 * (+$('#calc-win').value === 2 ? 1.1 : 1) / 10) * 10;
      const fit = PRODUCTS.filter((p) => p.cat === 'radiatory' && parseInt(p.attrs['Мощность (ΔT 70 °C)']) >= need).length;
      $('#calc-out').innerHTML = area ? 'Нужно примерно <b>' + need.toLocaleString('ru-RU') + ' Вт</b>. Подходит ' + plural(fit, 'модель', 'модели', 'моделей') + '. <a class="calc-link" href="#cat-radiatory" data-minpower="' + need + '">Показать →</a>' : '';
    };
    $('#calc').addEventListener('submit', (e) => { e.preventDefault(); calc(); });
    $('#calc').addEventListener('input', calc);
    calc();
  }

  // =====================================================================
  // ВСЕ КАТЕГОРИИ (мобильная вкладка «Каталог»)
  // =====================================================================
  function pageCatalog() {
    view.innerHTML = crumbs([['Каталог']]) + '<section class="wrap"><h1 style="margin-bottom:16px">Каталог</h1><div class="cats">' +
      CATEGORIES.map((c) => '<a class="cat-tile t-' + c.tone + '" href="#cat-' + c.slug + '"><b>' + c.name + '</b><small>' + goods(PRODUCTS.filter((p) => p.cat === c.slug).length) + '</small><img src="' + productImage(c.img) + '" alt=""></a>').join('') +
      '</div></section>';
  }

  // =====================================================================
  // КАТЕГОРИЯ: подкатегории, сортировка, фильтры
  // =====================================================================
  const filterState = {}; // по категориям: { type, sort, inStock, min, max, attrs: {key: [values]}, minPower }
  const FILTER_SKIP = ['Мощность (ΔT 70 °C)', 'Отапливаемая площадь', 'Рабочее давление', 'Бренд', 'Гарантия', 'Страна бренда'];

  function facetKeys(list) {
    const keys = {};
    list.forEach((p) => Object.entries(p.attrs).forEach(([k, v]) => { if (FILTER_SKIP.includes(k)) return; (keys[k] = keys[k] || {})[v] = (keys[k][v] || 0) + 1; }));
    return Object.entries(keys).filter(([, vals]) => Object.keys(vals).length > 1 && Object.keys(vals).length <= 12);
  }
  function applyFilters(list, st, skipKey) {
    return list.filter((p) => {
      if (st.type && p.type !== st.type) return false;
      if (st.inStock && p.stock <= 0) return false;
      if (st.min && p.price < st.min) return false;
      if (st.max && p.price > st.max) return false;
      if (st.minPower && parseInt(p.attrs['Мощность (ΔT 70 °C)']) < st.minPower) return false;
      for (const k in st.attrs) if (k !== skipKey && st.attrs[k].length && !st.attrs[k].includes(p.attrs[k])) return false;
      return true;
    });
  }
  function sortList(list, sort) {
    const l = list.slice();
    if (sort === 'cheap') l.sort((a, b) => a.price - b.price);
    else if (sort === 'exp') l.sort((a, b) => b.price - a.price);
    else if (sort === 'sale') l.sort((a, b) => discount(b) - discount(a));
    else l.sort((a, b) => (b.hit - a.hit) || ((b.stock > 0) - (a.stock > 0)));
    return l;
  }

  function pageCategory(slug) {
    const c = catBy[slug];
    if (!c) return pageNotFound();
    const all = PRODUCTS.filter((p) => p.cat === slug);
    const st = filterState[slug] = filterState[slug] || { type: '', sort: 'pop', inStock: false, min: '', max: '', attrs: {}, minPower: 0 };
    if (pendingMinPower) { st.minPower = pendingMinPower; pendingMinPower = 0; }
    const types = typesOf(slug);

    view.innerHTML = crumbs([['Каталог', '#catalog'], [c.name]]) +
      '<section class="wrap"><div class="cat-head"><h1>' + c.name + '</h1><span class="muted" id="cat-count"></span></div>' +
      (types.length > 1 ? '<div class="chips-scroll" id="types"><button type="button" class="chip' + (st.type ? '' : ' on') + '" data-type="">Все</button>' + types.map((t) => '<button type="button" class="chip' + (st.type === t ? ' on' : '') + '" data-type="' + esc(t) + '">' + esc(t) + ' <small>' + all.filter((p) => p.type === t).length + '</small></button>').join('') + '</div>' : '') +
      '<div class="toolbar"><button type="button" class="btn btn-ghost btn-filters" id="open-filters">' + IC.filter + 'Фильтры<span id="f-num"></span></button>' +
        '<label class="sr" for="sort">Сортировка</label><select class="input" id="sort"><option value="pop">Сначала популярные</option><option value="cheap">Сначала дешевле</option><option value="exp">Сначала дороже</option><option value="sale">По размеру скидки</option></select>' +
        '<label class="toggle"><input type="checkbox" id="instock"' + (st.inStock ? ' checked' : '') + '>В наличии</label>' +
        (st.minPower ? '<button type="button" class="chip on" id="power-chip">от ' + st.minPower + ' Вт ✕</button>' : '') +
      '</div>' +
      '<div class="layout"><aside class="filters" id="filters" aria-label="Фильтры"></aside><div><div class="grid" id="grid"></div></div></div></section>';
    $('#sort').value = st.sort;

    function renderFilters() {
      const base = all.filter((p) => !st.type || p.type === st.type);
      const prices = base.map((p) => p.price);
      const minP = Math.min.apply(null, prices), maxP = Math.max.apply(null, prices);
      $('#filters').innerHTML =
        '<div class="sheet-head"><h3>Фильтры</h3><button type="button" class="icon-btn" data-close-filters aria-label="Закрыть">' + IC.close + '</button></div>' +
        '<div class="f-group"><b>Цена, ₽</b><div class="f-price"><label class="sr" for="pmin">Цена от</label><input class="input" id="pmin" type="number" inputmode="numeric" placeholder="от ' + minP.toLocaleString('ru-RU') + '" value="' + (st.min || '') + '"><label class="sr" for="pmax">Цена до</label><input class="input" id="pmax" type="number" inputmode="numeric" placeholder="до ' + maxP.toLocaleString('ru-RU') + '" value="' + (st.max || '') + '"></div></div>' +
        facetKeys(base).map(([k, vals], gi) => {
          // Счётчик у значения учитывает остальные выбранные фильтры
          const ctx = applyFilters(base, Object.assign({}, st, { type: '' }), k);
          return '<div class="f-group"><b>' + esc(k) + '</b>' + Object.keys(vals).sort((a, b) => (parseFloat(a) - parseFloat(b)) || a.localeCompare(b, 'ru')).map((v, vi) => {
            const n = ctx.filter((p) => p.attrs[k] === v).length;
            const on = (st.attrs[k] || []).includes(v);
            return '<label class="check" for="f' + gi + '-' + vi + '"><input type="checkbox" id="f' + gi + '-' + vi + '" data-attr="' + esc(k) + '" value="' + esc(v) + '"' + (on ? ' checked' : '') + (n || on ? '' : ' disabled') + '>' + esc(v) + '<small>' + n + '</small></label>';
          }).join('') + '</div>';
        }).join('') +
        '<div class="f-actions"><button type="button" class="btn btn-ghost" id="f-reset">Сбросить</button><button type="button" class="btn btn-primary" data-close-filters id="f-show"></button></div>';
    }
    function renderGrid() {
      const list = sortList(applyFilters(all, st), st.sort);
      $('#cat-count').textContent = goods(list.length);
      const nf = Object.values(st.attrs).reduce((a, v) => a + v.length, 0) + (st.min ? 1 : 0) + (st.max ? 1 : 0);
      $('#f-num').textContent = nf ? ' · ' + nf : '';
      const show = $('#f-show'); if (show) show.textContent = 'Показать ' + goods(list.length);
      $('#grid').innerHTML = list.length ? list.map(card).join('') :
        '<div class="empty" style="grid-column:1/-1"><h3>Ничего не нашлось</h3><p>Попробуйте убрать часть фильтров или выбрать другой тип товара.</p><button type="button" class="btn btn-primary" id="empty-reset">Сбросить фильтры</button></div>';
    }
    const reset = () => { Object.assign(st, { min: '', max: '', attrs: {}, inStock: false, minPower: 0 }); $('#instock').checked = false; const pc = $('#power-chip'); if (pc) pc.remove(); renderFilters(); renderGrid(); };

    renderFilters(); renderGrid();

    const typesEl = $('#types');
    if (typesEl) typesEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-type]'); if (!b) return;
      st.type = b.dataset.type; st.attrs = {};
      $$('.chip', typesEl).forEach((x) => x.classList.toggle('on', x === b));
      renderFilters(); renderGrid();
    });
    $('#sort').addEventListener('change', (e) => { st.sort = e.target.value; renderGrid(); });
    $('#instock').addEventListener('change', (e) => { st.inStock = e.target.checked; renderFilters(); renderGrid(); });
    const pc = $('#power-chip'); if (pc) pc.addEventListener('click', () => { st.minPower = 0; pc.remove(); renderFilters(); renderGrid(); });
    const fl = $('#filters');
    fl.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.attr) {
        const k = t.dataset.attr; const arr = st.attrs[k] = st.attrs[k] || [];
        if (t.checked) arr.push(t.value); else arr.splice(arr.indexOf(t.value), 1);
        renderFilters(); renderGrid();
      }
    });
    let pt;
    fl.addEventListener('input', (e) => {
      if (e.target.id === 'pmin' || e.target.id === 'pmax') {
        clearTimeout(pt);
        pt = setTimeout(() => { st.min = +$('#pmin').value || ''; st.max = +$('#pmax').value || ''; renderGrid(); }, 350);
      }
    });
    fl.addEventListener('click', (e) => { if (e.target.closest('#f-reset')) reset(); if (e.target.closest('[data-close-filters]')) closeSheet(); });
    view.addEventListener('click', (e) => { if (e.target.closest('#empty-reset')) reset(); });
    $('#open-filters').addEventListener('click', openSheet);
  }

  // Шторка фильтров на телефоне
  function openSheet() {
    const s = document.createElement('div'); s.className = 'scrim'; s.id = 'scrim';
    s.addEventListener('click', closeSheet);
    document.body.appendChild(s);
    $('#filters').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSheet() {
    const f = $('#filters'); if (f) f.classList.remove('open');
    const s = $('#scrim'); if (s) s.remove();
    document.body.style.overflow = '';
  }
  let pendingMinPower = 0;

  // =====================================================================
  // КАРТОЧКА ТОВАРА
  // =====================================================================
  function pageProduct(id) {
    const p = byId[id];
    if (!p) return pageNotFound();
    const c = catBy[p.cat];
    const inCart = cart[p.id] || 0;
    const similar = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).sort((a, b) => (a.type === p.type ? -1 : 1) - (b.type === p.type ? -1 : 1)).slice(0, 10);
    const power = p.attrs['Мощность (ΔT 70 °C)'];

    view.innerHTML = crumbs([['Каталог', '#catalog'], [c.name, '#cat-' + c.slug], [p.type, '#cat-' + c.slug]]) +
      '<section class="wrap"><div class="pdp">' +
        '<div class="gallery"><img src="' + productImage(p.img) + '" alt="' + esc(p.name) + '">' + labels(p) + '</div>' +
        '<div class="pdp-info">' +
          '<div class="pdp-brand">' + esc(p.brand || c.name) + '</div>' +
          '<h1 style="font-size:clamp(22px,2.6vw,30px)">' + esc(p.name) + '</h1>' +
          '<div class="sku"><span>Артикул: ' + p.sku + '</span>' + (p.brand ? '<span>Бренд: ' + esc(p.brand) + '</span>' : '') + '</div>' +
          '<div class="buybox">' +
            '<div class="price-row"><span class="price' + (p.old ? ' sale' : '') + '">' + money(p.price) + '</span>' + (p.old ? '<span class="old">' + money(p.old) + '</span><span class="disc">−' + discount(p) + '%</span>' : '') + '</div>' +
            '<div>' + stockHtml(p, true) + '</div>' +
            '<div class="buy-row" id="buy-row"></div>' +
            '<div class="sync">' + IC.sync + 'Наличие и цена синхронизируются с 1С</div>' +
          '</div>' +
          '<div class="delivery">' +
            '<div>' + IC.box + '<span>Самовывоз со склада</span><b>' + (p.stock > 0 ? 'сегодня' : 'через 3–5 дней') + '</b></div>' +
            '<div>' + IC.truck + '<span>Доставка по городу</span><b>' + (p.stock > 0 ? 'завтра' : 'через 3–5 дней') + '</b></div>' +
            '<div>' + IC.card + '<span>Картой, наличными или по счёту</span><b></b></div>' +
          '</div>' +
          (power ? '<div class="note">Мощность <b>' + power + '</b> хватит на комнату примерно <b>' + p.attrs['Отапливаемая площадь'].replace('≈ ', '') + '</b> при потолках до 2,7 м.</div>' : '') +
          '<div><h3 style="margin:8px 0 6px">Характеристики</h3><dl class="specs">' + Object.entries(p.attrs).map(([k, v]) => '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>').join('') + '</dl></div>' +
        '</div>' +
      '</div></section>' +
      '<section class="section wrap"><div class="sec-head"><h2>Похожие товары</h2><a href="#cat-' + c.slug + '">Все ' + c.short + ' →</a></div><div class="rail">' + similar.map(card).join('') + '</div></section>' +
      '<div class="sticky-buy" id="sticky-buy"></div>';

    function renderBuy() {
      const q = cart[p.id] || 0;
      const favOn = favs.includes(p.id);
      $('#buy-row').innerHTML = (q
        ? '<div class="stepper" data-id="' + p.id + '"><button type="button" data-step="-1" aria-label="Меньше">−</button><input type="number" inputmode="numeric" value="' + q + '" aria-label="Количество"><button type="button" data-step="1" aria-label="Больше">+</button></div><a class="btn btn-primary btn-lg" href="#cart">Перейти в корзину</a>'
        : '<button class="btn btn-primary btn-lg" type="button" data-buy="' + p.id + '">' + (p.stock > 0 ? 'Добавить в корзину' : 'Заказать') + '</button>') +
        '<button type="button" class="icon-btn' + (favOn ? ' on' : '') + '" data-fav="' + p.id + '" aria-label="В избранное" style="width:52px;height:52px">' + IC.heart + '</button>';
      $('#sticky-buy').innerHTML = '<div><div class="price' + (p.old ? ' sale' : '') + '">' + money(p.price) + '</div>' + stockHtml(p) + '</div>' +
        (q ? '<a class="btn btn-primary" href="#cart">В корзине ' + q + ' шт.</a>' : '<button class="btn btn-primary" type="button" data-buy="' + p.id + '">В корзину</button>');
    }
    renderBuy();
    pdpRender = renderBuy;
    void inCart;
  }
  let pdpRender = null;

  // =====================================================================
  // ПОИСК (страница результатов)
  // =====================================================================
  let searchCat = '';
  function pageSearch() {
    const q = searchQuery;
    const r = ShopSearch.search(q);
    const counts = {};
    r.items.forEach((p) => (counts[p.cat] = (counts[p.cat] || 0) + 1));
    if (searchCat && !counts[searchCat]) searchCat = '';
    const list = searchCat ? r.items.filter((p) => p.cat === searchCat) : r.items;
    $('#q').value = q;
    view.innerHTML = crumbs([['Поиск']]) + '<section class="wrap">' +
      '<div class="cat-head"><h1>' + (q ? 'Результаты по запросу «' + esc(r.fixed || q) + '»' : 'Поиск') + '</h1><span class="muted">' + (q ? goods(r.items.length) : '') + '</span></div>' +
      (r.fixed ? '<p class="sg-note" style="margin:0 0 14px">Исправили раскладку клавиатуры. Вы набрали «' + esc(q) + '».</p>' : '') +
      (r.partial ? '<p class="sg-note" style="margin:0 0 14px">Точных совпадений нет. Показываем похожие товары.</p>' : '') +
      (Object.keys(counts).length > 1 ? '<div class="chips-scroll" id="s-cats"><button type="button" class="chip' + (searchCat ? '' : ' on') + '" data-scat="">Все <small>' + r.items.length + '</small></button>' + Object.keys(counts).map((s) => '<button type="button" class="chip' + (searchCat === s ? ' on' : '') + '" data-scat="' + s + '">' + catBy[s].name + ' <small>' + counts[s] + '</small></button>').join('') + '</div>' : '') +
      (list.length ? '<div class="grid g4">' + list.map(card).join('') + '</div>'
        : '<div class="empty"><h3>' + (q ? 'По запросу «' + esc(q) + '» ничего не нашлось' : 'Что ищем?') + '</h3><p>Проверьте написание или попробуйте запрос из популярных:</p><div class="sg-chips" style="justify-content:center">' + POPULAR.map((x) => '<button type="button" class="chip" data-q="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div></div>') +
      '</section>';
    const sc = $('#s-cats');
    if (sc) sc.addEventListener('click', (e) => { const b = e.target.closest('[data-scat]'); if (b) { searchCat = b.dataset.scat; pageSearch(); } });
  }
  const POPULAR = ['смеситель для кухни', 'мойка из камня', 'радиатор 500×1000', 'кран шаровой 1/2', 'FRAP черный', 'кран Маевского'];

  // =====================================================================
  // ИЗБРАННОЕ
  // =====================================================================
  function pageFavorites() {
    const list = favs.map((id) => byId[id]).filter(Boolean);
    view.innerHTML = crumbs([['Избранное']]) + '<section class="wrap"><div class="cat-head"><h1>Избранное</h1><span class="muted">' + (list.length ? goods(list.length) : '') + '</span></div>' +
      (list.length ? '<div class="grid g4">' + list.map(card).join('') + '</div>' : '<div class="empty"><h3>Здесь пока пусто</h3><p>Нажмите на сердечко у товара, чтобы сохранить его и вернуться к нему позже.</p><a class="btn btn-primary" href="#catalog">Перейти в каталог</a></div>') + '</section>';
  }

  // =====================================================================
  // КОРЗИНА
  // =====================================================================
  function cartLines() { return Object.keys(cart).map((id) => ({ p: byId[id], q: cart[id] })).filter((l) => l.p); }
  function totals() {
    let sum = 0, full = 0;
    cartLines().forEach((l) => { sum += l.p.price * l.q; full += (l.p.old || l.p.price) * l.q; });
    return { sum: sum, full: full, save: full - sum, count: cartCount() };
  }
  function summaryHtml(btn) {
    const t = totals();
    return '<div class="summary"><h3>Ваш заказ</h3>' +
      '<div class="s-row"><span>' + goods(t.count) + '</span><span>' + money(t.full) + '</span></div>' +
      (t.save ? '<div class="s-row"><span>Скидка</span><span class="sale">−' + money(t.save) + '</span></div>' : '') +
      '<div class="s-row"><span>Доставка</span><span class="muted">рассчитаем при оформлении</span></div>' +
      '<div class="s-row total"><span>Итого</span><span>' + money(t.sum) + '</span></div>' + btn + '</div>';
  }
  // «Не забудьте»: подсказываем комплектующие к основному товару
  function crossSell() {
    const cats = new Set(cartLines().map((l) => l.p.cat));
    let ids = [];
    if (cats.has('radiatory')) ids = PRODUCTS.filter((p) => p.cat === 'komplektuyushchie' && /Кронштейн|Маевского|термостатический|Термоголовка/.test(p.name)).map((p) => p.id);
    if (cats.has('g-lauf') || cats.has('frap') || cats.has('moyki')) ids = ids.concat(PRODUCTS.filter((p) => /Подводка|Кран шаровой VALTEC BASE 1\/2/.test(p.name)).map((p) => p.id));
    return ids.filter((id) => !cart[id]).slice(0, 8).map((id) => byId[id]);
  }
  function pageCart() {
    const lines = cartLines();
    if (!lines.length) {
      view.innerHTML = crumbs([['Корзина']]) + '<section class="wrap"><div class="empty"><h1>Корзина пуста</h1><p>Найдите нужное через поиск или загляните в каталог.</p><a class="btn btn-primary btn-lg" href="#catalog">Перейти в каталог</a></div></section>' +
        '<section class="section wrap"><div class="sec-head"><h2>Хиты продаж</h2></div><div class="rail">' + PRODUCTS.filter((p) => p.hit).map(card).join('') + '</div></section>';
      return;
    }
    const t = totals();
    const extra = crossSell();
    view.innerHTML = crumbs([['Корзина']]) + '<section class="wrap"><div class="cat-head"><h1>Корзина</h1><span class="muted">' + goods(t.count) + '</span><button type="button" class="link-btn" id="clear-cart" style="margin-left:auto">Очистить</button></div>' +
      '<div class="cart"><div>' + lines.map((l) =>
        '<div class="c-item"><a href="#p-' + l.p.id + '"><img src="' + productImage(l.p.img) + '" alt=""></a><div class="c-body">' +
          '<a class="nm" href="#p-' + l.p.id + '">' + esc(l.p.name) + '</a>' +
          '<div class="muted" style="font-size:13px">' + l.p.sku + ' · ' + money(l.p.price) + ' за шт.</div>' + stockHtml(l.p, true) +
          (l.p.stock > 0 && l.q > l.p.stock ? '<div class="c-warn">На складе ' + l.p.stock + ' шт. Остальные ' + (l.q - l.p.stock) + ' шт. привезём под заказ за 3–5 дней.</div>' : '') +
          '<div class="c-foot"><div class="stepper" data-id="' + l.p.id + '"><button type="button" data-step="-1" aria-label="Меньше">−</button><input type="number" inputmode="numeric" value="' + l.q + '" aria-label="Количество"><button type="button" data-step="1" aria-label="Больше">+</button></div>' +
          '<button type="button" class="link-btn" data-remove="' + l.p.id + '">Удалить</button><span class="sum">' + money(l.p.price * l.q) + '</span></div>' +
        '</div></div>').join('') + '</div>' +
        summaryHtml('<a class="btn btn-primary btn-lg btn-block" href="#checkout">Перейти к оформлению</a>') +
      '</div></section>' +
      (extra.length ? '<section class="section wrap"><div class="sec-head"><h2>Не забудьте для монтажа</h2></div><div class="rail">' + extra.map(card).join('') + '</div></section>' : '') +
      '<div class="mobile-total"><div><div class="muted" style="font-size:12.5px">Итого</div><b>' + money(t.sum) + '</b></div><a class="btn btn-primary" href="#checkout">Оформить</a></div>';
    $('#clear-cart').addEventListener('click', () => { cart = {}; store.set('cart', cart); updateCounters(); pageCart(); });
  }

  // =====================================================================
  // ОФОРМЛЕНИЕ ЗАКАЗА
  // =====================================================================
  const draft = store.get('draft', { face: 'person', ship: 'pickup', pay: 'cash' });
  function phoneMask(v) {
    let d = v.replace(/\D/g, '');
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d && d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    const p = d.slice(1);
    let out = '+7';
    if (p.length) out += ' (' + p.slice(0, 3);
    if (p.length >= 3) out += ') ' + p.slice(3, 6);
    if (p.length >= 6) out += '-' + p.slice(6, 8);
    if (p.length >= 8) out += '-' + p.slice(8, 10);
    return d ? out : '';
  }
  function pageCheckout() {
    if (!cartLines().length) { location.hash = 'cart'; return; }
    const val = (k) => esc(draft[k] || '');
    view.innerHTML = crumbs([['Корзина', '#cart'], ['Оформление']]) + '<section class="wrap"><h1 style="margin-bottom:20px">Оформление заказа</h1>' +
      '<div class="cart"><form class="form" id="order" novalidate>' +
        '<fieldset class="fs"><legend>Покупатель</legend><div class="opts c2">' +
          '<label class="opt"><input type="radio" name="face" value="person"' + (draft.face === 'person' ? ' checked' : '') + '>Частное лицо</label>' +
          '<label class="opt"><input type="radio" name="face" value="company"' + (draft.face === 'company' ? ' checked' : '') + '>Организация или ИП<small>Счёт и закрывающие документы</small></label></div>' +
          '<div class="row2"><div class="field"><label for="o-name">Имя *</label><input class="input" id="o-name" name="name" autocomplete="name" value="' + val('name') + '"></div>' +
          '<div class="field"><label for="o-phone">Телефон *</label><input class="input" id="o-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" value="' + val('phone') + '"></div></div>' +
          '<div class="field"><label for="o-email">E-mail для чека</label><input class="input" id="o-email" name="email" type="email" inputmode="email" autocomplete="email" value="' + val('email') + '"></div>' +
          '<div class="row2" id="company-fields"' + (draft.face === 'company' ? '' : ' hidden') + '><div class="field"><label for="o-inn">ИНН *</label><input class="input" id="o-inn" name="inn" inputmode="numeric" maxlength="12" value="' + val('inn') + '"></div>' +
          '<div class="field"><label for="o-org">Название организации</label><input class="input" id="o-org" name="org" value="' + val('org') + '"></div></div>' +
        '</fieldset>' +
        '<fieldset class="fs"><legend>Получение</legend><div class="opts c2">' +
          '<label class="opt"><input type="radio" name="ship" value="pickup"' + (draft.ship === 'pickup' ? ' checked' : '') + '>Самовывоз со склада<small>Бесплатно · товар в наличии сегодня</small></label>' +
          '<label class="opt"><input type="radio" name="ship" value="courier"' + (draft.ship === 'courier' ? ' checked' : '') + '>Доставка<small>По городу и области · стоимость скажет менеджер</small></label></div>' +
          '<div class="field" id="addr-field"' + (draft.ship === 'courier' ? '' : ' hidden') + '><label for="o-addr">Адрес доставки *</label><input class="input" id="o-addr" name="addr" autocomplete="street-address" placeholder="Город, улица, дом, квартира или объект" value="' + val('addr') + '"></div>' +
        '</fieldset>' +
        '<fieldset class="fs"><legend>Оплата</legend><div class="opts c3" id="pay-opts">' +
          '<label class="opt"><input type="radio" name="pay" value="cash"' + (draft.pay === 'cash' ? ' checked' : '') + '>При получении<small>Наличными или картой</small></label>' +
          '<label class="opt"><input type="radio" name="pay" value="online"' + (draft.pay === 'online' ? ' checked' : '') + '>Онлайн картой<small>После подтверждения заказа</small></label>' +
          '<label class="opt" id="opt-invoice"><input type="radio" name="pay" value="invoice"' + (draft.pay === 'invoice' ? ' checked' : '') + '>По счёту<small>Для организаций</small></label></div>' +
        '</fieldset>' +
        '<div class="field"><label for="o-comment">Комментарий к заказу</label><textarea class="input" id="o-comment" name="comment" placeholder="Например: позвонить за час до доставки">' + val('comment') + '</textarea></div>' +
        '<p class="muted" style="margin:0;font-size:13px">Нажимая «Подтвердить заказ», вы соглашаетесь на обработку персональных данных.</p>' +
        '<button class="btn btn-primary btn-lg" type="submit" id="submit-order">Подтвердить заказ</button>' +
      '</form>' +
      '<div>' + summaryHtml('') + '<div class="summary" style="margin-top:12px;background:none;border:1px solid var(--line)">' + cartLines().map((l) => '<div class="s-row"><span style="min-width:0">' + esc(l.p.name) + ' <span class="muted">× ' + l.q + '</span></span><b style="white-space:nowrap">' + money(l.p.price * l.q) + '</b></div>').join('') + '</div></div>' +
      '</div></section>';

    const f = $('#order');
    const sync = () => {
      const fd = new FormData(f);
      fd.forEach((v, k) => (draft[k] = v));
      store.set('draft', draft);
      $('#company-fields').hidden = draft.face !== 'company';
      $('#addr-field').hidden = draft.ship !== 'courier';
      const inv = $('#opt-invoice'), invIn = $('input', inv);
      inv.classList.toggle('disabled', draft.face !== 'company');
      invIn.disabled = draft.face !== 'company';
      if (invIn.disabled && invIn.checked) { $('input[value="cash"]', f).checked = true; draft.pay = 'cash'; }
    };
    $('#o-phone').addEventListener('input', (e) => { e.target.value = phoneMask(e.target.value); });
    f.addEventListener('input', sync);
    f.addEventListener('change', sync);
    sync();
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      sync();
      $$('.err-msg', f).forEach((x) => x.remove());
      $$('.input.err', f).forEach((x) => x.classList.remove('err'));
      const errors = [];
      const need = (id, ok, msg) => { if (!ok) { const el = $(id); el.classList.add('err'); el.insertAdjacentHTML('afterend', '<span class="err-msg">' + msg + '</span>'); errors.push(el); } };
      need('#o-name', (draft.name || '').trim().length >= 2, 'Укажите имя');
      need('#o-phone', (draft.phone || '').replace(/\D/g, '').length === 11, 'Введите телефон полностью: +7 и 10 цифр');
      if (draft.email) need('#o-email', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email), 'Проверьте e-mail');
      if (draft.face === 'company') need('#o-inn', /^(\d{10}|\d{12})$/.test(draft.inn || ''), 'ИНН — 10 или 12 цифр');
      if (draft.ship === 'courier') need('#o-addr', (draft.addr || '').trim().length >= 5, 'Укажите адрес доставки');
      if (errors.length) { errors[0].focus(); errors[0].scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      const t = totals();
      lastOrder = { n: 'СУ-' + String(Date.now()).slice(-6), lines: cartLines().map((l) => [l.p.name, l.q, l.p.price * l.q]), sum: t.sum, ship: draft.ship, pay: draft.pay, phone: draft.phone, name: draft.name };
      store.set('order', lastOrder);
      cart = {}; store.set('cart', cart); updateCounters();
      location.hash = 'done';
    });
  }

  function pageDone() {
    if (!lastOrder) { location.hash = 'home'; return; }
    const o = lastOrder;
    const pay = { cash: 'при получении', online: 'онлайн картой (ссылку пришлём после подтверждения)', invoice: 'по счёту' }[o.pay];
    view.innerHTML = '<section class="wrap"><div class="done"><div class="ok-ic">' + IC.check + '</div><h1>Заказ ' + o.n + ' оформлен</h1>' +
      '<p class="muted" style="margin:0">' + esc(o.name) + ', менеджер позвонит на ' + esc(o.phone) + ' и подтвердит наличие и время ' + (o.ship === 'pickup' ? 'самовывоза' : 'доставки') + '. Оплата ' + pay + '.</p>' +
      '<div class="summary box">' + o.lines.map((l) => '<div class="s-row"><span>' + esc(l[0]) + ' <span class="muted">× ' + l[1] + '</span></span><b style="white-space:nowrap">' + money(l[2]) + '</b></div>').join('') + '<div class="s-row total"><span>Итого</span><span>' + money(o.sum) + '</span></div></div>' +
      '<p class="note" style="margin:0;text-align:left">В рабочей версии заказ сразу попадает в Битрикс и выгружается в 1С. Менеджер получает уведомление на почту или в Telegram.</p>' +
      '<a class="btn btn-primary btn-lg" href="#home">Вернуться на главную</a></div></section>';
  }

  // =====================================================================
  // ИНФО-СТРАНИЦЫ И 404
  // =====================================================================
  const INFO = {
    delivery: ['Доставка и оплата', 'Самовывоз со склада бесплатно: товар в наличии готов к выдаче в день заказа. Доставка по городу и области на следующий день, стоимость зависит от веса и адреса. Оплата наличными, картой при получении, онлайн или по счёту для организаций.'],
    opt: ['Оптовым покупателям', 'Для монтажных организаций и магазинов: персональные цены, отсрочка платежа, резерв товара под объект и закрывающие документы. Цены в личном кабинете подтягиваются из 1С по типу цен клиента.'],
    contacts: ['Контакты', 'Телефон: 8 (800) 000-00-00. Склад и пункт выдачи: адрес и режим работы перенесём с текущего сайта.'],
  };
  function pageInfo(k) {
    const i = INFO[k]; if (!i) return pageNotFound();
    view.innerHTML = crumbs([[i[0]]]) + '<section class="wrap" style="max-width:760px"><h1 style="margin-bottom:16px">' + i[0] + '</h1><p style="font-size:16px;line-height:1.6">' + i[1] + '</p><p class="note">Текст раздела в демо условный. В рабочей версии его перенесём с текущего сайта.</p></section>';
  }
  function pageNotFound() {
    view.innerHTML = '<section class="wrap"><div class="empty"><h1>Страница не найдена</h1><p>Возможно, ссылка устарела. Попробуйте поиск или каталог.</p><a class="btn btn-primary" href="#catalog">В каталог</a></div></section>';
  }

  // =====================================================================
  // МАРШРУТИЗАЦИЯ
  // =====================================================================
  function route() {
    const h = location.hash.replace(/^#/, '') || 'home';
    closeSheet(); closeMega(); hideSuggest();
    $('#toast').hidden = true;
    pdpRender = null;
    if (h === 'home') pageHome();
    else if (h === 'catalog') pageCatalog();
    else if (h.startsWith('cat-')) pageCategory(h.slice(4));
    else if (h.startsWith('p-')) pageProduct(+h.slice(2));
    else if (h === 'search') pageSearch();
    else if (h === 'favorites') pageFavorites();
    else if (h === 'cart') pageCart();
    else if (h === 'checkout') pageCheckout();
    else if (h === 'done') pageDone();
    else if (h.startsWith('info-')) pageInfo(h.slice(5));
    else pageNotFound();
    const tab = h.startsWith('cat-') || h === 'catalog' || h.startsWith('p-') ? 'catalog' : h === 'checkout' ? 'cart' : h;
    $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === tab));
    document.title = PAGE_TITLE;
    window.scrollTo(0, 0);
  }

  // ---------- Делегированные клики: корзина, избранное, количество ----------
  function rerenderBuy(id) {
    // Перерисовываем только кнопки этого товара, не всю страницу
    $$('[data-card="' + id + '"] .actions').forEach((a) => (a.innerHTML = buyControl(byId[id])));
    if (pdpRender) pdpRender();
    if (location.hash === '#cart') pageCart();
  }
  document.addEventListener('click', (e) => {
    const buy = e.target.closest('[data-buy]');
    if (buy) {
      const id = +buy.dataset.buy;
      setQty(id, (cart[id] || 0) + 1);
      rerenderBuy(id);
      toast('Добавили в корзину<a href="#cart">Перейти</a>');
      return;
    }
    const step = e.target.closest('[data-step]');
    if (step) {
      const id = +step.closest('.stepper').dataset.id;
      setQty(id, (cart[id] || 0) + +step.dataset.step);
      rerenderBuy(id);
      return;
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) { setQty(+rm.dataset.remove, 0); pageCart(); return; }
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      e.preventDefault();
      const on = toggleFav(+fav.dataset.fav);
      $$('[data-fav="' + fav.dataset.fav + '"]').forEach((b) => b.classList.toggle('on', on));
      toast(on ? 'Сохранили в избранное<a href="#favorites">Открыть</a>' : 'Убрали из избранного');
      if (location.hash === '#favorites') pageFavorites();
      return;
    }
    const mp = e.target.closest('[data-minpower]');
    if (mp) { pendingMinPower = +mp.dataset.minpower; if (filterState.radiatory) filterState.radiatory.minPower = pendingMinPower; if (location.hash === '#cat-radiatory') route(); }
    const qc = e.target.closest('[data-q]');
    if (qc) { runSearch(qc.dataset.q); }
  });
  document.addEventListener('change', (e) => {
    const inp = e.target.closest('.stepper input');
    if (inp) { const id = +inp.closest('.stepper').dataset.id; setQty(id, +inp.value); rerenderBuy(id); }
  });

  // =====================================================================
  // ПОИСК В ШАПКЕ: подсказки при вводе
  // =====================================================================
  const qInput = $('#q'), sug = $('#suggest'), qClear = $('#q-clear');
  let sel = -1;
  function hideSuggest() { sug.hidden = true; sel = -1; }
  function highlight(name, query) {
    const toks = ShopSearch.norm(query).split(' ').filter((t) => t.length >= 2).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    let s = esc(name);
    if (toks.length) s = s.replace(new RegExp('(' + toks.join('|') + ')', 'gi'), '<mark>$1</mark>');
    return s;
  }
  function renderSuggest() {
    const q = qInput.value.trim();
    qClear.hidden = !q;
    if (!q) {
      sug.innerHTML = '<div class="sg-title">Часто ищут</div><div class="sg-chips">' + POPULAR.map((x) => '<button type="button" class="chip" data-q="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>' +
        '<div class="sg-title">Разделы</div><div class="sg-chips">' + CATEGORIES.map((c) => '<a class="chip" href="#cat-' + c.slug + '">' + c.name + '</a>').join('') + '</div>';
      sug.hidden = false; return;
    }
    const r = ShopSearch.search(q);
    const counts = {};
    r.items.forEach((p) => (counts[p.cat] = (counts[p.cat] || 0) + 1));
    const top = r.items.slice(0, 6);
    sug.innerHTML =
      (r.fixed ? '<div class="sg-note">Исправили раскладку: <b>' + esc(r.fixed) + '</b></div>' : '') +
      (Object.keys(counts).length ? '<div class="sg-title">Категории</div><div class="sg-chips">' + Object.keys(counts).map((s) => '<a class="chip" href="#cat-' + s + '">' + catBy[s].name + ' <small>' + counts[s] + '</small></a>').join('') + '</div>' : '') +
      (top.length ? '<div class="sg-title">Товары</div>' + top.map((p, i) => '<a class="sg-row' + (i === sel ? ' sel' : '') + '" href="#p-' + p.id + '"><img src="' + productImage(p.img) + '" alt=""><span class="nm">' + highlight(p.name, r.fixed || q) + '<br>' + stockHtml(p) + '</span><span class="pr">' + money(p.price) + (p.old ? '<small class="old">' + money(p.old) + '</small>' : '') + '</span></a>').join('') +
        '<a class="sg-all" href="#search" data-all>Показать все ' + goods(r.items.length) + '</a>'
        : '<div class="sg-empty"><b>Ничего не нашлось</b><p class="muted" style="margin:6px 0 10px">Попробуйте другой запрос или популярный:</p><div class="sg-chips" style="padding:0">' + POPULAR.slice(0, 4).map((x) => '<button type="button" class="chip" data-q="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div></div>');
    sug.hidden = false;
  }
  function runSearch(q) {
    searchQuery = q.trim(); store.set('q', searchQuery); searchCat = '';
    qInput.value = searchQuery; qInput.blur(); hideSuggest();
    if (location.hash === '#search') route(); else location.hash = 'search';
  }
  let st;
  qInput.addEventListener('input', () => { sel = -1; clearTimeout(st); st = setTimeout(renderSuggest, 90); });
  qInput.addEventListener('focus', () => { closeMega(); renderSuggest(); });
  qInput.addEventListener('keydown', (e) => {
    const rows = $$('.sg-row', sug);
    if (e.key === 'ArrowDown' && rows.length) { e.preventDefault(); sel = (sel + 1) % rows.length; }
    else if (e.key === 'ArrowUp' && rows.length) { e.preventDefault(); sel = (sel - 1 + rows.length) % rows.length; }
    else if (e.key === 'Escape') { hideSuggest(); qInput.blur(); return; }
    else if (e.key === 'Enter' && sel >= 0 && rows[sel]) { e.preventDefault(); location.hash = rows[sel].getAttribute('href').slice(1); qInput.blur(); hideSuggest(); return; }
    else return;
    rows.forEach((r, i) => r.classList.toggle('sel', i === sel));
  });
  $('#search-form').addEventListener('submit', (e) => { e.preventDefault(); if (qInput.value.trim()) runSearch(qInput.value); });
  sug.addEventListener('click', (e) => {
    if (e.target.closest('[data-all]')) { e.preventDefault(); runSearch(qInput.value); return; }
    if (e.target.closest('a')) hideSuggest();
  });
  qClear.addEventListener('click', () => { qInput.value = ''; qInput.focus(); renderSuggest(); });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#search-form')) hideSuggest();
    if (!e.target.closest('#mega') && !e.target.closest('#btn-catalog')) closeMega();
  });
  $('#tab-search').addEventListener('click', () => { window.scrollTo(0, 0); qInput.focus(); });

  // ---------- Мега-меню каталога (компьютер) ----------
  const mega = $('#mega'), btnCat = $('#btn-catalog');
  mega.innerHTML = '<div class="wrap">' + CATEGORIES.map((c) => '<div class="mega-col t-hover"><img src="' + productImage(c.img) + '" alt="" class="t-' + c.tone + '"><a href="#cat-' + c.slug + '"><b>' + c.name + '</b></a><div class="subs">' +
    typesOf(c.slug).slice(0, 5).map((t) => '<a href="#cat-' + c.slug + '" data-goto-type="' + esc(t) + '" data-cat="' + c.slug + '">' + esc(t) + '</a>').join('') + '</div></div>').join('') + '</div>';
  function closeMega() { mega.hidden = true; btnCat.setAttribute('aria-expanded', 'false'); }
  btnCat.addEventListener('click', () => { const open = mega.hidden; mega.hidden = !open; btnCat.setAttribute('aria-expanded', String(open)); });
  mega.addEventListener('click', (e) => {
    const a = e.target.closest('[data-goto-type]');
    if (a) { const s = a.dataset.cat; filterState[s] = Object.assign(filterState[s] || { sort: 'pop', inStock: false, min: '', max: '', attrs: {}, minPower: 0 }, { type: a.dataset.gotoType, attrs: {} }); if (location.hash === '#cat-' + s) route(); }
    closeMega();
  });

  // Подвал
  $('#footer-cats').innerHTML = CATEGORIES.map((c) => '<li><a href="#cat-' + c.slug + '">' + c.name + '</a></li>').join('');

  // =====================================================================
  // АНИМАЦИЯ: карточки по очереди «всплывают» при появлении в зоне видимости
  // =====================================================================
  // Следим за #view: любые новые карточки (каталог, поиск, подборки) подхватываются автоматически.
  // При системной настройке «уменьшить движение» эффект не включается.
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      const shown = entries.filter((e) => e.isIntersecting);
      shown.forEach((e, i) => {
        const el = e.target;
        el.style.transitionDelay = Math.min(i * 50, 300) + 'ms'; // лесенка: 0, 50, 100… мс
        el.classList.add('rv-in');
        io.unobserve(el);
        // после анимации убираем задержку, чтобы hover срабатывал сразу
        setTimeout(() => { el.style.transitionDelay = ''; el.classList.remove('rv', 'rv-in'); }, 700 + Math.min(i * 50, 300));
      });
    }, { rootMargin: '0px 0px -40px 0px' });
    const watch = (root) => $$('.card:not(.rv)', root).forEach((c) => { c.classList.add('rv'); io.observe(c); });
    new MutationObserver(() => watch(view)).observe(view, { childList: true, subtree: true });
  }

  window.addEventListener('hashchange', route);
  updateCounters();
  route();
})();
