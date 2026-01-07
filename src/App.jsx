import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Moon, Trash2, Image as ImageIcon, CheckCircle, Play, Sun } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [mode, setMode] = useState('night'); 
  const [thoughts, setThoughts] = useState([]);
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
    
    if (!error) setThoughts(data || []);
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
      setThoughts([data[0], ...thoughts]);
      setCurrentInput('');
      setImageFile(null);
      setImagePreview(null);
    }
    
    setUploading(false);
  };

  const deleteThought = async (id) => {
    const { error } = await supabase.from('thoughts').delete().eq('id', id);
    if (!error) {
      setThoughts(thoughts.filter(t => t.id !== id));
    }
  };

  const toggleIgnite = async (id, currentStatus) => {
    // 1. Trigger the explosion only if we are turning it ON (Igniting it)
    if (!currentStatus) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: mode === 'night' ? ['#c084fc', '#a855f7', '#ffffff'] : ['#fbbf24', '#f59e0b', '#ef4444'],
        disableForReducedMotion: true
      });
    }

    // 2. Update Database
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

  // --- STYLES ---
  // We use gradients now instead of flat colors for a premium feel
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
    background: 'linear-gradient(135deg, #fdfbf7 0%, #e2e8f0 100%)', // Golden Hour Mist
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
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              style={{ display: 'none' }} 
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                style={{ backgroundColor: '#1a1a1a', color: '#c084fc', border: '1px solid #333', borderRadius: '16px', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.1s' }}
              >
                <ImageIcon size={24} />
              </button>
              
              <button 
                onClick={handleCapture}
                disabled={uploading}
                style={{ flex: 1, backgroundColor: uploading ? '#333' : 'white', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '16px', cursor: 'pointer', fontSize: '16px', boxShadow: '0 0 15px rgba(255,255,255,0.1)' }}
              >
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

      <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
             <Sun size={32} color="#f59e0b" />
             <h1 style={{ fontSize: '42px', fontWeight: '800', lineHeight: '1', margin: 0, color: '#1e293b' }}>The Fuel.</h1>
          </div>
          <p style={{ color: '#64748b', margin: 0, fontSize: '16px' }}>Synced from Cloud Storage.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {thoughts.length === 0 && <p style={{color: '#94a3b8', fontStyle: 'italic'}}>No visions captured yet.</p>}
          
          {thoughts.map((thought) => (
            <div key={thought.id} style={{ 
                   backgroundColor: thought.ignited ? 'rgba(240, 253, 244, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
                   border: `1px solid ${thought.ignited ? '#bbf7d0' : '#e2e8f0'}`,
                   borderRadius: '20px',
                   overflow: 'hidden',
                   paddingBottom: '16px',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                   backdropFilter: 'blur(8px)',
                   transition: 'all 0.3s ease'
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
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {thought.ignited && <CheckCircle size={22} color="#22c55e" />}
                        <button onClick={() => deleteThought(thought.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.6, padding: 0 }}>
                            <Trash2 size={18} />
                        </button>
                    </div>
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

                {!thought.ignited && (
                  <button 
                    onClick={() => toggleIgnite(thought.id, thought.ignited)}
                    style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: '#2563eb', background: 'rgba(59, 130, 246, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}
                  >
                    <Play size={16} fill="currentColor" />
                    IGNITE VISION
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}