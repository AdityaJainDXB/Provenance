#!/usr/bin/env python3
"""Generate Provenance's procedural artwork (self-contained SVGs, no network)."""
import os, math, random

OUT = "/Users/aditya/Desktop/E Commerce/assets/img"
os.makedirs(OUT, exist_ok=True)

PAPER   = "#efeae0"
PAPER_D = "#e2dbc8"
INK     = "#241f18"

def head(w, h, seed=7):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">
<defs>
  <radialGradient id="vig" cx="42%" cy="34%" r="80%">
    <stop offset="0%" stop-color="{PAPER}"/>
    <stop offset="70%" stop-color="{PAPER}"/>
    <stop offset="100%" stop-color="{PAPER_D}"/>
  </radialGradient>
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="{seed}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.045 0"/>
    <feComposite operator="over" in2="SourceGraphic"/>
  </filter>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="26" stdDeviation="26" flood-color="#2a2114" flood-opacity="0.20"/>
  </filter>
  <filter id="soft2" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#2a2114" flood-opacity="0.16"/>
  </filter>
</defs>
<rect width="{w}" height="{h}" fill="url(#vig)"/>'''

FOOT = '<rect width="100%" height="100%" fill="transparent" filter="url(#grain)"/></svg>'

def light(w, h):
    # a soft window of light, upper-left
    return f'''<g opacity="0.5">
  <polygon points="0,0 {w*0.5},0 {w*0.28},{h} 0,{h*0.62}" fill="#fffdf5" opacity="0.55"/>
</g>'''

def ellipse_shadow(cx, cy, rx, ry):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#2a2114" opacity="0.12"/>'

def write(name, body):
    with open(os.path.join(OUT, name), "w") as f:
        f.write(body + "\n")
    print("wrote", name)

W, H = 800, 1000

# ----------------------------------------------------------------------------
# 1. Stoneware vessel
def vessel():
    s = head(W, H, 3) + light(W, H)
    s += ellipse_shadow(400, 812, 210, 34)
    body = "#7c6a53"
    s += f'''<g filter="url(#soft)">
  <path d="M300 360 Q400 300 500 360 Q548 470 540 620 Q536 748 400 780 Q264 748 260 620 Q252 470 300 360 Z" fill="{body}"/>
  <path d="M300 360 Q400 300 500 360 Q520 400 512 430 Q400 360 288 430 Q280 400 300 360 Z" fill="#8b7960"/>
  <ellipse cx="400" cy="352" rx="104" ry="30" fill="#5f503d"/>
  <ellipse cx="400" cy="350" rx="82" ry="21" fill="#4a3d2e"/>
  <path d="M338 250 Q400 214 462 250 L470 300 Q400 270 330 300 Z" fill="{body}"/>
  <ellipse cx="400" cy="248" rx="66" ry="16" fill="#5f503d"/>
</g>
<g opacity="0.28" stroke="#4a3d2e" stroke-width="2" fill="none">
  <path d="M276 520 Q400 556 524 520"/>
  <path d="M272 580 Q400 620 528 580"/>
  <path d="M286 650 Q400 688 514 650"/>
