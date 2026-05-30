import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const url = 'http://localhost:8765/index.html';
const outPath = '/home/saltedfish/project/cv/example/左秉鸿-searchable-test.pdf';

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setViewport({ width: 1280, height: 900 });

  console.log('Loading page...');
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  await page.waitForSelector('.resume-document[data-js-ready="true"]', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  const pageCount = await page.$$eval('.resume-page', els => els.length);
  console.log(`Pages visible: ${pageCount}`);

  const pageStats = await page.$$eval('.resume-page', els => els.map(el => ({
    height: el.scrollHeight,
    clientHeight: el.clientHeight,
    contentScrollH: el.querySelector('.resume-page-content')?.scrollHeight || 0,
    contentClientH: el.querySelector('.resume-page-content')?.clientHeight || 0,
    banner: el.querySelector('.resume-page-banner span')?.textContent || 'N/A',
    children: el.querySelector('.resume-page-content')?.children.length || 0
  })));
  console.log('Page stats:', JSON.stringify(pageStats, null, 2));

  // Capture all console output from the page
  const logs = [];
  page.on('console', msg => logs.push(msg.type() + ': ' + msg.text()));

  console.log('Calling exportPdfSearchable()...');

  // Intercept the download and capture the PDF binary
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: '/tmp'
  });

  // Set up a response interceptor for the PDF save
  let pdfSaved = false;
  let pdfBuffer = null;

  // Override Blob to capture the save data
  await page.evaluateOnNewDocument(() => {
    const originalSave = HTMLAnchorElement.prototype.click;
    window.__pdfBlobs = [];
    window.__interceptedBlob = null;

    // Listen for Blob URL creation
    const oldCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function(blob) {
      const result = oldCreateObjectURL(blob);
      if (blob.type === 'application/pdf') {
        window.__interceptedBlob = blob;
      }
      return result;
    };
  });

  // Call the export function
  await page.evaluate('exportPdfSearchable()');

  // Wait for the PDF to be generated (give it up to 15 seconds)
  await new Promise(r => setTimeout(r, 15000));

  // Try to capture the blob
  const blobInfo = await page.evaluate(() => {
    if (window.__interceptedBlob) {
      return {
        size: window.__interceptedBlob.size,
        type: window.__interceptedBlob.type
      };
    }
    return null;
  });

  if (blobInfo) {
    console.log('Intercepted blob:', blobInfo);
    // Read blob as array buffer
    const arrayBuffer = await page.evaluate(async (blob) => {
      return await blob.arrayBuffer();
    }, await page.evaluate(() => window.__interceptedBlob));

    const buffer = Buffer.from(arrayBuffer);
    writeFileSync(outPath, buffer);
    console.log(`PDF saved: ${buffer.length} bytes to ${outPath}`);
    pdfSaved = true;
  } else {
    // Fallback: check if file was downloaded to /tmp
    console.log('Checking /tmp for downloaded PDF...');
    try {
      const files = await page.evaluate(() => {
        // Try to find PDF files
        return window.__pdfBlobs;
      });
      console.log('Captured blobs:', files);
    } catch (e) {
      console.log('Could not capture blob:', e.message);
    }

    // Check page logs
    console.log('\nPage console logs:');
    logs.forEach(l => console.log(' ', l));

    // Check if PDF was saved via download
    const downloadCheck = await page.evaluate(() => {
      // Try to read the last downloaded file via FileReader API
      const links = document.querySelectorAll('a[download]');
      return Array.from(links).map(a => ({ href: a.href, download: a.download }));
    });
    console.log('Download links found:', downloadCheck);
  }

  // Print any console logs
  if (logs.length) {
    console.log('\nConsole output:', logs);
  }

  await browser.close();

  if (!pdfSaved) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});