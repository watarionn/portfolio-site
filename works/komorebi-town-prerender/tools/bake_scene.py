#!/usr/bin/env python3
"""Bake a toy-like orthographic 3D diorama to flat WebP sprites.

All the geometry below is modeled in 3D (x, height, z) and projected *offline*.
The website uses the generated bitmaps only: no 3D engine, shaders or runtime
geometry generation. Deterministic asset pipeline, Pillow is build-time only.
"""
from __future__ import annotations
import hashlib, json, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'assets'
OUT.mkdir(parents=True, exist_ok=True)
RNG = random.Random(67219)
W,H=1736,1050
OX,OY=868,102
TX,TZ,YU=59.0,30.0,32.0
N=27

def proj(x,z,y=0):return (OX+(x-z)*TX*.5, OY+(x+z)*TZ*.5-y*YU)
def lp(x,z,y=0):return ((x-z)*TX*.5,(x+z)*TZ*.5-y*YU)
def polygon(d,p,col,outline=None,width=1):d.polygon([(round(a),round(b)) for a,b in p],fill=col);outline and d.line([(round(a),round(b)) for a,b in p+[p[0]]],fill=outline,width=width)
def diamond(d,x,z,fill,outline=None):
    p=proj(x,z)
    polygon(d,[(p[0],p[1]-TZ/2),(p[0]+TX/2,p[1]),(p[0],p[1]+TZ/2),(p[0]-TX/2,p[1])],fill,outline)
def save_webp(image,name,quality=84):
    image.save(OUT/name,'WEBP',quality=quality,method=6,exact=True)
    b=(OUT/name).read_bytes(); print(name,len(b),hashlib.sha256(b).hexdigest()[:12])

# Terrain: pre-render an entire navigable town on an individual flat bitmap.
land=Image.new('RGB',(W,H),'#a7d8cd')
d=ImageDraw.Draw(land)
# water ribbons and sand coastline: layered islands, scalloped shoreline
for x in range(N):
 for z in range(N):
    border=min(x,z,N-1-x,N-1-z)
    r=(x*19+z*23)%11
    if border<1: col='#d6d5ac' if r<7 else '#c9d3a3'
    elif border<2:col='#b2cda0' if r<7 else '#c2d39e'
    else:col=['#a5ce97','#a9d49b','#abd59e','#a7d09b'][(x*7+z*13)%4]
    road=abs(x-13)<=1 or abs(z-13)<=1
    patio=abs(x-13)<=3 and abs(z-13)<=3
    if patio:col=['#efdfbc','#eddbb5','#e7d2a7'][(x+z)%3]
    elif road:col=['#e9d8b0','#e3cea1','#e9d5ab'][(x*7+z*3)%3]
    diamond(d,x,z,col)
    px,py=proj(x,z)
    if patio or road:
        # cobbles, inset away from tile edges
        if (x*31+z*11)%3==0:
            d.line([(px-7,py+1),(px-2,py+3)],fill='#d1b88c',width=2)
        if (x*13+z*7)%4==0:d.ellipse((px+6,py-4,px+9,py-2),fill='#f8e9c6')
    elif border>1:
        # subtle blades of grass, already baked into the texture
        if (x+z*7)%3==0:d.line([(px-8,py+2),(px-6,py-3)],fill='#7ead80',width=2)
        if (x*17+z*19)%7==0:
            for dx,dy,c in [(-4,-2,'#f4b1a2'),(4,1,'#fbefd5'),(1,-5,'#f6e6ae')]:
                d.ellipse((px+dx-3,py+dy-3,px+dx+3,py+dy+3),fill=c)

# Extra walking lanes toward building entrances
for bx,bz in [(7,7),(19,7),(7,19),(19,19)]:
    for step in range(3):
        t=step/3
        if bz<13: x=bx; z=bz+3+step
        else:x=bx;z=bz-3-step
        if 0<=x<N and 0<=z<N:
            px,py=proj(x,z)
            polygon(d,[(px,py-8),(px+16,py),(px,py+8),(px-16,py)],'#e9dab7')
