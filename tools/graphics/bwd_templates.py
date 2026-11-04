"""Bolton Warm & Dry (BWD) post templates - 1080x1350 (4:5, so Facebook and Instagram both take them).

REBUILT 4 Nov 2026. The 8 Oct commit message said these templates were saved to the repo, but the file
never landed (no tools/graphics/bwd_templates.py in any commit). This version was rebuilt by measuring the
published cards (bwd_big_one_degree, bwd_list_four_smells, bwd_myth_electric_heater, bwd_light_immersion,
bwd_photo_fault_code): same colours, same layout, same masthead and sign-off. The face is Literata
(OFL, files in tools/graphics/fonts/ so it renders offline).

Styles:  bignum()  list_card()  myth()  light()  photo()
Render with render(G, outdir, workdir) - returns per-card content-bottom vs the kicker/footer top, so overflow
is caught before anyone looks at it. Then LOOK at every JPG anyway.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, 'fonts')

GREEN = '#153A32'   # card background (sampled 21,58,50)
GOLD = '#E2A33C'    # accent (sampled 226,163,60)
CREAM = '#F5EFDF'   # text on green (sampled 245,239,223)
PAPER = '#F5EDE0'   # light card background (sampled 245,237,224)


def _fontface():
    f = lambda n: 'file://' + os.path.join(FONTS, n)
    return (f"@font-face{{font-family:Lit;src:url('{f('literata-latin-400-normal.woff2')}');font-weight:400}}"
            f"@font-face{{font-family:Lit;src:url('{f('literata-latin-400-italic.woff2')}');font-weight:400;font-style:italic}}"
            f"@font-face{{font-family:Lit;src:url('{f('literata-latin-700-normal.woff2')}');font-weight:700}}"
            f"@font-face{{font-family:Lit;src:url('{f('literata-latin-800-normal.woff2')}');font-weight:800}}")


def house(body=CREAM, window=GOLD, w=34):
    h = round(w * 0.9)
    return (f"<svg width='{w}' height='{h}' viewBox='0 0 34 30'><path d='M17 1 L33 12 V30 H1 V12 Z' fill='{body}'/>"
            f"<rect x='13' y='16' width='8' height='8' fill='{window}'/></svg>")


BASE = """
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;font-family:Lit,Georgia,serif;position:relative;overflow:hidden;-webkit-font-smoothing:antialiased;font-variant-ligatures:no-common-ligatures}
.mast{position:absolute;left:0;right:0;text-align:center;font-weight:700;letter-spacing:9px;padding-left:9px}
"""

DARK = BASE + f"""
body{{background:{GREEN};color:{CREAM}}}
.frame{{position:absolute;inset:26px;border:2px solid rgba(245,239,223,.32)}}
.mast{{top:66px;font-size:26px;color:{CREAM}}}
.mrule{{position:absolute;top:118px;left:481px;width:118px;height:5px;background:{GOLD}}}
.main{{position:absolute;top:168px;left:92px;right:92px}}
.hl{{font-size:54px;font-weight:700;line-height:1.26;color:{CREAM}}}
.sub{{margin-top:22px;font-size:27px;font-style:italic;color:{GOLD};line-height:1.4}}
.big{{margin-top:52px;font-size:176px;font-weight:800;line-height:1;color:{GOLD};letter-spacing:-2px}}
.body{{margin-top:56px}}
.body p{{font-size:33px;line-height:1.64;margin-bottom:26px}}
.body b,.items b{{color:{GOLD};font-weight:700}}
.items{{margin-top:44px}}
.it{{display:flex;align-items:flex-start;margin-bottom:28px}}
.sq{{flex:0 0 18px;height:18px;background:{GOLD};margin:13px 22px 0 0}}
.it p{{font-size:28px;line-height:1.48}}
.box{{margin-top:84px;border:2px solid rgba(245,239,223,.38);padding:30px 32px 32px}}
.fbox{{margin-top:28px;background:{GOLD};padding:30px 32px 32px}}
.lab{{font-size:21px;font-weight:700;letter-spacing:5px;margin-bottom:12px}}
.box .lab{{color:rgba(245,239,223,.62)}} .fbox .lab{{color:#3d5a4f}}
.box .t{{font-size:30px;font-style:italic;line-height:1.5}}
.fbox .t{{font-size:30px;font-weight:700;line-height:1.5;color:{GREEN}}}
.kick{{position:absolute;left:92px;right:92px;bottom:150px;font-size:25px;line-height:1.56}}
.pub{{position:absolute;left:92px;bottom:62px;font-size:19px;line-height:1.7;color:rgba(245,239,223,.62)}}
.hs{{position:absolute;right:98px;bottom:72px}}
"""

LIGHT = BASE + f"""
body{{background:{PAPER};color:{GREEN}}}
.frame{{position:absolute;inset:40px;border:3px solid {GREEN}}}
.mast{{top:96px;font-size:24px;color:{GREEN}}}
.mrule{{position:absolute;top:150px;left:504px;width:72px;height:4px;background:{GOLD}}}
.q{{position:absolute;top:236px;left:74px;font-size:124px;font-weight:800;color:{GOLD};line-height:1}}
.quote{{position:absolute;top:300px;left:96px;right:92px;font-size:62px;font-weight:700;line-height:1.37}}
.lb{{position:absolute;left:96px;right:150px;bottom:298px;font-size:27px;line-height:1.67;color:#3E5A52}}
.hs{{position:absolute;right:106px;bottom:296px}}
.lrule{{position:absolute;left:96px;right:96px;bottom:168px;height:2px;background:{GREEN}}}
.pub{{position:absolute;left:96px;bottom:72px;font-size:21px;line-height:1.7;color:#3E5A52}}
"""

PHOTO = BASE + f"""
body{{background:{GREEN};color:{CREAM}}}
.ph{{position:absolute;top:0;left:0;width:1080px;height:760px;background-size:cover;background-position:center}}
.scr{{position:absolute;top:480px;left:0;width:1080px;height:282px;background:linear-gradient(to bottom,rgba(21,58,50,0),rgba(21,58,50,.9) 72%,{GREEN})}}
.mast{{top:56px;font-size:26px;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.55)}}
.main{{position:absolute;left:72px;right:72px;top:688px}}
.eb{{font-size:26px;font-style:italic;color:{GOLD}}}
.er{{width:56px;height:5px;background:{GOLD};margin:16px 0 26px}}
.hl{{font-size:60px;font-weight:800;line-height:1.16}}
.pb{{margin-top:26px;font-size:28px;line-height:1.6;color:rgba(245,239,223,.94)}}
.frule{{position:absolute;left:72px;right:72px;bottom:144px;height:1px;background:rgba(245,239,223,.2)}}
.pub{{position:absolute;left:72px;bottom:46px;font-size:22px;line-height:1.64;color:rgba(245,239,223,.74)}}
.hs{{position:absolute;right:80px;bottom:60px}}
"""

PUB = "<div class='pub'>Published by CMG Heating &amp; Plumbing, Bolton<br>Gas Safe 917962</div>"
MAST = "<div class='mast'>BOLTON WARM &amp; DRY</div>"


def _page(css, body):
    return (f"<!DOCTYPE html><html><head><meta charset='utf-8'><style>{_fontface()}{css}</style></head>"
            f"<body>{body}</body></html>")


def _dark(main, kicker):
    return _page(DARK, f"<div class='frame'></div>{MAST}<div class='mrule'></div><div class='main'>{main}</div>"
                       f"<div class='kick'>{kicker}</div>{PUB}<div class='hs'>{house()}</div>")


def bignum(headline, sub, number, paras, kicker):
    """Big number: headline word, italic gold line, huge gold figure, 1-2 short paragraphs, kicker line."""
    ps = ''.join(f'<p>{p}</p>' for p in paras)
    return _dark(f"<div class='hl'>{headline}</div><div class='sub'>{sub}</div><div class='big'>{number}</div>"
                 f"<div class='body'>{ps}</div>", kicker)


def list_card(headline, sub, items, kicker):
    """List: two-line headline, italic gold line, square-bulleted items as (bold lead, rest), kicker line."""
    its = ''.join(f"<div class='it'><div class='sq'></div><p><b>{a}</b> {b}</p></div>" for a, b in items)
    return _dark(f"<div class='hl'>{headline}</div><div class='sub'>{sub}</div><div class='items'>{its}</div>", kicker)


def myth(sub, myth_text, fact_text, kicker, headline='Myth<br>Or Fact?'):
    """Myth or fact: outlined myth box, solid gold fact box."""
    return _dark(f"<div class='hl'>{headline}</div><div class='sub'>{sub}</div>"
                 f"<div class='box'><div class='lab'>THE MYTH</div><div class='t'>{myth_text}</div></div>"
                 f"<div class='fbox'><div class='lab'>THE FACT</div><div class='t'>{fact_text}</div></div>", kicker)


def light(quote, body):
    """The light one: paper background, big gold quote mark, one bold line, a short plain paragraph."""
    return _page(LIGHT, f"<div class='frame'></div>{MAST}<div class='mrule'></div><div class='q'>&ldquo;</div>"
                        f"<div class='quote'>{quote}</div><div class='lb'>{body}</div>"
                        f"<div class='hs'>{house(GREEN, GOLD, 52)}</div><div class='lrule'></div>{PUB}")


def photo(photo_path, eyebrow, headline, body):
    """Photo-led: real job photo top, fading into green. photo_path is a path to an image file."""
    url = 'file://' + os.path.abspath(photo_path)
    return _page(PHOTO, f"<div class='ph' style=\"background-image:url('{url}')\"></div><div class='scr'></div>{MAST}"
                        f"<div class='main'><div class='eb'>{eyebrow}</div><div class='er'></div>"
                        f"<div class='hl'>{headline}</div><div class='pb'>{body}</div></div>"
                        f"<div class='frule'></div>{PUB}<div class='hs'>{house(w=40)}</div>")


def render(G, outdir='out', workdir='.'):
    """G = {name: html}. Writes name.jpg into outdir. Returns {name: {content, limit, ok}}."""
    from playwright.sync_api import sync_playwright
    from PIL import Image
    os.makedirs(outdir, exist_ok=True); os.makedirs(workdir, exist_ok=True)
    res = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for n, h in G.items():
            path = os.path.abspath(os.path.join(workdir, f'{n}.html'))
            open(path, 'w').write(h)
            pg = b.new_page(viewport={'width': 1080, 'height': 1350})
            pg.goto('file://' + path); pg.wait_for_timeout(500)
            r = pg.evaluate("""() => {
              const fontsOk = document.fonts.check('700 40px Lit');
              const lim = (document.querySelector('.kick')||document.querySelector('.lb')||document.querySelector('.frule')).getBoundingClientRect().top;
              let m = 0; for (const el of document.querySelectorAll('.main > *, .main .it, .quote')) {const r=el.getBoundingClientRect(); if (r.bottom>m) m=r.bottom;}
              let wide = 0; for (const el of document.querySelectorAll('body *')) {if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow!=='visible') wide++;}
              return {content: Math.round(m), limit: Math.round(lim), fonts: fontsOk, wide};}""")
            r['ok'] = r['content'] <= r['limit'] - 30 and r['fonts']
            png = os.path.join(workdir, f'{n}.png'); pg.screenshot(path=png)
            Image.open(png).convert('RGB').save(os.path.join(outdir, f'{n}.jpg'), quality=92, subsampling=0)
            res[n] = r; pg.close()
        b.close()
    return res
