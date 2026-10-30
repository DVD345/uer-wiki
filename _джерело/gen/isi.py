# helpers to emit ISI figure cards
def F(n, title, text="", wide=False):
    f = n.replace('.', '-')
    return (f'<figure class="isi{" wide" if wide else ""}"><img src="assets/img/isi/isi-{f}.jpg" alt="{title}">'
            f'<figcaption><span class="rn">Рис. {n.rstrip("abcdefgh")}</span><b>{title}</b>{text}</figcaption></figure>')
def DN(n, title, text="", a="вдень", b="вночі", nb=None):
    f = n.replace('.', '-')
    if nb:
        s1, s2 = f'isi-{f}', 'isi-' + nb.replace('.', '-'); rn = f'Рис. {n}, {nb}'
    else:
        s1, s2 = f'isi-{f}a', f'isi-{f}b'; rn = f'Рис. {n}'
    return (f'<figure class="isi dn"><div class="pair"><div><img src="assets/img/isi/{s1}.jpg" alt="{title}, {a}"><i>{a}</i></div>'
            f'<div><img src="assets/img/isi/{s2}.jpg" alt="{title}, {b}"><i>{b}</i></div></div>'
            f'<figcaption><span class="rn">{rn}</span><b>{title}</b>{text}</figcaption></figure>')
def G(*items, wide=False):
    return f'<div class="isi-grid{" wide" if wide else ""}">\n' + "\n".join(items) + '\n</div>'