# Grass islands with flower clusters away from roads and houses
for i in range(280):
    x=RNG.uniform(1.8,25.2);z=RNG.uniform(1.8,25.2)
    if abs(x-13)<2.35 or abs(z-13)<2.35:continue
    if any(abs(x-hx)<3.4 and abs(z-hz)<3.4 for hx,hz in [(7,7),(19,7),(7,19),(19,19)]):continue
    px,py=proj(x,z);r=RNG.random()
    if r<.45:
        d.ellipse((px-2,py-2,px+2,py+2),fill=['#fae8a5','#edb6b6','#e4c8f0','#fcf8d8'][i%4]);d.point((px,py),fill='#f5ad66')
    else:
        d.line([(px,py+3),(px-2,py-4)],fill='#76ae7d',width=2)
# Tiny stepping stones ringing the plaza
for i in range(42):
    ang=2*math.pi*i/42;x=13+4.2*math.cos(ang);z=13+4.2*math.sin(ang)
    px,py=proj(x,z);d.ellipse((px-5,py-2,px+5,py+2),fill='#dec8a3')
# Fountain plinth is static 3D projection on terrain; animated glints atop it at runtime.
px,py=proj(13,13)
d.ellipse((px-61,py-23,px+61,py+23),fill='#a6a999')
d.ellipse((px-55,py-22,px+55,py+18),fill='#f1e5cb')
d.ellipse((px-46,py-17,px+46,py+12),fill='#78bdc0')
d.ellipse((px-29,py-9,px+29,py+7),fill='#93d0c9')
# Seafront boat, curving shore waves outside field
for p in range(80):
  x=RNG.randrange(W);y=RNG.randrange(H)
  if x+y>W+H: continue
  if not land.getpixel((x,y))[:3]==(167,216,205):continue
  if p%3==0:d.arc((x,y,x+28,y+8),0,135,fill='#d8f4df',width=2)
save_webp(land,'ground.webp',82)

# House geometry: 3D vertices, projection, faces, facade windows and roof.
# Transparent sprites are depth-sorted at runtime against the avatar.
styles=[
 ('library','#c18aab','#f6e8d7','#795c8a'),
 ('workshop','#c99562','#f0dfcb','#916940'),
 ('gallery','#77afba','#f4e7d6','#538d99'),
 ('play','#d79781','#f7e9d3','#b47465'),
]

