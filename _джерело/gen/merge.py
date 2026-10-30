"""Збирає всю сигналізацію в одну сторінку src/syhnaly.html, як сторінка Signals у SimRail Wiki."""
import re, os
W = '/tmp/claude-0/w'
PARTS = W + '/gen/parts'

# стара сторінка → розділ нової сторінки
OLD = {
    'svitlofory.html': 'світлофори',
    'pokazannia.html': 'основні-значення',
    'inshi-svitlofory.html': 'прохідні-світлофори',
    'ruchni.html': 'ручні-сигнали',
    'zvukovi.html': 'звукові-сигнали',
    'poizni.html': 'поїзні-сигнали',
    'znaky.html': 'сигнальні-знаки',
}

def relink(s):
    s = re.sub(r'href="(%s)#' % '|'.join(re.escape(k) for k in OLD), 'href="syhnaly.html#', s)
    for k, v in OLD.items():
        s = s.replace('href="%s"' % k, 'href="syhnaly.html#%s"' % v)
    return s

def body(name):
    s = open(f'{PARTS}/{name}.html').read()
    s = re.sub(r'<!--\s*(title|sub|crumb|src):.*?-->\n?', '', s)
    m = re.search(r'<div class="selfcheck">.*?</div>\s*$', s, re.S)
    qs = ''
    if m:
        qs = ''.join(re.findall(r'<details>.*?</details>\n?', m.group(0), re.S))
        s = s[:m.start()]
    return s.strip() + '\n', qs

def demote(s):
    s = re.sub(r'<(/?)h3\b', r'<\1h4', s)
    return re.sub(r'<(/?)h2\b', r'<\1h3', s)

ov, q0 = body('syhnaly')
ov = re.sub(r'<h2 id="розділи-сигналізації">.*?</div>\n\n', '', ov, flags=re.S)
sv, q1 = body('svitlofory')
pk, q2 = body('pokazannia')
ru, q3 = body('ruchni')
zv, q4 = body('zvukovi')
po, q5 = body('poizni')
zn, q6 = body('znaky')

def lead_to_p(s):
    return s.replace('<p class="lead">', '<p>', 1)

html = f'''<!--title: Сигналізація-->
<!--sub: Усі сигнали за ІСІ та ПТЕ на одній сторінці: світлофори та їх показання, ручні, звукові й поїзні сигнали, сигнальні знаки й покажчики-->
<!--crumb: СЦБ і зв'язок-->
<!--src: Інструкція з сигналізації на залізницях України (ЦШ-0001); ПТЕ, п. 3.33, 6.1–6.12; урок 9 «АТЗ на залізничному транспорті. Сигналізація»-->
{ov}
<h2 id="світлофори">Світлофори</h2>
{demote(sv)}
{pk}
<h2 id="ручні-сигнали">Ручні сигнали</h2>
{demote(lead_to_p(ru))}
<h2 id="звукові-сигнали">Звукові сигнали</h2>
{demote(zv)}
<h2 id="поїзні-сигнали">Поїзні сигнали й огородження</h2>
{demote(lead_to_p(po))}
<h2 id="сигнальні-знаки">Сигнальні знаки й покажчики</h2>
{demote(lead_to_p(zn))}
<div class="selfcheck">
<h3>Перевір себе</h3>
{q0}{q1}{q2}{q3}{q4}{q5}{q6}<p style="margin-top:12px">Більше вправ — у <a href="trenazher.html">тренажері</a>.</p>
</div>
'''
html = relink(html)
ids = re.findall(r'\sid="([^"]+)"', html)
dup = sorted({i for i in ids if ids.count(i) > 1})
assert not dup, dup
open(W + '/src/syhnaly.html', 'w').write(html)

# посилання на старі сторінки в інших сторінках
for f in os.listdir(W + '/src'):
    p = W + '/src/' + f
    s = open(p).read(); t = relink(s)
    if t != s: open(p, 'w').write(t); print('relinked', f)

# сторінки-перенаправлення на старих адресах
STUB = '''<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=syhnaly.html#{a}"><title>Сигналізація</title><style>body{{background:#121212;color:#ddd;font-family:Roboto,Arial,sans-serif;padding:24px}}a{{color:#42a5f5}}</style></head><body><script>location.replace("syhnaly.html#"+(location.hash.slice(1)||"{a}"))</script><p>Розділ перенесено на сторінку <a href="syhnaly.html#{a}">Сигналізація</a>.</p></body></html>
'''
for k, v in OLD.items():
    open(W + '/site/' + k, 'w').write(STUB.format(a=v))
print('ok', len(html))
