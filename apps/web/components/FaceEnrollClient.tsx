'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlassCard, Pill } from './ui/GlassCard';
import { Camera, Check, X, AlertTriangle, ShieldCheck, ArrowLeft, RefreshCw, Eye } from 'lucide-react';
import { fetchOrgFeatures } from '../lib/features';
import { makeChallenges, evaluateChallenge, calibrate, detectFaceSample, type Challenge, type FaceMetrics } from '../lib/face';

export default function FaceEnrollClient() {
  const router = useRouter();
  // Static export: no server rewrite may be available, so links use /face-enroll/?id=<uuid>
  // (query) which maps to a real file. Path URLs /face-enroll/<uuid> still work when the
  // Apache rewrite in .htaccess applies (this component then reads the id from the path).
  const [id, setId] = useState<string>('');
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('id');
    if (q) { setId(q); return; }
    const m = window.location.pathname.match(/\/face-enroll\/([^/]+)/);
    if (m) {
      const v = decodeURIComponent(m[1].replace(/\/+$/, ''));
      if (v && v !== 'placeholder') setId(v);
    }
  }, []);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
  const [employee, setEmployee] = useState<any>(null);
  const [enrolled, setEnrolled] = useState<any>(null);
  const [captures, setCaptures] = useState<string[]>([]);
  const [descriptors, setDescriptors] = useState<number[][]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [consent, setConsent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [featureEnabled, setFeatureEnabled] = useState<boolean | null>(null);
  const [faceModelReady, setFaceModelReady] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'active' | 'passed' | 'failed'>('idle');
  const [hint, setHint] = useState('');
  const [progress, setProgress] = useState(0);
  const [yawDir, setYawDir] = useState<'left' | 'center' | 'right'>('center');
  const baseSamples = useRef<FaceMetrics[]>([]);
  const baseline = useRef<Partial<FaceMetrics> | null>(null);
  const blinkClosed = useRef(false);
  const deadline = useRef(0);
  const loadModels = async () => {
    try {
      const m = await import('../lib/face');
      await Promise.all([m.loadFaceModels(), m.loadFastModels()]);
      setFaceModelReady(true);
    } catch { setFaceModelReady(false); }
  };

  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('onehr_token')}` });

  useEffect(() => {
    const t = localStorage.getItem('onehr_token');
    if (!t) { router.push('/login'); return; }
    if (!id) return;
    fetch(`${api}/employees/${id}`, { headers: auth() })
      .then(async r => { const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d?.message || 'Failed to load employee'); return d; })
      .then(setEmployee)
      .catch(e => setError(e.message));
    fetch(`${api}/employees/${id}/face-profile`, { headers: auth() }).then(r=>r.json()).then(setEnrolled).catch(()=>{});
  }, [id]);

  // The <video> only mounts once `employee` resolves, which happens AFTER this
  // effect's stream is set — re-attach the stream whenever the video becomes available.
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream, employee]);

  useEffect(() => { loadModels(); }, []);
  useEffect(() => { fetchOrgFeatures().then(f => setFeatureEnabled(f.faceEnrollment)).catch(()=> setFeatureEnabled(true)); }, []);
  useEffect(() => {
    if (featureEnabled !== true) return;
    let s: MediaStream | null = null;
    (async () => {
      try {
        s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
        // Simple face detection via FaceDetector if available
        const check = async () => {
          try {
            if (!videoRef.current) { setTimeout(check, 800); return; }
            // @ts-ignore
            if (window.FaceDetector) {
              // @ts-ignore
              const d = new window.FaceDetector({ fastMode: true });
              const faces = await d.detect(videoRef.current!);
              setFaceDetected(!!faces.length);
            } else {
              setFaceDetected(true); // fallback: assume face if video playing
            }
          } catch { setFaceDetected(true); }
          setTimeout(check, 800);
        };
        check();
      } catch (e:any) { setError(e.message); }
    })();
    return () => { if (s) s.getTracks().forEach(t=>t.stop()); };
  }, [featureEnabled]);

  const startChallenge = () => {
    setChallenges(makeChallenges(1)); setIdx(0); setPhase('active');
    setHint('Hold still… calibrating'); setProgress(0); setYawDir('center');
  };

  // Auto-start a fresh live challenge whenever we still have angles to capture
  useEffect(() => {
    if (featureEnabled === true && stream && faceModelReady && phase === 'idle' && captures.length < 3) startChallenge();
  }, [featureEnabled, stream, faceModelReady, phase, captures.length]);

  // Live challenge engine — a recorded video/photo cannot answer a random prompt
  useEffect(() => {
    if (phase !== 'active' || !challenges[idx] || featureEnabled !== true) return;
    baseSamples.current = []; baseline.current = null; blinkClosed.current = false;
    deadline.current = Date.now() + 20000; setProgress(0);
    let firstSeen = false;
    let stopped = false;
    const run = async () => {
      if (stopped) return;
      const v = videoRef.current;
      if (v && v.readyState >= 2) {
        const remain = deadline.current - Date.now();
        setProgress(Math.max(0, Math.min(1, 1 - remain / (firstSeen ? 12000 : 20000))));
        if (remain <= 0) { setPhase('failed'); setHint('Time expired — tap Retry'); return; }
        const s = await detectFaceSample(v);
        if (stopped) return;
        if (!s) { setHint('Face not detected — center your face and hold still'); }
        else {
          if (!firstSeen) { firstSeen = true; deadline.current = Date.now() + 12000; setHint('Hold still… calibrating'); }
          setFaceDetected(true);
          setYawDir(s.metrics.yaw > 0.12 ? 'left' : s.metrics.yaw < -0.12 ? 'right' : 'center');
          if (baseSamples.current.length < 6) {
            baseSamples.current.push(s.metrics);
            if (baseSamples.current.length === 6) { baseline.current = calibrate(baseSamples.current); setHint(challenges[idx].hint); }
          } else if (evaluateChallenge(challenges[idx].type, s.metrics, baseline.current, blinkClosed)) {
            setPhase('passed'); setHint('');
            return;
          } else {
            setHint(challenges[idx].hint);
          }
        }
      }
      setTimeout(run, 80);
    };
    run();
    return () => { stopped = true; };
  }, [phase, idx, challenges, featureEnabled]);

  const snap = async () => {
    if (!videoRef.current) return;
    if (!faceModelReady) {
      setError('Face model still loading — please wait a moment and retry');
      return;
    }
    if (phase !== 'passed') {
      setError('Complete the live challenge shown on camera before capturing');
      return;
    }
    const v = videoRef.current;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const b64 = c.toDataURL('image/jpeg', 0.85);
    if (captures.length >= 3) return alert('Max 3 images');
    // Generate descriptor for intelligent matching
    let desc: number[] | null = null;
    try {
      const { getDescriptorFromCanvas, descriptorToArray } = await import('../lib/face');
      const d = await getDescriptorFromCanvas(c);
      if (d) { desc = descriptorToArray(d); }
    } catch (e) { console.warn('descriptor fail', e); }
    if (!desc) {
      setError('No face detected clearly — ensure good lighting, face centered, and retry. Descriptor required for intelligent matching.');
      return;
    }
    setCaptures([...captures, b64]);
    setDescriptors(prev=> [...prev, desc!]);
    setError('');
    if (captures.length + 1 < 3) startChallenge();
    else { setPhase('idle'); setHint(''); }
  };

  const upload = async () => {
    if (captures.length < 1) return setError('Capture at least 1 face image');
    if (descriptors.length === 0) return setError('No face descriptors captured — ensure good lighting, face centered, and retry. Biometric enrollment requires a descriptor.');
    if (!consent) return setError('Consent required');
    setSaving(true); setError('');
    try {
      const res = await fetch(`${api}/employees/${id}/face-profile`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ...auth() },
        body: JSON.stringify({ images: captures, descriptors, consent: true })
      });
      if (!res.ok) {
        const e = await res.json().catch(()=>({message:'Upload failed'}));
        throw new Error(e.message);
      }
      const data = await res.json().catch(()=>({}));
      // Refresh enrolled status
      const refreshed = await fetch(`${api}/employees/${id}/face-profile`, { headers: auth() }).then(r=>r.json()).catch(()=>null);
      if (refreshed) setEnrolled(refreshed);
      setCaptures([]); setDescriptors([]);
      setPhase('idle'); setHint('');
      alert(`Face enrolled ${data.enrolled || captures.length} images with descriptors! Clock-in will now do intelligent biometric matching (Euclidean <0.40).`);
      // Stay on page to show updated enrolled count, user can go to attendance when ready
    } catch (e:any) { setError(e.message); } finally { setSaving(false); }
  };

  if (featureEnabled === false) return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-violet-50/30 p-6">
      <GlassCard className="max-w-lg text-center border-amber-200 bg-amber-50/50">
        <AlertTriangle className="mx-auto text-amber-600" size={28}/>
        <h1 className="text-xl font-bold mt-3">Face enrollment disabled</h1>
        <p className="text-sm text-slate-600 mt-2">
          Facial enrollment has been turned off for your organization by the platform administrator.
          Contact your HR admin if you believe this is a mistake.
        </p>
        <Link href="/employees" className="inline-flex mt-4 items-center gap-2 bg-slate-900 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-slate-800">
          <ArrowLeft size={16}/> Back to People
        </Link>
      </GlassCard>
    </main>
  );

  if (!employee) return <div className="min-h-screen flex items-center justify-center p-6">Loading employee {id}… {error && <span className="text-red-500">{error}</span>}</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/employees" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft size={16}/> Back to People</Link>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2"><Camera size={22}/> Face Enrollment</h1>
              <p className="text-sm text-slate-500">Employee <b>{employee.employeeCode}</b> • {employee.jobTitle} • {employee.grade} — link: <code className="bg-slate-100 rounded px-2 py-0.5 text-xs">/face-enroll/?id={id}</code></p>
            </div>
            <Pill tone={enrolled?.enrolled ? 'emerald' : 'amber'}>{enrolled?.enrolled ? `Enrolled ${enrolled.count}/3` : 'Not enrolled'}</Pill>
          </div>
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
            <div className="font-semibold flex items-center gap-2"><ShieldCheck size={16} className="text-amber-600"/> Consent & retention</div>
            <div className="text-xs text-slate-600 mt-1">By enrolling, you consent to facial liveness for clock-in. Snapshots retained 90 days, flagged only for review, never auto-accused. You can revoke via HR.</div>
            <label className="flex items-center gap-2 mt-2 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I consent to face enrollment for fraud detection</label>
          </div>
        </GlassCard>

        <div className="grid lg:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Camera size={16}/> Camera • Capture 3 angles</h3>
            <div className="mt-3 relative rounded-2xl overflow-hidden bg-slate-900 aspect-[4/3] flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-[180px] h-[240px] rounded-[36px] border-2 ${phase==='passed' ? 'border-emerald-400 bg-emerald-500/10' : faceDetected ? 'border-amber-400 bg-amber-500/10' : 'border-white/40'} transition-all`} />
              </div>
              <div className="absolute top-3 left-3 bg-black/60 text-white rounded-full px-3 py-1 text-xs">{phase==='passed' ? '✓ Liveness verified' : phase==='failed' ? 'Challenge failed' : faceDetected ? '● Face detected' : '○ Searching…'}</div>
              {phase !== 'passed' && challenges[idx] && (
                <div className="absolute top-12 left-3 right-3 bg-black/70 backdrop-blur text-white rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs text-white/70"><span>Live check</span><span>{phase==='failed' ? '✕' : '● LIVE'}</span></div>
                  {phase === 'failed' ? (
                    <div className="mt-1 text-sm font-semibold flex items-center gap-2"><AlertTriangle size={14} className="text-red-400"/> {hint || 'Challenge failed'}</div>
                  ) : (
                    <>
                      <div className="mt-1 text-base font-bold tracking-tight">{challenges[idx].label}</div>
                      <div className="text-xs text-white/70">{hint}</div>
                      <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-amber-400 transition-all" style={{ width: `${Math.round(progress*100)}%` }} /></div>
                    </>
                  )}
                  {phase === 'failed' && <button onClick={startChallenge} className="mt-2 w-full bg-white/15 rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center gap-1"><RefreshCw size={12}/> Retry challenge</button>}
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={snap} disabled={phase!=='passed' || captures.length>=3 || !faceModelReady} className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 font-semibold disabled:opacity-40 flex items-center justify-center gap-2"><Camera size={16}/> {phase==='passed' ? `Snap ${captures.length+1}/3` : 'Answer live prompt'} {!faceModelReady && '(loading model...)'} </button>
              <button onClick={()=>{setCaptures([]); setDescriptors([]); setPhase('idle');}} className="glass rounded-xl px-4 py-2.5"><RefreshCw size={16}/></button>
            </div>
            {!faceModelReady && <div className="text-xs text-amber-600 mt-1">Face model loading… please wait before capturing</div>}
            <p className="text-xs text-slate-500 mt-2 text-center">A random live prompt must be performed before each snap (blink / open mouth / turn head). A recorded video cannot answer it.</p>
            {error && <div className="mt-3 bg-red-50 text-red-700 text-sm p-2 rounded">{error}</div>}
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Eye size={16}/> Captured ({captures.length}/3)</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[0,1,2].map(i=> (
                <div key={i} className="aspect-[3/4] rounded-xl border bg-slate-50 flex items-center justify-center overflow-hidden">
                  {captures[i] ? <img src={captures[i]} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-slate-400">{i+1}</span>}
                </div>
              ))}
            </div>
            {captures.length>0 && (
              <div className="mt-3 space-y-2">
                {captures.map((c,i)=> <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2 text-xs"><img src={c} alt="" className="w-10 h-10 rounded-lg object-cover"/><span className="truncate flex-1">Snap {i+1} • {descriptors[i] ? '✓ descriptor' : '○ no descriptor'}</span><button onClick={()=> { setCaptures(captures.filter((_,idx)=>idx!==i)); setDescriptors(descriptors.filter((_,idx)=>idx!==i)); }} className="text-red-600"><X size={14}/></button></div>)}
              </div>
            )}
            <button onClick={upload} disabled={saving || captures.length===0} className="mt-4 w-full bg-emerald-600 text-white rounded-xl py-3 font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"><ShieldCheck size={16}/>{saving ? 'Uploading…' : `Upload & Enroll ${captures.length} face(s)`}</button>
            <p className="text-xs text-slate-500 mt-2 text-center">Stored as <code>faceProfileRef</code> truncated 8k, compared on clock-in. Duplicate face → <code>duplicate_face</code> critical flagged.</p>
          </GlassCard>
        </div>

        <GlassCard>
          <h3 className="font-semibold">How fraud detection uses this</h3>
          <ul className="mt-2 text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li>Enrolment and clock-in require completing a random live prompt (blink / open mouth / turn head) — a photo or recorded video cannot answer it.</li>
            <li>Live face descriptor compared with enrolled descriptors via Euclidean distance. Distance &gt;0.6 → <code>duplicate_face</code> critical, &gt;0.4 → <code>suspicious</code>. Descriptor is required — image-only captures are rejected.</li>
            <li>No enrolled face → flagged <code>no_enrolled_face</code> for HR to send this link.</li>
            <li>Clock-out is verified against the enrolled face too.</li>
            <li>HR can view enrollment status in People → Face column and resend link.</li>
          </ul>
        </GlassCard>
      </div>
    </main>
  );
}
