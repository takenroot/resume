import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync } from 'fs';

const url = 'http://localhost:8765/index.html';
const outPath = '/home/saltedfish/project/cv/example/左秉鸿-test.pdf';

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Set viewport to desktop size
  await page.setViewport({ width: 1280, height: 900 });
  
  console.log('Loading page...');
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Wait for resume to render
  await page.waitForSelector('.resume-document[data-js-ready="true"]', { timeout: 15000 });
  
  // Extra wait for pagination
  await new Promise(r => setTimeout(r, 2000));
  
  // Count pages
  const pageCount = await page.$$eval('.resume-page', els => els.length);
  console.log(`Pages visible in browser: ${pageCount}`);
  
  // Get page content stats
  const pageStats = await page.$$eval('.resume-page', els => els.map(el => {
    const banner = el.querySelector('.resume-page-banner span');
    return {
      height: el.scrollHeight,
      banner: banner ? banner.textContent : 'N/A',
      childCount: el.querySelector('.resume-page-content')?.children.length || 0
    };
  }));
  console.log('Page stats:', JSON.stringify(pageStats, null, 2));
  
  // Export PDF
  console.log('Exporting PDF...');
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' }
  });
  
  console.log(`PDF saved to ${outPath}`);
  
  // Check if resume-document has break-after styles
  const breakStyles = await page.$$eval('.resume-page', els => els.map(el => ({
    breakAfter: getComputedStyle(el).breakAfter,
    classNames: el.className
  })));
  console.log('Break styles:', JSON.stringify(breakStyles, null, 2));
  
  await browser.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
