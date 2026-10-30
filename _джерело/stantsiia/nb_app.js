/* Інтерактивна схема станції Нова Баварія: світлофори, маршрути, зустрічні маршрути, зайнятість колій */
(function(){
var D = window.NB_DATA, NS = "http://www.w3.org/2000/svg";
var root = document.getElementById("nbapp"); if (!root || !D) return;

/* ---------- кольори ---------- */
var COL = {b:"#3d9bff", r:"#e5534b", o:"#ff9b2f", k:"#bdbdbd"};
var LAMP = {r:"#ff2b2b", y:"#ffd000", g:"#21d24a", w:"#f4f4f4", b:"#3b6dff"};

/* ---------- граф ---------- */
var N = D.N, E = D.E, SIG = {}, SW = D.SW, SWN = {}, ENDS = {}, inc = {};
E.forEach(function(e){ (inc[e.a] = inc[e.a] || []).push(e); (inc[e.b] = inc[e.b] || []).push(e); });
D.S.forEach(function(s){ SIG[s.id] = s; s.cat = s.k === "m" ? "m" : "t"; });
var SIG_AT = {}; D.S.forEach(function(s){ SIG_AT[s.node] = s; });
for (var k in SW) SWN[SW[k].n] = k;
D.T.forEach(function(t){ ENDS[t.id] = t; });
var END_AT = {}; D.T.forEach(function(t){ END_AT[t.node] = t; });
function other(e, n){ return e.a === n ? e.b : e.a; }
function dirOf(e, n){ return other(e, n) === e.b ? 1 : -1; } /* +1 — від вузла праворуч */

/* ---------- стан ---------- */
var routes = [], occ = {}, mode = "sig", pick = null, cand = null, rid = 0, busy = {};

/* ---------- опис світлофорів ---------- */
var ASP = {
  "Ч":   {n:"Один червоний", m:"«Стій! Забороняється проїжджати сигнал»", lamps:["r"]},
  "Ж":   {n:"Один жовтий", m:"«Дозволяється рух з готовністю зупинитися; наступний світлофор закритий»", lamps:["y"]},
  "З":   {n:"Один зелений", m:"«Дозволяється рух із встановленою швидкістю»", lamps:["g"]},
  "Жм":  {n:"Один жовтий мигаючий", m:"«Дозволяється рух із встановленою швидкістю; наступний світлофор відкритий і вимагає проходження його із зменшеною швидкістю»", lamps:["y*"]},
  "2Ж":  {n:"Два жовті", m:"«Дозволяється проходження світлофора із зменшеною швидкістю та готовністю зупинитися біля наступного світлофора; поїзд прямує з відхиленням по стрілочному переводу»", lamps:["y","y"]},
  "Жм+Ж":{n:"Два жовті, верхній мигаючий", m:"«Дозволяється проходження світлофора із зменшеною швидкістю; поїзд прямує з відхиленням по стрілочному переводу; наступний світлофор відкритий»", lamps:["y*","y"]},
  "Ч+Бм":{n:"Червоний і місячно-білий мигаючий (запрошувальний сигнал)", m:"Дозволяється рух зі швидкістю не більше 20 км/год з особливою пильністю до наступного світлофора", lamps:["r","w*"]},
  "Д2Ж": {n:"Два жовті", m:"Дозволяється приймання поїзда з неправильної колії із зменшеною швидкістю та готовністю зупинитися біля вихідного світлофора", lamps:["y","y"]},
  "Бв":  {n:"Місячно-білий при погашеному червоному", m:"«Дозволяється проводити маневри»", lamps:["w"]},
  "Б":   {n:"Один місячно-білий", m:"«Дозволяється проводити маневри»", lamps:["w"]},
  "С":   {n:"Один синій", m:"«Забороняється проводити маневри»", lamps:["b"]}
};
var EN = "y,g|r,y|w", ON = {"Ч":"2","Ж":"0","З":"1","Жм":"0b","2Ж":"0,3","Жм+Ж":"0b,3","Ч+Бм":"2,4b","Бв":"4"};
function srSpec(s, a){
  if (s.k === "m") return {l:"w,b", on:a === "Б" ? "0" : "1", type:s.dw ? "dwarf" : ""};
  if (s.k === "ind") return {l:"y,r,y", on:a === "Ч" ? "1" : "0,2", type:s.dw ? "dwarf" : ""};
  return {l:EN, on:ON[a], type:s.dw ? "dwarf" : ""};
}
function aspList(s){
  if (s.k === "m") return ["С", "Б"];
  if (s.k === "ind") return ["Ч", "Д2Ж"];
  if (s.k === "in") return ["Ч", "Ж", "З", "Жм", "2Ж", "Жм+Ж", "Ч+Бм"];
  return ["Ч", "З", "Ж", "2Ж", "Жм+Ж", "Бв"];
}
function typeName(s){
  if (s.k === "in") return "Вхідний світлофор";
  if (s.k === "ind") return "Додатковий вхідний світлофор";
  if (s.k === "out") return "Вихідний світлофор";
  return "Маневровий світлофор";
}
function trackName(t){ return /^[IV]+$/.test(t) ? "колія " + t : "колія №" + t; }

/* ---------- пошук маршруту ---------- */
function sideEdges(n, d){ return (inc[n] || []).filter(function(e){ return dirOf(e, n) === d; }); }
/* всі шляхи від світлофора s у напрямку руху; train — поїзний (ігнорує маневрові) */
function explore(s, train, nostop){
  var d = s.d === "R" ? 1 : -1, res = [];
  (function go(n, path, nodes){
    sideEdges(n, d).forEach(function(e){
      var m = other(e, n), p2 = path.concat([e]), n2 = nodes.concat([m]);
      var sg = SIG_AT[m], t = END_AT[m];
      if (sg){
        var same = sg.d === s.d, counts = train ? sg.cat === "t" : true;
        res.push({end:sg, path:p2, nodes:n2, stop:same && counts});
        if (same && counts && !nostop) return;
      }
      if (t) res.push({end:t, path:p2, nodes:n2, stop:true, isEnd:true});
      if (n2.length < 80) go(m, p2, n2);
    });
  })(s.node, [], [s.node]);
  return res;
}
function swUse(path, nodes){
  var use = [];
  for (var i = 1; i < nodes.length - 1; i++){
    var k = SWN[nodes[i]]; if (!k) continue;
    var sw = SW[k], a = path[i - 1].id, b = path[i].id, br = a === sw.st ? b : a;
    use.push({k:k, pos:br === sw.pl ? "+" : "-"});
  }
  return use;
}
function devCount(u){ return u.filter(function(x){ return x.pos === "-"; }).length; }
/* варіанти від s до цілі; повертає найкращий (найменше відхилень, найкоротший) */
function variants(s, target){
  var train = s.cat === "t" && trainTarget(s, target);
  if ((s.k === "in" || s.k === "ind") && !train) return [];
  return explore(s, train).filter(function(r){ return r.end === target; }).map(function(r){
    r.sw = swUse(r.path, r.nodes); r.dev = devCount(r.sw); r.train = train; return r;
  }).sort(function(a, b){ return a.dev - b.dev || a.path.length - b.path.length; });
}
function trainTarget(s, t){
  if (!t || t.node == null || !SIG[t.id]) return false;
  if (s.k === "in" || s.k === "ind") return t.k === "out" && t.d === s.d;
  if (s.k === "out") return (t.k === "in" || t.k === "ind") && t.d !== s.d;
  return false;
}
function candidates(s){
  var list = explore(s, s.cat === "t" && s.k !== "out" ? true : false), out = {};
  list.forEach(function(r){
    var t = r.end, ok;
    if (s.k === "in" || s.k === "ind") ok = SIG[t.id] && t.k === "out" && t.d === s.d;
    else if (s.k === "out") ok = SIG[t.id] ? (trainTarget(s, t) || t.k === "m" || (t.d === s.d)) : true;
    else ok = true;
    if (ok && t.id !== s.id) out[t.id] = 1;
  });
  /* для вихідного шукаємо і поїзні кінці (повз маневрові) */
  if (s.k === "out") explore(s, true).forEach(function(r){ if (trainTarget(s, r.end)) out[r.end.id] = 1; });
  return out;
}

/* ---------- перевірки ---------- */
function edgeName(e){
  if (e.t) return trackName(e.t);
  if (e.ln) return "ділянка з боку " + LNG[e.ln];
  var a = SWN[e.a], b = SWN[e.b];
  if (a && b) return "ділянка між стрілками №" + a + " і №" + b;
  if (a || b) return "стрілочна ділянка біля стрілки №" + (a || b);
  return "ділянка колії";
}
var LNG = {"Новожанове":"Новожанового", "Рзд 6 км":"роз'їзду 6 км", "Харків-Пасажирський":"Харкова-Пасажирського", "Люботин":"Люботина", "Комунар, Люботин":"Комунара і Люботина", "Шпаківка":"Шпаківки"};
function rName(r){ return (r.train ? (r.s.k === "out" ? "відправлення" : "приймання") : "маневровий") + " " + r.s.id + " → " + r.t.id; }
function check(r){
  var why = [];
  r.path.forEach(function(e){ if (e.off) why.push("Колія №22 не діє (примітка 1 на схемі станції)."); });
  r.path.forEach(function(e){ if (occ[e.id]) why.push("Зайнята " + edgeName(e) + ". На зайняту ділянку маршрут не задається."); });
  routes.forEach(function(o){
    var shared = r.path.filter(function(e){ return o.edges[e.id]; });
    var swc = r.sw.filter(function(u){ return o.swp[u.k] && o.swp[u.k] !== u.pos; });
    if (swc.length) swc.forEach(function(u){
      why.push("Зустрічний маршрут: стрілка №" + u.k + " замкнена в маршруті " + rName(o) + " у положенні «" + (o.swp[u.k] === "+" ? "прямо" : "на відхилення") + "», а цьому маршруту потрібне «" + (u.pos === "+" ? "прямо" : "на відхилення") + "».");
    });
    if (shared.length){
      var names = {}; shared.forEach(function(e){ names[edgeName(e)] = 1; });
      why.push("Зустрічний маршрут: " + Object.keys(names).slice(0, 3).join(", ") + " вже замкнен" + (shared.length > 1 ? "і" : "а") + " в маршруті " + rName(o) + ".");
    }
  });
  return why.filter(function(x, i, a){ return a.indexOf(x) === i; });
}
function explainNo(s, t){
  if (t.id === s.id) return "Початок і кінець маршруту — один і той самий світлофор.";
  var all = explore(s, false, true), hit = all.filter(function(r){ return r.end === t; });
  if (!hit.length){
    var back = explore({node:s.node, d:s.d === "R" ? "L" : "R"}, false, true).some(function(r){ return r.end === t; });
    return back ? (SIG[t.id] ? "Світлофор " + t.id : "Кінець колії №" + t.t) + " знаходиться позаду світлофора " + s.id + ". Маршрут задається тільки в напрямку, для якого стоїть світлофор." :
                  "Колії від " + s.id + " до " + (SIG[t.id] ? "світлофора " + t.id : "кінця колії №" + t.t) + " не з'єднані стрілками в цьому напрямку.";
  }
  var r = hit[0], stopper = null;
  for (var i = 1; i < r.nodes.length - 1; i++){ var g = SIG_AT[r.nodes[i]]; if (g && g.d === s.d && (s.cat === "m" || g.cat === "t")){ stopper = g; break; } }
  if (s.k === "in" || s.k === "ind"){
    if (SIG[t.id] && t.k === "out" && t.d !== s.d) return "Маршрут приймання від " + s.id + " закінчується біля вихідного світлофора попутного напрямку на колії приймання, а " + t.id + " стоїть для руху назустріч. Оберіть світлофор " + (s.d === "R" ? "Н" : "Ч") + " на потрібній колії.";
    return "Від вхідного світлофора задається тільки маршрут приймання до вихідного світлофора на колії станції" + (stopper ? ". На шляху до " + t.id + " стоїть світлофор " + stopper.id + ", біля якого маршрут приймання закінчується." : ".");
  }
  if (stopper) return "Маршрут від " + s.id + " закінчується біля першого світлофора того самого напрямку, а це " + stopper.id + ". До " + (SIG[t.id] ? t.id : "кінця колії №" + t.t) + " задайте наступний маршрут від " + stopper.id + ".";
  return "Від " + s.id + " до " + t.id + " маршрут не задається.";
}

/* ---------- показання ---------- */
function routeFrom(s){ for (var i = 0; i < routes.length; i++) if (routes[i].s === s) return routes[i]; return null; }
function freeRoute(r){ return r.path.every(function(e){ return !occ[e.id]; }) && !r.passing; }
function aspect(s){
  var r = routeFrom(s);
  if (!r || !freeRoute(r)) return s.k === "m" ? "С" : "Ч";
  if (!r.train) return s.k === "m" ? "Б" : "Бв";
  if (s.k === "ind") return "Д2Ж";
  if (s.k === "in"){
    var nx = routeFrom(r.t), nOpen = nx && nx.train && freeRoute(nx);
    if (r.dev) return nOpen ? "Жм+Ж" : "2Ж";
    if (!nOpen) return "Ж";
    return nx.dev ? "Жм" : "З";
  }
  return r.dev ? "Жм+Ж" : "З";
}

/* ---------- SVG ---------- */
function el(tag, at, par){ var x = document.createElementNS(NS, tag); for (var k in at) x.setAttribute(k, at[k]); if (par) par.appendChild(x); return x; }
function pathD(p){ /* плавна крива через точки; дотичні не довші за третину відрізка */
  if (p.length < 3) return "M" + p.map(function(q){ return q[0] + " " + q[1]; }).join("L");
  function tan(i){ var a = p[i - 1] || p[i], c = p[i + 1] || p[i], dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }
  var d = "M" + p[0][0] + " " + p[0][1];
  for (var i = 0; i < p.length - 1; i++){
    var b = p[i], c = p[i + 1], L = Math.hypot(c[0] - b[0], c[1] - b[1]) / 3, t1 = tan(i), t2 = tan(i + 1);
    d += "C" + (b[0] + t1[0] * L).toFixed(1) + " " + (b[1] + t1[1] * L).toFixed(1) + " " + (c[0] - t2[0] * L).toFixed(1) + " " + (c[1] - t2[1] * L).toFixed(1) + " " + c[0] + " " + c[1];
  }
  return d;
}
function splitPoly(p, f){ /* частка f довжини */
  var L = 0, seg = []; for (var i = 1; i < p.length; i++){ var l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); seg.push(l); L += l; }
  var want = L * f, acc = 0;
  for (i = 0; i < seg.length; i++){ if (acc + seg[i] >= want){ var t = (want - acc) / seg[i], m = [p[i][0] + (p[i + 1][0] - p[i][0]) * t, p[i][1] + (p[i + 1][1] - p[i][1]) * t]; return [p.slice(0, i + 1).concat([m]), [m].concat(p.slice(i + 1))]; } acc += seg[i]; }
  return [p, [p[p.length - 1]]];
}
function splitX(p, x){ for (var i = 1; i < p.length; i++) if (p[i][0] >= x){ var t = (x - p[i - 1][0]) / (p[i][0] - p[i - 1][0] || 1), m = [x, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t]; return [p.slice(0, i).concat([m]), [m].concat(p.slice(i))]; } return [p, [p[p.length - 1]]]; }

var W0 = 2840, H0 = 860;
root.innerHTML =
  '<div class="nb-bar"><div class="nb-modes" role="tablist">' +
  '<button data-m="sig" class="on">Світлофори</button><button data-m="route">Маршрути</button><button data-m="occ">Зайнятість колій</button></div>' +
  '<div class="nb-zoom"><button data-z="-1" title="Зменшити">−</button><button data-z="1" title="Збільшити">+</button><button data-z="0">Уся схема</button><button data-fs="1">На весь екран</button></div></div>' +
  '<div class="nb-hint"></div><div class="nb-wrap"><svg class="nb-svg" viewBox="0 30 ' + W0 + ' ' + (H0 - 30) + '"></svg></div>' +
  '<div class="nb-panel"></div><div class="nb-routes"></div>';
var svg = root.querySelector("svg"), wrap = root.querySelector(".nb-wrap"), hint = root.querySelector(".nb-hint"), panel = root.querySelector(".nb-panel"), rlist = root.querySelector(".nb-routes");
var gDeco = el("g", {"class":"deco"}, svg), gTr = el("g", {"class":"trk"}, svg), gOv = el("g", {"class":"ov"}, svg), gGap = el("g", {}, svg), gTop = el("g", {"class":"deco2"}, svg), gSw = el("g", {"class":"swl"}, svg), gSig = el("g", {"class":"sigs"}, svg), gHit = el("g", {}, svg);

/* ---- оформлення, перенесене зі схеми ---- */
var X = window.NB_DECO;
X.rect.forEach(function(r){ el("rect", {x:r[0], y:r[1], width:r[2], height:r[3], "class":r[4] || "dk"}, gDeco); });
X.line.forEach(function(l){ el("path", {d:l[0], "class":l[1] || "dk"}, gDeco); });
/* колії */
E.forEach(function(e){
  var parts;
  if (e.c.indexOf("/") > 0){ var sp = splitPoly(e.p, .5), cc = e.c.split("/"); parts = [[sp[0], cc[0]], [sp[1], cc[1]]]; }
  else if (e.c.indexOf("|") > 0){ var sx = splitX(e.p, e.cx), c2 = e.c.split("|"); parts = [[sx[0], c2[0]], [sx[1], c2[1]]]; }
  else parts = [[e.p, e.c]];
  parts.forEach(function(q){ el("path", {d:pathD(q[0]), stroke:COL[q[1]], "class":"tl" + (e.pk ? " pk" : "") + (e.off ? " off" : "")}, gTr); });
  var hp = el("path", {d:pathD(e.p), "class":"hit-e"}, gHit); hp.dataset.e = e.id;
});
X.marks.forEach(function(m){
  el("path", {d:"M" + (m[1] - 5) + " " + (m[2] + 7) + "l7 -14M" + (m[1] + 1) + " " + (m[2] + 7) + "l7 -14", "class":"ij"}, gTop);
  if (m[0]) txt(m[0], m[1] + 12, m[2] + 18, 13, "sw");
});
X.arrows.forEach(function(a){ var x = a[0], y = a[1], d = a[2], L = 26, h = 7;
  el("path", {d:"M" + x + " " + y + "l" + (-d * L) + " " + (-h) + "v" + (2 * h) + "z", fill:a[3] === "r" ? "#e5534b" : "#d6d6d6", "class":"arw"}, gTop); });
X.zig.forEach(function(z){ el("path", {d:"M" + z[0] + " " + z[1] + "l9 -22l9 16l10 -30m-7 2l7 -2l1 7", "class":"zig"}, gTop); });
X.circ.forEach(function(c){ /* [x,y,r,тип,підпис,lx,ly] */
  if (c[3] === "f") el("circle", {cx:c[0], cy:c[1], r:c[2], "class":"cf"}, gTop);
  else if (c[3] === "h") el("circle", {cx:c[0], cy:c[1], r:c[2], "class":"co"}, gTop);
  else { el("circle", {cx:c[0], cy:c[1], r:c[2], "class":"co"}, gTop); el("circle", {cx:c[0], cy:c[1], r:c[2] * (c[3] === "d" ? .35 : .45), "class":c[3] === "d" ? "cf" : "co"}, gTop); }
  if (c[4]) txt(c[4], c[5], c[6], c[7] || 17, "lb b");
});
X.bump.forEach(function(b){ var s = b[2] === "L" ? 1 : -1;
  el("path", {d:"M" + (b[0] + 7 * s) + " " + (b[1] - 8) + "h" + (-7 * s) + "v16h" + (7 * s) + "M" + b[0] + " " + b[1] + "h" + (-6 * s), "class":"bmp"}, gTop); });
X.text.forEach(function(t){ var o = txt(t[0], t[1], t[2], t[3], t[4] || "lb", t[5]); if (t[6]) o.setAttribute("transform", "rotate(" + t[6] + " " + t[1] + " " + t[2] + ")"); });
X.tlab.forEach(function(t){ /* підписи колій у розриві ліній */
  el("rect", {x:t[1] - 76, y:t[2] - 15, width:152, height:30, "class":"tbg"}, gTop);
  txt(t[0], t[1], t[2] + 8, 23, "tlab", "middle");
});
function txt(s, x, y, size, cls, anchor){ var t = el("text", {x:x, y:y, "font-size":size, "class":cls || "lb", "text-anchor":anchor || "start"}, gTop); t.textContent = s; return t; }

/* номери стрілок */
for (var key in SW){ (function(k){
  var p = N[SW[k].n], o = X.swoff[k] || [0, -9], t = el("text", {x:p[0] + o[0], y:p[1] + o[1], "font-size":14, "class":"swn", "text-anchor":"middle"}, gSw); t.textContent = k;
})(key); }

/* світлофори */
var SG = {};
D.S.forEach(function(s){
  var g = el("g", {"class":"sg", tabindex:0, role:"button", "aria-label":typeName(s) + " " + s.id}, gSig); g.dataset.s = s.id; SG[s.id] = g;
});
/* скільки вільного місця від колії до сусідньої колії вгору (side -1) чи вниз (side 1) */
function freeAt(x, ty, side){
  var best = 999;
  E.forEach(function(e){ var p = e.p; for (var i = 1; i < p.length; i++){ var a = p[i - 1], b = p[i];
    if (a[0] === b[0] || x < Math.min(a[0], b[0]) || x > Math.max(a[0], b[0])) continue;
    var y = a[1] + (x - a[0]) / (b[0] - a[0]) * (b[1] - a[1]), d = (y - ty) * side; if (d > 3 && d < best) best = d; } });
  return best;
}

/* розміщення значків і назв світлофорів: значок стоїть з того боку колії, де його намальовано на плані, і не заходить на сусідню колію;
   назва ставиться туди, де вона не налазить на номери стрілок, написи, колії та інші світлофори */
var SH = 28.5; /* висота значка з відступом від колії при масштабі 1 */
function geomSig(s, side, k){
  var ty = N[s.node][1], HW = 12 * k, ST = 9.5 * k, hh = ST + HW, foot = 3 * k, gap = 4, total = hh + foot;
  var top = side > 0 ? ty + gap : ty - gap - total;
  return {HW:HW, ST:ST, R:4.3 * k, hh:hh, foot:foot, top:top, box:[s.sx - HW / 2 - 1, top, s.sx + HW / 2 + 1, top + total]};
}
function ovl(a, b){ var w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]); return w > 0 && h > 0 ? w * h : 0; }
function layoutSigs(){
  var obs = [], pts = [], heads = [];
  [gDeco, gTop, gSw].forEach(function(gg){ gg.querySelectorAll("text,circle,rect").forEach(function(t){
    try { var b = t.getBBox(); if (b.width && b.width < 300) obs.push([b.x, b.y, b.x + b.width, b.y + b.height]); } catch(e){}
  }); });
  E.forEach(function(e){ var p = e.p; for (var i = 1; i < p.length; i++){ var a = p[i - 1], b = p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 3));
    for (var j = 0; j <= n; j++) pts.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); } });
  function onTrack(r){ var c = 0; for (var i = 0; i < pts.length; i++){ var q = pts[i]; if (q[0] > r[0] - 2 && q[0] < r[2] + 2 && q[1] > r[1] - 2 && q[1] < r[3] + 2) c++; } return c; }
  function hitHeads(r, me){ var c = 0; heads.forEach(function(h){ if (h.s !== me) c += ovl(r, h.b); }); return c; }
  /* значки: спершу поїзні; спершу ті, кому вистачає місця на своєму боці */
  var order = D.S.filter(function(s){ return s.cat === "t"; }).concat(D.S.filter(function(s){ return s.cat !== "t"; }));
  function room(s, side){ return freeAt(s.sx, N[s.node][1], side); }
  function pref(s){ return s.sy >= N[s.node][1] ? 1 : -1; }
  var tight = [];
  order.forEach(function(s){ if (room(s, pref(s)) >= SH + 4.5){ s.side = pref(s); s.sc = 1; heads.push({s:s, b:geomSig(s, s.side, 1).box}); } else tight.push(s); });
  tight.forEach(function(s){
    var p = pref(s), fp = room(s, p), fo = room(s, -p), flip = geomSig(s, -p, 1).box, bad = hitHeads(flip, s);
    obs.forEach(function(o){ bad += ovl(flip, o); });
    if (fo >= SH + 4.5 && !bad){ s.side = -p; s.sc = 1; }
    else { s.side = p; s.sc = Math.max(.55, Math.min(1, (fp - 7) / (SH - 4))); }
    heads.push({s:s, b:geomSig(s, s.side, s.sc).box});
  });
  /* назви */
  var labs = [];
  order.forEach(function(s){
    var gm = geomSig(s, s.side, s.sc), big = s.cat === "t", fs = big ? 17 : 14, x = s.sx, f = s.d === "R" ? 1 : -1;
    var tt = el("text", {x:0, y:0, "font-size":fs, "class":"sgl" + (big ? " t" : "")}, gSig); tt.textContent = s.id; var bb = tt.getBBox(), w = bb.width, h = fs * .78; gSig.removeChild(tt);
    var b0 = gm.top, b1 = gm.top + gm.hh + gm.foot, mid = gm.top + gm.hh / 2, hx = gm.HW / 2 + 3;
    var c = [[x - f * hx, mid, f > 0 ? "end" : "start"], [x + f * hx, mid, f > 0 ? "start" : "end"],
             [x - f * hx, b0 + h / 2, f > 0 ? "end" : "start"], [x - f * hx, b1 - h / 2, f > 0 ? "end" : "start"],
             [x + f * hx, b0 + h / 2, f > 0 ? "start" : "end"], [x + f * hx, b1 - h / 2, f > 0 ? "start" : "end"],
             [x, s.side > 0 ? b1 + h / 2 + 3 : b0 - h / 2 - 3, "middle"]];
    var best = null;
    c.forEach(function(q, i){
      var x0 = q[2] === "end" ? q[0] - w : q[2] === "middle" ? q[0] - w / 2 : q[0], r = [x0, q[1] - h / 2, x0 + w, q[1] + h / 2], sc = i * 2;
      obs.forEach(function(o){ sc += ovl(r, o) * 3; }); sc += hitHeads(r, null) * 3 + onTrack(r) * 25;
      labs.forEach(function(o){ sc += ovl(r, o) * 3; });
      if (!best || sc < best.sc) best = {sc:sc, q:q, r:r};
    });
    labs.push(best.r); s.lpos = [best.q[0], best.q[1] + h / 2, best.q[2]];
  });
}
layoutSigs();
D.S.forEach(drawSig);
function drawSig(s){
  var g = SG[s.id]; while (g.firstChild) g.removeChild(g.firstChild);
  var a = aspect(s), lamps = ASP[a].lamps, x = s.sx, gm = geomSig(s, s.side, s.sc), top = gm.top, hh = gm.hh, HW = gm.HW;
  /* маленький плаский світлофор, як на іконках сайту: чорна голова-пігулка з двома лінзами, під нею щогла або основа карликового */
  var slots = s.cat === "m" ? (a === "Б" ? ["w", ""] : ["", "b"]) : [lamps[0], lamps[1] || ""];
  el("rect", {x:x - 16, y:top - 4, width:32, height:hh + gm.foot + 8, "class":"sg-hit"}, g);
  if (s.dw) el("path", {d:"M" + (x - HW / 2 + .5) + " " + (top + hh) + "h" + (HW - 1) + "l" + 2.5 * s.sc + " " + gm.foot + "h-" + (HW - 1 + 5 * s.sc) + "z", "class":"dwbase"}, g);
  else el("rect", {x:x - 1.6 * s.sc, y:top + hh - 2, width:3.2 * s.sc, height:gm.foot + 2, "class":"pole"}, g);
  el("rect", {x:x - HW / 2, y:top, width:HW, height:hh, rx:HW / 2, "class":"head" + (s.hollow ? " hol" : "")}, g);
  slots.forEach(function(c, i){
    var cy = top + HW / 2 + i * gm.ST;
    el("circle", {cx:x, cy:cy, r:gm.R, "class":"off"}, g);
    if (c) el("circle", {cx:x, cy:cy, r:gm.R, fill:LAMP[c[0]], "class":"lmp" + (c[1] ? " blink" : "")}, g);
  });
  var big = s.cat === "t", lp = s.lpos;
  var t = el("text", {x:lp[0], y:lp[1], "font-size":big ? 17 : 14, "text-anchor":lp[2], "class":"sgl" + (big ? " t" : "")}, g);
  t.textContent = s.id;
  g.classList.toggle("sel", pick === s); g.classList.toggle("cand", !!(cand && cand[s.id]));
}
/* кінці колій */
var TB = {};
D.T.forEach(function(t){ var p = N[t.node], b = el("rect", {x:p[0] - 9, y:p[1] - 9, width:18, height:18, rx:3, "class":"endb"}, gSig); b.dataset.t = t.id; TB[t.id] = b; });

