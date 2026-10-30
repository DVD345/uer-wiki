from PIL import Image, ImageDraw, ImageFont
im=Image.open('/tmp/claude-0/bcrop/du-52.png').convert('RGB'); d=ImageDraw.Draw(im)
INK=(28,48,150)
F=lambda s:ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf',s)
def t(x,y,s,sz=26): d.text((x,y),s,font=F(sz),fill=INK)
def strike(x0,x1,y): d.line((x0,y,x1,y),fill=INK,width=3)
# корінець
t(335,100,'1',28); t(84,222,'7'); t(195,222,'06'); t(350,226,'08',22)
t(160,365,'6689'); t(296,423,'I')
strike(168,290,666); t(300,662,'Чарушнікова',17)
# дозвіл
t(830,100,'1',30); t(492,203,'7'); t(610,203,'06'); t(758,207,'08',22)
strike(558,694,329); t(742,298,'6689'); t(980,298,'I'); t(545,330,'I')
strike(756,854,394); t(880,386,'Власівка')
strike(450,845,433)
d.line((450,535,1070,615),fill=INK,width=3); d.line((450,615,1070,535),fill=INK,width=3)
strike(706,816,668); t(818,664,'Чарушнікова',18)
im.save('/tmp/claude-0/fill/du-52-zrazok.png')
