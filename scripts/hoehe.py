import math
from PIL import Image
_c={}
def elev(lat,lon,base='/home/claude/laufkarten/dem/13',z=13):
    n=2**z; X=(lon+180)/360*n*256; Y=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n*256
    def px(xx,yy):
        tx,ty=xx//256,yy//256
        if (tx,ty) not in _c: _c[(tx,ty)]=Image.open(f'{base}/{tx}_{ty}.png').convert('RGB').load()
        r,g,b=_c[(tx,ty)][xx%256,yy%256]; return r*256+g+b/256-32768
    x0,y0=int(X-.5),int(Y-.5); fx,fy=X-.5-x0,Y-.5-y0
    return (px(x0,y0)*(1-fx)*(1-fy)+px(x0+1,y0)*fx*(1-fy)+px(x0,y0+1)*(1-fx)*fy+px(x0+1,y0+1)*fx*fy)
def profil(route,hav,step=25):
    d=[0];pts=[route[0]]
    for a,b in zip(route,route[1:]):
        L=hav(a,b); k=max(1,int(L//step))
        for i in range(1,k+1):
            t=i/k; pts.append((a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)); d.append(d[-1]+L/k)
    h=[elev(*p) for p in pts]
    # glaetten (DEM-Rauschen)
    hs=[sum(h[max(0,i-3):i+4])/len(h[max(0,i-3):i+4]) for i in range(len(h))]
    up=sum(max(0,b-a) for a,b in zip(hs,hs[1:])); dn=sum(max(0,a-b) for a,b in zip(hs,hs[1:]))
    return d,hs,up,dn
