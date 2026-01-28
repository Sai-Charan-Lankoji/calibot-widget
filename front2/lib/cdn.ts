import React from "react";
import ReactDOM from "react-dom/client";
import { CaliChatWidget } from "./Widget/CaliChatWidget";
import type { WidgetConfig } from "./types";
import socketService from "./Widget/services/socketService";

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
const log = (...args: any[]) => isDev && console.log(...args);

let currentRoot: ReactDOM.Root | null = null;
let currentHostElement: HTMLElement | null = null;

// Critical styles with PIXEL values for framework isolation
// Using px instead of rem ensures the widget looks the same regardless of host page's root font-size
const CRITICAL_STYLES = `
/* CSS Reset for Shadow DOM */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border-width: 0;
  border-style: solid;
}

:host {
  all: initial;
  display: block;
  font-size: var(--theme-font-size, 14px);
  
  /* Default theme CSS variables - will be overridden by JS when theme loads */
  --theme-primary: oklch(0.67 0.182 276.935);
  --theme-primary-content: oklch(0.98 0 0);
  --theme-secondary: oklch(0.70 0.01 56.259);
  --theme-secondary-content: oklch(0.14 0.004 49.25);
  --theme-accent: oklch(0.78 0.154 211.53);
  --theme-accent-content: oklch(0.30 0.056 229.695);
  --theme-base-100: oklch(1 0 0);
  --theme-base-200: oklch(0.96 0 0);
  --theme-base-300: oklch(0.92 0 0);
  --theme-base-content: oklch(0.14 0 0);
  --theme-neutral: oklch(0.14 0 0);
  --theme-neutral-content: oklch(0.98 0 0);
  --theme-success: oklch(0.72 0.219 149.579);
  --theme-warning: oklch(0.76 0.188 70.08);
  --theme-error: oklch(0.65 0.241 354.308);
  --theme-info: oklch(0.71 0.143 215.221);
  
  /* Default layout variables */
  --theme-border-radius: 24px;
  --theme-button-radius: 12px;
  --theme-input-radius: 12px;
  --theme-avatar-radius: 9999px;
  --theme-bubble-radius: 16px;
  
  /* Default typography variables */
  --theme-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --theme-font-size: 14px;
  --theme-line-height: 1.5;
}

/* Base typography - establish 16px base */
.widget-container {
  font-family: var(--theme-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif);
  font-size: var(--theme-font-size, 14px);
  line-height: 1.5;
  color: #1f2937;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.cali-chat-widget {
  font-size: var(--theme-font-size, 14px);
}

/* ===== POSITION ===== */
.fixed { position: fixed; }
.absolute { position: absolute; }
.relative { position: relative; }
.sticky { position: sticky; }

.inset-0 { inset: 0; }
.bottom-0 { bottom: 0; }
.right-0 { right: 0; }
.top-0 { top: 0; }
.left-0 { left: 0; }
.left-4 { left: 16px; }
.right-4 { right: 16px; }
.bottom-4 { bottom: 16px; }
.bottom-6 { bottom: 24px; }
.right-6 { right: 24px; }

.z-50 { z-index: 50; }
.z-\\[9999\\] { z-index: 9999; }

/* ===== DISPLAY ===== */
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.hidden { display: none; }
.block { display: block; }
.inline-block { display: inline-block; }
.grid { display: grid; }

/* ===== FLEXBOX ===== */
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-1 { flex: 1 1 0%; }
.flex-shrink-0 { flex-shrink: 0; }
.flex-grow { flex-grow: 1; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }
.shrink-0 { flex-shrink: 0; }
.shrink { flex-shrink: 1; }
.grow { flex-grow: 1; }
.grow-0 { flex-grow: 0; }

.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.items-end { align-items: flex-end; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.justify-start { justify-content: flex-start; }

/* ===== GAP (px values) ===== */
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }

/* ===== WIDTH (px values) ===== */
.w-full { width: 100%; }
.w-auto { width: auto; }
.w-2 { width: 8px; }
.w-3 { width: 12px; }
.w-4 { width: 16px; }
.w-5 { width: 20px; }
.w-6 { width: 24px; }
.w-7 { width: 28px; }
.w-8 { width: 32px; }
.w-9 { width: 36px; }
.w-10 { width: 40px; }
.w-11 { width: 44px; }
.w-12 { width: 48px; }
.w-14 { width: 56px; }
.w-16 { width: 64px; }
.w-80 { width: 320px; }
.w-96 { width: 384px; }
.w-\\[350px\\] { width: 350px; }
.w-\\[380px\\] { width: 380px; }
.w-\\[400px\\] { width: 400px; }

.min-w-0 { min-width: 0; }
.max-w-full { max-width: 100%; }
.max-w-xs { max-width: 320px; }
.max-w-sm { max-width: 384px; }
.max-w-md { max-width: 448px; }
.max-w-\\[80\\%\\] { max-width: 80%; }
.max-w-\\[85\\%\\] { max-width: 85%; }

/* ===== HEIGHT (px values) ===== */
.h-full { height: 100%; }
.h-auto { height: auto; }
.h-2 { height: 8px; }
.h-3 { height: 12px; }
.h-4 { height: 16px; }
.h-5 { height: 20px; }
.h-6 { height: 24px; }
.h-7 { height: 28px; }
.h-8 { height: 32px; }
.h-9 { height: 36px; }
.h-10 { height: 40px; }
.h-11 { height: 44px; }
.h-12 { height: 48px; }
.h-14 { height: 56px; }
.h-16 { height: 64px; }
.h-\\[500px\\] { height: 500px; }
.h-\\[550px\\] { height: 550px; }
.h-\\[600px\\] { height: 600px; }

.min-h-0 { min-height: 0; }
.min-h-screen { min-height: 100vh; }
.min-h-\\[600px\\] { min-height: 600px; }
.max-h-\\[500px\\] { max-height: 500px; }
.max-h-\\[600px\\] { max-height: 600px; }

/* ===== PADDING (px values) ===== */
.p-0 { padding: 0; }
.p-1 { padding: 4px; }
.p-2 { padding: 8px; }
.p-3 { padding: 12px; }
.p-4 { padding: 16px; }
.p-5 { padding: 20px; }
.p-6 { padding: 24px; }

.px-2 { padding-left: 8px; padding-right: 8px; }
.px-3 { padding-left: 12px; padding-right: 12px; }
.px-4 { padding-left: 16px; padding-right: 16px; }
.px-5 { padding-left: 20px; padding-right: 20px; }
.px-6 { padding-left: 24px; padding-right: 24px; }

.py-1 { padding-top: 4px; padding-bottom: 4px; }
.py-2 { padding-top: 8px; padding-bottom: 8px; }
.py-3 { padding-top: 12px; padding-bottom: 12px; }
.py-4 { padding-top: 16px; padding-bottom: 16px; }

.pt-2 { padding-top: 8px; }
.pt-4 { padding-top: 16px; }
.pb-2 { padding-bottom: 8px; }
.pb-4 { padding-bottom: 16px; }
.pl-2 { padding-left: 8px; }
.pr-2 { padding-right: 8px; }

/* ===== MARGIN (px values) ===== */
.m-0 { margin: 0; }
.m-2 { margin: 8px; }
.m-4 { margin: 16px; }

.mx-auto { margin-left: auto; margin-right: auto; }
.my-2 { margin-top: 8px; margin-bottom: 8px; }

.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mt-auto { margin-top: auto; }
.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.ml-1 { margin-left: 4px; }
.ml-2 { margin-left: 8px; }
.ml-auto { margin-left: auto; }
.mr-1 { margin-right: 4px; }
.mr-2 { margin-right: 8px; }

/* ===== TYPOGRAPHY (px values) ===== */
.text-xs { font-size: 12px; line-height: 16px; }
.text-sm { font-size: 14px; line-height: 20px; }
.text-base { font-size: 16px; line-height: 24px; }
.text-lg { font-size: 18px; line-height: 28px; }
.text-xl { font-size: 20px; line-height: 28px; }
.text-2xl { font-size: 24px; line-height: 32px; }

.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }

.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

.text-white { color: #ffffff; }
.text-black { color: #000000; }
.text-gray-400 { color: #9ca3af; }
.text-gray-500 { color: #6b7280; }
.text-gray-600 { color: #4b5563; }
.text-gray-700 { color: #374151; }
.text-gray-800 { color: #1f2937; }
.text-gray-900 { color: #111827; }
.text-red-500 { color: #ef4444; }
.text-blue-500 { color: #3b82f6; }
.text-blue-600 { color: #2563eb; }
.text-green-500 { color: #22c55e; }

.bg-white { background-color: #ffffff; }
.bg-black { background-color: #000000; }
.bg-gray-50 { background-color: #f9fafb; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-gray-200 { background-color: #e5e7eb; }
.bg-gray-300 { background-color: #d1d5db; }
.bg-gray-800 { background-color: #1f2937; }
.bg-gray-900 { background-color: #111827; }
.bg-blue-500 { background-color: #3b82f6; }
.bg-blue-600 { background-color: #2563eb; }
.bg-blue-700 { background-color: #1d4ed8; }
.bg-red-500 { background-color: #ef4444; }
.bg-green-500 { background-color: #22c55e; }
.bg-transparent { background-color: transparent; }

.bg-opacity-50 { --tw-bg-opacity: 0.5; }
.bg-opacity-75 { --tw-bg-opacity: 0.75; }

.border { border-width: 1px; }
.border-0 { border-width: 0; }
.border-2 { border-width: 2px; }
.border-t { border-top-width: 1px; }
.border-b { border-bottom-width: 1px; }
.border-l { border-left-width: 1px; }
.border-r { border-right-width: 1px; }

.border-solid { border-style: solid; }
.border-none { border-style: none; }

.border-gray-100 { border-color: #f3f4f6; }
.border-gray-200 { border-color: #e5e7eb; }
.border-gray-300 { border-color: #d1d5db; }
.border-gray-400 { border-color: #9ca3af; }
.border-blue-500 { border-color: #3b82f6; }
.border-transparent { border-color: transparent; }

/* ===== BORDER RADIUS (px values) ===== */
.rounded { border-radius: 4px; }
.rounded-md { border-radius: 6px; }
.rounded-lg { border-radius: 8px; }
.rounded-xl { border-radius: 12px; }
.rounded-2xl { border-radius: 16px; }
.rounded-3xl { border-radius: 24px; }
.rounded-full { border-radius: 9999px; }

.rounded-t-lg { border-top-left-radius: 8px; border-top-right-radius: 8px; }
.rounded-t-xl { border-top-left-radius: 12px; border-top-right-radius: 12px; }
.rounded-t-2xl { border-top-left-radius: 16px; border-top-right-radius: 16px; }
.rounded-b-lg { border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
.rounded-b-xl { border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; }

.rounded-tl-lg { border-top-left-radius: 8px; }
.rounded-tr-lg { border-top-right-radius: 8px; }
.rounded-bl-lg { border-bottom-left-radius: 8px; }
.rounded-br-lg { border-bottom-right-radius: 8px; }
.rounded-tl-md { border-top-left-radius: 6px; }
.rounded-tr-md { border-top-right-radius: 6px; }
.rounded-bl-md { border-bottom-left-radius: 6px; }
.rounded-br-md { border-bottom-right-radius: 6px; }
.rounded-bl-none { border-bottom-left-radius: 0; }
.rounded-br-none { border-bottom-right-radius: 0; }
.rounded-tl-none { border-top-left-radius: 0; }
.rounded-tr-none { border-top-right-radius: 0; }

.shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
.shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }
.shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
.shadow-none { box-shadow: none; }

.opacity-0 { opacity: 0; }
.opacity-40 { opacity: 0.4; }
.opacity-50 { opacity: 0.5; }
.opacity-60 { opacity: 0.6; }
.opacity-75 { opacity: 0.75; }
.opacity-80 { opacity: 0.8; }
.opacity-100 { opacity: 1; }

.overflow-auto { overflow: auto; }
.overflow-hidden { overflow: hidden; }
.overflow-scroll { overflow: scroll; }
.overflow-x-auto { overflow-x: auto; }
.overflow-y-auto { overflow-y: auto; }
.overflow-x-hidden { overflow-x: hidden; }
.overflow-y-hidden { overflow-y: hidden; }

.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.whitespace-nowrap { white-space: nowrap; }
.whitespace-pre-wrap { white-space: pre-wrap; }
.break-words { word-break: break-word; overflow-wrap: break-word; }

.cursor-pointer { cursor: pointer; }
.cursor-default { cursor: default; }
.cursor-not-allowed { cursor: not-allowed; }

.pointer-events-none { pointer-events: none; }
.pointer-events-auto { pointer-events: auto; }

.select-none { user-select: none; }
.select-text { user-select: text; }

.outline-none { outline: none; }
.focus\\:outline-none:focus { outline: none; }
.focus\\:ring-2:focus { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); }
.focus\\:ring-blue-500:focus { --tw-ring-color: #3b82f6; }

.transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-opacity { transition-property: opacity; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }

.duration-150 { transition-duration: 150ms; }
.duration-200 { transition-duration: 200ms; }
.duration-300 { transition-duration: 300ms; }

.ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }

.transform { transform: translateX(var(--tw-translate-x, 0)) translateY(var(--tw-translate-y, 0)) rotate(var(--tw-rotate, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1)); }
.scale-100 { --tw-scale-x: 1; --tw-scale-y: 1; transform: scale(1); }
.scale-95 { --tw-scale-x: 0.95; --tw-scale-y: 0.95; transform: scale(0.95); }
.scale-105 { --tw-scale-x: 1.05; --tw-scale-y: 1.05; transform: scale(1.05); }

.rotate-0 { --tw-rotate: 0deg; transform: rotate(0deg); }
.rotate-180 { --tw-rotate: 180deg; transform: rotate(180deg); }

.hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
.hover\\:bg-gray-200:hover { background-color: #e5e7eb; }
.hover\\:bg-blue-600:hover { background-color: #2563eb; }
.hover\\:bg-blue-700:hover { background-color: #1d4ed8; }
.hover\\:bg-red-600:hover { background-color: #dc2626; }
.hover\\:bg-white\\/20:hover { background-color: rgba(255, 255, 255, 0.2); }
.hover\\:text-gray-700:hover { color: #374151; }
.hover\\:text-blue-600:hover { color: #2563eb; }
.hover\\:opacity-80:hover { opacity: 0.8; }
.hover\\:scale-105:hover { transform: scale(1.05); }
.hover\\:scale-110:hover { transform: scale(1.1); }
.hover\\:shadow-md:hover { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
.hover\\:shadow-lg:hover { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }

.disabled\\:opacity-50:disabled { opacity: 0.5; }
.disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }

/* Flexbox additional utilities */
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }
.shrink-0 { flex-shrink: 0; }
.shrink { flex-shrink: 1; }
.grow { flex-grow: 1; }
.grow-0 { flex-grow: 0; }

/* Transform utilities */
.hover\\:-translate-y-0\\.5:hover { transform: translateY(-2px); }
.-translate-y-0\\.5 { transform: translateY(-2px); }
.translate-y-0 { transform: translateY(0); }

/* Active state */
.active\\:scale-95:active { transform: scale(0.95); }
.active\\:scale-98:active { transform: scale(0.98); }

/* Group hover */
.group:hover .group-hover\\:text-theme-primary { color: var(--theme-primary); }

/* Animation delays */
.\\[animation-delay\\:-0\\.3s\\] { animation-delay: -0.3s; }
.\\[animation-delay\\:-0\\.15s\\] { animation-delay: -0.15s; }

/* Animate in utilities */
.animate-in { animation-duration: 150ms; animation-fill-mode: both; }
.fade-in { animation-name: fadeIn; }
.slide-in-from-bottom-2 { --tw-enter-translate-y: 8px; animation-name: slideInFromBottom; }
.duration-300 { animation-duration: 300ms; transition-duration: 300ms; }
.duration-500 { animation-duration: 500ms; transition-duration: 500ms; }

@keyframes slideInFromBottom {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Widget specific animation */
.widget-animate-in {
  animation: widgetSlideUp 0.3s ease-out;
}

@keyframes widgetSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scrollbar styles */
.scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.2); border-radius: 3px; }

/* Custom animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
  50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-spin { animation: spin 1s linear infinite; }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.animate-bounce { animation: bounce 1s infinite; }
.animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
.animate-slide-up { animation: slideUp 0.3s ease-out; }
.animate-scale-in { animation: scaleIn 0.2s ease-out; }

/* Typing indicator animation */
.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }
.typing-dot:nth-child(3) { animation-delay: 0s; }

@keyframes typing-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* Space utilities (px values) */
.space-x-1 > * + * { margin-left: 4px; }
.space-x-2 > * + * { margin-left: 8px; }
.space-x-3 > * + * { margin-left: 12px; }
.space-x-4 > * + * { margin-left: 16px; }
.space-y-1 > * + * { margin-top: 4px; }
.space-y-2 > * + * { margin-top: 8px; }
.space-y-3 > * + * { margin-top: 12px; }
.space-y-4 > * + * { margin-top: 16px; }

/* SVG utilities */
.fill-current { fill: currentColor; }
.stroke-current { stroke: currentColor; }

/* Leading/line-height */
.leading-none { line-height: 1; }
.leading-tight { line-height: 1.25; }
.leading-normal { line-height: 1.5; }
.leading-relaxed { line-height: 1.625; }

/* Aspect ratio */
.aspect-square { aspect-ratio: 1 / 1; }

/* Object fit */
.object-cover { object-fit: cover; }
.object-contain { object-fit: contain; }

/* Visibility */
.visible { visibility: visible; }
.invisible { visibility: hidden; }

/* sr-only for screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Placeholder styling */
.placeholder-gray-400::placeholder { color: #9ca3af; }
.placeholder-gray-500::placeholder { color: #6b7280; }

/* Ring utilities */
.ring-1 { box-shadow: 0 0 0 1px var(--tw-ring-color, rgba(59, 130, 246, 0.5)); }
.ring-2 { box-shadow: 0 0 0 2px var(--tw-ring-color, rgba(59, 130, 246, 0.5)); }
.ring-blue-500 { --tw-ring-color: #3b82f6; }
.ring-offset-2 { --tw-ring-offset-width: 2px; }

/* Focus visible */
.focus-visible\\:ring-2:focus-visible { box-shadow: 0 0 0 2px var(--tw-ring-color, rgba(59, 130, 246, 0.5)); }
.focus-visible\\:outline-none:focus-visible { outline: none; }

/* ===== THEME-BASED RADIUS CLASSES (px fallbacks) ===== */
.rounded-theme {
  border-radius: var(--theme-border-radius, 16px);
}

.rounded-theme-button {
  border-radius: var(--theme-button-radius, 12px);
}

.rounded-theme-input {
  border-radius: var(--theme-input-radius, 12px);
}

.rounded-theme-avatar {
  border-radius: var(--theme-avatar-radius, 9999px);
}

.rounded-theme-bubble {
  border-radius: var(--theme-bubble-radius, 16px);
}

/* ===== THEME COLOR CLASSES ===== */
.bg-theme-primary {
  background-color: var(--theme-primary);
}

.bg-theme-secondary {
  background-color: var(--theme-secondary);
}

.bg-theme-accent {
  background-color: var(--theme-accent);
}

.bg-theme-neutral {
  background-color: var(--theme-neutral);
}

.bg-theme-base-100 {
  background-color: var(--theme-base-100);
}

.bg-theme-base-200 {
  background-color: var(--theme-base-200);
}

.bg-theme-base-300 {
  background-color: var(--theme-base-300);
}

.bg-theme-success {
  background-color: var(--theme-success);
}

.bg-theme-warning {
  background-color: var(--theme-warning);
}

.bg-theme-error {
  background-color: var(--theme-error);
}

.bg-theme-info {
  background-color: var(--theme-info);
}

.text-theme-primary {
  color: var(--theme-primary);
}

.text-theme-primary-content {
  color: var(--theme-primary-content);
}

.text-theme-secondary {
  color: var(--theme-secondary);
}

.text-theme-secondary-content {
  color: var(--theme-secondary-content);
}

.text-theme-base-content {
  color: var(--theme-base-content);
}

.text-theme-neutral {
  color: var(--theme-neutral);
}

.text-theme-neutral-content {
  color: var(--theme-neutral-content);
}

.text-theme-accent {
  color: var(--theme-accent);
}

.text-theme-accent-content {
  color: var(--theme-accent-content);
}

.text-theme-success {
  color: var(--theme-success);
}

.text-theme-warning {
  color: var(--theme-warning);
}

.text-theme-error {
  color: var(--theme-error);
}

/* Border theme colors */
.border-theme-base {
  border-color: var(--theme-base-300);
}

.border-theme-base-300 {
  border-color: var(--theme-base-300);
}

.border-theme-primary {
  border-color: var(--theme-primary);
}

.border-theme-secondary {
  border-color: var(--theme-secondary);
}

.border-theme-accent {
  border-color: var(--theme-accent);
}

/* Ring theme colors */
.ring-theme-primary {
  --tw-ring-color: var(--theme-primary);
}

.ring-theme-base-100 {
  --tw-ring-color: var(--theme-base-100);
}

.focus\\:ring-theme-primary:focus {
  --tw-ring-color: var(--theme-primary);
  box-shadow: 0 0 0 2px var(--tw-ring-color);
}

/* Hover states for theme colors */
.hover\\:bg-theme-base-200:hover {
  background-color: var(--theme-base-200);
}

.hover\\:bg-theme-primary\\/5:hover {
  background-color: color-mix(in srgb, var(--theme-primary) 5%, transparent);
}

.hover\\:border-theme-primary\\/40:hover {
  border-color: color-mix(in srgb, var(--theme-primary) 40%, transparent);
}

.hover\\:text-theme-primary:hover {
  color: var(--theme-primary);
}

.hover\\:brightness-110:hover {
  filter: brightness(1.1);
}

.hover\\:brightness-90:hover {
  filter: brightness(0.9);
}

/* Theme opacity variants */
.bg-theme-primary\\/5 {
  background-color: color-mix(in srgb, var(--theme-primary) 5%, transparent);
}

.bg-theme-primary\\/10 {
  background-color: color-mix(in srgb, var(--theme-primary) 10%, transparent);
}

.bg-theme-primary\\/20 {
  background-color: color-mix(in srgb, var(--theme-primary) 20%, transparent);
}

.border-theme-primary\\/20 {
  border-color: color-mix(in srgb, var(--theme-primary) 20%, transparent);
}

.border-theme-primary\\/40 {
  border-color: color-mix(in srgb, var(--theme-primary) 40%, transparent);
}

/* Focus ring with offset */
.focus\\:ring-2:focus {
  box-shadow: 0 0 0 2px var(--tw-ring-color, var(--theme-primary));
}

.focus\\:ring-offset-2:focus {
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--tw-ring-color, var(--theme-primary));
}

/* Placeholder text color */
.placeholder\\:text-theme-neutral::placeholder {
  color: var(--theme-neutral);
}

/* Min height for container */
.min-h-\\[600px\\] { min-height: 600px; }
`;

