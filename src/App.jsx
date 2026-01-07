import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Moon, Trash2, Image as ImageIcon, CheckCircle, Play, Sun, Archive, Target, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [mode, setMode] = useState('night'); 
  const [activeTab, setActiveTab] = useState('targets'); 
  const [thoughts, setThoughts] = useState([]);
  const [streak, setStreak] = useState(0); // NEW: Streak State
  const [currentInput, setCurrentInput] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchThoughts();
  }, []);

  async function fetchThoughts() {
    const { data, error } = await supabase
      .from('thoughts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) {
      setThoughts(data || []);
      calculateStreak(data || []);
    }
  }

  // --- NEW: THE STREAK ALGORITHM ---
  function calculateStreak(data) {
    if (!data || data.length === 0) {
      setStreak(0);
      return;
    }

    // 1. Get all unique dates (YYYY-MM-DD) from the database
    const uniqueDates = [...new Set(data.map(item => new Date(item.created_at).toDateString()))];
    
    // 2. Sort dates (newest first)
    // We need to convert them back to Date objects to sort correctly
    const sortedDates = uniqueDates.map(d => new Date(d)).sort((a, b) => b - a);

    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    let currentStreak = 0;
    
    // 3. Check if the streak is alive (must have posted today OR yesterday)
    // If the newest post is older than yesterday, streak is broken.
    if (sortedDates[0].toDateString() !== today && sortedDates[0].toDateString() !== yesterdayString) {
      setStreak(0);
      return;
    }

    // 4. Count backwards
    // We start checking from "Today" (if exists) or "Yesterday"
    let checkDate = new Date(); // Start with today
    
    // If user hasn't posted today yet, we start checking from yesterday to be fair
    if (sortedDates[0].toDateString() !== today) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < sortedDates.length; i++) {
        if (sortedDates[i].toDateString() === checkDate.toDateString()) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1); // Move to previous day
        } else {
            break; // Gap found, stop counting
        }
    }

    setStreak(currentStreak);
  }

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCapture = async () => {
    if (!currentInput.trim() && !imageFile) return;
    
    setUploading(true);

    let finalImageUrl = null;

    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, imageFile);
        
      if (data) {
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from('thoughts')
      .insert([
        { 
          text: currentInput, 
          image_url: finalImageUrl, 
          ignited: false 
        }
      ])
      .select();

    if (data) {
      const newThoughts = [data[0], ...thoughts];
      setThoughts(newThoughts);
      calculateStreak(newThoughts); // Recalculate streak immediately
      setCurrentInput('');
      setImageFile(null);
      setImagePreview(null);
    }
    
    setUploading(false);
  };

  const deleteThought = async (id) => {
    const { error } = await supabase.from('thoughts').delete().eq('id', id);
    if (!error) {
      const newThoughts = thoughts.filter(t => t.id !== id);
      setThoughts(newThoughts);
      calculateStreak(newThoughts);
    }
  };

  const toggleIgnite = async (id, currentStatus) => {
    if (!currentStatus) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: mode === 'night' ? ['#c084fc', '#a855f7', '#ffffff'] : ['#fbbf24', '#f59e0b', '#ef4444'],
        disableForReducedMotion: true
      });
    }

    const { error } = await supabase
      .from('thoughts')
      .update({ ignited: !currentStatus })
      .eq('id', id);
      
    if (!error) {
      setThoughts(thoughts.map(t => 
        t.id === id ? { ...t, ignited: !t.ignited } : t
      ));
    }
  };

  const visibleThoughts = thoughts.filter(t => 
    activeTab === 'targets' ? !t.ignited : t.ignited
  );

  const nightStyle = {
    background: 'radial-gradient(circle at center, #1f1f22 0%, #000000 100%)',
    color: 'white',
    minHeight: '100vh',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const morningStyle = {
    background: 'linear-gradient(135deg, #fdfbf7 0%, #e2e8f0 100%)',
    color: 'black',
    minHeight: '100vh',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column'
  };

  if (mode === 'night') {
    return (
      <div style={nightStyle}>
        <button onClick={() => setMode('morning')} style={{ position: 'absolute', top: '16px', right: '16px', border: '1px solid #333', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', color: '#888', background: 'rgba(0,0,0,0.5)', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
          Skip to Morning ☀️
        </button>

        <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.9, marginBottom: '15px' }}>
                <Moon size={56} color="#c084fc" style={{ filter: 'drop-shadow(0 0 10px rgba(192, 132, 252, 0.5))' }} />
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', background: 'linear-gradient(to right, #e9d5ff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              Vision Log.
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0', letterSpacing: '1px', textTransform: 'uppercase' }}>Capture the Fuel</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {imagePreview && (
              <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #333', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            )}
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="What are you building?"
              style={{ width: '100%', height: '120px', backgroundColor: 'rgba(26, 26, 26, 0.8)', border: '1px solid #333', color: 'white', outline: 'none', borderRadius: '16px', padding: '16px', fontSize: '18px', resize: 'none', backdropFilter: 'blur(10px)' }}
              disabled={uploading}
            />
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} style={{ display: 'none' }} />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => fileInputRef.current.click()} disabled={uploading} style={{ backgroundColor: '#1a1a1a', color: '#c084fc', border: '1px solid #333', borderRadius: '16px', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.1s' }}>
                <ImageIcon size={24} />
              </button>
              <button onClick={handleCapture} disabled={uploading} style={{ flex: 1, backgroundColor: uploading ? '#333' : 'white', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '16px', cursor: 'pointer', fontSize: '16px', boxShadow: '0 0 15px rgba(255,255,255,0.1)' }}>
                {uploading ? 'Syncing...' : 'Capture Vision'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MORNING MODE
  return (
    <div style={morningStyle}>
       <button onClick={() => setMode('night')} style={{ position: 'absolute', top: '16px', right: '16px', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', color: '#64748b', background: 'rgba(255,255,255,0.5)', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
          Back to Capture 🌙
        </button>

      <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ marginTop: '40px' }}>
          
          {/* THE STREAK DISPLAY */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sun size={32} color="#f59e0b" />
                <h1 style={{ fontSize: '42px', fontWeight: '800', lineHeight: '1', margin: 0, color: '#1e293b' }}>The Fuel.</h1>
            </div>
            
            {/* FLAME ICON */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff7ed', padding: '6px 12px', borderRadius: '20px', border: '1px solid #ffedd5' }}>
                <Flame size={20} fill={streak > 0 ? "#f97316" : "none"} color="#f97316" />
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#9a3412' }}>{streak} Day{streak !== 1 && 's'}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content', marginTop: '10px' }}>
            <button 
              onClick={() => setActiveTab('targets')}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '8px', 
                border: 'none', 
                background: activeTab === 'targets' ? 'white' : 'transparent',
                boxShadow: activeTab === 'targets' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                color: activeTab === 'targets' ? '#0f172a' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Target size={16} /> Targets
            </button>
            <button 
              onClick={() => setActiveTab('vault')}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '8px', 
                border: 'none', 
                background: activeTab === 'vault' ? 'white' : 'transparent',
                boxShadow: activeTab === 'vault' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                color: activeTab === 'vault' ? '#0f172a' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
               <Archive size={16} /> The Vault
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {visibleThoughts.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ margin: 0, fontSize: '16px' }}>
                {activeTab === 'targets' ? "All targets destroyed. Good work." : "The Vault is empty."}
              </p>
            </div>
          )}
          
          {visibleThoughts.map((thought) => (
            <div key={thought.id} style={{ 
                   backgroundColor: thought.ignited ? 'rgba(240, 253, 244, 0.9)' : 'rgba(255, 255, 255, 0.8)', 
                   border: `1px solid ${thought.ignited ? '#bbf7d0' : '#e2e8f0'}`,
                   borderRadius: '20px',
                   overflow: 'hidden',
                   paddingBottom: '16px',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                   backdropFilter: 'blur(8px)'
                 }}>
              
              {thought.image_url && (
                <div style={{ width: '100%', height: '260px', overflow: 'hidden' }}>
                    <img src={thought.image_url} alt="Vision" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ padding: '0 24px', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px' }}>
                        {new Date(thought.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}).toUpperCase()}
                    </span>
                    <button onClick={() => deleteThought(thought.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.6, padding: 0 }}>
                        <Trash2 size={18} />
                    </button>
                </div>
                
                <p style={{ 
                    fontSize: '19px', 
                    fontWeight: '600', 
                    lineHeight: '1.5',
                    margin: 0, 
                    color: thought.ignited ? '#94a3b8' : '#1e293b',
                    textDecoration: thought.ignited ? 'line-through' : 'none'
                }}>
                  "{thought.text}"
                </p>

                {!thought.ignited ? (
                  <button 
                    onClick={() => toggleIgnite(thought.id, thought.ignited)}
                    style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: '#2563eb', background: 'rgba(59, 130, 246, 0.1)', border: 'none', borderRadius: '8px', padding: '12px', cursor: 'pointer', width: '100%', justifyContent: 'center', transition: 'all 0.2s' }}
                  >
                    <Play size={16} fill="currentColor" />
                    IGNITE VISION
                  </button>
                ) : (
                  <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 'bold', fontSize: '14px', justifyContent: 'center' }}>
                    <CheckCircle size={18} /> Vision Secured
                    <button onClick={() => toggleIgnite(thought.id, thought.ignited)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
                      (Restore)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
