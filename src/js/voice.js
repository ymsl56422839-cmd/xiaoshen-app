import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { getVoice } from './prompts.js';

let voiceCfg = { pitch:1.0, rate:1.0 };
let onResult = null;
let onState = null;
let audioEl = null;

export function init(cbs) {
  onResult = cbs.onResult;
  onState = cbs.onState;
  audioEl = new Audio();
}

export function setVoice(id) {
  const v = getVoice(id);
  if (v) { voiceCfg = v; }
}

export async function startListen() {
  try {
    await SpeechRecognition.requestPermissions();
    const { available } = await SpeechRecognition.available();
    if (!available) { onState?.('noapi'); return; }
    await SpeechRecognition.start({ language: 'zh-CN', maxResults: 1, popup: false });
    onState?.('listening');
  } catch { onState?.('error'); }
}

export async function stopListen() {
  try {
    const { matches } = await SpeechRecognition.stop();
    SpeechRecognition.removeAllListeners();
    if (matches?.length) onResult?.(matches[0], '');
  } catch {}
  onState?.('end');
}

// TTS: 3-layer fallback
export function speak(text, startCb, endCb) {
  tryNative(text, startCb, endCb);
}

async function tryNative(text, startCb, endCb) {
  try {
    await TextToSpeech.speak({
      text, lang: 'zh-CN', rate: voiceCfg.rate, pitch: voiceCfg.pitch, volume: 1.0
    });
    startCb?.();
    endCb?.();
  } catch {
    // Fallback 1: Web Speech API
    tryWebSpeech(text, startCb, endCb);
  }
}

function tryWebSpeech(text, startCb, endCb) {
  if (!('speechSynthesis' in window)) {
    tryGoogleTTS(text, startCb, endCb);
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN'; u.pitch = voiceCfg.pitch; u.rate = voiceCfg.rate;
  u.onstart = ()=>startCb?.();
  u.onend = ()=>endCb?.();
  u.onerror = ()=>tryGoogleTTS(text, startCb, endCb);
  speechSynthesis.speak(u);
}

function tryGoogleTTS(text, startCb, endCb) {
  const chunks = splitText(text, 180);
  let i = 0;
  startCb?.();
  function play() {
    if (i >= chunks.length) { endCb?.(); return; }
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(chunks[i])}`;
    if (!audioEl) audioEl = new Audio();
    audioEl.src = url;
    audioEl.onended = ()=>{ i++; play(); };
    audioEl.onerror = ()=>{ i++; play(); };
    audioEl.play().catch(()=>{ i++; play(); });
  }
  play();
}

function splitText(text, max) {
  const parts = []; let r = text;
  while (r.length) {
    if (r.length <= max) { parts.push(r); break; }
    let cut = max;
    for (const b of ['。','！','？','，','.',',','!','?']) {
      const idx = r.lastIndexOf(b, max);
      if (idx > max*0.5) { cut = idx+1; break; }
    }
    parts.push(r.slice(0, cut)); r = r.slice(cut);
  }
  return parts;
}

export function stopSpeak() {
  try { TextToSpeech.stop(); } catch {}
  try { speechSynthesis.cancel(); } catch {}
  try { if (audioEl) { audioEl.pause(); audioEl.src=''; } } catch {}
}