/* ---------- накладки маршрутів і зайнятості ---------- */
function redraw(){
  while (gOv.firstChild) gOv.removeChild(gOv.firstChild);
  while (gGap.firstChild) gGap.removeChild(gGap.firstChild);
  var lockE = {};
  routes.forEach(function(r){ r.path.forEach(function(e){ lockE[e.id] = r; }); });
  E.forEach(function(e){
    if (occ[e.id]) el("path", {d:pathD(e.p), "class":"ov-occ"}, gOv);
    else if (lockE[e.id]) el("path", {d:pathD(e.p), "class":"ov-set" + (lockE[e.id].train ? "" : " sh")}, gOv);
  });
  /* стрілки в маршрутах: розрив на невикористаній гілці */
  routes.forEach(function(r){ r.sw.forEach(function(u){
    var sw = SW[u.k], off = E[u.pos === "+" ? sw.mi : sw.pl], n = sw.n, p = off.a === n ? off.p : off.p.slice().reverse(), sp = cut(p, 16);
    el("path", {d:pathD(sp), "class":"gap"}, gGap);
  }); });
  D.S.forEach(drawSig);
  for (var k in TB) TB[k].classList.toggle("cand", !!(cand && cand[k]));
  renderRoutes();
}
function cut(p, len){ /* відрізок гілки від 4 до len пікселів від стрілки */
  function at(d){ var acc = 0; for (var i = 1; i < p.length; i++){ var l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc + l >= d){ var t = (d - acc) / l; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t]; } acc += l; } return p[p.length - 1]; }
  return [at(4), at(len)];
}

