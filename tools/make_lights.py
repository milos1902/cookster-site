#!/usr/bin/env python3
"""Builds the lamp layers of the tavern from ONE picture of the tavern with all the lights out (1672x941).
usage: python3 tools/make_lights.py <dark picture>          (needs ImageMagick "convert")
Writes assets/tavern/lights/: shade.webp (how much darker the dark picture is, smooth, 1/4 size), w<i>.webp (white, alpha = the part of that shade
that belongs to lamp i; the weights of all lamps add up to 1), core<i>.webp (the lamp itself from the dark picture) and lights.json.
Edit LAMPS to move / add a lamp: x,y = centre of the lamp, rx,ry = size of the lamp body, s = how far its light reaches."""
import json, os, subprocess, sys, tempfile
W, H, Q = 1672, 941, 4
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'assets/tavern/lights'); CLEAN = os.path.join(ROOT, 'assets/tavern/kafana_cista.webp')
LAMPS = [
  dict(id='visece', label='Viseća lampa', x=572, y=170, rx=82, ry=95, s=260),
  dict(id='zid_levo', label='Lampa levo na zidu', x=424, y=52, rx=30, ry=46, s=200),
  dict(id='sank', label='Lampa na šanku', x=910, y=225, rx=42, ry=46, s=190),
  dict(id='zid_desno', label='Lampa desno na zidu', x=1643, y=140, rx=36, ry=52, s=260),
  dict(id='pec', label='Vatra u peći', x=1270, y=380, rx=0, ry=0, s=230, stove=True),
]
def run(*a): subprocess.run(list(a), check=True)
def main(dark):
    os.makedirs(OUT, exist_ok=True); tmp = tempfile.mkdtemp()
    w, h = W // Q, H // Q
    # how much darker: smooth ratio dark / lit (1 = no change)
    run('convert', dark, '-resize', '%dx%d!' % (w, h), tmp + '/d.png'); run('convert', CLEAN, '-resize', '%dx%d!' % (w, h), tmp + '/c.png')
    run('convert', tmp + '/d.png', tmp + '/c.png', '-fx', 'min(1,u/(v+0.004))', '-blur', '0x1.2', tmp + '/f.png')
    # how dark the surroundings of every lamp are (the shade just outside the lamp body): inside the lamp the shade is set to that,
    # and the lamp body is brightened by the same amount, so that an unlit lamp in a lit room is lit by the room, not by itself
    run('convert', tmp + '/d.png', tmp + '/c.png', '-fx', 'min(1,u/(v+0.004))', '-blur', '0x1.2', tmp + '/f0.png')
    ring = {}
    for L in LAMPS:
        if L.get('stove'): continue
        pts = [(L['x'] + L['rx'] + 28, L['y']), (L['x'] - L['rx'] - 28, L['y']), (L['x'], L['y'] - L['ry'] - 28), (L['x'], L['y'] + L['ry'] + 28)]
        acc = [0, 0, 0]; n = 0
        for (px, py) in pts:
            px = min(W - 1, max(0, px)); py = min(H - 1, max(0, py))
            out = subprocess.run(['convert', tmp + '/f0.png', '-format', '%[fx:p{' + str(int(px / Q)) + ',' + str(int(py / Q)) + '}.r],%[fx:p{' + str(int(px / Q)) + ',' + str(int(py / Q)) + '}.g],%[fx:p{' + str(int(px / Q)) + ',' + str(int(py / Q)) + '}.b]', 'info:'], capture_output=True, text=True, check=True).stdout.split(',')
            for i in range(3): acc[i] += float(out[i])
            n += 1
        ring[L['id']] = [max(0.04, c / n) for c in acc]
    shade = tmp + '/f0.png'
    for L in LAMPS:
        if L.get('stove'): continue
        r = ring[L['id']]
        run('convert', '-size', '%dx%d' % (w, h), 'xc:black', '-fill', 'white', '-draw', 'ellipse %d,%d %d,%d 0,360' % (L['x'] / Q, L['y'] / Q, max(1, (L['rx'] - 6) / Q), max(1, (L['ry'] - 6) / Q)), '-blur', '0x1', tmp + '/em.png')
        run('convert', shade, '(', '-size', '%dx%d' % (w, h), 'xc:rgb(%d,%d,%d)' % tuple(int(c * 255) for c in r), tmp + '/em.png', '-alpha', 'off', '-compose', 'copy_opacity', '-composite', ')', '-compose', 'over', '-composite', tmp + '/f1.png')
        shade = tmp + '/f1.png'
    run('convert', shade, '-quality', '90', OUT + '/shade.webp')
    # weights of the lamps (add up to 1; a little is left for places far from every lamp)
    def g(L): return 'exp(-((i*%d-%d)^2+(j*%d-%d)^2)/(%d*%d))' % (Q, L['x'], Q, L['y'], L['s'], L['s'])
    total = '+'.join(g(L) for L in LAMPS)
    manifest = []
    for k, L in enumerate(LAMPS):
        run('convert', '-size', '%dx%d' % (w, h), 'xc:', '-fx', '(%s)/(%s+0.05)' % (g(L), total), '-colorspace', 'Gray', tmp + '/g.png')
        run('convert', '-size', '%dx%d' % (w, h), 'xc:white', tmp + '/g.png', '-alpha', 'off', '-compose', 'copy_opacity', '-composite', '-define', 'webp:alpha-quality=95', '-quality', '90', '%s/w%d.webp' % (OUT, k))
        e = dict(id=L['id'], label=L['label'], x=L['x'], y=L['y'], weight='w%d.webp' % k)
        if L.get('stove'): e['stove'] = True
        else:
            x0, y0 = max(0, L['x'] - L['rx'] - 16), max(0, L['y'] - L['ry'] - 16); cw, ch = 2 * (L['rx'] + 16), 2 * (L['ry'] + 16)
            run('convert', '-size', '%dx%d' % (W, H), 'xc:black', '-fill', 'white', '-draw', 'ellipse %d,%d %d,%d 0,360' % (L['x'], L['y'], L['rx'] + 8, L['ry'] + 8), '-blur', '0x4', tmp + '/m.png')
            r = ring[L['id']]
            run('convert', dark, '-resize', '%dx%d!' % (W, H), '-recolor', '%f 0 0 0 %f 0 0 0 %f' % (1 / r[0], 1 / r[1], 1 / r[2]), tmp + '/m.png', '-alpha', 'off', '-compose', 'copy_opacity', '-composite', '-crop', '%dx%d+%d+%d' % (cw, ch, x0, y0), '+repage', '-define', 'webp:alpha-quality=95', '-quality', '90', '%s/core%d.webp' % (OUT, k))
            e['core'] = dict(file='core%d.webp' % k, x=x0, y=y0, w=cw, h=ch)
        manifest.append(e)
    json.dump(dict(size=[W, H], shade='shade.webp', lamps=manifest), open(OUT + '/lights.json', 'w'), indent=1, ensure_ascii=False)
    print('written', OUT)
if __name__ == '__main__': main(sys.argv[1])