def house(style):
    key,roof,wall,detail=style
    SW,SH=426,365
    image=Image.new('RGBA',(SW,SH),(0,0,0,0));d=ImageDraw.Draw(image)
    CX,CY=SW//2,SH-62
    def p(x,z,y=0):
        a,b=lp(x,z,y);return (CX+a,CY+b)
    def face(points,fill,line='#b8a28f'):polygon(d,[p(*v) for v in points],fill,line,2)
    # ground contact shadow
    d.ellipse((CX-117,CY-35,CX+117,CY+38),fill='#44675338')
    # front porch and foundations
    face([(-2.45,-2.1,0),(-2.45,2.1,0),(2.45,2.1,0),(2.45,-2.1,0)],'#e5d6bd')
    face([(2.45,-2.1,0),(2.45,2.1,0),(2.45,2.1,3.2),(2.45,-2.1,3.2)],'#e5cdb6')
    face([(-2.45,2.1,0),(2.45,2.1,0),(2.45,2.1,3.2),(-2.45,2.1,3.2)],wall)
    face([(2.45,2.1,0),(2.45,2.1,.43),(-2.45,2.1,.43),(-2.45,2.1,0)],'#c2ad93')
    # Cross-beams on the z-positive facade
    for xx in [-2.28,2.18]:
        face([(xx,2.15,.45),(xx+.12,2.15,.45),(xx+.12,2.15,3.15),(xx,2.15,3.15)],'#b9a28c','#b9a28c')
    for yy in [1.0,3.15]:
        face([(-2.35,2.16,yy), (2.35,2.16,yy),(2.35,2.16,yy+.10),(-2.35,2.16,yy+.10)],'#cfb49b','#cfb49b')
    # Main entrance facing z-positive
    face([(-.35,2.2,0),(.50,2.2,0),(.50,2.2,1.75),(-.35,2.2,1.75)],'#816454','#cba58b')
    face([(-.25,2.22,.16),(.40,2.22,.16),(.40,2.22,1.59),(-.25,2.22,1.59)],'#9a705b','#835a49')
    def window_z(x,y,z=2.225,ww=.80,hh=.82):
        face([(x,z,y),(x+ww,z,y),(x+ww,z,y+hh),(x,z,y+hh)],'#a1c9c4','#fdf0db')
        face([(x+ww/2-.035,z+.04,y),(x+ww/2+.035,z+.04,y),(x+ww/2+.035,z+.04,y+hh),(x+ww/2-.035,z+.04,y+hh)],'#fef4da','#fef4da')
        face([(x,z+.05,y+hh*.49),(x+ww,z+.05,y+hh*.49),(x+ww,z+.05,y+hh*.55),(x,z+.05,y+hh*.55)],'#fef4da','#fef4da')
    for xx in [-1.85,.95]:window_z(xx,1.35)
    # x-positive side window
    face([(2.5,-1.25,1.3),(2.5,-.42,1.3),(2.5,-.42,2.25),(2.5,-1.25,2.25)],'#9dc5cb','#f8e8d1')
    # Pitched roof, 3D ridge along x, visible front and end triangular gable.
    e=2.82;top=5.0;bottom=3.3
    face([(-2.75,-e,bottom),(2.75,-e,bottom),(2.75,0,top),(-2.75,0,top)],'#d7b6a6','#ae958b')
    face([(-2.75,0,top),(2.75,0,top),(2.75,e,bottom),(-2.75,e,bottom)],roof,detail)
    face([(2.75,-e,bottom),(2.75,0,top),(2.75,e,bottom)],detail,detail)
    # Roof tile rows are 3D lines following roof surface.
    for zz in [.62,1.23,1.83,2.44]:
        y=top-(top-bottom)*zz/e+.035
        for xx in [-2.35,-1.70,-1.05,-.40,.25,.90,1.55,2.2]:
            pp=[p(xx,zz,y),p(xx+.47,zz,y)]
            d.line(pp,fill='#ffe8d3a5',width=2)
    for xx in [-1.8,-.6,.6,1.8]:
        pp=[p(xx,0,5.01),p(xx,e,3.33)]
        d.line(pp,fill=detail,width=1)
    # chimney: brickwork on workshop, little skylight on library
    if key in ('workshop','library'):
        z=-.50;x=1.05
        face([(x,z,3.7),(x+.62,z,3.7),(x+.62,z,5.72),(x,z,5.72)],'#b7957f','#b7957f')
        face([(x+.62,z,3.7),(x+.62,z+.58,3.7),(x+.62,z+.58,5.72),(x+.62,z,5.72)],'#9d806e','#9d806e')
        face([(x-.1,z-.1,5.6),(x+.7,z-.1,5.6),(x+.7,z+.68,5.6),(x-.1,z+.68,5.6)],'#d2af93')
        for yy in [4.2,4.7,5.25]: d.line([p(x+.66,z,yy),p(x+.66,z+.55,yy)],fill='#805d4d',width=2)
    # Custom distinction: workshop awning, gallery banners, play canopy, library books
    if key=='workshop':
        face([(-2.35,2.22,1.40),(-.95,2.22,1.40),(-.95,3.05,1.20),(-2.35,3.05,1.20)],'#d9ad74','#94704f')
        for i in range(3):
            x=-2.20+i*.43;d.line([p(x,2.23,1.42),p(x,3.05,1.21)],fill='#fce4b7',width=3)
    if key=='gallery':
        for i in range(4):
            x=-1.65+i*.91
            face([(x,2.25,3.2),(x+.5,2.25,3.2),(x+.28,2.25,2.85)],['#edc57b','#d3989d','#8eb7b9','#b2a0cc'][i],None)
    if key=='play':
        face([(-2.25,2.28,.65),(-.85,2.28,.65),(-1.05,3.4,1.45),(-2.25,3.4,1.45)],'#f6d5a3','#bc8b67')
        for i,c in enumerate(['#c67d7e','#6da7a3','#f1c48d']):
            p0=p(-2.0+i*.45,3.44,1.35)
            d.ellipse((p0[0]-6,p0[1]-6,p0[0]+6,p0[1]+6),fill=c)
    if key=='library':
        # Crossbars at side of entrance evoke an outdoor book cart.
        for i,c in enumerate(['#b8799c','#91a89b','#e7ba75','#b397c3']):
            pp=p(-1.7+i*.24,2.6,.4)
            d.rectangle((pp[0]-3,pp[1]-16,pp[0]+4,pp[1]),fill=c)
    # Door steps
    for dz,y in [(2.6,.10),(2.97,.04)]:
        face([(-.55,dz,y),(.72,dz,y),(.72,dz+.35,y),(-.55,dz+.35,y)],'#ddcfaf','#d4b99b')
    # small hanging sign beside the entry, on visible facade
    sign=p(-2.05,2.43,1.6)
    d.rounded_rectangle((sign[0]-13,sign[1]-18,sign[0]+13,sign[1]+7),radius=4,fill='#fff3d8',outline=detail,width=3)
    if key=='library':
        d.rectangle((sign[0]-8,sign[1]-10,sign[0]-1,sign[1]-1),fill='#a7799e')
        d.rectangle((sign[0]+1,sign[1]-11,sign[0]+8,sign[1]-1),fill='#7c9faf')
        d.line([(sign[0],sign[1]-11),(sign[0],sign[1]+2)],fill='#fdf4dc',width=2)
    elif key=='workshop':
        d.line([(sign[0]-6,sign[1]),(sign[0]+5,sign[1]-10)],fill='#94633d',width=4)
        d.line([(sign[0],sign[1]-12),(sign[0]+10,sign[1]-3)],fill='#b68d5f',width=5)
    elif key=='gallery':
        d.rectangle((sign[0]-8,sign[1]-13,sign[0]+8,sign[1]+2),outline='#5792a1',width=3)
        d.polygon([(sign[0]-5,sign[1]),(sign[0]+2,sign[1]-7),(sign[0]+7,sign[1])],fill='#85b898')
    else:
        star=[(sign[0]+math.sin(a*math.pi/5)*r,sign[1]-6-math.cos(a*math.pi/5)*r) for a,r in [(i,10 if i%2==0 else 4) for i in range(10)]]
        polygon(d,star,'#deab68')
    # Hand-colored potted flowers
    for dx in [-2.3,2.4]:
        pos=p(dx,2.5,.3)
        d.ellipse((pos[0]-10,pos[1]+3,pos[0]+10,pos[1]+9),fill='#456a5359')
        polygon(d,[(pos[0]-8,pos[1]-10),(pos[0]+8,pos[1]-10),(pos[0]+6,pos[1]+6),(pos[0]-6,pos[1]+6)],'#bc7658','#9c6148')
        for i in range(4):
            ex=pos[0]+(-9+i*5);ey=pos[1]-12-(i%2)*4
            d.ellipse((ex-4,ey-4,ex+4,ey+4),fill=['#f4e2a2','#eaa8b1','#cdb4dc','#a7d6af'][(i+int(dx>0))%4])
    save_webp(image,f'{key}.webp',88)

