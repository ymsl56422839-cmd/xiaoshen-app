import { callDeepSeek, callZhipuVision } from './api.js';
import { MODES, getMode } from './prompts.js';
import { init as initVoice, setVoice, startListen, stopListen, speak, stopSpeak } from './voice.js';
import { init as initCam, start as camStart, stop as camStop, snap } from './camera.js';
import { initAvatar, setExpression } from './avatar.js';
import { getMode as savedMode, setMode } from './storage.js';

const $ = id => document.getElementById(id);

let mode = null;       // current learning mode
let chatMsgs = [];     // conversation history
let inCall = false;    // in call screen?
let camOn = false;     // camera active?
let speaking = false;  // TTS active?

// ===== API calls =====
async function aiChat(userText) {
  chatMsgs.push({ role:'user', content: userText });
  // Keep only last 10 messages for context
  if (chatMsgs.length > 12) chatMsgs = chatMsgs.slice(-12);
  const msgs = [{ role:'system', content: mode.prompt }, ...chatMsgs];
  const reply = await callDeepSeek(msgs);
  if (reply) chatMsgs.push({ role:'assistant', content:reply });
  return reply;
}

async function aiVision(base64) {
  const desc = await callZhipuVision(base64);
  if (!desc) return '';
  const msg = `[孩子给你看了画面：${desc}]`;
  chatMsgs.push({ role:'user', content: msg });
  if (chatMsgs.length > 12) chatMsgs = chatMsgs.slice(-12);
  const msgs = [{ role:'system', content: mode.prompt }, ...chatMsgs];
  const reply = await callDeepSeek(msgs);
  if (reply) chatMsgs.push({ role:'assistant', content:reply });
  return { desc, reply };
}

// ===== TTS =====
function doSpeak(text) {
  speaking = true;
  setExpression('speaking');
  speak(text,
    ()=>{},
    ()=>{
      speaking = false;
      setExpression('default');
      updateCallUI();
    }
  );
}

// ===== Home Screen =====
function showHome() {
  inCall = false; camOn = false; chatMsgs = [];
  mode = getMode(savedMode());

  let cards = MODES.map(m =>
    `<div class="mode-card${mode.id===m.id?' active':''}" data-id="${m.id}" style="--card-color:${m.color}">
      <span class="mode-icon">${m.icon}</span><span class="mode-name">${m.name}</span></div>`
  ).join('');

  // Get cute greeting
  const hour = new Date().getHours();
  let greet = hour<12?'早上好':hour<18?'下午好':'晚上好';
  const gs = getStarSign();
  const tip = gs[Math.floor(Math.random()*gs.length)];

  $('app').innerHTML = `
<div class="home">
  <div class="home-top">
    <div id="home-dino"></div>
    <div class="greeting">${greet}，小朋友！</div>
    <div class="subtitle">${tip}</div>
  </div>
  <div class="mode-grid">${cards}</div>
  <div class="home-btns">
    <button id="cam-entry" class="cam-btn">📷 看看周围</button>
  </div>
</div>
<div class="toast" id="toast"></div>`;

  initAvatar('home-dino');
  setExpression('default');

  // Mode click
  document.querySelectorAll('.mode-card').forEach(card=>{
    card.addEventListener('click',()=>{
      const id = card.dataset.id;
      mode = getMode(id);
      setMode(id);
      setVoice(mode.voice);
      showHome(); // refresh active state
      showToast(`切换到了「${mode.name}」`);
      // Quick demo: go to call
      enterCall();
    });
  });

  // Camera entry
  $('cam-entry').addEventListener('click', ()=>{
    setVoice(mode?.voice||'cheerful');
    enterCamera();
  });
}

function getStarSign() {
  return [
    '🦕 我是小深，今天想探索什么？',
    '🦕 你好呀！要不要一起学点新东西？',
    '🦕 小深准备好陪你啦～',
    '🦕 今天天气真好，适合学习哦！',
    '🦕 你笑起来真好看，就像小太阳～',
    '🦕 小恐龙永远是你的好朋友！'
  ];
}

