import React from "react";
import { THEORY_LEVELS, GRAY_PATH, GRAY_TOGGLES, GRAY_POINTS } from "../../data/theory-data";
import { C, FS, FW } from "../../styles/tokens";
import { S_CURSOR_POINTER } from "../../styles/shared";
import { useTranslation } from "../../i18n";

const W = 300,
  H = 300;
const DOT_R = 16;
const CHANNEL_COLORS: Record<string, string> = { G: "#00ff00", R: "#ff0000", B: "#0000ff" };

interface Props {
  selectedEdge: number;
  direction: 1 | -1;
  onSelectEdge: (edge: number) => void;
  hlLevel: number | null;
  onHover: (lv: number | null) => void;
  controls?: React.ReactNode;
}

export const GrayCodeHex = React.memo(function GrayCodeHex({ selectedEdge, direction, onSelectEdge, hlLevel, onHover, controls }: Props) {
  const { t } = useTranslation();
  const currentLv = GRAY_PATH[direction === 1 ? selectedEdge : (selectedEdge + 1) % 6];
  const nextLv = GRAY_PATH[direction === 1 ? (selectedEdge + 1) % 6 : selectedEdge];
  const toggle = GRAY_TOGGLES[selectedEdge];
  const toggleColor = CHANNEL_COLORS[toggle];
  const currentEdgeStep = selectedEdge;

  const currentBits = THEORY_LEVELS[currentLv].bits;

  return (
    <div className="theory-hue-cycle">
      <div className="theory-diagram-label">{t("theory_gray_title")}</div>
      <div className="theory-hue-cycle-plot">
        <svg viewBox={`0 0 ${W} ${H}`} className="theory-hue-cycle-svg" role="group" aria-label={t("theory_gray_title")}>
          {/* Edges */}
          {GRAY_PATH.map((lv, i) => {
            const nLv = GRAY_PATH[(i + 1) % 6];
            const p0 = GRAY_POINTS[lv],
              p1 = GRAY_POINTS[nLv];
            const tg = GRAY_TOGGLES[i];
            const tgColor = CHANNEL_COLORS[tg];
            const isCurrentEdge = i === currentEdgeStep;
            const mx = (p0.x + p1.x) / 2,
              my = (p0.y + p1.y) / 2;
            const dx = mx - 150,
              dy = my - 150;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const lx = mx + (dx / dist) * 18,
              ly = my + (dy / dist) * 18;
            return (
              <g
                key={"ge" + i}
                data-cycle-edge={i}
                data-hue-selected={isCurrentEdge}
                role="button"
                tabIndex={0}
                aria-pressed={isCurrentEdge}
                aria-label={t("theory_hue_select_edge", THEORY_LEVELS[lv].short + "–" + THEORY_LEVELS[nLv].short)}
                onClick={() => onSelectEdge(i)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (!event.repeat) onSelectEdge(i);
                  }
                }}
                style={S_CURSOR_POINTER}
              >
                <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="transparent" strokeWidth={24} />
                <line
                  x1={p0.x}
                  y1={p0.y}
                  x2={p1.x}
                  y2={p1.y}
                  stroke={isCurrentEdge ? tgColor : C.textDimmer}
                  strokeWidth={isCurrentEdge ? 2.5 : 1.2}
                  opacity={isCurrentEdge ? 0.9 : 0.35}
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={FS.md}
                  fontFamily="var(--font-mono)"
                  fontWeight={FW.bold}
                  fill={tgColor}
                  opacity={isCurrentEdge ? 1 : 0.5}
                >
                  {tg}
                </text>
              </g>
            );
          })}

          {/* Direction arrow */}
          {(() => {
            const p0 = GRAY_POINTS[currentLv],
              p1 = GRAY_POINTS[nextLv];
            const mx = (p0.x + p1.x) / 2,
              my = (p0.y + p1.y) / 2;
            const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
            const s = 6;
            return (
              <polygon
                points={`${mx},${my} ${mx - s * Math.cos(angle - 0.5)},${my - s * Math.sin(angle - 0.5)} ${mx - s * Math.cos(angle + 0.5)},${my - s * Math.sin(angle + 0.5)}`}
                fill={toggleColor}
                opacity={0.8}
              />
            );
          })()}

          {/* Vertices */}
          {GRAY_PATH.map((lv) => {
            const p = GRAY_POINTS[lv];
            const info = THEORY_LEVELS[lv];
            const isCurrent = lv === currentLv;
            const isHl = hlLevel === lv;
            return (
              <g
                key={"gv" + lv}
                onMouseEnter={() => onHover(lv)}
                onMouseLeave={() => onHover(null)}
                onClick={() => {
                  const index = GRAY_PATH.indexOf(lv as (typeof GRAY_PATH)[number]);
                  onSelectEdge(direction === 1 ? index : (index + 5) % 6);
                  onHover(null);
                }}
                style={S_CURSOR_POINTER}
              >
                {(isCurrent || isHl) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={DOT_R + 5}
                    fill="none"
                    stroke={isCurrent ? toggleColor : "rgba(255,255,255,0.4)"}
                    strokeWidth={2}
                    opacity={0.7}
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={DOT_R}
                  fill={info.color}
                  fillOpacity={0.85}
                  stroke="#fff"
                  strokeWidth={isCurrent ? 2.5 : 1.5}
                  strokeOpacity={0.8}
                />
                <text
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={FS.md}
                  fontWeight={900}
                  fontFamily="var(--font-mono)"
                  fill={lv >= 4 ? "#000" : "#fff"}
                >
                  {info.bits.join("")}
                </text>
                {(() => {
                  const angle = Math.atan2(p.y - 150, p.x - 150);
                  return (
                    <text
                      x={p.x + 28 * Math.cos(angle)}
                      y={p.y + 28 * Math.sin(angle)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={FS.sm}
                      fontFamily="var(--font-mono)"
                      fontWeight={FW.bold}
                      fill={info.color}
                      opacity={0.8}
                    >
                      {info.short}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* Bit visualization in center */}
          {(() => {
            const cx = 150,
              cy = controls ? 120 : 150;
            const bitW = 14;
            const chNames = ["G", "R", "B"];
            const toggleIdx = toggle === "G" ? 0 : toggle === "R" ? 1 : 2;
            return (
              <g className="theory-hue-bits">
                {currentBits.map((bit, bi) => {
                  const bx = cx + (bi - 1) * (bitW + 4);
                  const chColor = CHANNEL_COLORS[chNames[bi]];
                  const isToggling = bi === toggleIdx;
                  return (
                    <g key={"bit" + bi}>
                      <circle
                        cx={bx}
                        cy={cy - 12}
                        r={5}
                        fill={bit ? chColor : "none"}
                        stroke={chColor}
                        strokeWidth={bit ? 0 : 1}
                        fillOpacity={0.8}
                        opacity={bit ? 1 : 0.3}
                      />
                      {isToggling && <circle cx={bx} cy={cy - 12} r={7} fill="none" stroke={toggleColor} strokeWidth={1.5} opacity={0.8} />}
                    </g>
                  );
                })}
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize={FS.xs}
                  fontFamily="var(--font-mono)"
                  fill={toggleColor}
                  fontWeight={FW.bold}
                >
                  {t("theory_gray_toggle", toggle)}
                </text>
              </g>
            );
          })()}
        </svg>
        {controls}
      </div>
    </div>
  );
});
