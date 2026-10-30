/* Каталог для демо.
   ВНИМАНИЕ: товары, артикулы, цены и остатки — условные (DEMO-*).
   В рабочей версии этот файл заменяется выгрузкой из Битрикс/1С (CommerceML или YML-фид):
   формат объекта товара ниже совпадает с полями, которые есть в выгрузке. */
(function () {
  'use strict';

  // ---------- Категории ----------
  const CATEGORIES = [
    { slug: 'moyki', name: 'Мойки кухонные', short: 'Мойки', tone: 'mint', img: { kind: 'sink-stone', color: 'графит' } },
    { slug: 'g-lauf', name: 'Смесители G-Lauf', short: 'G-Lauf', tone: 'sky', img: { kind: 'faucet-kitchen', color: 'хром' } },
    { slug: 'frap', name: 'Смесители FRAP', short: 'FRAP', tone: 'sand', img: { kind: 'faucet-kitchen', color: 'черный матовый' } },
    { slug: 'radiatory', name: 'Радиаторы стальные', short: 'Радиаторы', tone: 'lilac', img: { kind: 'radiator', color: 'белый', h: 500, l: 1000 } },
    { slug: 'komplektuyushchie', name: 'Комплектующие для радиаторов', short: 'Комплектующие', tone: 'rose', img: { kind: 'thermohead', color: 'белый' } },
    { slug: 'valtec', name: 'Valtec', short: 'Valtec', tone: 'lemon', img: { kind: 'valve', color: 'красный' } },
  ];

  // Детерминированный «рандом», чтобы данные не менялись между загрузками
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const round = (n, step = 10) => Math.round(n / step) * step - (step >= 100 ? 10 : 0);

  const PRODUCTS = [];
  let id = 100;
  function add(cat, p) {
    id++;
    const r = rnd();
    // Остаток: 0 — под заказ, 1–3 — мало, иначе в наличии
    const stock = r < 0.15 ? 0 : r < 0.3 ? 1 + Math.floor(rnd() * 3) : 4 + Math.floor(rnd() * 60);
    const disc = rnd() < 0.3 ? pick([10, 15, 20, 25]) : 0;
    const price = p.price;
    PRODUCTS.push({
      id: id, cat: cat, name: p.name, brand: p.brand || '', type: p.type,
      sku: 'DEMO-' + cat.slice(0, 3).toUpperCase() + '-' + id,
      price: disc ? round(price * (1 - disc / 100)) : price,
      old: disc ? price : 0,
      stock: stock,
      hit: rnd() < 0.25,
      isNew: rnd() < 0.12,
      img: p.img,
      attrs: p.attrs,
      keywords: p.keywords || '',
    });
  }

  // ---------- Мойки ----------
  const sinkSizes = [
    { s: '50×50 см', w: 50, bowls: '1 чаша', price: 1 },
    { s: '60×50 см', w: 60, bowls: '1 чаша', price: 1.1 },
    { s: '78×50 см', w: 78, bowls: '1 чаша с крылом', price: 1.35 },
    { s: '86×50 см', w: 86, bowls: '2 чаши', price: 1.6 },
    { s: 'Ø 49 см', w: 49, bowls: '1 чаша (круглая)', price: 0.95 },
    { s: '45×45 см', w: 45, bowls: '1 чаша', price: 0.85 },
  ];
  const stoneColors = ['графит', 'черный', 'бежевый', 'песочный', 'белый', 'серый'];
  for (let i = 0; i < 16; i++) {
    const sz = sinkSizes[i % sinkSizes.length];
    const stone = i % 3 !== 2;
    const color = stone ? stoneColors[(i + Math.floor(i / 6)) % stoneColors.length] : pick(['сатин', 'декор']);
    const mount = pick(['врезная', 'врезная', 'накладная', 'под столешницу']);
    const material = stone ? 'искусственный камень' : 'нержавеющая сталь';
    add('moyki', {
      type: stone ? 'Из искусственного камня' : 'Из нержавеющей стали',
      name: 'Мойка кухонная ' + (stone ? 'из искусственного камня ' : 'из нержавеющей стали ') + sz.s + ', ' + sz.bowls + ', ' + color,
      price: round((stone ? 6900 : 3900) * sz.price + rnd() * 2500, 100),
      img: { kind: stone ? 'sink-stone' : 'sink-steel', color: color, round: sz.s.startsWith('Ø'), double: sz.bowls.startsWith('2') },
      attrs: { 'Материал': material, 'Размер': sz.s, 'Чаши': sz.bowls, 'Монтаж': mount, 'Цвет': color, 'Сифон в комплекте': pick(['да', 'нет']) },
      keywords: 'раковина для кухни мойка кухонная ' + (stone ? 'кварц гранит' : 'нержавейка'),
    });
  }

  // ---------- Смесители (G-Lauf и FRAP) ----------
  const faucetTypes = [
    { t: 'Для кухни', n: 'Смеситель для кухни, высокий излив', kind: 'faucet-kitchen', base: 4200, kw: 'кухонный кран мойка' },
    { t: 'Для кухни', n: 'Смеситель для кухни с выдвижной лейкой', kind: 'faucet-kitchen', base: 6900, kw: 'кухонный кран выдвижной' },
    { t: 'Для кухни', n: 'Смеситель для кухни с подключением фильтра питьевой воды', kind: 'faucet-kitchen', base: 7400, kw: 'кухонный кран фильтр питьевая' },
    { t: 'Для раковины', n: 'Смеситель для раковины однорычажный', kind: 'faucet-basin', base: 3300, kw: 'умывальник кран ванная' },
    { t: 'Для раковины', n: 'Смеситель для раковины с высоким изливом', kind: 'faucet-basin', base: 4600, kw: 'умывальник кран накладная раковина' },
    { t: 'Для ванны', n: 'Смеситель для ванны с душем, короткий излив', kind: 'faucet-bath', base: 4900, kw: 'кран ванна душ лейка шланг' },
    { t: 'Для ванны', n: 'Смеситель для ванны с длинным изливом', kind: 'faucet-bath', base: 5600, kw: 'кран ванна душ универсальный' },
    { t: 'Душевые системы', n: 'Душевая система с тропическим душем', kind: 'shower', base: 9900, kw: 'душевая стойка тропический верхний душ' },
    { t: 'Гигиенический душ', n: 'Смеситель с гигиеническим душем', kind: 'faucet-basin', base: 3900, kw: 'гигиенический душ биде' },
  ];
  const gColors = ['хром', 'черный матовый', 'белый', 'сатин', 'бронза', 'хром'];
  const fColors = ['хром', 'черный матовый', 'золото', 'белый', 'графит', 'хром'];
  [['g-lauf', 'G-Lauf', gColors, 1], ['frap', 'FRAP', fColors, 0.82]].forEach(function (b) {
    for (let i = 0; i < 14; i++) {
      const ft = faucetTypes[(i * 2 + (b[0] === 'frap' ? 1 : 0)) % faucetTypes.length];
      const color = b[2][i % b[2].length];
      add(b[0], {
        brand: b[1], type: ft.t,
        name: ft.n + ' ' + b[1] + ', ' + color,
        price: round(ft.base * b[3] + rnd() * 1800, 100),
        img: { kind: ft.kind, color: color },
        attrs: {
          'Бренд': b[1], 'Назначение': ft.t, 'Цвет': color,
          'Материал корпуса': pick(['латунь', 'латунь', 'нержавеющая сталь']),
          'Картридж': pick(['керамический 35 мм', 'керамический 40 мм']),
          'Монтаж': ft.kind === 'faucet-bath' ? 'настенный' : ft.kind === 'shower' ? 'настенный' : 'на мойку / раковину',
          'Гарантия': b[1] === 'G-Lauf' ? '5 лет' : '3 года',
        },
        keywords: 'смеситель кран ' + ft.kw + ' ' + (b[1] === 'FRAP' ? 'фрап frap' : 'джи лауф глауф g lauf glauf'),
      });
    }
  });

  // ---------- Радиаторы стальные ----------
  const radTypes = [{ t: '11', w: 1050 }, { t: '22', w: 1720 }, { t: '33', w: 2450 }];
  const radRows = [];
  [500, 300].forEach(function (h) { radTypes.forEach(function (rt) { [600, 800, 1000, 1200, 1600].forEach(function (l) { radRows.push({ h: h, l: l, rt: rt }); }); }); });
  for (let i = 0; i < 16; i++) {
    const r = radRows[(i * 7) % radRows.length];
    const conn = i % 3 === 0 ? 'нижнее' : 'боковое';
    const power = Math.round(r.rt.w * (r.l / 1000) * (r.h === 300 ? 0.66 : 1) / 10) * 10;
    add('radiatory', {
      type: 'Тип ' + r.rt.t + (conn === 'нижнее' ? ' · нижнее подключение' : ''),
      name: 'Радиатор стальной панельный тип ' + r.rt.t + ', ' + r.h + '×' + r.l + ' мм, ' + conn + ' подключение',
      price: round(1400 + power * 3.1 * (conn === 'нижнее' ? 1.15 : 1), 100),
      img: { kind: 'radiator', color: 'белый', h: r.h, l: r.l, panels: +r.rt.t[0] },
      attrs: {
        'Тип': r.rt.t, 'Высота': r.h + ' мм', 'Длина': r.l + ' мм', 'Подключение': conn,
        'Мощность (ΔT 70 °C)': power + ' Вт', 'Отапливаемая площадь': '≈ ' + Math.round(power / 100) + ' м²',
        'Рабочее давление': '10 бар', 'Цвет': 'белый RAL 9016',
      },
      keywords: 'батарея отопления панельный радиатор ' + r.h + 'x' + r.l + ' ' + r.h + '*' + r.l,
    });
  }

  // ---------- Комплектующие для радиаторов ----------
  [
    ['Кронштейн для стального радиатора, комплект 2 шт.', 'Крепления', 'bracket', 290],
    ['Кронштейн напольный для панельного радиатора, комплект', 'Крепления', 'bracket', 690],
    ['Кран Маевского 1/2" для радиатора', 'Воздухоотводчики', 'mayevsky', 120],
    ['Воздухоотводчик автоматический 1/2"', 'Воздухоотводчики', 'mayevsky', 450],
    ['Клапан термостатический прямой 1/2"', 'Клапаны и термостаты', 'thermovalve', 990],
    ['Клапан термостатический угловой 1/2"', 'Клапаны и термостаты', 'thermovalve', 990],
    ['Термоголовка жидкостная M30×1,5', 'Клапаны и термостаты', 'thermohead', 1290],
    ['Узел нижнего подключения радиатора, угловой 3/4"', 'Узлы подключения', 'valve-bottom', 1690],
    ['Узел нижнего подключения радиатора, прямой 3/4"', 'Узлы подключения', 'valve-bottom', 1590],
    ['Комплект заглушек и переходников для радиатора 1/2"', 'Заглушки', 'plugs', 390],
    ['Клапан запорный радиаторный угловой 1/2"', 'Клапаны и термостаты', 'thermovalve', 690],
    ['Ключ для крана Маевского', 'Крепления', 'mayevsky', 60],
  ].forEach(function (c) {
    add('komplektuyushchie', {
      type: c[1], name: c[0], price: c[3],
      img: { kind: c[2], color: 'белый' },
      attrs: { 'Группа': c[1], 'Присоединение': (c[0].match(/\d\/\d"|3\/4"|M30×1,5/) || ['—'])[0], 'Материал': pick(['никелированная латунь', 'сталь, порошковая окраска', 'латунь']) },
      keywords: 'батарея радиатор комплектующие фурнитура ' + (c[2] === 'mayevsky' ? 'воздух спуск маевский' : ''),
    });
  });

  // ---------- Valtec ----------
  [
    ['Кран шаровой VALTEC BASE 1/2" ВР-ВР, бабочка', 'Краны шаровые', 'valve', 'красный', 390],
    ['Кран шаровой VALTEC BASE 3/4" ВР-НР, рычаг', 'Краны шаровые', 'valve', 'красный', 590],
    ['Кран шаровой VALTEC 1/2" с американкой, бабочка', 'Краны шаровые', 'valve', 'желтый', 640],
    ['Кран шаровой VALTEC 1" ВР-ВР, рычаг', 'Краны шаровые', 'valve', 'красный', 990],
    ['Коллектор VALTEC 3/4" на 3 выхода 1/2"', 'Коллекторы', 'collector', 'латунь', 1490],
    ['Коллектор VALTEC 1" на 4 выхода 3/4" с кранами', 'Коллекторы', 'collector', 'латунь', 3890],
    ['Труба металлопластиковая VALTEC 16×2,0 мм, бухта 100 м', 'Трубы', 'pipe', 'белый', 9900],
    ['Труба металлопластиковая VALTEC 20×2,0 мм, бухта 100 м', 'Трубы', 'pipe', 'белый', 13900],
    ['Фильтр сетчатый косой VALTEC 1/2"', 'Фильтры', 'filter', 'латунь', 490],
    ['Клапан обратный пружинный VALTEC 1/2"', 'Клапаны', 'checkvalve', 'латунь', 420],
    ['Редуктор давления VALTEC 1/2" с манометром', 'Клапаны', 'reducer', 'латунь', 3290],
    ['Угольник пресс VALTEC 16×16 мм', 'Фитинги', 'fitting', 'латунь', 230],
    ['Тройник пресс VALTEC 16×16×16 мм', 'Фитинги', 'fitting-tee', 'латунь', 340],
    ['Подводка гибкая для воды VALTEC 1/2" ГШ, 50 см', 'Подводка', 'hose', 'сталь', 290],
    ['Подводка гибкая для воды VALTEC 1/2" ГГ, 80 см', 'Подводка', 'hose', 'сталь', 360],
    ['Клапан термостатический смесительный VALTEC 3/4"', 'Клапаны', 'reducer', 'латунь', 4590],
  ].forEach(function (v) {
    add('valtec', {
      brand: 'VALTEC', type: v[1], name: v[0], price: v[4],
      img: { kind: v[2], color: v[3] },
      attrs: { 'Бренд': 'VALTEC', 'Группа': v[1], 'Присоединение': (v[0].match(/\d\/\d"|1"|3\/4"|\d+×[\d,]+ мм|\d+×\d+(×\d+)? мм/) || ['—'])[0], 'Страна бренда': 'Италия / Россия' },
      keywords: 'валтек вальтек valtec валтэк сантехника ' + (v[1] === 'Краны шаровые' ? 'кран шаровый запорный' : ''),
    });
  });

  // ---------- Реальные фото (раскладка по каталогам) ----------
  // photo — основное фото, photo2 — второй кадр при наведении. Без фото остаётся SVG-иллюстрация.
  // В рабочей версии фото приходят из карточек товаров Битрикса.
  const PHOTOS = [
    { cat: ['frap'], re: /^Смеситель для раковины/, color: ['черный матовый', 'графит'], photo: 'img/frap-basin-black.webp' },
    { cat: ['radiatory'], re: /^Радиатор стальной панельный/, photo: 'img/radiator-panel.webp' },
    { cat: ['moyki'], re: /искусственного камня/, color: ['черный', 'графит'], photo: 'img/sink-stone-black.webp' },
    { cat: ['g-lauf', 'frap'], re: /^Смеситель для кухни/, color: 'хром', photo: 'img/faucet-kitchen-pullout.webp' },
    { cat: ['valtec'], re: /^Коллектор/, photo: 'img/valtec-collector.webp', photo2: 'img/valtec-collector-detail.webp', photo2Full: true },
    { cat: ['komplektuyushchie'], re: /^Термоголовка|^Клапан термостатический угловой/, photo: 'img/thermohead-valve.webp' },
    { cat: ['komplektuyushchie'], re: /^Комплект заглушек|^Кронштейн для стального/, photo: 'img/radiator-kit.webp' },
  ];
  PRODUCTS.forEach(function (p) {
    const m = PHOTOS.find(function (x) { return x.cat.includes(p.cat) && x.re.test(p.name) && (!x.color || [].concat(x.color).includes(p.img.color)); });
    if (m) { p.img.photo = m.photo; if (m.photo2) p.img.photo2 = m.photo2; if (m.photo2Full) p.img.photo2Full = true; }
  });
  // Обложки разделов
  const COVERS = { 'moyki': 'img/sink-stone-black.webp', 'radiatory': 'img/radiator-panel.webp', 'frap': 'img/frap-basin-black.webp', 'g-lauf': 'img/faucet-kitchen-pullout.webp', 'komplektuyushchie': 'img/thermohead-valve.webp', 'valtec': 'img/valtec-collector.webp' };
  CATEGORIES.forEach(function (c) { if (COVERS[c.slug]) c.img = Object.assign({}, c.img, { photo: COVERS[c.slug] }); });

  // ---------- Хиты продаж на главной: товары, порядок и фото задаются вручную ----------
  // photo — основное фото, photo2 — второй кадр при наведении.
  const HITS = [
    { id: 102, photo: 'img/sink-stone-black.webp', photo2: 'img/hit1-sink-steel.webp' },
    { id: 132, photo: 'img/frap-basin-black.webp', photo2: 'img/hit2-frap-interior.webp', photo2Full: true },
    { id: 147, photo: 'img/radiator-panel.webp', photo2: 'img/hit3-radiator-long.webp' },
    { id: 178, photo: 'img/valtec-collector.webp', photo2: 'img/valtec-collector-detail.webp', photo2Full: true },
    { id: 118, photo: 'img/hit5-glauf-filter.webp', photo2: 'img/hit5-glauf-interior.webp', photo2Full: true, color: 'хром' },
  ];
  HITS.forEach(function (h) {
    const p = PRODUCTS.find(function (x) { return x.id === h.id; });
    if (!p) return;
    p.hit = true;
    if (h.color) {
      p.name = p.name.replace(p.attrs['Цвет'], h.color);
      p.attrs['Цвет'] = h.color;
      p.img = Object.assign({}, p.img, { color: h.color });
    }
    p.img = Object.assign({}, p.img, { photo: h.photo, photo2: h.photo2, photo2Full: !!h.photo2Full });
  });

  window.SHOP = { CATEGORIES: CATEGORIES, PRODUCTS: PRODUCTS, HITS: HITS.map(function (h) { return h.id; }) };
})();
