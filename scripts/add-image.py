#!/usr/bin/env python3
"""Neues Bild für die Website aufbereiten.

Aufruf:  python3 scripts/add-image.py pfad/zum/foto.jpg mein-bildname
Erzeugt assets/img/mein-bildname-{480..2560}.webp + mein-bildname.jpg
und trägt das Bild in scripts/imgmeta.json ein. Benötigt Pillow (pip install Pillow).
"""
import json, os, sys
from PIL import Image, ImageOps

if len(sys.argv) != 3:
    sys.exit(__doc__)
src, name = sys.argv[1], sys.argv[2]
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
out = os.path.join(root, 'assets', 'img')
meta_path = os.path.join(root, 'scripts', 'imgmeta.json')

im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
W, H = im.size
widths = [w for w in (480, 800, 1200, 1600, 2000, 2560) if w < W] + ([W] if W <= 2560 else [])
for w in widths:
    r = im if w == W else im.resize((w, round(H * w / W)), Image.LANCZOS)
    r.save(os.path.join(out, f'{name}-{w}.webp'), 'WEBP', quality=78, method=6)
fw = min(1200, W)
(im if fw == W else im.resize((fw, round(H * fw / W)), Image.LANCZOS)).save(os.path.join(out, f'{name}.jpg'), 'JPEG', quality=80, optimize=True, progressive=True)

meta = json.load(open(meta_path))
meta[name] = {'w': W, 'h': H, 'widths': widths, 'ratio': H / W}
json.dump(meta, open(meta_path, 'w'), indent=1)
print(f'✓ {name}: {len(widths)} Varianten ({", ".join(map(str, widths))} px)')
