import {t,setLanguage} from './i18n.js';
/** Shared navigation entries use the same scene controller throughout the atlas. */
export function initNavigation(){
  const home=document.querySelector('#home'),board=document.querySelector('#corkboard');
  const hint=document.createElement('p');hint.className='entrance-instruction';hint.textContent='Click the window to enter';home.append(hint);
  for(const scene of [home,board]){
    const control=document.createElement('div');control.className='language-switcher';control.setAttribute('role','group');control.setAttribute('aria-label','Language / 语言');
    for(const [code,label] of [['en','EN'],['zh','中文']]){const b=document.createElement('button');b.type='button';b.dataset.language=code;b.textContent=label;b.addEventListener('click',()=>setLanguage(code).catch(()=>{document.querySelector('#status').textContent=t('The artwork could not load. Please try again.');}));control.append(b);if(code==='en'){const divider=document.createElement('span');divider.textContent='/';divider.setAttribute('aria-hidden','true');control.append(divider);}}
    scene.append(control);
  }
  for(const id of ['guangzhou','icon-library','pattern-creating','pattern-save','community','about']){
    const back=document.createElement('button');back.type='button';back.className='exploration-back';back.dataset.back='';
    const label=id==='guangzhou'?'Back to China':id==='icon-library'?'Back to Exploration':id==='pattern-save'?'Back to Preview':'Back';
    back.append('← ',Object.assign(document.createElement('span'),{textContent:label}));document.getElementById(id).append(back);
  }
  const boardAbout=document.createElement('button');boardAbout.type='button';boardAbout.className='board-tab board-tab--about';boardAbout.textContent='About';boardAbout.dataset.nav='about';board.querySelector('.board-tab--create').before(boardAbout);
  for(const nav of document.querySelectorAll('.scene nav:not(.board-navigation)')){
    nav.classList.add('shared-navigation');
    // Every creation stage shares the same route; the gallery does not link to itself.
    if(!nav.closest('#community')&&!nav.querySelector('[data-nav="community"]')){
      const entry=document.createElement('button');entry.type='button';entry.className='art-button nav-button nav-community';entry.dataset.nav='community';entry.textContent='Community Patterns';entry.setAttribute('aria-label','Community Patterns');nav.append(entry);
    }
    // Chinese labels share a single optical size instead of inheriting the
    // different aspect ratios of the English word-art image files.
    for(const item of nav.querySelectorAll('[data-nav]')){
      if(!item.querySelector('img'))continue;
      const label=document.createElement('span');label.className='nav-label-zh';
      label.lang='zh-CN';label.setAttribute('aria-hidden','true');
      label.textContent=({corkboard:'主页',map:'地图',library:'图标库'})[item.dataset.nav];
      item.append(label);
    }
    const button=document.createElement('button');button.type='button';button.className='art-button nav-button nav-about';button.textContent='ABOUT';button.setAttribute('aria-label','About');button.style.cssText='--w:91;--h:29;--underline:91';button.dataset.nav='about';if(nav.closest('#about'))button.setAttribute('aria-current','page');nav.append(button);
  }
}
