import { ttsSpeak } from './api.js';

let speaking = false;
export function init() {}
export function isSpeaking() { return speaking; }

export async function speak(text, voice = 'female', startCb, endCb) {
  speaking = true;
  startCb?.();

  // Try GLM-TTS first (WAV format), then fallbacks
  const audio = await tryGLMTTS(text, voice) || await tryWebSpeech(text) || await tryGoogleTTS(text);

  if (audio) {
    audio.addEventListener('ended', () => { speaking = false; endCb?.(); }, { once: true });
    audio.addEventListener('error', () => { speaking = false; endCb?.(); }, { once: true });
  } else {
    speaking = false;
    endCb?.();
  }
}

async function tryGLMTTS(text, voice) {
  try {
    const buf = await ttsSpeak(text, voice);
    const blob = new Blob([buf], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = await playAudio(url, true);
    return a;
  } catch { return null; }
}

function tryWebSpeech(text) {
  if (!('speechSynthesis' in window)) return null;
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; u.rate = 1.0;
    let done = false;
    u.onend = () => { if (!done) { done = true; resolve('ok'); } };
    u.onerror = () => { if (!done) { done = true; resolve(null); } };
    speechSynthesis.speak(u);
    setTimeout(() => { if (!done) { done = true; resolve(null); } }, 15000);
  });
}

function tryGoogleTTS(text) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(text)}`;
  return playAudio(url, false);
}

async function playAudio(url, revoke) {
  return new Promise(resolve => {
    const a = new Audio();
    a.preload = 'auto';
    a.src = url;
    a.oncanplaythrough = () => { a.play().then(() => resolve(a)).catch(() => resolve(null)); };
    a.onerror = () => resolve(null);
    a.load();
    setTimeout(() => resolve(null), 12000);
    if (revoke) { a.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true }); }
  });
}

export function stopAll() {
  try { speechSynthesis.cancel(); } catch {}
}
