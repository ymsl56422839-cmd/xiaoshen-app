import { deepseekChat, visionDescribe } from './api.js';
import { MODES, getMode } from './prompts.js';
import { init as initVoice, speak, stopAll, isSpeaking } from './voice.js';
import { init as initASR, startRecord, stopRecord } from './asr.js';
import { initAvatar, setExpression } from './avatar.js';
import { getMode as savedMode, setMode } from './storage.js';

const $ = id => document.getElementById(id);

let mode = getMode(savedMode());
let chatMsgs = [];
let camOn = false;
let callActive = false;
let asrTimer = null;

// ===== Chat =====
async function aiReply(userText) {
  chatMsgs.push({ role:'user', content:userText });
  if (chatMsgs.length > 12) chatMsgs = chatMsgs.slice(-12);
  const msgs = [{ role:'system', content: mode.prompt }, ...chatMsgs];
  const reply = await deepseekChat(msgs);
  if (reply) chatMsgs.push({ role:'assistant', content:reply });
  return reply;
}

async function aiVision(base64) {
  const desc = await visionDescribe(base64);
  if (!desc) return;
  const msg = `[孩子给你看了画面：${desc}]`;
  chatMsgs.push({ role:'user', content:msg });
  if (chatMsgs.length > 12) chatMsgs = chatMsgs.slice(-12);
  const msgs = [{ role:'system', content:mode.prompt }, ...chatMsgs];
  const reply = await deepseekChat(msgs);
  if (reply) chatMsgs.push({ role:'assistant', content:reply });
  return reply;
}

// ===== TTS helper =====
function doSpeak(text, voice) {
  setExpression('speaking');
  speak(text, voice||mode.voice,
    ()=>{ setExpression('speaking'); },
    ()=>{
      setExpression('default');
      if (callActive) startASRLoop();
    }
  );
}

// ===== ASR loop (phone call) =====
async function startASRLoop() {
  if (!callActive) return;
  updateStatus('🎤 小深在听...');
  const ok = await startRecord();
  if (!ok) { updateStatus('⌨️ 麦克风未授权，请打字'); return; }
}

function stopASRLoop() {
  stopRecord();
  clearTimeout(asrTimer);
}

function onASRResult(text) {
  if (!callActive || isSpeaking()) return;
  updateStatus('🤔 小深在想...');
  processMessage(text);
}

async function processMessage(text) {
  try {
    const reply = await aiReply(text);
    if (reply) { showBubble(reply); doSpeak(reply, mode.voice); }
    else { updateStatus('🎤 小深在听...'); startASRLoop(); }
  } catch { updateStatus('🎤 小深在听...'); startASRLoop(); }
}

function updateStatus(t) {
  const st = document.getElementById('status-text');
  if (st) st.textContent = t;
}

function showBubble(text) {
  const b = $('bubble');
  const t = document.getElementById('bubble-text');
  if (!b||!t) return;
  t.textContent = text;
  b.style.display = 'block';
  clearTimeout(window._bub);
  window._bub = setTimeout(()=>{ b.style.display='none'; }, 10000);
}

// ===== Home Screen =====
function showHome() {
  callActive = false; camOn = false; chatMsgs = []; stopAll(); stopASRLoop();
  mode = getMode(savedMode());

  let cards = MODES.map(m => `<button class="mc${mode.id===m.id?' sel':''}" data-id="${m.id}"><span class="mci">${m.icon}</span><span class="mcn">${m.name}</span></button>`).join('');

  $('app').innerHTML = `
<div class="home">
  <div class="ht">
    <div id="dino-home"></div>
    <div class="hg">你好呀，小朋友！</div>
    <div class="hs">🦕 我是小深，你的AI小伙伴</div>
  </div>
  <div class="mg">${cards}</div>
  <div class="ha">
    <button id="call-btn" class="big-btn c-orange">📞 打电话</button>
    <button id="cam-btn" class="big-btn c-green">📹 视频通话</button>
  </div>
</div>
<div id="toast" class="toast"></div>`;

  initAvatar('dino-home');
  setExpression('default');

  document.querySelectorAll('.mc').forEach(c=>{
    c.addEventListener('click', ()=>{
      mode = getMode(c.dataset.id);
      setMode(mode.id);
      showToast(`已切换到「${mode.name}」`);
      showHome();
    });
  });

  $('call-btn').addEventListener('click', enterCall);
  $('cam-btn').addEventListener('click', enterVideo);
}

