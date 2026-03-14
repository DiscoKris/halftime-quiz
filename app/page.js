'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const videoRef = useRef(null); // ✅ no TS syntax in .js files
  const [showFallback, setShowFallback] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const hideIfPlaying = () => {
      if (!el.paused && el.currentTime > 0) setShowFallback(false);
    };

    const onPlaying = () => setShowFallback(false);
    const onError = () => {
      setErrored(true);
      setShowFallback(true);
    };

    el.addEventListener("playing", onPlaying);
    el.addEventListener("error", onError);

    const tryPlay = el.play();
    if (tryPlay && typeof tryPlay.then === "function") {
      tryPlay.then(hideIfPlaying).catch(() => setShowFallback(true));
    }

    return () => {
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("error", onError);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      <video
        ref={videoRef}
        src="/splash.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        poster="/HQ25_logo.png"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {showFallback && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300">
          <img
            src="/HQ25_logo.png"
            alt="Halftime Quiz Logo"
            className="w-48 h-48"
          />
          <p className="text-white font-bold text-xl mt-2 tracking-wide">
            HALFTIME QUIZ
          </p>
          {errored && (
            <span className="mt-3 text-white/70 text-sm">
              (Video unavailable — showing logo)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
