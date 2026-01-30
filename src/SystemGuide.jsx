import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Folder, Image, ListTodo, Rocket, CheckSquare, Eye, Users, Flame, Trophy, X } from 'lucide-react';

// Night Mode Slides (Planning Phase)
const nightSlides = [
  {
    icon: Folder,
    emoji: '1️⃣',
    title: 'CREATE YOUR ZONES',
    subtitle: 'Zones are the big areas of your life you want to win in.',
    steps: [
      'Tap the + button to create a Zone',
      'Name it something meaningful (Fitness, Career, etc.)',
      'Pick a color to represent it'
    ],
    example: 'Example: "Health" zone for all gym & nutrition goals',
    color: '#c084fc'
  },
  {
    icon: Image,
    emoji: '2️⃣',
    title: 'SET YOUR VISION',
    subtitle: 'Your Vision is the big picture goal for each Zone.',
    steps: [
      'Tap on a Zone tile',
      'Switch to the VISION tab',
      'Upload a photo or write your ultimate goal'
    ],
    example: 'Example: Photo of your goal physique or "Run a marathon"',
    color: '#a855f7'
  },
  {
    icon: ListTodo,
    emoji: '3️⃣',
    title: 'ADD TOMORROW\'S MISSIONS',
    subtitle: 'Missions are the specific tasks you\'ll do tomorrow.',
    steps: [
      'Tap on a Zone tile',
      'Stay on the MISSION tab',
      'Add 1-3 tasks you WILL complete tomorrow'
    ],
    example: 'Example: "30 min cardio" or "Meal prep lunch"',
    color: '#8b5cf6'
  },
  {
    icon: Rocket,
    emoji: '4️⃣',
    title: 'INITIATE PROTOCOL',
    subtitle: 'Lock in your plan. No changes after this.',
    steps: [
      'Review your missions at the bottom',
      'Tap the purple INITIATE PROTOCOL button',
      'Your plan is now sealed for tomorrow'
    ],
    example: 'Tip: Do this the night before so you wake up ready',
    color: '#7c3aed'
  }
];

// Morning Mode Slides (Execution Phase)
const morningSlides = [
  {
    icon: CheckSquare,
    emoji: '1️⃣',
    title: 'CHECK OFF MISSIONS',
    subtitle: 'Your missions are displayed as cards. Execute them.',
    steps: [
      'See your mission cards on the dashboard',
      'Tap the checkmark when you complete one',
      'Watch it move to "Completed"'
    ],
    example: 'Goal: Turn all your cards green by end of day',
    color: '#10b981'
  },
  {
    icon: Flame,
    emoji: '2️⃣',
    title: 'CRUSH YOUR WINS',
    subtitle: 'Did you go above and beyond? Mark it as CRUSHED.',
    steps: [
      'Complete a mission, then tap the fire icon',
      'Add a victory note (optional)',
      'Crushed missions glow gold on your calendar'
    ],
    example: 'Example: Planned 30 min run, did 45 min = CRUSHED',
    color: '#f59e0b'
  },
  {
    icon: Eye,
    emoji: '3️⃣',
    title: 'CHECK YOUR VISION',
    subtitle: 'Need motivation? Look at why you\'re doing this.',
    steps: [
      'Tap the VISION tab at the top',
      'See your goal photos and notes',
      'Remember the bigger picture'
    ],
    example: 'Tip: Check this when you want to skip a mission',
    color: '#3b82f6'
  },
  {
    icon: Trophy,
    emoji: '4️⃣',
    title: 'BUILD YOUR STREAK',
    subtitle: 'Consistency wins. Every completed day counts.',
    steps: [
      'Tap the flame counter to see your calendar',
      'Green = completed all missions',
      'Gold = completed + crushed at least one'
    ],
    example: 'Red = missed day. Keep the chain going!',
    color: '#fbbf24'
  }
];

