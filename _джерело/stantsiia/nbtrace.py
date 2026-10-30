import sys, json
from PIL import Image
import numpy as np
im=np.array(Image.open('/tmp/claude-0/w/gen/nb.jpg').convert('RGB')).astype(int)
R,G,B=im[:,:,0],im[:,:,1],im[:,:,2]
masks={
 'b': (B>140)&(R<130)&(B-R>60),
 'r': (R>150)&(G<120)&(B<110)&(R-G>70),
 'o': (R>190)&(G>90)&(G<200)&(B<120)&(R-B>90),
 'k': (R<110)&(G<110)&(B<110),
}
def trace(col, a, b, guide=None, step=3):
    """follow line of colour col from point a to point b (x increasing). guide = intermediate rough points"""
    m=masks[col]
    pts=[a]+(guide or [])+[b]
    out=[]
    # walk along guide polyline, snapping perpendicular
    for i in range(len(pts)-1):
        (x0,y0),(x1,y1)=pts[i],pts[i+1]
        L=max(1,int(((x1-x0)**2+(y1-y0)**2)**.5/step))
        for k in range(L):
            t=k/L; x=x0+(x1-x0)*t; y=y0+(y1-y0)*t
            dx,dy=(x1-x0),(y1-y0); n=(dx*dx+dy*dy)**.5; nx,ny=-dy/n,dx/n
            best=None
            for s in range(-9,10):
                px,py=int(round(x+nx*s)),int(round(y+ny*s))
                if 0<=py<m.shape[0] and 0<=px<m.shape[1] and m[py,px]:
                    if best is None or abs(s)<abs(best[0]): best=(s,px,py)
            if best:
                # centroid of run around best
                s0=best[0]; ss=[s for s in range(s0-3,s0+4) if (lambda px,py: 0<=py<m.shape[0] and m[py,px])(int(round(x+nx*s)),int(round(y+ny*s)))]
                sc=sum(ss)/len(ss); out.append((round(x+nx*sc,1),round(y+ny*sc,1)))
    out.append(b)
    return [a]+out[1:]
if __name__=='__main__':
    col=sys.argv[1]; pts=json.loads(sys.argv[2])
    r=trace(col,tuple(pts[0]),tuple(pts[-1]),[tuple(p) for p in pts[1:-1]])
    print(len(r)); print(r[::4])
