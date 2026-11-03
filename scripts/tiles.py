import math, gzip, json, sys
from pmtiles.reader import Reader, MmapSource
import mapbox_vector_tile as mvt
f=open('/home/claude/laufkarten/rheintal-bodensee.pmtiles','rb')
r=Reader(MmapSource(f))
def deg2num(lat,lon,z):
    n=2**z; x=(lon+180)/360*n
    y=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n
    return x,y
def gettile(z,x,y):
    d=r.get(z,x,y)
    if d is None: return {}
    if d[:2]==b'\x1f\x8b': d=gzip.decompress(d)
    return mvt.decode(d)
