#!/usr/bin/env python3
"""Oxide token math: OKLCH -> sRGB hex + WCAG 2.1 contrast ratios.

Ground-truth anchors from the Oxide design system (dark theme):
  neutral-0    oklch(0.162 0.01 260)   bg-default
  neutral-100  oklch(0.2 0.008 260)    bg-raise
  neutral-200  oklch(0.25 0.007 260)   bg-hover
  neutral-300  oklch(0.316 0.006 260)  stroke-default / bg-tertiary
  neutral-500  oklch(0.5 0.004 260)    content-tertiary
  neutral-700  oklch(0.68 0.002 260)   content-secondary
  neutral-800  oklch(0.79 0.0011 260)  content-default
  neutral-1300 oklch(0.995 0.0001 260) content-raise / inverse
  green-800    oklch(0.77 0.1919 163.7) accent
  red-800      oklch(0.712 0.185 11.3)  error
  yellow-800   oklch(0.837 0.14 75)     notice
  blue-800     oklch(0.71 0.15 272)     info
"""

import math

def oklch_to_srgb_hex(L, C, H):
    h = math.radians(H)
    a, b = C * math.cos(h), C * math.sin(h)
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_**3, m_**3, s_**3
    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    def gamma(c):
        c = min(1.0, max(0.0, c))
        return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055

    rgb = [round(gamma(c) * 255) for c in (r, g, bl)]
    return "#{:02x}{:02x}{:02x}".format(*rgb), rgb


def rel_lum(hexstr):
    r, g, b = (int(hexstr[i : i + 2], 16) / 255 for i in (1, 3, 5))
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def contrast(fg, bg):
    l1, l2 = sorted((rel_lum(fg), rel_lum(bg)), reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)


TOKENS = {
    "neutral-0": (0.162, 0.01, 260),
    "neutral-100": (0.2, 0.008, 260),
    "neutral-200": (0.25, 0.007, 260),
    "neutral-300": (0.316, 0.006, 260),
    "neutral-500": (0.5, 0.004, 260),
    "neutral-700": (0.68, 0.002, 260),
    "neutral-800": (0.79, 0.0011, 260),
    "neutral-1300": (0.995, 0.0001, 260),
    "green-800": (0.77, 0.1919, 163.7),
    "green-600": (0.68, 0.15, 163.7),
    "green-1000": (0.87, 0.13, 163.7),
    "red-800": (0.712, 0.185, 11.3),
    "yellow-800": (0.837, 0.14, 75),
    "blue-800": (0.71, 0.15, 272),
}

hexes = {}
for name, (L, C, H) in TOKENS.items():
    hx, _rgb = oklch_to_srgb_hex(L, C, H)
    hexes[name] = hx
    print(f"{name:14} oklch({L} {C} {H}) -> {hx}")

print("\nWCAG 2.1 contrast (fg on bg):")
pairs = [
    ("content-default (n800) on bg-default (n0)", "neutral-800", "neutral-0"),
    ("content-default (n800) on bg-raise (n100)", "neutral-800", "neutral-100"),
    ("content-secondary (n700) on bg-default", "neutral-700", "neutral-0"),
    ("content-tertiary (n500) on bg-default", "neutral-500", "neutral-0"),
    ("content-raise (n1300) on bg-default", "neutral-1300", "neutral-0"),
    ("accent (green-800) on bg-default", "green-800", "neutral-0"),
    ("accent (green-800) on bg-raise", "green-800", "neutral-100"),
    ("accent (green-800) on bg-hover", "green-800", "neutral-200"),
    ("n0 text on accent fill (primary button)", "neutral-0", "green-800"),
    ("error (red-800) on bg-default", "red-800", "neutral-0"),
    ("notice (yellow-800) on bg-default", "yellow-800", "neutral-0"),
    ("info (blue-800) on bg-default", "blue-800", "neutral-0"),
]
for label, fg, bg in pairs:
    ratio = contrast(hexes[fg], hexes[bg])
    verdict = "AAA" if ratio >= 7 else ("AA" if ratio >= 4.5 else ("AA-large" if ratio >= 3 else "FAIL"))
    print(f"  {label:46} {ratio:5.2f}:1  {verdict}")
