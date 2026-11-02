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
        # Skeleton for the side pose, in reference-sheet pixels of the cut-out
        # side figure (after flipping to face right).
        "rig": {
            "hip": (52, 215), "knee": (52, 273), "ankle": (47, 333),
            "shoulder": (45, 128), "elbow": (45, 168),
            "arm": [(25, 116), (58, 116), (62, 170), (66, 242), (30, 242), (25, 170)],
            "back_x": 32, "neck_y": 106,
        },
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
        "rig": {
            "hip": (48, 212), "knee": (47, 290), "ankle": (44, 366),
            "shoulder": (33, 118), "elbow": (32, 164),
            "arm": [(9, 106), (46, 106), (52, 160), (56, 254), (14, 254), (9, 160)],
            "back_x": 16, "neck_y": 100,
        },
    },
}

CELL_PAD_X = 22   # extra room for legs swinging out
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


# ---------------------------------------------------------------------------
# Skeletal rig: the side pose is cut into bones (upper arm, forearm, thigh,
# shin, foot) and posed with joint angles from a human gait cycle. Posing
# happens at reference resolution, then each frame is reduced to the game
# pixel grid with the character's palette, so every frame stays crisp and
# keeps the original colours.
# ---------------------------------------------------------------------------

def _rot(v, deg):
    """Rotate a screen-space vector the way PIL rotates images (counter-clockwise on screen)."""
    a = math.radians(deg)
    x, y = v
    return (x * math.cos(a) + y * math.sin(a), -x * math.sin(a) + y * math.cos(a))


def _gauss(p, c, w):
    d = ((p - c + 0.5) % 1.0) - 0.5
    return math.exp(-(d / w) ** 2)


def paste_at(canvas, img, dx, dy):
    dx, dy = int(round(dx)), int(round(dy))
    sx, sy = max(0, -dx), max(0, -dy)
    if sx >= img.width or sy >= img.height:
        return
    canvas.alpha_composite(img, dest=(max(0, dx), max(0, dy)), source=(sx, sy))


def place_bone(canvas, bone, pivot_src, angle, pivot_dst):
    """Rotate a bone image around its joint and pin that joint to pivot_dst."""
    r = bone.convert("RGBa").rotate(angle, resample=Image.BICUBIC, center=pivot_src).convert("RGBA")
    paste_at(canvas, r, pivot_dst[0] - pivot_src[0], pivot_dst[1] - pivot_src[1])


def tint(img, f, purple=0.0):
    a = np.asarray(img).astype(np.float32).copy()
    a[..., :3] *= f
    if purple:
        a[..., 0] += 30 * purple
        a[..., 2] += 50 * purple
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), "RGBA")


