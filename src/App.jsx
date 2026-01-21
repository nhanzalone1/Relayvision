import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Moon, Sun, Archive, Target, Flame, LogOut, Lock, Mic, Video, Camera, X, Square, ListTodo, Quote as QuoteIcon, CheckSquare, Plus, Eye, RotateCcw, Trophy, ArrowLeft, Eraser, RefreshCcw, Trash2, ShieldCheck, AlertCircle, Edit3, Fingerprint, GripVertical, History, Users, Link as LinkIcon, Check, XCircle, MessageCircle, Heart, Send, Unlock, Save, Calendar, Upload, Image as ImageIcon, Settings, ChevronRight, Menu } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Fireworks } from 'fireworks-js';
import { Reorder, useDragControls } from "framer-motion";

// --- IMPORT THE TRIBUTE IMAGE DIRECTLY ---
import tributeImage from './tribute.png'; 

// --- ORGANIC AUDIO ENGINE ---
const SFX = {
  success: new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'),
  // "Crush": Updated to a heavy fire ignition to fix the "squeaky door" issue
  crush: new Audio('https://assets.mixkit.co/active_storage/sfx/592/592-preview.mp3'),
  fireworks: new Audio('https://assets.mixkit.co/active_storage/sfx/1675/1675-preview.mp3'),
};

Object.values(SFX).forEach(sound => { 
    sound.volume = 1.0; 
    sound.preload = 'auto';
});

const playSound = (type) => {
  const audio = SFX[type];
  if (audio) {
    const clone = audio.cloneNode();
    clone.volume = 1.0;
    const playPromise = clone.play();
    if (playPromise !== undefined) {
        playPromise.catch(e => console.log("Audio blocked:", e));
    }
  }
};

const globalStyles = `
  * { box-sizing: border-box; touch-action: manipulation; }
  html, body { margin: 0; padding: 0; overflow-x: hidden; -webkit-text-size-adjust: 100%; overscroll-behavior-y: none; scrollbar-width: none; -ms-overflow-style: none; }
  ::--webkit-scrollbar { display: none; width: 0px; background: transparent; }
  input, textarea, button, select { font-size: 16px !important; }
  -webkit-tap-highlight-color: transparent;
  .finale-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: gold; text-align: center; pointer-events: none; animation: finaleFade 0.5s ease-out; }
  @keyframes finaleFade { from { opacity: 0; } to { opacity: 1; } }
`;

