import React, { useCallback, useState } from "react";
import { DICE_NET_FACES, THEORY_LEVELS } from "../../data/theory-data";
import { C, FONT } from "../../styles/tokens";
import { S_CURSOR_POINTER } from "../../styles/shared";
import { usePinReset } from "./pin-reset";
import { useTranslation } from "../../i18n";

interface Props {
  hlLevel: number | null;
  onHover: (lv: number | null) => void;
}

const PAIRS: [number, number][] = [
  [1, 6],
  [2, 5],
  [4, 3],
];

/* ── Hue-order 2-2-2 net ─────────────── */

const NET_CELL = 54;
const NET_PAD = 6;
const NET_DIAMOND_HALF = NET_CELL / Math.SQRT2;
const NET_W = NET_PAD * 2 + NET_DIAMOND_HALF * 7;
const NET_H = NET_PAD * 2 + NET_DIAMOND_HALF * 3;
const NET_Y_OFFSET = NET_PAD + NET_DIAMOND_HALF * 2;

function rotateNetPoint(x: number, y: number): { x: number; y: number } {
  return {
    x: NET_PAD + (x + y) / Math.SQRT2,
    y: NET_Y_OFFSET + (-x + y) / Math.SQRT2,
  };
}

const NET_FACES = DICE_NET_FACES.map(({ lv, col, row }) => {
  const center = rotateNetPoint((col + 0.5) * NET_CELL, (row + 0.5) * NET_CELL);
  const points = [
    `${center.x},${center.y - NET_DIAMOND_HALF}`,
    `${center.x + NET_DIAMOND_HALF},${center.y}`,
    `${center.x},${center.y + NET_DIAMOND_HALF}`,
    `${center.x - NET_DIAMOND_HALF},${center.y}`,
  ].join(" ");
  return { lv, center, points };
});

// Color abbreviations
const ABBR: Record<number, string> = { 0: "K", 1: "B", 2: "R", 3: "M", 4: "G", 5: "C", 6: "Y", 7: "W" };
const RANKED_ABBR: Record<number, string> = { 0: "K₀", 1: "B₁", 2: "R₂", 3: "M₃", 4: "G₄", 5: "C₅", 6: "Y₆", 7: "W₇" };

function bitsOf(lv: number): string {
  return lv.toString(2).padStart(3, "0");
}

function faceTextColor(lv: number): string {
  return lv === 1 ? "#fff" : "#000";
}

function onFaceKeyDown(event: React.KeyboardEvent<SVGGElement>, lv: number, onTap: (level: number) => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onTap(lv);
}

