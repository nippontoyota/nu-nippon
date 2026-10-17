import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.getByText('The Nippon Promise').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
const cards = page.locator('section').filter({ hasText: 'The Nippon Promise' }).locator('article');
const count = await cards.count();
for (let i = 0; i < count; i++) {
  await cards.nth(i).screenshot({ path: `promise-card-${i + 1}.png` });
}
await browser.close();
console.log(`saved ${count} card screenshots`);
