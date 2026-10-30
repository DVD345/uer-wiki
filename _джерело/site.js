/* УЕР Вікі — спільний скрипт: навігація, зміст, пошук, світлофори, звукові сигнали */
(function(){
"use strict";

var PAGES = [
  {g:"Початок"},
  {u:"index.html", t:"Головна", i:"home"},
  {u:"slovnyk.html", t:"Словник скорочень", i:"abc"},
  {u:"navchalni-video.html", t:"Навчальні відео", i:"video"},
  {u:"avtor.html", t:"Про автора", i:"account"},
  {g:"Основи"},
  {u:"rozdilni-punkty.html", t:"Роздільні пункти", i:"train"},
  {u:"stantsii.html", t:"Технологія роботи станцій", i:"domain"},
  {u:"dokumenty.html", t:"ПТЕ, ІСІ, ІРП і ТРА", i:"book"},
  {g:"СЦБ і зв'язок"},
  {u:"syhnaly.html", t:"Сигналізація", i:"traffic"},
  {u:"blokuvannia.html", t:"Блокування", i:"lock"},
  {u:"ets.html", t:"ЕЦ і маршрути", i:"tune"},
  {u:"skhema-stantsii.html", t:"Схема станції", i:"route"},
  {u:"zviazok.html", t:"Види зв'язку", i:"antenna"},
  {g:"Робота ДСП і ДНЦ"},
  {u:"dsp.html", t:"Черговий по станції", i:"person"},
  {u:"dnc.html", t:"Поїзний диспетчер", i:"timeline"},
  {u:"blanky.html", t:"Журнали та бланки", i:"assignment"},
  {g:"Організація руху поїздів"},
  {u:"pryimannia.html", t:"Приймання поїздів", i:"arrowin"},
  {u:"vidpravlennia.html", t:"Відправлення поїздів", i:"arrowout"},
  {u:"manevry.html", t:"Маневрова робота", i:"shuffle"},
  {u:"telefonnyi.html", t:"Телефонні засоби", i:"phone"},
  {u:"pererva.html", t:"Перерва всіх засобів", i:"block"},
  {u:"poperedzhennia.html", t:"Попередження", i:"warning"},
  {u:"vidbudovni.html", t:"Відбудовні поїзди", i:"build"},
  {g:"Практика"},
  {u:"trenazher.html", t:"Тренажер і тести", i:"school"}
];
window.UER_PAGES = PAGES;

/* ---------- іконки (Material Design, як у Wiki.js) ---------- */
var ICONS = {
  dashboard:"M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  bulb:"M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z",
  split:"M14 4l2.29 2.29-2.88 2.88 1.42 1.42 2.88-2.88L20 10V4zm-4 0H4v6l2.29-2.29 4.71 4.7V20h2v-8.41l-5.29-5.3z",
  home:"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  menu:"M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
  search:"M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  chevron:"M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  train:"M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  domain:"M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
  book:"M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z",
  traffic:"M20 10h-3V8.86c1.72-.45 3-2 3-3.86h-3V4c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1v1H4c0 1.86 1.28 3.41 3 3.86V10H4c0 1.86 1.28 3.41 3 3.86V15H4c0 1.86 1.28 3.41 3 3.86V20c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1.14c1.72-.45 3-2 3-3.86h-3v-1.14c1.72-.45 3-2 3-3.86zm-8 9c-1.11 0-2-.9-2-2s.89-2 2-2c1.1 0 2 .9 2 2s-.89 2-2 2zm0-5c-1.11 0-2-.9-2-2s.89-2 2-2c1.1 0 2 .9 2 2s-.89 2-2 2zm0-5c-1.11 0-2-.9-2-2 0-1.11.89-2 2-2 1.1 0 2 .89 2 2 0 1.1-.89 2-2 2z",
  lock:"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  tune:"M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z",
  antenna:"M12 5c-3.87 0-7 3.13-7 7h2c0-2.76 2.24-5 5-5s5 2.24 5 5h2c0-3.87-3.13-7-7-7zm1 9.29c.88-.39 1.5-1.26 1.5-2.29 0-1.38-1.12-2.5-2.5-2.5S9.5 10.62 9.5 12c0 1.02.62 1.9 1.5 2.29v3.3L7.59 21 9 22.41l3-3 3 3L16.41 21 13 17.59v-3.3zM12 1C5.93 1 1 5.93 1 12h2c0-4.97 4.03-9 9-9s9 4.03 9 9h2c0-6.07-4.93-11-11-11z",
  person:"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  timeline:"M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z",
  assignment:"M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
  arrowin:"M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  arrowout:"M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z",
  shuffle:"M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
  phone:"M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  block:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z",
  warning:"M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
  build:"M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z",
  school:"M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z",
  abc:"M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z",
  route:"M19 15.18V7c0-2.21-1.79-4-4-4s-4 1.79-4 4v10c0 1.1-.9 2-2 2s-2-.9-2-2V8.82C8.16 8.4 9 7.3 9 6c0-1.66-1.34-3-3-3S3 4.34 3 6c0 1.3.84 2.4 2 2.82V17c0 2.21 1.79 4 4 4s4-1.79 4-4V7c0-1.1.9-2 2-2s2 .9 2 2v8.18c-1.16.41-2 1.51-2 2.82 0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.3-.84-2.4-2-2.82z",
  video:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z",
  library:"M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z",
  print:"M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z",
  link:"M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
  up:"M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z",
  account:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z",
  tag:"M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z",
  edit:"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  quote:"M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z",
  eye:"M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  hand:"M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z",
  volume:"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
  flag:"M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z",
  signpost:"M13 10h5l3-3-3-3h-5V2h-2v2H4v6h7v2H6l-3 3 3 3h5v4h2v-4h7v-6h-7v-2zM6 6h11.17l1 1-1 1H6V6zm12 10H6.83l-1-1 1-1H18v2z"
};
function icon(n, cls){ return '<svg class="mi' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICONS[n] || "") + '"/></svg>'; }
window.UER_icon = icon;
function fillIcons(root){ root.querySelectorAll("[data-ico]").forEach(function(el){ el.innerHTML = icon(el.getAttribute("data-ico")); }); }

var here = (location.pathname.split("/").pop() || "index.html");
if (here.indexOf(".html") < 0) here = "index.html";
here = decodeURIComponent(here);


/* ---------- збільшення малюнків ІСІ ---------- */
function initZoom(){
  var imgs = document.querySelectorAll("figure.isi img, .fpair img"), refs = document.querySelectorAll(".isi-ref[data-img]");
  if (!imgs.length && !refs.length) return;
  var z = document.createElement("div"); z.className = "zoom"; z.innerHTML = "<img alt=\"\">";
  document.body.appendChild(z);
  z.addEventListener("click", function(){ z.classList.remove("on"); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") z.classList.remove("on"); });
  imgs.forEach(function(im){ im.addEventListener("click", function(){ var t = z.querySelector("img"); t.src = im.src; t.alt = im.alt; z.classList.add("on"); }); });
  refs.forEach(function(b){ b.addEventListener("click", function(){ var t = z.querySelector("img"); t.src = b.getAttribute("data-img"); t.alt = b.textContent; z.classList.add("on"); }); });
}

document.addEventListener("DOMContentLoaded", function(){
  fillIcons(document); buildNav(); buildToc(); initSide(); buildPager(); initSearch(); renderSignals(document); initTabs(document); initSounds(document); initBlanks(document); initZoom();
  var bg = document.querySelector(".burger");
  if (bg) bg.addEventListener("click", function(){ document.body.classList.toggle("nav-open"); });
  var sc = document.querySelector(".scrim");
  if (sc) sc.addEventListener("click", function(){ document.body.classList.remove("nav-open"); });
});


/* ---------- бокова колонка: кнопки друку, посилання, вгору ---------- */
function initSide(){
  document.querySelectorAll("[data-act]").forEach(function(b){
    b.addEventListener("click", function(){
      var a = b.getAttribute("data-act");
      if (a === "print") window.print();
      if (a === "top") window.scrollTo(0, 0);
      if (a === "link"){
        var done = function(){ b.classList.add("ok"); setTimeout(function(){ b.classList.remove("ok"); }, 1200); };
        try { navigator.clipboard.writeText(location.href.split("#")[0]).then(done, done); } catch(e){ done(); }
      }
    });
  });
  var fab = document.querySelector(".fab-top");
  if (fab) addEventListener("scroll", function(){ fab.classList.toggle("show", scrollY > 400); }, {passive:true});
}
/* ---------- навігація ---------- */
function buildNav(){
  var nav = document.querySelector(".sidenav"); if (!nav) return;
  var h = "", inFold = false;
  function closeFold(){ if (inFold){ h += '</div></div>'; inFold = false; } }
  PAGES.forEach(function(p, k){
    if (!p.s) closeFold();
    if (p.g) { h += (h ? '<hr class="div">' : '') + '<div class="grp">' + p.g + '</div>'; return; }
    if (p.f) {
      var kids = [], open = false;
      for (var j = k + 1; j < PAGES.length && PAGES[j].s; j++) if (PAGES[j].u === here) open = true;
      try { if (localStorage.getItem("uer-fold-" + p.f) === "1") open = true; } catch(e){}
      h += '<div class="fold' + (open ? ' open' : '') + (open && !kids.length ? '' : '') + '" data-f="' + p.f + '"><button type="button" class="fold-h" aria-expanded="' + open + '"><span class="i">' + icon(p.i) + '</span><span>' + p.f + '</span><span class="chev">' + icon("chevron") + '</span></button><div class="fold-b">';
      inFold = true; return;
    }
    var cl = (p.s ? "sub" : "") + (p.u === here ? " active" : "");
    h += '<a href="' + p.u + '"' + (cl.trim() ? ' class="' + cl.trim() + '"' : '') + '><span class="i">' + icon(p.i) + '</span><span>' + p.t + '</span></a>';
  });
  closeFold();
  nav.innerHTML = h;
  nav.querySelectorAll(".fold").forEach(function(f){
    if (f.querySelector(".active")) f.classList.add("has-active");
    f.querySelector(".fold-h").addEventListener("click", function(){
      var o = f.classList.toggle("open");
      this.setAttribute("aria-expanded", o);
      try { localStorage.setItem("uer-fold-" + f.dataset.f, o ? "1" : "0"); } catch(e){}
    });
  });
  var act = nav.querySelector(".active"); if (act && act.scrollIntoView) { var r = act.getBoundingClientRect(); if (r.top > innerHeight - 80) nav.scrollTop = r.top - 200; }
}
function slug(s){ return s.toLowerCase().replace(/[«»"'’.,:;!?()№/]/g,"").trim().replace(/\s+/g,"-").slice(0,60); }
function buildToc(){
  var box = document.querySelector(".toc .body"), content = document.querySelector(".content");
  if (!content) return;
  var hs = content.querySelectorAll("h2, h3"), used = {}, h = "";
  if (content.querySelectorAll("h2").length > 12) hs = content.querySelectorAll("h2, .selfcheck > h3");
  hs.forEach(function(el){
    if (!el.id){ var s = slug(el.textContent); while (used[s]) s += "-"; el.id = s; }
    used[el.id] = 1;
    var a = document.createElement("a"); a.className = "anchor"; a.href = "#" + el.id; a.textContent = "¶"; el.appendChild(a);
    h += '<a class="' + (el.tagName === "H3" ? "l3" : "l2") + '" href="#' + el.id + '">' + icon("chevron") + '<span>' + el.firstChild.textContent + '</span></a>';
  });
  if (box) { box.innerHTML = h || '<span style="color:var(--muted)">—</span>'; }
  if (box && "IntersectionObserver" in window){
    var links = box.querySelectorAll("a");
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){
        links.forEach(function(l){ l.classList.toggle("on", l.getAttribute("href") === "#" + e.target.id); });
      }});
    }, {rootMargin:"-70px 0px -70% 0px"});
    hs.forEach(function(el){ io.observe(el); });
  }
}
function buildPager(){
  var c = document.querySelector(".content"); if (!c) return;
  var list = PAGES.filter(function(p){ return p.u; }), idx = -1;
  list.forEach(function(p,i){ if (p.u === here) idx = i; });
  if (idx < 0) return;
  var prev = list[idx-1], next = list[idx+1], h = '<div class="pager">';
  if (prev) h += '<a href="' + prev.u + '"><small>← Попередня</small>' + prev.t + '</a>';
  if (next) h += '<a class="next" href="' + next.u + '"><small>Наступна →</small>' + next.t + '</a>';
  c.insertAdjacentHTML("beforeend", h + "</div>");
}

/* ---------- пошук ---------- */
function initSearch(){
  var inp = document.querySelector(".search input"), out = document.querySelector(".search-results");
  if (!inp || !out) return;
  var sel = -1;
  function esc(s){ return s.replace(/[&<>]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]; }); }
  function run(){
    var q = inp.value.trim().toLowerCase(); sel = -1;
    if (q.length < 2 || !window.UER_SEARCH){ out.classList.remove("open"); out.innerHTML = ""; return; }
    var words = q.split(/\s+/), hits = [];
    window.UER_SEARCH.forEach(function(p){
      p.s.forEach(function(sec){
        var txt = (sec.h + " " + sec.x).toLowerCase(), score = 0;
        for (var i=0;i<words.length;i++){ var k = txt.indexOf(words[i]); if (k < 0) return; score += (sec.h.toLowerCase().indexOf(words[i]) >= 0 ? 5 : 1); }
        if (p.t.toLowerCase().indexOf(words[0]) >= 0) score += 3;
        var low = sec.x.toLowerCase(), pos = low.indexOf(words[0]), start = Math.max(0, pos - 50);
        var snip = (start ? "…" : "") + sec.x.slice(start, start + 140) + "…";
        hits.push({u:p.u + (sec.id ? "#" + sec.id : ""), t:p.t + (sec.h && sec.h !== p.t ? " › " + sec.h : ""), s:snip, sc:score});
      });
    });
    hits.sort(function(a,b){ return b.sc - a.sc; });
    hits = hits.slice(0, 12);
    if (!hits.length){ out.innerHTML = '<a><span>Нічого не знайдено</span></a>'; out.classList.add("open"); return; }
    var re = new RegExp("(" + words.map(function(w){ return w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }).join("|") + ")", "gi");
    out.innerHTML = hits.map(function(h){ return '<a href="' + h.u + '"><b>' + esc(h.t) + '</b><span>' + esc(h.s).replace(re, "<mark>$1</mark>") + '</span></a>'; }).join("");
    out.classList.add("open");
  }
  inp.addEventListener("input", run);
  inp.addEventListener("focus", run);
  inp.addEventListener("keydown", function(e){
    var items = out.querySelectorAll("a[href]");
    if (e.key === "ArrowDown"){ sel = Math.min(items.length-1, sel+1); e.preventDefault(); }
    else if (e.key === "ArrowUp"){ sel = Math.max(0, sel-1); e.preventDefault(); }
    else if (e.key === "Enter"){ if (items[Math.max(sel,0)]) location.href = items[Math.max(sel,0)].getAttribute("href"); return; }
    else if (e.key === "Escape"){ out.classList.remove("open"); inp.blur(); return; }
    else return;
    items.forEach(function(a,i){ a.classList.toggle("sel", i === sel); });
  });
  document.addEventListener("click", function(e){ if (!e.target.closest(".search")) out.classList.remove("open"); });
  document.addEventListener("keydown", function(e){ if (e.key === "/" && document.activeElement.tagName !== "INPUT"){ e.preventDefault(); inp.focus(); } });
}

