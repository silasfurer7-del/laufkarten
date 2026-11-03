import math
z=14
def tile2ll(tx,ty,px,py,ext=4096):
    n=2**z; X=tx+px/ext; Y=ty+(1-py/ext)
    lon=X/n*360-180; lat=math.degrees(math.atan(math.sinh(math.pi*(1-2*Y/n))))
    return lat,lon
def merc(lat,lon):
    return lon*111320*math.cos(math.radians(47.45)), lat*111320
