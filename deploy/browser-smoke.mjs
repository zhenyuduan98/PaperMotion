import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE=(process.env.PAPERMOTION_TEST_BASE || 'https://papermotion.chillicurry.uk').replace(/\/$/, '');
const browser=await chromium.launch({headless:true});
try {
  const context=await browser.newContext({httpCredentials:{username:'zhenyu',password:fs.readFileSync('/home/azureuser/.config/papermotion/access-password','utf8')},viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  const errors=[];const failures=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400 && !r.url().includes('/api/codex/account'))failures.push([r.status(),r.url()]);});
  const home=await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  await page.getByText('Read it. See it. Get It.').waitFor();
  await page.waitForLoadState('networkidle');
  if (await page.getByText('Welcome to Get It.', {exact:true}).count()) throw new Error('Welcome popup still present for fresh visitor');
  if ((await home.text()).includes('Welcome to Get It.')) throw new Error('Welcome popup present in server HTML');
  console.log('PASS fresh visitor: welcome popup absent');
  await page.screenshot({path:'/tmp/papermotion-home.png',fullPage:false});
  console.log('HOME',home.status());
  const doc=fs.readFileSync('/tmp/papermotion-smoke-docid','utf8');
  await page.goto(BASE+'/viewer/'+doc,{waitUntil:'domcontentloaded'});
  await page.locator('[data-page="0"] canvas').waitFor({state:'visible',timeout:60000});
  await page.waitForFunction(()=>{const c=document.querySelector('[data-page="0"] canvas');return c && c.width>0 && c.height>0;},{},{timeout:60000});
  await page.screenshot({path:'/tmp/papermotion-viewer.png',fullPage:false});
  console.log('VIEWER',(await page.locator('body').innerText()).slice(0,1800));
  console.log('JS_ERRORS',JSON.stringify(errors));console.log('HTTP_ERRORS',JSON.stringify(failures));
  if(errors.length || failures.length)process.exitCode=1;
} finally {await browser.close();}
