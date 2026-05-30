"""Test: viewport width affects html2pdf capture width"""
from playwright.sync_api import sync_playwright
import time, json

URL = 'http://localhost:8765/index.html'

def main():
    # Test with different viewports
    for vw in [1280, 800, 600, 400]:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
            page = browser.new_page(viewport={'width': vw, 'height': 900})
            context = browser.contexts[0]
            dl = [None]
            def on_download(download): dl[0] = download
            context.on('download', on_download)

            page.goto(URL, wait_until='domcontentloaded', timeout=60000)
            page.wait_for_selector('.resume-document[data-js-ready="true"]', timeout=15000)
            time.sleep(2)

            # Check browser pages and dimensions
            info = page.evaluate("""
                () => {
                    var rp = document.getElementById('resumePages');
                    var pages = rp.querySelectorAll('.resume-page');
                    var rpGap = getComputedStyle(rp).gap;
                    return {
                        viewportW: window.innerWidth,
                        pageCount: pages.length,
                        rpOffsetH: rp.offsetHeight,
                        rpOffsetW: rp.offsetWidth,
                        pageH: pages.length > 0 ? pages[0].offsetHeight : 0,
                        pageW: pages.length > 0 ? pages[0].offsetWidth : 0,
                        gap: rpGap
                    };
                }
            """)
            print(f'\nviewport={vw}:', json.dumps(info))

            # Set gap=0 and run html2pdf with onclone inspection
            info2 = page.evaluate("""
                () => {
                    return new Promise((resolve) => {
                        var rp = document.getElementById('resumePages');
                        rp.style.gap = '0';
                        var el = document.getElementById('resumeDocument');
                        html2pdf().set({
                            margin: 8,
                            html2canvas: {
                                scale: 2,
                                useCORS: true,
                                onclone: function(clone) {
                                    var crp = clone.querySelector('#resumePages');
                                    window.__info = {
                                        crpOffsetW: crp.offsetWidth,
                                        crpOffsetH: crp.offsetHeight,
                                        crpGap: getComputedStyle(crp).gap,
                                        canvasMsg: 'see console'
                                    };
                                }
                            },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                            pagebreak: { mode: 'css' }
                        }).from(el).save().then(function() {
                            resolve(window.__info);
                        }).catch(function(e) {
                            resolve({error: e.message});
                        });
                    });
                }
            """)
            print(f'  clone info: {json.dumps(info2)}')

            # Download with css mode
            page.evaluate("""
                () => {
                    var rp = document.getElementById('resumePages');
                    rp.style.gap = '0';
                }
            """)
            dl[0] = None
            page.evaluate("""
                () => {
                    var el = document.getElementById('resumeDocument');
                    window.__pdfBlob = null;
                    html2pdf().set({
                        margin: 8,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                        pagebreak: { mode: 'css' }
                    }).from(el).save().then(function(r) { window.__pdfBlob = r; });
                }
            """)
            for i in range(60):
                time.sleep(0.5)
                blob = page.evaluate("window.__pdfBlob")
                if blob:
                    data = page.evaluate("async () => Array.from(new Uint8Array(await window.__pdfBlob.arrayBuffer()))")
                    import os
                    out = f'/home/saltedfish/project/cv/example/左秉鸿-test-viewport-{vw}.pdf'
                    with open(out, 'wb') as f:
                        f.write(bytes(data))
                    print(f'  PDF: {os.path.getsize(out)} bytes')
                    break
                if i % 20 == 19:
                    print(f'  waiting... {i+1}/60')
            else:
                if dl[0]:
                    out = f'/home/saltedfish/project/cv/example/左秉鸿-test-viewport-{vw}.pdf'
                    dl[0].save_as(out)
                    import os
                    print(f'  Downloaded: {os.path.getsize(out)} bytes')

            browser.close()

if __name__ == '__main__':
    main()