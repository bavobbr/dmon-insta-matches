import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const repo = process.cwd();
const fixture = fs.mkdtempSync('/tmp/dmon-framing-ui-');
fs.mkdirSync(path.join(fixture, 'public'), { recursive: true });
fs.symlinkSync(path.join(repo, 'public', 'photos'), path.join(fixture, 'public', 'photos'));
fs.symlinkSync(path.join(repo, 'dist'), path.join(fixture, 'dist'));
for (const file of ['dmon-logo-round-transparant.png']) if (fs.existsSync(path.join(repo, 'public', file))) fs.copyFileSync(path.join(repo, 'public', file), path.join(fixture, 'public', file));
let serverCode = fs.readFileSync(path.join(repo, 'dist/server.cjs'), 'utf8');
assert.ok(serverCode.includes('var PORT = 3e3;'));
serverCode = serverCode.replace('var PORT = 3e3;', 'var PORT = 0;').replace('app.listen(PORT, "0.0.0.0", () => {', 'const listener = app.listen(PORT, "127.0.0.1", () => { process.send({ port: listener.address().port });');
const server = spawn(process.execPath, ['-e', serverCode], { cwd: fixture, env: { ...process.env, NODE_PATH: path.join(repo, 'node_modules'), NODE_ENV: 'production', TWIZZIT_USERNAME: '', TWIZZIT_PASSWORD: '', INSTAGRAM_ACCOUNT_ID: '', INSTAGRAM_ACCESS_TOKEN: '', APP_AUTH_USER: 'fixture', APP_AUTH_PASSWORD: 'fixture' }, stdio: ['ignore','ignore','pipe','ipc'] });
let chrome;
let socket;
try {
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timeout')), 10000);
    let stderr = '';
    server.stderr.on('data', chunk => { stderr += chunk; });
    server.once('message', message => { clearTimeout(timer); resolve(message.port); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exit ${code}: ${stderr}`)); });
  });
  chrome = spawn(process.env.CHROME_BIN || '/usr/bin/google-chrome', ['--headless=new','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=0',`--user-data-dir=${fixture}/chrome`,'about:blank'], { stdio: ['ignore','ignore','pipe'] });
  const endpoint = await new Promise((resolve,reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome startup timeout')), 10000);
    let stderr = '';
    chrome.stderr.on('data', chunk => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    chrome.once('exit', code => { clearTimeout(timer); reject(new Error(`Chrome exit ${code}: ${stderr}`)); });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve,reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const exceptions = [];
  socket.onmessage = message => {
    const data = JSON.parse(message.data);
    if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails.text);
    const promise = pending.get(data.id);
    if (promise) { pending.delete(data.id); data.error ? promise.reject(new Error(JSON.stringify(data.error))) : promise.resolve(data.result); }
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve,reject) => {
    const id = ++nextId;
    pending.set(id, {resolve,reject});
    socket.send(JSON.stringify({id,method,params,sessionId}));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (method, params) => send(method, params, sessionId);
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1300, deviceScaleFactor: 1, mobile: false });
  const mockScript = `
    localStorage.setItem('dmon_auth_token', 'fixture-session');
    localStorage.setItem('dmon_auth_user', JSON.stringify({ username:'fixture',displayName:'Test',token:'fixture-session' }));
    const actualFetch = window.fetch.bind(window);
    window.__downloads = [];
    HTMLAnchorElement.prototype.click = function () { window.__downloads.push({name:this.download,href:this.href}); };
    window.fetch = async (input, options) => {
      const url = String(input);
      if (url.includes('/api/twizzit/status')) return new Response(JSON.stringify({success:true,currentSeason:{name:'2026-2027'}}));
      if (url.includes('/api/twizzit/matches')) return new Response(JSON.stringify({success:true,cached:true,matches:[
        {id:'sat',day:'Saturday',dateStr:'Za 3 oktober',time:'10u00',homeTeam:'D-Mon U12G-1',awayTeam:'Gantoise',displayMatchText:'U12G-1 - Gantoise',category:'U12',isHome:true,field:'Veld 1'},
        {id:'sun',day:'Sunday',dateStr:'Zo 4 oktober',time:'12u15',homeTeam:'D-Mon Dames 1',awayTeam:'Dragons',displayMatchText:'Dames 1 - Dragons',category:'Dames',isHome:true,field:'Veld 2'}
      ]}));
      if (url === '/api/instagram/publish') { window.__publishPayload=JSON.parse(options.body); return new Response(JSON.stringify({success:true,id:'fixture-published'})); }
      return actualFetch(input,options);
    };
  `;
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: mockScript });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${port}` });
  const waitFor = async expression => {
    const deadline = Date.now()+15000;
    while (Date.now()<deadline) {
      if (await evaluate(expression)) return;
      await new Promise(resolve => setTimeout(resolve,50));
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const ready = () => waitFor("!!document.querySelector('#btn-download-graphic') && !document.querySelector('#btn-download-graphic').disabled");
  const saved = () => evaluate("JSON.parse(localStorage.getItem('dmon_graphic_settings'))");
  const clickText = async text => { await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(text)}).click()`); await ready(); };
  const slider = async (id,value) => {
    await evaluate(`(() => { const input=document.getElementById(${JSON.stringify(id)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(String(value))}); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
    await ready();
  };
  await ready();
  assert.equal((await saved()).photoZoom,1);
  assert.equal((await saved()).splitRatio,0.44);
  const photoPane = async () => evaluate("(() => { const r = document.querySelector('[aria-label=\"Foto verslepen; scroll of knijp om te zoomen\"]').getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })()");
  let rect = await photoPane();
  const x = rect.x+rect.width/2;
  const y = rect.y+rect.height/2;
  await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
  await waitFor("!!document.querySelector('[role=status]')");
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+45,y:y+20,button:'left',buttons:1});
  await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+45,y:y+20,button:'left',buttons:0,clickCount:1});
  await ready();
  assert.notEqual((await saved()).photoOffsetX,0);
  await cdp('Input.dispatchMouseEvent',{type:'mouseWheel',x,y,deltaX:0,deltaY:-180});
  await ready();
  assert.ok((await saved()).photoZoom>1);
  await slider('photo-zoom',170);
  assert.equal((await saved()).photoZoom,1.7);
  await clickText('Boven'); assert.equal((await saved()).photoOffsetY,-1);
  await clickText('Onder'); assert.equal((await saved()).photoOffsetY,1);
  await clickText('Links'); assert.equal((await saved()).photoOffsetX,-1);
  await clickText('Rechts'); assert.equal((await saved()).photoOffsetX,1);
  await clickText('Centreer'); assert.equal((await saved()).photoOffsetX,0); assert.equal((await saved()).photoZoom,1.7);
  await clickText('Herstel uitsnede'); assert.equal((await saved()).photoZoom,1); assert.equal((await saved()).photoOffsetY,0);
  await evaluate("document.querySelector('#btn-format-square').click()"); await ready(); assert.equal((await saved()).splitRatio,0.42);
  await slider('photo-split',52); await slider('photo-zoom',180);
  await evaluate("document.querySelector('details summary').click()");
  await slider('photo-photoOffsetX',-55); await slider('photo-photoOffsetY',40);
  const framing = await saved();
  await evaluate("document.querySelector('#btn-format-story').click()"); await ready();
  assert.equal((await saved()).splitRatio,0.52); assert.equal((await saved()).photoOffsetX,framing.photoOffsetX); assert.equal((await saved()).photoOffsetY,framing.photoOffsetY);
  // Real touch pointers: single-finger pan, then two-finger pinch.
  rect = await photoPane();
  const tx=rect.x+rect.width/2, ty=rect.y+rect.height/2;
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx-20,y:ty,id:1}]});
  await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx-10,y:ty-20,id:1}]});
  await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx-10,y:ty-20,id:1},{x:tx+20,y:ty+20,id:2}]});
  const beforePinch = (await saved()).photoZoom;
  await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx-30,y:ty-40,id:1},{x:tx+40,y:ty+40,id:2}]});
  await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await ready(); assert.ok((await saved()).photoZoom>beforePinch);
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:false});
  await slider('photo-zoom',160);
  const finalSettings = await saved();
  await cdp('Page.reload'); await ready();
  assert.equal((await saved()).photoZoom,finalSettings.photoZoom);
  assert.equal((await saved()).photoOffsetX,finalSettings.photoOffsetX);
  assert.equal((await saved()).photoOffsetY,finalSettings.photoOffsetY);
  const expectedPNG = await evaluate("document.querySelector('#btn-quick-shuffle').parentElement.querySelector('canvas').toDataURL('image/png',1)");
  await evaluate("document.querySelector('#btn-download-graphic').click()");
  assert.equal(await evaluate('window.__downloads[0].href'),expectedPNG);
  const screenshot = await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(fixture, 'preview.png'),Buffer.from(screenshot.data,'base64'));
  const expectedJPEG = await evaluate("document.querySelector('#btn-quick-shuffle').parentElement.querySelector('canvas').toDataURL('image/jpeg',0.95)");
  await evaluate("document.querySelector('#btn-publish-instagram-modal').click()");
  await waitFor("!!document.querySelector('img[alt=\"Match Graphic\"]')");
  assert.equal(await evaluate("document.querySelector('img[alt=\"Match Graphic\"]').src"),expectedJPEG);
  await evaluate("document.querySelector('#btn-publish-to-instagram-confirm').click()");
  await waitFor('!!window.__publishPayload');
  assert.equal(await evaluate('window.__publishPayload.imageDataUrl'),expectedJPEG);
  assert.equal(await evaluate('window.__publishPayload.mediaType'),'STORY');
  assert.deepEqual(exceptions,[]);
  console.log(`Preview screenshot: ${fixture}/preview.png`);
  console.log('Browser checks passed: drag, wheel, sliders, all presets, reset, format defaults/custom split, touch pan/pinch, persistence, PNG download and JPEG Instagram payload parity. No live publishing requests were sent.');
} finally {
  socket?.close();
  chrome?.kill();
  server.kill();
}