// ===== Call Screen (chat mode) =====
function enterCall() {
  inCall = true; camOn = false; chatMsgs = [];
  showCallScreen();

  // Greeting
  setExpression('thinking');
  setTimeout(async ()=>{
    const msgs = [{ role:'system', content: mode.prompt }, { role:'user', content:'你好！我们聊天吧～' }];
    const reply = await callDeepSeek(msgs);
    if (reply) {
      chatMsgs.push({ role:'assistant', content:reply });
      showBubble(reply);
      doSpeak(reply);
    }
    setExpression('default');
    updateCallUI();
  }, 500);
}

function showCallScreen() {
  $('app').innerHTML = `
<div class="call">
  <div class="call-top">
    <button id="call-back" class="call-back">← 返回</button>
    <span class="call-title">${mode.icon} ${mode.name}</span>
    <div></div>
  </div>
  <div class="call-dino" id="call-dino"></div>
  <div id="bubble" class="bubble" style="display:none">
    <div id="bubble-text" class="bubble-text"></div>
  </div>
  <div class="call-input">
    <input id="text-inp" class="text-inp" placeholder="打字跟小深聊天...">
    <button id="send-btn" class="send-btn">发送</button>
  </div>
</div>
<div class="toast" id="toast"></div>`;

  initAvatar('call-dino');
  initVoice({
    onResult:(text)=>{ if (text) handleUserMsg(text); },
    onState:()=>updateCallUI()
  });

  $('call-back').addEventListener('click', ()=>{ stopSpeak(); showHome(); });
  $('send-btn').addEventListener('click', sendMsg);
  $('text-inp').addEventListener('keydown', e=>{ if (e.key==='Enter') sendMsg(); });

  updateCallUI();
}

function sendMsg() {
  const v = ($('text-inp')?.value||'').trim();
  if (!v) return;
  if ($('text-inp')) $('text-inp').value = '';
  handleUserMsg(v);
}

async function handleUserMsg(text) {
  setExpression('thinking');
  updateCallUI();
  showBubble('...');
  try {
    const reply = await aiChat(text);
    if (reply) {
      showBubble(reply);
      doSpeak(reply);
    }
  } catch { showBubble('网络出错了，再试一次吧'); }
  setExpression('default');
  updateCallUI();
}

function updateCallUI() {
  const st = document.getElementById('call-status');
  if (st) {
    if (speaking) st.textContent = '🦕 小深在说...';
    else st.textContent = '⌨️ 在下面打字聊天吧';
  }
}

function showBubble(text) {
  const b = $('bubble');
  const t = $('bubble-text');
  if (!b||!t) return;
  t.textContent = text;
  b.style.display = 'block';
  clearTimeout(window._bub);
  window._bub = setTimeout(()=>{b.style.display='none'}, 10000);
}

// ===== Camera Screen =====
async function enterCamera() {
  inCall = false; camOn = true; chatMsgs = [];
  $('app').innerHTML = `
<div class="cam-scr">
  <div class="cam-video-wrap">
    <video id="cam-video" autoplay playsinline></video>
    <canvas id="cam-canvas" style="display:none"></canvas>
  </div>
  <div class="cam-top">
    <button id="cam-back" class="cam-back">✕</button>
  </div>
  <div id="cam-hint" class="cam-hint">📷 对准想让我看的东西</div>
  <div class="cam-actions">
    <button id="cam-snap" class="cam-snap-btn">📷 看看这是什么</button>
  </div>
</div>
<div class="toast" id="toast"></div>`;

  initCam({ onSnap: null });
  const ok = await camStart();
  if (!ok) { showToast('摄像头未授权'); showHome(); return; }

  $('cam-back').addEventListener('click', ()=>{ camStop(); showHome(); });
  $('cam-snap').addEventListener('click', async ()=>{
    showToast('🔍 正在识别...');
    const img = snap();
    if (!img) { showToast('拍照失败'); return; }
    try {
      const { desc, reply } = await aiVision(img);
      if (desc) $('cam-hint').textContent = `🔍 ${desc}`;
      if (reply) {
        showToast(`🦕 ${reply.substring(0,40)}...`);
        doSpeak(reply);
      }
    } catch { showToast('识别超时，重试'); }
  });
}

// ===== Toast =====
function showToast(msg) {
  let t = $('toast');
  if (!t) { t = document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._t);
  window._t = setTimeout(()=>t.classList.remove('show'),2000);
}

// ===== Boot =====
showHome();
