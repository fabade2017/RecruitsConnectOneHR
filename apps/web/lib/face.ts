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

// Lightweight detector + landmark models for per-frame liveness sampling.
// These are tiny (KB) and fast enough to run several times per second; the
// heavy SSD + recognition nets are only used for one-shot descriptor capture.
let fastLoaded = false;
let fastPromise: Promise<void> | null = null;
export async function loadFastModels() {
  if (fastLoaded) return;
  if (fastPromise) return fastPromise;
  fastPromise = (async () => {
    const faceapi = await import('@vladmandic/face-api');
    const urls = [
      '/models',
      'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model',
      'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights',
    ];
    for (const url of urls) {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(url),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(url),
        ]);
        fastLoaded = true;
        console.log('fast face models loaded from', url);
        return;
      } catch (e) { console.warn('fast models failed at', url, e); }
    }
    throw new Error('fast face models unavailable');
  })();
  try { await fastPromise; } catch (e) { fastPromise = null; throw e; }
}
export function fastModelsReady() { return fastLoaded; }

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

export type FaceMetrics = {
  ear: number;
  mouthOpen: number;
  smile: number;
  yaw: number;
};
export type FaceSample = { metrics: FaceMetrics };

export type ChallengeType = 'blink' | 'open_mouth' | 'turn_left' | 'turn_right';
export type Challenge = { type: ChallengeType; label: string; hint: string };
export const ALL_CHALLENGES: Challenge[] = [
  { type: 'blink', label: 'Blink your eyes', hint: 'Close both eyes, then open them' },
  { type: 'open_mouth', label: 'Open your mouth', hint: 'Open wide, then close' },
  { type: 'turn_left', label: 'Turn your head LEFT', hint: 'Slowly look to your left' },
  { type: 'turn_right', label: 'Turn your head RIGHT', hint: 'Slowly look to your right' },
];
export function makeChallenges(n: number): Challenge[] {
  const pool = [...ALL_CHALLENGES];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  return pool.slice(0, n);
}
export function median(nums: number[]) { const s = [...nums].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] || 0; }
export function calibrate(samples: FaceMetrics[]) {
  return {
    ear: median(samples.map(m => m.ear)),
    mouthOpen: median(samples.map(m => m.mouthOpen)),
    smile: median(samples.map(m => m.smile)),
    yaw: median(samples.map(m => m.yaw)),
  };
}
export function evaluateChallenge(type: ChallengeType, m: FaceMetrics, base: Partial<FaceMetrics> | null, blinkRef: { current: boolean }): boolean {
  const b = base || {};
  if (type === 'blink') {
    const openEar = b.ear || 0.3;
    const thr = Math.max(0.14, openEar * 0.6);
    if (m.ear < thr) blinkRef.current = true;
    else if (blinkRef.current && m.ear > openEar * 0.85) { blinkRef.current = false; return true; }
    return false;
  }
  if (type === 'open_mouth') return m.mouthOpen > Math.max(0.32, (b.mouthOpen || 0.05) + 0.16);
  if (type === 'turn_left') return (m.yaw - (b.yaw || 0)) > 0.18;
  if (type === 'turn_right') return (m.yaw - (b.yaw || 0)) < -0.18;
  return false;
}

function dist(a: {x:number;y:number}, b:{x:number;y:number}) { return Math.hypot(a.x-b.x, a.y-b.y); }
function earOf(eye: any[]) {
  if (!eye || eye.length < 6) return 0;
  return (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) / (2 * (dist(eye[0], eye[3]) || 1));
}

export async function detectFaceSample(video: HTMLVideoElement): Promise<FaceSample | null> {
  try {
    const faceapi: any = await import('@vladmandic/face-api');
    if (!fastLoaded) await loadFastModels();
    const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 });
    const det: any = await faceapi.detectSingleFace(video, opts).withFaceLandmarks(true);
    if (!det || !det.landmarks) return null;
    const L = det.landmarks;
    const le = L.getLeftEye(); const re = L.getRightEye();
    const nose = L.getNose(); const mouth = L.getMouth();
    const ear = (earOf(le) + earOf(re)) / 2;
    const mouthW = dist(mouth[0], mouth[6]) || 1;
    const mouthOpen = dist(mouth[14], mouth[18]) / mouthW;
    const eyeMid = { x: (le[0].x+le[3].x+re[0].x+re[3].x)/4, y: (le[0].y+le[3].y+re[0].y+re[3].y)/4 };
    const interocular = dist(le[0], re[3]) || 1;
    const noseTip = nose[3] || nose[Math.floor(nose.length/2)];
    const yaw = (noseTip.x - eyeMid.x) / interocular;
    const smile = mouthW / interocular;
    return { metrics: { ear, mouthOpen, smile, yaw } };
  } catch (e) {
    console.warn('detectFaceSample failed', e);
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
