import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient'; // Connecting to the file you just made
import { Moon, Trash2, Image as ImageIcon, CheckCircle, Play } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState('night'); 
  const [thoughts, setThoughts] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [uploading, setUploading] = useState(false); // To show a "Saving..." state
  
  // Image handling
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // 1. LOAD from Supabase (The Cloud)
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

  // 2. Handle Image Selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Show immediate preview
    }
  };

  // 3. SAVE to Supabase (Upload Image + Save Text)
  const handleCapture = async () => {
    if (!currentInput.trim() && !imageFile) return;
    
    setUploading(true);

    let finalImageUrl = null;

    // A. If there is an image, upload it first
    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, imageFile);
        
      if (data) {
        // Get the public link to the image
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
      }
    }

    // B. Save the data to the database
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
      setThoughts([data[0], ...thoughts]); // Add to list instantly
      setCurrentInput('');
      setImageFile(null);
      setImagePreview(null);
    }
    
    setUploading(false);
  };

  // 4. DELETE from Supabase
  const deleteThought = async (id) => {
    const { error } = await supabase.from('thoughts').delete().eq('id', id);
    if (!error) {
      setThoughts(thoughts.filter(t => t.id !== id));
    }
  };

  // 5. TOGGLE Ignite
  const toggleIgnite = async (id, currentStatus) => {
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

  // --- NIGHT MODE ---
  if (mode === 'night') {
    return (
      <div style={{ backgroundColor: '#09090b', color: 'white', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <button onClick={() => setMode('morning')} style={{ position: 'absolute', top: '16px', right: '16px', border: '1px solid #333', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', color: '#888', background: 'transparent', cursor: 'pointer' }}>
          Skip to Morning ☀️
        </button>

        <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.8, marginBottom: '10px' }}>
                <Moon size={48} color="#a855f7" />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', background: 'linear-gradient(to right, #c084fc, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              Vision Log.
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Syncing to Cloud Database.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {imagePreview && (
              <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>X</button>
              </div>
            )}

            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="What drives you?"
              style={{ width: '100%', height: '100px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', outline: 'none', borderRadius: '12px', padding: '16px', fontSize: '16px', resize: 'none' }}
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
                style={{ backgroundColor: '#1a1a1a', color: '#a855f7', border: '1px solid #333', borderRadius: '12px', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ImageIcon size={24} />
              </button>
              
              <button 
                onClick={handleCapture}
                disabled={uploading}
                style={{ flex: 1, backgroundColor: uploading ? '#444' : 'white', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '16px' }}
              >
                {uploading ? 'Uploading...' : 'Capture Vision'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MORNING MODE ---
  return (
    <div style={{ backgroundColor: '#ffffff', color: 'black', minHeight: '100vh', padding: '24px', display: 'flex', flexDirection: 'column' }}>
       <button onClick={() => setMode('night')} style={{ position: 'absolute', top: '16px', right: '16px', border: '1px solid #ddd', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', color: '#666', background: 'transparent', cursor: 'pointer' }}>
          Back to Capture 🌙
        </button>

      <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ marginTop: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1.1', margin: '0 0 10px 0' }}>The<br/>Fuel.</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Synced from Cloud Storage.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {thoughts.length === 0 && <p style={{color: '#999'}}>No visions captured yet.</p>}
          
          {thoughts.map((thought) => (
            <div key={thought.id} style={{ 
                   backgroundColor: thought.ignited ? '#f0fdf4' : '#f9fafb', 
                   border: `1px solid ${thought.ignited ? '#bbf7d0' : '#f3f4f6'}`,
                   borderRadius: '16px',
                   overflow: 'hidden',
                   paddingBottom: '16px',
                   transition: 'all 0.2s'
                 }}>
              
              {thought.image_url && (
                <div style={{ width: '100%', height: '250px', overflow: 'hidden' }}>
                    <img src={thought.image_url} alt="Vision" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ padding: '0 20px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
                        {new Date(thought.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {thought.ignited && <CheckCircle size={20} color="#22c55e" />}
                        <button onClick={() => deleteThought(thought.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                
                <p style={{ 
                    fontSize: '18px', 
                    fontWeight: '500', 
                    margin: 0, 
                    color: thought.ignited ? '#9ca3af' : '#111827',
                    textDecoration: thought.ignited ? 'line-through' : 'none'
                }}>
                  "{thought.text}"
                </p>

                {!thought.ignited && (
                <button 
                  onClick={() => toggleIgnite(thought.id, thought.ignited)}
                  style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px',
                    <Play size={16} fill="currentColor" />
                  Replay Vibe & Ignite
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