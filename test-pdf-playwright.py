import asyncio
from playwright.async_api import async_playwright

async def main():
    url = 'http://localhost:8765/index.html'
    out = '/home/saltedfish/project/cv/example/左秉鸿-pdfmake-v2.pdf'

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = await browser.new_page(viewport={'width': 1280, 'height': 900})
        await page.goto(url, wait_until='networkidle', timeout=30000)
        await page.wait_for_selector('.resume-document[data-js-ready="true"]', timeout=15000)
        await asyncio.sleep(5)

        pdf = await page.evaluate('''() => {
            return new Promise(function(resolve) {
                try {
                    var doc = buildPdfDef(cvData);
                    pdfMake.createPdf(doc).getBase64(function(b64) {
                        resolve(b64);
                    });
                } catch(e) {
                    resolve(null);
                }
            });
        }''')
        
        if not pdf:
            print('FAILED')
            await browser.close()
            return
        
        import base64
        with open(out, 'wb') as f:
            f.write(base64.b64decode(pdf))
        
        import os
        sz = os.path.getsize(out)
        print(f'PDF saved: {sz} bytes')
        
        from pypdf import PdfReader
        r = PdfReader(out)
        print(f'Pages: {len(r.pages)}')
        for i, p in enumerate(r.pages):
            text = p.extract_text()
            print(f'P{i+1}: {len(text or "")} chars')
            print(f'  {text[:500]}')
            print(f'  ...')
            print(f'  {text[-200:]}')
        
        await browser.close()

asyncio.run(main())
