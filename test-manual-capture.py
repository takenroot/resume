"""Simple approach: use exportPdf screenshot approach but per-page"""
from playwright.sync_api import sync_playwright
import time, os

URL = 'http://localhost:8765/index.html'
OUT = '/home/saltedfish/project/cv/example/左秉鸿-test-manual.pdf'

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
        time.sleep(3)

        page_count = page.evaluate("document.querySelectorAll('.resume-page').length")
        print(f'Browser pages: {page_count}')

        page.evaluate("""
            () => {
                var rp = document.getElementById('resumePages');
                var pages = rp.querySelectorAll('.resume-page');
                rp.style.gap = '0';

                var A4_W_MM = 210, A4_H_MM = 297, MARGIN = 8;
                var AVAIL_W = A4_W_MM - MARGIN * 2;  // 194mm
                var AVAIL_H = A4_H_MM - MARGIN * 2;   // 281mm

                window.__error = null;
                window.__done = false;

                html2canvas(rp, { scale: 2, useCORS: true, letterRendering: true }).then(function(canvas) {
                    var srcH = canvas.height / pages.length;
                    var srcW = canvas.width;

                    var scaleW = AVAIL_W / srcW;
                    var scaleH = AVAIL_H / srcH;
                    var scale = Math.min(scaleW, scaleH);
                    var imgW = srcW * scale;
                    var imgH = srcH * scale;
                    var imgX = MARGIN + (AVAIL_W - imgW) / 2;
                    var imgY = MARGIN;

                    var doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

                    for (var i = 0; i < pages.length; i++) {
                        if (i > 0) doc.addPage();
                        var sectionCanvas = document.createElement('canvas');
                        sectionCanvas.width = srcW;
                        sectionCanvas.height = srcH;
                        var ctx = sectionCanvas.getContext('2d');
                        ctx.drawImage(canvas, 0, srcH * i, srcW, srcH, 0, 0, srcW, srcH);
                        var imgData = sectionCanvas.toDataURL('image/jpeg', 0.98);
                        doc.addImage(imgData, 'JPEG', imgX, imgY, imgW, imgH);
                    }

                    doc.save('manual-test.pdf');
                    window.__done = true;
                    rp.style.gap = '';
                }).catch(function(e) {
                    window.__error = e.message;
                    console.error('Error:', e);
                    rp.style.gap = '';
                });
            }
        """)

        for i in range(60):
            time.sleep(0.5)
            done = page.evaluate("window.__done")
            err = page.evaluate("window.__error")
            if err:
                print(f'Error: {err}')
                break
            if done:
                print(f'Done after {(i+1)*0.5}s')
                break
            if i % 10 == 9:
                print(f'waiting... {i+1}/60')
        else:
            print('Timed out')

        if dl[0]:
            dl[0].save_as(OUT)
            print(f'Downloaded: {os.path.getsize(OUT)} bytes -> {OUT}')

        browser.close()

if __name__ == '__main__':
    main()