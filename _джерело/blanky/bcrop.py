from PIL import Image, ImageOps
import sys
S='/tmp/claude-0/b150/p-%02d.png'
# name: (page, (x0,y0,x1,y1) fractions)
J={'du-1':(2,(0,0,1,1)),'du-2':(7,(0,0,1,1)),'du-58':(12,(0,0,1,1)),'du-47':(14,(0,0,1,1)),
 'du-60':(20,(0,0,1,1)),'du-46':(26,(0,0,1,1)),'du-61':(21,(0,0,1,1)),
 'du-54':(9,(0,0,1,0.4906)),'du-52':(10,(0,0,1,0.5100)),'du-50':(15,(0,0,1,0.4274)),'du-56':(16,(0,0,1,0.5533)),
 'du-55':(17,(0,0,1,0.4963)),'du-64':(18,(0,0,1,0.4963))}
for n,(p,(a,b,c,d)) in J.items():
  im=Image.open(S%p).convert('RGB'); W,H=im.size
  r=im.crop((int(a*W),int(b*H),int(c*W),int(d*H)))
  g=ImageOps.invert(r.convert('L')).point(lambda v:255 if v>40 else 0)
  bb=g.getbbox(); pad=14
  bb=(max(0,bb[0]-pad),max(0,bb[1]-pad),min(r.size[0],bb[2]+pad),min(r.size[1],bb[3]+pad))
  o=r.crop(bb); o.save('/tmp/claude-0/bcrop/%s.png'%n); print(n,o.size)
  o.convert('RGB').save('/tmp/claude-0/bcrop/%s.jpg'%n,quality=82,optimize=True)