/* ---------- панель ---------- */
function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function srHtml(s, a, big){ var q = srSpec(s, a); return '<span class="sr" data-l="' + q.l + '" data-on="' + q.on + '"' + (q.type ? ' data-type="' + q.type + '"' : "") + ' data-label="' + esc(s.id) + '" title="' + esc(ASP[a].n) + '"></span>'; }
function showSignal(s){
  var cur = aspect(s), r = routeFrom(s), where;
  var tr = trackOf(s);
  if (s.k === "in" || s.k === "ind") where = "Стоїть на вході на станцію з боку " + s.fr + (s.k === "ind" ? " і дозволяє приймання поїзда з неправильної колії" : "") + ".";
  else if (s.k === "out") where = "Стоїть на кінці колії " + (tr ? tr.replace("колія ", "") : "") + " і дозволяє відправлення поїзда " + (s.d === "R" ? "в бік Шпаківки, Люботина або Комунара" : "в бік Новожанового, роз'їзду 6 км або Харкова-Пасажирського") + ". Місячно-білий вогонь при погашеному червоному дозволяє маневри.";
  else where = (tr ? "Стоїть на " + (tr.indexOf("колія") === 0 ? "колії " + tr.replace("колія ", "") : tr) + ". " : "") + "Дозволяє або забороняє маневри " + (s.d === "R" ? "праворуч" : "ліворуч") + " за схемою.";
  var h = '<div class="nb-card"><div class="nb-card-h"><div class="nb-big">' + srHtml(s, cur) + '</div><div><h4>' + typeName(s) + ' ' + esc(s.id) + '</h4><p>' + where + (s.dw ? " Світлофор карликовий." : " Світлофор щогловий.") + '</p>' +
    '<p class="nb-now">Зараз: <b>' + ASP[cur].n.toLowerCase() + '</b>' + (r ? " (задано маршрут " + esc(rName(r)) + (freeRoute(r) ? "" : ", маршрут зайнятий, тому світлофор закритий") + ")" : ", маршрут від нього не задано") + '.</p></div></div>' +
    '<div class="nb-asp">' + aspList(s).map(function(a){ return '<div class="nb-a' + (a === cur ? " cur" : "") + '">' + srHtml(s, a) + '<div><b>' + ASP[a].n + '</b><span>' + ASP[a].m + '</span></div></div>'; }).join("") + '</div>' +
    (mode === "sig" ? '<p class="nb-tip">Щоб задати маршрут від цього світлофора, перейдіть у режим «Маршрути».</p>' : "") + '</div>';
  panel.innerHTML = h; if (window.UER_renderSignals) window.UER_renderSignals(panel);
}
function trackOf(s){ var es = inc[s.node] || []; for (var i = 0; i < es.length; i++) if (es[i].t) return trackName(es[i].t); for (i = 0; i < es.length; i++) if (es[i].ln) return "ділянці з боку " + LNG[es[i].ln]; return ""; }
function msg(kind, html){ panel.innerHTML = '<div class="nb-msg ' + kind + '">' + html + '</div>'; }

