"""
Test both PDF export approaches:
1. Screenshot version (page.pdf) - works
2. Searchable version (exportPdfSearchable) - needs debugging
"""
from playwright.sync_api import sync_playwright
import time, os, json

URL = 'http://localhost:8765/index.html'
OUT_SCREENSHOT = '/home/saltedfish/project/cv/example/左秉鸿-screenshot-test.pdf'
OUT_SEARCHABLE = '/home/saltedfish/project/cv/example/左秉鸿-searchable-test.pdf'

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1280, 'height': 900})

        # Set download path
        context = browser.contexts[0]
        downloadPromise = [None]
        def on_download(download):
            downloadPromise[0] = download
        context.on('download', on_download)

        print('Loading page...')
        page.goto(URL, wait_until='domcontentloaded', timeout=60000)
        page.wait_for_selector('.resume-document[data-js-ready="true"]', timeout=15000)
        time.sleep(3)

        page_count = page.evaluate("document.querySelectorAll('.resume-page').length")
        print(f'Pages visible: {page_count}')

        stats = page.evaluate("""
            () => Array.from(document.querySelectorAll('.resume-page')).map((el, i) => {
                const c = el.querySelector('.resume-page-content');
                return {
                    i,
                    offsetH: el.offsetHeight,
                    contentScrollH: c ? c.scrollHeight : 0,
                    contentClientH: c ? c.clientHeight : 0,
                    banner: el.querySelector('.resume-page-banner span')?.textContent || 'N/A'
                };
            })
        """)
        print('Page stats:', json.dumps(stats, indent=2))

        # --- Test 1: Screenshot ---
        print('\n=== Test 1: Screenshot (page.pdf) ===')
        page.evaluate("document.getElementById('resumePages').style.gap = '0'")
        page.pdf(path=OUT_SCREENSHOT, format='A4',
                margin={'top': '8mm', 'bottom': '8mm', 'left': '8mm', 'right': '8mm'},
                print_background=True)
        sz1 = os.path.getsize(OUT_SCREENSHOT)
        print(f'Screenshot PDF: {sz1} bytes -> {OUT_SCREENSHOT}')

        # --- Test 2: Searchable ---
        print('\n=== Test 2: Searchable (exportPdfSearchable) ===')

        # Track console output
        console_logs = []
        page.on('console', lambda msg: console_logs.append(f'{msg.type}: {msg.text}'))

        print('Calling exportPdfSearchable()...')
        page.evaluate('exportPdfSearchable()')

        done = False
        for i in range(40):
            time.sleep(0.5)
            err = page.evaluate("window.__pdfError")
            if err:
                print(f'JS error: {err}')
                done = True
                break
            blob = page.evaluate("window.__pdfBlob")
            if blob:
                print(f'Blob captured: size={blob.get("size")}')
                data = page.evaluate("async () => Array.from(new Uint8Array(await window.__pdfBlob.arrayBuffer()))")
                with open(OUT_SEARCHABLE, 'wb') as f:
                    f.write(bytes(data))
                sz2 = os.path.getsize(OUT_SEARCHABLE)
                print(f'PDF saved: {sz2} bytes -> {OUT_SEARCHABLE}')
                done = True
                break
            # Check if download was triggered
            if downloadPromise[0]:
                dp = downloadPromise[0]
                dp.save_as(OUT_SEARCHABLE)
                sz2 = os.path.getsize(OUT_SEARCHABLE)
                print(f'Downloaded as: {sz2} bytes -> {OUT_SEARCHABLE}')
                done = True
                break
            if i % 5 == 4:
                print(f'  still waiting... {i+1}/40')

        if not done:
            print('No PDF blob or download after 20s')
            state = page.evaluate("() => ({ html2pdfDefined: typeof html2pdf !== 'undefined', pdfError: window.__pdfError })")
            print('State:', state)
            print('Console logs:', [l for l in console_logs if not l.startswith('log')])

        browser.close()
        if not done:
            exit(1)

if __name__ == '__main__':
    main()