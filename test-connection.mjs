/**
 * test-connection.mjs
 * 
 * Automated two-tab connection test using Puppeteer.
 * Run with:  node test-connection.mjs
 * Make sure the dev server is running at http://localhost:5173/
 */

import puppeteer from 'puppeteer';

const APP_URL = 'http://localhost:5173/';

async function clickThroughIntro(page, name) {
  await page.waitForSelector('body', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1500));

  // Try clicking any intro/continue buttons
  try {
    const buttons = await page.$$('button');
    if (buttons.length > 0) {
      await buttons[0].click();
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (e) { /* continue */ }

  // Try to fill in a name field
  try {
    const inputs = await page.$$('input[type="text"], input:not([type])');
    for (const input of inputs) {
      try {
        await input.click({ clickCount: 3 });
        await input.type(name, { delay: 50 });
        break;
      } catch (e) { /* continue */ }
    }
  } catch (e) { console.log('No name input found'); }

  await new Promise(r => setTimeout(r, 500));
}

async function findAndClickButton(page, ...keywords) {
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    try {
      const text = await page.evaluate(el => el.textContent?.toLowerCase() || '', btn);
      const isVisible = await page.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }, btn);
      if (isVisible && keywords.some(kw => text.includes(kw.toLowerCase()))) {
        await btn.click();
        return true;
      }
    } catch (e) { /* continue */ }
  }
  return false;
}

async function getRoomCode(page) {
  const text = await page.evaluate(() => document.body.innerText);
  const match = text.match(/\b([A-Z]{4}\d{2})\b/);
  return match ? match[1] : null;
}

async function getErrorMessage(page) {
  const text = await page.evaluate(() => {
    const errorEls = document.querySelectorAll('[class*="error"], [class*="Error"], [class*="alert"]');
    const msgs = Array.from(errorEls).map(el => el.textContent?.trim()).filter(Boolean);
    return msgs.join(' | ');
  });
  return text || null;
}