function renderRoutes(){
  if (!routes.length){ rlist.innerHTML = ""; return; }
  rlist.innerHTML = '<h4>Задані маршрути</h4>' + routes.map(function(r, i){
    var a = aspect(r.s);
    return '<div class="nb-r"><span class="nb-rn">' + esc(rName(r)) + '</span><span class="nb-ra">' + esc(r.s.id) + ': ' + ASP[a].n.toLowerCase() + '</span>' +
      '<button data-pass="' + r.id + '"' + (r.passing ? " disabled" : "") + '>Пропустити ' + (r.train ? "поїзд" : "состав") + '</button><button data-cancel="' + r.id + '"' + (r.passing ? " disabled" : "") + '>Скасувати</button></div>';
  }).join("") + '<button class="nb-all" data-cancel="all">Скасувати всі маршрути</button>';
}

/* ---------- дії ---------- */
function setHint(){
  hint.textContent = mode === "sig" ? "Натисніть на світлофор, щоб побачити його назву, тип і всі показання за ІСІ." :
    mode === "route" ? (pick ? "Початок маршруту: " + pick.id + ". Натисніть на підсвічений світлофор або кінець колії, де маршрут закінчується." : "Натисніть на світлофор, від якого починається маршрут: вхідний, вихідний або маневровий.") :
    "Натисніть на колію або ділянку, щоб зайняти її або звільнити. На зайняту ділянку маршрут не задається.";
}
function setMode(m){ mode = m; pick = null; cand = null; root.querySelectorAll(".nb-modes button").forEach(function(b){ b.classList.toggle("on", b.dataset.m === m); }); svg.classList.toggle("m-occ", m === "occ"); setHint(); redraw(); }
function clickSignal(s){
  if (mode === "sig" || mode === "occ"){ showSignal(s); return; }
  if (!pick){
    var ex = routeFrom(s);
    pick = s; cand = candidates(s); setHint(); redraw();
    var n = Object.keys(cand).length;
    if (!n) msg("warn", "Від світлофора <b>" + esc(s.id) + "</b> у цьому напрямку немає світлофора або кінця колії, до якого можна задати маршрут.");
    else msg("info", "Початок маршруту: <b>" + esc(s.id) + "</b> (" + typeName(s).toLowerCase() + "). Можливі кінці маршруту підсвічені: " + Object.keys(cand).map(function(k){ return SIG[k] ? k : "кінець колії №" + ENDS[k].t; }).join(", ") + "." + (ex ? " Від цього світлофора вже задано маршрут " + esc(rName(ex)) + "." : ""));
    return;
  }
  if (s === pick){ pick = null; cand = null; setHint(); redraw(); msg("info", "Вибір початку маршруту скасовано."); return; }
  finish(s);
}
function clickEnd(t){ if (mode !== "route" || !pick) return; finish(t); }
function finish(t){
  var s = pick, vs = variants(s, t), tname = SIG[t.id] ? t.id : "кінця колії №" + t.t;
  pick = null; cand = null; setHint();
  if (!vs.length){ redraw(); msg("bad", "<b>Маршрут " + esc(s.id) + " → " + esc(tname) + " неможливий.</b> " + esc(explainNo(s, t))); return; }
  if (routeFrom(s)){ redraw(); msg("bad", "<b>Від " + esc(s.id) + " вже задано маршрут " + esc(rName(routeFrom(s))) + ".</b> Спочатку скасуйте його."); return; }
  var why = check(Object.assign({}, vs[0], {s:s, t:t}));
  if (why.length){
    alt = null;
    for (var i = 1; i < vs.length; i++) if (!check(Object.assign({}, vs[i], {s:s, t:t})).length){ alt = {s:s, t:t, v:vs[i]}; break; }
    redraw();
    msg("bad", "<b>Маршрут " + esc(s.id) + " → " + esc(tname) + " задати не можна.</b><ul>" + why.map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
      (alt ? '<p class="nb-alt">Є обхідний варіант через стрілки ' + alt.v.sw.filter(function(u){ return u.pos === "-"; }).map(function(u){ return "№" + u.k; }).join(", ") + ' на відхилення. На пульт-табло його задають окремо, кнопками варіантного маршруту. <button data-alt="1">Задати обхідний варіант</button></p>' : ""));
    return;
  }
  setRoute(s, t, vs[0], vs.length);
}
var alt = null;
function setRoute(s, t, best, nv){
  var tname = SIG[t.id] ? t.id : "кінець колії №" + t.t;
  var r = {id:++rid, s:s, t:t, path:best.path, nodes:best.nodes, sw:best.sw, dev:best.dev, train:best.train, edges:{}, swp:{}};
  r.path.forEach(function(e){ r.edges[e.id] = 1; }); r.sw.forEach(function(u){ r.swp[u.k] = u.pos; });
  routes.push(r); redraw();
  var a = aspect(s), dev = r.sw.filter(function(u){ return u.pos === "-"; }).map(function(u){ return u.k; });
  msg("ok", "<b>Задано " + (r.train ? "поїзний" : "маневровий") + " маршрут " + esc(s.id) + " → " + esc(tname) + ".</b> Стрілки: " + r.sw.map(function(u){ return "№" + u.k + (u.pos === "+" ? " прямо" : " на відхилення"); }).join(", ") + (r.sw.length ? "" : "немає") + ". " +
    "Світлофор " + esc(s.id) + " відкрився: <b>" + ASP[a].n.toLowerCase() + "</b>" + (r.train ? (dev.length ? " (поїзд прямує з відхиленням по стрілочному переводу)" : " (поїзд прямує без відхилення)") : "") + "." +
    (r.train && r.s.k === "out" ? " Для навчання вважаємо, що перегін вільний і наступний світлофор відкритий." : "") + (nv > 1 ? " Можливих варіантів маршруту: " + nv + ", задано основний, з найменшою кількістю відхилень." : nv === 0 ? " Це обхідний варіант маршруту." : ""));
}
function cancel(id){
  routes = routes.filter(function(r){ return id !== "all" && r.id !== +id; }); redraw();
  msg("info", id === "all" ? "Усі маршрути скасовано, стрілки розімкнені." : "Маршрут скасовано, стрілки розімкнені.");
}
function pass(id){
  var r = routes.filter(function(x){ return x.id === +id; })[0]; if (!r || r.passing) return;
  r.passing = true; redraw();
  var es = r.path, i = 0, tail = 2, keepLast = r.train && (r.s.k === "in" || r.s.k === "ind");
  var tm = setInterval(function(){
    if (i < es.length) occ[es[i].id] = 1;
    if (i - tail >= 0 && i - tail < es.length){ var e = es[i - tail]; if (!(keepLast && i - tail === es.length - 1)) { delete occ[e.id]; delete r.edges[e.id]; r.path = r.path.filter(function(x){ return x !== e; }); } }
    i++;
    if (i - tail >= es.length){
      clearInterval(tm); routes = routes.filter(function(x){ return x !== r; });
      redraw();
      msg("info", (r.train ? "Поїзд пройшов" : "Состав пройшов") + " маршрут " + esc(rName(r)) + ". Світлофор " + esc(r.s.id) + " закрився одразу після вступу на маршрут, а ділянки розмикались послідовно за ходом руху." + (keepLast ? " Поїзд стоїть на колії приймання, тому вона залишається зайнятою." : ""));
      return;
    }
    redraw();
  }, 420);
}

