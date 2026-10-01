import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/VICTUS/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await page.goto('http://localhost:3074/#workspace/forecast',{waitUntil:'networkidle',timeout:60000});
 await page.locator('.maplibregl-canvas').waitFor({timeout:30000});
 await page.locator('.recharts-surface').first().waitFor({timeout:30000});
 await page.waitForLoadState('networkidle');
 await page.screenshot({path:'.cache/screenshots/workspace-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.getByRole('button',{name:'Ask MeghSetu',exact:true}).click();
 await page.getByRole('textbox',{name:'Message MeghSetu'}).fill('Say welcome in one short sentence.');
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await page.locator('.chat-message.assistant').waitFor({timeout:70000});
 const speech=page.waitForResponse(r=>r.url().endsWith('/api/voice/speak'),{timeout:50000});
 await page.getByRole('button',{name:'Listen',exact:true}).click();
 assert.equal((await speech).status(),200);
 await page.screenshot({path:'.cache/screenshots/voice-mobile.png',fullPage:false});
 await page.getByRole('button',{name:'Close dialog'}).click();
 const permitted=await page.evaluate(()=>navigator.permissions.query({name:'microphone'}).then(p=>p.state));
 assert.equal(permitted,'prompt','Microphone must not be requested without a click.');
 console.log('Mobile map and chart loaded; voice playback endpoint returned audio; no microphone permission requested automatically; layout fits.');
}finally{await browser.close();}
