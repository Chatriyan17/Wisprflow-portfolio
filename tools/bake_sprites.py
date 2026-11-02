#!/usr/bin/env python3
"""
Bake in-game sprite sheets for the two original characters.

The sprites are cut directly out of the supplied character reference sheets
(reference/*.webp), so the characters in the game are the exact original
designs and not redrawn approximations. This script:

  1. cuts each turnaround pose (front / side / back) out of its sheet,
  2. removes the sheet background and floor shadow,
  3. reduces it to a clean, game-scale pixel sprite,
  4. splits the side pose into an upper body layer and a legs layer, and
  5. generates animation frames (idle, walk, run, jump, fall, land, talk,
     look-around) by posing those layers, so every frame keeps the same face,
     hair, glasses, clothes and colours as the reference.

Output: assets/sprites/<name>.png (sheet) and assets/sprites/<name>.json.

Usage:  python3 tools/bake_sprites.py
Requires: Pillow, numpy, scipy
"""
import json
import math
import os

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "reference")
OUT = os.path.join(ROOT, "assets", "sprites")

# ---------------------------------------------------------------------------
# Character definitions (pixel boxes are in reference-sheet coordinates)
# ---------------------------------------------------------------------------
CHARACTERS = {
    "boy": {
        "sheet": "boy-character-sheet.webp",
        "bg": (75, 36, 38),
        "bg_tol": 14,
        "height": 78,           # target sprite height in world pixels
        "erode": 1,
        "poses": {
            # name: (x0, y0, x1, y1, sole_y, flip)
            "front": (566, 100, 700, 474, 471, False),
            "side": (712, 108, 836, 474, 470, True),   # sheet faces left -> flip to face right
            "back": (848, 108, 972, 474, 470, False),
        },
        "hip": 0.565,           # hip line as a fraction of the side sprite height
        "palette": 48,
    },
    "girl": {
        "sheet": "girl-character-sheet.webp",
        "bg": (250, 207, 195),
        "bg_tol": 28,
        "height": 70,
        "erode": 3,
        "poses": {
            "front": (440, 56, 602, 462, 457, False),
            "side": (603, 56, 722, 462, 455, False),    # already faces right
            "back": (725, 56, 859, 462, 456, False),
        },
        "hip": 0.545,
        "palette": 48,
    },
}

CELL_PAD_X = 14   # extra room for legs swinging out
CELL_PAD_TOP = 4


def cut_pose(sheet, bg, tol, box, sole_y, erode=1):
    x0, y0, x1, y1 = box
    c = sheet[y0:y1, x0:x1].astype(int)
    d = np.sqrt(((c - np.array(bg)) ** 2).sum(-1))
    near = ndimage.binary_opening(d < tol, iterations=1)
    lab, n = ndimage.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgm = np.isin(lab, list(border))
    fg = ndimage.binary_fill_holes(~bgm)
    # punch out enclosed background gaps (e.g. between the legs) in the lower half only
    strict = d < max(8, tol * 0.6)
    lab2, n2 = ndimage.label(strict & fg)
    sizes = ndimage.sum(strict, lab2, range(1, n2 + 1))
    objs = ndimage.find_objects(lab2)
    for i, s in enumerate(sizes):
        if s > 250 and objs[i][0].start > c.shape[0] * 0.5:
            fg &= lab2 != i + 1
    # drop the floor shadow below the soles
    fg[sole_y - y0 + 1:, :] = False
    # trim the anti-aliased fringe that still carries background colour
    if erode:
        fg = ndimage.binary_erosion(fg, iterations=erode)
    # keep only the largest connected figure
    lab, n = ndimage.label(fg)
    if n > 1:
        sizes = ndimage.sum(fg, lab, range(1, n + 1))
        fg = lab == (int(np.argmax(sizes)) + 1)
    ys, xs = np.where(fg)
    c = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    fg = fg[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return c.astype(np.uint8), fg


def to_pixel_sprite(rgb, mask, target_h, flip):
    h, w = mask.shape
    scale = target_h / h
    tw = max(1, round(w * scale))
    a = mask.astype(np.float32)
    prem = rgb.astype(np.float32) * a[..., None]
    rgba = np.dstack([prem, a * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA").resize((tw, target_h), Image.BOX)
    arr = np.asarray(img).astype(np.float32)
    alpha = arr[..., 3] / 255.0
    rgb_out = np.where(alpha[..., None] > 0.01, arr[..., :3] / np.maximum(alpha[..., None], 0.01), 0)
    rgb_out = np.clip(rgb_out, 0, 255)
    solid = alpha > 0.45
    out = np.dstack([rgb_out, np.where(solid, 255, 0)]).astype(np.uint8)
    im = Image.fromarray(out, "RGBA")
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    return im


def quantize_all(images, colors):
    """Quantise every pose of a character to one shared palette."""
    total_w = sum(i.width for i in images)
    max_h = max(i.height for i in images)
    strip = Image.new("RGB", (total_w, max_h), (0, 0, 0))
    x = 0
    boxes = []
    for i in images:
        strip.paste(i.convert("RGB"), (x, 0))
        boxes.append((x, i))
        x += i.width
    q = strip.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    out = []
    for x, i in boxes:
        part = q.crop((x, 0, x + i.width, i.height)).convert("RGBA")
        part.putalpha(i.getchannel("A"))
        out.append(part)
    return out


def add_outline(im, color=(28, 16, 26, 255)):
    """Thin dark outline so the sprite reads cleanly against any background."""
    a = np.asarray(im)[..., 3] > 0
    grown = ndimage.binary_dilation(a, structure=np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]]))
    ring = grown & ~a
    arr = np.asarray(im).copy()
    arr[ring] = color
    return Image.fromarray(arr, "RGBA")