</g>
<path d="M330 380 Q360 520 348 720" stroke="#9b8a70" stroke-width="26" fill="none" opacity="0.35" stroke-linecap="round"/>'''
    write("piece-vessel.svg", s + FOOT)

# 2. Handwoven textile
def textile():
    s = head(W, H, 11) + light(W, H)
    s += ellipse_shadow(400, 852, 250, 30)
    cols = ["#9a583a", "#c2a878", "#5e6b57", "#3a4a63", "#7c6a53", "#e8e0cd"]
    s += '<g filter="url(#soft)"><rect x="150" y="150" width="500" height="720" rx="6" fill="#d9cdb0"/>'
    y = 168
    random.seed(4)
    while y < 852:
        h = random.choice([14, 20, 26, 34, 44])
        c = random.choice(cols)
        s += f'<rect x="150" y="{y}" width="500" height="{h}" fill="{c}" opacity="0.92"/>'
        if random.random() < 0.4:
            # small motif band
            for i in range(10):
                s += f'<rect x="{160+i*48}" y="{y+2}" width="22" height="{max(h-4,4)}" fill="{random.choice(cols)}" opacity="0.5"/>'
        y += h
    s += '</g>'
    # warp threads / fringe
    s += '<g stroke="#c2a878" stroke-width="3" opacity="0.5">'
    for i in range(26):
        x = 158 + i * 19
        s += f'<line x1="{x}" y1="150" x2="{x}" y2="870"/>'
    s += '</g>'
    s += '<g stroke="#8d7a5c" stroke-width="3" opacity="0.8">'
    for i in range(30):
        x = 156 + i * 16.5
        s += f'<line x1="{x}" y1="870" x2="{x+random.uniform(-5,5)}" y2="910"/>'
    s += '</g>'
    write("piece-textile.svg", s + FOOT)

# 3. Coiled basket
def basket():
    s = head(W, H, 21) + light(W, H)
    s += ellipse_shadow(400, 820, 220, 34)
    s += '<g filter="url(#soft)">'
    s += '<path d="M250 470 Q400 400 550 470 Q560 640 520 760 Q400 830 280 760 Q240 640 250 470 Z" fill="#c2a878"/>'
    # coils
    for i in range(13):
        yy = 470 + i * 26
        rx = 150 - i * 3
        col = "#b79a6a" if i % 2 else "#cbb488"
        s += f'<path d="M{400-rx} {yy} Q400 {yy-16} {400+rx} {yy}" stroke="{col}" stroke-width="15" fill="none" stroke-linecap="round"/>'
    s += '<ellipse cx="400" cy="468" rx="150" ry="40" fill="#a98f60"/>'
    s += '<ellipse cx="400" cy="466" rx="120" ry="30" fill="#8f7a55"/>'
    # decorative dark diamonds
    for i in range(6):
        x = 300 + i * 40
        s += f'<path d="M{x} 560 l16 22 l-16 22 l-16 -22 Z" fill="#5b4a33" opacity="0.7"/>'
    s += '</g>'
    write("piece-basket.svg", s + FOOT)

# 4. Indigo shibori cloth
def indigo():
    s = head(W, H, 33) + light(W, H)
    s += ellipse_shadow(400, 858, 240, 26)
    s += '<g filter="url(#soft)"><rect x="160" y="140" width="480" height="740" rx="4" fill="#2b3648"/>'
    s += '<rect x="160" y="140" width="480" height="740" rx="4" fill="#3a4a63" opacity="0.5"/>'
    random.seed(9)
    # resist rings
    for _ in range(26):
        cx = random.uniform(200, 600); cy = random.uniform(190, 830)
        for r in range(4):
            s += f'<circle cx="{cx}" cy="{cy}" r="{10+r*10}" fill="none" stroke="#cdd6e6" stroke-width="{3-r*0.5}" opacity="{0.5-r*0.1}"/>'
    # folded diagonal bands
    for i in range(7):
        y = 170 + i * 100
        s += f'<path d="M160 {y} L640 {y-60} L640 {y-30} L160 {y+30} Z" fill="#e8ecf4" opacity="0.10"/>'
    s += '</g>'
    write("piece-indigo.svg", s + FOOT)

# 5. Carved wood bowl
def carving():
    s = head(W, H, 44) + light(W, H)
    s += ellipse_shadow(400, 690, 240, 40)
    s += '''<g filter="url(#soft)">
  <path d="M210 470 Q400 430 590 470 Q560 650 400 690 Q240 650 210 470 Z" fill="#6b4f38"/>
  <ellipse cx="400" cy="468" rx="190" ry="52" fill="#8a6a4d"/>
  <ellipse cx="400" cy="466" rx="150" ry="38" fill="#4f3a29"/>
  <ellipse cx="400" cy="470" rx="150" ry="34" fill="#5c4531"/>
