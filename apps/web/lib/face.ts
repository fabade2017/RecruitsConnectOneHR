'use client';
let modelsLoaded = false;
let loadPromise: Promise<void> | null = null;

export async function loadFaceModels() {
  if (modelsLoaded) return;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const faceapi = await import('@vladmandic/face-api');
    // Try local public/models first (most reliable, no CDN CORS), then CDN fallbacks
    const LOCAL = '/models';
    const CDN = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
    const FALLBACK = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
    const tryLoad = async (url: string) => {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(url),
        faceapi.nets.faceLandmark68Net.loadFromUri(url),
        faceapi.nets.faceRecognitionNet.loadFromUri(url),
      ]);
    };
    try {
      await tryLoad(LOCAL);
      modelsLoaded = true;
      console.log('face-api models loaded from', LOCAL);
      return;
    } catch (e) { console.warn('local models failed, trying CDN', e); }
    try {
      await tryLoad(CDN);
      modelsLoaded = true;
      console.log('face-api models loaded from', CDN);
      return;
    } catch (e) { console.warn('CDN failed, trying fallback', e); }
    await tryLoad(FALLBACK);
    modelsLoaded = true;
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
