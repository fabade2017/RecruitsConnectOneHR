'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { getApiUrl, getAuthHeaders } from '../../../lib/api';
import { io, Socket } from 'socket.io-client';
import { Send, Search, Users, MessageCircle, Plus, X, Check, CheckCheck, MoreVertical, Trash2, LogOut, Edit3, UserPlus, ArrowLeft, Smile, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';

type User = { id: string; email: string; role: string; employee?: any };
type Conversation = {
  id: string; type: string; name?: string; lastMessagePreview?: string; lastMessageAt?: string;
  participants: { userId: string; role: string; user: User; employee?: any }[];
  messages?: any[]; unreadCount?: number; avatarUrl?: string;
};
type Message = {
  id: string; conversationId: string; senderId: string; content: string; createdAt: string;
  sender?: User; isEdited?: boolean; isDeleted?: boolean; replyToId?: string; replyTo?: any;
  messageType?: string; attachments?: string | any[]; expiresAt?: string | null;
};

const EMOJIS = ['😀','😂','😍','🥰','😊','👍','👏','🙏','❤️','🔥','🎉','✨','😎','🤔','😢','😡','👌','💯','✅','⭐','🚀','💼','📎','🙌'];

function getToken() { if (typeof window === 'undefined') return null; return localStorage.getItem('onehr_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('onehr_user')||'null'); } catch { return null; } }
function displayName(conv: Conversation, meId: string) {
  if (conv.type === 'group') return conv.name || 'Group';
  const other = conv.participants.find(p=>p.userId!==meId);
  return other?.user?.email?.split('@')[0] || other?.employee?.employeeCode || 'Unknown';
}
function avatarText(name: string) { return (name||'?').slice(0,2).toUpperCase(); }

export default function ChatPage() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newType, setNewType] = useState<'direct'|'group'>('direct');
  const [picked, setPicked] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string,string[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showConvMenu, setShowConvMenu] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const socketRef = useRef<Socket|null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const me = getUser();
  const meId = me?.id || me?.sub || '';

  const api = getApiUrl();
  const authHeaders = () => getAuthHeaders() as any;

  const fetchConvs = useCallback(async (q='')=>{
    const res = await fetch(`${api}/chat/conversations${q?`?search=${encodeURIComponent(q)}`:''}`, { headers: authHeaders()});
    if(!res.ok) return;
    const data = await res.json();
    const arr = Array.isArray(data) ? data : (data.items||data.data||[]);
    setConvs(arr);
    const tot = arr.reduce((s:number,c:any)=>s+(c.unreadCount||0),0);
    setUnreadTotal(tot);
  },[api]);

  const fetchMessages = useCallback(async (convId: string)=>{
    setLoadingMsgs(true);
    try{
      const res = await fetch(`${api}/chat/conversations/${convId}/messages?limit=100&order=asc`, { headers: authHeaders()});
      const data = await res.json();
      const items = data.items || data || [];
      setMessages(Array.isArray(items)?items:[]);
      // mark read
      await fetch(`${api}/chat/conversations/${convId}/read`, { method:'POST', headers:{...authHeaders(),'Content-Type':'application/json'}, body: JSON.stringify({})});
      setConvs(prev=>prev.map(c=> c.id===convId? {...c, unreadCount:0}:c));
      setTimeout(()=> listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior:'smooth'}), 50);
    } finally { setLoadingMsgs(false);}
  },[api]);

  const searchUsersFn = async (q:string)=>{
    const res = await fetch(`${api}/chat/users/search?q=${encodeURIComponent(q)}`, { headers: authHeaders()});
    if(!res.ok) return;
    const data = await res.json();
    setUsers(Array.isArray(data)?data: (data.items||[]));
  };

  // init socket
  useEffect(()=>{
    const token = getToken();
    if(!token) return;
    const base = api.replace(/\/v1\/?$/, '');
    const s = io(`${base}/chat`, { auth:{ token }, transports:['websocket','polling']});
    socketRef.current = s;
    s.on('connect', ()=>{ console.log('chat socket connected'); });
    s.on('message:new', (msg: Message)=>{
      if(msg.conversationId===selected){
        setMessages(prev=> prev.find(m=>m.id===msg.id)?prev: [...prev, msg]);
        // mark read immediately if we are viewing
        fetch(`${api}/chat/conversations/${msg.conversationId}/read`, { method:'POST', headers:{...authHeaders(),'Content-Type':'application/json'}, body: JSON.stringify({ messageId: msg.id })}).catch(()=>{});
        s.emit('message:read', { conversationId: msg.conversationId, messageId: msg.id });
        setTimeout(()=> listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior:'smooth'}), 50);
      }
      // update conv preview
      setConvs(prev=>{
        const idx = prev.findIndex(c=>c.id===msg.conversationId);
        if(idx===-1){ fetchConvs(); return prev; }
        const copy=[...prev];
        copy[idx] = { ...copy[idx], lastMessagePreview: msg.content.slice(0,120), lastMessageAt: msg.createdAt, unreadCount: msg.conversationId===selected?0: (copy[idx].unreadCount||0)+1 };
        // sort by lastMessageAt desc
        copy.sort((a,b)=> new Date(b.lastMessageAt||0).getTime()-new Date(a.lastMessageAt||0).getTime());
        return copy;
      });
    });
    s.on('message:notify', (payload:any)=>{
      const { conversationId, message } = payload;
      if(conversationId!==selected){
        // popup toast
        showPopup(message, conversationId);
      }
      fetchConvs();
    });
    s.on('conversation:new', ()=>{ fetchConvs(); });
    s.on('conversation:updated', (conv:any)=>{
      setConvs(prev=> prev.map(c=> c.id===conv.id? {...c, ...conv}:c));
    });
    s.on('typing', ({ conversationId, userId, typing }:any)=>{
      if(userId===meId) return;
      setTypingUsers(prev=>{
        const arr = prev[conversationId]||[];
        if(typing){
          if(arr.includes(userId)) return prev;
          return {...prev, [conversationId]:[...arr, userId]};
        } else {
          return {...prev, [conversationId]: arr.filter(id=>id!==userId)};
        }
      });
      if(typing) setTimeout(()=> setTypingUsers(prev=> ({...prev, [conversationId]:(prev[conversationId]||[]).filter(id=>id!==userId)})), 3000);
    });
    s.on('message:edited', (msg:Message)=>{
      if(msg.conversationId===selected) setMessages(prev=> prev.map(m=> m.id===msg.id? {...m, ...msg}:m));
    });
    s.on('message:deleted', (msg:Message)=>{
      if(msg.conversationId===selected) setMessages(prev=> prev.map(m=> m.id===msg.id? {...m, ...msg}:m));
    });
    s.on('message:read', ({ conversationId, userId }:any)=>{
      // could show read receipts
    });
    s.on('user:online', ({userId}:any)=> setOnlineUsers(prev=> new Set(Array.from(prev).concat([userId]))));
    s.on('user:offline', ({userId}:any)=> setOnlineUsers(prev=>{ const n=new Set(Array.from(prev)); n.delete(userId); return n; }));
    s.on('disconnect', ()=>{});
    return ()=>{ s.disconnect(); };
  },[api, selected, meId]);

  useEffect(()=>{ fetchConvs(search); },[fetchConvs, search]);
  useEffect(()=>{ if(selected) fetchMessages(selected); else setMessages([]); },[selected, fetchMessages]);
  useEffect(()=>{ searchUsersFn(userSearch); },[userSearch]);

  // popup
  const [popups, setPopups] = useState<{id:string; msg:Message; convId:string}[]>([]);
  const showPopup = (msg:Message, convId:string)=>{
    const id = Date.now().toString()+Math.random();
    setPopups(prev=> [...prev.slice(-2), {id, msg, convId}]);
    // browser notification if permitted
    if(typeof Notification !== 'undefined' && Notification.permission==='granted'){
      new Notification(msg.sender?.email||'New message', { body: msg.content.slice(0,100)});
    }
    setTimeout(()=> setPopups(prev=> prev.filter(p=>p.id!==id)), 4000);
    // sound? beep
    try{ const a=new Audio('/notification.mp3'); a.volume=0.3; a.play().catch(()=>{});}catch{}
  };
  useEffect(()=>{ if(typeof Notification !== 'undefined' && Notification.permission==='default') Notification.requestPermission().catch(()=>{}); },[]);

  const send = async ()=>{
    if(!msgInput.trim() || !selected) return;
    const content = msgInput.trim();
    setMsgInput('');
    // optimistic
    const tmp: Message = { id:'tmp-'+Date.now(), conversationId: selected, senderId: meId, content, createdAt: new Date().toISOString(), sender: { id:meId, email: me?.email||'', role:''} as any };
    setMessages(prev=>[...prev, tmp]);
    setTimeout(()=> listRef.current?.scrollTo({ top:listRef.current.scrollHeight, behavior:'smooth'}), 10);
    try{
      const s = socketRef.current;
      if(s && s.connected){
        s.emit('message:send', { conversationId: selected, content }, (ack:any)=>{
          if(ack?.error){ console.error(ack.error);}
        });
        // also REST as fallback? socket handles persistence, so we rely on socket. Remove tmp after real arrives via event or replace.
        // Give 2s to see if event arrives, else fetch
        setTimeout(()=> fetchMessages(selected), 800);
      } else {
        const res = await fetch(`${api}/chat/conversations/${selected}/messages`, { method:'POST', headers:{...authHeaders(),'Content-Type':'application/json'}, body: JSON.stringify({ content })});
        if(res.ok){
          const real = await res.json();
          setMessages(prev=> prev.map(m=> m.id===tmp.id? real: m));
          setConvs(prev=> prev.map(c=> c.id===selected? {...c, lastMessagePreview: content.slice(0,120), lastMessageAt: new Date().toISOString()}:c));
        } else {
          setMessages(prev=> prev.filter(m=> m.id!==tmp.id));
        }
      }
    } catch(e){ setMessages(prev=> prev.filter(m=> m.id!==tmp.id));}
    socketRef.current?.emit('typing:stop', { conversationId: selected });
  };

  const createConv = async()=>{
    if(!picked.length) return alert('Pick at least one person');
    if(newType==='group' && !newGroupName.trim()) return alert('Group name required');
    const body:any = { type:newType, participantIds: picked, name: newGroupName||undefined };
    const res = await fetch(`${api}/chat/conversations`, { method:'POST', headers:{...authHeaders(),'Content-Type':'application/json'}, body: JSON.stringify(body)});
    if(!res.ok){ const t=await res.text(); alert('Failed: '+t); return; }
    const conv = await res.json();
    setShowNew(false); setPicked([]); setNewGroupName(''); setUserSearch('');
    await fetchConvs();
    setSelected(conv.id);
    socketRef.current?.emit('join', { conversationId: conv.id });
  };

  const handleTyping = (v:string)=>{
    setMsgInput(v);
    if(!selected) return;
    const s=socketRef.current;
    if(v) s?.emit('typing:start', { conversationId: selected });
    else s?.emit('typing:stop', { conversationId: selected });
  };

  const deleteMsg = async (msgId:string)=>{
    if(!selected) return;
    if(!confirm('Delete this message?')) return;
    await fetch(`${api}/chat/conversations/${selected}/messages/${msgId}`, { method:'DELETE', headers: authHeaders()});
    setMessages(prev=> prev.map(m=> m.id===msgId? {...m, content:'This message was deleted', isDeleted:true}:m));
  };

  const leaveConv = async ()=>{
    if(!selected) return;
    if(!confirm('Leave this conversation?')) return;
    await fetch(`${api}/chat/conversations/${selected}/leave`, { method:'POST', headers: authHeaders()});
    setSelected(null); fetchConvs();
  };

  const parseAttachments = (m: Message) => {
    if (!m.attachments) return [] as any[];
    try {
      const arr = typeof m.attachments === 'string' ? JSON.parse(m.attachments as string) : m.attachments;
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large (max 10MB)'); return; }
    setFileUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      if (msgInput.trim()) form.append('content', msgInput.trim());
      const res = await fetch(`${api}/chat/conversations/${selected}/files`, {
        method: 'POST',
        headers: { ...authHeaders() } as any,
        body: form,
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Upload failed');
      }
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setMsgInput('');
      setShowEmoji(false);
      setTimeout(()=> listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior:'smooth'}), 50);
      // notify via socket already handled by server, but refresh conv preview
      setConvs(prev=> prev.map(c=> c.id===selected? {...c, lastMessagePreview: `[File] ${file.name}`.slice(0,120), lastMessageAt: new Date().toISOString()}:c));
    } catch (err:any) {
      alert(err.message || 'File upload failed');
    } finally {
      setFileUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const insertEmoji = (emoji: string) => {
    setMsgInput(prev => prev + emoji);
    setShowEmoji(false);
  };

  const selConv = convs.find(c=>c.id===selected);
  const typingForSel = selected ? (typingUsers[selected]||[]) : [];

  return (
    <div className="h-[calc(100vh-140px)] flex gap-4">
      {/* popups */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {popups.map(p=> (
          <div key={p.id} onClick={()=>{setSelected(p.convId); setPopups([]);}} className="bg-slate-900 text-white rounded-xl px-4 py-3 shadow-2xl cursor-pointer animate-in slide-in-from-top min-w-[280px] border border-white/10">
            <div className="text-xs opacity-70">{p.msg.sender?.email||'New message'}</div>
            <div className="text-sm font-medium truncate">{p.msg.content.slice(0,80)}</div>
            <div className="text-xs opacity-60 mt-1">Click to open</div>
          </div>
        ))}
      </div>

      {/* left: conversations */}
      <div className={`${selected?'hidden md:flex':'flex'} w-full md:w-[360px] flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden`}>
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2"><MessageCircle size={20}/> Chats {unreadTotal>0 && <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadTotal}</span>}</h2>
            <button onClick={()=>setShowNew(true)} className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800"><Plus size={18}/></button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations" className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100 border border-transparent focus:bg-white focus:border-slate-200 outline-none text-sm"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convs.length===0 && <div className="p-8 text-center text-slate-500 text-sm">No conversations yet.<br/>Start a new chat →</div>}
          {convs.map(c=> {
            const name = displayName(c, meId);
            const isOnline = c.type==='direct' && onlineUsers.has(c.participants.find(p=>p.userId!==meId)?.userId||'');
            const typing = (typingUsers[c.id]||[]).length>0;
            return (
              <button key={c.id} onClick={()=>setSelected(c.id)} className={`w-full text-left flex gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 ${selected===c.id?'bg-slate-100':''}`}>
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold ${c.type==='group'?'bg-indigo-600':'bg-slate-800'}`}>
                    {c.type==='group'? <Users size={16}/> : avatarText(name)}
                  </div>
                  {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"/>}
                  {c.unreadCount! >0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">{c.unreadCount}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm truncate ${c.unreadCount! >0?'font-bold': 'font-medium'}`}>{name}</span>
                    {c.type==='group' && <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full">{c.participants.length}</span>}
                    <span className="ml-auto text-[11px] text-slate-400 shrink-0">{c.lastMessageAt? new Date(c.lastMessageAt as string).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):''}</span>
                  </div>
                  <div className={`text-xs truncate ${c.unreadCount! >0?'text-slate-900 font-medium':'text-slate-500'}`}>
                    {typing? <span className="text-emerald-600 italic">typing…</span> : (c.lastMessagePreview||'No messages yet')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* center: messages */}
      <div className={`${selected?'flex':'hidden md:flex'} flex-1 flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"><MessageCircle size={32}/></div>
            <div className="font-medium text-slate-700">Select a conversation</div>
            <div className="text-sm">Choose from the list or start a new chat. Real-time messaging like WhatsApp.</div>
            <button onClick={()=>setShowNew(true)} className="mt-4 px-5 py-2 rounded-full bg-slate-900 text-white text-sm">New chat</button>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="h-[64px] px-4 flex items-center gap-3 border-b bg-white shrink-0">
              <button onClick={()=>setSelected(null)} className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><ArrowLeft size={16}/></button>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${selConv?.type==='group'?'bg-indigo-600':'bg-slate-800'}`}>
                {selConv?.type==='group'? <Users size={16}/> : avatarText(displayName(selConv!, meId))}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{selConv? displayName(selConv, meId):''}</div>
                <div className="text-xs text-slate-500 truncate">
                  {selConv?.type==='group'? `${selConv.participants.length} members • ${selConv.participants.slice(0,3).map(p=>p.user.email.split('@')[0]).join(', ')}` : (onlineUsers.has(selConv?.participants.find(p=>p.userId!==meId)?.userId||'')? 'online':'offline')}
                  {typingForSel.length>0 && <span className="text-emerald-600"> • typing…</span>}
                </div>
              </div>
              <div className="ml-auto relative">
                <button onClick={()=>setShowConvMenu(v=>!v)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"><MoreVertical size={16}/></button>
                {showConvMenu && (
                  <div className="absolute right-0 top-9 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-10">
                    {selConv?.type==='group' && (
                      <>
                        <div className="px-3 py-2">
                          <input value={editGroupName} onChange={e=>setEditGroupName(e.target.value)} placeholder="New group name" className="w-full text-sm border rounded-lg px-2 py-1"/>
                          <button onClick={async()=>{
                            if(!editGroupName.trim()) return;
                            await fetch(`${api}/chat/conversations/${selected}/`, { method:'PATCH', headers:{...authHeaders(),'Content-Type':'application/json'}, body: JSON.stringify({ name: editGroupName})});
                            setShowConvMenu(false); setEditGroupName(''); fetchConvs();
                          }} className="mt-2 w-full text-xs py-1.5 rounded-lg bg-slate-900 text-white flex items-center justify-center gap-1"><Edit3 size={12}/> Rename</button>
                        </div>
                        <hr className="my-1"/>
                        <button onClick={async()=>{
                          const q=prompt('Enter user emails or IDs to add (comma separated). Or use New chat to pick multiple.');
                          if(!q) return;
                          alert('Use the Participants section to add — coming: add via user picker. For now use New chat to manage.');
                        }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"><UserPlus size={14}/> Add participants</button>
                      </>
                    )}
                    <button onClick={leaveConv} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><LogOut size={14}/> Leave chat</button>
                    <button onClick={()=>setShowConvMenu(false)} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"><X size={14}/> Close</button>
                  </div>
                )}
              </div>
            </div>

            {/* messages list */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f8fafc] bg-[radial-gradient(ellipse_at_top,_rgba(148,163,184,0.08),transparent_60%)]">
              {loadingMsgs && <div className="text-center text-xs text-slate-400 py-4">Loading…</div>}
              {messages.map(m=>{
                const isMe = m.senderId===meId;
                const isTmp = m.id.startsWith('tmp-');
                const atts = parseAttachments(m);
                const isExpired = m.expiresAt && new Date(m.expiresAt).getTime() < Date.now();
                const hasFile = atts.length>0 && !isExpired && !atts[0]?.expired;
                const isImage = hasFile && atts[0]?.type?.startsWith('image/');
                return (
                  <div key={m.id} className={`flex ${isMe?'justify-end':'justify-start'} group`}>
                    <div className={`max-w-[72%] rounded-2xl px-3 py-2 shadow-sm relative ${isMe?'bg-emerald-500 text-white rounded-br-sm':'bg-white border border-slate-200 rounded-bl-sm'} ${m.isDeleted?'opacity-60 italic':''} ${isTmp?'opacity-70':''}`}>
                      {!isMe && selConv?.type==='group' && <div className="text-[11px] font-semibold opacity-70 mb-0.5">{m.sender?.email?.split('@')[0]}</div>}
                      {/* attachments */}
                      {hasFile && (
                        <div className="mb-2 space-y-2">
                          {atts.map((a:any, idx:number)=> (
                            a.expired ? <div key={idx} className="text-xs italic opacity-70">📎 File expired after 7 days</div> :
                            isImage ? (
                              <a key={idx} href={a.url} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={a.url} alt={a.name} className="max-w-full rounded-xl max-h-[240px] object-contain border border-white/20" />
                                <div className="text-xs mt-1 truncate flex items-center gap-1"><ImageIcon size={12}/>{a.name} <span className="opacity-60">• {(a.size/1024).toFixed(1)}KB • expires {a.expiresAt ? new Date(a.expiresAt).toLocaleDateString() : ''}</span></div>
                              </a>
                            ) : (
                              <a key={idx} href={a.url} download={a.name} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded-xl ${isMe?'bg-white/20':'bg-slate-50 border'} hover:opacity-90`}>
                                <FileText size={18} className={isMe?'text-white':'text-slate-600'} />
                                <div className="min-w-0">
                                  <div className="text-sm truncate font-medium">{a.name}</div>
                                  <div className="text-xs opacity-60">{(a.size/1024).toFixed(1)}KB • {a.type} • expires {a.expiresAt ? new Date(a.expiresAt).toLocaleDateString() : '7d'}</div>
                                </div>
                              </a>
                            )
                          ))}
                          {isExpired && <div className="text-xs italic opacity-70">Expired</div>}
                        </div>
                      )}
                      {!hasFile && atts[0]?.expired && <div className="text-xs italic mb-1 opacity-70">📎 File expired after 7 days</div>}
                      <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                      <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe?'text-white/80':'text-slate-400'}`}>
                        <span>{new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                        {m.isEdited && <span>• edited</span>}
                        {hasFile && !isExpired && <span>• auto-deletes in 7d</span>}
                        {isMe && <span className="ml-1">{isTmp? <span className="opacity-60">○</span> : <CheckCheck size={12}/>}</span>}
                        {isMe && !m.isDeleted && <button onClick={()=>deleteMsg(m.id)} className="opacity-0 group-hover:opacity-100 ml-2 hover:text-red-200"><Trash2 size={12}/></button>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typingForSel.length>0 && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2 text-xs text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"/> <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]"/> <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]"/>
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <div className="p-3 border-t bg-white shrink-0 relative">
              {showEmoji && (
                <div className="absolute bottom-full left-3 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 w-[280px] z-20">
                  <div className="text-xs font-semibold text-slate-600 mb-2">Emojis</div>
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map(e=> <button key={e} onClick={()=>insertEmoji(e)} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-lg flex items-center justify-center">{e}</button>)}
                  </div>
                  <div className="text-xs text-slate-400 mt-2">Files auto-delete after 7 days</div>
                </div>
              )}
              <div className="flex gap-2 items-end">
                <button onClick={()=>setShowEmoji(v=>!v)} className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${showEmoji?'bg-slate-900 text-white border-slate-900':'bg-white border-slate-200 hover:bg-slate-50'}`} title="Emoji"><Smile size={18}/></button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" />
                <button onClick={()=>fileInputRef.current?.click()} disabled={fileUploading} className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 hover:bg-slate-50 disabled:opacity-40" title="Attach file (7d expiry)"><Paperclip size={18}/></button>
                <textarea
                  value={msgInput}
                  onChange={e=>handleTyping(e.target.value)}
                  onKeyDown={e=>{
                    if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); }
                    if(e.key==='Escape') setMsgInput('');
                  }}
                  placeholder="Type a message… (Enter to send, Shift+Enter for newline) • Emojis 😀 • Files 📎"
                  rows={1}
                  className="flex-1 resize-none max-h-[120px] min-h-[44px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white"
                />
                <button onClick={send} disabled={!msgInput.trim() || fileUploading} className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-40 shrink-0">
                  {fileUploading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={18}/>}
                </button>
              </div>
              {fileUploading && <div className="text-xs text-slate-500 mt-2">Uploading file… will expire in 7 days</div>}
            </div>
          </>
        )}
      </div>

      {/* new chat modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowNew(false)}>
          <div onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-bold">New chat</h3>
              <button onClick={()=>setShowNew(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"><X size={16}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <button onClick={()=>{setNewType('direct'); setPicked(prev=> prev.slice(0,1));}} className={`flex-1 py-2 rounded-full text-sm font-medium border ${newType==='direct'?'bg-slate-900 text-white border-slate-900':'bg-white border-slate-200'}`}>Direct (1 person)</button>
                <button onClick={()=>setNewType('group')} className={`flex-1 py-2 rounded-full text-sm font-medium border ${newType==='group'?'bg-slate-900 text-white border-slate-900':'bg-white border-slate-200'}`}>Group</button>
              </div>
              {newType==='group' && (
                <input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} placeholder="Group name (e.g. HR Team)" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-slate-900"/>
              )}
              <div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search colleagues by email" className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"/>
                </div>
                <div className="mt-2 max-h-[220px] overflow-y-auto border border-slate-100 rounded-xl divide-y">
                  {users.map(u=> {
                    const checked = picked.includes(u.id);
                    const disabled = newType==='direct' && picked.length>=1 && !checked;
                    return (
                      <label key={u.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 ${disabled?'opacity-40 pointer-events-none':''}`}>
                        <input type="checkbox" checked={checked} onChange={e=>{
                          if(e.target.checked){
                            if(newType==='direct' && picked.length>=1) return;
                            setPicked(prev=>[...prev, u.id]);
                          } else setPicked(prev=> prev.filter(id=> id!==u.id));
                        }} className="rounded"/>
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">{avatarText(u.email)}</div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{u.email}</div>
                          <div className="text-xs text-slate-500">{u.role} {u.employee? `• ${u.employee.jobTitle||''}`:''}</div>
                        </div>
                        {checked && <Check size={16} className="ml-auto text-emerald-600"/>}
                      </label>
                    );
                  })}
                  {users.length===0 && <div className="p-4 text-center text-xs text-slate-400">No users found. Type to search.</div>}
                </div>
                {picked.length>0 && <div className="mt-2 text-xs text-slate-600">{picked.length} selected: {picked.slice(0,3).join(', ')}{picked.length>3?'…':''}</div>}
              </div>
              <button onClick={createConv} disabled={!picked.length || (newType==='group' && !newGroupName.trim())} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-40">Start chat</button>
              <p className="text-xs text-slate-400 text-center">Chats are real-time. Recipients get instant pop-ups while online.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
