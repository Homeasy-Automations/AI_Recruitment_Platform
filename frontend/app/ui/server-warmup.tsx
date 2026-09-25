"use client";

import { useEffect } from "react";

/**
 * ServerWarmup Component:
 * Runs non-blocking background requests to wake up Render FastAPI and prime the MongoDB connection pool
 * immediately upon page load.
 * 
 * Render spins down after 15 minutes of inactivity. When a user lands on the website, this component
 * immediately fires background calls so the backend is fully awake and warmed up by the time the
 * user submits any registration, sign-in, or interview form.
 */
export function ServerWarmup() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    let isSubscribed = true;

    async function warmServer() {
      try {
        // Fire non-blocking ping to health check and backend-config
        await Promise.allSettled([
          fetch("/api/health", { cache: "no-store" }),
          fetch("/api/backend-config", { cache: "no-store" }),
          fetch("/api/students/target-roles", { cache: "no-store" }),
        ]);
      } catch {
        // Silently catch in background
      }
    }

    // Warm up immediately upon mount
    warmServer();

    // Heartbeat: ping every 3 minutes while the user has the browser tab open
    // so Render never idles while the candidate is actively filling forms or exploring
    const heartbeatInterval = setInterval(() => {
      if (isSubscribed && document.visibilityState === "visible") {
        warmServer();
      }
    }, 180000); // 3 minutes

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        warmServer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isSubscribed = false;
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