</g>
<g opacity="0.35" stroke="#3f2e20" stroke-width="3" fill="none">
  <path d="M250 500 Q400 470 550 500"/>
  <path d="M262 545 Q400 512 538 545"/>
  <path d="M290 600 Q400 572 512 600"/>
</g>
<path d="M235 452 Q400 500 565 452" stroke="#a5825f" stroke-width="10" fill="none" opacity="0.6" stroke-linecap="round"/>'''
    # a carved spoon leaning
    s += '''<g filter="url(#soft2)" transform="rotate(-24 560 620)">
  <rect x="548" y="360" width="20" height="300" rx="10" fill="#7c5c40"/>
  <ellipse cx="558" cy="352" rx="42" ry="58" fill="#8a6a4d"/>
  <ellipse cx="558" cy="352" rx="28" ry="42" fill="#5c4531"/>
</g>'''
    write("piece-carving.svg", s + FOOT)

# 6. Silver filigree pendant
def silver():
    s = head(W, H, 52) + light(W, H)
    s += ellipse_shadow(400, 760, 150, 24)
    s += '<g fill="none" stroke="#b9bcc0" stroke-width="5" filter="url(#soft2)">'
    s += '<path d="M400 210 Q250 260 250 430 Q250 640 400 760 Q550 640 550 430 Q550 260 400 210 Z" fill="#c7cace" stroke="#8f9296"/>'
    # filigree curls
    random.seed(2)
    for _ in range(40):
        cx = random.uniform(300, 500); cy = random.uniform(280, 700)
        r = random.uniform(12, 30)
        s += f'<circle cx="{cx}" cy="{cy}" r="{r}" stroke="#9aa0a4" stroke-width="3"/>'
    s += '<circle cx="400" cy="440" r="46" fill="#7c6a53" stroke="#5f503d" stroke-width="4"/>'
    s += '<circle cx="400" cy="440" r="24" fill="#9a583a"/>'
    s += '</g>'
    # chain
    s += '<g stroke="#a7abae" stroke-width="4" fill="none" opacity="0.9">'
    s += '<path d="M330 214 Q400 140 470 214"/>'
    for i in range(18):
        s += f'<circle cx="{332 + i*7.6}" cy="{212 - math.sin(i/18*math.pi)*70}" r="4.5"/>'
    s += '</g>'
    write("piece-silver.svg", s + FOOT)

# 7. Knotted rug
def rug():
    s = head(W, H, 61) + light(W, H)
    s += ellipse_shadow(400, 880, 260, 26)
    s += '<g filter="url(#soft)"><rect x="140" y="150" width="520" height="740" rx="4" fill="#7a2f22"/>'
    s += '<rect x="176" y="188" width="448" height="664" fill="none" stroke="#d9b477" stroke-width="14"/>'
    s += '<rect x="210" y="222" width="380" height="596" fill="#8a3b2a"/>'
    # central medallion
    s += '<path d="M400 300 L520 520 L400 740 L280 520 Z" fill="#1f2b3a"/>'
    s += '<path d="M400 360 L470 520 L400 680 L330 520 Z" fill="#d9b477"/>'
    s += '<circle cx="400" cy="520" r="46" fill="#5e6b57"/>'
    random.seed(7)
    for i in range(4):
        for j in range(2):
            x = 250 + j*300; y = 300 + i*150
            s += f'<path d="M{x} {y} l24 24 l-24 24 l-24 -24 Z" fill="#d9b477" opacity="0.85"/>'
    s += '</g>'
    # fringe
    s += '<g stroke="#c9b48c" stroke-width="4" opacity="0.85">'
    for i in range(40):
        x = 146 + i*13
        s += f'<line x1="{x}" y1="150" x2="{x}" y2="112"/><line x1="{x}" y1="890" x2="{x}" y2="928"/>'
    s += '</g>'
    write("piece-rug.svg", s + FOOT)

# 8. Lacquer bowl
def lacquer():
    s = head(W, H, 72) + light(W, H)
    s += ellipse_shadow(400, 700, 230, 40)
    s += '''<g filter="url(#soft)">
  <path d="M220 460 Q400 420 580 460 Q550 640 400 700 Q250 640 220 460 Z" fill="#7a1f1c"/>
  <ellipse cx="400" cy="458" rx="180" ry="50" fill="#9a2a24"/>
  <ellipse cx="400" cy="456" rx="140" ry="36" fill="#3a0f0d"/>
  <ellipse cx="400" cy="460" rx="140" ry="32" fill="#5a1512"/>
