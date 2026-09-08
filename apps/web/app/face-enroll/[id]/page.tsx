'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { Camera, Check, X, AlertTriangle, ShieldCheck, ArrowLeft, RefreshCw, Eye } from 'lucide-react';

export default function FaceEnrollPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const id = params.id;
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
  const [faceModelReady, setFaceModelReady] = useState(false);
  const loadModels = async () => {
    try { const { loadFaceModels } = await import('../../../lib/face'); await loadFaceModels(); setFaceModelReady(true); } catch { setFaceModelReady(false); }
  };

  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('onehr_token')}` });

  useEffect(() => {
    const t = localStorage.getItem('onehr_token');
    if (!t) { router.push('/login'); return; }
    fetch(`${api}/employees/${id}`, { headers: auth() }).then(r=>r.json()).then(setEmployee).catch(()=> setError('Failed to load employee'));
    fetch(`${api}/employees/${id}/face-profile`, { headers: auth() }).then(r=>r.json()).then(setEnrolled).catch(()=>{});
  }, [id]);

  useEffect(() => { loadModels(); }, []);
  useEffect(() => {
    let s: MediaStream | null = null;
    (async () => {
      try {
        s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
        // Simple face detection via FaceDetector if available
        const check = async () => {
          try {
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
  }, []);

  const snap = async () => {
    if (!videoRef.current) return;
    if (!faceModelReady) {
      setError('Face model still loading — please wait a moment and retry');
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
      const { getDescriptorFromCanvas, descriptorToArray } = await import('../../../lib/face');
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
  };

  const upload = async () => {
    if (captures.length < 1) return setError('Capture at least 1 face image');
    if (descriptors.length !== captures.length) return setError(`Need descriptor for each snap (${descriptors.length}/${captures.length} captured) — retake with face centered and good lighting`);
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
      alert(`Face enrolled ${data.enrolled || captures.length} images with descriptors! Clock-in will now do intelligent biometric matching (Euclidean <0.40).`);
      // Stay on page to show updated enrolled count, user can go to attendance when ready
    } catch (e:any) { setError(e.message); } finally { setSaving(false); }
  };

  if (!employee) return <div className="min-h-screen flex items-center justify-center p-6">Loading employee {id}… {error && <span className="text-red-500">{error}</span>}</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/employees" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft size={16}/> Back to People</Link>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2"><Camera size={22}/> Face Enrollment</h1>
              <p className="text-sm text-slate-500">Employee <b>{employee.employeeCode}</b> • {employee.jobTitle} • {employee.grade} — link: <code className="bg-slate-100 rounded px-2 py-0.5 text-xs">/face-enroll/{id}</code></p>
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
                <div className={`w-[180px] h-[240px] rounded-[36px] border-2 ${faceDetected ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/40'} transition-all`} />
              </div>
              <div className="absolute top-3 left-3 bg-black/60 text-white rounded-full px-3 py-1 text-xs">{faceDetected ? '● Face detected' : '○ Searching…'}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={snap} disabled={!faceDetected || captures.length>=3 || !faceModelReady} className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 font-semibold disabled:opacity-40 flex items-center justify-center gap-2"><Camera size={16}/> Snap {captures.length+1}/3 {!faceModelReady && '(loading model...)'} </button>
              <button onClick={()=>{setCaptures([]); setDescriptors([]);}} className="glass rounded-xl px-4 py-2.5"><RefreshCw size={16}/></button>
            </div>
            {!faceModelReady && <div className="text-xs text-amber-600 mt-1">Face model loading… please wait before capturing</div>}
            <p className="text-xs text-slate-500 mt-2 text-center">Move slightly between snaps: front, left, right. Motion 0.8–12% required for liveness.</p>
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
            <li>Clock-in captures live snapshot + motion (0.8–12%) → liveness.</li>
            <li>Live face compared with enrolled 3 images via string similarity (first 500 chars). &lt;60% → <code>duplicate_face</code> critical, &lt;80% → <code>suspicious</code>.</li>
            <li>No enrolled face → flagged <code>no_enrolled_face</code> for HR to send this link.</li>
            <li>HR can view enrollment status in People → Face column and resend link.</li>
          </ul>
        </GlassCard>
      </div>
    </main>
  );
}
