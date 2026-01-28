import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { LAYOUT, TIMING, type WidgetPosition } from '../constants';
import { isLeftPosition } from '../utils/position';
import '../globals.css';

interface WelcomePopoverProps {
  message: string;
  onClose: () => void;
  autoHideDuration?: number;
  position?: WidgetPosition;
}

// Popover offset - positioned above the toggle button
const POPOVER_BOTTOM_OFFSET = LAYOUT.TOGGLE_BUTTON.SIZE + LAYOUT.SPACING.POPOVER_GAP;

export const WelcomePopover: React.FC<WelcomePopoverProps> = ({
  message,
  onClose,
  autoHideDuration = TIMING.AUTO_HIDE.POPOVER,
  position = 'bottom-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const isLeft = isLeftPosition(position);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, TIMING.ANIMATION.NORMAL);
  }, [onClose]);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), TIMING.DELAY.POPOVER_SHOW);
    const hideTimer = setTimeout(handleClose, autoHideDuration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [autoHideDuration, handleClose]);

  // Memoize position styles
  const positionStyles = useMemo(() => ({
    ...(isLeft ? { left: 0 } : { right: 0 }),
    bottom: POPOVER_BOTTOM_OFFSET,
  }), [isLeft]);

  // Memoize arrow styles
  const arrowStyles = useMemo(() => ({
    position: 'absolute' as const,
    bottom: -8,
    ...(isLeft ? { left: 24 } : { right: 24 }),
    width: 0,
    height: 0,
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderTop: '8px solid var(--theme-primary)'
  }), [isLeft]);

  return (
    <div
      className={`welcome-popover ${isVisible ? 'visible' : ''}`}
      style={{
        position: 'absolute',
        ...positionStyles,
        maxWidth: 320,
        padding: '12px 16px',
        backgroundColor: 'var(--theme-primary)',
        color: 'var(--theme-primary-content)',
        borderRadius: 'var(--theme-button-radius, 12px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: 14,
        lineHeight: 1.4,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity ${TIMING.ANIMATION.NORMAL}ms ease, transform ${TIMING.ANIMATION.NORMAL}ms ease`,
        zIndex: 9998,
        cursor: 'pointer',
        pointerEvents: 'auto',
        whiteSpace: message.length < 60 ? 'nowrap' : 'normal',
      }}
      onClick={handleClose}
      role="alert"
      aria-live="polite"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'transparent',
          border: 'none',
          color: 'var(--theme-primary-content)',
          fontSize: 18,
          cursor: 'pointer',
          padding: '0 4px',
          opacity: 0.9,
          fontWeight: 'bold',
          lineHeight: 1
        }}
        aria-label="Close welcome message"
      >
        ×
      </button>
      <div style={{ paddingRight: 20 }}>{message}</div>
      <div style={arrowStyles} />
    </div>
  );
};

