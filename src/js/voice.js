import { ttsSpeak } from './api.js';

let currentAudio = null;

export function init() {}

export function speak(text, voice, onStart, onEnd) {
  stopSpeak();
  const a = new Audio();
  let cleanup = null;
  currentAudio = a;

  const done = () => {
    if (currentAudio === a) currentAudio = null;
    try { a.pause(); a.src = ''; } catch {}
    if (cleanup) { cleanup(); cleanup = null; }
    onEnd?.();
  };

  ttsSpeak(text, voice).then(buf => {
    const blob = new Blob([buf]);
    const url = URL.createObjectURL(blob);
    cleanup = () => URL.revokeObjectURL(url);
    a.src = url; a.load();
  }).catch(() => {
    a.src = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(text)}`;
    a.load();
  });

  a.oncanplaythrough = () => { a.play().catch(() => done()); onStart?.(); };
  a.onended = () => done();
  a.onerror = () => done();
  setTimeout(() => done(), 15000);
}

export function stopSpeak() {
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.removeAttribute('src'); } catch {}
    currentAudio = null;
  }
}

export function isSpeaking() { return !!currentAudio; }
export function stopAll() { stopSpeak(); }
