---
description: Verify the Sanctuary dashboard parses + balances after an edit. Run after every Sanctuary change.
---

The Sanctuary is a single-file app at `my-frqncy/dashboard/index.html`. After any edit, run this verification so a broken inline `<script>` or HTML imbalance doesn't ship.

Run from the repo root:

```bash
python3 -c "
import re, subprocess, tempfile, os
html = open('my-frqncy/dashboard/index.html').read()
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html, re.DOTALL)
ok, fail = 0, 0
for i, s in enumerate(scripts):
    if not s.strip(): continue
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as f: f.write(s); p=f.name
    r = subprocess.run(['node','--check',p], capture_output=True, text=True)
    os.unlink(p)
    if r.returncode == 0: ok += 1
    else:
        fail += 1
        print(f'  block {i}: FAIL')
        print('   ', r.stderr[:300])
print(f'  {ok}/{len(scripts)} script blocks OK ({fail} failed)')
issues = []
for o,c in [('{','}'),('(',')')]:
    d = html.count(o) - html.count(c)
    if abs(d) > 5: issues.append(f'{o}{c}={d}')
print('  HTML balance:', 'OK' if not issues else issues)
print('  <body> pairs:', html.count('<body'), '/', html.count('</body>'))
"
```

If any block fails, surface the error to Orlando — don't try to patch silently. The Sanctuary is the surface he interacts with most; a syntax error blocks every other piece.

After verifying, count the render functions present:

```bash
grep -c "function render\|function renderToday\|function renderFirstRun\|function autoGrow" my-frqncy/dashboard/index.html
```
