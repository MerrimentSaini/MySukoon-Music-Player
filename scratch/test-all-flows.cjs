const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Launching browser for E2E views testing...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });
  
  const page = await browser.newPage();
  
  // Listen for console logs
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  // Listen for page errors (crashes)
  page.on('pageerror', err => {
    console.error(`[BROWSER PAGEERROR] CRASH:`, err.stack || err);
  });
  
  console.log('1. Navigating to MySukoon...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  
  console.log('Waiting 3.5 seconds for splash screen to fade...');
  await new Promise(resolve => setTimeout(resolve, 3800));
  
  // Find first play button of trending tracks
  console.log('2. Clicking first trending track to play...');
  const trendingPlay = await page.$$('div');
  let clickedTrending = false;
  for (const div of trendingPlay) {
    const classVal = await page.evaluate(el => el.className, div);
    if (classVal && classVal.includes('group') && classVal.includes('cursor-pointer')) {
      const text = await page.evaluate(el => el.textContent, div);
      if (text && (text.includes('Kesariya') || text.includes('Pehle Bhi Main'))) {
        console.log(`Found trending track: ${text.replace(/\s+/g, ' ')}. Clicking...`);
        await div.click();
        clickedTrending = true;
        break;
      }
    }
  }
  
  if (!clickedTrending) {
    console.log('Clicking first play button container...');
    const playBtn = await page.$('.group .absolute.inset-0.bg-black\\/40');
    if (playBtn) {
      await playBtn.click();
    }
  }
  
  console.log('Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('3. Clicking expand button to open FullPlayer...');
  const expandBtns = await page.$$('button');
  for (const btn of expandBtns) {
    const title = await page.evaluate(el => el.getAttribute('title'), btn);
    if (title === 'Expand Player') {
      await btn.click();
      console.log('Opened FullPlayer');
      break;
    }
  }
  
  console.log('Waiting 2 seconds to observe FullPlayer rendering...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.screenshot({ path: 'e:/MySukoon/scratch/step3_fullplayer_expanded.png' });
  
  console.log('4. Clicking collapse button to close FullPlayer...');
  // Find the button that has a lucide-chevron-down child SVG
  const collapsed = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const collapseBtn = buttons.find(btn => btn.querySelector('svg.lucide-chevron-down') || btn.innerHTML.includes('lucide-chevron-down') || btn.querySelector('.lucide-chevron-down'));
    if (collapseBtn) {
      collapseBtn.click();
      return true;
    }
    return false;
  });
  
  if (collapsed) {
    console.log('Collapsed FullPlayer successfully');
  } else {
    console.log('Failed to find collapse button via chevron class! Attempting fallback header button click...');
    const fallbackClick = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (header) {
        const btn = header.querySelector('button');
        if (btn) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    console.log('Fallback header button click status:', fallbackClick);
  }
  
  console.log('Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('5. Navigating to Search View...');
  const navSearch = await page.$$('button, a');
  for (const el of navSearch) {
    const text = await page.evaluate(node => node.textContent, el);
    if (text && text.includes('Search')) {
      await el.click();
      console.log('Clicked Search menu button');
      break;
    }
  }
  
  console.log('Waiting 2 seconds for Search View...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.screenshot({ path: 'e:/MySukoon/scratch/step4_search_view.png' });
  
  console.log('6. Navigating to Your Library View...');
  const navLib = await page.$$('button, a');
  for (const el of navLib) {
    const text = await page.evaluate(node => node.textContent, el);
    if (text && text.includes('Library')) {
      await el.click();
      console.log('Clicked Your Library menu button');
      break;
    }
  }
  
  console.log('Waiting 2 seconds for Library View...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.screenshot({ path: 'e:/MySukoon/scratch/step5_library_view.png' });
  
  console.log('7. Navigating to Queue View...');
  const navQueue = await page.$$('button, a');
  for (const el of navQueue) {
    const text = await page.evaluate(node => node.textContent, el);
    if (text && text.includes('Queue')) {
      await el.click();
      console.log('Clicked Queue menu button');
      break;
    }
  }
  
  console.log('Waiting 2 seconds for Queue View...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.screenshot({ path: 'e:/MySukoon/scratch/step6_queue_view.png' });
  
  console.log('E2E views testing completed successfully!');
  console.log('Closing browser.');
  await browser.close();
})().catch(err => {
  console.error('E2E testing failed:', err);
});