// ===== Call Mode =====
function enterCall() {
  callActive = true; camOn = false; chatMsgs = [];
  $('app').innerHTML = `
<div class="call">
  <div id="dino-call" style="flex:1;display:flex;align-items:center;justify-content:center"></div>
  <div id="status-text" class="st">🦕 小深正在连接...</div>
  <div id="bubble" class="bub" style="display:none"><span id="bubble-text"></span></div>
  <div class="ca">
    <button id="hangup-btn" class="hangup">🔴 挂断</button>
  </div>
</div>
<div id="toast" class="toast"></div>`;

  initAvatar('dino-call');
  initVoice();
  initASR({ onResult: onASRResult });

  $('hangup-btn').addEventListener('click', showHome);

  // AI greets
  setTimeout(async ()=>{
    const msgs = [{ role:'system', content: mode.prompt }, { role:'user', content:'你好！' }];
    const reply = await deepseekChat(msgs);
    if (reply) { chatMsgs.push({ role:'assistant', content:reply }); showBubble(reply); doSpeak(reply, mode.voice); }
    else { startASRLoop(); }
  }, 600);
}

// ===== Video Mode =====
let visionTimer = null;

async function enterVideo() {
  callActive = true; camOn = true; chatMsgs = [];
  $('app').innerHTML = `
<div class="cam">
  <div class="cw"><video id="cam-video" autoplay playsinline muted></video><canvas id="cam-canvas" style="display:none"></canvas></div>
  <div class="co">
    <div id="dino-cam" style="width:70px;height:70px"></div>
    <div id="status-text" class="st cam-st">📷 正在连接...</div>
    <div id="bubble" class="bub cam-bub" style="display:none"><span id="bubble-text"></span></div>
  </div>
  <div class="ca cam-ca">
    <button id="hangup-btn" class="hangup">🔴 挂断</button>
  </div>
</div>
<div id="toast" class="toast"></div>`;

  initAvatar('dino-cam');
  initVoice();
  initASR({ onResult: onASRResult });

  // Start camera
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:'environment',width:{ideal:640},height:{ideal:480}}, audio:false });
    $('cam-video').srcObject = stream;
    await $('cam-video').play();
  } catch { updateStatus('📷 摄像头未授权'); }

  $('hangup-btn').addEventListener('click', ()=>{
    const v = $('cam-video');
    if (v?.srcObject) v.srcObject.getTracks().forEach(t=>t.stop());
    clearInterval(visionTimer);
    showHome();
  });

  // AI greets
  setTimeout(async ()=>{
    const msgs = [{ role:'system', content: mode.prompt }, { role:'user', content:'我们开始视频聊天吧！' }];
    const reply = await deepseekChat(msgs);
    if (reply) { chatMsgs.push({ role:'assistant', content:reply }); showBubble(reply); doSpeak(reply, mode.voice); }
    else { startASRLoop(); }
  }, 600);

  // Vision loop
  visionTimer = setInterval(async ()=>{
    if (!callActive || isSpeaking()) return;
    const v = $('cam-video'), c = $('cam-canvas');
    if (!v||!c) return;
    c.width = v.videoWidth||640; c.height = v.videoHeight||480;
    c.getContext('2d').drawImage(v,0,0,c.width,c.height);
    const b64 = c.toDataURL('image/jpeg',0.7).split(',')[1];
    try {
      updateStatus('🔍 让我看看...');
      const reply = await aiVision(b64);
      if (reply) { showBubble(reply); stopASRLoop(); doSpeak(reply, mode.voice); }
    } catch {}
  }, 6000);
}

// ===== Toast =====
function showToast(m) {
  let t = $('toast');
  if (!t) { t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent=m; t.classList.add('show');
  clearTimeout(window._t); window._t=setTimeout(()=>t.classList.remove('show'),2000);
}

// ===== Boot =====
showHome();
