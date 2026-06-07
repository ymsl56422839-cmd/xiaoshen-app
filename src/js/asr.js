import { asrTranscribe } from './api.js';
import { error as logErr } from './logger.js';
import { pcmToWavBase64 } from './wav.js';

let onResult, samples = [], recording = false, timer = null, handle = null;

export function init(cbs) { onResult = cbs.onResult; }

export async function startRecord() {
  if (recording) return true;
  try {
    const { AudioInput } = await import('cordova-plugin-audioinput');

    // Check permission
    const perm = await AudioInput.checkMicrophonePermission();
    if (!perm?.granted) {
      const req = await AudioInput.getMicrophonePermission();
      if (!req?.granted) { logErr('录音权限被拒', 'ASR'); return false; }
    }

    // Initialize: 16kHz mono PCM_16BIT, VOICE_RECOGNITION source (Xiaomi fix)
    await AudioInput.initialize({
      sampleRate: 16000,
      bufferSize: 4096,
      channels: 1,
      format: 'PCM_16BIT',
      normalize: false,          // raw Int16 values
      audioSourceType: 6,        // VOICE_RECOGNITION — Xiaomi fix
    });

    samples = [];
    handle = AudioInput.addListener('audioData', (event) => {
      if (!recording) return;
      for (const sample of event.data) samples.push(sample);
    });

    await AudioInput.start();
    recording = true;
    clearTimeout(timer);
    timer = setTimeout(stopRecord, 6000);
    return true;
  } catch (e) {
    logErr('录音启动:' + e.message, 'ASR');
    return false;
  }
}

export async function stopRecord() {
  clearTimeout(timer);
  if (!recording) return;
  recording = false;

  try {
    const { AudioInput } = await import('cordova-plugin-audioinput');
    await AudioInput.stop();
    if (handle) { handle.remove(); handle = null; }
  } catch {}

  if (samples.length < 500) {  // < ~30ms at 16kHz — probably silence
    onResult?.('');
    return;
  }

  try {
    logErr('录音样本数:' + samples.length, 'ASR');
    const b64 = pcmToWavBase64(samples, 16000);
    logErr('WAV长度:' + (b64?.length || 0), 'ASR');
    const text = await asrTranscribe(b64);
    if (text?.trim()) onResult?.(text.trim());
    else onResult?.('');
  } catch (e) {
    logErr('ASR识别:' + e.message, 'ASR');
    onResult?.('');
  }
}

export function isRecording() { return recording; }