</g>
<path d="M250 446 Q400 494 552 446" stroke="#d9b477" stroke-width="7" fill="none" opacity="0.8"/>
<g opacity="0.6" fill="#d9b477">
  <path d="M330 500 q20 -30 44 -6 q-10 26 -44 6 Z"/>
  <path d="M430 520 q26 -20 44 8 q-18 22 -44 -8 Z"/>
  <circle cx="400" cy="560" r="6"/><circle cx="360" cy="600" r="4"/><circle cx="452" cy="588" r="4"/>
</g>'''
    write("piece-lacquer.svg", s + FOOT)

# ----------------------------------------------------------------------------
# Portraits — abstract seated maker in workshop light
PORTRAIT_HUES = [
    ("#c9a06a", "#7c6a53", "#4a3d2e"),
    ("#a9b39a", "#5e6b57", "#3c463a"),
    ("#b98f7a", "#9a583a", "#5b2f22"),
    ("#9fb0c2", "#3a4a63", "#26303f"),
    ("#d0b48c", "#8a6a4d", "#4f3a29"),
    ("#c2a878", "#7a6248", "#463726"),
    ("#b7a99a", "#6d6555", "#3f3a30"),
    ("#c9bda0", "#8d7a5c", "#544733"),
]

def portrait(i, hi, mid, dark):
    w = h = 600
    s = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">
<defs>
  <linearGradient id="bg{i}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="{hi}"/>
    <stop offset="100%" stop-color="{mid}"/>
  </linearGradient>
  <filter id="g{i}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="{i}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"/>
    <feComposite operator="over" in2="SourceGraphic"/></filter>
</defs>
<rect width="{w}" height="{h}" fill="url(#bg{i})"/>
<rect x="60" y="40" width="150" height="220" rx="6" fill="#fffdf5" opacity="0.16"/>
<rect x="70" y="50" width="60" height="210" fill="#fffdf5" opacity="0.10"/>
<ellipse cx="300" cy="600" rx="260" ry="150" fill="{dark}" opacity="0.5"/>
<path d="M300 250 q90 0 120 120 q20 150 -10 260 h-220 q-30 -150 -10 -260 q30 -120 120 -120 Z" fill="{dark}"/>
<circle cx="300" cy="200" r="70" fill="{dark}"/>
<path d="M300 250 q60 10 80 90 q-80 40 -160 0 q20 -80 80 -90 Z" fill="{mid}" opacity="0.55"/>
<path d="M235 300 q-40 30 -50 120" stroke="{dark}" stroke-width="34" stroke-linecap="round" fill="none"/>
<path d="M365 300 q40 30 50 120" stroke="{dark}" stroke-width="34" stroke-linecap="round" fill="none"/>
<rect x="230" y="430" width="140" height="26" rx="13" fill="{hi}" opacity="0.4"/>
<rect width="100%" height="100%" fill="transparent" filter="url(#g{i})"/>
</svg>'''
    write(f"maker-{i+1}.svg", s)

for idx, (a, b, c) in enumerate(PORTRAIT_HUES):
    portrait(idx, a, b, c)

# ----------------------------------------------------------------------------
# Process shots — hands at work (abstract), 3:4
def process(i, base, accent, seed):
    w, h = 600, 800
    s = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">