class Rig:
    def __init__(self, rgb, mask, flip, cfg):
        im = Image.fromarray(np.dstack([rgb, mask.astype(np.uint8) * 255]).astype(np.uint8), "RGBA")
        if flip:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        R = cfg["rig"]
        self.R = R
        arr = np.asarray(im).copy()
        h, w = arr.shape[:2]
        self.h, self.w = h, w

        # arm mask from the polygon
        from PIL import ImageDraw
        m = Image.new("L", (w, h), 0)
        ImageDraw.Draw(m).polygon(R["arm"], fill=255)
        arm_mask = (np.asarray(m) > 0) & (arr[..., 3] > 0)

        arm = arr.copy()
        arm[~arm_mask] = 0
        # body without the arm; fill the hole with the torso / trousers behind it
        body = arr.copy()
        body[arm_mask] = 0
        for y in range(h):
            xs = np.where(arm_mask[y])[0]
            if not len(xs):
                continue
            right = np.where((arr[y, :, 3] > 0) & ~arm_mask[y] & (np.arange(w) > xs.max()))[0]
            if len(right):
                src = arr[y, min(w - 1, right.min() + 2)]
                if src[3] == 0:
                    src = arr[y, right.min()]
                for x in xs:
                    if x >= R["back_x"]:
                        body[y, x] = src
        self.body = body

        # split the arm at the elbow, and the body at the hip / knee / ankle
        ov = 4
        ey = R["elbow"][1]
        up = arm.copy(); up[ey + ov:] = 0
        fo = arm.copy(); fo[:ey - ov] = 0
        self.upper_arm, self.forearm = up, fo

        hy, ky, ay = R["hip"][1], R["knee"][1], R["ankle"][1]
        torso = body.copy(); torso[hy + 2:] = 0
        legs = body.copy(); legs[:hy - 2] = 0
        thigh = legs.copy(); thigh[ky + ov:] = 0
        shin = legs.copy(); shin[:ky - ov] = 0; shin[ay + ov:] = 0
        foot = legs.copy(); foot[:ay - ov] = 0
        pelvis = legs.copy(); pelvis[hy + 10:] = 0
        head = torso.copy(); head[R["neck_y"]:] = 0
        chest = torso.copy(); chest[:R["neck_y"]] = 0
        to = lambda a: Image.fromarray(a.astype(np.uint8), "RGBA")
        self.parts = {k: to(v) for k, v in dict(
            head=head, chest=chest, pelvis=pelvis, thigh=thigh, shin=shin, foot=foot,
            upper_arm=up, forearm=fo).items()}

    def pose(self, near, far, arm_near, arm_far, lean=0.0, head_bob=0.0, crouch_ok=True):
        """near/far: dicts with hip, knee, foot angles (degrees). arms: (shoulder, elbow)."""
        R, P = self.R, self.parts
        pad = int(self.h * 0.6)
        W, H = self.w + pad * 2, self.h + pad
        ox, oy = pad, pad // 2   # figure origin inside the work canvas
        hip = (R["hip"][0] + ox, R["hip"][1] + oy)

        def leg(canvas, a, dark):
            th, kn, ft = a["hip"], a["knee"], a["foot"]
            kp = _rot((R["knee"][0] - R["hip"][0], R["knee"][1] - R["hip"][1]), th)
            knee = (hip[0] + kp[0], hip[1] + kp[1])
            shin_a = th - kn
            ap = _rot((R["ankle"][0] - R["knee"][0], R["ankle"][1] - R["knee"][1]), shin_a)
            ankle = (knee[0] + ap[0], knee[1] + ap[1])
            parts = [P["thigh"], P["shin"], P["foot"]]
            if dark:
                parts = [tint(x, 0.62, 0.25) for x in parts]
            src = lambda pt: (pt[0] + 0, pt[1] + 0)
            place_bone(canvas, parts[1], R["knee"], shin_a, knee)
            place_bone(canvas, parts[2], R["ankle"], ft, ankle)
            place_bone(canvas, parts[0], R["hip"], th, hip)

        def arm(canvas, a, dark):
            sh_a, el = a
            sp = (R["shoulder"][0] + ox, R["shoulder"][1] + oy + head_bob * 0)
            ep = _rot((R["elbow"][0] - R["shoulder"][0], R["elbow"][1] - R["shoulder"][1]), sh_a)
            elbow = (sp[0] + ep[0], sp[1] + ep[1])
            ua, fa = P["upper_arm"], P["forearm"]
            if dark:
                ua, fa = tint(ua, 0.6, 0.25), tint(fa, 0.6, 0.25)
            place_bone(canvas, fa, R["elbow"], sh_a + el, elbow)
            place_bone(canvas, ua, R["shoulder"], sh_a, sp)

        legs_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        leg(legs_layer, far, True)
        paste_at(legs_layer, tint(P["pelvis"], 0.9), ox, oy)
        leg(legs_layer, near, False)

        top = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        arm(top, arm_far, True)
        paste_at(top, P["chest"], ox, oy)
        paste_at(top, P["head"], ox, oy + head_bob)
        arm(top, arm_near, False)
        if lean:
            # lean the upper body forward around the hip
            k = math.tan(math.radians(lean))
            top = top.transform(top.size, Image.AFFINE, (1, k, -k * hip[1], 0, 1, 0), resample=Image.BICUBIC)

        # plant the lowest foot on the ground: the body rises and falls naturally
        la = np.asarray(legs_layer)[..., 3]
        rows = np.where(la.max(1) > 100)[0]
        lowest = rows.max() if len(rows) else oy + self.h - 1
        frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        frame.alpha_composite(legs_layer)
        frame.alpha_composite(top)
        ground = oy + self.h - 1
        shifted = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        paste_at(shifted, frame, 0, ground - lowest)
        return shifted, (hip[0], ground)


def gait(p, run=False):
    """Joint angles for one leg at gait phase p (0 = heel strike). Degrees; + = forward / toe up."""
    if not run:
        hip = 4 + 23 * math.cos(math.tau * p) + 3 * math.sin(math.tau * p)
        knee = 14 * _gauss(p, 0.12, 0.07) + 56 * _gauss(p, 0.71, 0.11)
        shin = hip - knee
        foot = 14 * _gauss(p, 0.0, 0.05) - 30 * _gauss(p, 0.58, 0.06) + (shin * 0.45 + 8) * _gauss(p, 0.8, 0.09)
    else:
        hip = 8 + 34 * math.cos(math.tau * p) + 6 * math.sin(math.tau * p)
        knee = 28 * _gauss(p, 0.15, 0.08) + 100 * _gauss(p, 0.66, 0.13)
        shin = hip - knee
        foot = 8 * _gauss(p, 0.0, 0.05) - 34 * _gauss(p, 0.5, 0.07) + (shin * 0.4 + 12) * _gauss(p, 0.75, 0.1)
    return {"hip": hip, "knee": knee, "foot": foot}


