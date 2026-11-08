import { chromium } from '../browser-tools/node_modules/playwright/index.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
const fixture='# A small tool, room to grow\n\nRead a document beside **working chat**, without making either feel secondary. Visit [the next note](next.md) or [an external reference](https://example.com).\n\n## A few useful properties\n\n- A shared app identity\n- Quiet, familiar controls\n- Readable paragraphs and links\n\n> The reference is an experience, not just a list of components.\n\nUse `docs/wiki/index.md` to start reading.\n\n```ts\nconst reader = { readOnly: true, comments: false };\nconsole.log(reader);\n```\n\n| Capability | State |\n| --- | --- |\n| Reading | Open |\n| Chat | Available |\n\n'+('Another paragraph with an [ordinary link](next.md) and `inline code`.\n\n'.repeat(12));
const browser=await chromium.launch({headless:true});
const results={fixture,simulation:'isolated built assets; mocked documents/chat/SSE; no app server or live provider',referenceCommentRemoval:'reference paired screenshots only: hide annotation toolbar/rail and make its canvas block with min-width 0; raw reference desktop also retained',builds:{}};
async function render(label,root,removeComments){
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  sessionStorage.setItem('open-document','/fixtures/guide.md');
  window.__state={sessionId:'fixture',busy:false,error:null,activity:'',steering:[],context:null,messages:[{role:'user',content:'Help me keep this tool pleasant to use.'},{role:'assistant',content:'We can read and discuss a document here while keeping chat available.'}]};
  window.EventSource=class{constructor(){window.__events=this;setTimeout(()=>this.onmessage?.({data:JSON.stringify(window.__state)}),0)}close(){}};
 });
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname!=='fidelity.test')return route.abort();
  if(u.pathname.startsWith('/api/documents'))return route.fulfill({json:{path:'/fixtures/guide.md',name:'guide.md',content:fixture,comments:[],storage:'embedded'}});
  if(u.pathname.startsWith('/api/'))return route.fulfill({json:{}});
  const file=u.pathname==='/'?'/index.html':u.pathname;
  return route.fulfill({body:await readFile(path.join(root,'dist',file)),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
 });
 await page.goto('https://fidelity.test');
 await page.getByRole('heading',{name:'A small tool, room to grow',exact:true}).waitFor();
 await page.getByRole('textbox',{name:'Message Pi'}).fill('A draft stays available.');
 await page.waitForFunction(()=>document.querySelector('button[aria-label="Send message"]')?.disabled===false);
 if(removeComments){
  await page.screenshot({path:path.join(out,'reference-raw-desktop.png')});
  await page.addStyleTag({content:'.annotation-toolbar,.annotation-rail,.selection-popover{display:none!important}.annotation-canvas{display:block!important;min-width:0!important}'});
 }
 async function metrics(){return page.evaluate(()=>{
  const article=document.querySelector('.markdown-document');
  const brand=document.querySelector('.brand');
  const header=brand?.closest('header');
  const input=document.querySelector('textarea[aria-label="Message Pi"]');
  const rect=el=>{const r=el?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null};
  const style=el=>{if(!el)return null;const s=getComputedStyle(el);return {fontSize:s.fontSize,fontFamily:s.fontFamily,lineHeight:s.lineHeight,color:s.color,backgroundColor:s.backgroundColor}};
  return {header:rect(header),brand:rect(brand),chatInput:rect(input),article:rect(article),body:style(document.body),paragraph:style(article?.querySelector('p')),link:style(article?.querySelector('p a')),inlineCode:style(article?.querySelector('p code')),blockCode:style(article?.querySelector('pre code')),pre:style(article?.querySelector('pre')),globalHeader:!!(header?.parentElement?.contains(article)&&header.parentElement.contains(input)),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('button')].filter(el=>el.getBoundingClientRect().width>0).map(el=>({label:el.getAttribute('aria-label')||el.textContent.trim(),text:el.textContent.trim(),hasIcon:!!el.querySelector('svg')}))};
 });}
 const desktop=await metrics();
 await page.screenshot({path:path.join(out,`${label}-desktop.png`)});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.join(out,`${label}-narrow-top.png`)});
 await page.getByRole('heading',{name:'A small tool, room to grow',exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(out,`${label}-narrow-reader.png`)});
 const narrow=await metrics();
 results.builds[label]={root,desktop,narrow,pageErrors:errors};
 await page.close();
}
try{
 await render('reference','/Users/michael/dev/self-growing-reader-distill',true);
 if(process.argv[2])await render('candidate',process.argv[2],false);
 await writeFile(path.join(out,'reference-comparison.json'),JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify(results.builds,null,2));
}finally{await browser.close();}
