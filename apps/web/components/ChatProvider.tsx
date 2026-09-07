'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiUrl } from '../lib/api';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, X } from 'lucide-react';

type Popup = { id:string; content:string; sender:string; convId:string };

export default function ChatProvider(){
  const [popups, setPopups] = useState<Popup[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const pathname = usePathname();
  const socketRef = useRef<Socket|null>(null);

  useEffect(()=>{
    const token = typeof window!=='undefined' ? localStorage.getItem('onehr_token') : null;
    if(!token) return;
    const api = getApiUrl();
    const base = api.replace(/\/v1\/?$/,'');
    const s = io(`${base}/chat`, { auth:{ token }, transports:['websocket','polling']});
    socketRef.current = s;
    s.on('message:notify', (p:any)=>{
      const { conversationId, message } = p;
      // if already on that chat, don't popup
      if(pathname?.includes('/chat')) return;
      const id = Date.now().toString()+Math.random();
      setPopups(prev=> [...prev.slice(-2), { id, content: message.content, sender: message.sender?.email||'Someone', convId: conversationId }]);
      setTimeout(()=> setPopups(prev=> prev.filter(x=>x.id!==id)), 5000);
      setUnread((v: number)=> {
        const nv = v+1;
        try { localStorage.setItem('onehr_chat_unread', String(nv)); window.dispatchEvent(new CustomEvent('chat:unread', { detail: nv })); } catch {}
        return nv;
      });
      if(typeof Notification !== 'undefined' && Notification.permission==='granted'){
        new Notification(message.sender?.email||'New message', { body: message.content.slice(0,100)});
      }
    });
    s.on('message:new', ()=> setUnread((v: number)=> {
      const nv = v+1;
      try { localStorage.setItem('onehr_chat_unread', String(nv)); window.dispatchEvent(new CustomEvent('chat:unread', { detail: nv })); } catch {}
      return nv;
    }));
    // poll unread count initially
    fetch(`${api}/chat/unread/count`, { headers:{ Authorization:`Bearer ${token}` }})
      .then(r=>r.json()).then(d=> {
        const tot = d.total||0;
        setUnread(tot);
        try { localStorage.setItem('onehr_chat_unread', String(tot)); window.dispatchEvent(new CustomEvent('chat:unread', { detail: tot })); } catch {}
      }).catch(()=>{});
    const onFocus = ()=> {
      // when user focuses window, could clear? keep simple
    };
    window.addEventListener('focus', onFocus);
    if(typeof Notification !== 'undefined' && Notification.permission==='default') Notification.requestPermission().catch(()=>{});
    return ()=>{ s.disconnect(); window.removeEventListener('focus', onFocus); };
  },[pathname]);

  // Also poll unread every 30s as fallback
  useEffect(()=>{
    const api=getApiUrl();
    const id=setInterval(async()=>{
      const token=localStorage.getItem('onehr_token');
      if(!token) return;
      try{
        const r=await fetch(`${api}/chat/unread/count`, { headers:{ Authorization:`Bearer ${token}` }});
        const d=await r.json();
        const tot=d.total||0;
        setUnread(tot);
        try { localStorage.setItem('onehr_chat_unread', String(tot)); window.dispatchEvent(new CustomEvent('chat:unread', { detail: tot })); } catch {}
      }catch{}
    },30000);
    return ()=>clearInterval(id);
  },[]);

  // Broadcast unread to Sidebar via event/localStorage when unread changes
  useEffect(()=>{
    try { localStorage.setItem('onehr_chat_unread', String(unread)); window.dispatchEvent(new CustomEvent('chat:unread', { detail: unread })); } catch {}
  },[unread]);

  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2 pointer-events-none">
      {popups.map(p=> (
        <div key={p.id} className="pointer-events-auto bg-slate-900 text-white rounded-xl px-4 py-3 shadow-2xl border border-white/10 min-w-[300px] flex gap-3 items-start animate-in slide-in-from-top">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><MessageCircle size={14}/></div>
          <div className="flex-1 min-w-0">
            <div className="text-xs opacity-70 truncate">{p.sender}</div>
            <div className="text-sm font-medium truncate">{p.content.slice(0,80)}</div>
            <Link href="/chat" onClick={()=>setPopups([])} className="text-xs text-emerald-300 hover:text-emerald-200">Open chat →</Link>
          </div>
          <button onClick={()=>setPopups(prev=> prev.filter(x=>x.id!==p.id))} className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center"><X size={14}/></button>
        </div>
      ))}
      {/* unread badge floating? Sidebar will fetch separately, but we dispatch event */}
    </div>
  );
}
