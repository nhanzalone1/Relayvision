import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const slides = [
  {
    title: 'DEFINE',
    subtitle: 'Clarity is power. Set specific goals.'
  },
  {
    title: 'EXECUTE',
    subtitle: 'Action beats intention. Complete your list.'
  },
  {
    title: 'MOMENTUM',
    subtitle: 'Consistency compounds. Don\'t break the chain.'
  }
];

export default function SystemGuide({ onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);

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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 50000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '360px',
        width: '100%',
        background: '#0a0a0a',
        borderRadius: '24px',
        border: '1px solid #222',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
      }}>

        {/* Content Area */}
        <div style={{
          padding: '60px 40px',
          textAlign: 'center',
          minHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Slide Number */}
          <div style={{
            fontSize: '11px',
            color: '#666',
            letterSpacing: '3px',
            marginBottom: '30px'
          }}>
            {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </div>

          {/* Title */}
          <h1 style={{
            margin: 0,
            fontSize: '42px',
            fontWeight: '900',
            color: 'white',
            letterSpacing: '4px',
            marginBottom: '20px'
          }}>
            {slides[currentSlide].title}
          </h1>

          {/* Subtitle */}
          <p style={{
            margin: 0,
            fontSize: '15px',
            color: '#888',
            lineHeight: '1.6',
            maxWidth: '280px'
          }}>
            {slides[currentSlide].subtitle}
          </p>
        </div>

        {/* Progress Dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          paddingBottom: '30px'
        }}>
          {slides.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                width: index === currentSlide ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: index === currentSlide ? 'white' : '#333',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
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
              padding: '20px',
              background: 'transparent',
              border: 'none',
              borderRight: '1px solid #1a1a1a',
              color: currentSlide === 0 ? '#333' : '#666',
              cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Next / Close Button */}
          {isLastSlide ? (
            <button
              onClick={onClose}
              style={{
                flex: 3,
                padding: '20px',
                background: 'white',
                border: 'none',
                color: 'black',
                fontSize: '14px',
                fontWeight: '800',
                letterSpacing: '2px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                transition: 'background 0.2s'
              }}
            >
              GET TO WORK
            </button>
          ) : (
            <button
              onClick={nextSlide}
              style={{
                flex: 3,
                padding: '20px',
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                letterSpacing: '1px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'color 0.2s'
              }}
            >
              NEXT
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
