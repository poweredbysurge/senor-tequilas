#!/usr/bin/env python3
"""Verification for the three seasonal preview pages, against the approved copy file.

  python3 scripts/check-seasonal.py            all three reports
  python3 scripts/check-seasonal.py coverage   sentences from the copy file missing from the built HTML
  python3 scripts/check-seasonal.py headings   the H1 and H2 outline per page, against the copy file
  python3 scripts/check-seasonal.py links      internal links per page, against the copy file

Expected coverage misses: the "> PENDING" notes, the title tag, the meta description and the
homepage card lines, which are not page copy. Everything else must be on the page.
"""
import re, sys, html, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
COPY = ROOT / 'design/copy/holiday-pages-copy-2026-10-24.md'
PAGES = {'/holiday-parties': 'PAGE B', '/new-years-eve': 'PAGE C', '/birria-ramen': 'PAGE D'}

def norm(s):
    s = html.unescape(s)
    s = s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"').replace(' ', ' ')
    return re.sub(r'\s+', ' ', s).strip()

def page_text(path):
    h = (ROOT / 'dist' / path.strip('/') / 'index.html').read_text(encoding='utf-8')
    body = h[h.find('<body'):]
    body = re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>', ' ', body, flags=re.S)
    body = re.sub(r'</?(a|strong|em|b|i|span|small|s|u)\b[^>]*>', '', body)
    return norm(re.sub(r'<[^>]+>', ' ', body)), h

def copy_sections():
    text = COPY.read_text(encoding='utf-8')
    parts = re.split(r'^# (PAGE [BCD]):.*$', text, flags=re.M)
    out = {}
    for i in range(1, len(parts), 2):
        body = parts[i + 1]
        body = body.split('\n---\n')[0] if '\n---\n' in body else body
        out[parts[i]] = body
    return out

def sentences(block):
    """Copy sentences, with the markdown and the non-copy lines taken out."""
    keep, skipped = [], []
    for raw in block.split('\n'):
        line = raw.strip()
        if not line or line.startswith('#') or line.startswith('|'): continue
        if line.startswith('> PENDING') or re.match(r'\*\*(Title tag|Meta description|Primary|Primary keyword|CTA|Form):\*\*', line) or line.startswith('Eyebrow:'):
            skipped.append(line); continue
        line = re.sub(r'^> ', '', line)
        line = re.sub(r'^\*\*(Eyebrow|H1|H2):\*\*\s*', '', line)
        line = re.sub(r'^\d+\.\s+', '', line); line = re.sub(r'^- ', '', line)
        line = re.sub(r'<small>(.*?)</small>', r'\1', line)
        line = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', line)
        line = line.replace('**', '')
        for s in re.split(r'(?:(?<=[.!?])|(?<=[.!?]"))\s+(?=[A-Z"\u201c$])', line):
            s = norm(s)
            if len(s) >= 12: keep.append(s)
    return keep, skipped

def coverage():
    secs = copy_sections(); ok = True
    for path, key in PAGES.items():
        text, _ = page_text(path)
        sents, skipped = sentences(secs[key])
        miss = [s for s in sents if s not in text]
        print(f'\n== coverage {path}: {len(sents) - len(miss)}/{len(sents)} sentences on the page; {len(skipped)} non-copy lines skipped')
        for m in miss: print('   MISSING:', m[:160]); ok = False
    return ok

def headings():
    secs = copy_sections(); ok = True
    for path, key in PAGES.items():
        _, h = page_text(path)
        main = h[h.find('<body'):]; main = main[:main.find('<footer')] if '<footer' in main else main
        h1 = [norm(re.sub(r'<[^>]+>', ' ', x)) for x in re.findall(r'<h1[^>]*>(.*?)</h1>', main, re.S)]
        h2 = [norm(re.sub(r'<[^>]+>', ' ', x)) for x in re.findall(r'<h2[^>]*>(.*?)</h2>', main, re.S)]
        want_h1 = [norm(x) for x in re.findall(r'^\*\*H1:\*\*\s*(.+)$', secs[key], re.M)]
        want_h2 = [norm(x) for x in re.findall(r'^\*\*H2:\*\*\s*(.+)$', secs[key], re.M)]
        print(f'\n== headings {path}')
        print('   H1:', h1)
        for x in h2: print('   H2:', x)
        if h1 != want_h1: print('   H1 MISMATCH, copy says', want_h1); ok = False
        if len(h1) != 1: print('   H1 COUNT', len(h1)); ok = False
        missing = [x for x in want_h2 if x not in h2]; extra = [x for x in h2 if x not in want_h2]
        if missing: print('   H2 MISSING:', missing); ok = False
        if extra: print('   H2 NOT IN COPY:', extra); ok = False
    return ok

def links():
    secs = copy_sections(); ok = True
    for path, key in PAGES.items():
        _, h = page_text(path)
        main = h[h.find('<body'):]; main = main[:main.find('<footer')] if '<footer' in main else main
        have = sorted(set(re.findall(r'href="(/[^"#]*)(?:#[^"]*)?"', main)))
        have_full = sorted(set(re.findall(r'href="(/[^"]*)"', main)))
        want = sorted(set(re.sub(r'/(?=#|$)', '', u) or '/' for u in re.findall(r'\]\((/[^)]+)\)', secs[key])))
        want_full = sorted(set(re.findall(r'\]\((/[^)]+)\)', secs[key])))
        norm_have = set(re.sub(r'/(?=#|$)', '', u) or '/' for u in have_full)
        missing = [u for u in want if u not in norm_have and u.split('#')[0] not in norm_have]
        print(f'\n== links {path}: {len(have_full)} internal hrefs on the page; copy wants {want_full}')
        print('   on page:', have_full)
        if missing: print('   MISSING:', missing); ok = False
    return ok

if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'all'
    res = []
    if which in ('all', 'coverage'): res.append(coverage())
    if which in ('all', 'headings'): res.append(headings())
    if which in ('all', 'links'): res.append(links())
    sys.exit(0 if all(res) else 1)
