import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import type { K8Target } from "./k8-selection";

const DOUBLE_PRESS_INTERVAL = 200;
const MAX_TAP_DURATION = 350;
const TAP_SLOP = 24;
type Tap = { x: number; y: number; time: number; selection: K8Target | null };
type Click = Pick<Tap, "time" | "selection">;

export function useStellaView(selection: K8Target | null, restoreSelection: (selection: K8Target | null) => void) {
  const [symmetric, setSymmetric] = useState(false);
  const [progress, setProgress] = useState(0);
  const position = useRef(0);
  const previousClick = useRef<Click | null>(null);
  const doubleClick = useRef<Click | null>(null);
  const touchStart = useRef<Tap | null>(null);
  const previousTap = useRef<Tap | null>(null);
  const ignoreClickUntil = useRef(0);
  const ignoreDoubleClickUntil = useRef(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const from = position.current;
    const target = symmetric ? 1 : 0;
    const duration = 650 * Math.abs(target - from);
    const start = performance.now();
    let frame = 0;
    const update = (value: number) => {
      position.current = value;
      setProgress(value);
    };
    const finish = () => {
      cancelAnimationFrame(frame);
      update(target);
    };
    const animate = (now: number) => {
      const elapsed = Math.min(1, (now - start) / duration);
      const eased = elapsed * elapsed * (3 - 2 * elapsed);
      update(elapsed === 1 ? target : from + (target - from) * eased);
      if (elapsed < 1) frame = requestAnimationFrame(animate);
    };
    const onMotionChange = () => {
      if (media.matches) finish();
    };
    if (media.matches || duration === 0) finish();
    else frame = requestAnimationFrame(animate);
    media.addEventListener("change", onMotionChange);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", onMotionChange);
    };
  }, [symmetric]);

  const toggle = (before: K8Target | null) => {
    restoreSelection(before);
    setSymmetric((value) => !value);
  };
  const cancelTouch = () => {
    touchStart.current = null;
    previousTap.current = null;
  };

  return {
    progress,
    symmetric,
    handlers: {
      onClickCapture(event: MouseEvent<SVGSVGElement>) {
        const now = performance.now();
        doubleClick.current = null;
        if (now < ignoreClickUntil.current) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        const previous = previousClick.current;
        // The browser may report dblclick at a slower, OS-defined interval.
        // Outside our shorter window, both clicks keep their normal action.
        if (event.detail > 1 && event.detail % 2 === 0 && previous && now - previous.time <= DOUBLE_PRESS_INTERVAL) {
          doubleClick.current = previous;
          previousClick.current = null;
          event.preventDefault();
          event.stopPropagation();
        } else previousClick.current = { time: now, selection };
      },
      onDoubleClick(event: MouseEvent<SVGSVGElement>) {
        event.preventDefault();
        event.stopPropagation();
        const candidate = doubleClick.current;
        doubleClick.current = null;
        if (candidate && performance.now() >= ignoreDoubleClickUntil.current) toggle(candidate.selection);
      },
      onPointerDown(event: PointerEvent<SVGSVGElement>) {
        ignoreClickUntil.current = 0;
        if (event.pointerType !== "touch") return;
        if (!event.isPrimary) {
          cancelTouch();
          return;
        }
        touchStart.current = { x: event.clientX, y: event.clientY, time: performance.now(), selection };
      },
      onPointerMove(event: PointerEvent<SVGSVGElement>) {
        const start = touchStart.current;
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) cancelTouch();
      },
      onPointerCancel: cancelTouch,
      onPointerUp(event: PointerEvent<SVGSVGElement>) {
        if (event.pointerType !== "touch") return;
        const start = touchStart.current;
        touchStart.current = null;
        const now = performance.now();
        if (!start || now - start.time > MAX_TAP_DURATION || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) {
          previousTap.current = null;
          return;
        }
        const previous = previousTap.current;
        if (
          previous &&
          now - previous.time <= DOUBLE_PRESS_INTERVAL &&
          Math.hypot(start.x - previous.x, start.y - previous.y) <= TAP_SLOP
        ) {
          event.preventDefault();
          previousTap.current = null;
          // Some browsers synthesize both click and dblclick after touch.
          ignoreClickUntil.current = now + 500;
          ignoreDoubleClickUntil.current = now + 500;
          toggle(previous.selection);
        } else previousTap.current = { ...start, time: now };
      },
    },
  };
}
