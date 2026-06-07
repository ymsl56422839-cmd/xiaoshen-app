import { error as logErr } from './logger.js';

let onResult, onState, listening = false;

export function init(cbs) { onResult = cbs.onResult; onState = cbs.onState; }

export async function startRecord() {
  if (listening) return true;
  try {
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');

    // Don't call requestPermissions — MIUI resets the state
    const { available } = await SpeechRecognition.available();
    if (!available) { logErr('原生语音识别不可用', 'ASR'); return false; }

    try { await SpeechRecognition.removeAllListeners(); } catch {}

    SpeechRecognition.addListener('partialResults', data => {
      if (!listening) return;
      if (data.matches?.length) {
        onResult?.(data.matches[0], '');
        stopRecord(); // got result, stop
      }
    });

    // popup: true → use Android system dictation dialog (works on MIUI)
    await SpeechRecognition.start({ language: 'zh-CN', maxResults: 1, popup: true });
    listening = true;
    onState?.('listening');
    return true;
  } catch (e) {
    logErr('麦克风:' + (e.name === 'NotAllowedError' ? '被系统拒绝' : e.message), 'ASR');
    return false;
  }
}

export function stopRecord() {
  if (!listening) return;
  listening = false;
  onState?.('end');
  import('@capacitor-community/speech-recognition').then(mod => {
    mod.SpeechRecognition.stop().then(r => {
      if (r?.matches?.length) onResult?.(r.matches[0], '');
    }).catch(() => {});
  }).catch(() => {});
}

export function isRecording() { return listening; }