function init(config: WidgetConfig & { containerId?: string }) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.error('CaliChatWidget requires a browser environment');
        return;
    }

    // Destroy existing instance first
    destroy();

    const { containerId, ...widgetConfig } = config;
    
    // Create host element
    let hostElement: HTMLElement | null = document.getElementById(containerId || "cali-chat-widget-root");
    
    if (!hostElement) {
        hostElement = document.createElement("div");
        hostElement.id = containerId || "cali-chat-widget-root";
        hostElement.style.cssText = `
            position: fixed;
            z-index: 2147483647;
            bottom: 0;
            right: 0;
            pointer-events: none;
        `;
        document.body.appendChild(hostElement);
    }

    // Create Shadow DOM for style isolation
    const shadowRoot = hostElement.attachShadow({ mode: 'open' });
    
    // Inject critical styles into Shadow DOM
    const criticalStyleSheet = document.createElement('style');
    criticalStyleSheet.textContent = CRITICAL_STYLES;
    shadowRoot.appendChild(criticalStyleSheet);
    
    // Inject Tailwind/processed CSS from the bundle (set by vite-plugin-css-injected-by-js)
    const bundledCss = (window as any).__CALI_WIDGET_CSS__;
    if (bundledCss) {
        const tailwindStyleSheet = document.createElement('style');
        tailwindStyleSheet.textContent = bundledCss;
        shadowRoot.appendChild(tailwindStyleSheet);
    }
    
    // Create render target inside Shadow DOM
    const renderTarget = document.createElement('div');
    renderTarget.className = 'widget-container cali-chat-widget';
    renderTarget.style.pointerEvents = 'auto';
    shadowRoot.appendChild(renderTarget);

    try {
        currentRoot = ReactDOM.createRoot(renderTarget);
        currentHostElement = hostElement;
        currentRoot.render(React.createElement(CaliChatWidget, widgetConfig));
        log('✅ Cali Chat Widget initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Cali Chat Widget:', error);
    }
}

