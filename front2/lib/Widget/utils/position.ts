/**
 * Position Utilities
 * Helper functions for widget positioning and layout calculations
 */

import type { WidgetPosition } from '../constants';
import { LAYOUT } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

export interface PositionConfig {
  position: WidgetPosition;
  offsetX?: number;
  offsetY?: number;
}

export interface PositionStyles {
  left?: number | string;
  right?: number | string;
  top?: number | string;
  bottom?: number | string;
}

// ============================================================================
// POSITION HELPERS
// ============================================================================

/**
 * Get CSS classes for widget positioning
 */
export function getPositionClasses(position: WidgetPosition): string {
  const isLeft = position === 'bottom-left';
  return `fixed bottom-4 z-50 ${isLeft ? 'left-4' : 'right-4'}`;
}

/**
 * Get inline styles for popover positioning relative to toggle button
 */
export function getPopoverPosition(
  position: WidgetPosition,
  offsetBottom: number = LAYOUT.TOGGLE_BUTTON.SIZE + LAYOUT.SPACING.POPOVER_GAP
): PositionStyles {
  const isLeft = position === 'bottom-left';
  
  return {
    bottom: offsetBottom,
    ...(isLeft ? { left: 0 } : { right: 0 }),
  };
}

/**
 * Get inline styles for chat window positioning
 */
export function getChatWindowPosition(
  position: WidgetPosition
): PositionStyles {
  const isLeft = position === 'bottom-left';
  
  return {
    ...(isLeft ? { left: 0 } : { right: 0 }),
  };
}

/**
 * Check if position is on the left side
 */
export function isLeftPosition(position: WidgetPosition): boolean {
  return position === 'bottom-left';
}

/**
 * Check if position is on the right side
 */
export function isRightPosition(position: WidgetPosition): boolean {
  return position === 'bottom-right';
}

/**
 * Get arrow position for popovers/tooltips
 */
export function getArrowPosition(
  position: WidgetPosition,
  arrowOffset: number = 24
): PositionStyles {
  const isLeft = position === 'bottom-left';
  
  return {
    bottom: -8,
    ...(isLeft ? { left: arrowOffset } : { right: arrowOffset }),
  };
}

/**
 * Calculate optimal chat window dimensions based on viewport
 */
export function getResponsiveChatDimensions(): {
  width: number;
  height: number;
  isMobile: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      width: LAYOUT.CHAT_WINDOW.WIDTH,
      height: LAYOUT.CHAT_WINDOW.HEIGHT,
      isMobile: false,
    };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth < 480;

  if (isMobile) {
    return {
      width: viewportWidth - 32, // 16px margin on each side
      height: Math.min(viewportHeight - 100, LAYOUT.CHAT_WINDOW.MAX_HEIGHT),
      isMobile: true,
    };
  }

  return {
    width: LAYOUT.CHAT_WINDOW.WIDTH,
    height: Math.min(viewportHeight - 120, LAYOUT.CHAT_WINDOW.HEIGHT),
    isMobile: false,
  };
}
