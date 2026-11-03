#!/usr/bin/env python3
"""Generate a 1200x630 OpenGraph card for FAME Protocol (Oxide-dark aesthetic)."""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = (11, 14, 18)
GREEN = (72, 213, 151)
GREEN_DIM = (72, 213, 151, 70)
TEXT = (232, 238, 242)
MUTED = (128, 140, 150)
STROKE = (38, 46, 56)

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img, "RGBA")

# subtle radial-ish glow top-right
for i in range(120, 0, -1):
    r = 620 - i * 5
    alpha = int(3 + i * 0.22)
    draw.ellipse(
        [W - r + 140, -r // 2, W + 140 + r, r], fill=(72, 213, 151, alpha // 8)
    )

# mono grid lines
for x in range(0, W, 60):
    draw.line([(x, 0), (x, H)], fill=(22, 27, 34))
for y in range(0, H, 60):
    draw.line([(0, y), (W, y)], fill=(22, 27, 34))


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


bold = font("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 120)
mono = font("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 30)
mono_small = font("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 22)

# Blotter bars bottom-right
import random

random.seed(7)
bars_x = 700
base_y = 560
for i in range(14):
    h = random.randint(24, 130)
    x = bars_x + i * 32
    color = GREEN if random.random() > 0.25 else (86, 98, 110)
    draw.rectangle([x, base_y - h, x + 18, base_y], fill=color + (150,))

# headline
draw.text((80, 130), "FAME//", font=bold, fill=GREEN)
draw.text((80, 280), "Formally verified parametric", font=mono, fill=TEXT)
draw.text((80, 322), "parlay infrastructure", font=mono, fill=TEXT)
draw.line([(84, 380), (360, 380)], fill=GREEN, width=3)
draw.text((80, 400), "One curve. No insiders.", font=mono_small, fill=MUTED)
draw.text((80, 436), "Liquidity floor 1.20  ·  Breaker 1.10  ·  Cap 1.0B  ·  Timelock 48h",
          font=mono_small, fill=MUTED)

# corner ticks
draw.line([(0, 0), (28, 0)], fill=GREEN, width=4)
draw.line([(0, 0), (0, 28)], fill=GREEN, width=4)
draw.line([(W, H), (W - 28, H)], fill=GREEN, width=4)
draw.line([(W, H), (W, H - 28)], fill=GREEN, width=4)

img.save("/home/z/my-project/public/og-image.png", "PNG")
print("og-image.png written", img.size)
