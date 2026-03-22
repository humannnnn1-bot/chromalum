import React, { useState, memo } from "react";
import { LEVEL_CANDIDATES } from "../color-engine";
import { NUM_VERTICES } from "../constants";
import { HEX_VERTICES, HEX_EDGES, HEX_EDGE_COLORS, HEX_VERTEX_ALTS, HEX_EDGE_ALTS, HEX_DOTS, HEX_CX, HEX_CY, HEX_R, HEX_VP } from "../hex-data";
import type { ColorAction } from "../color-reducer";
import { useTranslation } from "../i18n";

interface Props {
  cc: number[];
  dispatch: React.Dispatch<ColorAction>;
  hist: number[];
  total: number;
}

export const HexDiag = memo(function HexDiag({ cc, dispatch, hist, total }: Props) {
  const { t } = useTranslation();
  const [hl, setHl] = useState<number | null>(null);
  const [focusedLv, setFocusedLv] = useState<number | null>(null);
  const vp = HEX_VP;
  const sel = (lv: number, ai: number) => dispatch({ type: "set_color", lv, idx: ai });
  const isA = (lv: number, ai: number) => (cc[lv] % LEVEL_CANDIDATES[lv].length) === ai;
  const dR = (lv: number, vertex: boolean) => {
    const base = vertex ? 15 : 8, mn = vertex ? 8 : 4, mx = vertex ? 50 : 30;
    const r = total > 0 ? hist[lv] / total : 0;
    return Math.min(mx, Math.max(mn, base * (.5 + r * 10)));
  };
  const actP = HEX_DOTS.filter(d => isA(d.lv, d.alt)).map(d => {
    let pos: { x: number; y: number };
    if (d.vi >= 0) pos = vp[d.vi];
    else {
      const e = HEX_EDGES[d.ei], p0 = vp[e.f], p1 = vp[e.t % NUM_VERTICES];
      const ts = Math.abs(HEX_VERTICES[e.f].lv - HEX_VERTICES[e.t % NUM_VERTICES].lv);
      if (ts === 0) return null;
      const t = (d.si + 1) / ts;
      pos = { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t };
    }
    return { ...pos, ang: Math.atan2(pos.y - HEX_CY, pos.x - HEX_CX) };
  }).filter((p): p is NonNullable<typeof p> => p !== null).sort((a, b) => a.ang - b.ang);
  const cp = actP.length > 1 ? actP.map((p, i) => (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ") + "Z" : "";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 400 440" style={{ width: "100%", maxWidth: 400 }} role="img" aria-label={t("hex_diagram_label")}>
        <rect width={400} height={440} fill="#0f0f1a" rx={6} />
        {HEX_VERTICES.map((_, i) => {
          const j = (i + 1) % NUM_VERTICES;
          return <line key={"e" + i} x1={vp[i].x} y1={vp[i].y} x2={vp[j].x} y2={vp[j].y} stroke="#2a2a4a" strokeWidth={1.5} />;
        })}
        {cp && <path d={cp} fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.3)" strokeWidth={1.5} strokeDasharray="6,4" />}
        {HEX_EDGES.map((e, ei) => {
          const p0 = vp[e.f], p1 = vp[e.t % NUM_VERTICES];
          const ts = Math.abs(HEX_VERTICES[e.f].lv - HEX_VERTICES[e.t % NUM_VERTICES].lv);
          if (ts === 0) return null;
          return e.lv.map((lv, li) => {
            const t = (li + 1) / ts, x = p0.x + (p1.x - p0.x) * t, y = p0.y + (p1.y - p0.y) * t;
            const dc = HEX_EDGE_COLORS[ei][li].hex, ai = HEX_EDGE_ALTS[ei][li], act = isA(lv, ai), r = dR(lv, false);
            const hov = hl === lv;
            return (
              <g key={"m" + ei + li} onMouseEnter={() => setHl(lv)} onMouseLeave={() => setHl(null)}
                onFocus={() => { setHl(lv); setFocusedLv(lv); }} onBlur={() => { setHl(null); setFocusedLv(null); }}
                onClick={() => sel(lv, ai)} style={{ cursor: "pointer" }}
                tabIndex={0} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); sel(lv, ai); } }}
                role="button" aria-label={`Level ${lv} (${dc})`}>
                {focusedLv === lv && <circle cx={x} cy={y} r={r + 8} fill="none" stroke="#6080ff" strokeWidth={2} />}
                {act && <circle cx={x} cy={y} r={r + 5} fill="none" stroke="#fff" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.7} />}
                {hov && !act && <circle cx={x} cy={y} r={r + 4} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1} />}
                <circle cx={x} cy={y} r={r} fill={dc} stroke={act ? "#fff" : dc} strokeWidth={act ? 2.5 : 1} opacity={hov || act ? 1 : 0.85} />
                <text x={x} y={y + 3.5} textAnchor="middle" fontSize={Math.max(7, r * .9)} fontWeight={700} fontFamily="monospace" fill={lv >= 4 ? "#000" : "#fff"}>{lv}</text>
              </g>);
          });
        })}
        {HEX_VERTICES.map((v, i) => {
          const p = vp[i], ai = HEX_VERTEX_ALTS[i], act = isA(v.lv, ai);
          const la = v.a * Math.PI / 180, lx = HEX_CX + (HEX_R + 28) * Math.cos(la), ly = HEX_CY + (HEX_R + 28) * Math.sin(la);
          const r = dR(v.lv, true);
          const hov = hl === v.lv;
          return (
            <g key={"v" + i} onMouseEnter={() => setHl(v.lv)} onMouseLeave={() => setHl(null)}
              onFocus={() => { setHl(v.lv); setFocusedLv(v.lv); }} onBlur={() => { setHl(null); setFocusedLv(null); }}
              onClick={() => sel(v.lv, ai)} style={{ cursor: "pointer" }}
              tabIndex={0} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); sel(v.lv, ai); } }}
              role="button" aria-label={`${v.c} - Level ${v.lv}`}>
              {focusedLv === v.lv && <circle cx={p.x} cy={p.y} r={r + 8} fill="none" stroke="#6080ff" strokeWidth={2} />}
              {act && <circle cx={p.x} cy={p.y} r={r + 5} fill="none" stroke="#fff" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.7} />}
              {hov && !act && <circle cx={p.x} cy={p.y} r={r + 4} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1} />}
              <circle cx={p.x} cy={p.y} r={r} fill={v.rgb} stroke={act ? "#fff" : v.rgb} strokeWidth={act ? 3 : 1} opacity={hov || act ? 1 : 0.85} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={Math.max(9, r * .7)} fontWeight={900} fontFamily="monospace" fill={v.lv >= 4 ? "#000" : "#fff"}>{v.lv}</text>
              <text x={lx} y={ly + 4} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="monospace" fill={v.rgb} opacity={0.9}>{v.c}</text>
            </g>);
        })}
        <text x={200} y={420} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#5a5a7a">{t("hex_luminance_seq")}</text>
      </svg>
    </div>
  );
}, (prev, next) => {
  if (prev.total !== next.total) return false;
  for (let i = 0; i < 8; i++) {
    if (prev.cc[i] !== next.cc[i]) return false;
    if (prev.hist[i] !== next.hist[i]) return false;
  }
  return true;
});
