"""Таблиці світлофорів у стилі SimRail Wiki: рядки — властивості, стовпці — показання, вкладки «Сторінка 1/2»."""
import html as H

def S(l, on, strip=None, label=None, type=None, alt='', **kw):
    a = f'<span class="sr" data-l="{l}" data-on="{on}"'
    if strip is not None: a += f' data-strip="{strip}"'
    if label: a += f' data-label="{label}"'
    if type: a += f' data-type="{type}"'
    for k, v in kw.items(): a += f' data-{k}="{v}"'
    return a + f' title="{H.escape(alt)}"></span>'

def C(code, sig, fig=None, **v):
    return dict(code=code, sig=sig, fig=fig, **v)

def _fig(f):
    if not f: return '—'
    return f'<button type="button" class="isi-ref" data-img="assets/img/isi/isi-{f.replace(".", "-")}.jpg">{f.rstrip("abcde")}</button>'

def _table(cols, rows, figs):
    t = ['<div class="sgt-wrap"><table class="sgt">', '<tr><th>Назва</th>' + ''.join(f'<th>{c["code"]}</th>' for c in cols) + '</tr>',
         '<tr><th>Сигнал</th>' + ''.join(f'<td class="sg">{c["sig"]}</td>' for c in cols) + '</tr>']
    for lab, key in rows:
        t.append(f'<tr><th>{lab}</th>' + ''.join(f'<td>{c.get(key, "—")}</td>' for c in cols) + '</tr>')
    if figs:
        t.append('<tr><th>Рис. ІСІ</th>' + ''.join(f'<td>{_fig(c["fig"])}</td>' for c in cols) + '</tr>')
    t.append('</table></div>')
    return ''.join(t)

def T(cols, rows, per=9):
    figs = any(c['fig'] for c in cols)
    n = (len(cols) + per - 1) // per
    size = (len(cols) + n - 1) // n
    pages = [cols[i:i + size] for i in range(0, len(cols), size)]
    ON = ' class="on"'
    bar = ''.join(f'<button type="button" role="tab"{ON if i == 0 else ""}>Сторінка {i + 1}</button>' for i in range(len(pages)))
    body = ''.join(f'<div class="stabs-p{" on" if i == 0 else ""}">{_table(p, rows, figs)}</div>' for i, p in enumerate(pages))
    return f'<div class="stabs"><div class="stabs-bar" role="tablist">{bar}</div>{body}</div>'

LEGEND = '<p class="sgt-note">Позначення: З — зелений, Ж — жовтий, Ч — червоний, Б — місячно-білий, С — синій, «м» — мигаючий, ЗС — зелена світлова смуга. Номер у рядку «Рис. ІСІ» відкриває малюнок з Інструкції.</p>'