// --- AUTH COMPONENT ---
function Auth({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault(); setLoading(true); setMessage('');
    if (isSignUp && password !== confirmPassword) { setMessage("Passwords do not match."); setLoading(false); return; }
    let result;
    if (isSignUp) { result = await supabase.auth.signUp({ email, password }); } else { result = await supabase.auth.signInWithPassword({ email, password }); }
    const { data, error } = result;
    if (error) setMessage(error.message); else if (isSignUp && !data.session) setMessage('Check email for confirmation.');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', background: 'radial-gradient(circle at center, #1f1f22 0%, #000000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'white' }}>
      <style>{globalStyles}</style>
      <div style={{ maxWidth: '350px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}> <div style={{ background: 'rgba(192, 132, 252, 0.1)', padding: '20px', borderRadius: '50%' }}> <Lock size={40} color="#c084fc" /> </div> </div>
        <div> <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>Relay Vision.</h1> <p style={{ color: '#888', marginTop: '8px' }}>Pass the baton.</p> </div>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #333', background: '#111', color: 'white', fontSize: '16px', outline: 'none' }} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #333', background: '#111', color: 'white', fontSize: '16px', outline: 'none' }} required />
          {isSignUp && ( <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #333', background: '#111', color: 'white', fontSize: '16px', outline: 'none' }} required /> )}
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
  const [activeTab, setActiveTab] = useState('mission'); 
  const [thoughts, setThoughts] = useState([]);
  const [missions, setMissions] = useState([]); 
  const [crushedHistory, setCrushedHistory] = useState([]); 
  const [goals, setGoals] = useState([]); 
  const [streak, setStreak] = useState(0); 
  const [viewingGoal, setViewingGoal] = useState(null); 
  const [showArchives, setShowArchives] = useState(false);
  const [showFinale, setShowFinale] = useState(false);

  const [currentInput, setCurrentInput] = useState('');
  const [missionInput, setMissionInput] = useState('');
  const [newGoalInput, setNewGoalInput] = useState('');
  const [showGoalCreator, setShowGoalCreator] = useState(false);
  const [recentMissions, setRecentMissions] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const [debugLog, setDebugLog] = useState('');
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, title: '' });
  const [protocolModal, setProtocolModal] = useState(false);
  const [cheerModal, setCheerModal] = useState({ isOpen: false, missionId: null });
  const [cheerInput, setCheerInput] = useState('');
  const [historyModal, setHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);
  
  const [tempVictoryNotes, setTempVictoryNotes] = useState({});
  const [isPrivateGoal, setIsPrivateGoal] = useState(false); 
  const [isPrivateMission, setIsPrivateMission] = useState(false); 
  const [isPrivateVision, setIsPrivateVision] = useState(false); 

  const [partnerModal, setPartnerModal] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [currentProfile, setCurrentProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [notification, setNotification] = useState(null);

  const [myThoughts, setMyThoughts] = useState([]);
  const [partnerThoughts, setPartnerThoughts] = useState([]);
  const [myMissions, setMyMissions] = useState([]);
  const [partnerMissions, setPartnerMissions] = useState([]);
  const [myGoals, setMyGoals] = useState([]);
  const [partnerGoals, setPartnerGoals] = useState([]);

  const goalColors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b'];
  const [newGoalColor, setNewGoalColor] = useState(goalColors[0]);

  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const fireworksRef = useRef(null); 

  const [mediaFile, setMediaFile] = useState(null); 
  const [audioBlob, setAudioBlob] = useState(null); 
  const [mediaType, setMediaType] = useState('text'); 
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isQuoteMode, setIsQuoteMode] = useState(false);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const preventZoom = (e) => { if (e.touches.length > 1) { e.preventDefault(); } };
    document.addEventListener('touchmove', preventZoom, { passive: false });
    const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setShowProfileMenu(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { 
        document.removeEventListener('touchmove', preventZoom); 
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => { localStorage.setItem('visionMode', mode); }, [mode]);
  useEffect(() => { fetchAllData(); }, [session]);

  const showNotification = (msg, type = 'success') => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 4000); };

  const fetchAllData = useCallback(async () => {
      const profile = await fetchProfile(); 
      if(profile?.partner_id) fetchPartnerProfile(profile.partner_id);

      const { data: gData } = await supabase.from('goals').select('*');
      if (gData) {
          setMyGoals(gData.filter(i => i.user_id === session.user.id));
          setPartnerGoals(gData.filter(i => i.user_id !== session.user.id));
      }
      const { data: tData } = await supabase.from('thoughts').select('*').order('created_at', { ascending: false });
      if (tData) {
          setMyThoughts(tData.filter(i => i.user_id === session.user.id));
          setPartnerThoughts(tData.filter(i => i.user_id !== session.user.id));
          calculateStreak(tData.filter(i => i.user_id === session.user.id));
      }
      const { data: mData } = await supabase.from('missions').select('*').order('created_at', { ascending: true });
      if (mData) {
          const myHistory = mData.filter(i => i.user_id === session.user.id);
          setHistoryData(myHistory); 
          setMyMissions(myHistory.filter(i => i.is_active));
          setPartnerMissions(mData.filter(i => i.user_id !== session.user.id && i.is_active));
          const recent = myHistory.slice(-10); 
          const uniqueRecents = [...new Map(recent.map(item => [item['task'], item])).values()];
          setRecentMissions(uniqueRecents);
          setCrushedHistory(mData.filter(i => i.crushed));
      }
  }, [session]);

  useEffect(() => {
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        fetchAllData(); 
        if (payload.table === 'missions' && payload.eventType === 'UPDATE') {
            const isMe = payload.new.user_id === session.user.id;
            if (!isMe && payload.new.crushed && !payload.old.crushed) showNotification(`🔥 PARTNER CRUSHED: "${payload.new.task}"`, 'crushed'); 
            else if (!isMe && payload.new.completed && !payload.old.completed && !payload.new.crushed) showNotification(`Partner completed: "${payload.new.task}"`, 'success');
            if (isMe && payload.new.cheer_note && payload.new.cheer_note !== payload.old.cheer_note) showNotification(`Partner sent a boost: "${payload.new.cheer_note}"`, 'cheer');
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, fetchAllData]);
  
  async function fetchProfile() { const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single(); if(data) setCurrentProfile(data); return data;}
  async function fetchPartnerProfile(partnerId) { const { data } = await supabase.from('profiles').select('*').eq('id', partnerId).single(); if(data) setPartnerProfile(data); }

  const handleAvatarUpload = async (event) => {
      try {
          setUploading(true);
          const file = event.target.files[0];
          if (!file) return;
          const fileExt = file.name.split('.').pop();
          const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;
          await supabase.storage.from('avatars').upload(filePath, file);
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
          await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
          setCurrentProfile({ ...currentProfile, avatar_url: publicUrl });
          showNotification("Profile Picture Updated!", "success");
      } catch (error) { showNotification(error.message, "error"); } finally { setUploading(false); }
  };

  const getHistoryDays = () => {
      const grouped = {};
      historyData.forEach(m => {
          const date = new Date(m.created_at).toDateString();
          if(!grouped[date]) grouped[date] = { total: 0, completed: 0, crushed: 0 };
          grouped[date].total++;
          if(m.completed) grouped[date].completed++;
          if(m.crushed) grouped[date].crushed++;
      });
      const days = [];
      for(let i=13; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toDateString();
          const stats = grouped[dateStr] || { total: 0, completed: 0, crushed: 0 };
          days.push({ date: d, ...stats });
      }
      return days;
  };

  const sendInvite = async () => { if(!partnerEmail) return; const { error } = await supabase.rpc('send_ally_invite', { target_email: partnerEmail }); if (error) { showNotification(error.message, "error"); } else { showNotification("Invite Sent.", "success"); fetchProfile(); } };
  const acceptInvite = async () => { const { error } = await supabase.rpc('confirm_alliance'); if (!error) { showNotification("Alliance Established.", "success"); confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#60a5fa', '#ffffff'] }); fetchProfile(); fetchAllData(); } };
  const declineInvite = async () => { const { error } = await supabase.rpc('sever_connection'); if (!error) { showNotification("Connection Severed.", "neutral"); fetchProfile(); } };
  const clearDailyMissions = async () => { if(!window.confirm("Clear board?")) return; await supabase.from('missions').delete().eq('user_id', session.user.id).eq('crushed', false); await supabase.from('missions').update({ is_active: false }).eq('user_id', session.user.id).eq('crushed', true); fetchAllData(); };
  const createGoal = async () => { if (!newGoalInput.trim()) return; const { data, error } = await supabase.from('goals').insert([{ title: newGoalInput, color: newGoalColor, user_id: session.user.id, is_private: isPrivateGoal }]).select(); if (!error && data) { setMyGoals([...myGoals, data[0]]); setNewGoalInput(''); setIsPrivateGoal(false); setShowGoalCreator(false); setSelectedGoalId(data[0].id); } };
  const toggleGoalPrivacy = async (goal) => { const newStatus = !goal.is_private; await supabase.from('goals').update({ is_private: newStatus }).eq('id', goal.id); setMyGoals(myGoals.map(g => g.id === goal.id ? { ...g, is_private: newStatus } : g)); };
  const executeDelete = async () => { const { type, id } = deleteModal; if (type === 'goal') { await supabase.from('goals').delete().eq('id', id); setMyGoals(myGoals.filter(g => g.id !== id)); } else if (type === 'thought') { await supabase.from('thoughts').delete().eq('id', id); setMyThoughts(myThoughts.filter(t => t.id !== id)); } setDeleteModal({ isOpen: false }); };
  const addMission = async (taskText = missionInput, goalId = selectedGoalId) => { if (!taskText.trim()) return; const { data, error } = await supabase.from('missions').insert([{ task: taskText, user_id: session.user.id, completed: false, crushed: false, is_active: true, goal_id: goalId, is_private: isPrivateMission }]).select(); if (!error && data) { setMyMissions([...myMissions, data[0]]); setMissionInput(''); } };
  const executeProtocol = () => { setProtocolModal(false); confetti({ particleCount: 150, spread: 100, origin: { y: 0.8 }, colors: ['#c084fc', '#ffffff'] }); setTimeout(() => { setMode('morning'); window.scrollTo(0,0); }, 1000); };

  // --- THE CENTRAL FINALE TRIGGER ---
  const triggerGrandFinale = () => {
    setShowFinale(true);
    playSound('fireworks');
    const fireworks = new Fireworks(fireworksRef.current, { autoresize: true, opacity: 0.5, acceleration: 1.05, friction: 0.97, gravity: 1.5, particles: 50, traceLength: 3, traceSpeed: 10, explosion: 5, intensity: 30, flickering: 50, lineStyle: 'round', hue: { min: 0, max: 360 } });
    fireworks.start();
    setTimeout(() => {
      setShowFinale(false);
      fireworks.stop();
    }, 7000);
  };

  const toggleCompleted = async (mission) => { 
      const newCompleted = !mission.completed; 
      const activeCount = myMissions.filter(m => !m.completed && !m.crushed && m.id !== mission.id).length;
      if (newCompleted) {
          if (activeCount === 0 && myMissions.length > 0) triggerGrandFinale();
          else playSound('success');
      }
      const updates = { completed: newCompleted, crushed: newCompleted ? mission.crushed : false }; 
      const { error } = await supabase.from('missions').update(updates).eq('id', mission.id); 
      if (!error) { setMyMissions(myMissions.map(m => m.id === mission.id ? { ...m, ...updates } : m)); } 
  };

  const toggleCrushed = async (mission) => { 
      const newCrushed = !mission.crushed; 
      const activeCount = myMissions.filter(m => !m.completed && !m.crushed && m.id !== mission.id).length;
      if (newCrushed) {
          if (activeCount === 0 && myMissions.length > 0) triggerGrandFinale();
          else playSound('crush');
      }
      const updates = { crushed: newCrushed, completed: newCrushed ? true : mission.completed }; 
      const { error } = await supabase.from('missions').update(updates).eq('id', mission.id); 
      if (!error) { 
          setMyMissions(myMissions.map(m => m.id === mission.id ? { ...m, ...updates } : m)); 
          if(newCrushed) setCrushedHistory([ { ...mission, ...updates }, ...crushedHistory ]); 
          else setCrushedHistory(crushedHistory.filter(m => m.id !== mission.id)); 
      } 
  };

  const handleCapture = async () => { if (!currentInput.trim() && !mediaFile && !audioBlob) return; setUploading(true); let imageUrl = null; const timestamp = Date.now(); try { if (mediaFile) { const ext = mediaFile.name.split('.').pop() || 'mov'; const fileName = `${mediaType}-${timestamp}.${ext}`; await supabase.storage.from('images').upload(fileName, mediaFile); imageUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl; } const { data } = await supabase.from('thoughts').insert([{ text: currentInput, image_url: imageUrl, video_url: null, audio_url: null, is_quote: isQuoteMode, ignited: false, archived: false, user_id: session.user.id, goal_id: selectedGoalId, is_private: isPrivateVision }]).select(); if (data) { setMyThoughts([data[0], ...myThoughts]); setCurrentInput(''); setMediaFile(null); playSound('success'); } } finally { setUploading(false); } };
  
  function calculateStreak(data) { if (!data || data.length === 0) { setStreak(0); return; } const uniqueDates = [...new Set(data.map(item => new Date(item.created_at).toDateString()))]; setStreak(uniqueDates.length); }
  const toggleIgnite = async (id, currentStatus) => { if (!currentStatus) confetti({ particleCount: 150 }); await supabase.from('thoughts').update({ ignited: !currentStatus }).eq('id', id); setMyThoughts(myThoughts.map(t => t.id === id ? { ...t, ignited: !t.ignited } : t)); playSound('crush'); };
  const getGoalColor = (id) => myGoals.find(g => g.id === id)?.color || '#94a3b8';
  const getGoalTitle = (id) => myGoals.find(g => g.id === id)?.title || 'General';
  const getDisplayedThoughts = () => myThoughts.filter(t => (viewingGoal === 'all' || !viewingGoal ? true : t.goal_id === viewingGoal.id) && (showArchives ? t.archived : !t.archived));
  const getPartnerDisplayedThoughts = () => partnerThoughts.filter(t => !t.archived);

  return (
    <div style={mode === 'night' ? { background: 'black', color: 'white', minHeight: '100dvh', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } : { background: 'linear-gradient(135deg, #fdfbf7 0%, #e2e8f0 100%)', color: 'black', minHeight: '100dvh', padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <style>{globalStyles}</style>
      <div ref={fireworksRef} style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}></div>
      
      {showFinale && (
        <div className="finale-overlay">
          <Trophy size={80} color="gold" style={{ marginBottom: '20px' }} />
          <h1 style={{ fontSize: '48px', fontWeight: '900' }}>PERFECT DAY</h1>
          <p style={{ fontSize: '18px', fontWeight: '800' }}>GOALS NEUTRALIZED.</p>
        </div>
      )}

      {/* --- HEADER --- */}
      <div style={{ position: 'absolute', top: '60px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <img src={currentProfile?.avatar_url || tributeImage} style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid gold' }} onClick={() => setShowProfileMenu(!showProfileMenu)} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Flame color="#f97316" fill="#f97316" size={20} />
          <span style={{ fontWeight: 'bold', fontSize: '20px' }}>{streak}</span>
        </div>
      </div>

      <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', margin: 0 }}>Relay Vision.</h1>
        <div style={{ display: 'flex', gap: '5px', background: 'rgba(128,128,128,0.1)', padding: '5px', borderRadius: '12px', margin: '20px 0' }}>
            <button onClick={() => setMode('night')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: mode === 'night' ? 'white' : 'transparent', color: mode === 'night' ? 'black' : '#666', fontWeight: 'bold' }}>Night</button>
            <button onClick={() => setMode('morning')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: mode === 'morning' ? 'white' : 'transparent', color: mode === 'morning' ? 'black' : '#666', fontWeight: 'bold' }}>Morning</button>
        </div>

        {mode === 'night' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <input value={missionInput} onChange={(e) => setMissionInput(e.target.value)} placeholder="Assign Mission..." style={{ padding: '15px', borderRadius: '12px', background: '#111', border: '1px solid #333', color: 'white' }} />
             <button onClick={() => addMission()} style={{ background: '#c084fc', border: 'none', borderRadius: '12px', padding: '15px', color: 'white', fontWeight: 'bold' }}>Deploy Objective</button>
             <button onClick={() => setProtocolModal(true)} style={{ background: 'linear-gradient(to right, #c084fc, #a855f7)', padding: '20px', borderRadius: '20px', border: 'none', color: 'white', fontWeight: '900' }}>INITIATE PROTOCOL</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myMissions.map(m => (
              <div key={m.id} style={{ padding: '16px', background: m.completed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.03)', borderRadius: '16px', borderLeft: `5px solid ${getGoalColor(m.goal_id)}`, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div onClick={() => toggleCompleted(m)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid #444', background: m.completed ? getGoalColor(m.goal_id) : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  {m.completed && <Check size={16} color="white" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: getGoalColor(m.goal_id), fontWeight: 'bold' }}>{getGoalTitle(m.goal_id)}</div>
                  <div style={{ fontWeight: '600', textDecoration: m.completed ? 'line-through' : 'none', opacity: m.completed ? 0.5 : 1 }}>{m.task}</div>
                </div>
                <button onClick={() => toggleCrushed(m)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <Flame size={20} color={m.crushed ? '#f59e0b' : '#333'} fill={m.crushed ? '#f59e0b' : 'none'} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- ALL ORIGINAL MODALS (PARTNER, HISTORY, ETC) --- */}
      {partnerModal && ( <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <div style={{ background: '#1e293b', padding: '30px', borderRadius: '24px', border: '1px solid #334155' }}> <h3 style={{ color: 'white' }}>Ally Protocol</h3> <button onClick={() => setPartnerModal(false)} style={{ marginTop: '20px', color: '#64748b', background: 'none', border: 'none' }}>CLOSE</button> </div> </div> )}
      {historyModal && ( <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <div style={{ background: '#1e293b', padding: '30px', borderRadius: '24px', border: '1px solid #334155' }}> <h3 style={{ color: 'white' }}>History</h3> <button onClick={() => setHistoryModal(false)} style={{ marginTop: '20px', color: '#64748b', background: 'none', border: 'none' }}>CLOSE</button> </div> </div> )}
    </div>
  );
}