<defs><filter id="pg{i}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="{seed}" result="n"/>
<feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"/>
<feComposite operator="over" in2="SourceGraphic"/></filter>
<radialGradient id="pv{i}" cx="40%" cy="36%" r="80%">
<stop offset="0%" stop-color="{base}"/><stop offset="100%" stop-color="{accent}"/></radialGradient></defs>
<rect width="{w}" height="{h}" fill="url(#pv{i})"/>
<polygon points="0,0 320,0 190,800 0,560" fill="#fffdf5" opacity="0.14"/>
<ellipse cx="300" cy="470" rx="210" ry="120" fill="#2a2114" opacity="0.18"/>
<ellipse cx="300" cy="430" rx="150" ry="90" fill="#7c6a53"/>
<ellipse cx="300" cy="424" rx="112" ry="64" fill="#4a3d2e"/>
<path d="M120 520 q60 -140 150 -150 q40 0 40 40 q-10 60 -70 90 q-60 30 -120 20 Z" fill="{base}"/>
<path d="M480 520 q-60 -140 -150 -150 q-40 0 -40 40 q10 60 70 90 q60 30 120 20 Z" fill="{accent}"/>
<g stroke="#3f2e20" stroke-width="6" opacity="0.3" fill="none">
<path d="M170 430 q130 -60 260 0"/><path d="M186 470 q120 -46 228 0"/></g>
<rect width="100%" height="100%" fill="transparent" filter="url(#pg{i})"/>
</svg>'''
    write(f"process-{i+1}.svg", s)

PROC = [("#c9a06a", "#7c6a53", 5), ("#a9b39a", "#5e6b57", 8), ("#b98f7a", "#9a583a", 12), ("#c2a878", "#7a6248", 17)]
for i, (a, b, sd) in enumerate(PROC):
    process(i, a, b, sd)

# ----------------------------------------------------------------------------
# Hero — still life of vessels on a shelf, 4:5
def hero():
    w, h = 1000, 1250
    s = head(w, h, 2) + light(w, h)
    s += f'<rect x="0" y="{h*0.72}" width="{w}" height="26" fill="#8d7a5c" opacity="0.6"/>'
    s += ellipse_shadow(w*0.5, h*0.72+30, 420, 26)
    trio = [
        (300, "#7c6a53", 150, 300),
        (540, "#9a583a", 190, 380),
        (760, "#5e6b57", 130, 250),
    ]
    for cx, col, rw, rh in trio:
        top = h*0.72 - rh
        s += f'''<g filter="url(#soft)">
  <path d="M{cx-rw/2} {top+rh*0.18} Q{cx} {top-10} {cx+rw/2} {top+rh*0.18} Q{cx+rw/2+10} {top+rh*0.6} {cx+rw/2-14} {top+rh} L{cx-rw/2+14} {top+rh} Q{cx-rw/2-10} {top+rh*0.6} {cx-rw/2} {top+rh*0.18} Z" fill="{col}"/>
  <ellipse cx="{cx}" cy="{top+rh*0.18}" rx="{rw/2}" ry="{rw*0.16}" fill="#4a3d2e"/>
  <ellipse cx="{cx}" cy="{top+rh*0.18}" rx="{rw/2-16}" ry="{rw*0.12}" fill="#3a2f22"/>
