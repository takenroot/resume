"""Test pagebreak: { before: '.resume-page' } - the original working approach"""
from playwright.sync_api import sync_playwright
import time, os

URL = 'http://localhost:8765/index.html'
OUT = '/home/saltedfish/project/cv/example/左秉鸿-test-before.pdf'

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        context = browser.contexts[0]

        dl = [None]
        def on_download(download): dl[0] = download
        context.on('download', on_download)

        page.goto(URL, wait_until='domcontentloaded', timeout=60000)
        page.wait_for_selector('.resume-document[data-js-ready="true"]', timeout=15000)
        time.sleep(2)

        page_count = page.evaluate("document.querySelectorAll('.resume-page').length")
        print(f'Pages visible: {page_count}')

        # Track console output
        logs = []
        page.on('console', lambda msg: logs.append(f'{msg.type}: {msg.text}'))

        print('Calling html2pdf with pagebreak: { before: ".resume-page" }...')
        page.evaluate("""
            () => {
                var el = document.getElementById('resumeDocument');
                window.__pdfBlob = null;
                window.__pdfError = null;
                html2pdf().set({
                    margin: 8,
                    filename: 'test-before.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { before: '.resume-page' }
                }).from(el).save().then(function(r) {
                    window.__pdfBlob = r;
                }).catch(function(e) {
                    window.__pdfError = e.message || String(e);
                });
            }
        """)

        done = False
        for i in range(60):
            time.sleep(0.5)
            err = page.evaluate("window.__pdfError")
            if err:
                print(f'Error: {err}')
                done = True
                break
            blob = page.evaluate("window.__pdfBlob")
            if blob:
                data = page.evaluate("async () => Array.from(new Uint8Array(await window.__pdfBlob.arrayBuffer()))")
                with open(OUT, 'wb') as f:
                    f.write(bytes(data))
                print(f'OK: {os.path.getsize(OUT)} bytes -> {OUT}')
                done = True
                break
            if i % 10 == 9:
                print(f'waiting... {i+1}/60')

        if not done and dl[0]:
            dl[0].save_as(OUT)
            print(f'Downloaded: {os.path.getsize(OUT)} bytes')

        if not done:
            print('FAILED')
            print('Console:', [l for l in logs if 'error' in l.lower()])

        browser.close()

if __name__ == '__main__':
    main()