root.addEventListener("click", function(ev){
  var b = ev.target.closest("button");
  if (b){
    if (b.dataset.m) setMode(b.dataset.m);
    else if (b.dataset.z != null) zoom(+b.dataset.z);
    else if (b.dataset.fs) toggleFs();
    else if (b.dataset.cancel) cancel(b.dataset.cancel);
    else if (b.dataset.pass) pass(b.dataset.pass);
    else if (b.dataset.alt && alt){ var a = alt; alt = null; if (!check(Object.assign({}, a.v, {s:a.s, t:a.t})).length && !routeFrom(a.s)) setRoute(a.s, a.t, a.v, 0); }
    return;
  }
  if (dragged) return;
  var g = ev.target.closest(".sg"); if (g){ clickSignal(SIG[g.dataset.s]); return; }
  var t = ev.target.closest(".endb"); if (t){ clickEnd(ENDS[t.dataset.t]); return; }
  var he = ev.target.closest(".hit-e");
  if (he && mode === "occ"){ var e = E[+he.dataset.e]; if (occ[e.id]) delete occ[e.id]; else occ[e.id] = 1; redraw(); msg("info", (occ[e.id] ? "Зайнято: " : "Звільнено: ") + esc(edgeName(e)) + "."); }
});
root.addEventListener("keydown", function(ev){ if ((ev.key === "Enter" || ev.key === " ") && ev.target.closest(".sg")){ ev.preventDefault(); clickSignal(SIG[ev.target.closest(".sg").dataset.s]); } });