/* ---------- світлофори ----------
   <span class="signal" data-l="y,g,r,y,w" data-on="0b,3" data-label="Н"></span>
   l: кольори ламп зверху вниз (y жовтий, g зелений, r червоний, w місячно-білий, b синій)
   on: номери ввімкнених ламп (b = мигає); strip: g/y — світлова смуга під головкою */
var COL = {y:"#ffd21f", g:"#22f06a", r:"#ff2a1f", w:"#f4f8ff", b:"#3b5bff"};
var SIGN = 0;
/* Світлофори в стилі малюнків Інструкції з сигналізації (ІСІ): небо, чорні головки,
   сірі вимкнені лінзи, металева щогла, біла табличка з літерою.
   type: mast (щогловий, за замовчуванням), dwarf (карликовий), bracket (на консолі)
   l: лампи зверху вниз; "|" розділяє головки. Від 4 ламп щогловий ділиться на головки по дві (як вхідний УЗ). */
function signalSVG(spec){
  var type = spec.type || (spec.mast === "0" ? "dwarf" : "mast");
  var raw = spec.l, heads, id = "s" + (++SIGN);
  if (raw.indexOf("|") >= 0) heads = raw.split("|").map(function(h){ return h.split(","); });
  else {
    var all = raw.split(",");
    if (all.length <= 3 || type === "dwarf") heads = [all];
    else { heads = []; for (var i = 0; i < all.length; i += 2) heads.push(all.slice(i, i + 2)); }
  }
  var on = {};
  (spec.on || "").split(",").forEach(function(x){ x = x.trim(); if (!x) return; on[parseInt(x,10)] = x.indexOf("b") > 0 ? "b" : "s"; });
  var label = spec.label || "";
  var dw = type === "dwarf", R = dw ? 9 : 10.5, STEP = dw ? 22 : 26, HW = dw ? 28 : 34;
  var W = type === "bracket" ? 112 : (dw ? 84 : 92), cx = type === "bracket" ? 44 : (dw ? 38 : W/2);
  var top = type === "bracket" ? 34 : (dw ? 30 : 16);
  var hh = heads.map(function(h){ return h.length === 1 ? 2*R + 12 : h.length * STEP + 10; });
  var hw = heads.map(function(h){ return h.length === 1 ? 2*R + 12 : HW; });
  var GAP = 6, headsH = hh.reduce(function(a,b){ return a + b; }, 0) + GAP * (heads.length - 1);
  var stripH = spec.strip ? 18 : 0, plateH = label ? (dw ? 0 : 14 + 13 * Math.max(1, label.replace(/[^0-9А-ЯІЇЄA-Z]/g,"").length > 1 ? 2 : 1)) : 0;
  var H = dw ? top + headsH + 44 : top + headsH + stripH + plateH + 64;
  var d = '<defs>' +
    '<linearGradient id="' + id + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb4ea"/><stop offset=".55" stop-color="#b7d7f4"/><stop offset="1" stop-color="#e3f1fb"/></linearGradient>' +
    '<linearGradient id="' + id + 'met" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7c7c7c"/><stop offset=".45" stop-color="#f2f2f2"/><stop offset="1" stop-color="#8a8a8a"/></linearGradient>' +
    '<radialGradient id="' + id + 'off" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#a3a3a3"/><stop offset="1" stop-color="#6f6f6f"/></radialGradient>' +
    '<filter id="' + id + 'gl" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="4"/></filter>';
  Object.keys(COL).forEach(function(c){
    d += '<radialGradient id="' + id + c + '" cx=".42" cy=".38" r=".65"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="' + COL[c] + '"/><stop offset="1" stop-color="' + COL[c] + '"/></radialGradient>';
  });
  d += '</defs>';
  var bg = '<rect x=".5" y=".5" width="' + (W-1) + '" height="' + (H-1) + '" rx="6" fill="url(#' + id + 'sky)" stroke="rgba(0,0,0,.25)"/>';
  function mast(x, y1, y2, w){ return '<rect x="' + (x - w/2) + '" y="' + y1 + '" width="' + w + '" height="' + (y2 - y1) + '" fill="url(#' + id + 'met)"/>'; }
  function lampSet(x0, y0){
    var out = "", glow = "", idx = 0, y = y0;
    heads.forEach(function(h, hi){
      var w = hw[hi], r = h.length === 1 ? R : R;
      if (h.length === 1) out += '<circle cx="' + x0 + '" cy="' + (y + hh[hi]/2) + '" r="' + (w/2) + '" fill="#0b0b0b"/>';
      else out += '<rect x="' + (x0 - w/2) + '" y="' + y + '" width="' + w + '" height="' + hh[hi] + '" rx="' + (w/2) + '" fill="#0b0b0b"/>';
      h.forEach(function(c, k){
        var cy = h.length === 1 ? y + hh[hi]/2 : y + 5 + STEP/2 + k * STEP, st = on[idx];
        out += '<circle cx="' + x0 + '" cy="' + cy + '" r="' + r + '" fill="url(#' + id + 'off)"/>';
        if (st){
          glow += '<g' + (st === "b" ? ' class="blink"' : '') + '><circle cx="' + x0 + '" cy="' + cy + '" r="' + (r + 5) + '" fill="' + COL[c] + '" opacity=".75" filter="url(#' + id + 'gl)"/>' +
            '<circle cx="' + x0 + '" cy="' + cy + '" r="' + r + '" fill="url(#' + id + c + ')"/></g>';
        }
        idx++;
      });
      y += hh[hi] + GAP;
    });
    return out + glow;
  }
  function plate(x0, y0){
    var parts = label.match(/^([^0-9]*)(.*)$/), rows = [];
    if (parts[1]) rows.push(parts[1]); if (parts[2]) rows.push(parts[2]);
    var w = Math.max(16, Math.max.apply(null, rows.map(function(r){ return r.length; })) * 8 + 6), h = rows.length * 13 + 5;
    var t = '<rect x="' + (x0 - w/2) + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#fff" stroke="#333" stroke-width=".8"/>';
    rows.forEach(function(r, i){ t += '<text x="' + x0 + '" y="' + (y0 + 14 + i*13) + '" font-size="11.5" font-family="Arial,sans-serif" text-anchor="middle" fill="#111">' + r + '</text>'; });
    return t;
  }
  function strip(x0, y0){
    var t = '<rect x="' + (x0 - 18) + '" y="' + y0 + '" width="36" height="12" fill="#0b0b0b"/>';
    for (var i = 0; i < 6; i++) t += '<circle cx="' + (x0 - 12.5 + i*5) + '" cy="' + (y0 + 6) + '" r="1.9" fill="' + (spec.strip ? COL[spec.strip] : "#555") + '"/>';
    return t;
  }
  var body = d + bg;
  if (dw){
    var by = top + headsH + 6;
    body += mast(cx, top + headsH - 4, by + 4, 9);
    body += '<path d="M' + (cx - 16) + ' ' + by + ' h32 l7 ' + (H - by - 4) + ' h-46 z" fill="#8d8d8d" stroke="#5f5f5f"/>';
    body += '<path d="M' + (cx - 16) + ' ' + by + ' h32 l7 ' + (H - by - 4) + ' h-46 z" fill="url(#' + id + 'met)" opacity=".35"/>';
    if (label) body += '<rect x="' + (cx - 12) + '" y="' + (by + 9) + '" width="24" height="13" fill="#fff" stroke="#333" stroke-width=".8"/><text x="' + cx + '" y="' + (by + 19.5) + '" font-size="10.5" font-family="Arial,sans-serif" text-anchor="middle" fill="#111">' + label + '</text>';
    body += lampSet(cx, top);
  } else if (type === "bracket"){
    var beamY = 10;
    body += mast(W - 16, beamY, H, 10);
    body += '<rect x="8" y="' + beamY + '" width="' + (W - 16) + '" height="14" fill="none" stroke="#7d93a3" stroke-width="2.4"/>';
    for (var bx = 8; bx < W - 16; bx += 12) body += '<path d="M' + bx + ' ' + (beamY + 14) + ' L' + (bx + 12) + ' ' + beamY + '" stroke="#7d93a3" stroke-width="1.6"/>';
    body += mast(cx, beamY + 14, top + 4, 6);
    body += lampSet(cx, top);
    if (spec.strip) body += strip(cx, top + headsH + 4);
    if (label) body += plate(cx, top + headsH + stripH + 8);
  } else {
    body += mast(cx, top + headsH - 6, H, 11);
    body += lampSet(cx, top);
    if (spec.strip) body += strip(cx, top + headsH + 4);
    if (label) body += plate(cx, top + headsH + stripH + 10);
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img">' + body + '</svg>';
}
window.UER_signalSVG = signalSVG;

/* ---------- світлофори у стилі SimRail Wiki ----------
   <span class="sr" data-l="y,g|r,y|w" data-on="0b,3" data-strip="1" data-label="Ч1" data-type="mast|dwarf|head"></span>
   y жовтий, g зелений, r червоний, w місячно-білий, b синій; b після номера — мигає;
   data-strip: 0 смуга є, але не світить; 1 світить; b мигає */
/* Пласкі значки світлофорів у стилі SimRail Wiki, розташування вогнів за ІСІ. */
var SR_COL = {y:"#ffc400", g:"#19c219", r:"#ee1c1c", w:"#ffffff", b:"#2f6dff"}, SR_OFF = "#3b3b3b";
function srSvg(d){
  var heads = d.l.split("|").map(function(h){ return h.split(","); });
  var on = {}; (d.on || "").split(",").forEach(function(s){ s = s.trim(); if (s) on[parseInt(s, 10)] = /b$/.test(s) ? "b" : "s"; });
  var type = d.type || "mast", cab = type === "cab", dwarf = type === "dwarf";
  var W = 64, cx = 32, HW = cab ? 22 : 24, R = cab ? 5 : 5.6, ST = cab ? 13 : 14.5, o = [], y = 8, idx = 0, stripAt = -1;
  if (d.strip != null && d.strip !== "") heads.forEach(function(h, i){ if (h.length > 1) stripAt = i; });
  function lens(x, yy, c, i){
    var st = on[i], lit = !!st, cls = st === "b" ? ' class="bk"' : "";
    if (st === "b"){ var save = on[i]; delete on[i]; var under0 = lens(x, yy, c, i); on[i] = save; return under0 + lens1(); }
    return lens1();
    function lens1(){
    if (c === "x"){
      return '<path d="M' + (x - R) + ' ' + yy + 'a' + R + ' ' + R + ' 0 0 1 ' + 2 * R + ' 0z" fill="' + (lit ? SR_COL.y : SR_OFF) + '"' + cls + '/>' +
             '<path d="M' + (x - R) + ' ' + yy + 'a' + R + ' ' + R + ' 0 0 0 ' + 2 * R + ' 0z" fill="' + (lit ? SR_COL.r : SR_OFF) + '"' + cls + '/>';
    }
    return '<circle cx="' + x + '" cy="' + yy + '" r="' + R + '" fill="' + (lit ? SR_COL[c] : SR_OFF) + '"' + cls + '/>';
    }
  }
  var top = y, parts = [];
  heads.forEach(function(h, hi){
    if (h.length === 1 && d.shape === "diamond"){
      var a = 14; parts.push('<path d="M' + cx + ' ' + y + 'l' + a + ' ' + a + 'l-' + a + ' ' + a + 'l-' + a + ' -' + a + 'z" fill="#0b0b0b" stroke="#000"/>' + lens(cx, y + a, h[0], idx));
      idx += 1; y += 2 * a;
    } else {
      var hh = (h.length - 1) * ST + HW;
      parts.push('<rect x="' + (cx - HW / 2) + '" y="' + y + '" width="' + HW + '" height="' + hh + '" rx="' + (cab ? 3 : HW / 2) + '" fill="#0b0b0b" stroke="#000"/>');
      h.forEach(function(c, k){ parts.push(lens(cx, y + HW / 2 + k * ST, c, idx + k)); });
      idx += h.length; y += hh;
    }
    if (hi === stripAt){
      y += 3; var sl = d.strip !== "0", sc = d.strip === "b" ? ' class="bk"' : "";
      parts.push('<rect x="' + (cx - 15) + '" y="' + y + '" width="30" height="8" rx="2" fill="#0b0b0b"/>');
      [-9, 0, 9].forEach(function(dx){ var rr = '<rect x="' + (cx + dx - 3.5) + '" y="' + (y + 2.5) + '" width="7" height="3" fill="'; parts.push((sc ? rr + SR_OFF + '"/>' : "") + rr + (sl ? SR_COL.g : SR_OFF) + '"' + sc + '/>'); });
      y += 8;
    }
    if (d.ind && hi === heads.length - 1){
      y += 3; var litN = d.ind === "Н"; parts.push('<rect x="' + (cx - 10) + '" y="' + y + '" width="20" height="26" rx="2" fill="#0b0b0b"/>');
      for (var r = 0; r < 7; r++) for (var c = 0; c < 5; c++){ var lt = litN && (c === 0 || c === 4 || r === 3); parts.push('<circle cx="' + (cx - 6 + c * 3) + '" cy="' + (y + 4 + r * 3) + '" r="1.1" fill="' + (lt ? "#fff" : "#333") + '"/>'); }
      y += 26;
    }
    y += 4;
  });
  var label = d.label || "", rows = !label ? [] : (label.indexOf("|") >= 0 ? label.split("|") : label.match(/^([^0-9]*)(.*)$/).slice(1).filter(Boolean));
  var under = [], ground;
  if (cab){ ground = y; }
  else if (dwarf){
    under.push('<path d="M' + (cx - 12) + ' ' + y + 'h24l5 12h-34z" fill="#8a8a8a"/>');
    if (label) under.push('<rect x="' + (cx - 11) + '" y="' + (y + 3) + '" width="22" height="7" fill="#fff"/><text x="' + cx + '" y="' + (y + 9) + '" font-size="6.5" font-weight="700" text-anchor="middle" fill="#000" font-family="Roboto,Arial,sans-serif">' + label.replace("|", "") + '</text>');
    ground = y + 12;
  } else {
    var py = y + 2, pw = Math.max(14, Math.max.apply(null, rows.map(function(r){ return r.length; }).concat(1)) * 5.2 + 4), ph = rows.length * 7.5 + 2;
    if (rows.length){
      under.push('<rect x="' + (cx - pw / 2) + '" y="' + py + '" width="' + pw + '" height="' + ph + '" fill="#fff" stroke="#000" stroke-width=".6"/>');
      rows.forEach(function(r, i){ under.push('<text x="' + cx + '" y="' + (py + 7 + i * 7.5) + '" font-size="7" font-weight="700" text-anchor="middle" fill="#000" font-family="Roboto,Arial,sans-serif">' + r + '</text>'); });
    }
    var pb = py + (rows.length ? ph + 2 : 0);
    if (d.stripe && d.shape !== "diamond"){
      under.push('<clipPath id="cp' + srSvg.n + '"><rect x="' + (cx - 8) + '" y="' + pb + '" width="16" height="22"/></clipPath><rect x="' + (cx - 8) + '" y="' + pb + '" width="16" height="22" fill="#fff" stroke="#000" stroke-width=".6"/><g clip-path="url(#cp' + srSvg.n + ')" stroke="#000" stroke-width="3">' +
        [0, 8, 16, 24].map(function(k){ return '<line x1="' + (cx - 8) + '" y1="' + (pb + k + 4) + '" x2="' + (cx + 8) + '" y2="' + (pb + k - 8) + '"/>'; }).join("") + '</g>');
      pb += 24;
    }
    if (d.tsign){
      var ty = y + 16; under.push('<path d="M' + (cx + 2) + ' ' + (ty + 9) + 'h12" stroke="#bbb" stroke-width="2"/><path d="M' + (cx + 22) + ' ' + ty + 'l9 9l-9 9l-9 -9z" fill="#0b0b0b" stroke="#fff" stroke-width="1.2"/>');
      [[-3, -3], [0, -3], [3, -3], [0, 0], [0, 3]].forEach(function(q){ under.push('<circle cx="' + (cx + 22 + q[0]) + '" cy="' + (ty + 9 + q[1]) + '" r="1" fill="#fff"/>'); });
    }
    ground = Math.max(pb + 26, y + 34);
  }
  srSvg.n++;
  var poleTop = top + 6, pole = "";
  if (!cab && !dwarf){
    if (d.stripe && d.shape === "diamond"){
      pole = '<rect x="' + (cx - 1.75) + '" y="' + poleTop + '" width="3.5" height="' + (ground - poleTop) + '" fill="#fff"/>';
      for (var sy = y; sy < ground; sy += 8) pole += '<rect x="' + (cx - 1.75) + '" y="' + sy + '" width="3.5" height="4" fill="#111"/>';
    } else pole = '<rect x="' + (cx - 1.75) + '" y="' + poleTop + '" width="3.5" height="' + (ground - poleTop) + '" fill="#e8e8e8"/>';
  }
  var cross = "";
  if (d.cross){ var c0 = top - 2, c1 = y; cross = '<g stroke="#fff" stroke-width="3"><line x1="' + (cx - 16) + '" y1="' + c0 + '" x2="' + (cx + 16) + '" y2="' + c1 + '"/><line x1="' + (cx + 16) + '" y1="' + c0 + '" x2="' + (cx - 16) + '" y2="' + c1 + '"/></g>'; }
  var H = ground + 4;
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + (d.alt || "") + '">' + pole + parts.join("") + under.join("") + cross + '</svg>';
}
srSvg.n = 0;
function srImg(el){ var d = {}; for (var k in el.dataset) d[k] = el.dataset[k]; d.alt = el.getAttribute("title") || ""; return srSvg(d); }

function renderSignals(root){
  root.querySelectorAll(".signal[data-l]").forEach(function(el){
    el.innerHTML = signalSVG({l:el.dataset.l, on:el.dataset.on, label:el.dataset.label, mast:el.dataset.mast, strip:el.dataset.strip, type:el.dataset.type});
  });
  root.querySelectorAll(".sr[data-l]").forEach(function(el){ el.innerHTML = srImg(el); });
}
window.UER_renderSignals = renderSignals;

/* вкладки «Сторінка 1 / 2» над широкими таблицями */
function initTabs(root){
  root.querySelectorAll(".stabs").forEach(function(t){
    var bs = t.querySelectorAll(".stabs-bar button"), ps = t.querySelectorAll(":scope > .stabs-p");
    bs.forEach(function(b, i){ b.addEventListener("click", function(){
      bs.forEach(function(x, j){ x.classList.toggle("on", i === j); x.setAttribute("aria-selected", i === j); });
      ps.forEach(function(p, j){ p.classList.toggle("on", i === j); });
    }); });
  });
}

/* ---------- звукові сигнали ----------
   <span class="snd" data-snd="lsss lsss"></span>  s — короткий, l — довгий, пробіл — пауза між групами */
var actx = null, BUF = null, cur = null;
function ctx(){ try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ return null; } if (actx.state === "suspended") actx.resume(); return actx; }
function loadHorn(cb){
  if (BUF) return cb(BUF);
  var c = ctx(), H = window.UER_HORN; if (!c || !H) return cb(null);
  var out = {}, left = 2;
  ["s","l"].forEach(function(k){
    var bin = atob(H[k]), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    var fin = function(buf){ out[k] = buf; if (--left === 0){ BUF = (out.s && out.l) ? out : null; cb(BUF); } };
    try { var pr = c.decodeAudioData(arr.buffer, fin, function(){ fin(null); }); if (pr && pr.catch) pr.catch(function(){}); } catch(e){ fin(null); }
  });
}
/* зупинити поточний сигнал */
function stopSound(){
  if (!cur) return;
  cur.nodes.forEach(function(n){ try { n.stop(); } catch(e){} });
  clearTimeout(cur.timer);
  var d = cur.done; cur = null;
  if (d) d();
}
window.UER_stop = stopSound;
/* програти сигнал: s — короткий, l — довгий, пробіл — пауза між групами. Новий сигнал зупиняє попередній. */
function playPattern(pat, done){
  stopSound();
  var c = ctx(); if (!c) return;
  var me = {nodes:[], done:done, timer:0}; cur = me;
  loadHorn(function(buf){
    if (cur !== me) return;
    var t = c.currentTime + 0.05, master = c.createGain(); master.gain.value = 0.27; master.connect(c.destination);
    pat.split("").forEach(function(ch){
      if (ch === " "){ t += buf ? 0.9 : 0.6; return; }
      /* тривалість гудка береться із самого запису (короткий ~0,8 с, довгий ~3 с): наступний починається лише після паузи, щоб гудки не зливались */
      var d = buf ? buf[ch === "l" ? "l" : "s"].duration : (ch === "l" ? 1.5 : 0.45), src;
      if (buf){
        src = c.createBufferSource(); src.buffer = buf[ch === "l" ? "l" : "s"]; src.connect(master); src.start(t);
      } else {
        src = c.createOscillator(); var g = c.createGain(); src.type = "sawtooth"; src.frequency.value = 311;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .05); g.gain.setValueAtTime(.12, t + d - .08); g.gain.linearRampToValueAtTime(0, t + d);
        src.connect(g); g.connect(master); src.start(t); src.stop(t + d + .02);
      }
      me.nodes.push(src);
      t += d + (buf ? 0.35 : 0.3);
    });
    me.timer = setTimeout(function(){ if (cur === me){ cur = null; if (me.done) me.done(); } }, (t - c.currentTime + 0.6) * 1000);
  });
}
window.UER_play = playPattern;
/* кнопка «Слухати / Стоп» */
function bindPlay(btn, pat, label){
  label = label || "▶ Слухати";
  btn.textContent = label;
  btn.addEventListener("click", function(){
    if (btn.classList.contains("on")){ stopSound(); return; }
    document.querySelectorAll(".play.on").forEach(function(b){ b.classList.remove("on"); b.textContent = b.dataset.label; });
    btn.dataset.label = label; btn.classList.add("on"); btn.textContent = "■ Стоп";
    playPattern(typeof pat === "function" ? pat() : pat, function(){ btn.classList.remove("on"); btn.textContent = label; });
  });
}
window.UER_bindPlay = bindPlay;
function dotsFor(p){ return p.split("").map(function(c){ return c === "l" ? "▬" : c === "s" ? "●" : "  "; }).join(""); }
window.UER_dots = dotsFor;
function initSounds(root){
  root.querySelectorAll(".snd[data-snd]").forEach(function(el){
    var p = el.dataset.snd;
    el.innerHTML = '<button class="play" type="button"></button><span class="dots">' + p.split(" ").map(function(g){ return '<span class="g">' + dotsFor(g) + '</span>'; }).join(" ") + '</span>';
    bindPlay(el.querySelector("button"), p);
  });
}
window.UER_initSounds = initSounds;

/* ---------- бланки ----------
   <span class="blank" data-b="white|red2|red1|yellow|green" data-f="ДУ-56"></span> */
function initBlanks(root){
  root.querySelectorAll(".blank[data-b]").forEach(function(el){
    var b = el.dataset.b, h = "";
    el.classList.add(b === "green" ? "green" : "white");
    if (b === "red2") h = '<span class="s r d1"></span><span class="s r d2"></span>';
    if (b === "red1") h = '<span class="s r d1"></span>';
    if (b === "yellow") h = '<span class="s y d1"></span>';
    el.innerHTML = h + '<i>' + (el.dataset.f || "") + '</i>';
    el.setAttribute("role","img"); el.setAttribute("aria-label", "Бланк " + (el.dataset.f||""));
  });
}
window.UER_initBlanks = initBlanks;
})();
