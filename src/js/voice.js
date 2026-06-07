import { ttsSpeak } from './api.js';

let audioEl, speaking = false;
export function init() { audioEl = new Audio(); }
export function isSpeaking() { return speaking; }

export async function speak(text, voice = 'tongtong', startCb, endCb) {
  startCb?.();
  const ok = await tryGLMTTS(text, voice) || await tryWebSpeech(text) || await tryGoogleTTS(text);
  if (!ok) endCb?.(); // all failed, caller should show text bubble
  const origEndCb = endCb;
  endCb = () => { speaking = false; origEndCb?.(); };
}

async function tryGLMTTS(text, voice) {
  try {
    const buf = await ttsSpeak(text, voice);
    const blob = new Blob([buf], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    return await playAudio(url);
  } catch { return false; }
}

function tryWebSpeech(text) {
  if (!('speechSynthesis' in window)) return false;
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; u.rate = 1.0;
    u.onstart = () => { speaking = true; };
    u.onend = () => { speaking = false; resolve(true); };
    u.onerror = () => { speaking = false; resolve(false); };
    speechSynthesis.speak(u);
  });
}

function tryGoogleTTS(text) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(text)}`;
  return playAudio(url);
}

function playAudio(url) {
  return new Promise(resolve => {
    if (!audioEl) audioEl = new Audio();
    audioEl.src = url;
    audioEl.onplay = () => { speaking = true; };
    audioEl.onended = () => { speaking = false; resolve(true); URL.revokeObjectURL(url); };
    audioEl.onerror = () => { speaking = false; resolve(false); };
    audioEl.play().catch(() => { speaking = false; resolve(false); });
  });
}

export function stopAll() {
  try { audioEl?.pause(); audioEl && (audioEl.src = ''); } catch {}
  try { speechSynthesis.cancel(); } catch {}
}
