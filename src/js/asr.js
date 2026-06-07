import { asrTranscribe } from './api.js';
import { error as logErr } from './logger.js';
import { pcmToWavBase64 } from './wav.js';

let onResult, samples = [], recording = false, timer = null, handle = null, initialized = false;

export function init(cbs) {
  onResult = cbs.onResult;
  initAudioInput();
}

async function initAudioInput() {
  if (initialized) return;
  try {
    const { AudioInput } = await import('cordova-plugin-audioinput');
    const perm = await AudioInput.checkMicrophonePermission();
    if (!perm?.granted) {
      const req = await AudioInput.getMicrophonePermission();
      if (!req?.granted) { logErr('录音权限被拒', 'ASR'); return; }
    }
    await AudioInput.initialize({
      sampleRate: 16000, bufferSize: 4096, channels: 1,
      format: 'PCM_16BIT', normalize: false, audioSourceType: 6
    });
    handle = AudioInput.addListener('audioData', (event) => {
      if (!recording) return;
      for (const sample of event.data) samples.push(sample);
    });
    initialized = true;
  } catch (e) { logErr('录音初始化:' + e.message, 'ASR'); }
}

export async function startRecord() {
  if (recording) return true;
  if (!initialized) await initAudioInput();
  if (!initialized) return false;
  try {
    const { AudioInput } = await import('cordova-plugin-audioinput');
    samples = [];
    await AudioInput.start();
    recording = true;
    clearTimeout(timer);
    timer = setTimeout(stopRecord, 3000);
    return true;
  } catch (e) { logErr('录音启动:' + e.message, 'ASR'); return false; }
}

export async function stopRecord() {
  clearTimeout(timer);
  if (!recording) return;
  recording = false;
  try {
    const { AudioInput } = await import('cordova-plugin-audioinput');
    await AudioInput.stop();
  } catch {}
  if (samples.length < 500) { onResult?.(''); return; }
  try {
    const b64 = pcmToWavBase64(samples, 16000);
    const text = await asrTranscribe(b64);
    if (text?.trim()) onResult?.(text.trim());
    else onResult?.('');
  } catch (e) { logErr('ASR识别:' + e.message, 'ASR'); onResult?.(''); }
}

export function isRecording() { return recording; }
