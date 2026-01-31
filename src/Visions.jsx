import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Target, Plus, X, Edit3, Trash2, Check, TrendingUp } from 'lucide-react';

export default function Visions({ session, mode = 'morning' }) {
  const [visions, setVisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVision, setEditingVision] = useState(null);
  const [updateModal, setUpdateModal] = useState(null); // For quick progress update

  // Form state
  const [formContent, setFormContent] = useState('');
  const [formMetricStart, setFormMetricStart] = useState('');
  const [formMetricCurrent, setFormMetricCurrent] = useState('');
  const [formMetricTarget, setFormMetricTarget] = useState('');
  const [formMetricUnit, setFormMetricUnit] = useState('');

  // Fetch visions on mount
  useEffect(() => {
    fetchVisions();
  }, [session]);

  const fetchVisions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('visions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) setVisions(data);
    if (error) console.error('Error fetching visions:', error);
    setLoading(false);
  };

  const resetForm = () => {
    setFormContent('');
    setFormMetricStart('');
    setFormMetricCurrent('');
    setFormMetricTarget('');
    setFormMetricUnit('');
  };

  const openAddModal = () => {
    resetForm();
    setEditingVision(null);
    setShowAddModal(true);
  };

  const openEditModal = (vision) => {
    setFormContent(vision.content || '');
    setFormMetricStart(vision.metric_start?.toString() || '');
    setFormMetricCurrent(vision.metric_current?.toString() || '');
    setFormMetricTarget(vision.metric_target?.toString() || '');
    setFormMetricUnit(vision.metric_unit || '');
    setEditingVision(vision);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formContent.trim()) return;

    const visionData = {
      content: formContent.trim(),
      metric_start: parseFloat(formMetricStart) || 0,
      metric_current: parseFloat(formMetricCurrent) || 0,
      metric_target: parseFloat(formMetricTarget) || 0,
      metric_unit: formMetricUnit.trim() || '',
    };

    if (editingVision) {
      // Update existing
      const { error } = await supabase
        .from('visions')
        .update(visionData)
        .eq('id', editingVision.id);

      if (!error) {
        setVisions(visions.map(v => v.id === editingVision.id ? { ...v, ...visionData } : v));
      }
    } else {
      // Create new
      const { data, error } = await supabase
        .from('visions')
        .insert([{ ...visionData, user_id: session.user.id }])
        .select();

      if (data && data[0]) {
        setVisions([data[0], ...visions]);
      }
    }

    setShowAddModal(false);
    resetForm();
    setEditingVision(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vision?')) return;

    const { error } = await supabase
      .from('visions')
      .delete()
      .eq('id', id);

    if (!error) {
      setVisions(visions.filter(v => v.id !== id));
    }
  };

  const handleQuickUpdate = async () => {
    if (!updateModal) return;

    const newCurrent = parseFloat(updateModal.newValue) || 0;
    const { error } = await supabase
      .from('visions')
      .update({ metric_current: newCurrent })
      .eq('id', updateModal.vision.id);

    if (!error) {
      setVisions(visions.map(v =>
        v.id === updateModal.vision.id ? { ...v, metric_current: newCurrent } : v
      ));
    }
    setUpdateModal(null);
  };

  // Calculate progress percentage
  const calcProgress = (start, current, target) => {
    if (target <= start) return 0;
    const progress = ((current - start) / (target - start)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  // Check if unit is a prefix (like $, €, £)
  const isPrefixUnit = (unit) => ['$', '€', '£', '¥'].includes(unit);

  // Format a single metric value with unit
  const formatSingleMetric = (value, unit) => {
    const num = parseFloat(value) || 0;
    if (isPrefixUnit(unit)) return `${unit}${num.toLocaleString()}`;
    if (unit === '%') return `${num}%`;
    return num.toLocaleString();
  };

  // Format the full progress display (current → target)
  const formatProgressDisplay = (current, target, unit) => {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 0;

    if (isPrefixUnit(unit)) {
      // Prefix format: "$2,500 / $10,000"
      return {
        current: `${unit}${currentNum.toLocaleString()}`,
        separator: ' / ',
        target: `${unit}${targetNum.toLocaleString()}`
      };
    } else if (unit === '%') {
      // Percentage format: "25% → 100%"
      return {
        current: `${currentNum}%`,
        separator: ' → ',
        target: `${targetNum}%`
      };
    } else {
      // Suffix format: "182 → 175 lbs"
      return {
        current: currentNum.toLocaleString(),
        separator: ' → ',
        target: `${targetNum.toLocaleString()} ${unit}`.trim()
      };
    }
  };

  const isDark = mode === 'night';

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '800',
          color: isDark ? 'white' : '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <TrendingUp size={20} color="#06b6d4" />
          Tracked Visions
        </h2>
        <button
          onClick={openAddModal}
          style={{
            background: '#06b6d4',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 16px',
            color: 'white',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} /> Add Vision
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading visions...
        </div>
      )}

      {/* Empty State */}
      {!loading && visions.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: isDark ? 'rgba(255,255,255,0.03)' : 'white',
          borderRadius: '20px',
          border: isDark ? '1px solid #333' : '1px solid #e2e8f0'
        }}>
          <Target size={48} color="#64748b" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ color: '#64748b', margin: 0 }}>No visions yet. Add your first tracked goal.</p>
        </div>
      )}

      {/* Vision Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {visions.map(vision => {
          const hasMetrics = vision.metric_target > 0;
          const progress = hasMetrics ? calcProgress(vision.metric_start, vision.metric_current, vision.metric_target) : 0;
          const isComplete = progress >= 100;

          return (
            <div
              key={vision.id}
              style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'white',
                borderRadius: '20px',
                padding: '20px',
                border: isDark ? '1px solid #333' : '1px solid #e2e8f0',
                boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}
            >
              {/* Vision Content */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: hasMetrics ? '16px' : '0'
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  color: isDark ? 'white' : '#1e293b',
                  flex: 1,
                  lineHeight: '1.5'
                }}>
                  {vision.content}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                  <button
                    onClick={() => openEditModal(vision)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: '4px'
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(vision.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      padding: '4px'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Progress Section (only if metric_target > 0) */}
              {hasMetrics && (
                <div>
                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '12px',
                    background: isDark ? '#1e293b' : '#e2e8f0',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: isComplete
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : 'linear-gradient(90deg, #06b6d4, #22d3ee)',
                      borderRadius: '6px',
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>

                  {/* Metrics Display */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    {(() => {
                      const display = formatProgressDisplay(vision.metric_current, vision.metric_target, vision.metric_unit);
                      return (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{
                            fontSize: '20px',
                            fontWeight: '800',
                            color: isComplete ? '#10b981' : '#06b6d4'
                          }}>
                            {display.current}
                          </span>
                          <span style={{ fontSize: '14px', color: '#64748b' }}>
                            {display.separator}{display.target}
                          </span>
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: isComplete ? '#10b981' : '#06b6d4'
                      }}>
                        {Math.round(progress)}%
                      </span>

                      {/* Quick Update Button */}
                      <button
                        onClick={() => setUpdateModal({
                          vision,
                          newValue: vision.metric_current.toString()
                        })}
                        style={{
                          background: isDark ? '#1e293b' : '#f1f5f9',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          color: isDark ? '#94a3b8' : '#64748b',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <TrendingUp size={12} /> Update
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.9)',
          zIndex: 50000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: '#0f0f12',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid #1e293b',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '16px', color: 'white', fontWeight: '700' }}>
                {editingVision ? 'Edit Vision' : 'Add Vision'}
              </span>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); setEditingVision(null); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Vision Content */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', letterSpacing: '1px', marginBottom: '8px' }}>
                  VISION / GOAL
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="e.g., Save $10,000 for emergency fund"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    background: '#1a1a1f',
                    color: 'white',
                    fontSize: '15px',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Metrics Section */}
              <div style={{
                background: '#1a1a1f',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid #333'
              }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#06b6d4', letterSpacing: '1px', marginBottom: '12px' }}>
                  PROGRESS TRACKING (OPTIONAL)
                </label>

                {/* Unit */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
                    Unit (e.g., $, lbs, %, hours)
                  </label>
                  <input
                    type="text"
                    value={formMetricUnit}
                    onChange={(e) => setFormMetricUnit(e.target.value)}
                    placeholder="$"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #333',
                      background: '#0f0f12',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Start / Current / Target */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
                      Start
                    </label>
                    <input
                      type="number"
                      value={formMetricStart}
                      onChange={(e) => setFormMetricStart(e.target.value)}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        background: '#0f0f12',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
                      Current
                    </label>
                    <input
                      type="number"
                      value={formMetricCurrent}
                      onChange={(e) => setFormMetricCurrent(e.target.value)}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        background: '#0f0f12',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
                      Target
                    </label>
                    <input
                      type="number"
                      value={formMetricTarget}
                      onChange={(e) => setFormMetricTarget(e.target.value)}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        background: '#0f0f12',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '20px', borderTop: '1px solid #1e293b', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); setEditingVision(null); }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #333',
                  background: 'transparent',
                  color: '#64748b',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formContent.trim()}
                style={{
                  flex: 2,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: formContent.trim() ? '#06b6d4' : '#333',
                  color: formContent.trim() ? 'white' : '#666',
                  fontWeight: '700',
                  cursor: formContent.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Check size={16} /> {editingVision ? 'Save Changes' : 'Add Vision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Update Modal */}
      {updateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.9)',
          zIndex: 50000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: '#0f0f12',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '320px',
            padding: '24px',
            border: '1px solid #1e293b',
            textAlign: 'center'
          }}>
            <TrendingUp size={40} color="#06b6d4" style={{ marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '18px' }}>Update Progress</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '13px' }}>
              {updateModal.vision.content}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                CURRENT VALUE ({updateModal.vision.metric_unit || 'units'})
              </label>
              <input
                type="number"
                value={updateModal.newValue}
                onChange={(e) => setUpdateModal({ ...updateModal, newValue: e.target.value })}
                autoFocus
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #333',
                  background: '#1a1a1f',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '700',
                  textAlign: 'center',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setUpdateModal(null)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #333',
                  background: 'transparent',
                  color: '#64748b',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleQuickUpdate}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#06b6d4',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
