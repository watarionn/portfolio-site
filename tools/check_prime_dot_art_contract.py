from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "works/prime-dot-art/index.html").read_text(encoding="utf-8")
JS = (ROOT / "works/prime-dot-art/prime_dot_art.js").read_text(encoding="utf-8")
CSS = (ROOT / "works/prime-dot-art/prime_dot_art.css").read_text(encoding="utf-8")

errors: list[str] = []


def require(text: str, source: str, label: str) -> None:
    if text not in source:
        errors.append(f"missing {label}: {text!r}")


def forbid(text: str, source: str, label: str) -> None:
    if text in source:
        errors.append(f"forbidden {label}: {text!r}")


require("<title>素数点画 — 風花理珠</title>", HTML, "public work title")
require('id="settingsToggle"', HTML, "mobile settings disclosure")
require('aria-controls="settings"', HTML, "settings disclosure target")
require('id="savePngBtn"', HTML, "PNG export control")
require('id="fitBtn"', HTML, "fit control")
require('id="stats"', HTML, "result statistics")

for preset in ("branch", "grid", "mod4", "twins"):
    require(f'data-preset="{preset}"', HTML, f"{preset} preset")

canvas_pos = HTML.find('<div class="canvas-wrap">')
settings_pos = HTML.find('<aside class="panel" id="settings"')
if canvas_pos < 0 or settings_pos < 0 or canvas_pos >= settings_pos:
    errors.append("Canvas must precede settings in DOM reading order")

require("const PRESETS = {", JS, "preset model")
require("const end = Math.min(n + chunkSize, config.N);", JS, "exact step loop")
if JS.count("const end = Math.min(n + chunkSize, config.N);") != 2:
    errors.append("both trajectory passes must stop at the exact configured step count")
require("if (opts[4]) {", JS, "prime-square override")
require("root * root === n && isPrime[root]", JS, "prime-square primality check")
require("URL.revokeObjectURL(url)", JS, "PNG Object URL cleanup")
require("canvasWrap.setAttribute('aria-busy'", JS, "Canvas busy state")
require("savePngBtn.disabled = busy || !hasRenderedOutput", JS, "PNG busy/empty guard")
require("statsEl.replaceChildren", JS, "safe statistics DOM rendering")
require("infoEl.replaceChildren", JS, "safe rule-count DOM rendering")
require("if (!isRendering && hasRenderedOutput) draw();", JS, "resize redraw guard")
require("delete canvas.dataset.fitScale", JS, "clear-state fit reset")
forbid("innerHTML", JS, "HTML-string result rendering")
forbid("new Map(", JS, "trajectory-sized prime-index map")
forbid("config.N + 1", JS, "inclusive step-count regression")

require(".canvas-wrap { order: 1; }", CSS, "mobile Canvas order")
require(".settings-toggle { order: 2; }", CSS, "mobile disclosure order")
require(".panel { order: 3; }", CSS, "mobile settings order")


def sieve(maximum: int) -> list[bool]:
    values = [True] * (maximum + 1)
    values[0] = values[1] = False
    p = 2
    while p * p <= maximum:
        if values[p]:
            for multiple in range(p * p, maximum + 1, p):
                values[multiple] = False
        p += 1
    return values


def digit_sum(number: int) -> int:
    return sum(int(ch) for ch in str(number))


def classify(number: int, primes: list[bool], ordinal: int, opts: list[bool]) -> int:
    rule = 0
    if primes[number]:
        rule = 1 if ordinal % 2 == 1 else 2
        if opts[0] and primes[ordinal]:
            rule = 3
        if opts[1] and number % 4 == 1:
            rule = 4
        if opts[2] and number % 4 == 3:
            rule = 5
        if opts[3] and primes[digit_sum(number)]:
            rule = 6
    if opts[4]:
        root = int(number ** 0.5)
        if root > 1 and root * root == number and primes[root]:
            rule = 7
    if opts[5] and primes[number] and (primes[number + 2] or (number > 1 and primes[number - 2])):
        rule = 8
    return rule


def turn(direction: int, action: str) -> int:
    if action == "right":
        return (direction + 1) % 4
    if action == "left":
        return (direction + 3) % 4
    if action == "back":
        return (direction + 2) % 4
    return direction


def simulate(total: int, turns: dict[int, str], opts: list[bool]) -> tuple[int, int, int]:
    primes = sieve(total + 2)
    dx = (0, 1, 0, -1)
    dy = (-1, 0, 1, 0)
    x = y = direction = ordinal = prime_count = 0
    min_x = max_x = min_y = max_y = 0
    for number in range(total):
        if primes[number]:
            ordinal += 1
            prime_count += 1
        rule = classify(number, primes, ordinal, opts)
        direction = turn(direction, turns.get(rule, "straight"))
        min_x = min(min_x, x)
        max_x = max(max_x, x)
        min_y = min(min_y, y)
        max_y = max(max_y, y)
        x += dx[direction]
        y += dy[direction]
    return max_x - min_x + 1, max_y - min_y + 1, prime_count


branch = simulate(5000, {0: "straight", 1: "right", 2: "back"}, [False] * 6)
grid = simulate(5000, {0: "straight", 1: "right", 2: "right"}, [False] * 6)
if branch != (203, 135, 669):
    errors.append(f"branch preset reference regression: {branch}")
if grid != (129, 327, 669):
    errors.append(f"grid preset reference regression: {grid}")

primes_100 = sieve(102)
ordinal = 0
square_count = 0
for number in range(100):
    if primes_100[number]:
        ordinal += 1
    if classify(number, primes_100, ordinal, [False, False, False, False, True, False]) == 7:
        square_count += 1
if square_count != 4:
    errors.append(f"prime-square reference regression: {square_count}")

if errors:
    raise SystemExit("Prime Dot Art contract failed:\n- " + "\n- ".join(errors))

print("Prime Dot Art interaction contract passed")
