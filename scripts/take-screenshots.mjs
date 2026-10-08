import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = '/opt/cursor/artifacts/screenshots';

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Homepage Desktop viewport-only (1440x900 - above the fold)
    console.log('Taking homepage-desktop-viewport screenshot (1440x900)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('.hero-title', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ 
      path: `${OUTPUT_DIR}/homepage-desktop-viewport.png`, 
      fullPage: false 
    });
    console.log('✓ homepage-desktop-viewport.png saved');
    
    // Homepage Desktop full-page (1440px)
    console.log('Taking homepage-desktop-fullpage screenshot...');
    await page.screenshot({ 
      path: `${OUTPUT_DIR}/homepage-desktop-fullpage.png`, 
      fullPage: true 
    });
    console.log('✓ homepage-desktop-fullpage.png saved');
    
    // Homepage Mobile full-page (390px)
    console.log('Taking homepage-mobile screenshot (390px)...');
    await page.setViewport({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ 
      path: `${OUTPUT_DIR}/homepage-mobile.png`, 
      fullPage: true 
    });
    console.log('✓ homepage-mobile.png saved');
    
    // Writing page desktop full-page
    console.log('Taking writing-desktop screenshot...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/writing`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ 
      path: `${OUTPUT_DIR}/writing-desktop.png`, 
      fullPage: true 
    });
    console.log('✓ writing-desktop.png saved');
    
    console.log('\nAll screenshots saved to:', OUTPUT_DIR);
    
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(console.error);