/* ---------- на весь екран ---------- */
var fsBtn = root.querySelector("[data-fs]");
function isFs(){ return document.fullscreenElement === root || root.classList.contains("nb-full"); }
function fsChanged(){ var on = isFs(); fsBtn.textContent = on ? "Вийти з повного екрана" : "На весь екран"; document.documentElement.classList.toggle("nb-lock", root.classList.contains("nb-full")); }
function toggleFs(){
  if (isFs()){
    root.classList.remove("nb-full");
    if (document.fullscreenElement) document.exitFullscreen();
    fsChanged(); return;
  }
  var go = root.requestFullscreen ? root.requestFullscreen() : null;
  if (go && go.then) go.then(fsChanged, function(){ root.classList.add("nb-full"); fsChanged(); });
  else { root.classList.add("nb-full"); fsChanged(); }
}
document.addEventListener("fullscreenchange", fsChanged);
document.addEventListener("keydown", function(e){ if (e.key === "Escape" && root.classList.contains("nb-full")){ root.classList.remove("nb-full"); fsChanged(); } });

/* ---------- масштаб і перетягування ---------- */
var Z = [1, 1.6, 2.4, 3.4], zi = window.innerWidth < 700 ? 3 : 2;
function zoom(d){
  var cx = (wrap.scrollLeft + wrap.clientWidth / 2) / svg.clientWidth;
  zi = d === 0 ? 0 : Math.max(0, Math.min(Z.length - 1, zi + d));
  svg.style.width = (Z[zi] * 100) + "%";
  wrap.scrollLeft = cx * svg.clientWidth - wrap.clientWidth / 2;
}
var dragged = false, ds = null;
wrap.addEventListener("pointerdown", function(e){ if (e.pointerType !== "mouse") return; ds = {x:e.clientX, y:e.clientY, l:wrap.scrollLeft, t:wrap.scrollTop}; dragged = false; });
window.addEventListener("pointermove", function(e){ if (!ds) return; var dx = e.clientX - ds.x, dy = e.clientY - ds.y; if (Math.abs(dx) + Math.abs(dy) > 5) dragged = true; if (dragged){ wrap.scrollLeft = ds.l - dx; wrap.scrollTop = ds.t - dy; wrap.classList.add("drag"); } });
window.addEventListener("pointerup", function(){ ds = null; wrap.classList.remove("drag"); setTimeout(function(){ dragged = false; }, 0); });

svg.style.width = (Z[zi] * 100) + "%";
setHint(); redraw();
msg("info", "Перетягуйте схему мишею або пальцем і змінюйте масштаб кнопками праворуч угорі.");
})();
