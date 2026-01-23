import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Moon, Sun, Archive, Target, Flame, LogOut, Lock, Mic, Video, Camera, X, Square, ListTodo, Quote as QuoteIcon, CheckSquare, Plus, Eye, RotateCcw, Trophy, ArrowLeft, Eraser, RefreshCcw, Trash2, ShieldCheck, AlertCircle, Edit3, Fingerprint, GripVertical, History, Users, Link as LinkIcon, Check, XCircle, MessageCircle, Heart, Send, Unlock, Save, Calendar, Upload, Image as ImageIcon, Settings, ChevronRight, Menu, HelpCircle, BarChart3, Terminal, ClipboardList, LayoutGrid, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Fireworks } from 'fireworks-js';
import { Reorder, useDragControls } from "framer-motion";

// --- IMPORT THE TRIBUTE IMAGE DIRECTLY ---
import tributeImage from './tribute.png'; 

const globalStyles = `
  * { box-sizing: border-box; touch-action: manipulation; }
  html, body { margin: 0; padding: 0; overflow-x: hidden; -webkit-text-size-adjust: 100%; overscroll-behavior-y: none; scrollbar-width: none; -ms-overflow-style: none; }
  ::-webkit-scrollbar { display: none; width: 0px; background: transparent; }
  input, textarea, button, select { font-size: 16px !important; }
  -webkit-tap-highlight-color: transparent;
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

  const [currentInput, setCurrentInput] = useState('');
  const [missionInput, setMissionInput] = useState('');
  const [newGoalInput, setNewGoalInput] = useState('');
  const [showGoalCreator, setShowGoalCreator] = useState(false);
  const [recentMissions, setRecentMissions] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const [debugLog, setDebugLog] = useState('');
  
  // MODALS & STATES
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, title: '' });
  const [protocolModal, setProtocolModal] = useState(false);
  const [cheerModal, setCheerModal] = useState({ isOpen: false, missionId: null });
  const [cheerInput, setCheerInput] = useState('');
  const [historyModal, setHistoryModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  
  // --- NEW STATES ---
  const [activeZone, setActiveZone] = useState(null); 
  const [modalTab, setModalTab] = useState('mission'); 
  const [showManifestReview, setShowManifestReview] = useState(false); 

  // MENU STATE
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

  // DATA STREAMS
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

  useEffect(() => {
    const preventZoom = (e) => { if (e.touches.length > 1) { e.preventDefault(); } };
    document.addEventListener('touchmove', preventZoom, { passive: false });
    let lastTouchEnd = 0;
    const preventDoubleTap = (e) => { const now = (new Date()).getTime(); if (now - lastTouchEnd <= 300) { e.preventDefault(); } lastTouchEnd = now; };
    document.addEventListener('touchend', preventDoubleTap, { passive: false });
    const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setShowProfileMenu(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { 
        document.removeEventListener('touchmove', preventZoom); 
        document.removeEventListener('touchend', preventDoubleTap);
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => { localStorage.setItem('visionMode', mode); }, [mode]);
  useEffect(() => { fetchAllData(); }, [session]);

  const showNotification = (msg, type = 'success') => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 4000); };

  // --- DATA FETCHING ---
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

  // --- REALTIME ENGINE ---
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

  // --- AVATAR UPLOAD ---
  const handleAvatarUpload = async (event) => {
      try {
          setUploading(true);
          const file = event.target.files[0];
          if (!file) return;
          const fileExt = file.name.split('.').pop();
          const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;
          const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
          const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
          if (updateError) throw updateError;
          setCurrentProfile({ ...currentProfile, avatar_url: publicUrl });
          showNotification("Profile Picture Updated!", "success");
          setShowProfileMenu(false);
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
  const clearDailyMissions = async () => { if(!window.confirm("Clear the board for tomorrow? (Crushed wins will be saved in folders)")) return; await supabase.from('missions').delete().eq('user_id', session.user.id).eq('crushed', false); await supabase.from('missions').update({ is_active: false }).eq('user_id', session.user.id).eq('crushed', true); fetchAllData(); };
  const createGoal = async () => { if (!newGoalInput.trim()) return; const { data, error } = await supabase.from('goals').insert([{ title: newGoalInput, color: newGoalColor, user_id: session.user.id, is_private: isPrivateGoal }]).select(); if (!error && data) { setMyGoals([...myGoals, data[0]]); setNewGoalInput(''); setIsPrivateGoal(false); setShowGoalCreator(false); setSelectedGoalId(data[0].id); } };
  const toggleGoalPrivacy = async (goal) => { const newStatus = !goal.is_private; const { error } = await supabase.from('goals').update({ is_private: newStatus }).eq('id', goal.id); if(!error) { setMyGoals(myGoals.map(g => g.id === goal.id ? { ...g, is_private: newStatus } : g)); showNotification(newStatus ? "Goal Locked (Private)" : "Goal Unlocked (Shared)", "neutral"); } };
  const initiateDeleteGoal = (id, title, e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'goal', id, title: `Delete "${title}"?` }); };
  const initiateDeleteThought = (id) => { setDeleteModal({ isOpen: true, type: 'thought', id, title: 'Delete this vision?' }); };
  const executeDelete = async () => { const { type, id } = deleteModal; if (type === 'goal') { await supabase.from('goals').delete().eq('id', id); setMyGoals(myGoals.filter(g => g.id !== id)); if(selectedGoalId === id) setSelectedGoalId(null); } else if (type === 'thought') { await supabase.from('thoughts').delete().eq('id', id); const newThoughts = myThoughts.filter(t => t.id !== id); setMyThoughts(newThoughts); calculateStreak(newThoughts); } setDeleteModal({ isOpen: false, type: null, id: null, title: '' }); };
  const addMission = async (taskText = missionInput, goalId = selectedGoalId) => { if (!taskText.trim()) return; const { data, error } = await supabase.from('missions').insert([{ task: taskText, user_id: session.user.id, completed: false, crushed: false, is_active: true, goal_id: goalId, is_private: isPrivateMission }]).select(); if (!error && data) { setMyMissions([...myMissions, data[0]]); setMissionInput(''); setIsPrivateMission(false); } };
  const handleLockIn = () => { setShowManifestReview(false); confetti({ particleCount: 150, spread: 100, origin: { y: 0.8 }, colors: ['#c084fc', '#ffffff'] }); setTimeout(() => { setMode('morning'); window.scrollTo(0,0); }, 1000); };
  const toggleCompleted = async (mission) => { const newCompleted = !mission.completed; const updates = { completed: newCompleted, crushed: newCompleted ? mission.crushed : false }; const nextMissions = myMissions.map(m => m.id === mission.id ? { ...m, ...updates } : m); const allDone = nextMissions.length > 0 && nextMissions.every(m => m.completed || m.crushed); if (newCompleted && !mission.completed) { const goal = myGoals.find(g => g.id === mission.goal_id); const color = goal ? goal.color : '#cbd5e1'; const fireworks = new Fireworks(fireworksRef.current, { autoresize: true, opacity: 0.5, acceleration: 1.05, friction: 0.97, gravity: 1.5, particles: 50, traceLength: 3, traceSpeed: 10, explosion: 5, intensity: 30, flickering: 50, lineStyle: 'round', hue: { min: 0, max: 360 }, delay: { min: 30, max: 60 }, rocketsPoint: { min: 50, max: 50 }, lineWidth: { explosion: { min: 1, max: 3 }, trace: { min: 1, max: 2 } }, brightness: { min: 50, max: 80 }, decay: { min: 0.015, max: 0.03 }, mouse: { click: false, move: false, max: 1 } }); if (allDone) { fireworks.start(); setTimeout(() => { fireworks.waitStop(true); }, 5000); } else { confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 }, colors: [color], scalar: 0.8 }); } } const { error } = await supabase.from('missions').update(updates).eq('id', mission.id); if (!error) { setMyMissions(nextMissions); } };
  const toggleCrushed = async (mission) => { const newCrushed = !mission.crushed; const updates = { crushed: newCrushed, completed: newCrushed ? true : mission.completed }; const nextMissions = myMissions.map(m => m.id === mission.id ? { ...m, ...updates } : m); const allDone = nextMissions.length > 0 && nextMissions.every(m => m.completed || m.crushed); if (newCrushed) { if (allDone) { const fireworks = new Fireworks(fireworksRef.current, { autoresize: true, opacity: 0.5, acceleration: 1.05, friction: 0.97, gravity: 1.5, particles: 50, traceLength: 3, traceSpeed: 10, explosion: 5, intensity: 30, flickering: 50, lineStyle: 'round', hue: { min: 0, max: 360 }, delay: { min: 30, max: 60 }, rocketsPoint: { min: 50, max: 50 }, lineWidth: { explosion: { min: 1, max: 3 }, trace: { min: 1, max: 2 } }, brightness: { min: 50, max: 80 }, decay: { min: 0.015, max: 0.03 }, mouse: { click: false, move: false, max: 1 } }); fireworks.start(); setTimeout(() => { fireworks.waitStop(true); }, 5000); } else { confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 }, colors: ['#f59e0b', '#fbbf24', '#ffffff'], scalar: 1.2 }); } } const { error } = await supabase.from('missions').update(updates).eq('id', mission.id); if (!error) { setMyMissions(nextMissions); if(newCrushed) setCrushedHistory([ { ...mission, ...updates }, ...crushedHistory ]); else setCrushedHistory(crushedHistory.filter(m => m.id !== mission.id)); } };
  const handleDraftChange = (id, text) => { setTempVictoryNotes({ ...tempVictoryNotes, [id]: text }); };
  const handleNoteSave = async (id) => { const note = tempVictoryNotes[id]; if (!note || !note.trim()) return; const { error } = await supabase.from('missions').update({ victory_note: note }).eq('id', id); if (!error) { setMyMissions(myMissions.map(m => m.id === id ? { ...m, victory_note: note } : m)); setCrushedHistory(crushedHistory.map(m => m.id === id ? { ...m, victory_note: note } : m)); showNotification("Victory Locked In.", "success"); } };
  const deleteMission = async (id) => { const { error } = await supabase.from('missions').delete().eq('id', id); if (!error) setMyMissions(myMissions.filter(m => m.id !== id)); };
  const openCheerModal = (id) => { setCheerInput(''); setCheerModal({ isOpen: true, missionId: id }); };
  const submitCheer = async () => { if(!cheerInput.trim() || !cheerModal.missionId) return; const { error } = await supabase.from('missions').update({ cheer_note: cheerInput }).eq('id', cheerModal.missionId); if(!error) { setPartnerMissions(partnerMissions.map(m => m.id === cheerModal.missionId ? { ...m, cheer_note: cheerInput } : m)); showNotification("Cheer sent!", "success"); setCheerModal({ isOpen: false, missionId: null }); } };
  const handleFileSelect = (event, type) => { const file = event.target.files[0]; if (file) { if (file.size > 50 * 1024 * 1024) { setDebugLog("Error: File too large (Max 50MB)."); return; } setMediaFile(file); setAudioBlob(null); setMediaType(type); setPreviewUrl(URL.createObjectURL(file)); setIsQuoteMode(false); setDebugLog(''); } };
  const startAudioRecording = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); let options = {}; if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' }; else if (MediaRecorder.isTypeSupported('audio/webm')) options = { mimeType: 'audio/webm' }; const recorder = new MediaRecorder(stream, options); mediaRecorderRef.current = recorder; audioChunksRef.current = []; recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); }; recorder.onstop = () => { const type = options.mimeType || 'audio/webm'; const blob = new Blob(audioChunksRef.current, { type }); setAudioBlob(blob); setMediaFile(null); setMediaType('audio'); setPreviewUrl(URL.createObjectURL(blob)); setIsQuoteMode(false); stream.getTracks().forEach(track => track.stop()); }; recorder.start(); setIsRecordingAudio(true); setDebugLog('Recording Audio...'); } catch (err) { alert("Microphone access denied."); } };
  const stopAudioRecording = () => { if (mediaRecorderRef.current && isRecordingAudio) { mediaRecorderRef.current.stop(); setIsRecordingAudio(false); setDebugLog(''); } };
  const clearMedia = () => { setMediaFile(null); setAudioBlob(null); setMediaType('text'); setPreviewUrl(null); setIsQuoteMode(false); if (fileInputRef.current) fileInputRef.current.value = ''; if (videoInputRef.current) videoInputRef.current.value = ''; };
  const handleCapture = async () => { if (!currentInput.trim() && !mediaFile && !audioBlob) return; setUploading(true); setDebugLog('Securing Relay...'); let imageUrl = null; let videoUrl = null; let audioUrl = null; const timestamp = Date.now(); try { if (mediaFile) { const ext = mediaFile.name.split('.').pop() || 'mov'; const fileName = `${mediaType}-${timestamp}.${ext}`; const { data, error } = await supabase.storage.from('images').upload(fileName, mediaFile); if (error) throw error; if (data) { const publicUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl; if (mediaType === 'image') imageUrl = publicUrl; if (mediaType === 'video') videoUrl = publicUrl; } } if (audioBlob) { const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm'; const fileName = `audio-${timestamp}.${ext}`; const { data, error } = await supabase.storage.from('images').upload(fileName, audioBlob); if (error) throw error; if (data) audioUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl; } const { data, error } = await supabase.from('thoughts').insert([{ text: currentInput, image_url: imageUrl, video_url: videoUrl, audio_url: audioUrl, is_quote: isQuoteMode, ignited: false, archived: false, user_id: session.user.id, goal_id: selectedGoalId, is_private: isPrivateVision }]).select(); if (error) throw error; if (data) { setMyThoughts([data[0], ...myThoughts]); calculateStreak([data[0], ...myThoughts]); setCurrentInput(''); clearMedia(); setIsPrivateVision(false); setDebugLog('Relay Secured.'); setTimeout(() => setDebugLog(''), 2000); } } catch (err) { console.error(err); setDebugLog("Error: " + err.message); } finally { setUploading(false); } };
  function calculateStreak(data) { if (!data || data.length === 0) { setStreak(0); return; } const uniqueDates = [...new Set(data.map(item => new Date(item.created_at).toDateString()))]; const sortedDates = uniqueDates.map(d => new Date(d)).sort((a, b) => b - a); const today = new Date().toDateString(); const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); if (sortedDates[0].toDateString() !== today && sortedDates[0].toDateString() !== yesterday.toDateString()) { setStreak(0); return; } let currentStreak = 0; let checkDate = new Date(); if (sortedDates[0].toDateString() !== today) checkDate.setDate(checkDate.getDate() - 1); for (let i = 0; i < sortedDates.length; i++) { if (sortedDates[i].toDateString() === checkDate.toDateString()) { currentStreak++; checkDate.setDate(checkDate.getDate() - 1); } else break; } setStreak(currentStreak); }
  const deleteThought = async (id) => { const { error } = await supabase.from('thoughts').delete().eq('id', id); if (!error) { const newThoughts = myThoughts.filter(t => t.id !== id); setMyThoughts(newThoughts); calculateStreak(newThoughts); } };
  const toggleIgnite = async (id, currentStatus) => { if (!currentStatus) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: mode === 'night' ? ['#c084fc', '#a855f7', '#ffffff'] : ['#fbbf24', '#f59e0b', '#ef4444'] }); const { error } = await supabase.from('thoughts').update({ ignited: !currentStatus }).eq('id', id); if (!error) setMyThoughts(myThoughts.map(t => t.id === id ? { ...t, ignited: !t.ignited } : t)); };
  const toggleArchive = async (id, currentStatus) => { const { error } = await supabase.from('thoughts').update({ archived: !currentStatus }).eq('id', id); if (!error) setMyThoughts(myThoughts.map(t => t.id === id ? { ...t, archived: !currentStatus } : t)); };
  const handleLogout = async () => { await supabase.auth.signOut(); };
  const getGoalColor = (id) => { const g = myGoals.find(g => g.id === id); if(g) return g.color; const pg = partnerGoals.find(g => g.id === id); return pg ? pg.color : '#94a3b8'; }
  const getGoalTitle = (id) => { const g = myGoals.find(g => g.id === id); if(g) return g.title; const pg = partnerGoals.find(g => g.id === id); return pg ? pg.title : 'General'; }
  const randomQuote = myThoughts.filter(t => t.is_quote && !t.archived).length > 0 ? myThoughts.filter(t => t.is_quote && !t.archived)[Math.floor(Math.random() * myThoughts.filter(t => t.is_quote && !t.archived).length)] : null;
  const nightStyle = { background: 'radial-gradient(circle at center, #1f1f22 0%, #000000 100%)', color: 'white', minHeight: '100dvh', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
  const morningStyle = { background: 'linear-gradient(135deg, #fdfbf7 0%, #e2e8f0 100%)', color: 'black', minHeight: '100dvh', padding: '24px', display: 'flex', flexDirection: 'column' };
  const getDisplayedThoughts = () => { const relevant = myThoughts.filter(t => viewingGoal === 'all' ? true : t.goal_id === viewingGoal.id); return relevant.filter(t => showArchives ? t.archived : !t.archived).sort((a, b) => Number(a.ignited) - Number(b.ignited)); };
  const getPartnerDisplayedThoughts = () => { const relevant = partnerThoughts.filter(t => viewingGoal === 'all' ? true : t.goal_id === viewingGoal.id); return relevant.filter(t => !t.archived).sort((a, b) => Number(a.ignited) - Number(b.ignited)); };
  
  // --- DASHBOARD LOGIC ---
  const activeMissions = myMissions.filter(m => !m.completed && !m.crushed);
  const completedMissions = myMissions.filter(m => m.completed || m.crushed);
  const totalMissions = myMissions.length;
  const progressPercent = totalMissions === 0 ? 0 : Math.round((completedMissions.length / totalMissions) * 100);
  
  const handleReorder = (newOrder) => { setMyMissions([...newOrder, ...completedMissions]); };

  // --- HELPER: GET ZONE STATS FOR HUB ---
  const getZoneStats = (goalId) => {
      // Logic: A zone is "lit" if it has active missions for tomorrow
      const missionCount = myMissions.filter(m => m.goal_id === goalId && !m.completed && !m.crushed).length;
      return { count: missionCount, lit: missionCount > 0 };
  };

  // --- HELPER: GET UNIQUE RECENTS FOR ZONE ---
  const getUniqueRecentsForZone = (goalId) => {
      // Filter history for tasks matching this zone, dedup, and take top 5
      const zoneHistory = historyData.filter(m => m.goal_id === goalId);
      const unique = [...new Map(zoneHistory.map(item => [item['task'], item])).values()];
      return unique.slice(0, 5);
  }

  return (
    <div style={mode === 'night' ? nightStyle : morningStyle}>
       <style>{globalStyles}</style>
       <div ref={fireworksRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}></div>
       
       {/* --- NOTIFICATION TOAST --- */}
       {notification && ( <div style={{ position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 20000, background: notification.type === 'crushed' ? '#f59e0b' : (notification.type === 'error' ? '#ef4444' : '#10b981'), padding: '12px 24px', borderRadius: '30px', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', animation: 'fadeIn 0.3s' }}> {notification.msg} </div> )}
       
       {/* --- HISTORY CALENDAR MODAL --- */}
       {historyModal && (
           <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
               <div style={{ background: '#1e293b', padding: '24px', borderRadius: '24px', width: '90%', maxWidth: '340px', border: '1px solid #334155' }}>
                   <h3 style={{ color: 'white', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={20} /> History Log</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginTop: '20px' }}>
                       {['S','M','T','W','T','F','S'].map(d => <span key={d} style={{ color: '#94a3b8', fontSize: '10px', textAlign: 'center' }}>{d}</span>)}
                       {getHistoryDays().map((d, i) => (
                           <div key={i} style={{ height: '30px', borderRadius: '8px', background: d.total === 0 ? '#334155' : (d.completed + d.crushed === d.total ? '#10b981' : (d.completed + d.crushed > 0 ? '#f59e0b' : '#ef4444')), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'white' }}>
                               {d.date.getDate()}
                           </div>
                       ))}
                   </div>
                   <button onClick={() => setHistoryModal(false)} style={{ width: '100%', padding: '12px', marginTop: '20px', borderRadius: '16px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1' }}>Close</button>
               </div>
           </div>
       )}

      {/* --- CONTEXT-AWARE SYSTEM MANUAL --- */}
      {showGuide && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#1e293b', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '340px', border: '1px solid #475569', color: 'white' }}>
            
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', color: mode === 'night' ? '#c084fc' : '#f59e0b' }}>
                <HelpCircle size={24} /> {mode === 'night' ? 'NIGHT OPS: STRATEGY' : 'DAY OPS: EXECUTION'}
              </h3>
              <button onClick={() => setShowGuide(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            {/* NIGHT MODE CONTENT */}
            {mode === 'night' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '25px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '16px' }}>1. The War Room</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4' }}>
                    This is your strategic hub. Tap a <b>Zone Tile</b> to open its planning sheet.
                  </p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '16px' }}>2. Mission vs Vision</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4' }}>
                    Inside the sheet, toggle between <b>MISSION</b> (daily tasks) and <b>VISION</b> (uploads & goals). Use "Enter" to rapid-fire tasks.
                  </p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '16px' }}>3. Initiate Protocol</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4' }}>
                    Once your zones are ready, hit the big purple button to review your <b>Manifest</b> and lock in the day.
                  </p>
                </div>
              </div>
            )}

            {/* MORNING MODE CONTENT */}
            {mode === 'morning' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '25px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '16px' }}>1. The Standard</h4>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                     <div style={{ flex: 1, background: '#f0fdf4', padding: '8px', borderRadius: '8px', color: '#166534', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
                        <CheckSquare size={14} style={{ display: 'block', margin: '0 auto 4px auto' }} /> COMPLETE
                     </div>
                     <div style={{ flex: 1, background: '#fffbeb', padding: '8px', borderRadius: '8px', color: '#b45309', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #fcd34d' }}>
                        <Flame size={14} style={{ display: 'block', margin: '0 auto 4px auto' }} /> CRUSHED
                     </div>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4' }}>
                    Use "Crushed" when you exceed expectations. You will be asked to leave a "Victory Note" as proof.
                  </p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '16px' }}>2. Recruit an Ally</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4' }}>
                    Go to the <b>Ally Tab</b> <Users size={12} /> to invite a partner via email. Once linked, you can see their Missions and send "Boosts" to keep them accountable.
                  </p>
                </div>
              </div>
            )}

            <button onClick={() => setShowGuide(false)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: mode === 'night' ? '#c084fc' : '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
              UNDERSTOOD
            </button>
          </div>
        </div>
      )}

       {/* ... (Previous Modals for Delete/Cheer/Protocol/Partner) ... */}
       {deleteModal.isOpen && ( <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}> <div style={{ background: '#1e293b', padding: '24px', borderRadius: '24px', width: '85%', maxWidth: '300px', textAlign: 'center', border: '1px solid #334155', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}> <h3 style={{ margin: '0 0 16px 0', color: 'white', fontSize: '18px' }}>{deleteModal.title}</h3> <div style={{ display: 'flex', gap: '10px' }}> <button onClick={() => setDeleteModal({ isOpen: false, type: null, id: null, title: '' })} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #475569', background: 'transparent', color: '#cbd5e1', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button> <button onClick={executeDelete} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button> </div> </div> </div> )}
       {/* (OLD PROTOCOL MODAL REMOVED - REPLACED BY MANIFEST REVIEW) */}
       {cheerModal.isOpen && ( <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}> <div style={{ background: '#1e293b', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '340px', textAlign: 'center', border: '2px solid #16a34a', boxShadow: '0 0 40px rgba(22, 163, 74, 0.3)' }}> <MessageCircle size={48} color="#22c55e" style={{ marginBottom: '20px' }} /> <h3 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Send a Boost</h3> <input type="text" placeholder="Keep pushing..." value={cheerInput} onChange={(e) => setCheerInput(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0f172a', border: '1px solid #334155', color: 'white', marginBottom: '20px', outline: 'none', textAlign: 'center' }} /> <div style={{ display: 'flex', gap: '10px' }}> <button onClick={() => setCheerModal({ isOpen: false, missionId: null })} style={{ flex: 1, padding: '12px', borderRadius: '16px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button> <button onClick={submitCheer} style={{ flex: 1, padding: '12px', borderRadius: '16px', border: 'none', background: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>Send <Send size={14}/></button> </div> </div> </div> )}
       {partnerModal && ( <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}> <div style={{ background: '#1e293b', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '340px', textAlign: 'center', border: '1px solid #334155', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}> <Users size={48} color={currentProfile?.status === 'active' ? '#10b981' : '#60a5fa'} style={{ marginBottom: '20px' }} /> <h3 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '22px', fontWeight: '900', textTransform: 'uppercase' }}>Ally Protocol</h3> {currentProfile?.status === 'active' && ( <> <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px', marginBottom: '20px' }}>STATUS: ACTIVE</p> <div style={{ background: '#0f172a', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}> <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>LINKED PARTNER:</p> <p style={{ color: 'white', fontWeight: 'bold', margin: '5px 0 0 0' }}>{currentProfile.partner_email}</p> </div> <button onClick={declineInvite} style={{ width: '100%', padding: '12px', borderRadius: '16px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}> SEVER CONNECTION </button> </> )} {currentProfile?.status === 'pending' && currentProfile?.initiator_id === session.user.id && ( <> <p style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '14px', marginBottom: '20px' }}>STATUS: PENDING ACCEPTANCE</p> <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '20px' }}>Invitation sent to <b>{currentProfile.partner_email}</b>. Waiting for them to confirm.</p> <button onClick={declineInvite} style={{ width: '100%', padding: '12px', borderRadius: '16px', border: 'none', background: '#334155', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}> CANCEL INVITE </button> </> )} {currentProfile?.status === 'pending' && currentProfile?.initiator_id !== session.user.id && ( <> <p style={{ color: '#f97316', fontWeight: 'bold', fontSize: '14px', marginBottom: '20px' }}>INCOMING REQUEST</p> <p style={{ color: 'white', fontSize: '16px', marginBottom: '20px' }}><b>{currentProfile.partner_email}</b> wants to link protocols.</p> <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}> <button onClick={acceptInvite} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}><Check size={20} /></button> <button onClick={declineInvite} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}><XCircle size={20} /></button> </div> </> )} {!currentProfile?.partner_id && ( <> <p style={{ margin: '0 0 20px 0', color: '#cbd5e1', fontSize: '14px' }}> "Iron sharpens iron. Link with one partner to see their visions." </p> <input type="email" placeholder="Partner Email" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#334155', border: '1px solid #475569', color: 'white', marginBottom: '20px', outline: 'none' }} /> <button onClick={sendInvite} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}> <LinkIcon size={16} /> SEND INVITE </button> </> )} <button onClick={() => setPartnerModal(false)} style={{ width: '100%', padding: '12px', borderRadius: '16px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}> CLOSE </button> </div> </div> )}

       <div style={{ position: 'absolute', top: '60px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          
          {/* --- TOP LEFT: IDENTITY & MENU --- */}
          <div style={{ position: 'relative' }} ref={menuRef}>
              <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}> 
                  <img 
                    src={currentProfile?.avatar_url || tributeImage} 
                    style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '50%', 
                        objectFit: 'cover', 
                        backgroundColor: currentProfile?.avatar_url ? 'transparent' : 'white',
                        border: currentProfile?.avatar_url ? `2px solid ${mode === 'night' ? '#333' : '#cbd5e1'}` : '2px solid #fbbf24', 
                        boxShadow: currentProfile?.avatar_url ? 'none' : '0 0 10px rgba(251, 191, 36, 0.5)' 
                    }} 
                  />
              </button>
              
              {/* PROFILE DROPDOWN MENU */}
              {showProfileMenu && (
                  <div style={{ position: 'absolute', top: '55px', left: 0, background: mode === 'night' ? '#1e293b' : 'white', border: '1px solid #334155', borderRadius: '16px', padding: '8px', width: '180px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <button onClick={() => avatarInputRef.current.click()} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: mode === 'night' ? 'white' : '#1e293b', fontSize: '14px', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}>
                          <Upload size={16} /> Upload Photo
                      </button>
                      <button onClick={() => { setMode(mode === 'night' ? 'morning' : 'night'); setShowProfileMenu(false); }} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: mode === 'night' ? 'white' : '#1e293b', fontSize: '14px', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}>
                          {mode === 'night' ? <><Sun size={16} /> Morning Mode</> : <><Moon size={16} /> Night Mode</>}
                      </button>
                      <div style={{ height: '1px', background: '#334155', margin: '4px 0' }}></div>
                      <button onClick={handleLogout} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '14px', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}>
                          <LogOut size={16} /> Sign Out
                      </button>
                  </div>
              )}
          </div>

          {/* --- TOP RIGHT: ALLY & HELP --- */}
          <div style={{ display: 'flex', gap: '10px' }}> 
              <button onClick={() => setShowGuide(true)} style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: mode === 'night' ? '#64748b' : '#334155' }}>
                <HelpCircle size={20} color={mode === 'night' ? 'white' : 'black'} />
              </button>
              
              <div style={{ position: 'relative' }}>
                <button onClick={() => setPartnerModal(true)} style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: mode === 'night' ? '#64748b' : '#334155' }}> 
                  <Users size={20} color={mode === 'night' ? 'white' : 'black'} /> 
                </button> 
                {currentProfile?.status === 'pending' && currentProfile?.initiator_id !== session.user.id && ( <div style={{ position: 'absolute', top: 0, right: 0, width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid #1f1f22' }}></div> )} 
              </div>
          </div>
       </div>

      <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* ... (Rest of the app UI - No changes needed) ... */}
        <div style={{ marginTop: '100px', textAlign: mode === 'night' ? 'center' : 'left' }}>
          {mode === 'night' ? ( <> 
            <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.9, marginBottom: '15px' }}>
                <Moon size={56} color="#c084fc" style={{ filter: 'drop-shadow(0 0 10px rgba(192, 132, 252, 0.5))' }} />
            </div> 
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', background: 'linear-gradient(to right, #e9d5ff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Relay Vision.</h1> 
            <p style={{ margin: '8px 0 0 0', color: '#a855f7', opacity: 0.8, letterSpacing: '1px' }}>PASS THE BATON.</p> 
          </> ) : ( <div style={{ marginBottom: '10px' }}> 
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}> 
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Sun size={32} color="#f59e0b" /><h1 style={{ fontSize: '42px', fontWeight: '800', lineHeight: '1', margin: 0, color: '#1e293b' }}>Relay Vision.</h1></div> 
                <div onClick={() => setHistoryModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff7ed', padding: '6px 12px', borderRadius: '20px', border: '1px solid #ffedd5', cursor: 'pointer' }}>
                    <Flame size={20} fill={streak > 0 ? "#f97316" : "none"} color="#f97316" />
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#9a3412' }}>{streak} Day{streak !== 1 && 's'}</span>
                </div> 
            </div>
            
            {/* --- DASHBOARD SCOREBOARD --- */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginTop: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Progress</span>
                    <span style={{ fontWeight: '900', color: '#1e293b', fontSize: '14px' }}>{Math.round(progressPercent)}%</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '10px', transition: 'width 0.5s ease-out' }}></div>
                </div>
            </div>

          </div> )}
          
          {mode === 'morning' && ( <div style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: '100%', marginTop: '10px', marginBottom: '10px' }}> <button onClick={() => { setActiveTab('mission'); setViewingGoal(null); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'mission' ? 'white' : 'transparent', boxShadow: activeTab === 'mission' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: activeTab === 'mission' ? '#0f172a' : '#64748b', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><ListTodo size={16} /> Mission</button> <button onClick={() => setActiveTab('vision')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'vision' ? 'white' : 'transparent', boxShadow: activeTab === 'vision' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: activeTab === 'vision' ? '#0f172a' : '#64748b', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Eye size={16} /> Vision</button> <button onClick={() => { setActiveTab('ally'); setViewingGoal(null); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'ally' ? 'white' : 'transparent', boxShadow: activeTab === 'ally' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: activeTab === 'ally' ? '#0f172a' : '#64748b', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Users size={16} /> Ally</button> </div> )}
        </div>

        {/* --- MODULAR NIGHT MODE LAYOUT (THE HUB) --- */}
        {mode === 'night' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', paddingBottom: '40px' }}>
             {debugLog && <div style={{ background: debugLog.includes('Error') ? '#7f1d1d' : '#064e3b', color: debugLog.includes('Error') ? '#fecaca' : '#a7f3d0', padding: '10px', borderRadius: '8px', fontSize: '12px', textAlign: 'center', border: `1px solid ${debugLog.includes('Error') ? '#ef4444' : '#10b981'}` }}>{debugLog}</div>}
             
             {/* THE HUB GRID */}
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                 
                 {/* GENERAL TILE */}
                 <div onClick={() => { setSelectedGoalId(null); setActiveZone({id: null, title: 'General', color: '#666'}); setModalTab('mission'); }} style={{ 
                     background: '#1a1a1a', 
                     border: getZoneStats(null).lit ? '2px solid #fff' : '1px solid #333',
                     borderRadius: '24px', 
                     padding: '20px', 
                     minHeight: '140px',
                     display: 'flex',
                     flexDirection: 'column',
                     justifyContent: 'space-between',
                     cursor: 'pointer',
                     boxShadow: getZoneStats(null).lit ? '0 0 15px rgba(255,255,255,0.1)' : 'none'
                 }}>
                     <Target size={24} color={getZoneStats(null).lit ? 'white' : '#666'} />
                     <div>
                         <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: 'white' }}>GENERAL</h3>
                         <span style={{ fontSize: '11px', color: getZoneStats(null).lit ? '#a855f7' : '#666', fontWeight: 'bold' }}>
                             {getZoneStats(null).count} MISSIONS
                         </span>
                     </div>
                 </div>

                 {/* USER ZONES */}
                 {myGoals.map(g => (
                     <div key={g.id} onClick={() => { setSelectedGoalId(g.id); setActiveZone(g); setModalTab('mission'); }} style={{ 
                         background: getZoneStats(g.id).lit ? g.color : '#1a1a1a', 
                         border: getZoneStats(g.id).lit ? `2px solid ${g.color}` : `1px solid ${g.color}44`,
                         borderRadius: '24px', 
                         padding: '20px', 
                         minHeight: '140px',
                         display: 'flex',
                         flexDirection: 'column',
                         justifyContent: 'space-between',
                         cursor: 'pointer',
                         boxShadow: getZoneStats(g.id).lit ? `0 0 20px ${g.color}66` : 'none',
                         transition: 'all 0.2s'
                     }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                             <Target size={24} color={getZoneStats(g.id).lit ? 'white' : g.color} />
                             {g.is_private && <Lock size={14} color={getZoneStats(g.id).lit ? 'white' : '#666'} />}
                         </div>
                         <div>
                             <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: getZoneStats(g.id).lit ? 'white' : g.color }}>{g.title.toUpperCase()}</h3>
                             <span style={{ fontSize: '11px', color: getZoneStats(g.id).lit ? 'rgba(255,255,255,0.8)' : '#666', fontWeight: 'bold' }}>
                                 {getZoneStats(g.id).count} MISSIONS
                             </span>
                         </div>
                     </div>
                 ))}

                 {/* CREATE ZONE TILE */}
                 <div onClick={() => setShowGoalCreator(true)} style={{ 
                     background: 'transparent', 
                     border: '2px dashed #444',
                     borderRadius: '24px', 
                     padding: '20px', 
                     minHeight: '140px',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center',
                     cursor: 'pointer',
                     color: '#666'
                 }}>
                     <Plus size={32} />
                     <span style={{ marginTop: '10px', fontSize: '12px', fontWeight: 'bold' }}>CREATE ZONE</span>
                 </div>
             </div>

             {/* GOAL CREATOR MODAL (Existing logic, just triggered by tile) */}
             {showGoalCreator && ( 
                 <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <div style={{ background: '#111', padding: '25px', borderRadius: '24px', border: '1px solid #333', width: '85%', maxWidth: '320px' }}> 
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                             <h4 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>NEW ZONE</h4> 
                             <button onClick={() => setShowGoalCreator(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={18} /></button>
                         </div>
                         <input type="text" value={newGoalInput} onChange={(e) => setNewGoalInput(e.target.value)} placeholder="Zone Name" style={{ width: '100%', background: '#222', border: '1px solid #444', color: 'white', padding: '12px', borderRadius: '12px', outline: 'none', marginBottom: '15px' }} /> 
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                             <div style={{ display: 'flex', gap: '8px' }}> {goalColors.slice(0, 5).map(c => <button key={c} onClick={() => setNewGoalColor(c)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: newGoalColor === c ? '2px solid white' : 'none', cursor: 'pointer' }} />)} </div>
                             <button onClick={() => setIsPrivateGoal(!isPrivateGoal)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid #444', color: isPrivateGoal ? '#ef4444' : '#64748b', padding: '6px 10px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px' }}>
                                 {isPrivateGoal ? <Lock size={12} /> : <Unlock size={12} />}
                             </button>
                         </div>
                         <button onClick={createGoal} style={{ width: '100%', background: 'white', color: 'black', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Create Zone</button> 
                     </div> 
                 </div>
             )} 
             
             {/* THE SPOKE: GLASS SHEET MODAL (STICKY BOTTOM INPUT) */}
             {activeZone && (
                 <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 11000 }}>
                     <div style={{ 
                         position: 'absolute', 
                         bottom: 0, 
                         left: 0, 
                         width: '100%', 
                         height: '90%', 
                         background: 'rgba(18, 18, 18, 0.95)', 
                         backdropFilter: 'blur(20px)',
                         borderRadius: '30px 30px 0 0',
                         borderTop: `1px solid ${activeZone.color}44`,
                         display: 'flex', 
                         flexDirection: 'column', 
                         animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' 
                     }}>
                         
                         {/* SHEET HEADER */}
                         <div style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                             <h2 style={{ margin: 0, fontSize: '28px', color: activeZone.color, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900' }}>{activeZone.title}</h2>
                             <button onClick={() => setActiveZone(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18}/></button>
                         </div>

                         {/* TOGGLE SWITCH */}
                         <div style={{ padding: '0 25px 15px 25px', flexShrink: 0 }}>
                             <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '4px' }}>
                                 <button onClick={() => setModalTab('mission')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: modalTab === 'mission' ? activeZone.color : 'transparent', color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>MISSION</button>
                                 <button onClick={() => setModalTab('vision')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: modalTab === 'vision' ? activeZone.color : 'transparent', color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>VISION</button>
                             </div>
                         </div>

                         {/* SCROLLABLE CONTENT AREA */}
                         <div style={{ flex: 1, overflowY: 'auto', padding: '0 25px 20px 25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                             
                             {modalTab === 'mission' && (
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                     {activeMissions.filter(m => m.goal_id === activeZone.id).map(m => (
                                         <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeZone.color }}></div> 
                                             <span style={{ fontSize: '16px', color: '#ddd', flex: 1 }}>{m.task}</span> 
                                             <button onClick={() => deleteMission(m.id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={18} /></button> 
                                         </div>
                                     ))}
                                     {activeMissions.filter(m => m.goal_id === activeZone.id).length === 0 && (
                                         <div style={{ textAlign: 'center', color: '#666', padding: '30px', border: '1px dashed #333', borderRadius: '16px', fontSize: '14px' }}>List is empty for tomorrow.</div>
                                     )}
                                     
                                     {/* Spacer to ensure last item is visible above input */}
                                     <div style={{ height: '80px' }}></div>
                                 </div>
                             )}

                             {modalTab === 'vision' && (
                                 <>
                                     <textarea value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} placeholder={`What is the ultimate goal for ${activeZone.title}?`} style={{ width: '100%', height: '120px', background: '#000', border: '1px solid #333', borderRadius: '16px', color: 'white', padding: '16px', fontSize: '16px', resize: 'none', outline: 'none' }} disabled={uploading} /> 
                                     
                                     {(previewUrl) && (
                                         <div style={{ width: '100%', height: '200px', background: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid #333' }}>
                                             <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                             <button onClick={clearMedia} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>X</button>
                                         </div>
                                     )}

                                     <button onClick={handleCapture} disabled={uploading} style={{ width: '100%', padding: '16px', background: activeZone.color, color: 'white', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                                         {uploading ? 'UPLOADING...' : 'CAPTURE VISION'}
                                     </button>
                                 </>
                             )}
                         </div>

                         {/* STICKY BOTTOM INPUT (CHAT STYLE) */}
                         <div style={{ padding: '15px 25px 30px 25px', background: 'rgba(18,18,18,0.95)', borderTop: '1px solid #333', backdropFilter: 'blur(10px)' }}>
                             
                             {/* QUICK CHIPS (Only show if inputs are empty) */}
                             {!missionInput && modalTab === 'mission' && getUniqueRecentsForZone(activeZone.id).length > 0 && (
                                 <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '10px', scrollbarWidth: 'none' }}>
                                     {getUniqueRecentsForZone(activeZone.id).map(m => (
                                         <button key={'quick-'+m.id} onClick={() => addMission(m.task, activeZone.id)} style={{ padding: '6px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ccc', fontSize: '11px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                             + {m.task}
                                         </button>
                                     ))}
                                 </div>
                             )}

                             {modalTab === 'mission' ? (
                                 <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                     <button onClick={() => fileInputRef.current.click()} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}><Camera size={20} /></button>
                                     <input type="text" value={missionInput} onChange={(e) => setMissionInput(e.target.value)} placeholder="Type task..." onKeyDown={(e) => { if(e.key === 'Enter') { addMission(); }}} autoFocus style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', background: '#333', border: 'none', color: 'white', outline: 'none', fontSize: '16px' }} /> 
                                     <button onClick={() => addMission()} style={{ background: activeZone.color, border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} /></button> 
                                 </div>
                             ) : (
                                 <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                                     <button onClick={() => fileInputRef.current.click()} style={{ flex: 1, padding: '12px', background: '#333', borderRadius: '12px', color: '#ddd', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}><ImageIcon size={16}/> Photo</button>
                                     <button onClick={() => videoInputRef.current.click()} style={{ flex: 1, padding: '12px', background: '#333', borderRadius: '12px', color: '#ddd', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}><Video size={16}/> Video</button>
                                     <button onClick={() => setIsPrivateVision(!isPrivateVision)} style={{ flex: 1, padding: '12px', background: '#333', borderRadius: '12px', color: isPrivateVision ? '#ef4444' : '#666', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>{isPrivateVision ? <Lock size={16}/> : <Unlock size={16}/>}</button>
                                 </div>
                             )}
                             
                             {/* Hidden inputs reused */}
                             <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'image')} style={{ display: 'none' }} />
                             <input type="file" accept="video/*" capture="environment" ref={videoInputRef} onChange={(e) => handleFileSelect(e, 'video')} style={{ display: 'none' }} />
                         </div>

                     </div>
                 </div>
             )}
             
             {/* THE MANIFEST REVIEW MODAL (CHECKOUT) */}
             {showManifestReview && (
                 <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <div style={{ background: '#1e293b', borderRadius: '24px', width: '90%', maxWidth: '360px', border: '1px solid #475569', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                         <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <h2 style={{ margin: 0, fontSize: '18px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><ClipboardList size={20} color="#a855f7" /> FINAL MANIFEST</h2>
                             <button onClick={() => setShowManifestReview(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
                         </div>
                         <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                             <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>Review your orders. Once executed, the day begins.</p>
                             
                             {/* GROUPED LIST */}
                             {[null, ...myGoals.map(g => g.id)].map(gid => {
                                 const tasks = activeMissions.filter(m => m.goal_id === gid);
                                 if (tasks.length === 0) return null;
                                 return (
                                     <div key={gid || 'gen'} style={{ marginBottom: '20px' }}>
                                         <h4 style={{ margin: '0 0 10px 0', color: getGoalColor(gid), fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{getGoalTitle(gid)}</h4>
                                         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                             {tasks.map(m => (
                                                 <div key={m.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#e2e8f0', fontSize: '14px' }}>
                                                     <div style={{ width: '4px', height: '4px', background: '#cbd5e1', borderRadius: '50%' }}></div>
                                                     {m.task}
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )
                             })}
                             
                             {activeMissions.length === 0 && <div style={{ textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>WARNING: PROTOCOL EMPTY</div>}
                         </div>
                         <div style={{ padding: '20px', borderTop: '1px solid #334155' }}>
                             <button onClick={handleLockIn} style={{ width: '100%', padding: '16px', background: 'linear-gradient(to right, #c084fc, #a855f7)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                 CONFIRM & EXECUTE
                             </button>
                         </div>
                     </div>
                 </div>
             )}
             
             {/* LAUNCH FOOTER */}
             <div style={{ marginTop: '20px' }}> <button onClick={() => setShowManifestReview(true)} style={{ width: '100%', padding: '24px', background: 'linear-gradient(to right, #c084fc, #a855f7)', color: 'white', border: 'none', borderRadius: '24px', fontSize: '20px', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer', boxShadow: '0 10px 30px -10px rgba(168, 85, 247, 0.6)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}> <ShieldCheck size={28} /> Initiate Protocol </button> <p style={{ textAlign: 'center', color: '#555', fontSize: '12px', marginTop: '15px' }}>Locking in prevents retreat.</p> </div>
         </div>
       )}

       {/* --- SYSTEM STATUS INDICATOR (TEST) --- */}
        <div style={{ marginTop: '30px', paddingBottom: '20px', textAlign: 'center', opacity: 0.4, fontSize: '10px', letterSpacing: '1px', color: mode === 'night' ? '#555' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Check size={12} /> SYSTEM OPERATIONAL • v1.0
        </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } } @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
