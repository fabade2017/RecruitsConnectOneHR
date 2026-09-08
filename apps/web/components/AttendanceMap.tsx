'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import leaflet to avoid SSR
const MapInner = dynamic(() => Promise.resolve(MapComponent), { ssr: false });

function MapComponent({ points, branches }: { points: any[]; branches: any[] }) {
  const [L, setL] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    import('leaflet').then((mod) => setL(mod));
    // inject leaflet css
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);
  if (!isClient || !L) return <div className="h-[400px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">Loading map…</div>;

  // Lazy import react-leaflet
  const { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip } = require('react-leaflet');

  // Fix default icon
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  const center: [number, number] = points.length
    ? [points[0].location.latitude, points[0].location.longitude]
    : branches.find((b:any)=>b.latitude) ? [branches.find((b:any)=>b.latitude).latitude, branches.find((b:any)=>b.latitude).longitude] : [6.4281, 3.4219]; // Lagos fallback

  return (
    <div className="h-[460px] rounded-xl overflow-hidden border">
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {branches.filter((b:any)=>b.latitude && b.longitude).map((b:any)=> (
          <div key={b.id}>
            <Circle center={[b.latitude, b.longitude]} radius={b.gpsRadius || 200} pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.12 }} />
            <Marker position={[b.latitude, b.longitude]}>
              <Popup>
                <div className="text-sm"><div className="font-bold">{b.name}</div><div className="text-xs text-slate-500">{b.address || ''}</div><div className="text-xs">Radius {b.gpsRadius || 200}m</div></div>
              </Popup>
              <Tooltip permanent direction="top" offset={[0,-10]}>{b.name}</Tooltip>
            </Marker>
          </div>
        ))}
        {points.map((p:any)=> (
          <Marker key={p.id} position={[p.location.latitude, p.location.longitude]}>
            <Popup>
              <div className="text-xs space-y-1">
                <div className="font-bold">{p.employeeCode} • {p.jobTitle || ''}</div>
                <div>{p.eventType} @ {new Date(p.timestamp).toLocaleString()}</div>
                <div className="font-mono">{p.location.latitude.toFixed(5)}, {p.location.longitude.toFixed(5)} ±{p.location.accuracy ? Math.round(p.location.accuracy)+'m' : '?'} </div>
                <div className="text-slate-500">via {p.verificationMethod} {p.ipAddress ? '• '+p.ipAddress : ''}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default function AttendanceMap({ points, branches }: { points: any[]; branches: any[] }) {
  return <MapInner points={points} branches={branches} />;
}
