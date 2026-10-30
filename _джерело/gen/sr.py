import html as H

def S(l, on, strip=None, label=None, type=None, alt='', **kw):
    a = f'<span class="sr" data-l="{l}" data-on="{on}"'
    if strip is not None: a += f' data-strip="{strip}"'
    if label: a += f' data-label="{label}"'
    if type: a += f' data-type="{type}"'
    for k, v in kw.items(): a += f' data-{k}="{v}"'
    return a + f' title="{H.escape(alt)}"></span>'

def R(sig, name, fig, meaning, speed=None, cls=''):
    ref = ''
    if fig:
        ref = f'<button type="button" class="isi-ref" data-img="assets/img/isi/isi-{fig.replace(".", "-")}.jpg">Рис. {fig.rstrip("abcde")} ІСІ</button>'
    t = f'<tr><td class="sg">{sig}</td><td class="nm"><b>{name}</b>{ref}</td><td>{meaning}</td>'
    if speed is not None: t += f'<td class="sp {cls}">{speed}</td>'
    return t + '</tr>'

def T(*rows, mini=False):
    head = '<tr><th>Сигнал</th><th>Показання</th><th>Значення</th>' + ('' if mini else '<th>Швидкість</th>') + '</tr>'
    return f'<div class="sigtab{" mini" if mini else ""}"><table>{head}' + ''.join(rows) + '</table></div>'

GO, LIM, STOP = 'go', 'lim', 'stop'
