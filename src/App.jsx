import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Moon, Sun, Archive, Target, Flame, LogOut, Lock, Mic, Video, Camera, X, Square, ListTodo, Quote as QuoteIcon, CheckSquare, Plus, Eye, RotateCcw, Trophy, ArrowLeft, Eraser, RefreshCcw, Trash2, ShieldCheck, AlertCircle, Edit3, Fingerprint, GripVertical, History, Users, Link as LinkIcon, Check, XCircle, MessageCircle, Heart, Send, Unlock, Save, Calendar, Upload, Image as ImageIcon, Settings, ChevronRight, Menu, Medal } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Fireworks } from 'fireworks-js';
import { Reorder } from "framer-motion";

// --- IMPORT THE TRIBUTE IMAGE DIRECTLY ---
import tributeImage from './tribute.png'; 

// --- ORGANIC AUDIO ENGINE (Phase 10.0) ---
const SFX = {
  success: new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'),
  // "Crush": Updated to a heavy fire swoosh (No more squeaking)
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
        playPromise.catch(error => console.log("Audio blocked:", error));
    }
  }
};

const globalStyles = `
  * { box-sizing: border-box; touch-action: manipulation; }
  html, body { margin: 0; padding: 0; overflow-x: hidden; -webkit-text-size-adjust: 100%; overscroll-behavior-y: none; }
  ::--webkit-scrollbar { display: none; }
  input, textarea, button { font-size: 16px !important; }
  .finale-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; animation: fadeIn 0.5s ease-out; color: gold; text-align: center; }
  .finale-text { font-size: 42px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
`;