export default function SystemGuide({ onClose, mode = 'night', isFirstRun = false }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = mode === 'night' ? nightSlides : morningSlides;
  const CurrentIcon = slides[currentSlide].icon;
  const accentColor = slides[currentSlide].color;
  const slide = slides[currentSlide];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const isLastSlide = currentSlide === slides.length - 1;
  const isNight = mode === 'night';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 50000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '380px',
        width: '100%',
        background: 'linear-gradient(145deg, rgba(20, 20, 25, 0.98) 0%, rgba(10, 10, 12, 1) 100%)',
        borderRadius: '28px',
        border: `1px solid ${accentColor}40`,
        overflow: 'hidden',
        boxShadow: `0 25px 60px -12px rgba(0, 0, 0, 0.9), 0 0 50px ${accentColor}20`
      }}>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{
          padding: '25px 25px 15px 25px',
          borderBottom: '1px solid #222',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: isFirstRun ? '12px' : '10px',
            color: accentColor,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            {isFirstRun ? '🚀 WELCOME TO RELAY VISION' : (isNight ? '🌙 NIGHT MODE' : '☀️ MORNING MODE')}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            letterSpacing: '1px'
          }}>
            {isFirstRun ? 'HOW IT WORKS' : (isNight ? 'PLANNING PHASE' : 'EXECUTION PHASE')}
          </div>
        </div>

        {/* Breadcrumb Trail */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          padding: '15px 20px',
          background: 'rgba(0,0,0,0.3)'
        }}>
          {slides.map((s, index) => (
            <div
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '12px',
                background: index === currentSlide ? `${accentColor}30` : 'transparent',
                border: index === currentSlide ? `1px solid ${accentColor}50` : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '12px' }}>{s.emoji}</span>
              {index === currentSlide && (
                <span style={{ fontSize: '10px', color: accentColor, fontWeight: '600' }}>
                  STEP {index + 1}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div style={{
          padding: '30px 25px',
          textAlign: 'center'
        }}>
          {/* Icon */}
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${accentColor}25 0%, ${accentColor}10 100%)`,
            border: `2px solid ${accentColor}50`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            boxShadow: `0 0 30px ${accentColor}25`
          }}>
            <CurrentIcon size={32} color={accentColor} style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }} />
          </div>

          {/* Title */}
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '800',
            color: 'white',
            letterSpacing: '1px',
            marginBottom: '10px'
          }}>
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: '#94a3b8',
            lineHeight: '1.5'
          }}>
            {slide.subtitle}
          </p>

          {/* Steps */}
          <div style={{
            textAlign: 'left',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            {slide.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: i < slide.steps.length - 1 ? '12px' : 0
              }}>
                <div style={{
                  minWidth: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: `${accentColor}30`,
                  color: accentColor,
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {i + 1}
                </div>
                <span style={{
                  fontSize: '13px',
                  color: '#e2e8f0',
                  lineHeight: '1.4'
                }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* Example */}
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            fontStyle: 'italic',
            padding: '10px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '10px',
            borderLeft: `3px solid ${accentColor}50`
          }}>
            {slide.example}
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          borderTop: '1px solid #1a1a1a'
        }}>
          {/* Previous Button */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            style={{
              flex: 1,
              padding: '18px',
              background: 'transparent',
              border: 'none',
              borderRight: '1px solid #1a1a1a',
              color: currentSlide === 0 ? '#333' : '#888',
              cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            <ChevronLeft size={16} /> BACK
          </button>

          {/* Next / Close Button */}
          {isLastSlide ? (
            <button
              onClick={onClose}
              style={{
                flex: 2,
                padding: '18px',
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
                border: 'none',
                color: 'white',
                fontSize: '13px',
                fontWeight: '800',
                letterSpacing: '1px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                boxShadow: `0 4px 20px ${accentColor}40`
              }}
            >
              {isFirstRun ? 'GET STARTED' : (isNight ? 'GOT IT!' : 'LET\'S GO!')}
            </button>
          ) : (
            <button
              onClick={nextSlide}
              style={{
                flex: 2,
                padding: '18px',
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '1px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              NEXT <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
