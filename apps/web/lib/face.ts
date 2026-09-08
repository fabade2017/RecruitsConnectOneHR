'use client';
let modelsLoaded = false;
let loadPromise: Promise<void> | null = null;

export async function loadFaceModels() {
  if (modelsLoaded) return;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const faceapi = await import('@vladmandic/face-api');
    // Use CDN weights — works without local public/models
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model';
    // Fallback CDN if first fails
    const FALLBACK = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
      console.log('face-api models loaded from', MODEL_URL);
    } catch (e) {
      console.warn('primary model CDN failed, trying fallback', e);
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(FALLBACK),
        faceapi.nets.faceLandmark68Net.loadFromUri(FALLBACK),
        faceapi.nets.faceRecognitionNet.loadFromUri(FALLBACK),
      ]);
      modelsLoaded = true;
    }
  })();
  return loadPromise;
}

export async function getDescriptorFromCanvas(canvas: HTMLCanvasElement): Promise<Float32Array | null> {
  try {
    const faceapi = await import('@vladmandic/face-api');
    if (!modelsLoaded) await loadFaceModels();
    const detection: any = await (faceapi as any).detectSingleFace(canvas).withFaceLandmarks().withFaceDescriptor();
    if (!detection || !detection.descriptor) return null;
    return detection.descriptor as Float32Array;
  } catch (e) {
    console.warn('getDescriptor failed', e);
    return null;
  }
}

export async function getDescriptorFromVideo(video: HTMLVideoElement): Promise<Float32Array | null> {
  try {
    const faceapi = await import('@vladmandic/face-api');
    if (!modelsLoaded) await loadFaceModels();
    const detection: any = await (faceapi as any).detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
    if (!detection || !detection.descriptor) return null;
    return detection.descriptor as Float32Array;
  } catch (e) {
    console.warn('getDescriptorFromVideo failed', e);
    return null;
  }
}

export function euclidean(a: number[] | Float32Array, b: number[] | Float32Array) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

export function descriptorToArray(d: Float32Array | number[]): number[] {
  return Array.from(d);
}
