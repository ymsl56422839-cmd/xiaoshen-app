function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('base64 encode failed'));
    reader.readAsDataURL(blob);
  });
}

export async function pcmToWavBase64(samples, sampleRate = 16000) {
  const channels = 1, bps = 16, bytesPerSample = bps / 8;
  const dataSize = samples.length * channels * bytesPerSample;
  const totalSize = 44 + dataSize;
  const buf = new ArrayBuffer(totalSize);
  const v = new DataView(buf);

  // RIFF
  v.setUint8(0,82);v.setUint8(1,73);v.setUint8(2,70);v.setUint8(3,70);       // "RIFF"
  v.setUint32(4, totalSize - 8, true);
  v.setUint8(8,87);v.setUint8(9,65);v.setUint8(10,86);v.setUint8(11,69);     // "WAVE"

  // fmt
  v.setUint8(12,102);v.setUint8(13,109);v.setUint8(14,116);v.setUint8(15,32); // "fmt "
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);                                                    // PCM
  v.setUint16(22, channels, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * channels * bytesPerSample, true);               // byteRate
  v.setUint16(32, channels * bytesPerSample, true);                            // blockAlign
  v.setUint16(34, bps, true);

  // data
  v.setUint8(36,100);v.setUint8(37,97);v.setUint8(38,116);v.setUint8(39,97);  // "data"
  v.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    v.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(samples[i]))), true);
  }

  return blobToBase64(new Blob([buf], { type: 'audio/wav' }));
}
