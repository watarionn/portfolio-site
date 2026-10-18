"""No network needed: use Playwright set_content to exercise the vanilla game.

Run in an environment with playwright + Chromium:
    python tests/smoke.py
The actual service worker is validated as a separate static check, not by this harness.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).resolve().parents[1] / 'public'
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
STYLE = (ROOT / 'style.css').read_text(encoding='utf-8')
JS = (ROOT / 'game.js').read_text(encoding='utf-8')
PAGE = HTML.replace('<link rel="stylesheet" href="./style.css">', '<style>' + STYLE + '</style>')
PAGE = PAGE.replace('<script defer src="./game.js"></script>', '')
PAGE = PAGE.replace('</body>', '<script>' + JS.replace("if (location.hostname==='localhost' || location.hostname==='127.0.0.1')", 'if (true)') + '</script></body>')


def state(page):
    return page.evaluate('window.__obakeTest.getState()')


def meta(page):
    return page.evaluate('window.__obakeTest.getMeta()')


def click_cell(page, index):
    page.locator(f'.cell[data-index="{index}"]').click()


def assert_layout(page):
    assert page.locator('.cell').count() == 25
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'horizontal overflow'
    assert page.locator('.board').bounding_box()['width'] > 250


with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':390, 'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.evaluate("""Object.defineProperty(window, 'localStorage', {configurable:true,value:{
      data:{}, getItem(k){return this.data[k]??null}, setItem(k,v){this.data[k]=v}
    }})""")
    page.set_content(PAGE,wait_until='load')
    assert page.locator('#helpDialog[open]').count() == 1
    assert_layout(page)
    page.locator('#closeHelpBtn').click()
    assert state(page)['coins'] == 24
    click_cell(page,0);click_cell(page,1);click_cell(page,2)
    s = state(page)
    assert s['board'][0] == 0 and s['board'][1] == 0 and s['board'][2] == 2, s['board']
    assert s['score'] > 0 and s['coins'] > 24 and s['moves'] == 3
    assert 2 in meta(page)['discovered'] and 'hello' in meta(page)['badges']
    score = s['score']
    assert page.locator('#scoreValue').inner_text() == f'{score:,}'
    page.locator('#undoBtn').click()
    s = state(page)
    assert s['moves'] == 2 and s['board'][0] == 1 and s['board'][1] == 1 and s['board'][2] == 0, s
    assert s['coins'] == 18
    click_cell(page,2)
    assert state(page)['board'][2] == 2
    page.locator('#rerollBtn').click()
    assert state(page)['coins'] >= 0
    page.locator('#broomBtn').click()
    assert state(page)['broomMode'] is True
    click_cell(page,2)
    assert state(page)['board'][2] == 0 and state(page)['broomMode'] is False
    assert_layout(page)
    page.locator('#albumBtn').click()
    assert page.locator('#albumDialog[open]').count() == 1
    assert page.locator('.album-entry').count() == 9
    page.locator('#closeAlbumBtn').click()
    before = state(page)
    assert page.evaluate("JSON.parse(localStorage.getItem('obake-town-game-v1')).free.moves") == before['moves']
    page.set_content(PAGE,wait_until='load')
    after = state(page)
    assert after['board'] == before['board'] and after['coins'] == before['coins'] and after['moves'] == before['moves'], (before,after)
    page.locator('#dailyModeBtn').click()
    a=state(page)
    assert a['mode'] == 'daily' and a['moves'] == 0
    click_cell(page,0)
    next_drawn=state(page)['queue'][:]
    page.locator('#newGameBtn').click()
    page.locator('#confirmResetBtn').click()
    assert state(page)['mode'] == 'daily' and state(page)['moves']==0
    click_cell(page,0)
    assert state(page)['queue'] == next_drawn, 'daily sequence not reproducible'
    page.locator('#freeModeBtn').click()
    assert state(page)['board']==before['board'], 'free-game slot was overwritten'
    assert_layout(page)
    page.screenshot(path=str(ROOT.parent / 'obake-mobile-tested.png'),full_page=True)
    for width in [320,375,430,768,1024]:
        page.set_viewport_size({'width':width,'height':850})
        assert_layout(page)
    page.set_viewport_size({'width':1024,'height':900})
    page.screenshot(path=str(ROOT.parent / 'obake-desktop-tested.png'),full_page=True)
    # Force a two-stage merge fixture and a settled neighborhood, then test an exhausted board.
    fixture=state(page)
    fixture.update(board=[0]*25,queue=[1,1,1],coins=30,score=0,moves=0,maxLevel=2,history=None,broomMode=False)
    for index,level in {7:1,11:1,13:2,17:2}.items():fixture['board'][index]=level
    page.evaluate("x=>{const d=JSON.parse(localStorage.getItem('obake-town-game-v1'));d.free=x;localStorage.setItem('obake-town-game-v1',JSON.stringify(d))}",fixture)
    page.set_content(PAGE,wait_until='load')
    click_cell(page,12)
    assert state(page)['board'][12]==3 and state(page)['bestCombo']==2, state(page)
    assert 'chain' in meta(page)['badges'] and 3 in meta(page)['discovered']
    fixture=state(page)
    fixture['board'][6]=4
    fixture['maxLevel']=4
    page.evaluate("x=>{const d=JSON.parse(localStorage.getItem('obake-town-game-v1'));d.free=x;localStorage.setItem('obake-town-game-v1',JSON.stringify(d))}",fixture)
    page.set_content(PAGE,wait_until='load')
    assert page.locator('.resident').count()>=1, 'Residents not visible after first house'
    fixture=state(page)
    fixture.update(board=[9]*25,coins=0,history=None,queue=[1,1,1],maxLevel=9)
    fixture['board'][12]=0
    page.evaluate("x=>{const d=JSON.parse(localStorage.getItem('obake-town-game-v1'));d.free=x;localStorage.setItem('obake-town-game-v1',JSON.stringify(d))}",fixture)
    page.set_content(PAGE,wait_until='load')
    click_cell(page,12)
    assert page.locator('#endDialog[open]').count()==1, 'End of game dialog not shown'
    assert not errors, errors
    context.close();browser.close()

manifest = json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
assert manifest['display'] == 'standalone'
assert manifest['scope'] == './' and manifest['start_url'] == './'
assert all((ROOT/file).is_file() for file in ['index.html','style.css','game.js','sw.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'])
print('PASS: layout 320/375/390/430/768/1024, merge/chain, residents, game-over, score, undo, broom, reroll, encyclopedia, save/load, mode isolation, daily seed, console, manifest')
