"""Inspect the cloned DOM inside html2pdf's onclone callback"""
from playwright.sync_api import sync_playwright
import time, json

URL = 'http://localhost:8765/index.html'

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1280, 'height': 900})

        page.goto(URL, wait_until='domcontentloaded', timeout=60000)
        page.wait_for_selector('.resume-document[data-js-ready="true"]', timeout=15000)
        time.sleep(3)

        page_count = page.evaluate("document.querySelectorAll('.resume-page').length")
        print(f'Browser pages: {page_count}')

        # Inject onclone inspection - we patch the html2canvas global config
        clone_info = [None]
        error_info = [None]

        page.evaluate("""
            () => {
                window.__cloneInfo = null;
                window.__cloneError = null;

                var _html2canvas = window.html2canvas;
                if (!_html2canvas) {
                    // Try to get it from html2pdf
                    try {
                        var opt = html2pdf().set({
                            html2canvas: {
                                scale: 2,
                                useCORS: true,
                                letterRendering: true,
                                onclone: function(clone) {
                                    var rp = clone.querySelector('#resumePages');
                                    var rs = clone.querySelector('#resumeSource');
                                    var rd = clone.querySelector('#resumeDocument');
                                    var pages = rp ? rp.querySelectorAll('.resume-page') : [];
                                    window.__cloneInfo = {
                                        rpDisplay: rp ? getComputedStyle(rp).display : 'n/a',
                                        rsDisplay: rs ? getComputedStyle(rs).display : 'n/a',
                                        rpChildCount: rp ? rp.childElementCount : 0,
                                        pageCount: pages.length,
                                        rpOffsetH: rp ? rp.offsetHeight : 0,
                                        rpScrollH: rp ? rp.scrollHeight : 0,
                                        rdOffsetH: rd ? rd.offsetHeight : 0,
                                        rdScrollH: rd ? rd.scrollHeight : 0,
                                        cloneChildCount: clone.childElementCount
                                    };
                                }
                            }
                        });
                    } catch(e) {
                        window.__cloneError = e.message;
                    }
                }
            }
        """)

        # Now test the export with onclone callback
        result = page.evaluate("""
            () => {
                return new Promise((resolve) => {
                    var el = document.getElementById('resumeDocument');
                    window.__cloneInfo = null;

                    html2pdf().set({
                        margin: 8,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: {
                            scale: 2,
                            useCORS: true,
                            letterRendering: true,
                            onclone: function(clone) {
                                var rp = clone.querySelector('#resumePages');
                                var rs = clone.querySelector('#resumeSource');
                                var pages = rp ? rp.querySelectorAll('.resume-page') : [];
                                window.__cloneInfo = {
                                    rpDisplay: rp ? getComputedStyle(rp).display : 'n/a',
                                    rsDisplay: rs ? getComputedStyle(rs).display : 'n/a',
                                    rpChildCount: rp ? rp.childElementCount : 0,
                                    pageCount: pages.length,
                                    rpOffsetH: rp ? rp.offsetHeight : 0,
                                    rpScrollH: rp ? rp.scrollHeight : 0,
                                    cloneOffsetH: clone.offsetHeight,
                                    cloneScrollH: clone.scrollHeight,
                                    rpGap: rp ? getComputedStyle(rp).gap : 'n/a',
                                    rpGridGap: rp ? getComputedStyle(rp).gridGap : 'n/a'
                                };
                            }
                        },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                        pagebreak: { mode: 'css' }
                    }).from(el).save().then(function() {
                        resolve({ok: true, info: window.__cloneInfo});
                    }).catch(function(e) {
                        resolve({ok: false, error: e.message});
                    });
                });
            }
        """)
        print('Result:', json.dumps(result, indent=2))

        browser.close()

if __name__ == '__main__':
    main()