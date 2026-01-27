import React from "react";
import ReactDOM from "react-dom/client";
import { CaliChatWidget } from "./Widget/CaliChatWidget";
import type { WidgetConfig } from "./types";
import socketService from "./Widget/services/socketService";

let currentRoot: ReactDOM.Root | null = null;
let currentHostElement: HTMLElement | null = null;

// Critical styles that must always be present
const CRITICAL_STYLES = `
/* CSS Reset for Shadow DOM */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:host {
  all: initial;
  display: block;
}

/* Base typography */
.widget-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Tailwind-like utilities for the widget */
.fixed { position: fixed; }
.absolute { position: absolute; }
.relative { position: relative; }

.inset-0 { inset: 0; }
.bottom-0 { bottom: 0; }
.right-0 { right: 0; }
.bottom-4 { bottom: 1rem; }
.right-4 { right: 1rem; }
.bottom-6 { bottom: 1.5rem; }
.right-6 { right: 1.5rem; }
.top-0 { top: 0; }
.left-0 { left: 0; }

.z-50 { z-index: 50; }
.z-\\[9999\\] { z-index: 9999; }

.flex { display: flex; }
.inline-flex { display: inline-flex; }
.hidden { display: none; }
.block { display: block; }
.grid { display: grid; }

.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-1 { flex: 1 1 0%; }
.flex-shrink-0 { flex-shrink: 0; }
.flex-grow { flex-grow: 1; }

.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.items-end { align-items: flex-end; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.justify-start { justify-content: flex-start; }

.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }

.w-full { width: 100%; }
.w-auto { width: auto; }
.w-4 { width: 1rem; }
.w-5 { width: 1.25rem; }
.w-6 { width: 1.5rem; }
.w-8 { width: 2rem; }
.w-10 { width: 2.5rem; }
.w-12 { width: 3rem; }
.w-14 { width: 3.5rem; }
.w-16 { width: 4rem; }
.w-80 { width: 20rem; }
.w-96 { width: 24rem; }
.w-\\[350px\\] { width: 350px; }
.w-\\[380px\\] { width: 380px; }
.w-\\[400px\\] { width: 400px; }

.min-w-0 { min-width: 0; }
.max-w-full { max-width: 100%; }
.max-w-xs { max-width: 20rem; }
.max-w-sm { max-width: 24rem; }
.max-w-md { max-width: 28rem; }
.max-w-\\[80\\%\\] { max-width: 80%; }
.max-w-\\[85\\%\\] { max-width: 85%; }

.h-full { height: 100%; }
.h-auto { height: auto; }
.h-4 { height: 1rem; }
.h-5 { height: 1.25rem; }
.h-6 { height: 1.5rem; }
.h-8 { height: 2rem; }
.h-10 { height: 2.5rem; }
.h-12 { height: 3rem; }
.h-14 { height: 3.5rem; }
.h-16 { height: 4rem; }
.h-\\[500px\\] { height: 500px; }
.h-\\[550px\\] { height: 550px; }
.h-\\[600px\\] { height: 600px; }

.min-h-0 { min-height: 0; }
.min-h-screen { min-height: 100vh; }
.max-h-\\[500px\\] { max-height: 500px; }
.max-h-\\[600px\\] { max-height: 600px; }

.p-0 { padding: 0; }
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-5 { padding: 1.25rem; }
.p-6 { padding: 1.5rem; }

.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }

.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }

.pt-2 { padding-top: 0.5rem; }
.pt-4 { padding-top: 1rem; }
.pb-2 { padding-bottom: 0.5rem; }
.pb-4 { padding-bottom: 1rem; }
.pl-2 { padding-left: 0.5rem; }
.pr-2 { padding-right: 0.5rem; }

.m-0 { margin: 0; }
.m-2 { margin: 0.5rem; }
.m-4 { margin: 1rem; }

.mx-auto { margin-left: auto; margin-right: auto; }
.my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }

.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mt-auto { margin-top: auto; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.ml-1 { margin-left: 0.25rem; }
.ml-2 { margin-left: 0.5rem; }
.ml-auto { margin-left: auto; }
.mr-1 { margin-right: 0.25rem; }
.mr-2 { margin-right: 0.5rem; }

.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }

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

.rounded { border-radius: 0.25rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-2xl { border-radius: 1rem; }
.rounded-3xl { border-radius: 1.5rem; }
.rounded-full { border-radius: 9999px; }

.rounded-t-lg { border-top-left-radius: 0.5rem; border-top-right-radius: 0.5rem; }
.rounded-t-xl { border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem; }
.rounded-t-2xl { border-top-left-radius: 1rem; border-top-right-radius: 1rem; }
.rounded-b-lg { border-bottom-left-radius: 0.5rem; border-bottom-right-radius: 0.5rem; }
.rounded-b-xl { border-bottom-left-radius: 0.75rem; border-bottom-right-radius: 0.75rem; }

.rounded-tl-lg { border-top-left-radius: 0.5rem; }
.rounded-tr-lg { border-top-right-radius: 0.5rem; }
.rounded-bl-lg { border-bottom-left-radius: 0.5rem; }
.rounded-br-lg { border-bottom-right-radius: 0.5rem; }
.rounded-bl-none { border-bottom-left-radius: 0; }
.rounded-br-none { border-bottom-right-radius: 0; }
.rounded-tl-none { border-top-left-radius: 0; }
.rounded-tr-none { border-top-right-radius: 0; }

.shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
.shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }
.shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
.shadow-none { box-shadow: none; }

.opacity-0 { opacity: 0; }
.opacity-50 { opacity: 0.5; }
.opacity-75 { opacity: 0.75; }
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
.hover\\:text-gray-700:hover { color: #374151; }
.hover\\:text-blue-600:hover { color: #2563eb; }
.hover\\:opacity-80:hover { opacity: 0.8; }
.hover\\:scale-105:hover { transform: scale(1.05); }
.hover\\:scale-110:hover { transform: scale(1.1); }
.hover\\:shadow-lg:hover { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }

.disabled\\:opacity-50:disabled { opacity: 0.5; }
.disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }

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

.animate-spin { animation: spin 1s linear infinite; }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.animate-bounce { animation: bounce 1s infinite; }
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

/* Space utilities */
.space-x-1 > * + * { margin-left: 0.25rem; }
.space-x-2 > * + * { margin-left: 0.5rem; }
.space-x-3 > * + * { margin-left: 0.75rem; }
.space-x-4 > * + * { margin-left: 1rem; }
.space-y-1 > * + * { margin-top: 0.25rem; }
.space-y-2 > * + * { margin-top: 0.5rem; }
.space-y-3 > * + * { margin-top: 0.75rem; }
.space-y-4 > * + * { margin-top: 1rem; }

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

/* ===== THEME-BASED RADIUS CLASSES ===== */
.rounded-theme {
  border-radius: var(--theme-border-radius, 1rem);
}

.rounded-theme-button {
  border-radius: var(--theme-button-radius, 0.75rem);
}

.rounded-theme-input {
  border-radius: var(--theme-input-radius, 0.75rem);
}

.rounded-theme-avatar {
  border-radius: var(--theme-avatar-radius, 9999px);
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

.hover\\:brightness-110:hover {
  filter: brightness(1.1);
}

.hover\\:brightness-90:hover {
  filter: brightness(0.9);
}
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
        console.log('✅ Cali Chat Widget initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Cali Chat Widget:', error);
    }
}

function destroy() {
    // Disconnect socket first
    try {
        socketService.disconnect();
    } catch (e) {
        console.warn('Socket cleanup failed:', e);
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
}

export default CaliChatWidgetAPI;