import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Moon, Sun, Archive, Target, Flame, LogOut, Lock, Mic, Video, Camera, X, Square, ListTodo, Quote as QuoteIcon, CheckSquare, Plus, Eye, RotateCcw, Trophy, ArrowLeft, Eraser, RefreshCcw, Trash2, ShieldCheck, AlertCircle, Edit3, Fingerprint, GripVertical, History, Users, Link as LinkIcon, Check, XCircle, MessageCircle, Heart, Send, Unlock, Save, Calendar, Upload, Image as ImageIcon, Settings, ChevronRight, Menu, HelpCircle, BarChart3, Terminal, ClipboardList, LayoutGrid, FileText, Clock, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Fireworks } from 'fireworks-js';
import { Reorder, useDragControls } from "framer-motion";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Onboarding from './Onboarding';
import SystemGuide from './SystemGuide';
import NightModeBriefing from './NightModeBriefing';
import MorningModeBriefing from './MorningModeBriefing';
import ScheduleSettings from './ScheduleSettings';
import NightMode from './NightMode';

// --- IMPORT THE TRIBUTE IMAGE DIRECTLY ---
import tributeImage from './tribute.png'; 

const globalStyles = `
  * { box-sizing: border-box; touch-action: manipulation; }
  html, body { margin: 0; padding: 0; overflow-x: hidden; -webkit-text-size-adjust: 100%; overscroll-behavior-y: none; scrollbar-width: none; -ms-overflow-style: none; }
  ::-webkit-scrollbar { display: none; width: 0px; background: transparent; }
  input, textarea, button, select { font-size: 16px !important; }
  -webkit-tap-highlight-color: transparent;
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
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
  const [isFirstTimer, setIsFirstTimer] = useState(null); // null = loading, true/false = determined
  const [profileLoading, setProfileLoading] = useState(true);
  const [showSystemGuide, setShowSystemGuide] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Reset states when session changes
      if (!session) {
        setIsFirstTimer(null);
        setProfileLoading(true);
        setShowSystemGuide(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile to check is_first_timer
  useEffect(() => {
    async function checkFirstTimer() {
      if (!session) {
        setProfileLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_first_timer')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setIsFirstTimer(false); // Default to not first-timer on error
        } else {
          setIsFirstTimer(data?.is_first_timer ?? false);
        }
      } catch (err) {
        console.error('Profile check error:', err);
        setIsFirstTimer(false);
      } finally {
        setProfileLoading(false);
      }
    }

    checkFirstTimer();
  }, [session]);

  const [systemGuideMode, setSystemGuideMode] = useState('night');

  const handleOnboardingComplete = () => {
    setIsFirstTimer(false);
    setSystemGuideMode('night');
    setShowSystemGuide(true); // Auto-open System Guide after onboarding
  };

  const handleCloseSystemGuide = () => {
    setShowSystemGuide(false);
  };

  const handleOpenSystemGuide = (guideMode = 'night') => {
    setSystemGuideMode(guideMode);
    setShowSystemGuide(true);
  };

  if (!session) return <Auth />;

  // Show loading state while checking profile
  if (profileLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        background: 'radial-gradient(circle at center, #1f1f22 0%, #000000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#c084fc'
      }}>
        <style>{globalStyles}</style>
        <div style={{ textAlign: 'center' }}>
          <Fingerprint size={48} style={{ animation: 'pulse 1s infinite', marginBottom: '20px' }} />
          <p style={{ letterSpacing: '2px', fontSize: '14px' }}>INITIALIZING...</p>
        </div>
      </div>
    );
  }

  // Show onboarding for first-time users
  if (isFirstTimer) {
    return <Onboarding session={session} onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <VisionBoard session={session} onOpenSystemGuide={handleOpenSystemGuide} />
      {showSystemGuide && <SystemGuide onClose={handleCloseSystemGuide} mode={systemGuideMode} />}
    </>
  );
}

function VisionBoard({ session, onOpenSystemGuide }) {
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
  const [historyData, setHistoryData] = useState([]);
  
  // --- NEW STATES FOR TRIALS 3-5 ---
  const [activeZone, setActiveZone] = useState(null);
  const [modalTab, setModalTab] = useState('mission');
  const [showManifestReview, setShowManifestReview] = useState(false); // The Checkout Screen

  // --- MODE BRIEFING STATES ---
  const [showNightBriefing, setShowNightBriefing] = useState(false);
  const [showMorningBriefing, setShowMorningBriefing] = useState(false);

  // --- SCHEDULE STATES ---
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
  const [schedule, setSchedule] = useState({ morning_start_time: '06:00', night_start_time: '21:00' });
  const previousModeRef = useRef(mode);

  // --- CONTRACT SIGNED STATE (Gatekeeper) ---
  const [contractSigned, setContractSigned] = useState(false);

  // --- PROTOCOL ARMED STATE (Morning Gatekeeper) ---
  const [protocolArmed, setProtocolArmed] = useState(() => {
    return localStorage.getItem('protocolArmed') === 'true';
  });

  // --- DEV OVERRIDE REF (Prevents time-checker from fighting manual toggles) ---
  const devOverrideRef = useRef(false);

  // --- AUDIO REFS FOR FIREWORKS ---
  const launchAudioRef = useRef(null);
  const boomAudioRef = useRef(null);

  // --- SECRET PORTAL (Triple Click) ---
  const [secretFlash, setSecretFlash] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  const handleSecretPortal = () => {
    clickCountRef.current += 1;

    // Clear existing timer
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    // If 3 clicks within 500ms, toggle mode
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;

      // Flash effect
      setSecretFlash(true);
      setTimeout(() => setSecretFlash(false), 300);

      // SET DEV OVERRIDE - prevents time-checker from reverting this manual toggle
      devOverrideRef.current = true;

      // Bypass all checks and toggle mode instantly
      const newMode = mode === 'night' ? 'morning' : 'night';
      setContractSigned(true); // Bypass contract check
      setProtocolArmed(true); // Bypass protocol check
      setMode(newMode);
      localStorage.setItem('visionMode', newMode);
    } else {
      // Reset after 500ms if not enough clicks
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 500);
    }
  };

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

  // --- MISSION COLOR PALETTE ---
  const missionColors = [
    { name: 'Slate', hex: '#475569' },
    { name: 'Graphite', hex: '#1f2937' },
    { name: 'Cobalt', hex: '#1e3a8a' },
    { name: 'Forest', hex: '#064e3b' },
    { name: 'Crimson', hex: '#991b1b' },
    { name: 'Amber', hex: '#b45309' },
    { name: 'Violet', hex: '#4c1d95' },
    { name: 'Onyx', hex: '#0a0a0a' }
  ];

  // --- MISSION EDIT STATES ---
  const [editingMission, setEditingMission] = useState(null);
  const [editMissionText, setEditMissionText] = useState('');
  const [editMissionColor, setEditMissionColor] = useState('#475569');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // --- CHECK FOR FIRST-TIME MODE ENTRY ---
  useEffect(() => {
    const nightBriefingSeen = localStorage.getItem('nightBriefingSeen');
    const morningBriefingSeen = localStorage.getItem('morningBriefingSeen');

    if (mode === 'night' && !nightBriefingSeen) {
      setShowNightBriefing(true);
    } else if (mode === 'morning' && !morningBriefingSeen) {
      setShowMorningBriefing(true);
    }
  }, [mode]);

  const handleCloseNightBriefing = () => {
    localStorage.setItem('nightBriefingSeen', 'true');
    setShowNightBriefing(false);
  };

  const handleCloseMorningBriefing = () => {
    localStorage.setItem('morningBriefingSeen', 'true');
    setShowMorningBriefing(false);
  };

  // --- AUTO-ARCHIVE: Runs when transitioning from Morning to Night ---
  const autoArchiveMissions = useCallback(async () => {
    console.log('[SYSTEM] Auto-archiving missions for night transition...');
    // Delete incomplete missions, archive crushed ones
    await supabase.from('missions').delete().eq('user_id', session.user.id).eq('crushed', false).eq('is_active', true);
    await supabase.from('missions').update({ is_active: false }).eq('user_id', session.user.id).eq('crushed', true);
    fetchAllData();
  }, [session]);

  // --- SYSTEM CLOCK: Check time every minute ---
  useEffect(() => {
    const checkSystemTime = () => {
      // DEV OVERRIDE: If manually toggled via Secret Portal, don't fight with the clock
      if (devOverrideRef.current) {
        return;
      }

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [mornH, mornM] = schedule.morning_start_time.split(':').map(Number);
      const [nightH, nightM] = schedule.night_start_time.split(':').map(Number);
      const morningMinutes = mornH * 60 + mornM;
      const nightMinutes = nightH * 60 + nightM;

      const isWithinMorningWindow = currentMinutes >= morningMinutes && currentMinutes < nightMinutes;

      // --- NIGHT TIME TRANSITIONS ---
      if (!isWithinMorningWindow) {
        // Detect Morning -> Night transition for auto-archive
        if (previousModeRef.current === 'morning' && mode === 'morning') {
          autoArchiveMissions();
          // Reset protocol armed for the next day
          setProtocolArmed(false);
          localStorage.removeItem('protocolArmed');
        }
        previousModeRef.current = 'night';
        if (mode !== 'night') {
          setMode('night');
        }
        return;
      }

      // --- MORNING TIME: Only switch if protocol is armed ---
      if (isWithinMorningWindow) {
        // Reset contract when transitioning into morning window
        if (previousModeRef.current === 'night') {
          setContractSigned(false);
        }
        previousModeRef.current = 'morning';

        // NEW GATEKEEPER LOGIC: Only switch to morning if protocol is armed
        if (protocolArmed && mode !== 'morning') {
          setMode('morning');
        }
        // If protocol is NOT armed, FORCE night mode (gatekeeper waiting for user to initiate)
        if (!protocolArmed && mode !== 'night') {
          setMode('night');
        }
      }
    };

    // Initial check
    checkSystemTime();

    // Check every minute
    const interval = setInterval(checkSystemTime, 60000);

    return () => clearInterval(interval);
  }, [schedule, mode, autoArchiveMissions, contractSigned, protocolArmed]);

  // --- FETCH SCHEDULE FROM PROFILE ---
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('morning_start_time, night_start_time')
        .eq('id', session.user.id)
        .single();

      if (!error && data) {
        setSchedule({
          morning_start_time: data.morning_start_time || '06:00',
          night_start_time: data.night_start_time || '21:00'
        });
      }
    };

    fetchSchedule();
  }, [session]);

  const handleScheduleSave = (newSchedule) => {
    setSchedule(newSchedule);
  };

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
          // Calculate color: GOLD (crushed), GREEN (100%), RED (incomplete)
          let color = '#334155'; // Default: no data
          if (stats.total > 0) {
              const allComplete = (stats.completed + stats.crushed) === stats.total;
              const hasCrushed = stats.crushed > 0;
              if (allComplete && hasCrushed) {
                  color = '#fbbf24'; // GOLD: 100% + at least one crushed
              } else if (allComplete) {
                  color = '#10b981'; // GREEN: 100% complete
              } else {
                  color = '#ef4444'; // RED: Not fully complete (failed)
              }
          }
          days.push({ date: d, ...stats, color });
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
  const addMission = async (taskText = missionInput, goalId = selectedGoalId) => {
    if (!taskText.trim()) return;
    const zoneMissions = myMissions.filter(m => m.goal_id === goalId);
    const nextPosition = zoneMissions.length > 0 ? Math.max(...zoneMissions.map(m => m.position || 0)) + 1 : 0;
    const { data, error } = await supabase.from('missions').insert([{
      task: taskText,
      user_id: session.user.id,
      completed: false,
      crushed: false,
      is_active: true,
      goal_id: goalId,
      is_private: isPrivateMission,
      position: nextPosition,
      color: '#475569'
    }]).select();
    if (!error && data) {
      setMyMissions([...myMissions, data[0]]);
      setMissionInput('');
      setIsPrivateMission(false);
    }
  };

  // --- MISSION REORDER HANDLER ---
  const handleMissionReorder = async (activeId, overId, zoneId) => {
    const zoneMissions = myMissions.filter(m => m.goal_id === zoneId && !m.completed && !m.crushed);
    const oldIndex = zoneMissions.findIndex(m => m.id === activeId);
    const newIndex = zoneMissions.findIndex(m => m.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(zoneMissions, oldIndex, newIndex);

    // Update positions
    const updates = reordered.map((m, idx) => ({ ...m, position: idx }));

    // Optimistic update
    const otherMissions = myMissions.filter(m => m.goal_id !== zoneId || m.completed || m.crushed);
    setMyMissions([...otherMissions, ...updates]);

    // Persist to database
    for (const mission of updates) {
      await supabase.from('missions').update({ position: mission.position }).eq('id', mission.id);
    }
  };

  // --- MISSION EDIT HANDLERS ---
  const openMissionEdit = (mission) => {
    setEditingMission(mission);
    setEditMissionText(mission.task);
    setEditMissionColor(mission.color || '#475569');
    setShowDeleteConfirm(false);
  };

  const saveMissionEdit = async () => {
    if (!editingMission || !editMissionText.trim()) return;

    const { error } = await supabase.from('missions')
      .update({ task: editMissionText, color: editMissionColor })
      .eq('id', editingMission.id);

    if (!error) {
      setMyMissions(myMissions.map(m =>
        m.id === editingMission.id ? { ...m, task: editMissionText, color: editMissionColor } : m
      ));
      setEditingMission(null);
    }
  };

  const confirmDeleteMission = async () => {
    if (!editingMission) return;
    await deleteMission(editingMission.id);
    setEditingMission(null);
    setShowDeleteConfirm(false);
  };
  // --- TOAST/NOTIFICATION STATE ---
  const [protocolToast, setProtocolToast] = useState(null);

  const handleInitiateProtocol = () => {
    // Step 1: Missions are already saved by NightMode component
    // Step 2: Arm the protocol
    setProtocolArmed(true);
    localStorage.setItem('protocolArmed', 'true');

    // Step 3: Check current time to decide behavior
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [mornH, mornM] = schedule.morning_start_time.split(':').map(Number);
    const morningMinutes = mornH * 60 + mornM;

    if (currentMinutes < morningMinutes) {
      // SCENARIO A: Planning ahead (before morning start time)
      // Show toast and stay in Night Mode
      setProtocolToast('Protocol Saved. System Armed for Morning Launch.');
      setTimeout(() => setProtocolToast(null), 4000);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 }, colors: ['#c084fc', '#a855f7'] });
    } else {
      // SCENARIO B: Late/Next Day (during or after morning start time)
      // Switch immediately to Morning Mode
      setShowManifestReview(false);
      setContractSigned(true);
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.8 }, colors: ['#c084fc', '#ffffff'] });
      setTimeout(() => { setMode('morning'); window.scrollTo(0, 0); }, 1000);
    }
  };

  // Keep old function for backwards compatibility (in case it's called elsewhere)
  const handleLockIn = handleInitiateProtocol;

  // --- ROCKET FIREWORKS FUNCTION ---
  const launchRocketFireworks = () => {
    // Step 1: Play launch sound IMMEDIATELY
    if (launchAudioRef.current) {
      launchAudioRef.current.currentTime = 0;
      launchAudioRef.current.play().catch(() => {});
    }

    // Step 2: After 1.5 second delay, play boom and trigger explosion
    setTimeout(() => {
      // Play boom sound
      if (boomAudioRef.current) {
        boomAudioRef.current.currentTime = 0;
        boomAudioRef.current.play().catch(() => {});
      }

      // Trigger confetti burst - shooting UP from bottom and exploding outward
      const colors = ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#00ffff', '#0066ff', '#ff00ff', '#ffffff'];

      // Main explosion burst
      confetti({
        particleCount: 150,
        spread: 360,
        startVelocity: 55,
        origin: { y: 1 },
        colors: colors,
        ticks: 400,
        gravity: 0.8,
        scalar: 1.2
      });

      // Secondary bursts for more impact
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 360,
          startVelocity: 45,
          origin: { x: 0.3, y: 0.6 },
          colors: colors
        });
        confetti({
          particleCount: 100,
          spread: 360,
          startVelocity: 45,
          origin: { x: 0.7, y: 0.6 },
          colors: colors
        });
      }, 200);
    }, 1500);
  };
  const toggleCompleted = async (mission) => {
    const newCompleted = !mission.completed;
    const updates = { completed: newCompleted, crushed: newCompleted ? mission.crushed : false };
    const nextMissions = myMissions.map(m => m.id === mission.id ? { ...m, ...updates } : m);
    const allDone = nextMissions.length > 0 && nextMissions.every(m => m.completed || m.crushed);
    if (newCompleted && !mission.completed) {
      const goal = myGoals.find(g => g.id === mission.goal_id);
      const color = goal ? goal.color : '#cbd5e1';
      if (allDone) {
        // 100% complete - launch rocket fireworks with sound!
        launchRocketFireworks();
      } else {
        confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 }, colors: [color], scalar: 0.8 });
      }
    }
    const { error } = await supabase.from('missions').update(updates).eq('id', mission.id);
    if (!error) { setMyMissions(nextMissions); }
  };
  const toggleCrushed = async (mission) => {
    const newCrushed = !mission.crushed;
    const updates = { crushed: newCrushed, completed: newCrushed ? true : mission.completed };
    const nextMissions = myMissions.map(m => m.id === mission.id ? { ...m, ...updates } : m);
    const allDone = nextMissions.length > 0 && nextMissions.every(m => m.completed || m.crushed);
    if (newCrushed) {
      if (allDone) {
        // 100% complete - launch rocket fireworks with sound!
        launchRocketFireworks();
      } else {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 }, colors: ['#f59e0b', '#fbbf24', '#ffffff'], scalar: 1.2 });
      }
    }
    const { error } = await supabase.from('missions').update(updates).eq('id', mission.id);
    if (!error) {
      setMyMissions(nextMissions);
      if(newCrushed) setCrushedHistory([ { ...mission, ...updates }, ...crushedHistory ]);
      else setCrushedHistory(crushedHistory.filter(m => m.id !== mission.id));
    }
  };
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

  // --- DND SENSORS ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // --- SORTABLE MISSION ITEM COMPONENT ---
  const SortableMissionItem = ({ mission, zoneColor, onEdit }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mission.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 1,
    };

    const handleTileClick = (e) => {
      // Don't open edit if clicking the drag handle
      if (e.target.closest('[data-drag-handle]')) return;
      onEdit(mission);
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <div
          onClick={handleTileClick}
          style={{
            background: mission.color || 'rgba(255,255,255,0.03)',
            padding: '16px',
            borderRadius: '16px',
            border: isDragging ? '2px solid #c084fc' : '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.5)' : 'none'
          }}
        >
          {/* Drag Handle - Only this triggers drag */}
          <div
            {...listeners}
            data-drag-handle="true"
            style={{
              cursor: 'grab',
              color: '#666',
              touchAction: 'none',
              padding: '8px 4px',
              marginLeft: '-8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#aaa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; }}
          >
            <GripVertical size={20} />
          </div>

          {/* Task Text */}
          <span style={{ fontSize: '16px', color: '#ddd', flex: 1, lineHeight: '1.4' }}>{mission.task}</span>

          {/* Edit Indicator */}
          <div style={{ color: '#555', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={mode === 'night' ? nightStyle : morningStyle}>
       <style>{globalStyles}</style>
       <div ref={fireworksRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}></div>

       {/* AUDIO ELEMENTS FOR FIREWORKS */}
       <audio ref={launchAudioRef} src="/launch.mp3" preload="auto" />
       <audio ref={boomAudioRef} src="/boom.mp3" preload="auto" />
       
       {/* --- NOTIFICATION TOAST --- */}
       {notification && ( <div style={{ position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 20000, background: notification.type === 'crushed' ? '#f59e0b' : (notification.type === 'error' ? '#ef4444' : '#10b981'), padding: '12px 24px', borderRadius: '30px', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', animation: 'fadeIn 0.3s' }}> {notification.msg} </div> )}

       {/* --- PROTOCOL TOAST --- */}
       {protocolToast && (
         <div style={{
           position: 'fixed',
           top: '70px',
           left: '50%',
           transform: 'translateX(-50%)',
           zIndex: 20001,
           background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)',
           padding: '16px 24px',
           borderRadius: '16px',
           color: 'white',
           fontWeight: 'bold',
           boxShadow: '0 4px 20px rgba(168, 85, 247, 0.5)',
           animation: 'fadeIn 0.3s',
           display: 'flex',
           alignItems: 'center',
           gap: '10px',
           fontSize: '14px'
         }}>
           <Rocket size={18} /> {protocolToast}
         </div>
       )}

       {/* --- HISTORY CALENDAR MODAL --- */}
       {historyModal && (
           <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
               <div style={{ background: '#1e293b', padding: '24px', borderRadius: '24px', width: '90%', maxWidth: '340px', border: '1px solid #334155' }}>
                   <h3 style={{ color: 'white', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={20} /> History Log</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginTop: '20px' }}>
                       {['S','M','T','W','T','F','S'].map((d, idx) => <span key={idx} style={{ color: '#94a3b8', fontSize: '10px', textAlign: 'center' }}>{d}</span>)}
                       {getHistoryDays().map((d, i) => (
                           <div key={i} style={{ height: '30px', borderRadius: '8px', background: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'white', boxShadow: d.color === '#fbbf24' ? '0 0 10px rgba(251,191,36,0.5)' : 'none' }}>
                               {d.date.getDate()}
                           </div>
                       ))}
                   </div>
                   {/* LEGEND */}
                   <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }}></div>
                           <span style={{ fontSize: '10px', color: '#94a3b8' }}>Failed</span>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }}></div>
                           <span style={{ fontSize: '10px', color: '#94a3b8' }}>Complete</span>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fbbf24', boxShadow: '0 0 6px rgba(251,191,36,0.5)' }}></div>
                           <span style={{ fontSize: '10px', color: '#94a3b8' }}>Crushed</span>
                       </div>
                   </div>
                   <button onClick={() => setHistoryModal(false)} style={{ width: '100%', padding: '12px', marginTop: '16px', borderRadius: '16px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', cursor: 'pointer' }}>Close</button>
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
            {/* PROFILE DROPDOWN MENU */}
              {showProfileMenu && (
                  <div style={{ position: 'absolute', top: '55px', left: 0, background: mode === 'night' ? '#1e293b' : 'white', border: '1px solid #334155', borderRadius: '16px', padding: '8px', width: '180px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <button onClick={() => avatarInputRef.current.click()} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: mode === 'night' ? 'white' : '#1e293b', fontSize: '14px', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}>
                          <Upload size={16} /> Upload Photo
                      </button>
                      <button onClick={() => { setShowScheduleSettings(true); setShowProfileMenu(false); }} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: mode === 'night' ? 'white' : '#1e293b', fontSize: '14px', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}>
                          <Clock size={16} /> Schedule
                      </button>
                      
                      <div style={{ height: '1px', background: '#334155', margin: '4px 0' }}></div>
                      
                      {/* NEW CLEAR BOARD BUTTON */}
                      <button onClick={() => { clearDailyMissions(); setShowProfileMenu(false); }} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#fbbf24', fontSize: '14px', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}>
                          <Eraser size={16} /> Clear Board
                      </button>

                      <button onClick={handleLogout} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '14px', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}>
                          <LogOut size={16} /> Sign Out
                      </button>
                  </div>
              )}
          </div>

          {/* --- TOP RIGHT: ALLY & HELP --- */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={() => onOpenSystemGuide(mode)} style={{ border: 'none', background: 'transparent', padding: '8px 12px', cursor: 'pointer', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', color: mode === 'night' ? '#64748b' : '#94a3b8' }}>
                HOW IT WORKS
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
        {mode === 'night' && !contractSigned && (
          /* CONTRACT SIGNING VIEW - Gatekeeper */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(192, 132, 252, 0.1)', padding: '30px', borderRadius: '24px', border: '2px solid #c084fc', maxWidth: '340px', width: '100%' }}>
              <Fingerprint size={64} color="#c084fc" style={{ marginBottom: '20px' }} />
              <h2 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '24px', fontWeight: '900' }}>SIGN THE CONTRACT</h2>
              <p style={{ margin: '0 0 25px 0', color: '#a78bfa', fontSize: '14px', lineHeight: '1.5' }}>
                Before entering Night Mode, confirm your commitment to tomorrow's protocol.
              </p>
              <div style={{ background: '#1e1b4b', padding: '20px', borderRadius: '16px', marginBottom: '25px' }}>
                <p style={{ margin: 0, color: '#e9d5ff', fontSize: '13px', fontStyle: 'italic' }}>
                  "I commit to executing my missions with intention and discipline."
                </p>
              </div>
              <button
                onClick={() => setContractSigned(true)}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)',
                  color: 'white',
                  fontWeight: '900',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)'
                }}
              >
                <ShieldCheck size={20} /> SIGN & ENTER
              </button>
            </div>
          </div>
        )}

        {mode === 'night' && contractSigned && (
          <NightMode
            session={session}
            myGoals={myGoals}
            myMissions={myMissions}
            setMyMissions={setMyMissions}
            setMyGoals={setMyGoals}
            historyData={historyData}
            debugLog={debugLog}
            missionInput={missionInput}
            setMissionInput={setMissionInput}
            currentInput={currentInput}
            setCurrentInput={setCurrentInput}
            isPrivateMission={isPrivateMission}
            setIsPrivateMission={setIsPrivateMission}
            isPrivateVision={isPrivateVision}
            setIsPrivateVision={setIsPrivateVision}
            previewUrl={previewUrl}
            uploading={uploading}
            fileInputRef={fileInputRef}
            handleCapture={handleCapture}
            clearMedia={clearMedia}
            fetchAllData={fetchAllData}
            onOpenSystemGuide={onOpenSystemGuide}
            onExecuteProtocol={handleInitiateProtocol}
            activeMissions={activeMissions}
          />
        )}


       {mode === 'morning' && (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
           {activeTab === 'mission' && ( 
             <div style={{ animation: 'fadeIn 0.3s' }}> 
               
               {/* --- ACTIVE MISSION DASHBOARD (GRID) --- */}
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#0f172a', fontWeight: '800', fontSize: '18px' }}> 
                  <ListTodo size={22} color="#3b82f6" /> Mission Dashboard 
               </div> 

               {activeMissions.length === 0 && completedMissions.length === 0 && ( 
                 <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px', background: '#f8fafc' }}> 
                    <AlertCircle size={48} color="#cbd5e1" style={{ marginBottom: '10px' }} /> 
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#64748b' }}>Protocol Empty.</p> 
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Log out or switch to Night Mode to assign objectives.</p> 
                    <button onClick={() => setMode('night')} style={{ marginTop: '15px', padding: '8px 16px', background: '#334155', color: 'white', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}> <Moon size={10} style={{ marginRight: '5px' }} /> Return to Night Mode </button> 
                 </div> 
               )}
               
               {/* THE COMMAND GRID */}
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}> 
                  {activeMissions.map(m => ( 
                    <div key={m.id} style={{ 
                        background: getGoalColor(m.goal_id), 
                        borderRadius: '20px', 
                        padding: '16px', 
                        minHeight: '140px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        position: 'relative'
                    }}>
                        {/* TEXT AREA */}
                        <div>
                             <p style={{ margin: '0 0 10px 0', color: 'white', fontWeight: 'bold', fontSize: '16px', lineHeight: '1.4', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                                {m.task}
                             </p>
                             {m.is_private && <Lock size={12} color="rgba(255,255,255,0.7)" />}
                        </div>
                        
                        {/* ACTION AREA (GLASS BUTTONS) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                             <button onClick={() => toggleCompleted(m)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                                <CheckSquare size={16} />
                             </button>
                             <button onClick={() => toggleCrushed(m)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                                <Flame size={16} fill="white" />
                             </button>
                        </div>
                        
                        {/* PARTNER INDICATOR */}
                        {m.cheer_note && <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '16px' }}>❤️</div>}
                    </div> 
                  ))} 
               </div> 

               {/* --- THE VICTORY PILE (COMPLETED) --- */}
               {completedMissions.length > 0 && (
                 <div style={{ marginTop: '30px' }}>
                     <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '15px', textAlign: 'center' }}>Completed Ops</h3>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.8 }}>
                        {completedMissions.map(m => (
                            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRadius: '16px', background: m.crushed ? '#fff7ed' : '#f0fdf4', border: m.crushed ? '1px solid #fdba74' : '1px solid #bbf7d0' }}> 
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}> 
                                    <div onClick={() => toggleCompleted(m)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}> 
                                        <div style={{ minWidth: '24px', height: '24px', borderRadius: '8px', background: m.completed ? getGoalColor(m.goal_id) : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> 
                                            {m.completed && <CheckSquare size={16} color="white" />} 
                                        </div> 
                                        <span style={{ textDecoration: 'line-through', color: m.completed ? (m.crushed ? '#d97706' : '#166534') : '#334155', fontWeight: '600', fontSize: '16px' }}>{m.task}</span> 
                                    </div> 
                                    <button onClick={() => toggleCrushed(m)} style={{ background: m.crushed ? '#f59e0b' : 'transparent', border: m.crushed ? 'none' : '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}> 
                                        <Flame size={16} color={m.crushed ? 'white' : '#cbd5e1'} fill={m.crushed ? 'white' : 'transparent'} /> 
                                    </button> 
                                </div>
                                {m.crushed && ( <div style={{ marginTop: '5px' }}> {m.victory_note ? ( <div style={{ color: '#c2410c', fontWeight: 'bold', fontSize: '14px', background: 'rgba(255,255,255,0.5)', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}> <Trophy size={14} /> <span>{m.victory_note}</span> </div> ) : ( <div style={{ display: 'flex', gap: '8px' }}> <input type="text" placeholder="How did you crush it?" value={tempVictoryNotes[m.id] || ''} onChange={(e) => handleDraftChange(m.id, e.target.value)} style={{ flex: 1, padding: '8px', fontSize: '14px', border: '1px solid #fed7aa', borderRadius: '8px', background: '#fff', color: '#c2410c', outline: 'none' }} /> <button onClick={() => handleNoteSave(m.id)} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '0 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>SAVE</button> </div> )} </div> )}
                            </div>
                        ))}
                     </div>
                 </div>
               )}

               {activeMissions.length === 0 && completedMissions.length > 0 && (
                   <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                       <Trophy size={48} color="#f59e0b" style={{ marginBottom: '10px' }} />
                       <h2 style={{ margin: 0, color: '#1e293b' }}>ALL CLEAR</h2>
                       <p>You have won the day.</p>
                   </div>
               )}

             </div> 
           )}

           {activeTab === 'vision' && !viewingGoal && ( <div style={{ animation: 'fadeIn 0.3s', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}> <div onClick={() => setViewingGoal('all')} style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}> <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '50%' }}><Archive size={24} color="#64748b" /></div> <span style={{ fontWeight: 'bold', color: '#334155' }}>All Visions</span> </div> {myGoals.map(g => ( <div key={g.id} onClick={() => setViewingGoal(g)} style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', borderTop: `4px solid ${g.color}`, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}> <div style={{ background: `${g.color}20`, padding: '15px', borderRadius: '50%' }}><Target size={24} color={g.color} /></div> <span style={{ fontWeight: 'bold', color: '#334155', textAlign: 'center' }}>{g.title}</span> {g.is_private && <Lock size={12} color="#94a3b8" style={{ marginTop: '5px' }} />} <span style={{ fontSize: '10px', color: '#94a3b8' }}>{myThoughts.filter(t => t.goal_id === g.id).length} Items</span> </div> ))} {myGoals.length === 0 && <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '14px' }}>No goals created yet. Use Night Mode to add goals.</div>} </div> )}
           {activeTab === 'vision' && viewingGoal && ( <div style={{ animation: 'fadeIn 0.3s' }}> <button onClick={() => { setViewingGoal(null); setShowArchives(false); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#64748b', fontSize: '14px', marginBottom: '15px', cursor: 'pointer' }}><ArrowLeft size={16} /> Back to Folders</button> <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}> <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{viewingGoal === 'all' ? 'All Visions' : viewingGoal.title}</h2> {viewingGoal !== 'all' && ( <button onClick={() => toggleGoalPrivacy(viewingGoal)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: viewingGoal.is_private ? '#ef4444' : '#94a3b8' }}> {viewingGoal.is_private ? <Lock size={20} /> : <Unlock size={20} />} </button> )} </div> <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}> <button onClick={() => setShowArchives(!showArchives)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: showArchives ? '#334155' : 'white', color: showArchives ? 'white' : '#64748b', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px' }}> {showArchives ? <Target size={14} /> : <History size={14} />} {showArchives ? 'Current' : 'Vault'} </button> </div> <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '10px' }}>{showArchives ? 'The Hall of Fame (Archived)' : 'The Fuel (Media)'}</h3> <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '20px', scrollbarWidth: 'none' }}> {getDisplayedThoughts().filter(t => !t.is_quote).map(t => ( <div key={t.id} style={{ position: 'relative', minWidth: '260px', background: t.ignited ? '#f8fafc' : 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', opacity: t.ignited ? 0.7 : 1 }}> <div onClick={() => initiateDeleteThought(t.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}> <X size={14} color="white" /> </div> {t.image_url && <img src={t.image_url} style={{ width: '100%', height: '180px', objectFit: 'cover', filter: t.ignited ? 'grayscale(100%)' : 'none' }} />} {t.video_url && <video src={t.video_url} controls style={{ width: '100%', height: '180px', background: 'black' }} />} <div style={{ padding: '15px' }}> <p style={{ margin: 0, fontWeight: '600', fontSize: '16px', color: t.ignited ? '#94a3b8' : '#1e293b', textDecoration: t.ignited ? 'line-through' : 'none' }}>"{t.text}"</p> {t.is_private && <div style={{ marginTop: '5px', fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}><Lock size={10} /> PRIVATE</div>} <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}> <button onClick={() => toggleIgnite(t.id, t.ignited)} style={{ flex: 1, padding: '8px', background: t.ignited ? '#fff7ed' : '#f1f5f9', color: t.ignited ? '#f59e0b' : '#64748b', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}> {t.ignited ? <><RefreshCcw size={12} /> Undo</> : 'Ignite'} </button> <button onClick={() => toggleArchive(t.id, t.archived)} style={{ flex: 1, padding: '8px', background: t.archived ? '#f1f5f9' : '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}> {t.archived ? 'Restore' : 'Archive'} </button> </div> </div> </div> ))} {getDisplayedThoughts().filter(t => !t.is_quote).length === 0 && <p style={{ color: '#cbd5e1', fontSize: '14px' }}>{showArchives ? 'The vault is empty.' : 'No media fuel yet.'}</p>} </div> <div style={{ marginTop: '20px' }}> <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#d97706', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><Trophy size={12} /> The Receipts (Crushed)</h3> <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}> {crushedHistory.filter(m => viewingGoal === 'all' ? true : m.goal_id === viewingGoal.id && m.user_id === session.user.id).map(m => ( <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d' }}> <div style={{ marginTop: '2px' }}><Flame size={14} color="#d97706" fill="#d97706" /></div> <div> <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>{m.task}</p> {m.victory_note && <p style={{ margin: 0, fontSize: '13px', color: '#b45309', fontStyle: 'italic' }}>"{m.victory_note}"</p>} </div> </div> ))} {crushedHistory.filter(m => viewingGoal === 'all' ? true : m.goal_id === viewingGoal.id && m.user_id === session.user.id).length === 0 && <p style={{ color: '#cbd5e1', fontSize: '14px' }}>No wins recorded yet. Crush a goal tomorrow.</p>} </div> </div> </div> )}
           {activeTab === 'ally' && ( <div style={{ animation: 'fadeIn 0.3s' }}> {!viewingGoal ? ( <> <div style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px' }}> <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#0f172a', fontWeight: '800', fontSize: '18px' }}> <Users size={22} color="#60a5fa" /> Partner's Frontline </div> {partnerMissions.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px' }}><p style={{ margin: 0, fontSize: '14px' }}>Partner has no active missions.</p></div>} <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}> {partnerMissions.map(m => ( <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRadius: '12px', background: m.completed ? '#f0fdf4' : '#f8fafc', borderLeft: `4px solid ${getGoalColor(m.goal_id)}`, border: '1px solid #e2e8f0', borderLeftWidth: '4px', opacity: m.completed && !m.crushed ? 0.7 : 1 }}> <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}> <div style={{ marginRight: '8px' }}>{partnerProfile?.avatar_url ? <img src={partnerProfile.avatar_url} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0' }}></div>}</div> <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: getGoalColor(m.goal_id), letterSpacing: '0.5px' }}>{getGoalTitle(m.goal_id)}</span><span style={{ color: m.completed ? '#16a34a' : '#334155', fontWeight: '600', fontSize: '16px', textDecoration: m.completed && !m.crushed ? 'line-through' : 'none' }}>{m.task}</span></div> <button onClick={() => openCheerModal(m.id)} style={{ background: m.cheer_note ? '#f0fdf4' : 'white', border: '1px solid #cbd5e1', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><MessageCircle size={16} color={m.cheer_note ? '#16a34a' : '#94a3b8'} /></button> </div> {m.crushed && m.victory_note && ( <div style={{ marginTop: '5px', fontSize: '13px', color: '#c2410c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', background: '#fffbeb', padding: '6px', borderRadius: '8px' }}> <Trophy size={12} color="#f59e0b" /> "{m.victory_note}" </div> )} {m.cheer_note && ( <div style={{ marginTop: '5px', fontSize: '12px', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}> <Heart size={12} fill="currentColor" /> You: "{m.cheer_note}" </div> )} </div> ))} </div> </div> <div style={{ marginBottom: '20px' }}><h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#d97706', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><Trophy size={12} /> Recent Victories</h3><div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{crushedHistory.filter(m => m.user_id !== session.user.id).slice(0, 5).map(m => (<div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d' }}><div style={{ marginTop: '2px' }}><Flame size={14} color="#d97706" fill="#d97706" /></div><div><p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>{m.task}</p>{m.victory_note && <p style={{ margin: 0, fontSize: '13px', color: '#b45309', fontStyle: 'italic' }}>"{m.victory_note}"</p>}</div></div>))}{crushedHistory.filter(m => m.user_id !== session.user.id).length === 0 && <p style={{ color: '#cbd5e1', fontSize: '14px' }}>No partner victories yet.</p>}</div></div> <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}><div onClick={() => setViewingGoal('all')} style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}><div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '50%' }}><Archive size={24} color="#64748b" /></div><span style={{ fontWeight: 'bold', color: '#334155' }}>All Partner Visions</span></div>{partnerGoals.map(g => (<div key={g.id} onClick={() => setViewingGoal(g)} style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', borderTop: `4px solid ${g.color}`, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}><div style={{ background: `${g.color}20`, padding: '15px', borderRadius: '50%' }}><Target size={24} color={g.color} /></div><span style={{ fontWeight: 'bold', color: '#334155', textAlign: 'center' }}>{g.title}</span><span style={{ fontSize: '10px', color: '#94a3b8' }}>{partnerThoughts.filter(t => t.goal_id === g.id).length} Items</span></div>))}</div> </> ) : ( <> <button onClick={() => setViewingGoal(null)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#64748b', fontSize: '14px', marginBottom: '15px', cursor: 'pointer' }}><ArrowLeft size={16} /> Back to Partner Folders</button> <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 20px 0' }}>{viewingGoal === 'all' ? 'All Partner Visions' : viewingGoal.title}</h2> <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '20px', scrollbarWidth: 'none' }}>{getPartnerDisplayedThoughts().filter(t => !t.is_quote).map(t => (<div key={t.id} style={{ position: 'relative', minWidth: '260px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>{t.image_url && <img src={t.image_url} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />}{t.video_url && <video src={t.video_url} controls style={{ width: '100%', height: '180px', background: 'black' }} />}<div style={{ padding: '15px' }}><p style={{ margin: 0, fontWeight: '600', fontSize: '16px', color: '#1e293b' }}>"{t.text}"</p></div></div>))}{getPartnerDisplayedThoughts().filter(t => !t.is_quote).length === 0 && <p style={{ color: '#cbd5e1', fontSize: '14px' }}>Partner has no media here.</p>}</div> <div style={{ marginTop: '20px' }}><h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#d97706', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><Trophy size={12} /> Partner's Wins</h3><div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{crushedHistory.filter(m => viewingGoal === 'all' ? true : m.goal_id === viewingGoal.id && m.user_id !== session.user.id).map(m => (<div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d' }}><div style={{ marginTop: '2px' }}><Flame size={14} color="#d97706" fill="#d97706" /></div><div><p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>{m.task}</p>{m.victory_note && <p style={{ margin: 0, fontSize: '13px', color: '#b45309', fontStyle: 'italic' }}>"{m.victory_note}"</p>}</div></div>))}{crushedHistory.filter(m => viewingGoal === 'all' ? true : m.goal_id === viewingGoal.id && m.user_id !== session.user.id).length === 0 && <p style={{ color: '#cbd5e1', fontSize: '14px' }}>No partner wins yet.</p>}</div></div> </> )} </div> )}
         </div>
       )}
      </div>

       {/* --- SYSTEM STATUS INDICATOR --- */}
        <div style={{ marginTop: '30px', paddingBottom: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenSystemGuide}
            style={{
              background: 'none',
              border: 'none',
              color: mode === 'night' ? '#666' : '#94a3b8',
              fontSize: '11px',
              letterSpacing: '2px',
              cursor: 'pointer',
              padding: '8px 16px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = mode === 'night' ? '#fff' : '#64748b'}
            onMouseLeave={(e) => e.target.style.color = mode === 'night' ? '#666' : '#94a3b8'}
          >
            SYSTEM GUIDE
          </button>
          <div
            onClick={handleSecretPortal}
            style={{
              opacity: 0.4,
              fontSize: '10px',
              letterSpacing: '1px',
              color: mode === 'night' ? '#555' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'default',
              userSelect: 'none',
              transition: 'all 0.2s'
            }}
          >
            <Check size={12} /> SYSTEM OPERATIONAL • v1.0
          </div>

          {/* SECRET PORTAL FLASH */}
          {secretFlash && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: mode === 'night' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(168, 85, 247, 0.3)',
              zIndex: 99999,
              pointerEvents: 'none',
              animation: 'fadeOut 0.3s forwards'
            }} />
          )}
        </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } } @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } } @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }`}</style>

      {/* --- MODE BRIEFINGS --- */}
      {showNightBriefing && <NightModeBriefing onClose={handleCloseNightBriefing} />}
      {showMorningBriefing && <MorningModeBriefing onClose={handleCloseMorningBriefing} />}

      {/* --- SCHEDULE SETTINGS --- */}
      {showScheduleSettings && (
        <ScheduleSettings
          session={session}
          currentSchedule={schedule}
          onClose={() => setShowScheduleSettings(false)}
          onSave={handleScheduleSave}
        />
      )}

      {/* --- MISSION EDIT MODAL --- */}
      {editingMission && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 50000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0f0f12', borderRadius: '24px', width: '100%', maxWidth: '340px', border: '1px solid #1e293b', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'white', fontWeight: '700', letterSpacing: '2px' }}>EDIT MISSION</span>
              <button onClick={() => { setEditingMission(null); setShowDeleteConfirm(false); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {!showDeleteConfirm ? (
              <div style={{ padding: '24px' }}>
                {/* Task Input */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', letterSpacing: '1px', marginBottom: '8px' }}>TASK</label>
                  <input
                    type="text"
                    value={editMissionText}
                    onChange={(e) => setEditMissionText(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #1e293b', background: '#000', color: 'white', fontSize: '16px', outline: 'none' }}
                  />
                </div>

                {/* Color Picker */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', letterSpacing: '1px', marginBottom: '12px' }}>COLOR</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {missionColors.map(c => (
                      <button
                        key={c.hex}
                        onClick={() => setEditMissionColor(c.hex)}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '12px',
                          background: c.hex,
                          border: editMissionColor === c.hex ? '3px solid white' : '2px solid transparent',
                          cursor: 'pointer',
                          boxShadow: editMissionColor === c.hex ? `0 0 15px ${c.hex}` : 'none',
                          transition: 'all 0.2s'
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid #7f1d1d',
                      background: 'transparent',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={14} /> DELETE
                  </button>
                  <button
                    onClick={saveMissionEdit}
                    style={{
                      flex: 2,
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'white',
                      color: 'black',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Save size={14} /> SAVE CHANGES
                  </button>
                </div>
              </div>
            ) : (
              /* Delete Confirmation */
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                  <AlertCircle size={30} color="#ef4444" />
                </div>
                <h3 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '18px' }}>CONFIRM DESTRUCTION</h3>
                <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px' }}>This mission will be permanently deleted.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #1e293b', background: 'transparent', color: '#94a3b8', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={confirmDeleteMission}
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
