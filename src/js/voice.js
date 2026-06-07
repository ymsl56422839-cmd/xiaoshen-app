import { ttsSpeak } from './api.js';

export function init() {}

export function speak(text, voice = 'female') {
  return new Promise(resolve => {
    const a = new Audio();
    let cleanup = null;

    const done = () => {
      try { a.pause(); a.src = ''; } catch {}
      if (cleanup) cleanup();
      resolve();
    };

    // Try GLM-TTS, fallback to Google
    ttsSpeak(text, voice).then(buf => {
      const blob = new Blob([buf]);
      cleanup = () => URL.revokeObjectURL(URL.createObjectURL(blob));
      a.src = URL.createObjectURL(blob);
      a.load();
    }).catch(() => {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(text)}`;
      a.src = url;
      a.load();
    });

    a.oncanplaythrough = () => a.play().catch(() => done());
    a.onended = () => done();
    a.onerror = () => done();
    setTimeout(() => done(), 15000);
  });
}

export function stopAll() {}
export function isSpeaking() { return false; }