for style in styles:house(style)

# Three depth-sortable 3D tree variants, pre-baked with foliage highlights.
def tree(variant):
    img=Image.new('RGBA',(182,215),(0,0,0,0));d=ImageDraw.Draw(img)
    cx,cy=91,194
    d.ellipse((48,184,134,201),fill='#44674d39')
    d.polygon([(cx-12,187),(cx-9,103),(cx+8,99),(cx+11,188)],fill='#926d4f',outline='#72543f')
    greens=[['#467f62','#59976d','#78b17c','#a1c895'],['#528b71','#6aa181','#85b38c','#b3d5a5'],['#5c9164','#72a671','#9bc183','#cadd9e']][variant]
    spheres=[(-28,92,43), (25,85,47),(0,56,54),(-4,110,42)]
    for k,(dx,y,r) in enumerate(spheres):
        color=greens[(k+variant)%3]
        d.ellipse((cx+dx-r,y-r*.6,cx+dx+r,y+r*.78),fill=color,outline='#47745a',width=2)
        d.arc((cx+dx-r+8,y-r*.56+7,cx+dx+r-8,y+r*.65),187,295,fill=greens[3],width=4)
    for k in range(22):
        x=cx+random.Random(variant*100+k).randrange(-58,58)
        y=random.Random(variant*800+k).randrange(22,120)
        d.ellipse((x-2,y-2,x+2,y+2),fill=['#d8e7a2','#f0e5b0','#90c89f'][k%3])
    save_webp(img,f'tree-{variant}.webp',82)
