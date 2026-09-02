"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Check for updates every time the page loads
        reg.update();
      })
      .catch(() => {
        // SW registration is best-effort — never surface errors
      });
  }, []);

  return null;
}
