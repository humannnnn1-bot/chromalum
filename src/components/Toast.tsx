import React from "react";

interface ToastProps {
  message: string;
  type: "error" | "success" | "info";
}

export function Toast({ message, type }: ToastProps) {
  if (!message) return null;
  const bg = type === "error" ? "#ff4060" : type === "success" ? "#40cc60" : "#6080ff";
  return (
    <div role="alert" style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      padding: "8px 20px", borderRadius: 6, background: bg, color: "#fff",
      fontSize: 12, fontFamily: "monospace", fontWeight: 700, zIndex: 2000,
      boxShadow: "0 4px 20px rgba(0,0,0,.5)", pointerEvents: "none",
      animation: "toast-in .25s ease-out",
    }}>{message}</div>
  );
}