def split_legs(side, hip_frac):
    """Return (upper, legs, hip_y, hip_x). Arms/hands below the hip stay on the upper layer."""
    arr = np.asarray(side).astype(int)
    h, w = arr.shape[:2]
    hip = int(round(h * hip_frac))
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    skin = (r > g + 18) & (g > b + 8) & (r > 120) & (a > 0)
    yy = np.arange(h)[:, None].repeat(w, 1)
    legs_mask = (yy >= hip) & (a > 0)
    # hands hanging beside the hip stay with the upper body
    skin_low = skin & (yy >= hip) & (yy < hip + int(h * 0.12))
    skin_low = ndimage.binary_dilation(skin_low, iterations=1) & legs_mask & (yy < hip + int(h * 0.13))
    legs_mask &= ~skin_low
    upper = arr.copy()
    upper[legs_mask] = 0
    legs = arr.copy()
    legs[~legs_mask] = 0
    xs = np.where(legs_mask.any(0))[0]
    hip_x = (xs.min() + xs.max()) / 2 if len(xs) else w / 2
    return (Image.fromarray(upper.astype(np.uint8), "RGBA"),
            Image.fromarray(legs.astype(np.uint8), "RGBA"), hip, hip_x)


def darken(im, f):
    arr = np.asarray(im).astype(np.float32).copy()
    arr[..., :3] *= f
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGBA")


def rotate_about(im, angle_deg, pivot):
    """Rotate with nearest-neighbour sampling around a pivot (keeps pixels crisp)."""
    return im.rotate(angle_deg, resample=Image.NEAREST, center=pivot, expand=False)


def compose(cell_w, cell_h, sprite_w, sprite_h, layers):
    """layers: list of (image, dx, dy) where image is sprite-sized; places feet at the cell bottom centre."""
    cell = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
    ox = (cell_w - sprite_w) // 2
    oy = cell_h - sprite_h
    for im, dx, dy in layers:
        cell.alpha_composite(im, (ox + int(dx), oy + int(dy)))
    return cell


