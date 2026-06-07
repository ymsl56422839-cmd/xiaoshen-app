import { error as logErr } from './logger.js';

let rec, onResult, onState, listening = false, timer = null;

export function init(cbs) {
  onResult = cbs.onResult;
  onState = cbs.onState;
}

export async function startRecord() {
  if (listening) return true;
  try {
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');

    // Request permission
    try {
      const perm = await SpeechRecognition.requestPermissions();
      logErr('SR权限: ' + JSON.stringify(perm), 'ASR');
    } catch { /* already granted or denied */ }

    const { available } = await SpeechRecognition.available();
    if (!available) { logErr('原生语音识别不可用', 'ASR'); return false; }

    // Remove old listeners
    try { await SpeechRecognition.removeAllListeners(); } catch {}

    SpeechRecognition.addListener('partialResults', data => {
      if (!listening) return;
      if (data.matches?.length) onResult?.(data.matches[0], '');
    });

    await SpeechRecognition.start({ language: 'zh-CN', maxResults: 1, popup: false });
    listening = true;
    onState?.('listening');

    // Auto-stop after 6 seconds silence
    timer = setTimeout(stopRecord, 6000);
    return true;
  } catch (e) {
    logErr('麦克风: ' + (e.name === 'NotAllowedError' ? '被系统拒绝' : e.message), 'ASR');
    return false;
  }
}

export async function stopRecord() {
  clearTimeout(timer);
  if (!listening) return;
  listening = false;
  onState?.('end');
  try {
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
    const r = await SpeechRecognition.stop();
    if (r?.matches?.length) onResult?.(r.matches[0], '');
  } catch {}
}

export function isRecording() { return listening; }
