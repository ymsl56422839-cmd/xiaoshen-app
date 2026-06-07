import { ttsSpeak } from './api.js';

let speaking = false;
export function init() {}
export function isSpeaking() { return speaking; }

export async function speak(text, voice = 'female', startCb, endCb) {
  // Try GLM-TTS first
  let ok = await tryGLMTTS(text, voice);
  if (!ok) ok = await tryWebSpeech(text);
  if (!ok) ok = await tryGoogleTTS(text);

  startCb?.();
  speaking = true;

  // Wait for playback to finish
  if (ok) {
    ok.addEventListener('ended', () => { speaking = false; endCb?.(); }, { once: true });
    ok.addEventListener('error', () => { speaking = false; endCb?.(); }, { once: true });
  } else {
    speaking = false;
    endCb?.();
  }
}

async function tryGLMTTS(text, voice) {
  try {
    const buf = await ttsSpeak(text, voice);
    const blob = new Blob([buf], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    return await playAudio(url, true);
  } catch { return null; }
}

function tryWebSpeech(text) {
  if (!('speechSynthesis' in window)) return null;
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; u.rate = 1.0;
    let resolved = false;
    u.onend = () => { if (!resolved) { resolved = true; resolve(true); } };
    u.onerror = () => { if (!resolved) { resolved = true; resolve(false); } };
    speechSynthesis.speak(u);
    setTimeout(() => { if (!resolved) { resolved = true; resolve(false); } }, 15000);
  }).then(ok => ok ? 'webspeech' : null);
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
    a.oncanplaythrough = () => {
      a.play().then(() => resolve(a)).catch(() => resolve(null));
    };
    a.onerror = () => resolve(null);
    a.load();
    setTimeout(() => resolve(null), 12000);
    if (revoke) { a.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true }); }
  });
}

export function stopAll() {
  try { speechSynthesis.cancel(); } catch {}
}
