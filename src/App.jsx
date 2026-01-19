import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Moon, Sun, Archive, Target, Flame, LogOut, Lock, Mic, Video, Camera, X, Square, ListTodo, Quote as QuoteIcon, CheckSquare, Plus, Eye, RotateCcw, Trophy, ArrowLeft, Eraser, RefreshCcw, Trash2, ShieldCheck, AlertCircle, Edit3, Fingerprint, GripVertical, History, Users, Link as LinkIcon, Check, XCircle, MessageCircle, Heart, Send, Unlock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Fireworks } from 'fireworks-js';
import { Reorder, useDragControls } from "framer-motion";

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
  
  // MODALS & NEW STATES
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, title: '' });
  const [protocolModal, setProtocolModal] = useState(false);
  const [cheerModal, setCheerModal] = useState({ isOpen: false, missionId: null });
  const [cheerInput, setCheerInput] = useState('');
  const [isPrivateGoal, setIsPrivateGoal] = useState(false); // For goal creation

  // Partner Mode State
  const [partnerModal, setPartnerModal] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [currentProfile, setCurrentProfile] = useState(null);
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

  // Refs
  const fileInputRef = useRef(null);
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
    return () => { document.removeEventListener('touchmove', preventZoom); document.removeEventListener('touchend', preventDoubleTap); };
  }, []);

  useEffect(() => { localStorage.setItem('visionMode', mode); }, [mode]);
  useEffect(() => { fetchAllData(); }, [session]);

  const showNotification = (msg, type = 'success') => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000); };

  async function fetchAllData() {
      fetchProfile();
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
          setMyMissions(mData.filter(i => i.user_id === session.user.id && i.is_active));
          setPartnerMissions(mData.filter(i => i.user_id !== session.user.id && i.is_active));
          const recent = mData.filter(i => i.user_id === session.user.id).slice(-10); 
          const uniqueRecents = [...new Map(recent.map(item => [item['task'], item])).values()];
          setRecentMissions(uniqueRecents);
          setCrushedHistory(mData.filter(i => i.crushed));
      }
  }
  
  async function fetchProfile() { const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single(); if(data) setCurrentProfile(data); }

  const sendInvite = async () => { if(!partnerEmail) return; const { error } = await supabase.rpc('send_ally_invite', { target_email: partnerEmail }); if (error) { showNotification(error.message, "error"); } else { showNotification("Invite Sent.", "success"); fetchProfile(); } };
  const acceptInvite = async () => { const { error } = await supabase.rpc('confirm_alliance'); if (!error) { showNotification("Alliance Established.", "success"); confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#60a5fa', '#ffffff'] }); fetchProfile(); fetchAllData(); } };
  const declineInvite = async () => { const { error } = await supabase.rpc('sever_connection'); if (!error) { showNotification("Connection Severed.", "neutral"); fetchProfile(); } };

  const clearDailyMissions = async () => { if(!window.confirm("Clear the board for tomorrow? (Crushed wins will be saved in folders)")) return; await supabase.from('missions').delete().eq('user_id', session.user.id).eq('crushed', false); await supabase.from('missions').update({ is_active: false }).eq('user_id', session.user.id).eq('crushed', true); fetchAllData(); };
  
  // CREATE GOAL (With Privacy)
  const createGoal = async () => { 
      if (!newGoalInput.trim()) return; 
      const { data, error } = await supabase.from('goals').insert([{ 
          title: newGoalInput, color: newGoalColor, user_id: session.user.id, is_private: isPrivateGoal 
      }]).select(); 
      if (!error && data) { 
          setMyGoals([...myGoals, data[0]]); setNewGoalInput(''); setIsPrivateGoal(false); setShowGoalCreator(false); setSelectedGoalId(data[0].id); 
      } 
  };

  // TOGGLE GOAL PRIVACY
  const toggleGoalPrivacy = async (goal) => {
      const newStatus = !goal.is_private;
      const { error } = await supabase.from('goals').update({ is_private: newStatus }).eq('id', goal.id);
      if(!error) {
          setMyGoals(myGoals.map(g => g.id === goal.id ? { ...g, is_private: newStatus } : g));
          showNotification(newStatus ? "Goal Locked (Private)" : "Goal Unlocked (Shared)", "neutral");
      }
  };

  const initiateDeleteGoal = (id, title, e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'goal', id, title: `Delete "${title}"?` }); };
  const initiateDeleteThought = (id) => { setDeleteModal({ isOpen: true, type: 'thought', id, title: 'Delete this vision?' }); };
  const executeDelete = async () => { const { type, id } = deleteModal; if (type === 'goal') { await supabase.from('goals').delete().eq('id', id); setMyGoals(myGoals.filter(g => g.id !== id)); if(selectedGoalId === id) setSelectedGoalId(null); } else if (type === 'thought') { await supabase.from('thoughts').delete().eq('id', id); const newThoughts = myThoughts.filter(t => t.id !== id); setMyThoughts(newThoughts); calculateStreak(newThoughts); } setDeleteModal({ isOpen: false, type: null, id: null, title: '' }); };
  const addMission = async (taskText = missionInput, goalId = selectedGoalId) => { if (!taskText.trim()) return; const { data, error } = await supabase.from('missions').insert([{ task: taskText, user_id: session.user.id, completed: false, crushed: false, is_active: true, goal_id: goalId }]).select(); if (!error && data) { setMyMissions([...myMissions, data[0]]); setMissionInput(''); } };
  const triggerGrandFinale = () => { if (!fireworksRef.current) return; const fireworks = new Fireworks(fireworksRef.current, { autoresize: true, opacity: 0.5, acceleration: 1.05, friction: 0.97, gravity: 1.5, particles: 50, traceLength: 3, traceSpeed: 10, explosion: 5, intensity: 30, flickering: 50, lineStyle: 'round', hue: { min: 0, max: 360 }, delay: { min: 30, max: 60 }, rocketsPoint: { min: 50, max: 50 }, lineWidth: { explosion: { min: 1, max: 3 }, trace: { min: 1, max: 2 } }, brightness: { min: 50, max: 80 }, decay: { min: 0.015, max: 0.03 }, mouse: { click: false, move: false, max: 1 } }); fireworks.start(); setTimeout(() => { fireworks.waitStop(true); }, 5000); };
  const handleLockIn = () => { if(myMissions.filter(m => !m.completed && !m.crushed).length === 0) { if(!window.confirm("Mission Log is empty. Deploy anyway?")) return; } setProtocolModal(true); };
  const executeProtocol = () => { setProtocolModal(false); confetti({ particleCount: 150, spread: 100, origin: { y: 0.8 }, colors: ['#c084fc', '#ffffff'] }); setTimeout(() => { setMode('morning'); window.scrollTo(0,0); }, 1000); };
  const toggleCompleted = async (mission) => { const newCompleted = !mission.completed; const updates = { completed: newCompleted, crushed: newCompleted ? mission.crushed : false }; const nextMissions = myMissions.map(m => m.id === mission.id ? { ...m, ...updates } : m); const allDone = nextMissions.length > 0 && nextMissions.every(m => m.completed || m.crushed); if (newCompleted && !mission.completed) { const goal = myGoals.find(g => g.id === mission.goal_id); const color = goal ? goal.color : '#cbd5e1'; if (allDone) { triggerGrandFinale(); } else { confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 }, colors: [color], scalar: 0.8 }); } } const { error } = await supabase.from('missions').update(updates).eq('id', mission.id); if (!error) { setMyMissions(nextMissions); } };
  const toggleCrushed = async (mission) => { const newCrushed = !mission.crushed; const updates = { crushed: newCrushed, completed: newCrushed ? true : mission.completed }; const nextMissions = myMissions.map(m => m.id === mission.id ? { ...m, ...updates } : m); const allDone = nextMissions.length > 0 && nextMissions.every(m => m.completed || m.crushed); if (newCrushed) { if (allDone) { triggerGrandFinale(); } else { confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 }, colors: ['#f59e0b', '#fbbf24', '#ffffff'], scalar: 1.2 }); } } const { error } = await supabase.from('missions').update(updates).eq('id', mission.id); if (!error) { setMyMissions(nextMissions); if(newCrushed) setCrushedHistory([ { ...mission, ...updates }, ...crushedHistory ]); else setCrushedHistory(crushedHistory.filter(m => m.id !== mission.id)); } };
  
  const handleNoteChange = (id, newText) => { setMyMissions(myMissions.map(m => m.id === id ? { ...m, victory_note: newText } : m)); };
  const handleNoteSave = async (id, newText) => { await supabase.from('missions').update({ victory_note: newText }).eq('id', id); setCrushedHistory(crushedHistory.map(m => m.id === id ? { ...m, victory_note: newText } : m)); };
  const deleteMission = async (id) => { const { error } = await supabase.from('missions').delete().eq('id', id); if (!error) setMyMissions(myMissions.filter(m => m.id !== id)); };
  const openCheerModal = (id) => { setCheerInput(''); setCheerModal({ isOpen: true, missionId: id }); };
  const submitCheer = async () => { if(!cheerInput.trim() || !cheerModal.missionId) return; const { error } = await supabase.from('missions').update({ cheer_note: cheerInput }).eq('id', cheerModal.missionId); if(!error) { setPartnerMissions(partnerMissions.map(m => m.id === cheerModal.missionId ? { ...m, cheer_note: cheerInput } : m)); showNotification("Cheer sent!", "success"); setCheerModal({ isOpen: false, missionId: null }); } };
  const handleFileSelect = (event, type) => { const file = event.target.files[0]; if (file) { if (file.size > 50 * 1024 * 1024) { setDebugLog("Error: File too large (Max 50MB)."); return; } setMediaFile(file); setAudioBlob(null); setMediaType(type); setPreviewUrl(URL.createObjectURL(file)); setIsQuoteMode(false); setDebugLog(''); } };
  const startAudioRecording = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); let options = {}; if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' }; else if (MediaRecorder.isTypeSupported('audio/webm')) options = { mimeType: 'audio/webm' }; const recorder = new MediaRecorder(stream, options); mediaRecorderRef.current = recorder; audioChunksRef.current = []; recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); }; recorder.onstop = () => { const type = options.mimeType || 'audio/webm'; const blob = new Blob(audioChunksRef.current, { type }); setAudioBlob(blob); setMediaFile(null); setMediaType('audio'); setPreviewUrl(URL.createObjectURL(blob)); setIsQuoteMode(false); stream.getTracks().forEach(track => track.stop()); }; recorder.start(); setIsRecordingAudio(true); setDebugLog('Recording Audio...'); } catch (err) { alert("Microphone access denied."); } };
  const stopAudioRecording = () => { if (mediaRecorderRef.current && isRecordingAudio) { mediaRecorderRef.current.stop(); setIsRecordingAudio(false); setDebugLog(''); } };
  const clearMedia = () => { setMediaFile(null); setAudioBlob(null); setMediaType('text'); setPreviewUrl(null); setIsQuoteMode(false); if (fileInputRef.current) fileInputRef.current.value = ''; if (videoInputRef.current) videoInputRef.current.value = ''; };
  const handleCapture = async () => { if (!currentInput.trim() && !mediaFile && !audioBlob) return; setUploading(true); setDebugLog('Securing Relay...'); let imageUrl = null; let videoUrl = null; let audioUrl = null; const timestamp = Date.now(); try { if (mediaFile) { const ext = mediaFile.name.split('.').pop() || 'mov'; const fileName = `${mediaType}-${timestamp}.${ext}`; const { data, error } = await supabase.storage.from('images').upload(fileName, mediaFile); if (error) throw error; if (data) { const publicUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl; if (mediaType === 'image') imageUrl = publicUrl; if (mediaType === 'video') videoUrl = publicUrl; } } if (audioBlob) { const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm'; const fileName = `audio-${timestamp}.${ext}`; const { data, error } = await supabase.storage.from('images').upload(fileName, audioBlob); if (error) throw error; if (data) audioUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl; } const { data, error } = await supabase.from('thoughts').insert([{ text: currentInput, image_url: imageUrl, video_url: videoUrl, audio_url: audioUrl, is_quote: isQuoteMode, ignited: false, archived: false, user_id: session.user.id, goal_id: selectedGoalId }]).select(); if (error) throw error; if (data) { setMyThoughts([data[0], ...myThoughts]); calculateStreak([data[0], ...myThoughts]); setCurrentInput(''); clearMedia(); setDebugLog('Relay Secured.'); setTimeout(() => setDebugLog(''), 2000); } } catch (err) { console.error(err); setDebugLog("Error: " + err.message); } finally { setUploading(false); } };
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
  const activeMissions = myMissions.filter(m => !m.completed && !m.crushed);
  const completedMissions = myMissions.filter(m => m.completed || m.crushed);
  const handleReorder = (newOrder) => { setMyMissions([...newOrder, ...completedMissions]); };

  return (
    <div style={mode === 'night' ? nightStyle : morningStyle}>
       <style>{globalStyles}</style>
       <div ref={fireworksRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}></div>
       {notification && ( <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 20000, background: notification.type === 'error' ? '#ef4444' : (notification.type === 'success' ? '#10b981' : '#3b82f6'), padding: '12px 24px', borderRadius: '30px', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', animation: 'fadeIn 0.3s' }}> {notification.msg} </div> )}
        {deleteModal.isOpen && ( <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}> <div style={{ background: '#1e293b', padding: '24px', borderRadius: '24px', width: '85%', maxWidth: '300px', textAlign: 'center', border: '1px solid #334155', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}> <h3 style={{ margin: '0 0 16px 0', color: 'white', fontSize: '18px' }}>{deleteModal.title}</h3> <div style={{ display: 'flex', gap: '10px' }}> <button onClick={() => setDeleteModal({ isOpen: false, type: null, id: null, title: '' })} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #475569', background: 'transparent', color: '#cbd5e1', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button> <button onClick={executeDelete} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button> </div> </div> </div> )}
        {protocolModal && ( <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}> <div style={{ background: '#1e293b', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '340px', textAlign: 'center', border: '2px solid #a855f7', boxShadow: '0 0 40px rgba(168, 85, 247, 0.3)' }}> <Fingerprint size={48} color="#c084fc" style={{ marginBottom: '20px' }} /> <h3 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '22px', fontWeight: '900', textTransform: 'uppercase' }}>Contract With Tomorrow</h3> <p style={{ margin: '0 0 25px 0', color: '#cbd5e1', fontSize: '15px', lineHeight: '1.5' }}> "Does this plan demand your absolute best, or are you negotiating with weakness? Once you execute, there are no edits. Only results." </p> <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}> <button onClick={executeProtocol} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(to right, #c084fc, #a855f7)', color: 'white', fontWeight: '900', fontSize: '16px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}> EXECUTE PROTOCOL </button> <button onClick={() => setProtocolModal(false)} style={{ width: '100%', padding: '12px', borderRadius: '16px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}> ABORT </button> </div> </div> </div> )}
        {cheerModal.isOpen && ( <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}> <div style={{ background: '#1e293b', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '340px', textAlign: 'center', border: '2px solid #16a34a', boxShadow: '0 0 40px rgba(22, 163, 74, 0.3)' }}> <MessageCircle size={48} color="#22c55e" style={{ marginBottom: '20px' }} /> <h3 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Send a Boost</h3> <input type="text" placeholder="Keep pushing..." value={cheerInput} onChange={(e) => setCheerInput(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0f172a', border: '1px solid #334155', color: 'white', marginBottom: '20px', outline: 'none', textAlign: 'center' }} /> <div style={{ display: 'flex', gap: '10px' }}> <button onClick={() => setCheerModal({ isOpen: false, missionId: null })} style={{ flex: 1, padding: '12px', borderRadius: '16px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button> <button onClick={submitCheer} style={{ flex: 1, padding: '12px', borderRadius: '16px', border: 'none', background: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>Send <Send size={14}/></button> </div> </div> </div> )}
        {partnerModal && ( <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}> <div style={{ background: '#1e293b', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '340px', textAlign: 'center', border: '1px solid #334155', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}> <Users size={48} color={currentProfile?.status === 'active' ? '#10b981' : '#60a5fa'} style={{ marginBottom: '20px' }} /> <h3 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '22px', fontWeight: '900', textTransform: 'uppercase' }}>Ally Protocol</h3> {currentProfile?.status === 'active' && ( <> <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px', marginBottom: '20px' }}>STATUS: ACTIVE</p> <div style={{ background: '#0f172a', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}> <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>LINKED PARTNER:</p> <p style={{ color: 'white', fontWeight: 'bold', margin: '5px 0 0 0' }}>{currentProfile.partner_email}</p> </div> <button onClick={declineInvite} style={{ width: '100%', padding: '12px', borderRadius: '16px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}> SEVER CONNECTION </button> </> )} {currentProfile?.status === 'pending' && currentProfile?.initiator_id === session.user.id && ( <> <p style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '14px', marginBottom: '20px' }}>STATUS: PENDING ACCEPTANCE</p> <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '20px' }}>Invitation sent to <b>{currentProfile.partner_email}</b>. Waiting for them to confirm.</p> <button onClick={declineInvite} style={{ width: '100%', padding: '12px', borderRadius: '16px', border: 'none', background: '#334155', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}> CANCEL INVITE </button> </> )} {currentProfile?.status === 'pending' && currentProfile?.initiator_id !== session.user.id && ( <> <p style={{ color: '#f97316', fontWeight: 'bold', fontSize: '14px', marginBottom: '20px' }}>INCOMING REQUEST</p> <p style={{ color: 'white', fontSize: '16px', marginBottom: '20px' }}><b>{currentProfile.partner_email}</b> wants to link protocols.</p> <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}> <button onClick={acceptInvite} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}><Check size={20} /></button> <button onClick={declineInvite} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}><XCircle size={20} /></button> </div> </> )} {!currentProfile?.partner_id && ( <> <p style={{ margin: '0 0 20px 0', color: '#cbd5e1', fontSize: '14px' }}> "Iron sharpens iron. Link with one partner to see their visions." </p> <input type="email" placeholder="Partner Email" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#334155', border: '1px solid #475569', color: 'white', marginBottom: '20px', outline: 'none' }} /> <button onClick={sendInvite} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}> <LinkIcon size={16} /> SEND INVITE </button> </> )} <button onClick={() => setPartnerModal(false)} style={{ width: '100%', padding: '12px', borderRadius: '16px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}> CLOSE </button> </div> </div> )}

       <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
          {(mode === 'morning' || currentProfile?.status === 'pending') && (
              <div style={{ position: 'relative' }}> 
                  <button onClick={() => setPartnerModal(true)} style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: mode === 'night' ? '#64748b' : '#334155' }}> <Users size={16} color={mode === 'night' ? 'white' : 'black'} /> </button> 
                  {currentProfile?.status === 'pending' && currentProfile?.initiator_id !== session.user.id && ( <div style={{ position: 'absolute', top: 0, right: 0, width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid #1f1f22' }}></div> )} 
              </div>
          )}
          {mode === 'morning' ? ( <button onClick={() => setMode('night')} style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: '#64748b' }}> <Edit3 size={16} /> </button> ) : ( <button onClick={() => setMode('morning')} style={{ border: '1px solid #777', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', color: '#888', background: 'rgba(0,0,0,0.5)', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>Morning ☀️</button> )}
          <button onClick={handleLogout} style={{ border: '1px solid #ef4444', padding: '8px', borderRadius: '50%', color: '#ef4444', background: 'rgba(0,0,0,0.1)', cursor: 'pointer' }}><LogOut size={14} /></button>
       </div>

      <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ marginTop: '40px', textAlign: mode === 'night' ? 'center' : 'left' }}>
          {mode === 'night' ? ( <> <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.9, marginBottom: '15px' }}><Moon size={56} color="#c084fc" style={{ filter: 'drop-shadow(0 0 10px rgba(192, 132, 252, 0.5))' }} /></div> <h1 style={{ fontSize: '36px', fontWeight: 'bold', background: 'linear-gradient(to right, #e9d5ff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Relay Vision.</h1> <p style={{ margin: '8px 0 0 0', color: '#a855f7', opacity: 0.8, letterSpacing: '1px' }}>PASS THE BATON.</p> </> ) : ( <div style={{ marginBottom: '10px' }}> <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}> <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Sun size={32} color="#f59e0b" /><h1 style={{ fontSize: '42px', fontWeight: '800', lineHeight: '1', margin: 0, color: '#1e293b' }}>Relay Vision.</h1></div> <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff7ed', padding: '6px 12px', borderRadius: '20px', border: '1px solid #ffedd5' }}><Flame size={20} fill={streak > 0 ? "#f97316" : "none"} color="#f97316" /><span style={{ fontSize: '16px', fontWeight: 'bold', color: '#9a3412' }}>{streak} Day{streak !== 1 && 's'}</span></div> </div> </div> )}
          {mode === 'morning' && ( <div style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: '100%', marginTop: '10px', marginBottom: '10px' }}> <button onClick={() => { setActiveTab('mission'); setViewingGoal(null); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'mission' ? 'white' : 'transparent', boxShadow: activeTab === 'mission' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: activeTab === 'mission' ? '#0f172a' : '#64748b', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><ListTodo size={16} /> Mission</button> <button onClick={() => setActiveTab('vision')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'vision' ? 'white' : 'transparent', boxShadow: activeTab === 'vision' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: activeTab === 'vision' ? '#0f172a' : '#64748b', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Eye size={16} /> Vision</button> <button onClick={() => { setActiveTab('ally'); setViewingGoal(null); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'ally' ? 'white' : 'transparent', boxShadow: activeTab === 'ally' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: activeTab === 'ally' ? '#0f172a' : '#64748b', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Users size={16} /> Ally</button> </div> )}
        </div>

        {mode === 'night' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
             {debugLog && <div style={{ background: debugLog.includes('Error') ? '#7f1d1d' : '#064e3b', color: debugLog.includes('Error') ? '#fecaca' : '#a7f3d0', padding: '10px', borderRadius: '8px', fontSize: '12px', textAlign: 'center', border: `1px solid ${debugLog.includes('Error') ? '#ef4444' : '#10b981'}` }}>{debugLog}</div>}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}> 
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}> 
                     <button onClick={() => setSelectedGoalId(null)} style={{ padding: '8px 16px', borderRadius: '24px', border: selectedGoalId === null ? '1px solid white' : '1px solid #333', background: selectedGoalId === null ? '#333' : 'transparent', color: 'white', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>General</button> 
                     {myGoals.map(g => ( 
                         <div key={g.id} onClick={() => setSelectedGoalId(g.id)} style={{ padding: '8px 12px 8px 16px', borderRadius: '24px', border: selectedGoalId === g.id ? '1px solid white' : `1px solid ${g.color}44`, background: selectedGoalId === g.id ? g.color : `${g.color}22`, color: selectedGoalId === g.id ? 'white' : g.color, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}> 
                             {g.title} {g.is_private && <Lock size={10} />}
                             <div onClick={(e) => initiateDeleteGoal(g.id, g.title, e)} style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}> <X size={12} color="white" /> </div> 
                         </div> 
                     ))} 
                     <button onClick={() => setShowGoalCreator(!showGoalCreator)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#222', border: '1px solid #444', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={16} /></button> 
                 </div> 
                 {showGoalCreator && ( 
                     <div style={{ background: '#111', padding: '15px', borderRadius: '16px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}> 
                         <h4 style={{ margin: 0, fontSize: '12px', color: '#666' }}>NEW GOAL</h4> 
                         <input type="text" value={newGoalInput} onChange={(e) => setNewGoalInput(e.target.value)} placeholder="Goal Title" style={{ background: '#222', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '8px', outline: 'none' }} /> 
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ display: 'flex', gap: '8px' }}> {goalColors.map(c => <button key={c} onClick={() => setNewGoalColor(c)} style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: newGoalColor === c ? '2px solid white' : 'none', cursor: 'pointer' }} />)} </div>
                             <button onClick={() => setIsPrivateGoal(!isPrivateGoal)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid #444', color: isPrivateGoal ? '#ef4444' : '#64748b', padding: '4px 8px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px' }}>
                                 {isPrivateGoal ? <Lock size={12} /> : <Unlock size={12} />} {isPrivateGoal ? "Private" : "Public"}
                             </button>
                         </div>
                         <button onClick={createGoal} style={{ background: '#fff', color: 'black', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Create Goal</button> 
                     </div> 
                 )} 
             </div>
             
             {/* ... (Capture Vision Code remains same) ... */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}> <h3 style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Capture Vision</h3> {(previewUrl || isRecordingAudio) && ( <div style={{ position: 'relative', width: '100%', minHeight: '120px', background: '#111', borderRadius: '16px', overflow: 'hidden', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> {mediaType === 'image' && <img src={previewUrl} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />} {mediaType === 'video' && <video src={previewUrl} controls playsInline style={{ width: '100%', maxHeight: '300px' }} />} {isRecordingAudio && <div style={{ color: '#ef4444', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>Recording Audio... (Tap Stop)</div>} {mediaType === 'audio' && !isRecordingAudio && <audio src={previewUrl} controls style={{ width: '90%' }} />} {!isRecordingAudio && <button onClick={clearMedia} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', zIndex: 10 }}>X</button>} </div> )} <textarea value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} placeholder={isQuoteMode ? "Enter the quote..." : "Identify the long-term target..."} style={{ width: '100%', height: '80px', backgroundColor: 'rgba(26, 26, 26, 0.8)', border: isQuoteMode ? '2px solid #f59e0b' : '1px solid #333', borderLeft: `4px solid ${getGoalColor(selectedGoalId)}`, color: isQuoteMode ? '#f59e0b' : 'white', fontStyle: isQuoteMode ? 'italic' : 'normal', outline: 'none', borderRadius: '16px', padding: '16px', fontSize: '18px', resize: 'none', backdropFilter: 'blur(10px)' }} disabled={uploading} /> <div style={{ display: 'flex', gap: '8px' }}> <button onClick={() => fileInputRef.current.click()} disabled={uploading || isRecordingAudio} style={{ flex: 1, height: '50px', background: '#222', border: '1px solid #333', borderRadius: '12px', cursor: 'pointer', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={20} /></button> <button onClick={() => videoInputRef.current.click()} disabled={uploading || isRecordingAudio} style={{ flex: 1, height: '50px', background: '#222', border: '1px solid #333', borderRadius: '12px', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Video size={20} /></button> <button onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording} disabled={uploading} style={{ flex: 1, height: '50px', background: isRecordingAudio ? '#ef4444' : '#222', border: isRecordingAudio ? 'none' : '1px solid #333', borderRadius: '12px', cursor: 'pointer', color: isRecordingAudio ? 'white' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isRecordingAudio ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}</button> <button onClick={() => { const newMode = !isQuoteMode; setIsQuoteMode(newMode); setMediaFile(null); setAudioBlob(null); setMediaType('text'); setPreviewUrl(null); }} disabled={uploading} style={{ flex: 1, height: '50px', background: isQuoteMode ? '#f59e0b' : '#222', border: isQuoteMode ? 'none' : '1px solid #333', borderRadius: '12px', cursor: 'pointer', color: isQuoteMode ? 'black' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><QuoteIcon size={20} /></button> </div> <button onClick={handleCapture} disabled={uploading || isRecordingAudio} style={{ width: '100%', padding: '16px', backgroundColor: uploading ? '#333' : '#c084fc', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '16px', cursor: 'pointer', fontSize: '16px', boxShadow: '0 0 15px rgba(192, 132, 252, 0.3)' }}>{uploading ? 'Syncing...' : 'Capture'}</button> <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'image')} style={{ display: 'none' }} /> <input type="file" accept="video/*" capture="environment" ref={videoInputRef} onChange={(e) => handleFileSelect(e, 'video')} style={{ display: 'none' }} /> </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}> <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> <h3 style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Tomorrow's Mission</h3> <button onClick={clearDailyMissions} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid #444', color: '#888', borderRadius: '12px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}> <Eraser size={10} /> CLEAR LOG </button> </div> {recentMissions.length > 0 && ( <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}> {recentMissions.map(m => ( <button key={'recent-'+m.id} onClick={() => addMission(m.task, m.goal_id)} style={{ whiteSpace: 'nowrap', background: '#222', border: '1px solid #333', color: '#888', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}> <RotateCcw size={10} /> {m.task} </button> ))} </div> )} <div style={{ display: 'flex', gap: '10px' }}> <input type="text" value={missionInput} onChange={(e) => setMissionInput(e.target.value)} placeholder="Add mission objective" onKeyDown={(e) => e.key === 'Enter' && addMission()} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#111', border: '1px solid #333', borderLeft: `4px solid ${getGoalColor(selectedGoalId)}`, color: 'white', outline: 'none' }} /> <button onClick={() => addMission()} style={{ background: '#333', border: 'none', borderRadius: '12px', width: '40px', color: 'white', cursor: 'pointer' }}><Plus size={20} /></button> </div>
              <Reorder.Group axis="y" values={activeMissions} onReorder={handleReorder} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, listStyle: 'none' }}> {activeMissions.map(m => ( <Reorder.Item key={m.id} value={m} style={{ background: '#1a1a1a', padding: '8px 12px', borderRadius: '12px', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '12px' }}> <div style={{ color: '#444', cursor: 'grab', display: 'flex', alignItems: 'center' }}><GripVertical size={16} /></div> <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getGoalColor(m.goal_id) }}></div> <span style={{ fontSize: '14px', color: '#ddd', flex: 1 }}>{m.task}</span> <button onClick={() => deleteMission(m.id)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><X size={14} /></button> </Reorder.Item> ))} </Reorder.Group> {activeMissions.length === 0 && ( <div style={{ padding: '20px', textAlign: 'center', color: '#444', border: '1px dashed #333', borderRadius: '12px', fontSize: '14px' }}> No missions assigned yet. </div> )} </div>
             <div style={{ marginTop: '30px', paddingBottom: '30px' }}> <button onClick={handleLockIn} style={{ width: '100%', padding: '20px', background: 'linear-gradient(to right, #c084fc, #a855f7)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '18px', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(168, 85, 247, 0.4)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}> <ShieldCheck size={24} /> Initiate Protocol </button> <p style={{ textAlign: 'center', color: '#555', fontSize: '12px', marginTop: '10px' }}>Locking in prevents retreat.</p> </div>
          </div>
        )}

        {mode === 'morning' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
            {activeTab === 'mission' && ( <div style={{ animation: 'fadeIn 0.3s' }}> {randomQuote && ( <div style={{ padding: '20px', background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px', textAlign: 'center' }}> <QuoteIcon size={24} color="#cbd5e1" style={{ marginBottom: '10px' }} /> <p style={{ margin: 0, fontSize: '18px', fontStyle: 'italic', fontWeight: '600', color: '#334155', lineHeight: '1.5' }}>"{randomQuote.text}"</p> </div> )} <div style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}> <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#0f172a', fontWeight: '800', fontSize: '18px' }}> <ListTodo size={22} color="#3b82f6" /> Mission Log </div> {myMissions.length === 0 && ( <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px', background: '#f8fafc' }}> <AlertCircle size={48} color="#cbd5e1" style={{ marginBottom: '10px' }} /> <p style={{ margin: 0, fontWeight: 'bold', color: '#64748b' }}>Protocol Empty.</p> <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Log out or switch to Night Mode to assign objectives.</p> <button onClick={() => setMode('night')} style={{ marginTop: '15px', padding: '8px 16px', background: '#334155', color: 'white', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}> <Moon size={10} style={{ marginRight: '5px' }} /> Return to Night Mode </button> </div> )} <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}> {myMissions.map(m => ( <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRadius: '12px', background: m.crushed ? '#fff7ed' : (m.completed ? '#f0fdf4' : '#f8fafc'), borderLeft: `4px solid ${getGoalColor(m.goal_id)}`, border: m.crushed ? '1px solid #fdba74' : (m.completed ? '1px solid #bbf7d0' : '1px solid #e2e8f0'), borderLeftWidth: '4px', transition: 'all 0.2s' }}> <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}> <div onClick={() => toggleCompleted(m)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}> <div style={{ minWidth: '24px', height: '24px', borderRadius: '8px', border: m.completed ? 'none' : '2px solid #cbd5e1', background: m.completed ? getGoalColor(m.goal_id) : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> {m.completed && <CheckSquare size={16} color="white" />} </div> <div style={{ display: 'flex', flexDirection: 'column' }}> <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: getGoalColor(m.goal_id), letterSpacing: '0.5px' }}>{getGoalTitle(m.goal_id)}</span> <span style={{ textDecoration: m.completed ? 'line-through' : 'none', color: m.completed ? (m.crushed ? '#d97706' : '#86efac') : '#334155', fontWeight: '600', fontSize: '16px' }}>{m.task}</span> </div> </div> <button onClick={() => toggleCrushed(m)} style={{ background: m.crushed ? '#f59e0b' : 'transparent', border: m.crushed ? 'none' : '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}> <Flame size={16} color={m.crushed ? 'white' : '#cbd5e1'} fill={m.crushed ? 'white' : 'transparent'} /> </button> </div> {m.cheer_note && (<div style={{ marginTop: '5px', fontSize: '12px', color: '#60a5fa', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><MessageCircle size={12} /> Partner: "{m.cheer_note}"</div>)} {m.crushed && ( <div style={{ marginTop: '10px', animation: 'fadeIn 0.5s', display: 'flex', justifyContent: 'center' }}> <input type="text" placeholder="How did you crush it?" value={m.victory_note || ''} onChange={(e) => handleNoteChange(m.id, e.target.value)} onBlur={(e) => handleNoteSave(m.id, e.target.value)} onClick={(e) => e.stopPropagation()} style={{ width: '100%', padding: '12px', fontSize: '14px', border: '1px solid #fed7aa', borderRadius: '12px', background: '#fff', color: '#c2410c', outline: 'none', textAlign: 'center' }} /> </div> )} </div> ))} </div> </div> </div> )}

            {activeTab === 'vision' && !viewingGoal && ( <div style={{ animation: 'fadeIn 0.3s', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}> <div onClick={() => setViewingGoal('all')} style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}> <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '50%' }}><Archive size={24} color="#64748b" /></div> <span style={{ fontWeight: 'bold', color: '#334155' }}>All Visions</span> </div> {myGoals.map(g => ( <div key={g.id} onClick={() => setViewingGoal(g)} style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', borderTop: `4px solid ${g.color}`, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}> <div style={{ background: `${g.color}20`, padding: '15px', borderRadius: '50%' }}><Target size={24} color={g.color} /></div> <span style={{ fontWeight: 'bold', color: '#334155', textAlign: 'center' }}>{g.title}</span> {g.is_private && <Lock size={12} color="#94a3b8" style={{ marginTop: '5px' }} />} <span style={{ fontSize: '10px', color: '#94a3b8' }}>{myThoughts.filter(t => t.goal_id === g.id).length} Items</span> </div> ))} {myGoals.length === 0 && <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '14px' }}>No goals created yet. Use Night Mode to add goals.</div>} </div> )}
            {activeTab === 'vision' && viewingGoal && ( <div style={{ animation: 'fadeIn 0.3s' }}> <button onClick={() => { setViewingGoal(null); setShowArchives(false); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#64748b', fontSize: '14px', marginBottom: '15px', cursor: 'pointer' }}><ArrowLeft size={16} /> Back to Folders</button> 
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{viewingGoal === 'all' ? 'All Visions' : viewingGoal.title}</h2>
                    {viewingGoal !== 'all' && (
                        <button onClick={() => toggleGoalPrivacy(viewingGoal)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: viewingGoal.is_private ? '#ef4444' : '#94a3b8' }}>
                            {viewingGoal.is_private ? <Lock size={20} /> : <Unlock size={20} />}
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button onClick={() => setShowArchives(!showArchives)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: showArchives ? '#334155' : 'white', color: showArchives ? 'white' : '#64748b', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px' }}> {showArchives ? <Target size={14} /> : <History size={14} />} {showArchives ? 'Current' : 'Vault'} </button>
                </div>
                <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '10px' }}>{showArchives ? 'The Hall of Fame (Archived)' : 'The Fuel (Media)'}</h3>
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '20px', scrollbarWidth: 'none' }}> 
                    {getDisplayedThoughts().filter(t => !t.is_quote).map(t => ( <div key={t.id} style={{ position: 'relative', minWidth: '260px', background: t.ignited ? '#f8fafc' : 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', opacity: t.ignited ? 0.7 : 1 }}> 
                        <div onClick={() => initiateDeleteThought(t.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}> <X size={14} color="white" /> </div> 
                        {t.image_url && <img src={t.image_url} style={{ width: '100%', height: '180px', objectFit: 'cover', filter: t.ignited ? 'grayscale(100%)' : 'none' }} />} 
                        {t.video_url && <video src={t.video_url} controls style={{ width: '100%', height: '180px', background: 'black' }} />} 
                        <div style={{ padding: '15px' }}> <p style={{ margin: 0, fontWeight: '600', fontSize: '16px', color: t.ignited ? '#94a3b8' : '#1e293b', textDecoration: t.ignited ? 'line-through' : 'none' }}>"{t.text}"</p> <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}> <button onClick={() => toggleIgnite(t.id, t.ignited)} style={{ flex: 1, padding: '8px', background: t.ignited ? '#fff7ed' : '#f1f5f9', color: t.ignited ? '#f59e0b' : '#64748b', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}> {t.ignited ? <><RefreshCcw size={12} /> Undo</> : 'Ignite'} </button> <button onClick={() => toggleArchive(t.id, t.archived)} style={{ flex: 1, padding: '8px', background: t.archived ? '#f1f5f9' : '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}> {t.archived ? 'Restore' : 'Archive'} </button> </div> </div> </div> ))} 
                    {getDisplayedThoughts().filter(t => !t.is_quote).length === 0 && <p style={{ color: '#cbd5e1', fontSize: '14px' }}>{showArchives ? 'The vault is empty.' : 'No media fuel yet.'}</p>} 
                </div> 
                <div style={{ marginTop: '20px' }}> <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#d97706', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><Trophy size={12} /> The Receipts (Crushed)</h3> <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}> {crushedHistory.filter(m => viewingGoal === 'all' ? true : m.goal_id === viewingGoal.id && m.user_id === session.user.id).map(m => ( <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d' }}> <div style={{ marginTop: '2px' }}><Flame size={14} color="#d97706" fill="#d97706" /></div> <div> <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>{m.task}</p> {m.victory_note && <p style={{ margin: 0, fontSize: '13px', color: '#b45309', fontStyle: 'italic' }}>"{m.victory_note}"</p>} </div> </div> ))} {crushedHistory.filter(m => viewingGoal === 'all' ? true : m.goal_id === viewingGoal.id && m.user_id === session.user.id).length === 0 && <p style={{ color: '#cbd5e1', fontSize: '14px' }}>No wins recorded yet. Crush a goal tomorrow.</p>} </div> </div> </div> )}
            
            {/* ALLY TAB */}
            {activeTab === 'ally' && !viewingGoal && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#0f172a', fontWeight: '800', fontSize: '18px' }}>
                            <Users size={22} color="#60a5fa" /> Partner's Frontline
                        </div>
                        {partnerMissions.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>
                                <p style={{ margin: 0, fontSize: '14px' }}>Partner has no active missions.</p>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {partnerMissions.map(m => (
                                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRadius: '12px', background: m.completed ? '#f0fdf4' : '#f8fafc', borderLeft: `4px solid ${getGoalColor(m.goal_id)}`, border: '1px solid #e2e8f0', borderLeftWidth: '4px', opacity: m.completed ? 0.7 : 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: getGoalColor(m.goal_id), letterSpacing: '0.5px' }}>{getGoalTitle(m.goal_id)}</span>
                                            <span style={{ color: m.completed ? '#16a34a' : '#334155', fontWeight: '600', fontSize: '16px', textDecoration: m.completed ? 'line-through' : 'none' }}>{m.task}</span>
                                        </div>
                                        <button onClick={() => openCheerModal(m.id)} style={{ background: m.cheer_note ? '#f0fdf4' : 'white', border: '1px solid #cbd5e1', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <MessageCircle size={16} color={m.cheer_note ? '#16a34a' : '#94a3b8'} />
                                        </button>
                                    </div>
                                    {m.cheer_note && ( <div style={{ marginTop: '5px', fontSize: '12px', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}> <Heart size={12} fill="currentColor" /> You: "{m.cheer_note}" </div> )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div onClick={() => setViewingGoal('all')} style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '50%' }}><Archive size={24} color="#64748b" /></div>
                            <span style={{ fontWeight: 'bold', color: '#334155' }}>All Partner Visions</span>
                        </div>
                        {partnerGoals.map(g => (
                            <div key={g.id} onClick={() => setViewingGoal(g)} style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', borderTop: `4px solid ${g.color}`, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: `${g.color}20`, padding: '15px', borderRadius: '50%' }}><Target size={24} color={g.color} /></div>
                                <span style={{ fontWeight: 'bold', color: '#334155', textAlign: 'center' }}>{g.title}</span>
                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>{partnerThoughts.filter(t => t.goal_id === g.id).length} Items</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'ally' && viewingGoal && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    <button onClick={() => setViewingGoal(null)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#64748b', fontSize: '14px', marginBottom: '15px', cursor: 'pointer' }}><ArrowLeft size={16} /> Back to Partner Folders</button>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 20px 0' }}>{viewingGoal === 'all' ? 'All Partner Visions' : viewingGoal.title}</h2>
                    
                    <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '20px', scrollbarWidth: 'none' }}>
                        {getPartnerDisplayedThoughts().filter(t => !t.is_quote).map(t => (
                            <div key={t.id} style={{ position: 'relative', minWidth: '260px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                {t.image_url && <img src={t.image_url} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />}
                                {t.video_url && <video src={t.video_url} controls style={{ width: '100%', height: '180px', background: 'black' }} />}
                                <div style={{ padding: '15px' }}>
                                    <p style={{ margin: 0, fontWeight: '600', fontSize: '16px', color: '#1e293b' }}>"{t.text}"</p>
                                </div>
                            </div>
                        ))}
                        {getPartnerDisplayedThoughts().filter(t => !t.is_quote).length === 0 && <p style={{ color: '#cbd5e1', fontSize: '14px' }}>Partner has no media here.</p>}
                    </div>
                    
                    <div style={{ marginTop: '20px' }}>
                        <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#d97706', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><Trophy size={12} /> Partner's Wins</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {crushedHistory.filter(m => viewingGoal === 'all' ? true : m.goal_id === viewingGoal.id && m.user_id !== session.user.id).map(m => (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                                    <div style={{ marginTop: '2px' }}><Flame size={14} color="#d97706" fill="#d97706" /></div>
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>{m.task}</p>
                                        {m.victory_note && <p style={{ margin: 0, fontSize: '13px', color: '#b45309', fontStyle: 'italic' }}>"{m.victory_note}"</p>}
                                    </div>
                                </div>
                            ))}
                            {crushedHistory.filter(m => viewingGoal === 'all' ? true : m.goal_id === viewingGoal.id && m.user_id !== session.user.id).length === 0 && <p style={{ color: '#cbd5e1', fontSize: '14px' }}>No partner wins yet.</p>}
                        </div>
                    </div>
                </div>
            )}

          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