export const HueOrderNet = React.memo(function HueOrderNet({ hlLevel, onHover }: Props) {
  const { t } = useTranslation();
  const [pinned, setPinned] = useState<number | null>(null);
  usePinReset(setPinned);

  const enter = useCallback((lv: number) => onHover(lv), [onHover]);
  const leave = useCallback(() => onHover(null), [onHover]);
  const onTap = useCallback(
    (lv: number) => {
      setPinned((previous) => {
        const next = previous === lv ? null : lv;
        queueMicrotask(() => onHover(next));
        return next;
      });
    },
    [onHover],
  );

  const hl = hlLevel !== null && hlLevel >= 1 && hlLevel <= 6 ? hlLevel : pinned;

  return (
    <div data-testid="hue-order-net" className="theory-die-net">
      <p
        className="theory-annotation theory-die-net-sequence"
        style={{
          margin: 0,
          fontFamily: FONT.mono,
          fontSize: "var(--theory-net-caption-size, 11px)",
          color: C.textMuted,
          textAlign: "center",
        }}
      >
        {t("theory_dice_net_cut")}
      </p>
      <svg
        viewBox={`0 0 ${NET_W} ${NET_H}`}
        role="group"
        aria-label={t("theory_dice_net_aria")}
        style={{ display: "block", width: "min(100%, 360px)", overflow: "visible" }}
      >
        {NET_FACES.map(({ lv, center, points }, index) => {
          const info = THEORY_LEVELS[lv];
          const isComplement = hl !== null && (hl ^ 7) === lv;
          const active = hl === lv;
          const dim = hl !== null && !active && !isComplement;
          return (
            <g
              key={`hue-net-face-${lv}`}
              role="button"
              tabIndex={0}
              aria-label={`${ABBR[lv]} · ${lv} · ${bitsOf(lv)}`}
              aria-pressed={pinned === lv}
              data-hue-net-face={lv}
              data-hue-net-active={active}
              data-hue-order={index + 1}
              onMouseEnter={() => enter(lv)}
              onMouseLeave={leave}
              onFocus={() => enter(lv)}
              onBlur={leave}
              onClick={() => onTap(lv)}
              onKeyDown={(event) => onFaceKeyDown(event, lv, onTap)}
              style={S_CURSOR_POINTER}
            >
              <title>{`${ABBR[lv]} · L${lv} · ${bitsOf(lv)}`}</title>
              <polygon
                points={points}
                fill={info.color}
                fillOpacity={dim ? 0.45 : active ? 1 : 0.9}
                stroke="#151522"
                strokeWidth={1.2}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <text
                className="theory-die-net-name"
                x={center.x}
                y={center.y - 7}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-mono)"
                fontSize={16}
                fontWeight={700}
                fill={dim ? "#fff" : faceTextColor(lv)}
                opacity={dim ? 0.9 : 1}
                pointerEvents="none"
              >
                {RANKED_ABBR[lv]}
              </text>
              <text
                className="theory-die-net-bits"
                x={center.x}
                y={center.y + 10}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-mono)"
                fontSize={11}
                fontWeight={500}
                letterSpacing={0.5}
                fill={dim ? "#fff" : faceTextColor(lv)}
                opacity={0.85}
                pointerEvents="none"
              >
                {bitsOf(lv)}
              </text>
            </g>
          );
        })}
        <g aria-hidden="true" pointerEvents="none">
          {NET_FACES.filter(({ lv }) => hl !== null && (lv === hl || lv === (hl ^ 7))).map(({ lv, points }) => (
            <polygon
              key={`hue-net-outline-${lv}`}
              points={points}
              fill="none"
              stroke={lv === hl ? "#fff" : C.accentBright}
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
      <p
        className="theory-annotation theory-die-net-cut"
        data-hue-net-cut="3-2"
        data-from-level="3"
        data-to-level="2"
        data-edge-kind="cut"
        style={{
          margin: 0,
          fontFamily: FONT.mono,
          fontSize: "var(--theory-net-caption-size, 10px)",
          color: C.textDimmer,
          textAlign: "center",
        }}
      >
        {t("theory_dice_net_cut_edge")}
      </p>
    </div>
  );
});

export const ColorDice = React.memo(function ColorDice() {
  const { t } = useTranslation();

  return (
    <div role="group" aria-label={t("theory_dice_desc2")} data-testid="color-die-rank-structure" className="theory-die-ranks">
      <div className="theory-diagram-label">{t("theory_dice_pairs_title")}</div>
      <div className="theory-die-numbering">L(c) = 1…6 ↔ ⚀⚁⚂⚃⚄⚅</div>
      <div className="theory-die-pairs">
        {PAIRS.map(([a, b]) => (
          <div key={a} data-complement-pair={ABBR[a] + a + "-" + ABBR[b] + b} className="theory-die-pair">
            <span className="theory-die-face-label">
              <span aria-hidden="true" className="theory-die-swatch" style={{ background: THEORY_LEVELS[a].color }} />
              {RANKED_ABBR[a]}
            </span>
            <span>↔</span>
            <span className="theory-die-face-label">
              <span aria-hidden="true" className="theory-die-swatch" style={{ background: THEORY_LEVELS[b].color }} />
              {RANKED_ABBR[b]}
            </span>
            <span className="theory-die-pair-sum">
              {a} + {b} = 7
            </span>
          </div>
        ))}
      </div>
      <div className="theory-die-law">
        <span>L(c̄) = 7 − L(c)</span>
        <span>⇒ L(c) + L(c̄) = 7</span>
      </div>
    </div>
  );
});
