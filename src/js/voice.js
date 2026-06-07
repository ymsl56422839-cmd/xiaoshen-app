import { ttsSpeak } from './api.js';

let audioEl = null;
let speaking = false;

export function init() {
  audioEl = new Audio();
}

export function isSpeaking() { return speaking; }

export async function speak(text, voice = 'tongtong', startCb, endCb) {
  try {
    // Try GLM-TTS first
    const buf = await ttsSpeak(text, voice);
    const blob = new Blob([buf], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);

    if (!audioEl) audioEl = new Audio();
    stopAll();
    audioEl.src = url;
    audioEl.onplay = () => { speaking = true; startCb?.(); };
    audioEl.onended = () => { speaking = false; endCb?.(); URL.revokeObjectURL(url); };
    audioEl.onerror = () => { speaking = false; fallbackTTS(text, startCb, endCb); };
    await audioEl.play();
  } catch {
    fallbackTTS(text, startCb, endCb);
  }
}

function fallbackTTS(text, startCb, endCb) {
  // Android native (via Capacitor plugin or Web Speech)
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; u.rate = 1.0; u.pitch = 1.1;
    u.onstart = () => { speaking = true; startCb?.(); };
    u.onend = () => { speaking = false; endCb?.(); };
    u.onerror = () => { speaking = false; googleFallback(text, startCb, endCb); };
    speechSynthesis.speak(u);
  } else {
    googleFallback(text, startCb, endCb);
  }
}

function googleFallback(text, startCb, endCb) {
  startCb?.();
  speaking = true;
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(text)}`;
  if (!audioEl) audioEl = new Audio();
  audioEl.src = url;
  audioEl.onended = () => { speaking = false; endCb?.(); };
  audioEl.onerror = () => { speaking = false; endCb?.(); };
  audioEl.play().catch(() => { speaking = false; endCb?.(); });
}

export function stopAll() {
  try {
    if (audioEl) { audioEl.pause(); audioEl.src = ''; }
    speechSynthesis.cancel();
  } catch {}
  speaking = false;
}
