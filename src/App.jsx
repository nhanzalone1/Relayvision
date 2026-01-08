import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Moon, Trash2, Image as ImageIcon, CheckCircle, Play, Sun, Archive, Target, Flame, LogOut, Lock, Mic, Video, Camera, X, Square } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- AUTH COMPONENT ---
function Auth({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({ email, password });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }
    const { data, error } = result;
    if (error) setMessage(error.message);
    else if (isSignUp && !data.session) setMessage('Check email for confirmation.');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #1f1f22 0%, #000000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'white' }}>
      <div style={{ maxWidth: '350px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
           <div style={{ background: 'rgba(192, 132, 252, 0.1)', padding: '20px', borderRadius: '50%' }}>
             <Lock size={40} color="#c084fc" />
           </div>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>Vision Log.</h1>
          <p style={{ color: '#888', marginTop: '8px' }}>Secure your future.</p>
        </div>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #333', background: '#111', color: 'white', fontSize: '16px', outline: 'none' }} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #333', background: '#111', color: 'white', fontSize: '16px', outline: 'none' }} required />
          <button disabled={loading} style={{ padding: '16px', borderRadius: '12px', border: 'none', background: 'white', color: 'black', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Enter System')}</button>
        </form>
        {message && <p style={{ color: '#ef4444', fontSize: '14px' }}>{message}</p>}
        <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px', marginTop: '10px' }}>{isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}</button>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  const [session, setSession] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);
  if (!session) return <Auth />;
  return <VisionBoard session={session} />;
}

function VisionBoard({ session }) {
  const [mode, setMode] = useState(() => localStorage.getItem('visionMode') || 'night');
  const [activeTab, setActiveTab] = useState('targets'); 
  const [thoughts, setThoughts] = useState([]);
  const [streak, setStreak] = useState(0); 
  const [currentInput, setCurrentInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [debugLog, setDebugLog] = useState('');
  
  // NATIVE INPUT REFS
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  
  // LIVE AUDIO REFS
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // MEDIA STATES
  const [mediaFile, setMediaFile] = useState(null); 
  const [audioBlob, setAudioBlob] = useState(null); 
  const [mediaType, setMediaType] = useState('text'); 
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);

  useEffect(() => { localStorage.setItem('visionMode', mode); }, [mode]);
  useEffect(() => { fetchThoughts(); }, [session]);

  const handleFileSelect = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setDebugLog("Error: File too large (Max 50MB).");
        return;
      }
      setMediaFile(file);
      setAudioBlob(null);
      setMediaType(type);
      setPreviewUrl(URL.createObjectURL(file));
      setDebugLog('');
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };
      else if (MediaRecorder.isTypeSupported('audio/webm')) options = { mimeType: 'audio/webm' };

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const type = options.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type });
        setAudioBlob(blob);
        setMediaFile(null); 
        setMediaType('audio');
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecordingAudio(true);
      setDebugLog('Recording Audio...');
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      setDebugLog('');
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setAudioBlob(null);
    setMediaType('text');
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleCapture = async () => {
    if (!currentInput.trim() && !mediaFile && !audioBlob) return;
    setUploading(true);
    setDebugLog('Securing Vision...');

    let imageUrl = null;
    let videoUrl = null;
    let audioUrl = null;
    const timestamp = Date.now();

    try {
      if (mediaFile) {
          const ext = mediaFile.name.split('.').pop() || 'mov';
          const fileName = `${mediaType}-${timestamp}.${ext}`;
          const { data, error } = await supabase.storage.from('images').upload(fileName, mediaFile);
          if (error) throw error;
          if (data) {
              const publicUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
              if (mediaType === 'image') imageUrl = publicUrl;
              if (mediaType === 'video') videoUrl = publicUrl;
          }
      }

      if (audioBlob) {
          const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
          const fileName = `audio-${timestamp}.${ext}`;
          const { data, error } = await supabase.storage.from('images').upload(fileName, audioBlob);
          if (error) throw error;
          if (data) {
              audioUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
          }
      }

      const { data, error } = await supabase.from('thoughts').insert([{ 
          text: currentInput, 
          image_url: imageUrl, 
          video_url: videoUrl,
          audio_url: audioUrl,
          ignited: false, 
          user_id: session.user.id 
      }]).select();

      if (error) throw error;

      if (data) {
        setThoughts([data[0], ...thoughts]);
        calculateStreak([data[0], ...thoughts]);
        setCurrentInput('');
        clearMedia();
        setDebugLog('Vision Secured.');
        setTimeout(() => setDebugLog(''), 2000);
      }
    } catch (err) {
      console.error(err);
      setDebugLog("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  async function fetchThoughts() {
    const { data, error } = await supabase.from('thoughts').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (!error) { setThoughts(data || []); calculateStreak(data || []); }
  }

  function calculateStreak(data) {
    if (!data || data.length === 0) { setStreak(0); return; }
    const uniqueDates = [...new Set(data.map(item => new Date(item.created_at).toDateString()))];
    const sortedDates = uniqueDates.map(d => new Date(d)).sort((a, b) => b - a);
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (sortedDates[0].toDateString() !== today && sortedDates[0].toDateString() !== yesterday.toDateString()) { setStreak(0); return; }
    let currentStreak = 0;
    let checkDate = new Date();
    if (sortedDates[0].toDateString() !== today) checkDate.setDate(checkDate.getDate() - 1);
    for (let i = 0; i < sortedDates.length; i++) {
        if (sortedDates[i].toDateString() === checkDate.toDateString()) { currentStreak++; checkDate.setDate(checkDate.getDate() - 1); } else break;
    }
    setStreak(currentStreak);
  }

  const deleteThought = async (id) => {
    const { error } = await supabase.from('thoughts').delete().eq('id', id);
    if (!error) { const newThoughts = thoughts.filter(t => t.id !== id); setThoughts(newThoughts); calculateStreak(newThoughts); }
  };

  const toggleIgnite = async (id, currentStatus) => {
    if (!currentStatus) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: mode === 'night' ? ['#c084fc', '#a855f7', '#ffffff'] : ['#fbbf24', '#f59e0b', '#ef4444'] });
    const { error } = await supabase.from('thoughts').update({ ignited: !currentStatus }).eq('id', id);
    if (!error) setThoughts(thoughts.map(t => t.id === id ? { ...t, ignited: !t.ignited } : t));
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };
  const visibleThoughts = thoughts.filter(t => activeTab === 'targets' ? !t.ignited : t.ignited);

  const nightStyle = { background: 'radial-gradient(circle at center, #1f1f22 0%, #000000 100%)', color: 'white', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
  const morningStyle = { background: 'linear-gradient(135deg, #fdfbf7 0%, #e2e8f0 100%)', color: 'black', minHeight: '100vh', padding: '24px', display: 'flex', flexDirection: 'column' };

  return (
    <div style={mode === 'night' ? nightStyle : morningStyle}>
       <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
          <button onClick={() => setMode(mode === 'night' ? 'morning' : 'night')} style={{ border: '1px solid #777', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', color: '#888', background: 'rgba(0,0,0,0.5)', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>{mode === 'night' ? 'Morning ☀️' : 'Capture 🌙'}</button>
          <button onClick={handleLogout} style={{ border: '1px solid #ef4444', padding: '8px', borderRadius: '50%', color: '#ef4444', background: 'rgba(0,0,0,0.1)', cursor: 'pointer' }}><LogOut size={14} /></button>
       </div>

      <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* HEADER */}
        <div style={{ marginTop: '40px', textAlign: mode === 'night' ? 'center' : 'left' }}>
          {mode === 'night' ? (
             <>
               <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.9, marginBottom: '15px' }}><Moon size={56} color="#c084fc" style={{ filter: 'drop-shadow(0 0 10px rgba(192, 132, 252, 0.5))' }} /></div>
               <h1 style={{ fontSize: '36px', fontWeight: 'bold', background: 'linear-gradient(to right, #e9d5ff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Vision Log.</h1>
             </>
          ) : (
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Sun size={32} color="#f59e0b" /><h1 style={{ fontSize: '42px', fontWeight: '800', lineHeight: '1', margin: 0, color: '#1e293b' }}>The Fuel.</h1></div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff7ed', padding: '6px 12px', borderRadius: '20px', border: '1px solid #ffedd5' }}><Flame size={20} fill={streak > 0 ? "#f97316" : "none"} color="#f97316" /><span style={{ fontSize: '16px', fontWeight: 'bold', color: '#9a3412' }}>{streak} Day{streak !== 1 && 's'}</span></div>
             </div>
          )}
          
          {mode === 'morning' && (
             <div style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content', marginTop: '10px' }}>
               <button onClick={() => setActiveTab('targets')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'targets' ? 'white' : 'transparent', boxShadow: activeTab === 'targets' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: activeTab === 'targets' ? '#0f172a' : '#64748b', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={16} /> Targets</button>
               <button onClick={() => setActiveTab('vault')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'vault' ? 'white' : 'transparent', boxShadow: activeTab === 'vault' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: activeTab === 'vault' ? '#0f172a' : '#64748b', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Archive size={16} /> The Vault</button>
             </div>
          )}
        </div>

        {/* INPUT AREA (Night Mode Only) */}
        {mode === 'night' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             
             {/* STATUS/ERROR LOG */}
             {debugLog && (
                <div style={{ background: debugLog.includes('Error') ? '#7f1d1d' : '#064e3b', color: debugLog.includes('Error') ? '#fecaca' : '#a7f3d0', padding: '10px', borderRadius: '8px', fontSize: '12px', textAlign: 'center', border: `1px solid ${debugLog.includes('Error') ? '#ef4444' : '#10b981'}` }}>
                    {debugLog}
                </div>
             )}

             {/* PREVIEW */}
             {(previewUrl || isRecordingAudio) && (
                <div style={{ position: 'relative', width: '100%', minHeight: '120px', background: '#111', borderRadius: '16px', overflow: 'hidden', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {mediaType === 'image' && <img src={previewUrl} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />}
                  {mediaType === 'video' && <video src={previewUrl} controls playsInline style={{ width: '100%', maxHeight: '300px' }} />}
                  
                  {isRecordingAudio && (
                      <div style={{ color: '#ef4444', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>Recording Audio... (Tap Stop)</div>
                  )}
                  {mediaType === 'audio' && !isRecordingAudio && (
                      <audio src={previewUrl} controls style={{ width: '90%' }} />
                  )}

                  {!isRecordingAudio && <button onClick={clearMedia} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', zIndex: 10 }}>X</button>}
                </div>
             )}

             <textarea value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} placeholder="What are you building?" style={{ width: '100%', height: '80px', backgroundColor: 'rgba(26, 26, 26, 0.8)', border: '1px solid #333', color: 'white', outline: 'none', borderRadius: '16px', padding: '16px', fontSize: '18px', resize: 'none', backdropFilter: 'blur(10px)' }} disabled={uploading} />
             
             {/* HIDDEN INPUTS */}
             <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'image')} style={{ display: 'none' }} />
             <input type="file" accept="video/*" capture="environment" ref={videoInputRef} onChange={(e) => handleFileSelect(e, 'video')} style={{ display: 'none' }} />
             
             {/* BUTTON BAR */}
             <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => fileInputRef.current.click()} disabled={uploading || isRecordingAudio} style={{ flex: 1, height: '50px', background: '#222', border: '1px solid #333', borderRadius: '12px', cursor: 'pointer', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={20} /></button>
                <button onClick={() => videoInputRef.current.click()} disabled={uploading || isRecordingAudio} style={{ flex: 1, height: '50px', background: '#222', border: '1px solid #333', borderRadius: '12px', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Video size={20} /></button>
                <button onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording} disabled={uploading} style={{ flex: 1, height: '50px', background: isRecordingAudio ? '#ef4444' : '#222', border: isRecordingAudio ? 'none' : '1px solid #333', borderRadius: '12px', cursor: 'pointer', color: isRecordingAudio ? 'white' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isRecordingAudio ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
                </button>
             </div>

             <button onClick={handleCapture} disabled={uploading || isRecordingAudio} style={{ width: '100%', padding: '16px', backgroundColor: uploading ? '#333' : '#c084fc', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '16px', cursor: 'pointer', fontSize: '16px', boxShadow: '0 0 15px rgba(192, 132, 252, 0.3)' }}>{uploading ? 'Syncing...' : 'Capture'}</button>
          </div>
        )}

        {/* FEED - ONLY SHOW IN MORNING */}
        {mode === 'morning' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
            {visibleThoughts.map((thought) => (
              <div key={thought.id} style={{ backgroundColor: thought.ignited ? 'rgba(240, 253, 244, 0.9)' : 'rgba(255, 255, 255, 0.8)', border: `1px solid ${thought.ignited ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '20px', overflow: 'hidden', paddingBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', backdropFilter: 'blur(8px)' }}>
                {thought.image_url && (<img src={thought.image_url} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />)}
                {thought.video_url && (<video src={thought.video_url} controls playsInline style={{ width: '100%', maxHeight: '400px', background: 'black' }} />)}
                {thought.audio_url && (<div style={{ padding: '15px' }}><audio src={thought.audio_url} controls style={{ width: '100%' }} /></div>)}
                <div style={{ padding: '0 24px', marginTop: '20px' }}>
                  <p style={{ fontSize: '19px', fontWeight: '600', color: thought.ignited ? '#94a3b8' : '#1e293b', textDecoration: thought.ignited ? 'line-through' : 'none' }}>"{thought.text}"</p>
                  <button onClick={() => toggleIgnite(thought.id, thought.ignited)} style={{ marginTop: '20px', width: '100%', padding: '12px', background: thought.ignited ? 'transparent' : 'rgba(59, 130, 246, 0.1)', color: thought.ignited ? '#16a34a' : '#2563eb', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {thought.ignited ? 'Vision Secured' : 'IGNITE VISION'}
                  </button>
                  <div style={{ marginTop: '10px', textAlign: 'right' }}><button onClick={() => deleteThought(thought.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button></div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
