#!/usr/bin/env python3
"""Збирає сторінки УЕР Вікі з фрагментів src/*.html у site/*.html і будує пошуковий індекс."""
import html, json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
OUT = os.path.join(ROOT, "site")
if not os.path.isdir(OUT):
    OUT = os.path.dirname(ROOT)

TEMPLATE = """<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{ptitle}</title>
<meta name="description" content="{sub}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23000'/%3E%3Ctext x='16' y='22' font-family='Arial' font-weight='700' font-size='15' fill='%23fff' text-anchor='middle'%3E%D0%A3%D0%95%3C/text%3E%3C/svg%3E">
<script src="assets/horn.js"></script>
<script src="assets/site.js"></script>
<script src="assets/search-index.js" defer></script>
<script src="assets/widgets.js" defer></script>
</head>
<body>
<header class="topbar">
  <button class="burger icon-btn" aria-label="Меню" data-ico="menu"></button>
  <a class="brand" href="index.html"><span class="name">УЕР Вікі</span></a>
  <div class="search"><span class="ico" data-ico="search"></span><input type="search" placeholder="Пошук..." aria-label="Пошук"><span class="kbd-hint">/</span><div class="search-results"></div></div>
  <div class="actions">
  </div>
</header>
<nav class="sidenav" aria-label="Розділи"></nav>
<div class="scrim"></div>
<main class="main">
  <div class="crumbs"><a class="home" href="index.html" title="Головна" data-ico="home"></a>{crumb}<span class="author">Створив студент групи 103-ОПУТ-Д24 Кунець Давід</span></div>
  <div class="page-head">
    <div class="ph-text">
      <h1>{title}</h1>
      <p>{sub}</p>
    </div>
  </div>
  <div class="layout">
    <aside class="aside">
      <div class="card toc"><h4>Зміст сторінки</h4><div class="body"></div></div>
      {tagcard}
    </aside>
    <article class="content">
{body}
    </article>
  </div>
  <footer class="foot">УЕР Вікі · навчальний матеріал з дисципліни «Управління експлуатаційною роботою» на основі ПТЕ, ІСІ та ІРП залізниць України. У разі розбіжностей чинним є текст нормативного документа.</footer>
</main>
<button class="fab-top" type="button" data-act="top" title="Вгору" data-ico="up"></button>
</body>
</html>
"""

def meta(text, key):
    m = re.search(r"<!--\s*%s:\s*(.*?)\s*-->" % key, text)
    return m.group(1) if m else ""

def strip_tags(s):
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()

def slug(s):
    s = s.lower()
    s = re.sub(r"[«»\"'’.,:;!?()№/]", "", s).strip()
    return re.sub(r"\s+", "-", s)[:60]

index = []
names = sorted(f for f in os.listdir(SRC) if f.endswith(".html"))
for name in names:
    raw = open(os.path.join(SRC, name), encoding="utf-8").read()
    title, sub, crumb, src = meta(raw, "title"), meta(raw, "sub"), meta(raw, "crumb"), meta(raw, "src")
    body = re.sub(r"<!--\s*(title|sub|crumb|src):.*?-->\n?", "", raw)
    # заголовки отримують стабільні id (ті самі, що й у site.js)
    used = {}
    def add_id(m):
        tag, attrs, inner = m.group(1), m.group(2), m.group(3)
        if "id=" in attrs:
            return m.group(0)
        s = slug(strip_tags(inner))
        while s in used:
            s += "-"
        used[s] = 1
        return '<%s%s id="%s">%s</%s>' % (tag, attrs, s, inner, tag)
    body = re.sub(r"<(h[23])([^>]*)>(.*?)</\1>", add_id, body, flags=re.S)
    srccard = ""
    if src:
        srccard = '<div class="card"><h4>Джерела сторінки</h4><div class="body small">%s</div></div>' % src
    tags = ["УЕР"] + ([crumb] if crumb else ["Головна"])
    tagcard = '<div class="card"><h4>Теги</h4><div class="body chips">%s</div></div>' % "".join('<span class="tchip"><i data-ico="tag"></i>%s</span>' % html.escape(t) for t in tags)
    page = TEMPLATE.format(ptitle=("УЕР Вікі" if name == "index.html" else html.escape(title) + " — УЕР Вікі"), title=html.escape(title), sub=html.escape(sub),
                           crumb=(('<i class="sep" data-ico="chevron"></i><span>%s</span>' % html.escape(crumb)) if crumb else "") + ('<i class="sep" data-ico="chevron"></i><span class="cur">%s</span>' % html.escape(title) if name != "index.html" else '<i class="sep" data-ico="chevron"></i><span class="cur">Головна</span>'), body=body, srccard=srccard, tagcard=tagcard)
    open(os.path.join(OUT, name), "w", encoding="utf-8").write(page)
    # індекс: розбиваємо на розділи за h2/h3
    parts = re.split(r"(<h[23][^>]*>.*?</h[23]>)", body, flags=re.S)
    secs, cur_h, cur_id, buf = [], title, "", []
    for p in parts:
        hm = re.match(r"<h[23][^>]*id=\"([^\"]+)\"[^>]*>(.*?)</h[23]>", p, flags=re.S)
        if hm:
            if buf:
                secs.append({"h": cur_h, "id": cur_id, "x": strip_tags(" ".join(buf))[:1500]})
            cur_h, cur_id, buf = strip_tags(hm.group(2)), hm.group(1), []
        else:
            buf.append(p)
    if buf:
        secs.append({"h": cur_h, "id": cur_id, "x": strip_tags(" ".join(buf))[:1500]})
    index.append({"u": name, "t": title, "s": [s for s in secs if s["x"] or s["h"]]})

with open(os.path.join(OUT, "assets", "search-index.js"), "w", encoding="utf-8") as f:
    f.write("window.UER_SEARCH=" + json.dumps(index, ensure_ascii=False) + ";")
# версії файлів у посиланнях, щоб браузер не показував старі стилі й скрипти
import hashlib
def _ver(rel):
    return hashlib.md5(open(os.path.join(OUT, "assets", rel), "rb").read()).hexdigest()[:8]
_vers = {a: _ver(a) for a in ["style.css", "horn.js", "site.js", "search-index.js", "widgets.js", "stantsiia.js"]}
for name in names:
    fp = os.path.join(OUT, name)
    page = open(fp, encoding="utf-8").read()
    for a, v in _vers.items():
        page = re.sub(r'assets/' + re.escape(a) + r'(\?v=[0-9a-f]+)?"', 'assets/' + a + '?v=' + v + '"', page)
    open(fp, "w", encoding="utf-8").write(page)
print("built", len(names), "pages")
