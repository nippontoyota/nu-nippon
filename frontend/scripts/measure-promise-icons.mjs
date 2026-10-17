import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.getByText('The Nippon Promise').scrollIntoViewIfNeeded();

const data = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('section article')].slice(0, 6);
  return cards.map((card, i) => {
    const ring = card.querySelector('[class*="promiseIconRing"]');
    const icon = card.querySelector('[class*="promiseIcon_"], [class*="promiseIcon"]:not([class*="Ring"])');
    const rect = (el) => el ? el.getBoundingClientRect() : null;
    const ringRect = rect(ring);
    const iconRect = rect(icon);
    const cardRect = rect(card);
    return {
      card: i + 1,
      ring: ringRect ? { top: ringRect.top - cardRect.top, left: ringRect.left - cardRect.left, w: ringRect.width, h: ringRect.height } : null,
      icon: iconRect ? { top: iconRect.top - cardRect.top, left: iconRect.left - cardRect.left, w: iconRect.width, h: iconRect.height } : null,
      iconCenterInRing: ringRect && iconRect ? {
        x: (iconRect.left + iconRect.width / 2) - (ringRect.left + ringRect.width / 2),
        y: (iconRect.top + iconRect.height / 2) - (ringRect.top + ringRect.height / 2),
      } : null,
    };
  });
});

console.log(JSON.stringify(data, null, 2));
await browser.close();
