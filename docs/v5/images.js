/* Иллюстрации товаров в SVG (рисуются кодом, без внешних файлов).
   В рабочей версии заменяются фото из Битрикса: product.img → URL картинки. */
(function () {
  'use strict';

  // Цвет покрытия → [светлый, основной, тёмный]
  const FINISH = {
    'хром': ['#f4f6f8', '#c3c9cf', '#7d858d'],
    'сталь': ['#eef0f2', '#b9bfc5', '#7a8188'],
    'сатин': ['#e9e6e1', '#bdb7ad', '#857f75'],
    'декор': ['#f0f1f2', '#c6cbd0', '#8a9097'],
    'черный матовый': ['#5a5a5c', '#2f2f31', '#161617'],
    'черный': ['#545456', '#2c2c2e', '#151516'],
    'графит': ['#727276', '#4a4a4e', '#2a2a2d'],
    'серый': ['#b9bbbd', '#8f9295', '#636669'],
    'белый': ['#ffffff', '#ecebe8', '#c4c2bd'],
    'бежевый': ['#efe3cf', '#d6c3a3', '#a8946f'],
    'песочный': ['#e6d6b6', '#c8b086', '#96805a'],
    'бронза': ['#c9a47a', '#8c6a43', '#5b4327'],
    'золото': ['#f3dc9c', '#c9a24a', '#8f6e22'],
    'латунь': ['#f1d99a', '#c8a44c', '#8d7024'],
    'красный': ['#ff7a6e', '#e2382b', '#a3221a'],
    'желтый': ['#ffe27a', '#f2c230', '#b88e10'],
  };
  const fin = (c) => FINISH[c] || FINISH['хром'];

  let uid = 0;
  function grad(c, dir) {
    const id = 'g' + (++uid);
    const [l, m, d] = fin(c);
    const xy = dir === 'v' ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="0" y1="0" x2="1" y2="0"';
    return { id: id, def: '<linearGradient id="' + id + '" ' + xy + '><stop offset="0" stop-color="' + d + '"/><stop offset=".35" stop-color="' + l + '"/><stop offset=".7" stop-color="' + m + '"/><stop offset="1" stop-color="' + d + '"/></linearGradient>' };
  }
  const shadow = (cx, cy, rx) => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + Math.round(rx / 7) + '" fill="#000" opacity=".08"/>';

  const DRAW = {
    'sink-stone': function (o) { return sink(o, false); },
    'sink-steel': function (o) { return sink(o, true); },

    'faucet-kitchen': function (o) {
      const g = grad(o.color);
      const [, m, d] = fin(o.color);
      return '<defs>' + g.def + '</defs>' + shadow(200, 352, 90) +
        '<rect x="160" y="320" width="80" height="30" rx="8" fill="' + m + '"/>' +
        '<rect x="180" y="150" width="40" height="175" rx="18" fill="url(#' + g.id + ')"/>' +
        '<path d="M200 160 C200 60 320 50 320 140 L320 175" fill="none" stroke="url(#' + g.id + ')" stroke-width="22" stroke-linecap="round"/>' +
        '<rect x="306" y="168" width="28" height="30" rx="6" fill="' + d + '"/>' +
        '<path d="M222 230 L290 205" stroke="' + m + '" stroke-width="12" stroke-linecap="round"/>';
    },
    'faucet-basin': function (o) {
      const g = grad(o.color);
      const [, m, d] = fin(o.color);
      return '<defs>' + g.def + '</defs>' + shadow(200, 352, 80) +
        '<rect x="160" y="325" width="80" height="25" rx="8" fill="' + m + '"/>' +
        '<rect x="170" y="190" width="60" height="140" rx="24" fill="url(#' + g.id + ')"/>' +
        '<path d="M200 230 L300 232 Q312 233 312 245 L312 255" fill="none" stroke="url(#' + g.id + ')" stroke-width="20" stroke-linecap="round"/>' +
        '<rect x="300" y="252" width="24" height="12" rx="4" fill="' + d + '"/>' +
        '<path d="M200 192 L150 140" stroke="' + m + '" stroke-width="14" stroke-linecap="round"/>';
    },
    'faucet-bath': function (o) {
      const g = grad(o.color, 'v');
      const [l, m, d] = fin(o.color);
      return '<defs>' + g.def + '</defs>' + shadow(200, 340, 120) +
        '<rect x="80" y="150" width="30" height="40" rx="6" fill="' + d + '"/><rect x="290" y="150" width="30" height="40" rx="6" fill="' + d + '"/>' +
        '<rect x="96" y="140" width="208" height="60" rx="28" fill="url(#' + g.id + ')"/>' +
        '<path d="M200 195 L200 250 Q200 262 212 262 L250 262" fill="none" stroke="url(#' + g.id + ')" stroke-width="22" stroke-linecap="round"/>' +
        '<path d="M200 140 L240 100" stroke="' + m + '" stroke-width="14" stroke-linecap="round"/>' +
        '<path d="M110 200 C60 280 140 320 180 300" fill="none" stroke="' + l + '" stroke-width="8" stroke-dasharray="3 3"/>' +
        '<path d="M110 200 C60 280 140 320 180 300" fill="none" stroke="' + m + '" stroke-width="2" opacity=".6"/>';
    },
    'shower': function (o) {
      const g = grad(o.color);
      const [, m, d] = fin(o.color);
      return '<defs>' + g.def + '</defs>' +
        '<rect x="188" y="70" width="18" height="250" rx="9" fill="url(#' + g.id + ')"/>' +
        '<path d="M197 76 L270 76" stroke="' + m + '" stroke-width="14" stroke-linecap="round"/>' +
        '<ellipse cx="290" cy="86" rx="62" ry="14" fill="' + m + '"/><ellipse cx="290" cy="90" rx="58" ry="9" fill="' + d + '" opacity=".5"/>' +
        '<rect x="140" y="300" width="114" height="44" rx="20" fill="url(#' + g.id + ')"/>' +
        '<circle cx="164" cy="322" r="11" fill="' + d + '"/><circle cx="230" cy="322" r="11" fill="' + d + '"/>' +
        '<rect x="214" y="150" width="20" height="64" rx="9" fill="' + m + '"/>';
    },
    'radiator': function (o) {
      const h = o.h || 500, l = o.l || 1000;
      const W = Math.min(330, 120 + l * 0.14), H = h === 300 ? 110 : 170;
      const x = 200 - W / 2, y = 205 - H / 2;
      const ribs = Math.round(W / 9);
      let s = '';
      for (let i = 1; i < ribs; i++) s += '<line x1="' + (x + i * W / ribs) + '" y1="' + (y + 10) + '" x2="' + (x + i * W / ribs) + '" y2="' + (y + H - 10) + '" stroke="#d5d3ce" stroke-width="2"/>';
      const depth = (o.panels || 2) * 5;
      return shadow(200, y + H + 22, W / 2 + 10) +
        '<rect x="' + (x + depth) + '" y="' + (y - depth / 2) + '" width="' + W + '" height="' + H + '" rx="5" fill="#dedcd7"/>' +
        '<rect x="' + x + '" y="' + y + '" width="' + W + '" height="' + H + '" rx="5" fill="#fbfaf8" stroke="#d5d3ce"/>' + s +
        '<rect x="' + x + '" y="' + y + '" width="' + W + '" height="12" rx="4" fill="#efeee9"/>' +
        '<rect x="' + (x + W - 26) + '" y="' + (y + H) + '" width="10" height="16" fill="#c9c7c1"/><rect x="' + (x + 16) + '" y="' + (y + H) + '" width="10" height="16" fill="#c9c7c1"/>';
    },
    'thermohead': function () {
      return shadow(200, 340, 70) +
        '<rect x="150" y="90" width="100" height="200" rx="40" fill="#fbfaf8" stroke="#d5d3ce" stroke-width="2"/>' +
        [120, 150, 180, 210, 240].map(function (yy, i) { return '<text x="200" y="' + (yy + 6) + '" text-anchor="middle" font-family="Arial" font-size="18" fill="#9a958c">' + (i + 1) + '</text>'; }).join('') +
        '<rect x="170" y="288" width="60" height="40" rx="6" fill="#c3c9cf"/><rect x="176" y="296" width="48" height="6" fill="#9aa1a8"/><rect x="176" y="310" width="48" height="6" fill="#9aa1a8"/>';
    },
    'thermovalve': function () {
      const g = grad('хром', 'v');
      return '<defs>' + g.def + '</defs>' + shadow(200, 320, 110) +
        '<rect x="90" y="210" width="220" height="56" rx="14" fill="url(#' + g.id + ')"/>' +
        '<rect x="175" y="130" width="50" height="90" rx="8" fill="url(#' + g.id + ')"/><rect x="168" y="112" width="64" height="26" rx="6" fill="#e9e6e1"/>' +
        '<rect x="70" y="220" width="30" height="36" rx="4" fill="#9aa1a8"/><rect x="300" y="220" width="30" height="36" rx="4" fill="#9aa1a8"/>';
    },
    'valve-bottom': function () {
      const g = grad('хром', 'v');
      return '<defs>' + g.def + '</defs>' + shadow(200, 330, 120) +
        '<rect x="90" y="180" width="220" height="70" rx="16" fill="url(#' + g.id + ')"/>' +
        '<rect x="125" y="110" width="26" height="76" rx="6" fill="url(#' + g.id + ')"/><rect x="249" y="110" width="26" height="76" rx="6" fill="url(#' + g.id + ')"/>' +
        '<rect x="122" y="248" width="32" height="54" rx="6" fill="#9aa1a8"/><rect x="246" y="248" width="32" height="54" rx="6" fill="#9aa1a8"/>' +
        '<circle cx="200" cy="215" r="16" fill="#7d858d"/>';
    },
    'bracket': function () {
      return shadow(200, 330, 80) +
        '<path d="M150 90 L150 300 L250 300" fill="none" stroke="#e8e6e1" stroke-width="30" stroke-linejoin="round"/>' +
        '<path d="M150 90 L150 300 L250 300" fill="none" stroke="#c9c7c1" stroke-width="2"/>' +
        '<circle cx="150" cy="130" r="7" fill="#9a958c"/><circle cx="150" cy="220" r="7" fill="#9a958c"/>' +
        '<path d="M250 300 L250 250" stroke="#e8e6e1" stroke-width="26" stroke-linecap="round"/>';
    },
    'mayevsky': function () {
      const g = grad('хром', 'v');
      return '<defs>' + g.def + '</defs>' + shadow(200, 320, 70) +
        '<polygon points="160,190 240,190 255,230 240,270 160,270 145,230" fill="url(#' + g.id + ')"/>' +
        '<rect x="168" y="270" width="64" height="40" fill="#b9bfc5"/><rect x="168" y="278" width="64" height="5" fill="#8d949b"/><rect x="168" y="292" width="64" height="5" fill="#8d949b"/>' +
        '<rect x="186" y="140" width="28" height="52" rx="6" fill="#ecebe8" stroke="#c4c2bd"/><rect x="194" y="128" width="12" height="16" fill="#8d949b"/>';
    },
    'plugs': function () {
      return [[140, 200, '#ecebe8'], [260, 200, '#ecebe8'], [140, 290, '#c3c9cf'], [260, 290, '#c3c9cf']].map(function (p) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="38" fill="' + p[2] + '" stroke="#b5b2ab" stroke-width="2"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="16" fill="none" stroke="#9a958c" stroke-width="3"/>';
      }).join('') + '<circle cx="200" cy="110" r="28" fill="#ecebe8" stroke="#b5b2ab" stroke-width="2"/><rect x="192" y="102" width="16" height="16" fill="#9a958c"/>';
    },
    'valve': function (o) {
      const g = grad('латунь', 'v');
      const [, hm, hd] = fin(o.color);
      return '<defs>' + g.def + '</defs>' + shadow(200, 320, 120) +
        '<rect x="80" y="210" width="60" height="64" rx="6" fill="url(#' + g.id + ')"/><rect x="260" y="210" width="60" height="64" rx="6" fill="url(#' + g.id + ')"/>' +
        '<rect x="130" y="196" width="140" height="92" rx="34" fill="url(#' + g.id + ')"/>' +
        '<rect x="190" y="160" width="20" height="40" fill="#8d7024"/>' +
        '<path d="M200 165 L120 120 Q110 114 120 108 L200 150 L280 108 Q290 114 280 120 Z" fill="' + hm + '" stroke="' + hd + '" stroke-width="2"/>' +
        '<circle cx="200" cy="158" r="12" fill="' + hd + '"/>';
    },
    'collector': function () {
      const g = grad('латунь', 'v');
      let outs = '';
      for (let i = 0; i < 4; i++) outs += '<rect x="' + (112 + i * 50) + '" y="240" width="26" height="60" rx="5" fill="url(#' + g.id + ')"/><rect x="' + (110 + i * 50) + '" y="150" width="30" height="40" rx="5" fill="#2f6fd6"/>';
      return '<defs>' + g.def + '</defs>' + shadow(200, 330, 140) +
        '<rect x="70" y="185" width="260" height="60" rx="14" fill="url(#' + g.id + ')"/>' + outs +
        '<rect x="320" y="195" width="30" height="40" rx="4" fill="#a8892f"/>';
    },
    'pipe': function () {
      let s = '';
      for (let i = 0; i < 6; i++) s += '<circle cx="200" cy="200" r="' + (70 + i * 16) + '" fill="none" stroke="' + (i % 2 ? '#eeedea' : '#f9f9f7') + '" stroke-width="16"/>';
      return shadow(200, 360, 150) + s + '<circle cx="200" cy="200" r="150" fill="none" stroke="#d5d3ce" stroke-width="2"/><circle cx="200" cy="200" r="62" fill="none" stroke="#d5d3ce" stroke-width="2"/>' +
        '<path d="M330 260 L380 300" stroke="#f4f3f0" stroke-width="16" stroke-linecap="round"/>';
    },
    'filter': function () {
      const g = grad('латунь', 'v');
      return '<defs>' + g.def + '</defs>' + shadow(200, 320, 120) +
        '<rect x="80" y="160" width="240" height="60" rx="18" fill="url(#' + g.id + ')"/>' +
        '<path d="M200 200 L260 300" stroke="url(#' + g.id + ')" stroke-width="54" stroke-linecap="round"/>' +
        '<polygon points="250,300 290,280 300,316 262,330" fill="#a8892f"/>' +
        '<text x="200" y="198" text-anchor="middle" font-family="Arial" font-weight="700" font-size="22" fill="#6e5714">→</text>';
    },
    'checkvalve': function () {
      const g = grad('латунь', 'v');
      return '<defs>' + g.def + '</defs>' + shadow(200, 300, 120) +
        '<rect x="80" y="170" width="240" height="80" rx="20" fill="url(#' + g.id + ')"/>' +
        '<polygon points="80,160 110,160 110,260 80,260 70,210" fill="#a8892f"/><polygon points="320,160 290,160 290,260 320,260 330,210" fill="#a8892f"/>' +
        '<text x="200" y="220" text-anchor="middle" font-family="Arial" font-weight="700" font-size="34" fill="#6e5714">→</text>';
    },
    'reducer': function () {
      const g = grad('латунь', 'v');
      return '<defs>' + g.def + '</defs>' + shadow(200, 320, 120) +
        '<rect x="80" y="220" width="240" height="64" rx="16" fill="url(#' + g.id + ')"/>' +
        '<rect x="160" y="140" width="80" height="90" rx="12" fill="url(#' + g.id + ')"/>' +
        '<circle cx="200" cy="105" r="44" fill="#fff" stroke="#9aa1a8" stroke-width="6"/><path d="M200 105 L222 84" stroke="#e2382b" stroke-width="4" stroke-linecap="round"/>' +
        '<circle cx="200" cy="105" r="5" fill="#333"/>';
    },
    'fitting': function () {
      const g = grad('латунь', 'v');
      return '<defs>' + g.def + '</defs>' + shadow(200, 320, 100) +
        '<path d="M120 270 L200 270 Q230 270 230 240 L230 140" fill="none" stroke="url(#' + g.id + ')" stroke-width="56" stroke-linejoin="round"/>' +
        '<rect x="90" y="240" width="46" height="60" rx="6" fill="#d6d9dc"/><rect x="200" y="100" width="60" height="46" rx="6" fill="#d6d9dc"/>';
    },
    'fitting-tee': function () {
      const g = grad('латунь', 'v');
      return '<defs>' + g.def + '</defs>' + shadow(200, 320, 130) +
        '<rect x="110" y="230" width="180" height="56" rx="10" fill="url(#' + g.id + ')"/><rect x="172" y="150" width="56" height="90" rx="10" fill="url(#' + g.id + ')"/>' +
        '<rect x="74" y="228" width="46" height="60" rx="6" fill="#d6d9dc"/><rect x="280" y="228" width="46" height="60" rx="6" fill="#d6d9dc"/><rect x="170" y="112" width="60" height="46" rx="6" fill="#d6d9dc"/>';
    },
    'hose': function () {
      return shadow(200, 330, 130) +
        '<path d="M110 300 C80 120 320 80 290 260" fill="none" stroke="#9aa1a8" stroke-width="22" stroke-linecap="round"/>' +
        '<path d="M110 300 C80 120 320 80 290 260" fill="none" stroke="#e2e5e8" stroke-width="16" stroke-dasharray="4 3"/>' +
        '<rect x="92" y="290" width="36" height="34" rx="5" fill="#c8a44c"/><polygon points="272,250 308,250 314,272 302,290 278,290 266,272" fill="#c8a44c"/>';
    },
  };

  function sink(o, steel) {
    const g = grad(o.color, 'v');
    const [l, m, d] = fin(o.color);
    if (o.round) {
      return '<defs>' + g.def + '</defs>' + shadow(200, 345, 140) +
        '<circle cx="200" cy="200" r="140" fill="' + (steel ? 'url(#' + g.id + ')' : m) + '"/>' +
        '<circle cx="200" cy="205" r="108" fill="' + d + '" opacity=".55"/><circle cx="200" cy="205" r="14" fill="' + d + '"/><circle cx="200" cy="205" r="8" fill="' + l + '" opacity=".6"/>';
    }
    const bowls = o.double
      ? '<rect x="70" y="120" width="120" height="170" rx="22" fill="' + d + '" opacity=".55"/><rect x="200" y="120" width="130" height="170" rx="22" fill="' + d + '" opacity=".55"/><circle cx="130" cy="205" r="11" fill="' + d + '"/><circle cx="265" cy="205" r="11" fill="' + d + '"/>'
      : '<rect x="70" y="120" width="190" height="170" rx="26" fill="' + d + '" opacity=".55"/><circle cx="165" cy="205" r="13" fill="' + d + '"/>' +
        '<g opacity=".35">' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<rect x="278" y="' + (130 + i * 26) + '" width="44" height="10" rx="5" fill="' + d + '"/>'; }).join('') + '</g>';
    return '<defs>' + g.def + '</defs>' + shadow(200, 340, 160) +
      '<rect x="44" y="96" width="312" height="218" rx="22" fill="' + (steel ? 'url(#' + g.id + ')' : m) + '"/>' +
      '<rect x="44" y="96" width="312" height="218" rx="22" fill="none" stroke="' + l + '" stroke-opacity=".5" stroke-width="3"/>' + bowls +
      '<circle cx="320" cy="116" r="9" fill="' + d + '" opacity=".7"/>';
  }

  const cache = {};
  window.productImage = function (img) {
    if (img.photo) return img.photo; // реальное фото товара
    const key = JSON.stringify(img);
    if (cache[key]) return cache[key];
    const body = (DRAW[img.kind] || DRAW.valve)(img);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' + body + '</svg>';
    return (cache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  };

  // ---------- Второй кадр: товар в интерьере (показывается при наведении на карточку) ----------
  // В рабочей версии — второе фото товара из Битрикса (MORE_PHOTO).
  const SCENE_OF = {
    'sink-stone': 'kitchen', 'sink-steel': 'kitchen', 'faucet-kitchen': 'kitchen',
    'faucet-basin': 'bath', 'faucet-bath': 'bath', 'shower': 'bath',
    'radiator': 'room', 'thermohead': 'room', 'thermovalve': 'room', 'valve-bottom': 'room', 'bracket': 'room', 'mayevsky': 'room', 'plugs': 'room',
  };
  function tiles(x0, y0, w, h, tw, th, fill, line) {
    let s = '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="' + fill + '"/>';
    for (let x = x0 + tw; x < x0 + w; x += tw) s += '<line x1="' + x + '" y1="' + y0 + '" x2="' + x + '" y2="' + (y0 + h) + '" stroke="' + line + '" stroke-width="1.5"/>';
    for (let y = y0 + th; y < y0 + h; y += th) s += '<line x1="' + x0 + '" y1="' + y + '" x2="' + (x0 + w) + '" y2="' + y + '" stroke="' + line + '" stroke-width="1.5"/>';
    return s;
  }
  const SCENES = {
    // кухня: квадратная плитка + каменная столешница
    kitchen: () => tiles(0, 0, 400, 300, 50, 50, '#eef1ef', '#d9dfdc') +
      '<rect x="0" y="292" width="400" height="16" fill="#3b3d3f"/><rect x="0" y="308" width="400" height="92" fill="#cfc6b8"/>' +
      '<rect x="0" y="308" width="400" height="6" fill="#b9b0a2"/><line x1="200" y1="314" x2="200" y2="400" stroke="#b9b0a2" stroke-width="2"/>',
    // ванная: вытянутая плитка + светлый пол
    bath: () => tiles(0, 0, 400, 320, 100, 40, '#e3eaee', '#cbd6dc') +
      '<rect x="0" y="320" width="400" height="80" fill="#f4f2ee"/><rect x="0" y="320" width="400" height="4" fill="#d9d4cc"/>',
    // комната: окрашенная стена, подоконник, деревянный пол
    room: () => '<rect width="400" height="400" fill="#efe9df"/>' +
      '<rect x="50" y="0" width="300" height="70" fill="#dfe9ef"/><rect x="40" y="70" width="320" height="12" fill="#fbfaf7"/><rect x="40" y="82" width="320" height="4" fill="#d8d1c4"/>' +
      '<rect x="0" y="336" width="400" height="64" fill="#c9a77f"/>' + [0, 1, 2].map((i) => '<line x1="0" y1="' + (350 + i * 18) + '" x2="400" y2="' + (350 + i * 18) + '" stroke="#b8946b" stroke-width="2"/>').join('') +
      '<rect x="0" y="328" width="400" height="8" fill="#fbfaf7"/>',
    // техпомещение: бетон и трубы
    tech: () => '<rect width="400" height="400" fill="#dcdad6"/>' +
      '<rect x="0" y="40" width="400" height="14" fill="#9aa1a8"/><rect x="0" y="66" width="400" height="14" fill="#2f6fd6" opacity=".55"/><rect x="0" y="92" width="400" height="14" fill="#e2382b" opacity=".45"/>' +
      [70, 190, 310].map((x) => '<rect x="' + x + '" y="34" width="10" height="78" fill="#7d858d"/>').join('') +
      '<rect x="0" y="340" width="400" height="60" fill="#bdbab4"/>',
  };
  const cache2 = {};
  window.productImageAlt = function (img) {
    if (img.photo) return img.photo2 || ''; // у товара с фото — второе фото или ничего
    const key = JSON.stringify(img);
    if (cache2[key]) return cache2[key];
    const scene = SCENE_OF[img.kind] || 'tech';
    const body = (DRAW[img.kind] || DRAW.valve)(img);
    // товар уменьшен и поставлен на столешницу / к стене
    const place = scene === 'room' ? 'translate(70 90) scale(.68)' : scene === 'tech' ? 'translate(80 130) scale(.6)' : 'translate(70 52) scale(.68)';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' + SCENES[scene]() + '<g transform="' + place + '">' + body + '</g></svg>';
    return (cache2[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  };
})();
