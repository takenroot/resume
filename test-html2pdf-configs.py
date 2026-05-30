"""Test different html2pdf configurations to find what works"""
from playwright.sync_api import sync_playwright
import time, os, json

URL = 'http://localhost:8765/index.html'
OUT = '/home/saltedfish/project/cv/example/左秉鸿-test-{name}.pdf'

def test_case(name, pagebreak_mode, extra_opts=''):
    out = OUT.format(name=name)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['----no-sandbox'])
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        context = browser.contexts[0]

        dl = [None]
        def on_download(download): dl[0] = download
        context.on('download', on_download)

        page.goto(URL, wait_until='domcontentloaded', timeout=60000)
        page.wait_for_selector('.resume-document[data-js-ready="true"]', timeout=15000)
        time.sleep(2)

        page.evaluate("document.querySelectorAll('.resume-page').forEach((p,i) => { if(i < document.querySelectorAll('.resume-page').length - 1) p.classList.add('html2pdf__page-break'); })")

        console_logs = []
        page.on('console', lambda msg: console_logs.append(msg.type + ': ' + msg.text))

        page.evaluate(f"""
            () => {{
                var el = document.getElementById('resumeDocument');
                var name = 'test-{name}.pdf';
                window.__pdfBlob = null;
                window.__pdfError = null;
                html2pdf().set({{
                    margin: 8,
                    filename: name,
                    image: {{ type: 'jpeg', quality: 0.98 }},
                    html2canvas: {{ scale: 2, useCORS: true, letterRendering: true }},
                    jsPDF: {{ unit: 'mm', format: 'a4', orientation: 'portrait' }},
                    pagebreak: {{ mode: '{pagebreak_mode}' {extra_opts} }}
                }}).from(el).save().then(function(r) {{ window.__pdfBlob = r; }}).catch(function(e) {{ window.__pdfError = e.message || String(e); console.error('html2pdf error:', e); }});
            }}
        """)

        done = False
        for i in range(60):
            time.sleep(0.5)
            err = page.evaluate("window.__pdfError")
            if err:
                print(f'  [{name}] Error: {err}')
                done = True
                break
            blob = page.evaluate("window.__pdfBlob")
            if blob:
                data = page.evaluate("async () => Array.from(new Uint8Array(await window.__pdfBlob.arrayBuffer()))")
                with open(out, 'wb') as f:
                    f.write(bytes(data))
                sz = os.path.getsize(out)
                print(f'  [{name}] OK: {sz} bytes -> {out}')
                done = True
                break
            if i % 10 == 9:
                print(f'  [{name}] waiting... {i+1}/60')

        if not done and dl[0]:
            dl[0].save_as(out)
            print(f'  [{name}] Downloaded: {os.path.getsize(out)} bytes')

        if not done and not dl[0]:
            print(f'  [{name}] FAILED after 30s')
            errs = [l for l in console_logs if 'error' in l.lower()]
            if errs:
                print(f'    Errors: {errs[:3]}')

        browser.close()
        return done

def main():
    print('Testing html2pdf pagebreak modes...\n')
    test_case('css-mode', 'css')
    test_case('legacy-mode', 'legacy')
    test_case('css2-mode', 'css2')
    test_case('avoid-all-mode', 'avoid-all')
    test_case('css-no-class', 'css')

if __name__ == '__main__':
    main()