/* УЕР Вікі — інтерактивні тренажери */
(function(){
"use strict";
function $(s, r){ return (r || document).querySelector(s); }
function el(tag, attrs, html){ var e = document.createElement(tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
var SVGNS = "http://www.w3.org/2000/svg";
var C = {y:"#ffc21a", g:"#1ee26b", r:"#ff3b30", w:"#e9f1ff", off:"#7a7a7a"};

document.addEventListener("DOMContentLoaded", function(){
  var map = {"ab-sim":abSim, "ets-sim":etsSim, "grp-sim":grpSim, "du2-sim":du2Sim, "phone-sim":phoneSim,
    "ex-journals":exJournals, "ex-blanks":exBlanks, "ex-signals":exSignals, "ex-sounds":exSounds, "ex-order":exOrder, "ex-test":exTest};
  for (var id in map){ var n = document.getElementById(id); if (n) { try { map[id](n); } catch(e){ n.innerHTML = '<div class="status bad">Не вдалося запустити тренажер: ' + e.message + '</div>'; } } }
  var gf = document.getElementById("gl-filter");
  if (gf) gf.addEventListener("input", function(){
    var q = gf.value.trim().toLowerCase();
    document.querySelectorAll("#gl tr").forEach(function(tr, i){ if (!i) return; tr.style.display = !q || tr.textContent.toLowerCase().indexOf(q) >= 0 ? "" : "none"; });
  });
  var tabs = document.getElementById("tr-tabs");
  if (tabs) tabs.addEventListener("click", function(e){
    var b = e.target.closest("button"); if (!b) return;
    tabs.querySelectorAll("button").forEach(function(x){ x.classList.toggle("on", x === b); });
    var t = document.getElementById(b.dataset.go); if (t) t.scrollIntoView({behavior:"smooth"});
  });
});

/* ===================== Симулятор автоблокування ===================== */
function abSim(root){
  root.innerHTML = '<div class="wtitle" id="симулятор-автоблокування">Симулятор тризначного автоблокування</div>' +
    '<p style="margin:0 0 8px;font-size:14.5px">Перегін між станціями А і Б поділено на 5 блок-ділянок. Відправляйте поїзди зі станції А і спостерігайте, як прохідні світлофори змінюють показання. Поїзд сповільнюється на жовтий і зупиняється перед червоним. Вхідний Н відкритий для безупинного пропуску, поки колія станції Б вільна.</p>' +
    '<div class="scheme"><svg viewBox="0 0 800 170" width="800"></svg></div>' +
    '<div style="margin-top:8px"><button class="btn primary" data-a="send">🚆 Відправити поїзд зі ст. А</button><button class="btn" data-a="pause">⏸ Пауза</button><button class="btn" data-a="stop">🛑 Зупинити перший поїзд на перегоні</button><button class="btn" data-a="reset">↺ Скинути</button></div>' +
    '<div class="status"></div>';
  var svg = $("svg", root), status = $(".status", root);
  var X0 = 70, X1 = 730, NB = 5, BL = (X1 - X0) / NB, TL = 70, Y = 110;
  var sigX = []; for (var i = 0; i <= NB; i++) sigX.push(X0 + i * BL);
  var names = ["Ч1", "1", "3", "5", "7", "Н"];
  var trains = [], paused = false, nextNo = 2001, last = performance.now(), stopped = null;
  function g(tag, a){ var e = document.createElementNS(SVGNS, tag); for (var k in a) e.setAttribute(k, a[k]); return e; }
  // статична частина
  svg.appendChild(g("rect", {x:0, y:Y-26, width:X0-6, height:52, rx:4, fill:"rgba(25,118,210,.12)"}));
  svg.appendChild(g("rect", {x:X1+6, y:Y-26, width:800-X1-6, height:52, rx:4, fill:"rgba(25,118,210,.12)"}));
  var tA = g("text", {x:12, y:Y+42, "font-size":13, fill:"currentColor"}); tA.textContent = "Ст. А"; svg.appendChild(tA);
  var tB = g("text", {x:X1+16, y:Y+42, "font-size":13, fill:"currentColor"}); tB.textContent = "Ст. Б"; svg.appendChild(tB);
  svg.appendChild(g("line", {x1:0, y1:Y, x2:800, y2:Y, stroke:"currentColor", "stroke-width":3}));
  var blocks = [];
  for (i = 0; i < NB; i++){
    var r = g("rect", {x:sigX[i]+2, y:Y+8, width:BL-4, height:6, rx:2, fill:"#2e7d32"}); svg.appendChild(r); blocks.push(r);
    var bt = g("text", {x:sigX[i]+BL/2, y:Y+30, "font-size":11, "text-anchor":"middle", fill:"currentColor", opacity:.6}); bt.textContent = "блок-ділянка " + (i+1); svg.appendChild(bt);
  }
  var heads = [];
  sigX.forEach(function(x, i){
    svg.appendChild(g("line", {x1:x, y1:Y-4, x2:x, y2:Y-30, stroke:"#c9c9c9", "stroke-width":4}));
    svg.appendChild(g("rect", {x:x-10, y:Y-93, width:20, height:64, rx:10, fill:"#0b0b0b"}));
    var lamps = ["y","g","r"].map(function(c, k){ var l = g("circle", {cx:x, cy:Y-81+k*20, r:7, fill:C.off}); svg.appendChild(l); return l; });
    heads.push(lamps);
    var t = g("text", {x:x, y:Y-98, "font-size":12, "font-weight":700, "text-anchor":"middle", fill:"currentColor"}); t.textContent = names[i]; svg.appendChild(t);
  });
  var tg = g("g", {}); svg.appendChild(tg);
  var XS = 800; // кінець видимої частини ст. Б
  function span(b){ return b < NB ? [sigX[b], sigX[b+1]] : [X1, XS]; } // b = NB — колія ст. Б за вхідним Н
  function occ(b){ var z = span(b); return trains.some(function(t){ return t.x > z[0] && t.x - TL < z[1]; }); }
  // Показання світлофора i (0..NB) визначається лише зайнятістю ділянки за ним і показанням наступного світлофора:
  // ділянка зайнята — червоний; наступний червоний — жовтий; інакше — зелений.
  // Вхідний Н (i = NB) відкритий на зелений для безупинного пропуску, поки колія ст. Б вільна.
  function aspect(i){
    if (occ(i)) return "r";
    if (i >= NB) return "g";
    return aspect(i + 1) === "r" ? "y" : "g";
  }
  function draw(){
    var asp = [];
    for (var i = 0; i <= NB; i++) asp.push(aspect(i));
    for (i = 0; i < NB; i++) blocks[i].setAttribute("fill", occ(i) ? "#d32f2f" : "#2e7d32");
    heads.forEach(function(l, i){ var a = asp[i]; l[0].setAttribute("fill", a === "y" ? C.y : C.off); l[1].setAttribute("fill", a === "g" ? C.g : C.off); l[2].setAttribute("fill", a === "r" ? C.r : C.off); });
    tg.innerHTML = "";
    trains.forEach(function(t){
      var x = Math.max(t.x - TL, 0), w = Math.min(t.x, XS) - x;
      if (w <= 0) return;
      tg.appendChild(g("rect", {x:x, y:Y-12, width:w, height:12, rx:3, fill:t.stop ? "#e08a00" : "#1976d2"}));
      var tx = g("text", {x:x + w/2, y:Y-15, "font-size":11, "text-anchor":"middle", fill:"currentColor"}); tx.textContent = "№" + t.no; tg.appendChild(tx);
    });
    return asp;
  }
  var VMAX = 60, VY = 38, ACC = 25, DEC = 30, STOP = 5, GAP = 8;
  function step(now){
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!paused){
      var asp = draw();
      trains.sort(function(a, b){ return b.x - a.x; });
      trains.forEach(function(t, k){
        // точка, далі якої голова поїзда не може зайти: перед червоним світлофором або за хвостом попереднього поїзда
        var limit = Infinity, target = VMAX, first = true;
        for (var i = 0; i < sigX.length; i++){
          if (sigX[i] <= t.x) continue;           // світлофор уже позаду
          if (asp[i] === "r"){ limit = sigX[i] - STOP; break; }
          if (first && asp[i] === "y") target = VY; // наступний світлофор жовтий — зменшена швидкість
          first = false;
        }
        if (k > 0) limit = Math.min(limit, trains[k-1].x - TL - GAP);
        var safe = Math.sqrt(2 * DEC * Math.max(0, limit - t.x)); // швидкість, з якої ще можна зупинитися до limit
        if (t.stop) target = 0;
        target = Math.min(target, safe);
        t.v = t.v < target ? Math.min(target, t.v + ACC * dt) : Math.max(target, t.v - DEC * (t.stop ? 2 : 1) * dt);
        t.v = Math.min(t.v, safe);
        t.x = Math.min(t.x + t.v * dt, Math.max(t.x, limit));
        if (t.x >= limit) t.v = 0;
      });
      trains = trains.filter(function(t){ return t.x - TL < XS; });
      var msg = trains.length ? trains.map(function(t){ return "№" + t.no + (t.stop ? " — зупинився (несправність)" : t.v < 2 ? " — стоїть перед червоним" : t.v < 45 ? " — зменшена швидкість" : " — встановлена швидкість"); }).join("; ") : "Перегін вільний. Вихідний Ч1 показує зелений.";
      status.textContent = msg;
    }
    requestAnimationFrame(step);
  }
  root.addEventListener("click", function(e){
    var b = e.target.closest("button"); if (!b) return;
    var a = b.dataset.a;
    if (a === "send"){
      var why = occ(0) ? "Вихідний Ч1 червоний: перша блок-ділянка зайнята. Відправляти поїзд заборонено." :
                trains.some(function(t){ return t.x - TL < X0; }) ? "Попередній поїзд ще не вийшов зі станції А. Зачекайте." : "";
      if (why){ status.textContent = why; status.className = "status bad"; setTimeout(function(){ status.className = "status"; }, 1600); return; }
      trains.push({x:X0 - 4, v:30, no:nextNo, stop:false}); nextNo += 2;
    }
    if (a === "pause"){ paused = !paused; b.textContent = paused ? "▶ Продовжити" : "⏸ Пауза"; }
    if (a === "stop"){
      var held = trains.filter(function(t){ return t.stop; });
      if (held.length){ held.forEach(function(t){ t.stop = false; }); b.textContent = "🛑 Зупинити перший поїзд на перегоні"; }
      else {
        var on = trains.filter(function(t){ return t.x > X0 + 20 && t.x - TL < X1; }).sort(function(p, q){ return q.x - p.x; });
        if (on[0]){ on[0].stop = true; b.textContent = "▶ Відновити рух поїзда"; }
      }
    }
    if (a === "reset"){ trains = []; paused = false; root.querySelector('[data-a=pause]').textContent = "⏸ Пауза"; root.querySelector('[data-a=stop]').textContent = "🛑 Зупинити перший поїзд на перегоні"; }
  });
  draw(); requestAnimationFrame(step);
}

/* ===================== Пульт ЕЦ ===================== */
function etsSim(root){
  root.innerHTML = '<div class="wtitle">Пульт-табло: маршрут приймання непарного поїзда</div>' +
    '<div class="scheme"><svg viewBox="0 0 760 260" width="760"></svg></div>' +
    '<div style="margin-top:8px">' +
    '<b style="font-size:14px">1. Колія приймання:</b> <button class="btn" data-a="t1">Головна I</button><button class="btn" data-a="t3">Бічна 3</button><br>' +
    '<b style="font-size:14px">2. Вихідний:</b> <button class="btn" data-a="exit">Відкрити вихідний для безупинного пропуску</button><br>' +
    '<b style="font-size:14px">3. Сигнал:</b> <button class="btn primary" data-a="open">Відкрити вхідний Н</button><button class="btn" data-a="cancel">Скасувати маршрут</button><button class="btn" data-a="train">🚆 Пропустити поїзд</button><br>' +
    '<b style="font-size:14px">Ситуація:</b> <button class="btn" data-a="occ">Поставити вагони на колію 3</button><button class="btn" data-a="man">Маневри на стрілці 1</button>' +
    '</div><div class="status">Оберіть колію приймання.</div>';
  var svg = $("svg", root), st = $(".status", root);
  var S = {track:null, locked:false, entry:"r", exit:false, occ3:false, man:false, train:null};
  function g(tag, a, txt){ var e = document.createElementNS(SVGNS, tag); for (var k in a) e.setAttribute(k, a[k]); if (txt) e.textContent = txt; svg.appendChild(e); return e; }
  svg.style.color = "#dfe6ec";
  g("rect", {x:0, y:0, width:760, height:260, rx:8, fill:"#24332e"});
  // колії
  var Ym = 175, Ys = 85;
  var segs = {
    approach: g("line", {x1:10, y1:Ym, x2:150, y2:Ym, "stroke-width":8, "stroke-linecap":"round"}),
    sw1main: g("line", {x1:150, y1:Ym, x2:240, y2:Ym, "stroke-width":8}),
    sw1div: g("line", {x1:160, y1:Ym, x2:230, y2:Ys, "stroke-width":8}),
    t1: g("line", {x1:240, y1:Ym, x2:540, y2:Ym, "stroke-width":8}),
    t3: g("line", {x1:230, y1:Ys, x2:550, y2:Ys, "stroke-width":8}),
    sw2div: g("line", {x1:550, y1:Ys, x2:620, y2:Ym, "stroke-width":8}),
    sw2main: g("line", {x1:540, y1:Ym, x2:630, y2:Ym, "stroke-width":8}),
    out: g("line", {x1:630, y1:Ym, x2:750, y2:Ym, "stroke-width":8, "stroke-linecap":"round"})
  };
  g("text", {x:380, y:Ym+26, "font-size":14, "font-weight":700, fill:"currentColor"}, "I");
  g("text", {x:380, y:Ys-14, "font-size":14, "font-weight":700, fill:"currentColor"}, "3");
  g("text", {x:150, y:Ym+26, "font-size":12, fill:"currentColor"}, "стр. 1");
  g("text", {x:600, y:Ym+26, "font-size":12, fill:"currentColor"}, "стр. 2");
  g("text", {x:20, y:250, "font-size":12, fill:"currentColor", opacity:.7}, "з перегону →");
  g("text", {x:640, y:250, "font-size":12, fill:"currentColor", opacity:.7}, "→ на перегін");
  var wag = g("rect", {x:330, y:Ys-9, width:120, height:18, rx:3, fill:"#455a64", opacity:0});
  var trainR = g("rect", {x:-100, y:Ym-10, width:90, height:20, rx:4, fill:"#1976d2"});
  // світлофори (маленькі)
  function sigBox(x, y, n, lbl){
    g("line", {x1:x, y1:y, x2:x, y2:y-12, stroke:"#9aa4ad", "stroke-width":2});
    g("rect", {x:x-9, y:y-12-n*15-4, width:18, height:n*15+4, rx:8, fill:"#15191d"});
    var ls = []; for (var i = 0; i < n; i++) ls.push(g("circle", {cx:x, cy:y-12-n*15+5+i*15, r:5.5, fill:C.off}));
    g("text", {x:x+12, y:y-12, "font-size":12, "font-weight":700, fill:"currentColor"}, lbl);
    return ls;
  }
  var H = sigBox(120, Ym-14, 5, "Н");      // y g r y w
  var HI = sigBox(520, Ym-14, 3, "НI");   // y g r
  var H3 = sigBox(530, Ys-14, 3, "Н3");
  var sw1 = g("text", {x:180, y:Ym+44, "font-size":12, fill:"#2e7d32"}, "+"), sw2 = g("text", {x:590, y:Ym+44, "font-size":12, fill:"#2e7d32"}, "+");
  function color(seg, c){ seg.setAttribute("stroke", c); }
  function render(){
    var base = getComputedStyle(root).getPropertyValue("--muted") || "#888";
    for (var k in segs) color(segs[k], "#78909c");
    if (S.occ3) color(segs.t3, "#d32f2f");
    if (S.man) { color(segs.sw1main, "#d32f2f"); color(segs.sw1div, "#d32f2f"); }
    if (S.track){
      var route = S.track === "I" ? ["sw1main","t1"] : ["sw1div","t3"];
      route.forEach(function(k){ color(segs[k], S.locked ? "#ffffff" : "#ffc21a"); });
      if (S.exit) (S.track === "I" ? ["sw2main","out"] : ["sw2div","out"]).forEach(function(k){ color(segs[k], "#ffffff"); });
    }
    if (S.train){ color(segs.approach, "#d32f2f"); }
    sw1.textContent = "стр. 1: " + (S.track === "3" ? "− (переведена, жовта)" : "+ (нормальна, зелена)"); sw1.setAttribute("fill", S.track === "3" ? "#e08a00" : "#2e7d32");
    sw2.textContent = "стр. 2: " + (S.track === "3" && S.exit ? "−" : "+"); sw2.setAttribute("fill", S.track === "3" && S.exit ? "#e08a00" : "#2e7d32");
    // вхідний: y g r y w
    var e = S.entry, on = {};
    if (e === "r") on[2] = C.r;
    if (e === "g") on[1] = C.g;
    if (e === "yb") on[0] = C.y;  // жовтий мигаючий
    if (e === "y") on[0] = C.y;
    if (e === "yy") { on[0] = C.y; on[3] = C.y; }
    if (e === "yby") { on[0] = C.y; on[3] = C.y; }
    H.forEach(function(l, i){ l.setAttribute("fill", on[i] || C.off); l.classList.toggle("blink", (e === "yb" || e === "yby") && i === 0); });
    var exI = S.exit && S.track === "I", ex3 = S.exit && S.track === "3";
    HI[1].setAttribute("fill", exI ? C.g : C.off); HI[2].setAttribute("fill", exI ? C.off : C.r);
    H3[0].setAttribute("fill", ex3 ? C.y : C.off); H3[2].setAttribute("fill", ex3 ? C.off : C.r);
    wag.setAttribute("opacity", S.occ3 ? 1 : 0);
  }
  var names = {g:"зелений: на головну колію, вихідний відкритий", yb:"жовтий мигаючий: попереду відхилення по стрілках", y:"жовтий: приймання на головну колію, вихідний НI закритий (готовність зупинитися)", yy:"два жовті: приймання з відхиленням на бічну колію 3, вихідний закритий", yby:"два жовті, верхній мигаючий: з відхиленням, вихідний Н3 відкритий"};
  function msg(t, cls){ st.textContent = t; st.className = "status" + (cls ? " " + cls : ""); }
  function entryAspect(){
    if (S.track === "I") return S.exit ? "g" : "y";
    return S.exit ? "yby" : "yy";
  }
  root.addEventListener("click", function(ev){
    var b = ev.target.closest("button"); if (!b) return;
    var a = b.dataset.a;
    if (S.train && a !== "occ") { msg("Поїзд у русі — зачекайте.", ""); return; }
    if (a === "t1" || a === "t3"){
      if (S.locked){ msg("Маршрут уже замкнений і вхідний відкритий. Змінювати маршрут заборонено: спершу закрийте сигнал і скасуйте маршрут.", "bad"); return; }
      if (S.man){ msg("На стрілці 1 виконуються маневри. Спершу припиніть маневри на маршруті приймання.", "bad"); return; }
      S.track = a === "t1" ? "I" : "3"; S.exit = false;
      msg("Стрілки переведено за маршрутом на колію " + S.track + " (жовта смуга — маршрут набрано, ще не замкнено). Тепер відкрийте вхідний.");
    }
    if (a === "exit"){
      if (!S.track){ msg("Спершу оберіть колію приймання.", "bad"); return; }
      if (S.track === "3" && S.occ3){ msg("Колія 3 зайнята — пропуск неможливий.", "bad"); return; }
      S.exit = !S.exit; b.textContent = S.exit ? "Закрити вихідний" : "Відкрити вихідний для безупинного пропуску";
      if (S.locked) S.entry = entryAspect();
      msg(S.exit ? "Вихідний відкрито — тепер це маршрут безупинного пропуску." : "Вихідний закрито — поїзд зупиниться на станції.");
    }
    if (a === "open"){
      if (!S.track){ msg("Маршрут не приготовлено: ЕЦ не відкриє світлофор.", "bad"); return; }
      if (S.track === "3" && S.occ3){ msg("Колія 3 зайнята вагонами. ЕЦ не допускає приймання на зайняту колію — світлофор не відкриється.", "bad"); return; }
      if (S.man){ msg("Маневри на маршруті — відкриття неможливе.", "bad"); return; }
      S.locked = true; S.entry = entryAspect();
      msg("Маршрут замкнено (біла смуга). Вхідний Н: " + names[S.entry] + ".", "good");
    }
    if (a === "cancel"){
      S.locked = false; S.entry = "r"; S.track = null; S.exit = false; root.querySelector('[data-a=exit]').textContent = "Відкрити вихідний для безупинного пропуску";
      msg("Вхідний закрито, маршрут скасовано (у реальній ЕЦ — з витримкою часу 6 хв, якщо поїзд наближається).");
    }
    if (a === "occ"){
      if (S.locked && S.track === "3"){ msg("Колія 3 у замкненому маршруті приймання — подача вагонів туди зараз неможлива.", "bad"); return; }
      S.occ3 = !S.occ3; b.textContent = S.occ3 ? "Прибрати вагони з колії 3" : "Поставити вагони на колію 3";
      msg(S.occ3 ? "На колії 3 стоять вагони (червона смуга — колія зайнята)." : "Колія 3 вільна.");
    }
    if (a === "man"){
      if (S.locked){ msg("Стрілка 1 замкнена в маршруті — маневри по ній неможливі.", "bad"); return; }
      S.man = !S.man; b.textContent = S.man ? "Припинити маневри" : "Маневри на стрілці 1";
      msg(S.man ? "Маневровий состав на стрілці 1: стрілочна секція зайнята, перевести її неможливо." : "Маневри припинено, стрілочна секція вільна.");
    }
    if (a === "train"){
      if (!S.locked){ msg("Вхідний закритий — поїзд зупиниться перед ним. Спершу приготуйте маршрут і відкрийте сигнал.", "bad"); return; }
      runTrain();
    }
    render();
  });
  function runTrain(){
    var x = -100, onSide = S.track === "3", stopX = onSide ? 470 : 460, through = S.exit;
    S.train = true;
    function f(){
      x += 4;
      var y = Ym - 10;
      if (onSide && x + 90 > 165 && x < 560){ y = Ys - 10 + Math.max(0, Math.min(1, (230 - (x + 90)) / 70)) * (Ym - Ys); }
      if (onSide && x > 520 && through){ y = Ys - 10 + Math.min(1, (x - 520) / 70) * (Ym - Ys); }
      trainR.setAttribute("x", x); trainR.setAttribute("y", y);
      if (x > 30 && S.entry !== "r"){ S.entry = "r"; render(); msg("Вхідний Н закрився автоматично після проходження першої колісної пари."); }
      if (!through && x >= stopX){ S.train = null; S.locked = false; msg("Поїзд прибув на колію " + S.track + ". Маршрут розімкнувся після проходження. ДСП перевіряє повний склад, записує прибуття в ДУ-2 і повідомляє сусідню станцію та ДНЦ.", "good"); render(); return; }
      if (x > 780){ S.train = null; S.locked = false; S.exit = false; root.querySelector('[data-a=exit]').textContent = "Відкрити вихідний для безупинного пропуску"; trainR.setAttribute("x", -100); msg("Поїзд пройшов станцію без зупинки. Сигнали закрились, маршрути розімкнулись.", "good"); S.track = null; render(); return; }
      requestAnimationFrame(f);
    }
    f();
  }
  render();
}

/* ===================== Графік руху ===================== */
function grpSim(root){
  root.innerHTML = '<div class="wtitle">Фрагмент графіка руху на одноколійній дільниці</div><p style="margin:0 0 8px;font-size:14.5px">Натисніть на нитку поїзда, щоб побачити його розклад. На одноколійній лінії зустрічні поїзди можуть розминутися лише на станції: знайдіть схрещення на станції Б і стоянки, на яких поїзд чекає зустрічного.</p><div class="scheme"><svg viewBox="0 0 760 300" width="760"></svg></div><div class="status">Оберіть поїзд.</div>';
  var svg = $("svg", root), st = $(".status", root);
  function g(tag, a, txt){ var e = document.createElementNS(SVGNS, tag); for (var k in a) e.setAttribute(k, a[k]); if (txt) e.textContent = txt; svg.appendChild(e); return e; }
  var L = 70, R = 740, T = 30, B = 270, t0 = 6 * 60, t1 = 9 * 60 + 30;
  var st_ = [{n:"А", km:0}, {n:"Б", km:14}, {n:"В", km:26}, {n:"Г", km:41}];
  function X(t){ return L + (t - t0) / (t1 - t0) * (R - L); }
  function Yk(km){ return T + km / 41 * (B - T); }
  for (var m = t0; m <= t1; m += 10){
    var hr = (m % 60 === 0), half = (m % 60 === 30);
    g("line", {x1:X(m), y1:T, x2:X(m), y2:B, stroke:"currentColor", "stroke-width": hr ? 1.4 : .4, opacity: hr ? .7 : .35, "stroke-dasharray": half ? "4 3" : ""});
    if (hr) g("text", {x:X(m), y:B + 18, "font-size":12, "text-anchor":"middle", fill:"currentColor"}, (m / 60) + ":00");
  }
  st_.forEach(function(s){ g("line", {x1:L, y1:Yk(s.km), x2:R, y2:Yk(s.km), stroke:"currentColor", "stroke-width":1.2, opacity:.8}); g("text", {x:L - 10, y:Yk(s.km) + 4, "font-size":13, "text-anchor":"end", fill:"currentColor"}, s.n); });
  // поїзди: точки [станція, прибуття, відправлення]
  var trains = [
    {no:"6101", kind:"пасажирський (приміський)", col:"#d32f2f", w:2.6, pts:[[0,null,370],[1,382,386],[2,395,396],[3,408,null]]},
    {no:"6104", kind:"пасажирський (приміський)", col:"#d32f2f", w:2.6, pts:[[3,null,360],[2,373,374],[1,384,385],[0,397,null]]},
    {no:"2401", kind:"вантажний", col:"currentColor", w:1.4, pts:[[0,null,395],[1,413,449],[2,467,468],[3,488,null]]},
    {no:"2402", kind:"вантажний", col:"currentColor", w:1.4, pts:[[3,null,402],[2,424,432],[1,447,448],[0,466,null]]},
    {no:"3501", kind:"збірний", col:"currentColor", w:1.4, dash:"10 3 2 3", pts:[[0,null,470],[1,492,519],[2,542,null]]},
    {no:"6106", kind:"пасажирський (приміський)", col:"#d32f2f", w:2.6, pts:[[3,null,492],[2,505,506],[1,516,517],[0,529,null]]}
  ];
  trains.forEach(function(tr){
    var d = "", first = true;
    tr.pts.forEach(function(p){
      var y = Yk(st_[p[0]].km);
      if (p[1] != null){ d += (first ? "M" : "L") + X(p[1]) + " " + y; first = false; }
      if (p[2] != null){ d += (first ? "M" : "L") + X(p[2]) + " " + y; first = false; }
    });
    var hit = g("path", {d:d, stroke:"transparent", "stroke-width":14, fill:"none", style:"cursor:pointer"});
    var path = g("path", {d:d, stroke:tr.col, "stroke-width":tr.w, fill:"none", "stroke-dasharray":tr.dash || "", style:"cursor:pointer;pointer-events:none"});
    var p0 = tr.pts[0], p1 = tr.pts[1];
    var lx = (X(p0[2]) + X(p1[1])) / 2, ly = (Yk(st_[p0[0]].km) + Yk(st_[p1[0]].km)) / 2;
    g("text", {x:lx + 4, y:ly, "font-size":11, "font-weight":700, fill:tr.col === "currentColor" ? "currentColor" : tr.col}, tr.no);
    hit.addEventListener("click", function(){
      svg.querySelectorAll("path").forEach(function(p){ p.style.opacity = ""; });
      function hm(t){ var h = Math.floor(t / 60), m = t % 60; return h + ":" + (m < 10 ? "0" : "") + m; }
      var rows = tr.pts.map(function(p){ return st_[p[0]].n + ": " + (p[1] != null ? "приб. " + hm(p[1]) : "") + (p[1] != null && p[2] != null ? ", " : "") + (p[2] != null ? "відпр. " + hm(p[2]) : "") + (p[1] != null && p[2] != null && p[2] - p[1] > 1 ? " (стоянка " + (p[2] - p[1]) + " хв)" : ""); });
      st.innerHTML = "<b>№" + tr.no + "</b> — " + tr.kind + " (" + (parseInt(tr.no, 10) % 2 ? "непарний" : "парний") + "). " + rows.join("; ");
    });
  });
}

/* ===================== Відмітки ДУ-2 ===================== */
function du2Sim(root){
  root.innerHTML = '<div class="wtitle">Конструктор відмітки в журналі ДУ-2</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:end;font-size:14px">' +
    '<label>Спосіб<br><select data-f="m"><option value="РЗ">РЗ — наказ по радіо</option><option value="ЗС">ЗС — запрошувальний</option><option value="ПД">ПД — письмовий дозвіл</option></select></label>' +
    '<label data-for="РЗ ПД">№ наказу / дозволу<br><input data-f="n" value="3" size="4"></label>' +
    '<label>Час<br><input data-f="t" value="14.10" size="6"></label>' +
    '<label data-for="РЗ ЗС">Літер світлофора<br><input data-f="s" value="Н" size="5"></label>' +
    '<label data-for="РЗ">Машиніст<br><input data-f="d" value="Петров" size="10"></label>' +
    '<label data-for="ЗС">Лічильник<br><input data-f="c" value="2835" size="6"></label>' +
    '<label data-for="ПД">Форма<br><select data-f="b"><option>ДУ-59</option><option>ДУ-54</option></select></label>' +
    '</div><div class="status" style="font-family:Roboto Mono,monospace;font-size:16px"></div><p style="font-size:13.5px;color:var(--muted);margin:6px 0 0">Відмітку роблять у графі 9 навпроти номера поїзда.</p>';
  root.querySelectorAll("select,input").forEach(function(i){ i.style.cssText = "padding:5px 8px;border:1px solid var(--line);border-radius:4px;background:var(--paper);color:var(--text);font:inherit"; });
  function v(f){ return root.querySelector('[data-f="' + f + '"]').value.trim(); }
  function upd(){
    var m = v("m");
    root.querySelectorAll("[data-for]").forEach(function(l){ l.style.display = l.dataset.for.indexOf(m) >= 0 ? "" : "none"; });
    var out = m === "РЗ" ? "РЗ №" + v("n") + " " + v("t") + " " + v("s") + " ТЧМ " + v("d")
      : m === "ЗС" ? "ЗС " + v("t") + " " + v("s") + " " + v("c")
      : "ПД " + v("b") + " №" + v("n") + " " + v("t").replace(".", "-");
    $(".status", root).textContent = out;
  }
  root.addEventListener("input", upd); root.addEventListener("change", upd); upd();
}

/* ===================== Телефонограми ===================== */
function phoneSim(root){
  var steps = [
    {from:"A", f:1, txt:"Чи можу відправити поїзд № 2041? ДСП Коваленко", note:"Ст. А просить згоди. Перегін ще вільний."},
    {from:"B", f:2, txt:"Очікую поїзд № 2041. ДСП Савченко", note:"Згоду отримано — тепер ДСП ст. А може заповнити колійну записку ДУ-50 і вручити її машиністу."},
    {from:"A", f:3, txt:"Поїзд № 2041 відправився о 10 год 15 хв. ДСП Коваленко", note:"Перегін ЗАЙНЯТИЙ. Жодних відправлень на нього до телефонограми про прибуття."},
    {from:"B", f:4, txt:"Поїзд № 2041 прибув о 10 год 32 хв. ДСП Савченко", note:"ДСП ст. Б переконався, що поїзд прибув у повному складі. Перегін ВІЛЬНИЙ."}
  ];
  root.innerHTML = '<div class="wtitle">Обмін поїзними телефонограмами між станціями А і Б</div>' +
    '<div class="two"><div><b>ДУ-47 станції А</b><div class="tbl"><table><thead><tr><th>Вих.</th><th>Вх.</th><th>Час</th><th>Зміст</th></tr></thead><tbody data-j="A"></tbody></table></div></div>' +
    '<div><b>ДУ-47 станції Б</b><div class="tbl"><table><thead><tr><th>Вих.</th><th>Вх.</th><th>Час</th><th>Зміст</th></tr></thead><tbody data-j="B"></tbody></table></div></div></div>' +
    '<div><button class="btn primary" data-a="next">Наступна телефонограма ▶</button><button class="btn" data-a="reset">↺ Спочатку</button> <span data-s style="font-weight:500"></span></div><div class="status">Перегін А–Б вільний. Натисніть «Наступна телефонограма».</div>';
  var i = 0, nA = 0, nB = 0, times = ["10.05", "10.06", "10.15", "10.32"];
  function sline(){ var s = root.querySelector("[data-s]"); var busy = i >= 3 && i < 4; s.innerHTML = "Перегін: " + (busy ? '<span style="color:var(--danger)">зайнятий</span>' : '<span style="color:var(--ok)">вільний</span>'); }
  root.addEventListener("click", function(e){
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.a === "reset"){ i = 0; nA = 0; nB = 0; root.querySelectorAll("tbody").forEach(function(t){ t.innerHTML = ""; }); $(".status", root).textContent = "Перегін А–Б вільний."; sline(); return; }
    if (i >= steps.length){ $(".status", root).textContent = "Обмін завершено. Натисніть «Спочатку»."; return; }
    var s = steps[i], out = s.from === "A" ? ++nA : ++nB;
    var me = root.querySelector('[data-j="' + s.from + '"]'), other = root.querySelector('[data-j="' + (s.from === "A" ? "B" : "A") + '"]');
    me.insertAdjacentHTML("beforeend", "<tr><td class=c>" + out + "</td><td></td><td>" + times[i] + "</td><td>Ф." + s.f + ": " + s.txt + "</td></tr>");
    other.insertAdjacentHTML("beforeend", "<tr><td></td><td class=c>" + out + "</td><td>" + times[i] + "</td><td>Ф." + s.f + ": " + s.txt + "</td></tr>");
    $(".status", root).textContent = s.note; i++; sline();
  });
  sline();
}

/* ===================== Вправа на відповідність ===================== */
function matching(root, title, pairs){
  root.innerHTML = '<div class="wtitle">' + title + '</div><div class="progress"><i></i></div><div class="match"><div class="col" data-c="l"></div><div class="col" data-c="r"></div></div><div class="status"></div><button class="btn" data-a="reset" style="margin-top:8px">↺ Перемішати знову</button>';
  var L = $('[data-c="l"]', root), R = $('[data-c="r"]', root), st = $(".status", root), bar = $(".progress i", root);
  var sel = null, done = 0, errors = 0;
  function build(){
    L.innerHTML = ""; R.innerHTML = ""; sel = null; done = 0; errors = 0; bar.style.width = "0";
    st.className = "status"; st.textContent = "Знайдено 0 з " + pairs.length + ".";
    shuffle(pairs.map(function(p, i){ return i; })).forEach(function(i){ var c = el("div", {class:"chip", "data-i":i}, pairs[i][0]); L.appendChild(c); });
    shuffle(pairs.map(function(p, i){ return i; })).forEach(function(i){ var c = el("div", {class:"chip", "data-i":i}, pairs[i][1]); R.appendChild(c); });
    if (window.UER_initBlanks) window.UER_initBlanks(root);
  }
  root.addEventListener("click", function(e){
    if (e.target.closest('[data-a="reset"]')) { build(); return; }
    var c = e.target.closest(".chip"); if (!c || c.classList.contains("done")) return;
    var side = c.parentNode.dataset.c;
    if (!sel || sel.parentNode.dataset.c === side){
      if (sel) sel.classList.remove("sel");
      sel = c; c.classList.add("sel"); return;
    }
    if (sel.dataset.i === c.dataset.i){
      done++;
      [sel, c].forEach(function(x){ x.classList.remove("sel"); x.classList.add("done"); x.insertAdjacentHTML("afterbegin", '<span class="tag">' + done + '</span>'); });
      bar.style.width = (done / pairs.length * 100) + "%";
      st.textContent = "Знайдено " + done + " з " + pairs.length + "." + (errors ? " Помилок: " + errors + "." : "");
      if (done === pairs.length){ st.className = "status good"; st.textContent = errors ? "Готово! Помилок: " + errors + ". Спробуйте пройти без помилок." : "Чудово, усі пари без жодної помилки!"; }
    } else {
      errors++;
      [sel, c].forEach(function(x){ x.classList.add("wrong"); setTimeout(function(){ x.classList.remove("wrong"); }, 400); });
      st.textContent = "Не та пара. Помилок: " + errors + ".";
    }
    sel.classList.remove("sel"); sel = null;
  });
  build();
}
function exJournals(root){
  matching(root, "Основні форми журналів, які веде ДСП", [
    ["<b>ДУ-2</b>", "Прибуття, відправлення і проходження поїздів, вступ на чергування, відмітки РЗ, ЗС, ПД"],
    ["<b>ДУ-58</b>", "Реєстровані накази поїзного диспетчера, затверджені словом «Виконуйте»"],
    ["<b>ДУ-60</b>", "Заявки на видачу попереджень на поїзди та повідомлення про їх відміну"],
    ["<b>ДУ-46</b>", "Виявлені несправності пристроїв, виклик електромеханіка і відмітки про усунення"],
    ["<b>ДУ-47</b>", "Телефонограми «Чи можу відправити», «Очікую», «Відправився», «Прибув»"]
  ]);
}
function exBlanks(root){
  matching(root, "Бланки письмових дозволів", [
    ['<span class="blank" data-b="green" data-f="ДУ-54"></span> ДУ-54', "Відправлення при забороняючому вихідному на перегін з автоблокуванням"],
    ['<span class="blank" data-b="white" data-f="ДУ-59"></span> ДУ-59', "Приймання поїзда при забороняючому показанні вхідного світлофора"],
    ['<span class="blank" data-b="white" data-f="ДУ-50"></span> ДУ-50', "Колійна записка при телефонних засобах зв'язку"],
    ['<span class="blank" data-b="red2" data-f="ДУ-56"></span> ДУ-56', "Зайняття перегону при перерві дії всіх засобів сигналізації та зв'язку"],
    ['<span class="blank" data-b="yellow" data-f="ДУ-61"></span> ДУ-61', "Попередження про роботи й особливі умови руху"],
    ['<span class="blank" data-b="red1" data-f="ДУ-64"></span> ДУ-64', "Відбудовний, пожежний поїзд або допоміжний локомотив на закритий перегін"]
  ]);
}

/* ===================== Тест з вибором відповіді ===================== */
function quiz(root, title, items, opts){
  opts = opts || {};
  var order, idx, score;
  function start(){
    order = shuffle(items).slice(0, opts.n || items.length); idx = 0; score = 0; show();
  }
  function show(){
    if (window.UER_stop) window.UER_stop();
    if (idx >= order.length){
      var pct = Math.round(score / order.length * 100);
      root.innerHTML = '<div class="wtitle">' + title + '</div><div class="status ' + (pct >= 75 ? "good" : "bad") + '" style="font-size:16px">Результат: ' + score + ' з ' + order.length + ' (' + pct + '%). ' + (pct >= 90 ? "Відмінно!" : pct >= 75 ? "Добре." : "Варто повторити теми з помилками.") + '</div><button class="btn primary" data-a="again" style="margin-top:10px">Пройти ще раз</button>';
      $('[data-a="again"]', root).addEventListener("click", start);
      return;
    }
    var q = order[idx];
    var choices = q.choices ? shuffle(q.choices) : q.choices;
    root.innerHTML = '<div class="wtitle">' + title + '</div><div class="progress"><i style="width:' + (idx / order.length * 100) + '%"></i></div>' +
      '<div style="font-size:13px;color:var(--muted)">Питання ' + (idx + 1) + ' з ' + order.length + ' · правильних: ' + score + '</div>' +
      '<div class="quiz-q">' + (q.q || "") + '</div><div class="qmedia" style="margin-bottom:10px"></div><div class="opts"></div><div class="expl"></div>';
    var media = $(".qmedia", root);
    if (q.sig){ var sa = ""; ["l", "on", "strip", "label", "type"].forEach(function(k){ if (q.sig[k] != null && q.sig[k] !== "") sa += ' data-' + k + '="' + q.sig[k] + '"'; });
      media.innerHTML = '<div class="qsig"><span class="sr"' + sa + '></span></div>'; window.UER_renderSignals(media); }
    if (q.snd){ media.innerHTML = '<button class="play" type="button"></button>'; var pb = $("button", media); window.UER_bindPlay(pb, q.snd, "▶ Слухати сигнал"); }
    var box = $(".opts", root);
    choices.forEach(function(c){
      var b = el("button", {class:"btn opt", type:"button"}, c); box.appendChild(b);
      b.addEventListener("click", function(){
        if (box.dataset.done) return; box.dataset.done = 1;
        var ok = c === q.a;
        if (ok) score++;
        box.querySelectorAll("button").forEach(function(x){ if (x.innerHTML === q.a || x.textContent === el("div", null, q.a).textContent) x.classList.add("right"); });
        if (!ok) b.classList.add("wrongo");
        $(".expl", root).innerHTML = '<div class="status ' + (ok ? "good" : "bad") + '">' + (ok ? "Правильно. " : "Неправильно. ") + (q.e || "") + (q.link ? ' <a href="' + q.link + '">Повторити тему →</a>' : "") + '</div><button class="btn primary" style="margin-top:8px">' + (idx + 1 < order.length ? "Далі ▶" : "Результат") + '</button>';
        $(".expl button", root).addEventListener("click", function(){ idx++; show(); });
      });
    });
  }
  start();
}
var SIGQ = [
  {on:"1", a:"Рух із встановленою швидкістю; наступний світлофор відкритий"},
  {on:"0b", a:"Рух із встановленою швидкістю; наступний світлофор відкритий і вимагає проходження його зі зменшеною швидкістю"},
  {on:"0", a:"Рух з готовністю зупинитися; наступний світлофор закритий"},
  {on:"0b,3", a:"Зі зменшеною швидкістю з відхиленням по стрілці; наступний світлофор відкритий"},
  {on:"0,3", a:"Зі зменшеною швидкістю з відхиленням по стрілці та готовністю зупинитися біля наступного світлофора"},
  {on:"2", a:"Стій! Забороняється проїжджати сигнал"},
  {on:"2,4b", a:"Запрошувальний: проїхати червоний зі швидкістю не більше 20 км/год"},
  {on:"0b,3", strip:"g", a:"Не більше 80 км/год на бокову колію; наступний світлофор відкритий і вимагає зменшеної швидкості"}
];
function exSignals(root){
  var all = SIGQ.map(function(s){ return s.a; }).concat(["Дозволяється проводити маневри", "Забороняється проводити маневри"]);
  var items = SIGQ.map(function(s){
    var wrong = shuffle(all.filter(function(x){ return x !== s.a; })).slice(0, 3);
    return {q:"Що означає це показання?", sig:{l:"y,g|r,y|w", on:s.on, strip:s.strip, label:"Н"}, a:s.a, choices:[s.a].concat(wrong), e:"", link:"syhnaly.html#основні-значення"};
  });
  items.push({q:"Що означає це показання маневрового світлофора?", sig:{l:"w,b", on:"0", label:"М1"}, a:"Дозволяється проводити маневри", choices:["Дозволяється проводити маневри", "Забороняється проводити маневри", "Запрошувальний сигнал", "Рух з готовністю зупинитися"], link:"syhnaly.html#маневрові-світлофори"});
  items.push({q:"Що означає це показання маневрового світлофора?", sig:{l:"w,b", on:"1", label:"М1"}, a:"Забороняється проводити маневри", choices:["Дозволяється проводити маневри", "Забороняється проводити маневри", "Стій! Рух заборонено для поїздів", "Колія вільна"], link:"syhnaly.html#маневрові-світлофори"});
  quiz(root, "Впізнай сигнал", items);
}
var SNDQ = [
  ["l", "Відправитися поїзду"], ["ll", "Відпустити гальма"], ["lll", "Гальмувати"],
  ["sss", "Стій!"], ["llls", "Поїзд прибув не в повному складі"], ["lllss", "Виклик помічника машиніста до локомотива"],
  ["lsss lsss", "Загальна тривога"], ["lss lss", "Пожежна тривога"], ["ss", "Тихіше"]
];
function exSounds(root){
  var all = SNDQ.map(function(s){ return s[1]; });
  quiz(root, "Сигнал на слух", SNDQ.map(function(s){
    return {q:"Що означає сигнал?", snd:s[0], a:s[1], choices:[s[1]].concat(shuffle(all.filter(function(x){ return x !== s[1]; })).slice(0, 3)), e:"Запис: " + window.UER_dots(s[0]), link:"syhnaly.html#звукові-сигнали"};
  }));
}

/* ===================== Порядок дій ===================== */
var ORDERS = {
  "Приймання поїзда": ["Переконатися, що колія приймання вільна", "Припинити маневри на маршруті приймання", "Приготувати маршрут приймання", "Відкрити вхідний світлофор", "Переконатися, що поїзд прибув у повному складі", "Повідомити станцію відправлення і ДНЦ, записати прибуття в ДУ-2"],
  "Відправлення поїзда": ["Переконатися у вільності перегону за приладами", "Отримати згоду сусідньої станції (встановити напрямок АБ)", "Припинити маневри на маршруті відправлення", "Приготувати маршрут відправлення", "Отримати доповідь машиніста про готовність", "Відкрити вихідний світлофор", "Записати час відправлення в ДУ-2", "Повідомити сусідню станцію і ДНЦ"],
  "Несправність АБ": ["Припинити відправлення, закрити вихідні, надіти червоні ковпачки", "Записати несправність у ДУ-46", "Попередити по радіо машиніста поїзда на перегоні", "Повідомити поїзного диспетчера", "Повідомити електромеханіка СЦБ"],
  "Приймання чергування": ["Ознайомитися з поїзним положенням і вільністю перегонів", "Перевірити справність пристроїв СЦБ, зв'язку та пломби", "Записати виявлені несправності в ДУ-46", "Перевірити інвентар згідно з описом", "Ознайомитися з записами в ДУ-2, ДУ-58, ДУ-60, ДУ-47", "Оформити вступ на чергування записами в журналах"]
};
function exOrder(root){
  var keys = Object.keys(ORDERS), cur = keys[0];
  root.innerHTML = '<div class="wtitle">Розстав дії ДСП по порядку</div><div class="tabs">' + keys.map(function(k, i){ return '<button data-k="' + k + '"' + (i ? "" : ' class="on"') + '>' + k + '</button>'; }).join("") + '</div><ol class="order"></ol><button class="btn primary" data-a="check">Перевірити</button><button class="btn" data-a="mix">↺ Перемішати</button><div class="status"></div>';
  var list = $(".order", root), st = $(".status", root), items;
  function load(k){ cur = k; items = shuffle(ORDERS[k]); if (items.join() === ORDERS[k].join()) items.reverse(); render(); st.className = "status"; st.textContent = "Розставте " + items.length + " дій."; }
  function render(marks){
    list.innerHTML = items.map(function(t, i){ return '<li class="' + (marks ? (marks[i] ? "ok" : "no") : "") + '"><span class="n">' + (i + 1) + '</span><span class="t">' + t + '</span><button data-u="' + i + '" aria-label="Вгору">▲</button><button data-d="' + i + '" aria-label="Вниз">▼</button></li>'; }).join("");
  }
  root.addEventListener("click", function(e){
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.k){ root.querySelectorAll(".tabs button").forEach(function(x){ x.classList.toggle("on", x === b); }); load(b.dataset.k); return; }
    if (b.dataset.u != null){ var i = +b.dataset.u; if (i > 0){ var t = items[i]; items[i] = items[i-1]; items[i-1] = t; } render(); return; }
    if (b.dataset.d != null){ var j = +b.dataset.d; if (j < items.length - 1){ var s = items[j]; items[j] = items[j+1]; items[j+1] = s; } render(); return; }
    if (b.dataset.a === "mix"){ load(cur); return; }
    if (b.dataset.a === "check"){
      var marks = items.map(function(t, i){ return ORDERS[cur][i] === t; }), ok = marks.filter(Boolean).length;
      render(marks);
      st.className = "status " + (ok === items.length ? "good" : "bad");
      st.textContent = ok === items.length ? "Усе правильно!" : "На своєму місці " + ok + " з " + items.length + ". Червоні рядки треба переставити.";
    }
  });
  load(cur);
}

/* ===================== Підсумковий тест ===================== */
var BANK = [
  {q:"Де влаштовують роз'їзди?", a:"На одноколійних лініях", c:["На двоколійних лініях","На одноколійних лініях","Тільки на сортувальних станціях","На під'їзних коліях"], link:"rozdilni-punkty.html"},
  {q:"Що НЕ належить до роздільних пунктів?", a:"Пасажирський зупинний пункт", c:["Колійний пост","Обгінний пункт","Прохідний світлофор АБ","Пасажирський зупинний пункт"], link:"rozdilni-punkty.html"},
  {q:"За якого відставання вістряка від рамної рейки перевід експлуатувати заборонено?", a:"4 мм і більше", c:["1 мм і більше","2 мм і більше","4 мм і більше","10 мм і більше"], link:"rozdilni-punkty.html#несправності-за-яких-експлуатувати-перевід-заборонено"},
  {q:"Як нумерують стрілки в парній горловині?", a:"Парними числами", c:["Непарними числами","Парними числами","Римськими цифрами","Літерами"], link:"rozdilni-punkty.html#горловини-та-нумерація"},
  {q:"Що є межею станції на одноколійному перегоні?", a:"Вхідні світлофори", c:["Вхідні світлофори","Знак «Межа станції»","Граничні стовпчики","Перший прохідний світлофор"], link:"rozdilni-punkty.html#межі-станції"},
  {q:"Яке основне призначення сортувальної станції?", a:"Сортування вагонів за напрямками і формування поїздів", c:["Обслуговування пасажирів і продаж квитків","Сортування вагонів за напрямками і формування поїздів","Зміна локомотивних бригад і екіпірування","Схрещення та обгін поїздів на одноколійці"], link:"stantsii.html#сортувальні-станції"},
  {q:"Що таке ТРА станції?", a:"Технічний паспорт станції з порядком її роботи", c:["Графік руху поїздів на дільниці","Технічний паспорт станції з порядком її роботи","Журнал руху поїздів і локомотивів","Наказ поїзного диспетчера про роботу"], link:"dokumenty.html"},
  {q:"Яка інструкція визначає систему видимих і звукових сигналів?", a:"ІСІ", c:["ПТЕ","ІСІ","ІРП","ТРА"], link:"dokumenty.html"},
  {q:"Що означає один жовтий вогонь вхідного світлофора?", a:"Рух з готовністю зупинитися; наступний світлофор закритий", c:["Рух із встановленою швидкістю; наступний світлофор відкритий","Рух з готовністю зупинитися; наступний світлофор закритий","Рух зі зменшеною швидкістю на бокову колію","Стій, проїжджати сигнал заборонено"], link:"syhnaly.html"},
  {q:"Яка максимальна швидкість за запрошувальним сигналом?", a:"20 км/год", c:["5 км/год","20 км/год","25 км/год","40 км/год"], link:"syhnaly.html#запрошувальний-сигнал"},
  {q:"Що вимагає вибух петарди?", a:"Негайної зупинки", c:["Зменшити швидкість","Подати свисток","Негайної зупинки","Нічого, це сигнал для бригади колії"], link:"syhnaly.html"},
  {q:"Яким вогнем маневрового світлофора маневри дозволено?", a:"Місячно-білим", c:["Зеленим","Синім","Місячно-білим","Жовтим"], link:"syhnaly.html#маневрові-світлофори"},
  {q:"Що є дозволом на зайняття перегону при АБ?", a:"Дозволяюче показання вихідного світлофора", c:["Колійна записка, видана ДСП","Ключ-жезл від апарата ЕЖС","Дозволяюче показання вихідного світлофора","Наказ поїзного диспетчера"], link:"blokuvannia.html"},
  {q:"Скільки поїздів може бути на перегоні при НАБ (без блокпостів)?", a:"Один", c:["Один","Два","Скільки блок-ділянок","Не обмежено"], link:"blokuvannia.html#напівавтоматичне-блокування-наб"},
  {q:"Яка станція може змінити напрямок двостороннього АБ звичайним способом?", a:"Та, у бік якої встановлено напрямок", c:["Будь-яка","Та, від якої встановлено напрямок","Та, у бік якої встановлено напрямок","Лише поїзний диспетчер"], link:"blokuvannia.html#одностороннє-та-двостороннє-аб"},
  {q:"Чим ДЦ відрізняється від ДК?", a:"ДЦ дозволяє диспетчеру керувати стрілками й сигналами", c:["Нічим, це дві назви однієї системи","ДЦ дозволяє диспетчеру керувати стрілками й сигналами","ДК дозволяє диспетчеру керувати стрілками й сигналами","ДЦ встановлюють тільки на великих станціях"], link:"blokuvannia.html#диспетчерський-контроль-і-диспетчерська-централізація"},
  {q:"Що відбувається на етапі «відкриття світлофора» в ЕЦ?", a:"Замикаються стрілки маршруту і виключаються зустрічні маршрути", c:["Стрілки маршруту переводяться в потрібне положення","Замикаються стрілки маршруту і виключаються зустрічні маршрути","Маршрут автоматично розмикається по секціях","Поїзд займає першу секцію маршруту"], link:"ets.html"},
  {q:"Яка типова витримка часу при скасуванні поїзного маршруту?", a:"6 хв", c:["6 с","1,5 хв","6 хв","15 хв"], link:"ets.html#скасування-маршруту"},
  {q:"Якого кольору головки маневрових кнопок на пульті?", a:"Білі", c:["Зелені","Червоні","Білі","Жовті"], link:"ets.html#кнопки-на-пульті"},
  {q:"У якому журналі ДСП записує накази поїзного диспетчера?", a:"ДУ-58", c:["ДУ-2","ДУ-46","ДУ-58","ДУ-60"], link:"blanky.html"},
  {q:"Якого кольору бланк ДУ-54?", a:"Зелений", c:["Білий","Зелений","Білий з жовтою смугою","Білий з червоною смугою"], link:"blanky.html#бланки-дозволів"},
  {q:"Коли оформлюється здача чергування в журналах?", a:"Після запису змінника про приймання", c:["До приходу змінника, заздалегідь","Після запису змінника про приймання","Одночасно з поїзним диспетчером","На початку наступної зміни"], link:"dsp.html#здача-чергування"},
  {q:"Яким словом ДНЦ затверджує наказ?", a:"«Виконуйте»", c:["«Добре»","«Вірно»","«Виконуйте»","«Прийнято»"], link:"dnc.html#накази-поїзного-диспетчера"},
  {q:"Як на графіку руху зображують пасажирські поїзди?", a:"Суцільною червоною лінією", c:["Пунктирною чорною","Суцільною червоною лінією","Штрих-пунктирною","Подвійною синьою"], link:"dnc.html#умовні-позначення-поїздів"},
  {q:"Як закривається вхідний світлофор після приймання?", a:"Автоматично після проходження першої колісної пари", c:["ДСП вручну після прибуття поїзда","Автоматично після проходження першої колісної пари","Машиніст з кабіни після зупинки","Автоматично через 6 хвилин після відкриття"], link:"pryimannia.html"},
  {q:"Яким бланком приймають поїзд при забороняючому вхідному?", a:"ДУ-59", c:["ДУ-50","ДУ-54","ДУ-59","ДУ-64"], link:"pryimannia.html#три-способи-дозволу"},
  {q:"Що означає відмітка «ЗС 13.20 Ч-2 2835» у ДУ-2?", a:"Запрошувальний сигнал, час, літер світлофора, лічильник", c:["Згода станції, час, номер колії, номер поїзда","Запрошувальний сигнал, час, літер світлофора, лічильник","Закриття перегону, час, колія, номер наказу","Заміна світлофора, час, колія, номер бланка"], link:"pryimannia.html"},
  {q:"Що треба перевірити перед відправленням при забороняючому вихідному?", a:"Вільність першої блок-ділянки", c:["Вільність усього перегону до сусідньої станції","Вільність першої блок-ділянки","Наявність попереджень","Справність АЛСН"], link:"vidpravlennia.html"},
  {q:"Що таке маневровий рейс?", a:"Пересування з колії на колію зі зміною напрямку", c:["Рух поїзда по перегону між станціями","Пересування з колії на колію зі зміною напрямку","Пересування маневрового составу в одному напрямку","Рух за запрошувальним сигналом"], link:"manevry.html"},
  {q:"За якої умови дозволяються маневри на головних коліях?", a:"З дозволу ДСП при закритих вхідних світлофорах", c:["Завжди, без жодних обмежень","З дозволу ДСП при закритих вхідних світлофорах","Тільки вночі, коли немає поїздів","За вказівкою машиніста маневрового локомотива"], link:"manevry.html#обмеження-під-час-маневрів"},
  {q:"Що є дозволом на зайняття перегону при телефонних засобах?", a:"Колійна записка ДУ-50", c:["Колійна записка ДУ-50","Бланк ДУ-54","Ключ-жезл","Попередження ДУ-61"], link:"telefonnyi.html"},
  {q:"Яка телефонограма передається станцією приймання у відповідь на «Чи можу відправити»?", a:"«Очікую поїзд № …»", c:["«Перегін вільний»","«Очікую поїзд № …»","«Виконуйте»","«Поїзд прибув»"], link:"telefonnyi.html"},
  {q:"При якій несправності дію АБ припиняють?", a:"Дозволяючий вогонь при зайнятій блок-ділянці", c:["Погас один прохідний світлофор","Дозволяючий вогонь при зайнятій блок-ділянці","Поїзд запізнюється","Несправний ПРЗ"], link:"telefonnyi.html#несправності-автоблокування"},
  {q:"Що є дозволом на зайняття перегону при перерві всіх засобів зв'язку?", a:"ДУ-56", c:["ДУ-50","ДУ-55","ДУ-56","ДУ-64"], link:"pererva.html"},
  {q:"Поїзд якого напрямку першим відправляють на одноколійний перегін при перерві зв'язку?", a:"Непарного", c:["Парного","Непарного","Будь-якого","Лише пасажирський"], link:"pererva.html#перший-поїзд-переважний-напрямок"},
  {q:"На який максимальний строк колійний майстер подає заявку на попередження?", a:"12 годин", c:["3 години","12 годин","5 діб","10 діб"], link:"poperedzhennia.html#заявки-на-видачу"},
  {q:"Хто дає наказ на відправлення відбудовного поїзда?", a:"Поїзний диспетчер", c:["ДСП","Машиніст поїзда, що зупинився","Поїзний диспетчер","Начальник станції"], link:"vidbudovni.html"},
  {q:"Який сигнал подають при прибутті поїзда не в повному складі?", a:"Три довгих і один короткий", c:["Три коротких","Три довгих і один короткий","Один довгий","Два довгих"], link:"syhnaly.html#звукові-сигнали"}
];
function exTest(root){
  quiz(root, "Підсумковий тест", BANK.map(function(b){ return {q:b.q, a:b.a, choices:b.c, link:b.link}; }), {n:20});
}
})();
