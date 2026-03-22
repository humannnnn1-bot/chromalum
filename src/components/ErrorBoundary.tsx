import React, { Component } from "react";

interface Props { children: React.ReactNode; }
interface State { error: Error | null; }

const STORAGE_KEY = "chromalum_lang";

function getLabel(ja: string, en: string): string {
  const lang = localStorage.getItem(STORAGE_KEY);
  return lang === "en" ? en : ja;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("CHROMALUM ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, textAlign: "center", color: "#fff", background: "#1a1a2e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h2 style={{ marginBottom: 12 }}>{getLabel("エラーが発生しました", "An error occurred")}</h2>
          <p style={{ color: "#aaa", fontSize: 14, marginBottom: 16 }}>{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })} style={{ padding: "8px 20px", background: "#4060c0", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 }}>
            {getLabel("再試行", "Retry")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
