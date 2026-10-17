import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.getByText('The Nippon Promise').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
const section = page.locator('section').filter({ hasText: 'The Nippon Promise' });
await section.screenshot({ path: 'promise-check.png' });
await browser.close();
console.log('saved promise-check.png');