def to_game_frame(img, anchor, scale, cell_w, cell_h, palette_img):
    """Reduce a posed reference-resolution frame to the game pixel grid."""
    W, H = img.size
    tw, th = max(1, round(W * scale)), max(1, round(H * scale))
    a = np.asarray(img).astype(np.float32)
    al = a[..., 3:4] / 255.0
    prem = np.dstack([a[..., :3] * al, a[..., 3:4]]).astype(np.uint8)
    small = np.asarray(Image.fromarray(prem, "RGBA").resize((tw, th), Image.BOX)).astype(np.float32)
    sa = small[..., 3:4] / 255.0
    rgb = np.where(sa > 0.01, small[..., :3] / np.maximum(sa, 0.01), 0).clip(0, 255)
    solid = small[..., 3] > 0.45 * 255
    q = Image.fromarray(rgb.astype(np.uint8), "RGB").quantize(palette=palette_img, dither=Image.NONE).convert("RGBA")
    qa = np.asarray(q).copy()
    qa[..., 3] = np.where(solid, 255, 0)
    q = add_outline(Image.fromarray(qa, "RGBA"))
    cell = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
    ax, ay = anchor[0] * scale, anchor[1] * scale
    paste_at(cell, q, cell_w / 2 - ax, cell_h - 1 - ay)
    return cell


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

    # palette shared by every frame of this character
    total_w = sum(p.width for p in poses.values())
    strip = Image.new("RGB", (total_w, sh), (0, 0, 0))
    x = 0
    for p_ in poses.values():
        strip.paste(p_.convert("RGB"), (x, 0)); x += p_.width
    palette_img = strip.quantize(colors=cfg["palette"], method=Image.MEDIANCUT, dither=Image.NONE)

    # skeletal rig built from the full-resolution side pose
    x0, y0, x1, y1, sole, flip = cfg["poses"]["side"]
    rgb, mask = cut_pose(sheet, cfg["bg"], cfg["bg_tol"], (x0, y0, x1, y1), sole, cfg.get("erode", 1))
    rig = Rig(rgb, mask, flip, cfg)
    scale = cfg["height"] / rig.h
    sw = cell_w

    frames = []
    anims = {}

    def add(anim, img):
        anims.setdefault(anim, []).append(len(frames))
        frames.append(img)

    def side(near, far, arm_near, arm_far, lean=0.0, head_bob=0.0):
        img, anchor = rig.pose(near, far, arm_near, arm_far, lean=lean, head_bob=head_bob)
        return to_game_frame(img, anchor, scale, cell_w, cell_h, palette_img)

    stand = {"hip": 0, "knee": 0, "foot": 0}
    stand_far = {"hip": -2, "knee": 2, "foot": 0}
    rest_arm = (2, 4)
    bob_px = 1 / scale   # one game pixel in reference pixels

    # idle - gentle breathing (head and shoulders settle by one pixel)
    for hb in (0, 0, bob_px, bob_px):
        add("idle", side(stand, stand_far, rest_arm, (-2, 4), head_bob=hb))
    # walk - full gait cycle with knee bend, heel strike and toe-off; arms counter-swing
    N = 12
    for i in range(N):
        p = i / N
        near, far = gait(p), gait((p + 0.5) % 1)
        arm_n = (-(near["hip"] - 4) * 0.8, 10 + 8 * max(0, -(near["hip"] - 4)) / 23)
        arm_f = (-(far["hip"] - 4) * 0.8, 10 + 8 * max(0, -(far["hip"] - 4)) / 23)
        add("walk", side(near, far, arm_n, arm_f, lean=2))
    # run - longer stride, high knees, bent arms pumping, forward lean
    N = 10
    for i in range(N):
        p = i / N
        near, far = gait(p, True), gait((p + 0.5) % 1, True)
        arm_n = (-(near["hip"] - 8) * 0.9, 70)
        arm_f = (-(far["hip"] - 8) * 0.9, 70)
        add("run", side(near, far, arm_n, arm_f, lean=8))
    # jump: knee drives up, arms swing up
    add("jump", side({"hip": 50, "knee": 80, "foot": -10}, {"hip": -12, "knee": 35, "foot": -25}, (95, 25), (70, 25), lean=3))
    # fall: legs reach for the ground
    add("fall", side({"hip": 22, "knee": 18, "foot": 10}, {"hip": -8, "knee": 30, "foot": -10}, (55, 15), (35, 15)))
    # land: absorb the impact by bending the knees, then stand up
    add("land", side({"hip": 40, "knee": 72, "foot": 0}, {"hip": 34, "knee": 66, "foot": 0}, (30, 30), (20, 30), lean=10))
    add("land", side({"hip": 18, "knee": 32, "foot": 0}, {"hip": 14, "knee": 28, "foot": 0}, (12, 15), (8, 15), lean=4))
    # talk - head nods while speaking, a little hand gesture
    for hb, el in ((0, 20), (bob_px, 35), (0, 25), (bob_px, 40)):
        add("talk", side(stand, stand_far, (8, el), (-2, 4), head_bob=hb))
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


# The protagonist as a schoolboy (Stage 6 memory): the very same reference pixels,
# baked smaller, so he stays recognisably himself.
CHARACTERS["boy-young"] = {**CHARACTERS["boy"], "height": 60}

if __name__ == "__main__":
    for n, c in CHARACTERS.items():
        bake(n, c)
    bake_portraits()
