import { chromium } from '../browser-tools/node_modules/playwright/index.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const target = process.argv[2];
if (!target) throw new Error('Supply target checkout path');
const head = execFileSync('git', ['-C', target, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim();
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1280,height:850}});
page.setDefaultTimeout(7000);
const errors=[], requests=[], chats=[], results=[];
page.on('pageerror', e=>errors.push(e.message));
let content = '# Reader acceptance\n\nParagraph **bold** [Next document](next.md) [External](https://example.com).\n\n> quote\n\n- item\n\n| A | B |\n|---|---|\n| x | y |\n\n```\n'+'wide'.repeat(250)+'\n```\n\n'+'Paragraph.\n\n'.repeat(180)+'<img src="https://evil.test/pixel"><script>alert(1)</script>';
let fail=false, reads=0;
await page.addInitScript(()=>{
 window.__state={messages:[],busy:false,error:null,activity:'',steering:[],context:null,sessionId:'one'};
 window.EventSource=class {constructor(){window.__events=this;setTimeout(()=>this.onmessage?.({data:JSON.stringify(window.__state)}),0)} close(){}};
 window.__emit=patch=>{Object.assign(window.__state,patch);window.__events.onmessage({data:JSON.stringify(window.__state)})};
});
await page.route('**/*',async route=>{
 const u=new URL(route.request().url()); requests.push(u.href);
 if(u.host!=='reader.test') return route.abort();
 if(u.pathname==='/api/documents') { reads++; return route.fulfill({status:fail?422:200,json:fail?{detail:'Acceptance read error'}:{path:u.searchParams.get('path'),name:'index.md',content}}); }
 if(u.pathname==='/api/documents/choose') return route.fulfill({json:{path:null}});
 if(u.pathname==='/api/chat') { chats.push(route.request().postDataJSON()); return route.fulfill({json:{disposition:'started'}}); }
 if(u.pathname==='/api/stop') return route.fulfill({json:{steering:[],followUp:[]}});
 if(u.pathname==='/api/session/new') return route.fulfill({json:{...await page.evaluate(()=>window.__state),sessionId:'new'}});
 const file=u.pathname==='/'?'/index.html':u.pathname;
 return route.fulfill({body:await readFile(path.join(target,'dist',file)),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
});
async function check(name,action){
 try { await action(); results.push({name,passed:true}); console.log('PASS',name); }
 catch(error) { results.push({name,passed:false,error:error.message}); console.log('FAIL',name,error.message); }
}
try {
 await page.goto('https://reader.test');
 await check('open file beside existing chat; readable and inert Markdown',async()=>{
  await page.getByRole('textbox',{name:'Message Pi'}).fill('Preserved draft');
  await page.getByRole('button',{name:'Open Markdown',exact:true}).click();
  await page.getByLabel('Or local path').fill('/repo/docs/wiki/index.md');
  await page.getByRole('button',{name:'Open',exact:true}).click();
  await page.getByRole('heading',{name:'Reader acceptance'}).waitFor();
  assert.equal(await page.getByRole('textbox',{name:'Message Pi'}).inputValue(),'Preserved draft');
  assert.ok(await page.locator('article table').isVisible());
  assert.equal(await page.locator('article img, article script').count(),0);
  assert.equal(requests.some(url=>url.includes('evil.test')),false);
 });
 await check('settings menu remains usable beside reader',async()=>{
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  assert.ok(await page.getByRole('checkbox',{name:'Show thinking and tool activity'}).isVisible());
  await page.getByRole('checkbox',{name:'Show thinking and tool activity'}).press('Escape');
 });
 await check('desktop resize and independent overflow',async()=>{
  const divider=page.getByRole('separator');
  await divider.focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await divider.getAttribute('aria-valuenow'),'52');
  const box=await divider.boundingBox(); await page.mouse.move(box.x+3,box.y+50); await page.mouse.down(); await page.mouse.move(720,box.y+50); await page.mouse.up();
  assert.notEqual(await divider.getAttribute('aria-valuenow'),'52');
  assert.ok(await page.locator('.document-pane').evaluate(el=>el.scrollHeight>el.clientHeight));
  assert.ok(await page.locator('article pre').evaluate(el=>el.scrollWidth>el.clientWidth));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 });
 await check('relative Markdown link opens the next document without leaving chat',async()=>{
  const link=page.getByRole('link',{name:'Next document'});
  assert.ok(await link.count(), 'Relative Markdown link is not navigable');
  await link.click();
  await page.waitForFunction(()=>new URLSearchParams(window.location.search).get('path')?.endsWith('next.md')||window.sessionStorage.getItem('open-document')?.endsWith('next.md'));
 });
 await check('reader survives reload, cancel, errors and retry',async()=>{
  const width=await page.getByRole('separator').getAttribute('aria-valuenow');
  await page.reload(); await page.getByRole('heading',{name:'Reader acceptance'}).waitFor();
  assert.equal(await page.getByRole('separator').getAttribute('aria-valuenow'),width);
  assert.equal(await page.getByRole('textbox',{name:'Message Pi'}).inputValue(),'Preserved draft');
  await page.getByRole('button',{name:'Open Markdown',exact:true}).click();
  await page.getByRole('button',{name:'Choose local file…',exact:true}).click();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.ok(await page.getByRole('heading',{name:'Reader acceptance'}).isVisible());
  fail=true; await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await page.getByText('Error: Acceptance read error').waitFor();
  fail=false; await page.getByRole('button',{name:'Retry',exact:true}).click();
  await page.getByRole('heading',{name:'Reader acceptance'}).waitFor();
 });
 await check('mocked send, response rendering, steer, stop, and post-work refresh',async()=>{
  const textbox=page.getByRole('textbox',{name:'Message Pi'});
  await textbox.fill('Acceptance hello'); await page.getByRole('button',{name:'Send message'}).click();
  await page.waitForTimeout(100); assert.equal(chats.at(-1).message,'Acceptance hello');
  await page.evaluate(()=>window.__emit({busy:true,messages:[{role:'user',content:'Acceptance hello'}]}));
  await textbox.fill('Acceptance steer'); await page.getByRole('button',{name:'Steer Pi'}).click();
  await page.waitForTimeout(100); assert.equal(chats.at(-1).message,'Acceptance steer');
  await page.getByRole('button',{name:'Stop Pi and pause unsent messages'}).click();
  await page.waitForTimeout(100); assert.ok(requests.some(url=>url.endsWith('/api/stop')));
  const before=reads; content='# Refreshed after work';
  await page.evaluate(()=>window.__emit({busy:false,messages:[{role:'assistant',content:'Acceptance reply'}]}));
  await page.getByText('Acceptance reply',{exact:true}).waitFor();
  await page.getByRole('heading',{name:'Refreshed after work'}).waitFor(); assert.ok(reads>before);
 });
 await check('narrow viewport preserves reading, chat, and controls without horizontal overflow',async()=>{
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.ok(await page.getByRole('textbox',{name:'Message Pi'}).isVisible());
  assert.ok(await page.getByRole('heading',{name:'Refreshed after work'}).isVisible());
  await page.getByRole('button',{name:'Close document',exact:true}).click();
  assert.equal(await page.locator('.document-pane').count(),0);
 });
 await check('no page JavaScript errors',async()=>assert.deepEqual(errors,[]));
} finally {
 await browser.close();
 await writeFile(path.join(path.dirname(fileURLToPath(import.meta.url)),'coordinator-browser.json'),JSON.stringify({head,environment:'isolated production build with intercepted HTTP and mocked document/chat/SSE; no live app/provider or native dialog',results},null,2)+'\n');
}
process.exitCode=results.every(r=>r.passed)?0:1;