async function run() {
  console.log('Launching browser...');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--allow-running-insecure-content',
    ],
  });

  const hostLogs = [];
  const guestLogs = [];

  // HOST TAB
  console.log('\nOpening HOST tab...');
  const hostContext = await browser.createBrowserContext();
  const hostPage = await hostContext.newPage();
  hostPage.on('console', msg => {
    const entry = { type: msg.type(), text: msg.text() };
    hostLogs.push(entry);
    if (entry.text.includes('[ICE]') || entry.type === 'error') {
      console.log(`[HOST ${entry.type}]: ${entry.text}`);
    }
  });

  await hostPage.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 15000 });
  console.log('  Host page loaded');

  await clickThroughIntro(hostPage, 'TestHost');
  await new Promise(r => setTimeout(r, 1000));
  
  await findAndClickButton(hostPage, 'online', 'play online', 'multiplayer');
  await new Promise(r => setTimeout(r, 1000));
  await findAndClickButton(hostPage, 'host', 'host room', 'create room');
  await new Promise(r => setTimeout(r, 2000));

  // Print all buttons available
  const hostButtons = await hostPage.$$('button');
  for (const btn of hostButtons) {
    const text = await hostPage.evaluate(el => el.textContent?.trim() || '', btn);
    if (text) console.log('  Host button:', text);
  }

  // Print page text for debugging
  const hostBodyText = await hostPage.evaluate(() => document.body.innerText.substring(0, 800));
  console.log('\nHost page content:\n', hostBodyText);

  let roomCode = await getRoomCode(hostPage);
  if (!roomCode) {
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 1000));
      roomCode = await getRoomCode(hostPage);
      if (roomCode) break;
      console.log(`  Waiting for room code... (${i + 1}s)`);
    }
  }

  if (!roomCode) {
    console.error('No room code found. Exiting.');
    await hostPage.screenshot({ path: 'C:/Users/Sujampathi/.gemini/antigravity-ide/brain/b9cff512-68c5-41c1-9ffc-34aca94761ec/test-host.png' });
    await browser.close();
    return;
  }

  console.log(`\n=== ROOM CODE: ${roomCode} ===`);
  await hostPage.screenshot({ path: 'C:/Users/Sujampathi/.gemini/antigravity-ide/brain/b9cff512-68c5-41c1-9ffc-34aca94761ec/test-host.png' });

  // GUEST TAB
  console.log('\nOpening GUEST tab...');
  const guestContext = await browser.createBrowserContext();
  const guestPage = await guestContext.newPage();
  guestPage.on('console', msg => {
    const entry = { type: msg.type(), text: msg.text() };
    guestLogs.push(entry);
    if (entry.text.includes('[ICE]') || entry.type === 'error' || entry.type === 'warn') {
      console.log(`[GUEST ${entry.type}]: ${entry.text}`);
    }
  });

  await guestPage.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 15000 });
  await clickThroughIntro(guestPage, 'TestGuest');
  await new Promise(r => setTimeout(r, 1000));
  
  await findAndClickButton(guestPage, 'online', 'play online', 'multiplayer');
  await new Promise(r => setTimeout(r, 1000));
  await findAndClickButton(guestPage, 'join', 'join room');
  await new Promise(r => setTimeout(r, 500));

  // Fill code input
  const codeInputs = await guestPage.$$('input');
  let codeEntered = false;
  for (const input of codeInputs) {
    try {
      const ph = await guestPage.evaluate(el => el.placeholder || '', input);
      console.log('  Guest input placeholder:', ph);
      if (ph.toLowerCase().includes('star') || ph.toLowerCase().includes('code')) {
        await input.click({ clickCount: 3 });
        await input.type(roomCode, { delay: 100 });
        codeEntered = true;
        break;
      }
    } catch (e) { /* continue */ }
  }

  if (!codeEntered) {
    console.log('  Could not find code input');
    const guestBodyText = await guestPage.evaluate(() => document.body.innerText.substring(0, 600));
    console.log('  Guest page content:\n', guestBodyText);
  }

  await new Promise(r => setTimeout(r, 500));
  await findAndClickButton(guestPage, 'join', 'connect', 'enter', 'go');

  console.log(`\nJoin request sent for code: ${roomCode}`);
  console.log('Waiting up to 35s for ICE connection...\n');

  let connected = false;
  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 1000));
    
    const guestText = await guestPage.evaluate(() => document.body.innerText);
    const hostText = await hostPage.evaluate(() => document.body.innerText);
    
    if (guestText.includes('TestHost') || hostText.includes('TestGuest') ||
        guestText.toLowerCase().includes('choose a game') || 
        guestText.toLowerCase().includes('connected')) {
      connected = true;
      console.log(`CONNECTION SUCCEEDED after ${i + 1} seconds!`);
      break;
    }
    
    const guestErr = await getErrorMessage(guestPage);
    if (guestErr) {
      console.log(`Guest error after ${i + 1}s: ${guestErr}`);
      break;
    }

    const hostErr = await getErrorMessage(hostPage);
    if (hostErr && !hostErr.includes('TestGuest')) {
      console.log(`Host error after ${i + 1}s: ${hostErr}`);
    }
  }

  await hostPage.screenshot({ path: 'C:/Users/Sujampathi/.gemini/antigravity-ide/brain/b9cff512-68c5-41c1-9ffc-34aca94761ec/test-host-final.png' });
  await guestPage.screenshot({ path: 'C:/Users/Sujampathi/.gemini/antigravity-ide/brain/b9cff512-68c5-41c1-9ffc-34aca94761ec/test-guest-final.png' });

  console.log('\n=== RESULTS ===');
  console.log('Room code:', roomCode);
  console.log('Connection:', connected ? 'SUCCESS' : 'FAILED');

  const iceEntries = guestLogs.filter(l => l.text.includes('[ICE]'));
  console.log('\nICE log entries:', iceEntries.length ? iceEntries.map(e => e.text).join('\n') : 'None');

  const errEntries = [...hostLogs, ...guestLogs].filter(l => l.type === 'error');
  console.log('\nErrors:', errEntries.length ? errEntries.map(e => e.text).join('\n') : 'None');

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
}

run().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
