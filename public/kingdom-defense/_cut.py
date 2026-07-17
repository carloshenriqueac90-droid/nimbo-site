# -*- coding: utf-8 -*-
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
import os

SRC = 'assets/menu ingles'
DST = 'assets/ui'

def painel_solido(src, dst, thr=14, fechar=12):
    im = Image.open(src).convert('RGBA')
    a = np.asarray(im).astype(np.float64)
    lum = a[..., :3].mean(-1)
    m = lum > thr
    m = ndimage.binary_closing(m, iterations=fechar)
    lbl, n = ndimage.label(m)
    if n > 1:
        tam = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
        limite = max(tam.max() * 0.12, a.shape[0] * a.shape[1] * 0.004)
        m = np.isin(lbl, [i + 1 for i, t in enumerate(tam) if t >= limite])
    m = ndimage.binary_fill_holes(m)
    alpha = ndimage.gaussian_filter(np.where(m, 255.0, 0.0), 1.0)
    a[..., 3] = alpha
    ys, xs = np.where(alpha > 40)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(a.astype('uint8'), 'RGBA').save(dst)
    return Image.open(dst).size

MAP = {
    'menu inicial': 'menu_modos',
    'normal modo': 'menu_normal_intro',
    'chaos modo': 'menu_caos_intro',
    'pause': 'menu_pausa',
    'derrota': 'menu_derrota',
    'carregando': 'menu_carregando',
}
for src, dst in MAP.items():
    sz = painel_solido(os.path.join(SRC, src + '.png'), os.path.join(DST, dst + '.png'))
    print(f'{dst:20s} {sz}')
print('OK')