</g>'''
    # a hanging textile behind
    s += f'<g filter="url(#soft2)"><rect x="120" y="120" width="240" height="440" rx="4" fill="#c2a878" opacity="0.9"/>'
    for i in range(11):
        s += f'<rect x="120" y="{130+i*38}" width="240" height="{12+ (i%3)*6}" fill="{["#9a583a","#5e6b57","#3a4a63"][i%3]}" opacity="0.8"/>'
    s += '</g>'
    write("hero.svg", s + FOOT)

hero()

# ----------------------------------------------------------------------------
# Editorial / workshop scenes 5:6
def workshop(name, wall, seed):
    w, h = 1000, 1200
    s = head(w, h, seed)
    s += f'<rect width="{w}" height="{h*0.66}" fill="{wall}" opacity="0.5"/>'
    s += light(w, h)
    s += f'<rect x="0" y="{h*0.66}" width="{w}" height="{h*0.34}" fill="#8d7a5c" opacity="0.4"/>'
    # window
    s += f'<rect x="{w*0.55}" y="80" width="320" height="380" rx="6" fill="#fffdf5" opacity="0.4"/>'
    s += f'<line x1="{w*0.55+160}" y1="80" x2="{w*0.55+160}" y2="460" stroke="{PAPER_D}" stroke-width="8"/>'
    s += f'<line x1="{w*0.55}" y1="270" x2="{w*0.55+320}" y2="270" stroke="{PAPER_D}" stroke-width="8"/>'
    # shelves with pots
    for row in range(2):
        yy = 260 + row*220
        s += f'<rect x="80" y="{yy}" width="360" height="16" fill="#6b5640" opacity="0.7"/>'
        for k in range(3):
            cx = 140 + k*130
            col = ["#7c6a53", "#9a583a", "#5e6b57"][(k+row) % 3]
            s += f'<g filter="url(#soft2)"><path d="M{cx-44} {yy-90} Q{cx} {yy-110} {cx+44} {yy-90} Q{cx+50} {yy-20} {cx+34} {yy} L{cx-34} {yy} Q{cx-50} {yy-20} {cx-44} {yy-90} Z" fill="{col}"/><ellipse cx="{cx}" cy="{yy-90}" rx="44" ry="12" fill="#3a2f22"/></g>'
    # a working figure
    s += f'''<g filter="url(#soft)">
  <ellipse cx="640" cy="1010" rx="240" ry="120" fill="#2a2114" opacity="0.35"/>
  <path d="M640 640 q80 0 104 110 q16 150 -6 250 h-196 q-24 -150 -6 -250 q24 -110 104 -110 Z" fill="#3f3a30"/>
  <circle cx="640" cy="600" r="58" fill="#3f3a30"/>
  <path d="M582 720 q-50 40 -50 150" stroke="#3f3a30" stroke-width="30" fill="none" stroke-linecap="round"/>
  <path d="M698 720 q50 30 60 120" stroke="#3f3a30" stroke-width="30" fill="none" stroke-linecap="round"/>
  <ellipse cx="720" cy="880" rx="90" ry="26" fill="#6b5640"/>
  <path d="M690 856 q30 -40 62 0 q-8 40 -62 0 Z" fill="#9a583a"/>
</g>'''
    write(name, s + FOOT)

workshop("editorial-1.svg", "#c2a878", 14)
workshop("editorial-2.svg", "#a9b39a", 27)
workshop("video-poster.svg", "#b98f7a", 36)

# ----------------------------------------------------------------------------
# About / mission image — two hands exchanging an object
def exchange():
    w, h = 1000, 1200
    s = head(w, h, 19) + light(w, h)
    s += ellipse_shadow(500, 900, 300, 40)
    s += '''<g filter="url(#soft)">
  <ellipse cx="500" cy="560" rx="150" ry="150" fill="#9a583a"/>
  <ellipse cx="500" cy="560" rx="150" ry="46" fill="#7a3f2a"/>
  <ellipse cx="500" cy="548" rx="120" ry="34" fill="#5b2f22"/>
</g>
<path d="M120 780 q120 -200 320 -180 q60 10 40 70 q-40 90 -160 120 q-140 30 -200 -10 Z" fill="#c9a06a"/>
<path d="M880 780 q-120 -200 -320 -180 q-60 10 -40 70 q40 90 160 120 q140 30 200 -10 Z" fill="#c2a878"/>
<g stroke="#7c6a53" stroke-width="5" opacity="0.4" fill="none">
  <path d="M200 720 q120 -120 250 -120"/><path d="M800 720 q-120 -120 -250 -120"/>
</g>'''
    write("about-exchange.svg", s + FOOT)

exchange()

# ----------------------------------------------------------------------------
# Favicon (simple mark: a 'P' vessel)
fav = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<rect width="64" height="64" rx="14" fill="#241f18"/>
<path d="M24 16 h12 a10 10 0 0 1 0 20 h-6 v12 h-6 Z" fill="#efeae0"/>
<circle cx="34" cy="26" r="4" fill="#241f18"/>
</svg>'''
write("favicon.svg", fav)

print("\\nAll artwork generated.")
