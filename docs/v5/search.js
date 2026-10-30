/* Умный поиск по каталогу.
   Что умеет:
   1. Неправильная раскладка: «cvtcbntkm» → «смеситель», «ьщнлф» → «мойка».
   2. Опечатки: «смеситль», «радиатр», «вальтек».
   3. Транслит и бренды по-русски: «фрап» → FRAP, «валтек» → VALTEC, «джи лауф» → G-Lauf.
   4. Синонимы: «батарея» = радиатор, «раковина на кухню» = мойка, «кран» = смеситель/шаровой кран.
   5. Поиск по началу слова (подсказки при вводе) и по артикулу.
   6. Размеры в любом виде: «500х1000», «500*1000», «500 1000».
   Работает в браузере, без сервера. В Битриксе тот же алгоритм ставится в обработчик
   компонента поиска или на сторону Elasticsearch/Manticore. */
(function () {
  'use strict';

  // ---------- Раскладка ----------
  const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
  const RU = 'йцукенгшщзхъфывапролджэячсмитьбюё';
  const en2ru = {}, ru2en = {};
  for (let i = 0; i < EN.length; i++) { en2ru[EN[i]] = RU[i]; ru2en[RU[i]] = EN[i]; }
  const swapLayout = (s, map) => s.split('').map((c) => map[c] || c).join('');

  // ---------- Транслит (рус → лат) для брендов ----------
  const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  const translit = (s) => s.split('').map((c) => (TR[c] !== undefined ? TR[c] : c)).join('');

  // ---------- Синонимы: слово запроса → какими словами оно может быть в товаре ----------
  const SYN = {
    'батарея': ['радиатор'], 'батареи': ['радиатор'], 'батарейка': ['радиатор'], 'отопление': ['радиатор'],
    'раковина': ['мойка', 'раковина'], 'мойку': ['мойка'], 'мойки': ['мойка'],
    'кран': ['смеситель', 'кран'], 'краны': ['смеситель', 'кран'], 'смесители': ['смеситель'],
    'нержавейка': ['нержавеющая'], 'нерж': ['нержавеющая'],
    'камень': ['камня', 'камень'], 'каменная': ['камня'], 'кварц': ['камня'], 'гранит': ['камня'],
    'лейка': ['лейкой', 'душем', 'душ'], 'душ': ['душем', 'душевая', 'душ'],
    'маевского': ['маевского', 'воздухоотводчик'], 'маевский': ['маевского'], 'воздушник': ['воздухоотводчик', 'маевского'],
    'термоголовка': ['термоголовка'], 'термостат': ['термостатический', 'термоголовка'],
    'шланг': ['подводка'], 'подводка': ['подводка'], 'гибкая': ['гибкая'],
    'металлопластик': ['металлопластиковая'], 'мп': ['металлопластиковая'], 'труба': ['труба'], 'трубы': ['труба'],
    'черный': ['черный'], 'чёрный': ['черный'], 'черные': ['черный'], 'хромированный': ['хром'],
    'американка': ['американкой'], 'американкой': ['американкой'],
    'полдюйма': ['1/2"'], 'дюйм': ['1"'],
  };
  // Бренды по-русски и в искажённом виде → токен бренда
  const BRAND = {
    'фрап': 'frap', 'фрапп': 'frap', 'frap': 'frap',
    'валтек': 'valtec', 'вальтек': 'valtec', 'валтэк': 'valtec', 'valtek': 'valtec', 'valtec': 'valtec', 'вальтэк': 'valtec',
    'глауф': 'glauf', 'гелауф': 'glauf', 'лауф': 'glauf', 'glauf': 'glauf', 'lauf': 'glauf', 'g-lauf': 'glauf',
  };

  // ---------- Нормализация ----------
  function norm(s) {
    return String(s).toLowerCase().replace(/ё/g, 'е')
      .replace(/(\d)\s*[x×х*]\s*(?=\d)/g, '$1 ')   // 500х1000 / 500*1000 → 500 1000
      .replace(/(\d),(\d)/g, '$1.$2')
      .replace(/[«»"()\[\],.;:!?+]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  const ENDINGS = /(ами|ями|ого|его|ому|ему|ыми|ими|ая|яя|ое|ее|ой|ей|ий|ый|ые|ие|ую|юю|ам|ям|ах|ях|ом|ем|ов|ев|ы|и|а|я|у|ю|е|о)$/;
  function stem(w) {
    if (w.length <= 4 || /\d/.test(w)) return w;
    return w.replace(ENDINGS, '');
  }

  // Ограниченное расстояние Дамерау–Левенштейна (с перестановкой соседних букв)
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let rowMin = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
        cur[j] = v;
        if (v < rowMin) rowMin = v;
      }
      if (rowMin > max) return max + 1;
      prev2 = prev; prev = cur;
    }
    return prev[b.length];
  }
  const allowed = (len) => (len <= 3 ? 0 : len <= 6 ? 1 : 2);
  // Служебные слова не участвуют в поиске
  const STOP = new Set(['на', 'для', 'с', 'со', 'в', 'во', 'и', 'по', 'от', 'к', 'из', 'мм', 'см', 'шт']);

  // ---------- Индекс ----------
  let INDEX = [];
  let VOCAB = new Set();
  function build(products, categories) {
    const catName = {};
    categories.forEach((c) => (catName[c.slug] = c.name));
    INDEX = products.map((p) => {
      const text = norm([p.name, p.brand, catName[p.cat], p.type, p.sku, Object.values(p.attrs).join(' '), p.keywords].join(' '));
      const words = text.split(' ');
      const toks = new Set();
      words.forEach((w) => {
        toks.add(w); toks.add(stem(w));
        if (/[а-я]/.test(w)) toks.add(translit(w));
        if (BRAND[w]) toks.add(BRAND[w]);
        w.split(/[-/]/).forEach((part) => part && toks.add(part));
      });
      if (p.brand) toks.add(p.brand.toLowerCase().replace(/[^a-z]/g, ''));
      toks.add(p.sku.toLowerCase());
      const arr = Array.from(toks).filter(Boolean);
      arr.forEach((t) => VOCAB.add(t));
      return { p: p, toks: arr, name: norm(p.name) };
    });
  }

  // Насколько одно слово запроса совпадает с товаром: 0 — нет совпадения
  function tokenScore(q, entry) {
    const variants = [q, stem(q)];
    if (BRAND[q]) variants.push(BRAND[q]);
    if (SYN[q]) SYN[q].forEach((s) => { variants.push(s); variants.push(stem(s)); });
    if (/[а-я]/.test(q)) variants.push(translit(q));
    let best = 0;
    for (const v of variants) {
      for (const t of entry.toks) {
        if (t === v) return 10;
        if (v.length >= 2 && t.startsWith(v)) best = Math.max(best, 7);
        else if (best < 4 && !/[\d\-\/"]/.test(v)) {
          const a = allowed(v.length);
          if (a && t.length >= v.length - 1) {
            // опечатка в целом слове или в начале длинного слова (подсказки при вводе)
            if (dist(v, t, a) <= a || (t.length > v.length && dist(v, t.slice(0, v.length), a) <= a)) best = 4;
          }
        }
      }
    }
    return best;
  }

  function run(query) {
    const q = norm(query);
    if (!q) return { items: [], tokens: [] };
    const tokens = q.split(' ').filter((t) => t.length > 0 && !STOP.has(t));
    const results = [];
    for (const e of INDEX) {
      let sum = 0, matched = 0;
      for (const t of tokens) {
        const s = tokenScore(t, e);
        if (s) { matched++; sum += s; }
      }
      if (!matched) continue;
      // Фраза целиком в названии — выше в выдаче
      if (e.name.includes(q)) sum += 8;
      if (e.p.stock > 0) sum += 1;
      results.push({ p: e.p, score: sum, full: matched === tokens.length, matched: matched });
    }
    const full = results.filter((r) => r.full);
    const list = full.length ? full : results.filter((r) => r.matched >= Math.ceil(tokens.length / 2));
    list.sort((a, b) => b.score - a.score || (b.p.hit - a.p.hit));
    return { items: list.map((r) => r.p), partial: !full.length && list.length > 0, tokens: tokens };
  }

  // Доля слов запроса, похожих на настоящие слова каталога — чтобы выбрать раскладку
  function vocabHits(q) {
    const toks = norm(q).split(' ').filter(Boolean);
    if (!toks.length) return 0;
    let hit = 0;
    for (const t of toks) {
      if (VOCAB.has(t) || BRAND[t] || SYN[t]) { hit++; continue; }
      for (const v of VOCAB) { if (v.startsWith(t) && t.length >= 2) { hit++; break; } }
    }
    return hit / toks.length;
  }

  /* Главная функция. Возвращает:
     items — найденные товары (по релевантности);
     fixed — запрос, исправленный по раскладке (если исправляли);
     partial — true, если нашлись только частичные совпадения. */
  function search(query) {
    const raw = String(query || '').toLowerCase();
    let res = run(raw);
    let fixed = null;
    const isLat = /[a-z]/.test(raw) && !/[а-я]/.test(raw);
    const isCyr = /[а-я]/.test(raw) && !/[a-z]/.test(raw);
    const alt = isLat ? swapLayout(raw, en2ru) : isCyr ? swapLayout(raw, ru2en) : null;
    if (alt && alt !== raw) {
      const h0 = vocabHits(raw), h1 = vocabHits(alt);
      if (h1 > h0 || (!res.items.length && h1 > 0)) {
        const r2 = run(alt);
        if (r2.items.length) { res = r2; fixed = alt; }
      }
    }
    return { items: res.items, fixed: fixed, partial: !!res.partial };
  }

  window.ShopSearch = { build: build, search: search, norm: norm };
})();
