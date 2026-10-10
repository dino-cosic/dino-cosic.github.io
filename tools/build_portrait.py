"""Turn data/dino-one-line.png into stroke paths and splice them into index.html.

Pipeline: background-normalised threshold -> skeletonise -> trace strokes between
junctions -> smooth + Ramer-Douglas-Peucker simplify -> one <path> per stroke.
The paths are inlined in index.html (between the portrait markers) so the hero
works without JavaScript and Three.js reads the same geometry from the DOM.

Requires: pillow, numpy, scipy, scikit-image.   Run from the repo root.
"""
import numpy as np, json, sys
from PIL import Image
from scipy import ndimage as ndi
from skimage.morphology import skeletonize, remove_small_objects
from skimage.filters import gaussian

src = 'data/dino-one-line.png'
im = np.asarray(Image.open(src).convert('L')).astype(float)/255
im[735:, 1140:] = np.median(im)           # remove generator sparkle
bg = gaussian(im, 25)
d = bg - im
ink = d > 0.07
ink = ndi.binary_closing(ink, iterations=1)
ink = remove_small_objects(ink, 60)
ys, xs = np.where(ink)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
print('bbox', x0, x1, y0, y1, file=sys.stderr)
pad = 10
x0, y0 = max(0, x0-pad), max(0, y0-pad)
x1, y1 = x1+pad, y1+pad
ink = ink[y0:y1, x0:x1]
W, H = ink.shape[1], ink.shape[0]
sk = skeletonize(ink)
sk = remove_small_objects(sk, 12, connectivity=2)
# graph tracing
pts = set(map(tuple, np.argwhere(sk)))
def nb(p):
    y, x = p
    return [(y+dy, x+dx) for dy in (-1,0,1) for dx in (-1,0,1) if (dy or dx) and (y+dy, x+dx) in pts]
deg = {p: len(nb(p)) for p in pts}
nodes = {p for p in pts if deg[p] != 2}
seen_edges = set()
paths = []
def trace(start, nxt):
    path = [start, nxt]
    prev, cur = start, nxt
    while cur not in nodes:
        n = [q for q in nb(cur) if q != prev and q not in path[-3:]]
        if not n: break
        prev, cur = cur, n[0]
        path.append(cur)
    return path
for n0 in nodes:
    for n1 in nb(n0):
        key = (n0, n1)
        if key in seen_edges: continue
        p = trace(n0, n1)
        seen_edges.add((p[0], p[1])); seen_edges.add((p[-1], p[-2]))
        paths.append(p)
# loops with no nodes
used = set(q for p in paths for q in p)
for p0 in list(pts - used):
    if p0 in used: continue
    nxt = nb(p0)
    if not nxt: continue
    p = [p0, nxt[0]]
    prev, cur = p0, nxt[0]
    while True:
        n = [q for q in nb(cur) if q != prev and q not in p]
        if not n: break
        prev, cur = cur, n[0]; p.append(cur)
    used |= set(p); paths.append(p)

def rdp(pl, eps):
    pl = np.array(pl, float)
    if len(pl) < 3: return pl
    a, b = pl[0], pl[-1]
    ab = b - a; L = np.hypot(*ab)
    if L == 0: dist = np.hypot(*(pl - a).T)
    else: dist = np.abs(ab[0]*(pl[:,1]-a[1]) - ab[1]*(pl[:,0]-a[0]))/L
    i = dist.argmax()
    if dist[i] > eps:
        l = rdp(pl[:i+1], eps); r = rdp(pl[i:], eps)
        return np.vstack([l[:-1], r])
    return np.vstack([a, b])

def smooth(pl, it=2):
    pl = np.array(pl, float)
    for _ in range(it):
        if len(pl) < 3: break
        q = pl.copy()
        q[1:-1] = 0.25*pl[:-2] + 0.5*pl[1:-1] + 0.25*pl[2:]
        pl = q
    return pl

out = []
for p in paths:
    if len(p) < 8: continue
    pl = np.array([(x, y) for y, x in p], float)
    pl = smooth(pl, 2)
    pl = rdp(pl, 0.55)
    if len(pl) < 2: continue
    out.append(pl)
# join paths meeting at junction nodes into longer strokes (greedy continuation by direction)
print('paths', len(out), 'points', sum(len(p) for p in out), file=sys.stderr)

import re
W, H = int(W), int(H)
els = []
for p in out:
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}'.rstrip('0').rstrip('.') if False else f'{x:.1f} {y:.1f}' for x, y in p)
    els.append(f'<path d="{d}" pathLength="1"/>')
block = f'<!-- portrait:start {W} {H} -->\n' + '\n'.join(els) + '\n<!-- portrait:end -->'
html = open('index.html').read()
html = re.sub(r'<!-- portrait:start.*?<!-- portrait:end -->', lambda m: block, html, flags=re.S)
html = re.sub(r'viewBox="[^"]*" data-vb', f'viewBox="0 0 {W} {H}" data-vb', html)
open('index.html', 'w').write(html)
print('viewBox', W, H, 'strokes', len(els), file=sys.stderr)