for i in range(3):tree(i)

# 3D fountain fixed structure, animation water done with tiny Canvas circles at runtime.
img=Image.new('RGBA',(156,146),(0,0,0,0));d=ImageDraw.Draw(img)
cx,cy=78,127
d.ellipse((12,cy-20,144,cy+18),fill='#576d6260')
d.ellipse((22,cy-25,134,cy+12),fill='#d8cead',outline='#b2ad92',width=4)
d.ellipse((30,cy-24,126,cy+4),fill='#94d1d0')
d.ellipse((39,cy-20,117,cy),fill='#6fb7ba')
d.polygon([(cx-8,cy-19),(cx+8,cy-19),(cx+7,cy-62),(cx-7,cy-62)],fill='#e4d5b5',outline='#bdb092')
d.ellipse((cx-23,cy-72,cx+23,cy-57),fill='#d6c8a9',outline='#b4aa90',width=3)
d.ellipse((cx-13,cy-83,cx+13,cy-67),fill='#8ed2d4')
d.ellipse((cx-5,cy-112,cx+5,cy-75),fill='#b6e8e5')
save_webp(img,'fountain.webp',88)

# People are also pre-rendered. Their only runtime animation is a tiny vertical bob.
for name,shirt,hair,skin in [
    ('player','#f2d38f','#785a53','#f5c5a4'),
    ('momo','#d78d9a','#916a4f','#f8c8b2'),
    ('sora','#80b9b2','#4c6268','#edba9a')]:
    img=Image.new('RGBA',(88,116),(0,0,0,0));d=ImageDraw.Draw(img)
    d.ellipse((20,100,68,110),fill='#35584a45')
    # two feet, knitted trousers, jacket sleeves
    d.rounded_rectangle((23,82,40,101),radius=4,fill='#5f7182')
    d.rounded_rectangle((48,82,65,101),radius=4,fill='#5f7182')
    d.rounded_rectangle((17,57,71,88),radius=11,fill=shirt,outline='#8b7e73',width=2)
    d.ellipse((9,65,23,82),fill=skin)
    d.ellipse((65,65,79,82),fill=skin)
    d.ellipse((22,14,66,65),fill=skin,outline='#d99f85',width=2)
    d.pieslice((19,7,69,49),180,360,fill=hair)
    d.rounded_rectangle((18,22,26,46),radius=4,fill=hair)
    d.rounded_rectangle((61,22,69,46),radius=4,fill=hair)
    d.ellipse((32,45,37,51),fill='#3c4745')
    d.ellipse((52,45,57,51),fill='#3c4745')
    d.ellipse((24,51,32,57),fill='#e69b97')
    d.ellipse((57,51,65,57),fill='#e69b97')
    d.arc((40,49,48,57),10,170,fill='#a76a69',width=2)
    if name=='player':d.rounded_rectangle((27,62,61,70),radius=4,fill='#fff0db')
    save_webp(img,f'{name}.webp',90)


manifest={'schema':1,'model':'orthographic 3D vertices baked to sprite bitmaps','dimensions':{'ground':[W,H],'tile':[TX,TZ],'origin':[OX,OY],'elevationPixelsPerUnit':YU,'grid':N},'files':{p.name:{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in sorted(OUT.glob('*.webp'))}}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('BAKE_PASS',len(manifest['files']),'assets')
