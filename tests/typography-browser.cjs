/** Chinese optical layout checks; no changes to application state semantics. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1512,height:982},reducedMotion:'reduce'});
 await page.goto(process.env.ATLAS_PREVIEW_URL||'http://127.0.0.1:4173/cultural-atlas/');
 await page.locator('#home [data-language=zh]').click();await page.waitForFunction(()=>document.documentElement.lang==='zh-CN');
 for(const [width,height] of [[1280,720],[1512,982],[1920,1080],[2560,1440]]){
  await page.setViewportSize({width,height});
  const geometry=await page.evaluate(()=>{const h=document.querySelector('.entrance-instruction').getBoundingClientRect(),w=document.querySelector('#enter-window').getBoundingClientRect();return {hintTop:h.top,hintBottom:h.bottom,windowBottom:w.bottom};});
  assert(geometry.hintTop>geometry.windowBottom+15);assert(geometry.hintBottom<height);
 }
 await page.setViewportSize({width:1512,height:982});await page.locator('#enter-window').click();await page.waitForSelector('#corkboard.scene--active');
 const switcher=await page.locator('#corkboard .language-switcher').boundingBox();assert(switcher.width<115&&switcher.height<40);
 for(const city of ['guangzhou','beijing','shanghai','dehong','taiyuan']){
  await page.locator(`#corkboard [data-card=${city==='taiyuan'?'shanxi':city}]`).click();await page.waitForFunction(city=>document.querySelector('#guangzhou').dataset.city===city,city);
  await page.waitForSelector('#guangzhou.scene--active');
  const labels=page.locator('.panel-art [data-filter-art] [data-locale-chinese]');
  for(const item of await labels.all()){assert.equal(await item.evaluate(n=>getComputedStyle(n).stroke),'none');assert.equal(await item.evaluate(n=>getComputedStyle(n).fill),'rgb(248, 210, 77)');}
  await page.screenshot({path:`work/localization/map-${city}-refined.png`});
  await page.locator('#guangzhou [data-nav=corkboard]').click();await page.waitForSelector('#corkboard.scene--active');
 }
 await page.locator('.board-tab--create').click();await page.waitForSelector('#icon-library.scene--active');
 for(const city of ['all','guangzhou','beijing','shanghai','dehong','taiyuan']){
  await page.locator(`#icon-library [data-city=${city}]`).click();
  const labels=page.locator(`#icon-library [data-city-art=${city}] [data-locale-chinese]`);assert.equal(await labels.count(),1);
  const state=await labels.evaluateAll(nodes=>nodes.map(n=>({fill:getComputedStyle(n).fill,stroke:getComputedStyle(n).stroke,box:n.getBBox().height})));
  assert.equal(state[0].fill,'rgb(255, 255, 255)');assert.equal(state[0].stroke,'none');assert(state[0].box>19&&state[0].box<28);
 }
 for(const width of [1280,1920,2560]){
  await page.setViewportSize({width,height:Math.round(width*9/16)});
  const nav=await page.locator('#icon-library nav button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),text=n.querySelector('.nav-label-zh')||n;return {left:r.left,right:r.right,size:getComputedStyle(text).fontSize,font:getComputedStyle(text).fontFamily};}));
  for(let i=1;i<nav.length;i++){assert(nav[i].left>nav[i-1].right);assert.equal(nav[i].size,nav[0].size);assert.equal(nav[i].font,nav[0].font);}assert(nav.at(-1).right<=width);
 }
 await page.locator('#icon-library [data-nav=corkboard]').click();await page.waitForSelector('#corkboard.scene--active');await page.locator('#corkboard [data-language=en]').click();await page.waitForFunction(()=>document.documentElement.lang==='en');
 await page.locator('.board-tab--create').click();await page.waitForSelector('#icon-library.scene--active');assert.equal(await page.locator('#icon-library .nav-label-zh:visible').count(),0);assert.equal(await page.locator('#icon-library nav img:visible').count(),2);
 await browser.close();console.log('PASS: four desktop viewports, compact switcher, five map panels, solid filter text, all six tab selections, equal Chinese nav size and English restoration.');
})().catch(e=>{console.error(e);process.exit(1)});