function destroy() {
    // Disconnect socket first
    try {
        socketService.disconnect();
    } catch (e) {
        // Silent cleanup
    }
    
    if (currentRoot) {
        currentRoot.unmount();
        currentRoot = null;
    }
    if (currentHostElement) {
        currentHostElement.remove();
        currentHostElement = null;
    }
}

// Export the API
export const CaliChatWidgetAPI = {
    init,
    destroy,
    version: "1.0.0"
};

// Auto-attach to window for UMD build
if (typeof window !== 'undefined') {
    (window as any).CaliChatWidget = CaliChatWidgetAPI;
    
    // Auto-initialize from script data attributes
    // Allows: <script src="cali-chat-widget.umd.js" data-bot-id="xxx" data-api-url="http://..."></script>
    const autoInit = () => {
        // Find the script tag that loaded this widget
        const scripts = document.querySelectorAll('script[data-bot-id]');
        const currentScript = scripts[scripts.length - 1] as HTMLScriptElement | null;
        
        if (currentScript) {
            const botId = currentScript.getAttribute('data-bot-id');
            const apiUrl = currentScript.getAttribute('data-api-url') || currentScript.getAttribute('data-api-base-url');
            const containerId = currentScript.getAttribute('data-container-id');
            const position = currentScript.getAttribute('data-position') as 'bottom-left' | 'bottom-right' | null;
            
            if (botId && apiUrl) {
                log('🚀 Auto-initializing Cali Chat Widget from script attributes');
                init({
                    botId,
                    apiBaseUrl: apiUrl,
                    ...(containerId && { containerId }),
                    ...(position && { position }),
                });
            }
        }
    };
    
    // Run auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        // DOM already loaded, run immediately but defer to allow script to finish
        setTimeout(autoInit, 0);
    }
}

export default CaliChatWidgetAPI;