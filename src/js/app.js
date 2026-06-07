import { deepseekChat, visionDescribe } from './api.js';
import { MODES, getMode } from './prompts.js';
import { VERSION } from './config.js';
import { runDiagnostics } from './diagnose.js';
import { init as initVoice, speak, stopAll, isSpeaking } from './voice.js';
import { init as initASR, startRecord, stopRecord } from './asr.js';
import { initAvatar, setExpression } from './avatar.js';
import { getMode as savedMode, setMode } from './storage.js';
import { install as installLogger, lastError, getLogs } from './logger.js';

installLogger();
const $=id=>document.getElementById(id);
let mode=getMode(savedMode()),chatMsgs=[],callActive=false;

async function aiReply(t){
  chatMsgs.push({role:'user',content:t});if(chatMsgs.length>14)chatMsgs=chatMsgs.slice(-14);
  return deepseekChat([{role:'system',content:mode.prompt},...chatMsgs]).then(r=>{if(r)chatMsgs.push({role:'assistant',content:r});return r;});
}
async function aiVision(b64){
  const desc=await visionDescribe(b64);if(!desc)return'';
  chatMsgs.push({role:'user',content:`[孩子展示：${desc}]`});if(chatMsgs.length>14)chatMsgs=chatMsgs.slice(-14);
  return deepseekChat([{role:'system',content:mode.prompt},...chatMsgs]).then(r=>{if(r)chatMsgs.push({role:'assistant',content:r});return r;});
}

async function doSpeak(t){
  setExpression('speaking');const ok=await speak(t,mode.voice,()=>{},()=>{});setExpression('default');showBubble(t);
  if(!ok)setStatus('🔇 语音暂不可用');if(callActive)startASRLoop();
}

async function startASRLoop(){
  if(!callActive||isSpeaking())return;
  const ok=await startRecord();
  if(!ok){
    const err=lastError()||'';
    setStatus('⌨️ 麦克风被拒，请在系统设置中允许');
    showErr('请在设置→应用→小深→权限中开启麦克风');
    showTextInput();
  } else { showErr(''); hideTextInput(); setStatus('🎤 小深在听...'); }
}
function stopASRLoop(){stopRecord();}
function onASRResult(t){if(callActive&&!isSpeaking()&&t){setStatus('🤔 小深在想...');processMessage(t);}}
async function processMessage(t){try{const r=await aiReply(t);if(r)doSpeak(r);else startASRLoop();}catch{setStatus('⚠️ 网络错误');startASRLoop();}}

function setStatus(t){const e=document.getElementById('status-text');if(e)e.textContent=t;}
function showErr(t){const e=document.getElementById('err-bar');if(e){if(t){e.textContent='⚠️ '+t;e.style.display='block';}else{e.style.display='none';}}}
function showTextInput(){
  const e=document.getElementById('text-fallback');if(e)e.style.display='flex';
}
function hideTextInput(){
  const e=document.getElementById('text-fallback');if(e)e.style.display='none';
}
function sendText(){
  const inp=document.getElementById('text-inp'),v=inp?.value?.trim();if(!v)return;inp.value='';
  processMessage(v);
}
function showBubble(t){const b=$('bubble'),tx=document.getElementById('bubble-text');if(!b||!tx)return;tx.textContent=t;b.style.display='block';clearTimeout(window._bb);window._bb=setTimeout(()=>b.style.display='none',12000);}

function showHome(){
  callActive=false;stopAll();stopASRLoop();chatMsgs=[];mode=getMode(savedMode());
  let cards=MODES.map(m=>`<button class="mc${mode.id===m.id?' sel':''}" data-id="${m.id}"><span class="mci">${m.icon}</span><span class="mcn">${m.name}</span></button>`).join('');
  $('app').innerHTML=`<div class="home"><div id="err-bar" class="err-bar" style="display:none"></div><div class="ht"><div id="dino-home"></div><div class="hg">你好呀，小朋友！</div><div class="hs">🦕 我是小深，你的AI小伙伴</div></div><div class="mg">${cards}</div><div class="ha"><button id="call-btn" class="big-btn c-orange">📞 打电话</button><button id="cam-btn" class="big-btn c-green">📹 视频通话</button></div><div class="ver">v${VERSION}</div></div>`;
  initAvatar('dino-home');setExpression('default');
  document.querySelectorAll('.mc').forEach(c=>c.addEventListener('click',()=>{mode=getMode(c.dataset.id);setMode(mode.id);showHome();}));
  let pt;const d=document.getElementById('dino-home');if(d){d.addEventListener('pointerdown',()=>{pt=setTimeout(showDiag,3000)});d.addEventListener('pointerup',()=>clearTimeout(pt));d.addEventListener('pointerleave',()=>clearTimeout(pt));}
  $('call-btn').addEventListener('click',enterCall);$('cam-btn').addEventListener('click',enterVideo);
}

