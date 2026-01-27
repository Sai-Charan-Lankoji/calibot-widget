import React, { useEffect, useState } from 'react';
import '../globals.css';

interface WelcomePopoverProps {
  message: string;
  onClose: () => void;
  autoHideDuration?: number;
}

export const WelcomePopover: React.FC<WelcomePopoverProps> = ({
  message,
  onClose,
  autoHideDuration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show with slight delay for animation
    const showTimer = setTimeout(() => setIsVisible(true), 300);
    
    // Auto-hide after duration
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, autoHideDuration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [autoHideDuration, onClose]);

  return (
    <div
      className={`welcome-popover ${isVisible ? 'visible' : ''}`}
      style={{
        position: 'fixed',
        bottom: '90px',
        right: '20px',
        maxWidth: '280px',
        padding: '12px 16px',
        backgroundColor: 'var(--theme-primary)',
        color: 'var(--theme-primary-content)',
        borderRadius: 'var(--theme-button-radius, 12px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: '14px',
        lineHeight: '1.4',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        zIndex: 9998,
        cursor: 'pointer'
      }}
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'transparent',
          border: 'none',
          color: 'var(--theme-primary-content)',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0 4px',
          opacity: 0.9,
          fontWeight: 'bold',
          lineHeight: 1
        }}
        aria-label="Close"
      >
        ×
      </button>
      <div style={{ paddingRight: '20px' }}>{message}</div>
      {/* Pointer arrow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-8px',
          right: '32px',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid var(--theme-primary)'
        }}
      />
    </div>
  );
};

