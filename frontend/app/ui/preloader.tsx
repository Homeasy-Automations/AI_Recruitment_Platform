"use client";

import { useEffect, useState } from "react";
import { SparkIcon } from "./brand";

export interface PreloaderProps {
  show: boolean;
  title?: string;
  message?: string;
  subtitle?: string;
  isColdStartAware?: boolean;
}

const DEFAULT_STAGES = [
  "Connecting to secure server...",
  "Waking cloud instance & establishing connection...",
  "Processing candidate credentials...",
  "Finalizing profile & preparing dashboard...",
];

export function Preloader({
  show,
  title = "Please wait…",
  message = "Setting up your workspace...",
  subtitle,
  isColdStartAware = true,
}: PreloaderProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (show) {
      setVisible(true);
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      const timeout = setTimeout(() => {
        setVisible(false);
        setElapsedSeconds(0);
      }, 300);
      return () => clearTimeout(timeout);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [show]);

  if (!mounted || (!show && !visible)) {
    return null;
  }

  // Determine progressive stage message if server is taking time (cold start / reboot)
  let activeHint = subtitle || message;
  if (isColdStartAware && elapsedSeconds >= 3) {
    if (elapsedSeconds < 7) {
      activeHint = DEFAULT_STAGES[1];
    } else if (elapsedSeconds < 12) {
      activeHint = DEFAULT_STAGES[2];
    } else {
      activeHint = DEFAULT_STAGES[3];
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        show ? "opacity-100 backdrop-blur-md bg-slate-950/75" : "opacity-0 pointer-events-none backdrop-blur-none bg-slate-950/0"
      }`}
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-indigo-500/20 blur-[100px] animate-pulse" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-cyan-500/15 blur-[100px]" />

      {/* Main Glassmorphic Preloader Card */}
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-7 sm:p-9 text-center shadow-2xl shadow-indigo-950/80 transition-all duration-300 transform ${
          show ? "scale-100 translate-y-0" : "scale-95 translate-y-2"
        }`}
      >
        {/* Animated Top Gradient Shimmer Bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-600 animate-pulse" />

        {/* Triple Orbital Kinetic Spinner */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          {/* Outer Rotating Glowing Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-400 border-r-cyan-400 animate-spin [animation-duration:1.6s] shadow-[0_0_20px_rgba(99,102,241,0.4)]" />

          {/* Middle Counter-rotating Dashed Ring */}
          <div className="absolute inset-2 rounded-full border-2 border-dashed border-indigo-300/30 border-b-cyan-300 animate-[spin_2.4s_linear_infinite_reverse]" />

          {/* Inner Pulsing Core */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/50 animate-pulse">
            <SparkIcon />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          <span className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            {title}
          </span>
        </h3>

        {/* Dynamic Context Message */}
        <p className="mt-2.5 text-sm font-medium text-indigo-200/90 transition-all duration-300">
          {activeHint}
        </p>

        {/* Elapsed Timer / Cold Start Assurance */}
        {elapsedSeconds >= 4 && (
          <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-950/40 px-3 py-2 text-xs text-indigo-300 animate-fade-in">
            <div className="flex items-center justify-center gap-1.5 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
              </span>
              <span>Waking up cloud server instance ({elapsedSeconds}s)</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Free server tier is starting up; thank you for your patience!
            </p>
          </div>
        )}

        {/* Live System Signal Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-slate-300">FastAPI & MongoDB Cloud</span>
        </div>
      </div>
    </div>
  );
}

export function InlineSpinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
