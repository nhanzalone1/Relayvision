import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Target, Plus, X, Lock, Unlock, GripVertical, ChevronRight, Trash2, Save, AlertCircle, Image as ImageIcon, Settings, Rocket, HelpCircle } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const goalColors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b'];

// --- SORTABLE MISSION ITEM ---
function SortableMissionItem({ mission, zoneColor, onEdit }) {
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
        {/* Drag Handle */}
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
}

// --- SORTABLE ZONE TILE ---
function SortableZoneTile({ goal, stats, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const handleTileClick = (e) => {
    // Don't open modal if clicking the drag handle (Target icon)
    if (e.target.closest('[data-zone-drag-handle]')) return;
    onOpen(goal);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        onClick={handleTileClick}
        style={{
          background: stats.lit ? goal.color : '#1a1a1a',
          border: isDragging ? '2px solid #c084fc' : stats.lit ? `2px solid ${goal.color}` : `1px solid ${goal.color}44`,
          borderRadius: '24px',
          padding: '20px',
          minHeight: '140px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: isDragging ? '0 10px 40px rgba(0,0,0,0.6)' : stats.lit ? `0 0 20px ${goal.color}66` : 'none',
          transition: 'all 0.2s'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Target Icon as Drag Handle */}
          <div
            {...listeners}
            data-zone-drag-handle="true"
            style={{
              cursor: 'grab',
              touchAction: 'none',
              padding: '4px',
              marginLeft: '-4px',
              marginTop: '-4px',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Target size={24} color={stats.lit ? 'white' : goal.color} />
          </div>
          {goal.is_private && <Lock size={14} color={stats.lit ? 'white' : '#666'} />}
        </div>
        <div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: stats.lit ? 'white' : goal.color }}>{goal.title.toUpperCase()}</h3>
          <span style={{ fontSize: '11px', color: stats.lit ? 'rgba(255,255,255,0.8)' : '#666', fontWeight: 'bold' }}>
            {stats.count} MISSIONS
          </span>
        </div>
      </div>
    </div>
  );
}

export default function NightMode({
  session,
  myGoals,
  myMissions,
  setMyMissions,
  setMyGoals,
  historyData,
  debugLog,
  missionInput,
  setMissionInput,
  currentInput,
  setCurrentInput,
  isPrivateMission,
  setIsPrivateMission,
  isPrivateVision,
  setIsPrivateVision,
  previewUrl,
  uploading,
  fileInputRef,
  handleCapture,
  handleFileSelect,
  clearMedia,
  fetchAllData,
  onOpenSystemGuide,
  onExecuteProtocol,
  activeMissions: activeMissionsProp
}) {
  // --- LOCAL STATE ---
  const [activeZone, setActiveZone] = useState(null);
  const [modalTab, setModalTab] = useState('mission');
  const [showGoalCreator, setShowGoalCreator] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [newGoalColor, setNewGoalColor] = useState(goalColors[0]);
  const [isPrivateGoal, setIsPrivateGoal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);

  // --- MISSION EDIT STATE ---
  const [editingMission, setEditingMission] = useState(null);
  const [editMissionText, setEditMissionText] = useState('');
  const [editMissionColor, setEditMissionColor] = useState('#475569');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- ZONE EDIT STATE ---
  const [isEditingZone, setIsEditingZone] = useState(false);
  const [editZoneTitle, setEditZoneTitle] = useState('');
  const [editZoneColor, setEditZoneColor] = useState('');
  const [showZoneDeleteConfirm, setShowZoneDeleteConfirm] = useState(false);

  // --- AUTO-TRIGGER NIGHT MODE ONBOARDING ---
  useEffect(() => {
    const hasSeen = localStorage.getItem('relay_has_seen_night_onboarding');
    if (!hasSeen) {
      console.log('[ONBOARDING] Triggering Night Mode SystemGuide');
      onOpenSystemGuide('night', true); // true = isFirstRun
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- DND SENSORS ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // --- COMPUTED ---
  const activeMissions = activeMissionsProp || myMissions.filter(m => !m.completed && !m.crushed);

  const getZoneStats = (goalId) => {
    const missionCount = myMissions.filter(m => m.goal_id === goalId && !m.completed && !m.crushed).length;
    return { count: missionCount, lit: missionCount > 0 };
  };

  const getUniqueRecentsForZone = (goalId) => {
    const zoneHistory = historyData.filter(m => m.goal_id === goalId);
    const unique = [...new Map(zoneHistory.map(item => [item['task'], item])).values()];
    return unique.slice(0, 5);
  };

  // --- MISSION HANDLERS ---
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

  const deleteMission = async (id) => {
    const { error } = await supabase.from('missions').delete().eq('id', id);
    if (!error) setMyMissions(myMissions.filter(m => m.id !== id));
  };

  // --- MISSION REORDER ---
  const handleMissionReorder = async (activeId, overId, zoneId) => {
    const zoneMissions = myMissions.filter(m => m.goal_id === zoneId && !m.completed && !m.crushed);
    const oldIndex = zoneMissions.findIndex(m => m.id === activeId);
    const newIndex = zoneMissions.findIndex(m => m.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(zoneMissions, oldIndex, newIndex);
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

  // --- GOAL HANDLERS ---
  const createGoal = async () => {
    if (!newGoalInput.trim()) return;
    const maxPosition = myGoals.length > 0 ? Math.max(...myGoals.map(g => g.position || 0)) + 1 : 0;
    const { data, error } = await supabase.from('goals').insert([{
      title: newGoalInput,
      color: newGoalColor,
      user_id: session.user.id,
      is_private: isPrivateGoal,
      position: maxPosition
    }]).select();

    if (!error && data) {
      setMyGoals([...myGoals, data[0]]);
      setNewGoalInput('');
      setIsPrivateGoal(false);
      setShowGoalCreator(false);
      setSelectedGoalId(data[0].id);
    }
  };

  // --- ZONE REORDER ---
  const handleZoneReorder = async (activeId, overId) => {
    const sortedGoals = [...myGoals].sort((a, b) => (a.position || 0) - (b.position || 0));
    const oldIndex = sortedGoals.findIndex(g => g.id === activeId);
    const newIndex = sortedGoals.findIndex(g => g.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedGoals, oldIndex, newIndex);
    const updates = reordered.map((g, idx) => ({ ...g, position: idx }));

    // Optimistic update
    setMyGoals(updates);

    // Persist to database
    for (const goal of updates) {
      await supabase.from('goals').update({ position: goal.position }).eq('id', goal.id);
    }
  };

  // --- ZONE EDIT HANDLERS ---
  const openZoneEdit = () => {
    if (!activeZone || activeZone.id === null) return;
    setEditZoneTitle(activeZone.title);
    setEditZoneColor(activeZone.color);
    setIsEditingZone(true);
    setShowZoneDeleteConfirm(false);
  };

  const saveZoneEdit = async () => {
    if (!activeZone || !editZoneTitle.trim()) return;

    const { error } = await supabase.from('goals')
      .update({ title: editZoneTitle, color: editZoneColor })
      .eq('id', activeZone.id);

    if (!error) {
      setMyGoals(myGoals.map(g =>
        g.id === activeZone.id ? { ...g, title: editZoneTitle, color: editZoneColor } : g
      ));
      setActiveZone({ ...activeZone, title: editZoneTitle, color: editZoneColor });
      setIsEditingZone(false);
    }
  };

  const deleteZone = async () => {
    if (!activeZone || activeZone.id === null) {
      console.error('Cannot delete zone: no valid zone selected');
      return;
    }

    const zoneId = activeZone.id;

    // First update missions to remove the goal_id reference
    await supabase.from('missions').update({ goal_id: null }).eq('goal_id', zoneId);

    // Delete the goal
    const { error } = await supabase.from('goals').delete().eq('id', zoneId);

    if (error) {
      console.error('Failed to delete zone:', error);
      setDebugLog(`Error deleting zone: ${error.message}`);
      return;
    }

    // Update local state
    setMyGoals(myGoals.filter(g => g.id !== zoneId));
    setMyMissions(myMissions.map(m => m.goal_id === zoneId ? { ...m, goal_id: null } : m));
    setActiveZone(null);
    setIsEditingZone(false);
    setShowZoneDeleteConfirm(false);
  };

  // Sort goals by position for display
  const sortedGoals = [...myGoals].sort((a, b) => (a.position || 0) - (b.position || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', paddingBottom: '40px' }}>
      {debugLog && (
        <div style={{
          background: debugLog.includes('Error') ? '#7f1d1d' : '#064e3b',
          color: debugLog.includes('Error') ? '#fecaca' : '#a7f3d0',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          textAlign: 'center',
          border: `1px solid ${debugLog.includes('Error') ? '#ef4444' : '#10b981'}`
        }}>
          {debugLog}
        </div>
      )}

      {/* THE HUB GRID */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (over && active.id !== over.id) {
            handleZoneReorder(active.id, over.id);
          }
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {/* GENERAL TILE - Fixed, not draggable */}
          <div
            onClick={() => { setSelectedGoalId(null); setActiveZone({ id: null, title: 'General', color: '#666' }); setModalTab('mission'); setIsEditingZone(false); }}
            style={{
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
            }}
          >
            <Target size={24} color={getZoneStats(null).lit ? 'white' : '#666'} />
            <div>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: 'white' }}>GENERAL</h3>
              <span style={{ fontSize: '11px', color: getZoneStats(null).lit ? '#a855f7' : '#666', fontWeight: 'bold' }}>
                {getZoneStats(null).count} MISSIONS
              </span>
            </div>
          </div>

          {/* USER ZONES - Sortable */}
          <SortableContext
            items={sortedGoals.map(g => g.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedGoals.map(g => (
              <SortableZoneTile
                key={g.id}
                goal={g}
                stats={getZoneStats(g.id)}
                onOpen={(goal) => { setSelectedGoalId(goal.id); setActiveZone(goal); setModalTab('mission'); setIsEditingZone(false); }}
              />
            ))}
          </SortableContext>

          {/* CREATE ZONE TILE */}
          <div
            onClick={() => setShowGoalCreator(true)}
            style={{
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
            }}
          >
            <Plus size={32} />
            <span style={{ marginTop: '10px', fontSize: '12px', fontWeight: 'bold' }}>CREATE ZONE</span>
          </div>
        </div>
      </DndContext>

      {/* GOAL CREATOR MODAL */}
      {showGoalCreator && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#111', padding: '28px 40px', borderRadius: '24px', border: '1px solid #333', width: '94%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>NEW ZONE</h4>
              <button onClick={() => setShowGoalCreator(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <input
              type="text"
              value={newGoalInput}
              onChange={(e) => setNewGoalInput(e.target.value)}
              placeholder="Zone Name"
              style={{ width: '100%', background: '#222', border: '1px solid #444', color: 'white', padding: '12px', borderRadius: '12px', outline: 'none', marginBottom: '15px' }}
            />

            {/* IIN Circle of Life Presets */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', letterSpacing: '1px', marginBottom: '10px' }}>OR CHOOSE A LIFE AREA:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { name: 'Creativity', color: '#9C27B0' },
                  { name: 'Finances', color: '#2E7D32' },
                  { name: 'Career', color: '#1565C0' },
                  { name: 'Education', color: '#3F51B5' },
                  { name: 'Health', color: '#D32F2F' },
                  { name: 'Physical Activity', color: '#EF6C00' },
                  { name: 'Home Cooking', color: '#F9A825' },
                  { name: 'Home Environment', color: '#00695C' },
                  { name: 'Relationships', color: '#AD1457' },
                  { name: 'Social Life', color: '#00838F' },
                  { name: 'Joy', color: '#FBC02D' },
                  { name: 'Spirituality', color: '#6A1B9A' }
                ].map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setNewGoalInput(preset.name);
                      setNewGoalColor(preset.color);
                    }}
                    style={{
                      width: '100%',
                      minHeight: '46px',
                      padding: '10px 6px',
                      borderRadius: '10px',
                      border: newGoalInput === preset.name && newGoalColor === preset.color ? '2px solid white' : '1px solid transparent',
                      background: `${preset.color}30`,
                      color: preset.color,
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                      wordBreak: 'normal',
                      lineHeight: '1.2',
                      letterSpacing: '0.2px'
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {goalColors.slice(0, 5).map(c => (
                  <button key={c} onClick={() => setNewGoalColor(c)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: newGoalColor === c ? '2px solid white' : 'none', cursor: 'pointer' }} />
                ))}
              </div>
              <button onClick={() => setIsPrivateGoal(!isPrivateGoal)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid #444', color: isPrivateGoal ? '#ef4444' : '#64748b', padding: '6px 10px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px' }}>
                {isPrivateGoal ? <Lock size={12} /> : <Unlock size={12} />}
              </button>
            </div>
            <button onClick={createGoal} style={{ width: '100%', background: 'white', color: 'black', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Create Zone</button>
          </div>
        </div>
      )}

      {/* ZONE DETAIL MODAL */}
      {activeZone && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', borderRadius: '24px', width: '92%', maxWidth: '400px', border: `1px solid ${activeZone.color}66`, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh', boxShadow: `0 0 40px ${activeZone.color}33` }}>
            {/* MODAL HEADER */}
            <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Target size={20} color={activeZone.color} /> {activeZone.title.toUpperCase()}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Settings icon - only for user-created zones, not General */}
                {activeZone.id !== null && (
                  <button
                    onClick={openZoneEdit}
                    style={{
                      background: isEditingZone ? 'rgba(255,255,255,0.1)' : 'none',
                      border: 'none',
                      color: isEditingZone ? 'white' : '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Settings size={18} />
                  </button>
                )}
                <button onClick={() => { setActiveZone(null); setIsEditingZone(false); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
            </div>

            {/* TOGGLE SWITCH - hidden when editing zone */}
            {!isEditingZone && (
              <div style={{ padding: '15px 20px' }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '4px' }}>
                  <button onClick={() => setModalTab('mission')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: modalTab === 'mission' ? activeZone.color : 'transparent', color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>MISSION</button>
                  <button onClick={() => setModalTab('vision')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: modalTab === 'vision' ? activeZone.color : 'transparent', color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>VISION</button>
                </div>
              </div>
            )}

            {/* ZONE EDIT MODE */}
            {isEditingZone && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {!showZoneDeleteConfirm ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Zone Name Input */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#64748b', letterSpacing: '1px', marginBottom: '8px' }}>ZONE NAME</label>
                      <input
                        type="text"
                        value={editZoneTitle}
                        onChange={(e) => setEditZoneTitle(e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: '16px', outline: 'none' }}
                      />
                    </div>

                    {/* Color Picker */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#64748b', letterSpacing: '1px', marginBottom: '12px' }}>ZONE COLOR</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                        {goalColors.map(c => (
                          <button
                            key={c}
                            onClick={() => setEditZoneColor(c)}
                            style={{
                              width: '100%',
                              aspectRatio: '1',
                              borderRadius: '12px',
                              background: c,
                              border: editZoneColor === c ? '3px solid white' : '2px solid transparent',
                              cursor: 'pointer',
                              boxShadow: editZoneColor === c ? `0 0 15px ${c}` : 'none',
                              transition: 'all 0.2s'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button
                        onClick={() => setShowZoneDeleteConfirm(true)}
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
                          gap: '6px'
                        }}
                      >
                        <Trash2 size={14} /> DELETE
                      </button>
                      <button
                        onClick={() => setIsEditingZone(false)}
                        style={{
                          flex: 1,
                          padding: '14px',
                          borderRadius: '12px',
                          border: '1px solid #334155',
                          background: 'transparent',
                          color: '#94a3b8',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={saveZoneEdit}
                        style={{
                          flex: 1,
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
                        <Save size={14} /> SAVE
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Delete Confirmation */
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                      <AlertCircle size={30} color="#ef4444" />
                    </div>
                    <h3 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '18px' }}>DELETE ZONE?</h3>
                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px' }}>
                      This will permanently delete "{activeZone.title}".
                    </p>
                    <p style={{ margin: '0 0 24px 0', color: '#f59e0b', fontSize: '13px' }}>
                      Missions in this zone will be moved to General.
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setShowZoneDeleteConfirm(false)}
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={deleteZone}
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        DELETE ZONE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONTENT AREA - hidden when editing zone */}
            {!isEditingZone && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {modalTab === 'mission' && (
                <>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={missionInput}
                      onChange={(e) => setMissionInput(e.target.value)}
                      placeholder="Type task & hit Enter..."
                      onKeyDown={(e) => { if (e.key === 'Enter') { addMission(); } }}
                      autoFocus
                      style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#000', border: '1px solid #333', color: 'white', outline: 'none', fontSize: '16px' }}
                    />
                    <button onClick={() => addMission()} style={{ background: '#333', border: 'none', borderRadius: '16px', width: '50px', color: 'white', cursor: 'pointer' }}><Plus size={24} /></button>
                  </div>

                  {/* QUICK ADD CHIPS */}
                  {getUniqueRecentsForZone(activeZone.id).length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                      {getUniqueRecentsForZone(activeZone.id).map(m => (
                        <button key={'quick-' + m.id} onClick={() => addMission(m.task, activeZone.id)} style={{ padding: '8px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#aaa', fontSize: '12px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                          + {m.task}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* DRAGGABLE MISSION LIST */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        handleMissionReorder(active.id, over.id, activeZone.id);
                      }
                    }}
                  >
                    <SortableContext
                      items={activeMissions.filter(m => m.goal_id === activeZone.id).sort((a, b) => (a.position || 0) - (b.position || 0)).map(m => m.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activeMissions.filter(m => m.goal_id === activeZone.id).sort((a, b) => (a.position || 0) - (b.position || 0)).map(m => (
                          <SortableMissionItem key={m.id} mission={m} zoneColor={activeZone.color} onEdit={openMissionEdit} />
                        ))}
                        {activeMissions.filter(m => m.goal_id === activeZone.id).length === 0 && (
                          <div style={{ textAlign: 'center', color: '#666', padding: '30px', border: '1px dashed #333', borderRadius: '16px', fontSize: '14px' }}>List is empty for tomorrow.</div>
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                </>
              )}

              {modalTab === 'vision' && (
                <>
                  {/* Hidden File Input for Media Upload */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileSelect(e, e.target.files[0]?.type?.startsWith('video') ? 'video' : 'image')}
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                  />

                  <textarea
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder={`What is the ultimate goal for ${activeZone.title}?`}
                    style={{ width: '100%', height: '120px', background: '#000', border: '1px solid #333', borderRadius: '16px', color: 'white', padding: '16px', fontSize: '16px', resize: 'none', outline: 'none' }}
                    disabled={uploading}
                  />

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{
                        flex: 1,
                        padding: '14px',
                        background: '#222',
                        border: '1px solid #333',
                        borderRadius: '12px',
                        color: '#ddd',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        opacity: uploading ? 0.5 : 1
                      }}
                    >
                      <ImageIcon size={16} /> PHOTO / VIDEO
                    </button>
                    <button onClick={() => setIsPrivateVision(!isPrivateVision)} style={{ flex: 1, padding: '14px', background: '#222', border: isPrivateVision ? '1px solid #ef4444' : '1px solid #333', borderRadius: '12px', color: isPrivateVision ? '#ef4444' : '#666', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>{isPrivateVision ? <Lock size={16} /> : <Unlock size={16} />} {isPrivateVision ? 'PRIVATE' : 'SHARED'}</button>
                  </div>

                  {/* Media Preview */}
                  {previewUrl && (
                    <div style={{ width: '100%', height: '200px', background: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '2px solid ' + activeZone.color }}>
                      {previewUrl.includes('video') || previewUrl.includes('mp4') || previewUrl.includes('mov') || previewUrl.includes('webm') ? (
                        <video src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                      ) : (
                        <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <button onClick={clearMedia} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                    </div>
                  )}

                  <button
                    onClick={() => handleCapture(activeZone.id)}
                    disabled={uploading || (!currentInput.trim() && !previewUrl)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: uploading ? '#666' : activeZone.color,
                      color: 'white',
                      border: 'none',
                      borderRadius: '16px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: (uploading || (!currentInput.trim() && !previewUrl)) ? 'not-allowed' : 'pointer',
                      marginTop: '10px',
                      opacity: (!currentInput.trim() && !previewUrl) ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {uploading ? 'UPLOADING...' : 'CAPTURE VISION'}
                  </button>
                </>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {/* MISSION EDIT MODAL */}
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

      {/* EXECUTE PROTOCOL BUTTON */}
      {activeMissions.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={onExecuteProtocol}
            style={{
              width: '100%',
              padding: '20px',
              borderRadius: '20px',
              border: 'none',
              background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)',
              color: 'white',
              fontWeight: '900',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.02)'; e.target.style.boxShadow = '0 6px 30px rgba(168, 85, 247, 0.6)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.4)'; }}
          >
            <Rocket size={22} /> INITIATE PROTOCOL
          </button>
        </div>
      )}

    </div>
  );
}