async function showDiag(){
  $('app').innerHTML=`<div class="diag"><div class="diag-head"><button id="diag-back" class="diag-back">← 返回</button><span>🔧 诊断中心</span><span>v${VERSION}</span></div><div class="diag-list" id="diag-list">⏳ 检测中...</div><div class="diag-log-w" id="diag-log-w"></div><div class="diag-act"><button id="diag-retry" class="big-btn c-orange" style="max-width:240px">🔄 重新检测</button></div></div>`;
  $('diag-back').addEventListener('click',showHome);$('diag-retry').addEventListener('click',showDiag);
  showLogs();
  const results=await runDiagnostics();
  $('diag-list').innerHTML=results.map(r=>`<div class="diag-item"><span class="diag-icon">${r.ok?'✅':'❌'}</span><span class="diag-name">${r.name}</span><span class="diag-ms">${r.ms}ms</span><span class="diag-d">${r.d}</span></div>`).join('');
}

function showLogs(){
  const logs=getLogs(),el=$('diag-log-w');if(!el)return;
  if(!logs.length){el.innerHTML='<div class="diag-log-t">📋 错误日志：(空)</div>';return;}
  el.innerHTML='<div class="diag-log-t">📋 错误日志（最近20条）</div>'+logs.slice(0,20).map(x=>`<div class="diag-log-e ${x.l==='E'?'dle':''}">${new Date(x.t).toLocaleTimeString()} [${x.l}] ${x.msg}</div>`).join('');
}

function enterCall(){
  callActive=true;chatMsgs=[];
  $('app').innerHTML=`<div class="call"><div id="err-bar" class="err-bar" style="display:none"></div><div id="dino-call"><span style="font-size:3em">🦕</span></div><div id="status-text" class="st">🦕 小深正在连接...</div><div id="bubble" class="bub" style="display:none"><span id="bubble-text"></span></div><div id="text-fallback" class="tf" style="display:none"><input id="text-inp" class="tfi" placeholder="打字跟小深聊天..."><button id="text-send" class="tfb">发送</button></div><div class="ca"><button id="hangup-btn" class="hangup">🔴 挂断</button></div></div>`;
  setTimeout(()=>{try{initAvatar('dino-call');initVoice();initASR({onResult:onASRResult});}catch(e){setStatus('加载失败:'+e.message);}},100);
  setTimeout(()=>{try{$('hangup-btn')?.addEventListener('click',showHome);$('text-send')?.addEventListener('click',sendText);$('text-inp')?.addEventListener('keydown',e=>{if(e.key==='Enter')sendText();});}catch{}},200);
  setTimeout(async()=>{try{const r=await deepseekChat([{role:'system',content:mode.prompt},{role:'user',content:'你好！'}]);if(r){chatMsgs.push({role:'assistant',content:r});doSpeak(r);}else{setStatus('🎤 准备好了');startASRLoop();}}catch(e){setStatus('⚠️ 网络失败');showErr(e.message);}},600);
}

let visionTimer=null;
async function enterVideo(){
  callActive=true;chatMsgs=[];
  $('app').innerHTML=`<div class="cam"><div id="err-bar" class="err-bar cam-err" style="display:none"></div><div class="cw"><video id="cam-video" autoplay playsinline muted></video><canvas id="cam-canvas" style="display:none"></canvas></div><div class="co"><div id="dino-cam" style="width:70px;height:70px"></div><div id="status-text" class="st cam-st">📷 正在启动摄像头...</div><div id="bubble" class="bub cam-bub" style="display:none"><span id="bubble-text"></span></div></div><div class="ca cam-ca"><button id="hangup-btn" class="hangup">🔴 挂断</button></div></div>`;
  initAvatar('dino-cam');initVoice();initASR({onResult:onASRResult});
  $('hangup-btn').addEventListener('click',()=>{const v=$('cam-video');if(v?.srcObject)v.srcObject.getTracks().forEach(t=>t.stop());clearInterval(visionTimer);showHome();});
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:640},height:{ideal:480}},audio:false});
    const v=$('cam-video');if(v){v.srcObject=stream;await v.play();setStatus('📷 摄像头已就绪');showErr('');}
  }catch(e){setStatus('🔒 摄像头被拒');showErr('摄像头: '+(e.name==='NotAllowedError'?'被拒绝':e.message));}
  setTimeout(async()=>{try{const r=await deepseekChat([{role:'system',content:mode.prompt},{role:'user',content:'我们开始视频聊天吧！'}]);if(r){chatMsgs.push({role:'assistant',content:r});doSpeak(r);}else startASRLoop();}catch{setStatus('⚠️ 网络错误');startASRLoop();}},800);
  visionTimer=setInterval(async()=>{
    if(!callActive||isSpeaking())return;
    const v=$('cam-video'),c=$('cam-canvas');if(!v||!c||!v.videoWidth)return;
    c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0,c.width,c.height);
    const b64=c.toDataURL('image/jpeg',0.6).split(',')[1];
    try{setStatus('🔍 让我看看...');const r=await aiVision(b64);if(r){showBubble(r);stopASRLoop();doSpeak(r);}}catch(e){setStatus('⚠️ 识图失败');showErr('识图: '+e.message);}
  },6000);
}

showHome();
