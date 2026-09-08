import { useCallback, useEffect, useRef, useState } from "react";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function usePlayback(total: number, playing: boolean, stop: () => void, reducedMotion: boolean) {
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const position = useRef(0);
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const seek = useCallback(
    (next: number) => {
      position.current = Math.max(0, Math.min(total, next));
      setProgress(position.current);
    },
    [total],
  );

  useEffect(() => {
    if (!playing) return;
    let previous = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      position.current = Math.min(total, position.current + ((now - previous) * speed) / 1100);
      previous = now;
      setProgress(reducedMotion ? Math.floor(position.current) : position.current);
      if (position.current >= total) stopRef.current();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, total, speed, reducedMotion]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) stopRef.current();
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  return { progress, speed, setSpeed, seek };
}