def squash(im, sx, sy, cell_w, cell_h):
    w, h = im.size
    nw, nh = max(1, round(w * sx)), max(1, round(h * sy))
    s = im.resize((nw, nh), Image.NEAREST)
    cell = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
    cell.alpha_composite(s, ((cell_w - nw) // 2, cell_h - nh))
    return cell


def shear_upper(im, amount, pivot_y):
    """Lean the upper body forward (positive amount = lean right) around the hip."""
    w, h = im.size
    # x_src = x + amount*(y - pivot_y)/h  (affine: a b c / d e f)
    k = amount / max(1, pivot_y)
    return im.transform((w, h), Image.AFFINE, (1, k, -k * pivot_y, 0, 1, 0), resample=Image.NEAREST)


def bake(name, cfg):
    sheet = np.asarray(Image.open(os.path.join(REF, cfg["sheet"])).convert("RGB"))
    raw = {}
    for pose, (x0, y0, x1, y1, sole, flip) in cfg["poses"].items():
        rgb, mask = cut_pose(sheet, cfg["bg"], cfg["bg_tol"], (x0, y0, x1, y1), sole, cfg.get("erode", 1))
        raw[pose] = to_pixel_sprite(rgb, mask, cfg["height"], flip)
    names = list(raw.keys())
    quant = quantize_all([raw[n] for n in names], cfg["palette"])
    poses = {n: add_outline(q) for n, q in zip(names, quant)}

    max_w = max(p.width for p in poses.values())
    sh = poses["side"].height
    cell_w = max_w + CELL_PAD_X * 2
    cell_h = sh + CELL_PAD_TOP
    cell_w += cell_w % 2

    # place the side pose on a cell-sized canvas so rotated legs are never clipped
    side_src = poses["side"]
    side = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
    side.alpha_composite(side_src, ((cell_w - side_src.width) // 2, cell_h - side_src.height))
    sw, sh = side.size
    upper, legs, hip_y, hip_x = split_legs(side, cfg["hip"] * side_src.height / cell_h + (cell_h - side_src.height) / cell_h)
    pivot = (hip_x, hip_y)
    # a short un-rotated "pelvis" strip keeps the hip filled while the legs swing
    legs_arr = np.asarray(legs).copy()
    pelvis_arr = legs_arr.copy()
    pelvis_arr[hip_y + max(4, sh // 14):] = 0
    pelvis = darken(Image.fromarray(pelvis_arr, "RGBA"), 0.85)

    frames = []
    anims = {}

    def add(anim, img):
        anims.setdefault(anim, []).append(len(frames))
        frames.append(img)

    leg_len = sh - hip_y

    def side_frame(front_angle, back_angle, bob=0, lean=0, head_bob=0):
        # rotated legs are vertically shorter: drop the body so the feet stay planted
        drop = round(leg_len * (1 - math.cos(math.radians(max(abs(front_angle), abs(back_angle))))) * 0.8)
        bob += drop
        back = darken(rotate_about(legs, back_angle, pivot), 0.72)
        front = rotate_about(legs, front_angle, pivot)
        up = upper
        if lean:
            up = shear_upper(up, lean, hip_y)
        layers = [(pelvis, 0, bob), (back, 0, bob), (front, 0, bob)]
        if head_bob:
            head_h = (cell_h - side_src.height) + int(side_src.height * 0.40)
            body = up.copy()
            body_arr = np.asarray(body).copy()
            body_arr[:head_h] = 0
            head_arr = np.asarray(up).copy()
            head_arr[head_h:] = 0
            layers += [(Image.fromarray(body_arr, "RGBA"), 0, bob),
                       (Image.fromarray(head_arr, "RGBA"), 0, bob + head_bob)]
        else:
            layers.append((up, 0, bob))
        return compose(cell_w, cell_h, sw, sh, layers)

    # idle (side) - gentle breathing
    for bob in (0, 0, 1, 1):
        add("idle", side_frame(0, 0, head_bob=bob))
    # walk - scissor stride
    for i in range(8):
        t = i / 8 * math.tau
        ang = math.sin(t) * 20
        bob = 1 if abs(math.cos(t)) > 0.7 else 0
        add("walk", side_frame(ang, -ang, bob=-bob))
    # run - wider stride, forward lean, more bounce
    for i in range(8):
        t = i / 8 * math.tau
        ang = math.sin(t) * 34
        bob = 2 if abs(math.cos(t)) > 0.7 else 0
        add("run", side_frame(ang, -ang, bob=-bob, lean=5))
    # jump / fall
    add("jump", side_frame(28, -14, lean=2))
    add("fall", side_frame(12, -22))
    # land - squash and recover
    base = side_frame(0, 0)
    add("land", squash(base, 1.08, 0.9, cell_w, cell_h))
    add("land", squash(base, 1.03, 0.96, cell_w, cell_h))
    # talk (side) - head nods while speaking
    for hb in (0, 1, 0, 1):
        add("talk", side_frame(0, 0, head_bob=hb))
    # front / back views
    fw, fh = poses["front"].size
    add("front", compose(cell_w, cell_h, fw, fh, [(poses["front"], 0, 0)]))
    fr = poses["front"]
    fr_arr = np.asarray(fr).copy()
    hh = int(fh * 0.42)
    head = fr_arr.copy(); head[hh:] = 0
    body = fr_arr.copy(); body[:hh] = 0
    add("front_talk", compose(cell_w, cell_h, fw, fh, [(poses["front"], 0, 0)]))
    add("front_talk", compose(cell_w, cell_h, fw, fh, [(Image.fromarray(body, "RGBA"), 0, 0),
                                                        (Image.fromarray(head, "RGBA"), 0, 1)]))
    bw, bh = poses["back"].size
    add("back", compose(cell_w, cell_h, bw, bh, [(poses["back"], 0, 0)]))

    # pack into a sheet
    cols = 8
    rows = math.ceil(len(frames) / cols)
    sheet_img = Image.new("RGBA", (cols * cell_w, rows * cell_h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet_img.alpha_composite(f, ((i % cols) * cell_w, (i // cols) * cell_h))
    os.makedirs(OUT, exist_ok=True)
    sheet_img.save(os.path.join(OUT, f"{name}.png"), optimize=True)
    meta = {
        "image": f"{name}.png",
        "frameWidth": cell_w,
        "frameHeight": cell_h,
        "columns": cols,
        "spriteHeight": sh,
        "spriteWidth": sw,
        "anchor": {"x": cell_w / 2, "y": cell_h},
        "faces": "right",
        "animations": anims,
        "source": f"reference/{cfg['sheet']}",
    }
    with open(os.path.join(OUT, f"{name}.json"), "w") as fh_:
        json.dump(meta, fh_, indent=2)
    print(f"{name}: {len(frames)} frames, cell {cell_w}x{cell_h}, sprite {sw}x{sh}")


# Dialogue portraits: cropped as-is from the expression panels of each sheet.
PORTRAITS = {
    "boy": {
        "sheet": "boy-character-sheet.webp",
        "cells": {
            "neutral": (1000, 163, 1100, 305), "smile": (1103, 163, 1203, 305),
            "happy": (1205, 163, 1305, 305), "laugh": (1307, 163, 1407, 305),
            "surprised": (1410, 163, 1510, 305), "thinking": (1000, 352, 1100, 500),
            "speaking": (1108, 352, 1208, 500), "curious": (1214, 352, 1314, 500),
            "wink": (1320, 352, 1420, 500), "sad": (1424, 352, 1524, 500),
        },
    },
    "girl": {
        "sheet": "girl-character-sheet.webp",
        "cells": {
            "neutral": (1010, 60, 1132, 198), "smile": (1144, 60, 1262, 198),
            "laugh": (1273, 60, 1391, 198), "surprised": (1401, 60, 1521, 198),
            "thinking": (1010, 248, 1132, 398), "speaking": (1144, 248, 1262, 398),
            "curious": (1273, 248, 1391, 398), "wink": (1401, 248, 1521, 398),
        },
    },
}


def bake_portraits():
    out_dir = os.path.join(ROOT, "assets", "portraits")
    os.makedirs(out_dir, exist_ok=True)
    index = {}
    for name, cfg in PORTRAITS.items():
        sheet = Image.open(os.path.join(REF, cfg["sheet"])).convert("RGB")
        index[name] = []
        for expr, box in cfg["cells"].items():
            sheet.crop(box).save(os.path.join(out_dir, f"{name}-{expr}.png"), optimize=True)
            index[name].append(expr)
    with open(os.path.join(out_dir, "index.json"), "w") as f:
        json.dump(index, f, indent=2)
    print("portraits:", {k: len(v) for k, v in index.items()})


if __name__ == "__main__":
    for n, c in CHARACTERS.items():
        bake(n, c)
    bake_portraits()