// --- AUTH COMPONENT ---
function Auth() {
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
    if (error) setMessage(error.message);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #1f1f22 0%, #000000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'white' }}>
      <style>{globalStyles}</style>
      <div style={{ maxWidth: '350px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}> <div style={{ background: 'rgba(192, 132, 252, 0.1)', padding: '20px', borderRadius: '50%' }}> <Lock size={40} color="#c084fc" /> </div> </div>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Relay Vision.</h1>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #333', background: '#111', color: 'white' }} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #333', background: '#111', color: 'white' }} required />
          {isSignUp && ( <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #333', background: '#111', color: 'white' }} required /> )}
          <button disabled={loading} style={{ padding: '16px', borderRadius: '12px', background: 'white', color: 'black', fontWeight: 'bold' }}>{loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Enter System')}</button>
        </form>
        {message && <p style={{ color: '#ef4444' }}>{message}</p>}
        <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: '#666' }}>{isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}</button>
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
  const [myThoughts, setMyThoughts] = useState([]);
  const [partnerThoughts, setPartnerThoughts] = useState([]);
  const [myMissions, setMyMissions] = useState([]);
  const [partnerMissions, setPartnerMissions] = useState([]);
  const [myGoals, setMyGoals] = useState([]);
  const [partnerGoals, setPartnerGoals] = useState([]);
  const [streak, setStreak] = useState(0); 
  const [partnerStreak, setPartnerStreak] = useState(0); 
  const [viewingGoal, setViewingGoal] = useState(null); 
  const [showArchives, setShowArchives] = useState(false);
  const [showFinale, setShowFinale] = useState(false);
  const [missionInput, setMissionInput] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState(null); 
  const [currentProfile, setCurrentProfile] = useState(null);
  const [notification, setNotification] = useState(null);
  const [tempVictoryNotes, setTempVictoryNotes] = useState({});
  const [currentInput, setCurrentInput] = useState('');
  const [newGoalInput, setNewGoalInput] = useState('');
  const [showGoalCreator, setShowGoalCreator] = useState(false);
  const [isPrivateGoal, setIsPrivateGoal] = useState(false);
  const [isPrivateMission, setIsPrivateMission] = useState(false);
  const [isPrivateVision, setIsPrivateVision] = useState(false);
  const [isQuoteMode, setIsQuoteMode] = useState(false);
  const [recentMissions, setRecentMissions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, title: '' });
  const [protocolModal, setProtocolModal] = useState(false);
  const [cheerModal, setCheerModal] = useState({ isOpen: false, missionId: null });
  const [cheerInput, setCheerInput] = useState('');
  const [historyModal, setHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [partnerModal, setPartnerModal] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [mediaFile, setMediaFile] = useState(null); 
  const [audioBlob, setAudioBlob] = useState(null); 
  const [mediaType, setMediaType] = useState('text'); 
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [debugLog, setDebugLog] = useState('');

  const fireworksRef = useRef(null);
  const fireworksInstance = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const menuRef = useRef(null);

  const goalColors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b'];
  const [newGoalColor, setNewGoalColor] = useState(goalColors[0]);

  // --- FINALE LOGIC ---
  const triggerGrandFinale = () => {
    setShowFinale(true);
    playSound('fireworks');
    if (fireworksRef.current) {
      fireworksInstance.current = new Fireworks(fireworksRef.current, {
        autoresize: true, opacity: 0.5, acceleration: 1.05, friction: 0.97, gravity: 1.5,
        particles: 50, explosion: 5, intensity: 30, hue: { min: 0, max: 360 }
      });
      fireworksInstance.current.start();
    }
    setTimeout(() => {
      setShowFinale(false);
      if (fireworksInstance.current) fireworksInstance.current.stop();
    }, 7000);
  };

  const calculateStreak = (data, setStreakFn) => { 
    if (!data || data.length === 0) { setStreakFn(0); return; } 
    const uniqueDates = [...new Set(data.map(item => new Date(item.created_at).toDateString()))]; 
    setStreakFn(uniqueDates.length); 
  };

  const fetchAllData = useCallback(async () => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (profile) setCurrentProfile(profile);

    const { data: gData } = await supabase.from('goals').select('*');
    if (gData) {
      setMyGoals(gData.filter(i => i.user_id === session.user.id));
      setPartnerGoals(gData.filter(i => i.user_id !== session.user.id));
    }
    const { data: tData } = await supabase.from('thoughts').select('*').order('created_at', { ascending: false });
    if (tData) {
      const mine = tData.filter(i => i.user_id === session.user.id);
      setMyThoughts(mine);
      setPartnerThoughts(tData.filter(i => i.user_id !== session.user.id));
      calculateStreak(mine, setStreak);
    }
    const { data: mData } = await supabase.from('missions').select('*').order('created_at', { ascending: true });
    if (mData) {
      const myHistory = mData.filter(i => i.user_id === session.user.id);
      setHistoryData(myHistory);
      setMyMissions(myHistory.filter(i => i.is_active));
      setPartnerMissions(mData.filter(i => i.user_id !== session.user.id && i.is_active));
    }
  }, [session]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // --- UPDATED TOGGLES WITH FINALE CHECK ---
  const toggleCompleted = async (mission) => {
    const newCompleted = !mission.completed;
    const activeRemaining = myMissions.filter(m => !m.completed && !m.crushed && m.id !== mission.id).length;

    if (newCompleted) {
      if (activeRemaining === 0) triggerGrandFinale();
      else playSound('success');
    }

    const { error } = await supabase.from('missions').update({ completed: newCompleted }).eq('id', mission.id);
    if (!error) setMyMissions(myMissions.map(m => m.id === mission.id ? { ...m, completed: newCompleted } : m));
  };

  const toggleCrushed = async (mission) => {
    const newCrushed = !mission.crushed;
    const activeRemaining = myMissions.filter(m => !m.completed && !m.crushed && m.id !== mission.id).length;

    if (newCrushed) {
      if (activeRemaining === 0) triggerGrandFinale();
      else playSound('crush');
    }

    const updates = { crushed: newCrushed, completed: newCrushed ? true : mission.completed };
    const { error } = await supabase.from('missions').update(updates).eq('id', mission.id);
    if (!error) setMyMissions(myMissions.map(m => m.id === mission.id ? { ...m, ...updates } : m));
  };

  // --- SUPPORTING UI HANDLERS ---
  const addMission = async () => {
    if (!missionInput.trim()) return;
    const { data, error } = await supabase.from('missions').insert([{ task: missionInput, user_id: session.user.id, goal_id: selectedGoalId, is_active: true }]).select();
    if (!error) { setMyMissions([...myMissions, data[0]]); setMissionInput(''); }
  };

  const getGoalColor = (id) => myGoals.find(g => g.id === id)?.color || '#94a3b8';
  const getGoalTitle = (id) => myGoals.find(g => g.id === id)?.title || 'General';

  return (
    <div style={{ background: mode === 'night' ? 'black' : '#f8fafc', color: mode === 'night' ? 'white' : 'black', minHeight: '100vh', padding: '20px' }}>
      <style>{globalStyles}</style>
      
      {/* GRAND FINALE OVERLAY */}
      {showFinale && (
        <div className="finale-overlay">
          <div ref={fireworksRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          <Trophy size={80} color="gold" style={{ zIndex: 10, marginBottom: '20px' }} />
          <h1 className="finale-text">Perfect Day</h1>
          <p style={{ zIndex: 10, fontSize: '18px', fontWeight: '800' }}>Protocol Successfully Executed.</p>
        </div>
      )}

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
        <img src={currentProfile?.avatar_url || tributeImage} style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid gold' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Flame color="#f97316" fill="#f97316" size={20} />
          <span style={{ fontWeight: 'bold', fontSize: '20px' }}>{streak}</span>
        </div>
      </div>

      <div style={{ maxWidth: '400px', margin: '0 auto', marginTop: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', margin: 0 }}>Relay Vision.</h1>
        
        {/* MODE TOGGLE */}
        <div style={{ display: 'flex', gap: '5px', background: 'rgba(128,128,128,0.1)', padding: '5px', borderRadius: '12px', margin: '20px 0' }}>
          <button onClick={() => setMode('night')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: mode === 'night' ? 'white' : 'transparent', color: mode === 'night' ? 'black' : '#666', fontWeight: 'bold' }}>Night</button>
          <button onClick={() => setMode('morning')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: mode === 'morning' ? 'white' : 'transparent', color: mode === 'morning' ? 'black' : '#666', fontWeight: 'bold' }}>Morning</button>
        </div>

        {/* NIGHT MODE INPUT */}
        {mode === 'night' && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input value={missionInput} onChange={(e) => setMissionInput(e.target.value)} placeholder="Assign Mission..." style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#111', border: '1px solid #333', color: 'white' }} />
            <button onClick={addMission} style={{ background: '#c084fc', border: 'none', borderRadius: '12px', padding: '0 20px', color: 'white' }}><Plus /></button>
          </div>
        )}

        {/* MISSION LOG */}
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
      </div>
    </div>
  );
}
