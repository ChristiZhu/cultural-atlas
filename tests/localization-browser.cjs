/** End-to-end bilingual regression. Start a static dist server on port 4173 first. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1512,height:982},reducedMotion:'reduce',acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.ATLAS_PREVIEW_URL||'http://127.0.0.1:4173/cultural-atlas/';
 const shot=async name=>{await page.waitForTimeout(120);await page.screenshot({path:`work/localization/${name}.png`});};
 const scene=async id=>page.waitForSelector(`#${id}.scene--active`);
 const board=async()=>{await page.locator('.scene--active [data-nav=corkboard]').click();await scene('corkboard');};
 const map=async city=>{await page.locator(`#corkboard [data-card="${city==='taiyuan'?'shanxi':city}"]`).click();await scene('guangzhou');await page.waitForFunction(city=>document.querySelector('#guangzhou').dataset.city===city,city);};
 const lang=async code=>{await page.locator(`.scene--active [data-language=${code}]`).click();await page.waitForFunction(code=>document.documentElement.lang===(code==='zh'?'zh-CN':'en'),code);};
 await page.goto(base);await page.waitForSelector('#home.scene--active');assert.equal(await page.locator('html').getAttribute('lang'),'en');
 assert.equal(await page.locator('.entrance-instruction').textContent(),'Click the window to enter');
 await page.locator('#enter-window').click();await scene('corkboard');await map('guangzhou'); // cache original map before switching
 await page.locator('[data-filter=craft]').click();await page.locator('#collapse-info').click();await board();await lang('zh');await shot('board-zh');
 await page.locator('.board-tab--about').click();assert.equal(await page.locator('.about-notice').textContent(),'即将开放');await map('guangzhou');
 assert.equal(await page.locator('#guangzhou').getAttribute('data-category'),'craft');assert.equal(await page.locator('#guangzhou').getAttribute('data-collapsed'),'true');assert.equal(await page.locator('.map-filter-title').textContent(),'工艺');
 assert(await page.locator('.panel-art [data-locale-chinese]').count()>0);await page.locator('#expand-info').click();await page.locator('[data-filter=craft]').click();await shot('map-zh');
 const books={guangzhou:['Canton Tower','Guangcai Porcelain','Shrimp Dumpling','Five Rams Sculpture'],beijing:['Ludagun','Swallow Kite'],shanghai:['Eight Treasure Duck','Jinshan Folk Painting'],taiyuan:['Youmian Kaolaolao','Paper Cutting'],dehong:['Bamboo Rice','Jingpo Brocade']};
 let count=0;
 for(const [city,items]of Object.entries(books)){
  if(city!=='guangzhou'){await board();await map(city);}
  for(const item of items){
   await page.locator(`.map-art [data-item="${item}"]`).click();await page.waitForSelector('#archive[open]');await page.waitForFunction(()=>document.querySelector('#archive').dataset.bookState==='FRONT_COVER'&&!document.querySelector('#archive').hasAttribute('aria-busy'));
   await shot('archive-'+city+'-'+count+'-front');
   assert(await page.locator('#atlas').evaluate(el=>el.inert));const rect=await page.locator('.archive-stage').boundingBox();
   await page.locator('[data-page=cover]').click();await page.waitForFunction(()=>document.querySelector('#archive').dataset.bookState==='SPREAD_01_02'&&!document.querySelector('#archive').hasAttribute('aria-busy'));
   await shot('archive-'+city+'-'+count);
   for(let n=0;n<4;n++){await page.locator('[data-page=next]').click();await page.waitForFunction(()=>!document.querySelector('#archive').hasAttribute('aria-busy'));await shot('archive-'+city+'-'+count+'-face-'+(n+2));}
   assert.equal(await page.locator('#archive').getAttribute('data-book-state'),'BACK_COVER');assert.deepEqual(await page.locator('.archive-stage').boundingBox(),rect);
   assert((await page.locator('.archive-art').getAttribute('src')).startsWith('blob:'));await page.keyboard.press('Escape');await page.waitForSelector('#archive:not([open])',{state:'attached'});count++;
  }
 }
 await board();await page.locator('.board-tab--create').click();await scene('icon-library');await shot('library-zh');
 await page.locator('#icon-library [data-city=guangzhou]').click();await page.locator('#icon-library [data-flow=next]').click();await scene('choose-icons');await page.locator('[data-icon=canton-tower]').click();await page.locator('[data-icon=porcelain-1]').click();assert.equal(await page.locator('#icon-selection-hint').textContent(),'已选 2 / 3');await shot('chooser-zh');
 await page.locator('#choose-icons [data-flow=next]').click();await scene('pattern-preview');const seed=await page.locator('#pattern-preview .generated-pattern').getAttribute('data-seed');await shot('preview-zh');
 await page.locator('[data-color-mode=vivid]').click();assert.equal(await page.locator('#pattern-preview .generated-pattern').getAttribute('data-seed'),seed);
 await page.locator('#pattern-preview [data-flow=next]').click();await scene('pattern-save');
 const downloaded=page.waitForEvent('download');await page.locator('#save-pattern').click();const download=await downloaded;assert.equal(await download.failure(),null);await page.waitForFunction(()=>!document.querySelector('#save-success-layer').hidden);await shot('saved-zh');
 assert((await page.locator('#save-success-layer').textContent()).includes('#CulturalAtlasPatterns'));assert((await page.locator('#save-success-layer').textContent()).includes('保存成功'));
 await page.keyboard.press('Escape');await board();await lang('en');await shot('board-en-restored');assert.equal(await page.locator('.board-tab--create').innerText(),'Create Pattern\n→');
 await lang('zh');await page.reload();await scene('home');assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');assert.equal(await page.locator('.entrance-instruction').textContent(),'点击窗户，开启文化之旅');await shot('home-zh');
 assert.deepEqual(errors,[]);console.log(`PASS: language persistence, cached EN→ZH→EN art, About, map filter/collapse, ${count} archive books/all 72 faces, fixed book stage, library, generation, recoloring and PNG save under project path.`);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
