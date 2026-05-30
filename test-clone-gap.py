"""Test if style.gap = '0' actually persists to clone in html2pdf"""
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

        # Test: Does setting gap=0 before calling html2pdf work?
        result = page.evaluate("""
            () => {
                return new Promise((resolve) => {
                    var rp = document.getElementById('resumePages');
                    var origGap = rp.style.gap;
                    rp.style.gap = '0';
                    console.log('gap set to:', rp.style.gap);
                    console.log('computed gap:', getComputedStyle(rp).gap);

                    var el = document.getElementById('resumeDocument');
                    html2pdf().set({
                        margin: 8,
                        html2canvas: {
                            scale: 2,
                            useCORS: true,
                            onclone: function(clone) {
                                var crp = clone.querySelector('#resumePages');
                                window.__cloneInfo = {
                                    gapInline: crp ? crp.style.gap : 'n/a',
                                    gapComputed: crp ? getComputedStyle(crp).gap : 'n/a',
                                    gapGridGap: crp ? getComputedStyle(crp).gridGap : 'n/a',
                                    crpOffsetH: crp ? crp.offsetHeight : 0
                                };
                            }
                        },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                        pagebreak: { mode: 'css' }
                    }).from(el).save().then(function() {
                        rp.style.gap = origGap;
                        resolve({ok: true, info: window.__cloneInfo});
                    }).catch(function(e) {
                        rp.style.gap = origGap;
                        resolve({ok: false, error: e.message});
                    });
                });
            }
        """)
        print('With gap=0 BEFORE html2pdf call:')
        print(json.dumps(result, indent=2))

        # Test 2: Check the ACTUAL computed height of rp after gap=0
        h_test = page.evaluate("""
            () => {
                var rp = document.getElementById('resumePages');
                var orig = rp.style.gap;
                rp.style.gap = '0';
                var h1 = rp.offsetHeight;
                var h2 = rp.scrollHeight;
                var cgap = getComputedStyle(rp).gap;
                rp.style.gap = orig;
                return { gapAfter: cgap, offsetH: h1, scrollH: h2 };
            }
        """)
        print('Height test:', h_test)

        browser.close()

if __name__ == '__main__':
    main()