"""Test exportPdf directly as called from browser"""
from playwright.sync_api import sync_playwright
import time, os

URL = 'http://localhost:8765/index.html'
OUT = '/home/saltedfish/project/cv/example/左秉鸿-test-exportPdf.pdf'

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

        # Directly call exportPdf() as the browser would
        print('Calling exportPdf() directly...')
        page.evaluate("window.exportPdf()")

        for i in range(60):
            time.sleep(0.5)
            dl_path = dl[0]
            if dl_path:
                path = dl_path.path
                if path and os.path.exists(path):
                    sz = os.path.getsize(path)
                    print(f'Downloaded: {sz} bytes -> {path}')
                    break
            if i % 10 == 9:
                print(f'waiting... {i+1}/60')
        else:
            print('Timed out - no download')

        # Check if file was saved to download folder
        import glob
        files = glob.glob('/tmp/*.pdf')
        print(f'PDF files in /tmp: {files}')

        browser.close()

if __name__ == '__main__':
    main()