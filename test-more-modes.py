"""Test avoid-all mode + before combo"""
from playwright.sync_api import sync_playwright
import time, os

URL = 'http://localhost:8765/index.html'

def test(name, pagebreak_conf):
    out = f'/home/saltedfish/project/cv/example/左秉鸿-test-{name}.pdf'
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
        print(f'[{name}] browser pages: {page_count}')

        # Add page-break class to non-last pages
        page.evaluate("""
            () => {
                var pages = document.querySelectorAll('.resume-page');
                for (var i = 0; i < pages.length - 1; i++) {
                    pages[i].classList.add('html2pdf__page-break');
                }
            }
        """)

        page.evaluate(f"""
            () => {{
                var el = document.getElementById('resumeDocument');
                window.__pdfBlob = null;
                window.__pdfError = null;
                html2pdf().set({{
                    margin: 8,
                    filename: 'test.pdf',
                    image: {{ type: 'jpeg', quality: 0.98 }},
                    html2canvas: {{ scale: 2, useCORS: true, letterRendering: true, windowWidth: 1280 }},
                    jsPDF: {{ unit: 'mm', format: 'a4', orientation: 'portrait' }},
                    pagebreak: {pagebreak_conf}
                }}).from(el).save().then(function(r) {{ window.__pdfBlob = r; }}).catch(function(e) {{ window.__pdfError = e.message; }});
            }}
        """)

        for i in range(60):
            time.sleep(0.5)
            err = page.evaluate("window.__pdfError")
            if err:
                print(f'[{name}] Error: {err}')
                break
            blob = page.evaluate("window.__pdfBlob")
            if blob:
                data = page.evaluate("async () => Array.from(new Uint8Array(await window.__pdfBlob.arrayBuffer()))")
                with open(out, 'wb') as f:
                    f.write(bytes(data))
                sz = os.path.getsize(out)
                print(f'[{name}] OK: {sz} bytes, {out}')
                break
            if i % 20 == 19:
                print(f'[{name}] waiting... {i+1}/60')
        else:
            if dl[0]:
                dl[0].save_as(out)
                print(f'[{name}] Downloaded: {os.path.getsize(out)} bytes')

        browser.close()

def main():
    tests = [
        ('avoid-all', "{ mode: 'avoid-all' }"),
        ('avoid-select', "{ before: '.resume-page', mode: 'avoid-all' }"),
        ('css-avoid', "{ before: '.resume-page', avoid: '.resume-page', mode: 'css' }"),
        ('raw-css', "{ mode: 'raw-css' }"),
        ('legacy-before', "{ mode: 'legacy', before: '.resume-page' }"),
        ('no-mode-before', "{ before: '.resume-page' }"),
    ]
    for name, conf in tests:
        test(name, conf)
        time.sleep(0.5)

if __name__ == '__main__':
    main()