import React, { useState, useCallback } from "react";
import {
  THEORY_LEVELS,
  CUBE_EDGES,
  STELLA_EDGES,
  K8_EXPLORER_POINTS,
  COMPLEMENT_EDGES,
  TETRA_T0_EDGES,
  hammingDist,
} from "../../data/theory-data";
import { C, FS, FW, SP, FONT } from "../../styles/tokens";
import { S_BTN, S_CURSOR_POINTER } from "../../styles/shared";
import { usePinReset } from "./pin-reset";
import { useTranslation } from "../../i18n";
import { K8DistanceComparison, K8MaskControls } from "./K8Relations";

const VW = 320; // single-view width
const VR = 6.3;
const HIT_R = 14;

/* ── K₈ edge color coding ── */
const K8_Q3_COLOR = "#60aaff";
const K8_STELLA_COLOR = "#ffaa60";
const K8_M4_COLOR = "#ff6080";
const STELLA_T0_COLOR = "#ffd36e";
const STELLA_T1_COLOR = "#90c8ff";

type ViewMode = "nodes" | "cube" | "stella" | "complement" | "k8";
type ComparisonPair = [] | [number] | [number, number];

interface Props {
  hlLevel: number | null;
  onHover: (lv: number | null) => void;
}

export const StellaOctangula = React.memo(function StellaOctangula({ hlLevel, onHover }: Props) {
  const { t } = useTranslation();
  const [pinned, setPinned] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("stella");
  const [comparisonPair, setComparisonPair] = useState<ComparisonPair>([]);
  const [mask, setMask] = useState<number | null>(null);
  const maskMode = mask !== null;
  const nodesOnly = viewMode === "nodes";
  const distanceMode = nodesOnly ? "none" : viewMode === "cube" ? 1 : viewMode === "complement" ? 3 : viewMode === "k8" ? "all" : 2;

  const resetSelection = useCallback((_value: null) => {
    setPinned(null);
    setComparisonPair([]);
  }, []);
  usePinReset(resetSelection);

  const comparisonA = comparisonPair[0] ?? null;
  const comparisonB = comparisonPair[1] ?? null;
  const comparisonMask = comparisonA !== null && comparisonB !== null ? comparisonA ^ comparisonB : null;
  const comparisonDistance = comparisonA !== null && comparisonB !== null ? hammingDist(comparisonA, comparisonB) : null;
  const comparisonActive = viewMode === "k8" && comparisonA !== null;
  const comparisonComplete = comparisonActive && comparisonB !== null && comparisonMask !== null && comparisonDistance !== null;

  const externalHl = hlLevel !== null && hlLevel >= 0 && hlLevel <= 7 ? hlLevel : null;
  const hl = comparisonActive ? comparisonA : (externalHl ?? pinned);

  const onEnter = useCallback((lv: number) => onHover(lv), [onHover]);
  const onLeave = useCallback(() => onHover(null), [onHover]);
  const onTap = useCallback(
    (lv: number) => {
      if (viewMode === "k8") {
        setPinned(null);
        setComparisonPair((current) => {
          if (current.length === 0) return [lv];
          if (current.length === 1) return current[0] === lv ? [] : [current[0], lv];
          if (current[0] === lv) return [];
          if (current[1] === lv) return [current[0]];
          return [current[0], lv];
        });
        queueMicrotask(() => onHover(null));
        return;
      }
      setPinned((prev) => {
        const next = prev === lv ? null : lv;
        queueMicrotask(() => onHover(next));
        return next;
      });
    },
    [onHover, viewMode],
  );

  const clearSelection = useCallback(() => {
    setPinned(null);
    setComparisonPair([]);
    onHover(null);
  }, [onHover]);

  const selectViewMode = useCallback(
    (nextMode: ViewMode) => {
      clearSelection();
      setMask(null);
      setViewMode(nextMode);
    },
    [clearSelection],
  );

  const selectMask = useCallback(
    (nextMask: number) => {
      clearSelection();
      setMask((previous) => (previous === nextMask ? null : nextMask));
    },
    [clearSelection],
  );

  const hlQ3 = new Set<number>();
  const hlStella = new Set<number>();
  const hlM4 = new Set<number>();
  if (hl !== null) {
    CUBE_EDGES.forEach(([a, b], i) => {
      if (a === hl || b === hl) hlQ3.add(i);
    });
    STELLA_EDGES.forEach(([a, b], i) => {
      if (a === hl || b === hl) hlStella.add(i);
    });
    COMPLEMENT_EDGES.forEach(([a, b], i) => {
      if (a === hl || b === hl) hlM4.add(i);
    });
  }

  const isDistanceTwo = distanceMode === 2;

  const renderVertices = () =>
    THEORY_LEVELS.map((info) => {
      const lv = info.lv;
      const p = K8_EXPLORER_POINTS[lv];
      const comparisonRole = comparisonActive && comparisonA === lv ? "a" : comparisonComplete && comparisonB === lv ? "b" : null;
      const neighbour =
        !comparisonActive &&
        hl !== null &&
        lv !== hl &&
        !nodesOnly &&
        (maskMode ? (hl ^ lv) === mask : distanceMode === "all" || hammingDist(hl, lv) === distanceMode);
      const active = comparisonActive ? comparisonRole !== null : hl === lv || neighbour;
      const dim = maskMode ? false : comparisonActive ? !active : hl !== null && !active;
      const isComplement =
        !comparisonActive &&
        !nodesOnly &&
        (!maskMode || mask === 7) &&
        (distanceMode === 3 || distanceMode === "all") &&
        hl !== null &&
        (hl ^ 7) === lv;
      const vertexAriaLabel =
        comparisonRole === "a"
          ? t("theory_stella_compare_input_a_aria", info.short, lv, info.bits.join(""))
          : comparisonRole === "b"
            ? t("theory_stella_compare_input_b_aria", info.short, lv, info.bits.join(""))
            : `${info.short} · ${lv} · ${info.bits.join("")}`;

      const r = VR;

      return (
        <g
          key={`v-${lv}`}
          data-stella-vertex={lv}
          data-stella-dimmed={dim}
          data-stella-comparison-role={comparisonRole ?? undefined}
          role="button"
          tabIndex={0}
          aria-label={vertexAriaLabel}
          aria-pressed={comparisonActive ? comparisonRole !== null : pinned === lv}
          onMouseEnter={() => onEnter(lv)}
          onMouseLeave={onLeave}
          onFocus={() => onEnter(lv)}
          onBlur={onLeave}
          onClick={() => onTap(lv)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onTap(lv);
            }
          }}
          style={S_CURSOR_POINTER}
        >
          <title>{`${info.short} · L${lv} · ${info.bits.join("")}`}</title>
          <circle cx={p.x} cy={p.y} r={HIT_R} fill="transparent" />
          {neighbour && <circle cx={p.x} cy={p.y} r={r + 4} fill="none" stroke="#fff" strokeWidth={0.8} strokeOpacity={0.3} />}
          {comparisonRole && (
            <circle
              cx={p.x}
              cy={p.y}
              r={r + (comparisonRole === "b" ? 6 : 4)}
              fill="none"
              stroke="#fff"
              strokeWidth={comparisonRole === "b" ? 1.8 : 1.2}
              strokeDasharray={comparisonRole === "b" ? "3 2" : "none"}
            />
          )}
          <circle
            cx={p.x}
            cy={p.y}
            r={r}
            fill={lv === 0 ? C.bgRoot : info.color}
            fillOpacity={dim ? 0.2 : 1}
            stroke={isComplement ? "#fff" : active ? "#fff" : lv === 0 ? "#666" : info.color}
            strokeWidth={active ? 2 : 1}
            strokeOpacity={dim ? 0.2 : 0.9}
            strokeDasharray={isComplement ? "3 2" : "none"}
          />
          <text
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={5.4}
            fontFamily="var(--font-mono)"
            fontWeight={FW.bold}
            fill={dim ? C.textPrimary : lv >= 3 ? "#000" : "#fff"}
            opacity={dim ? 0.3 : 1}
          >
            {info.bits.join("")}
          </text>
          {comparisonRole && (
            <text
              x={p.x + r + 4}
              y={p.y - r - 3}
              textAnchor="middle"
              fontSize={FS.xxs}
              fontFamily="var(--font-mono)"
              fontWeight={FW.bold}
              fill="#fff"
            >
              {comparisonRole}
            </text>
          )}
        </g>
      );
    });

  const isComparedEdge = (a: number, b: number) =>
    comparisonComplete &&
    comparisonA !== null &&
    comparisonB !== null &&
    ((a === comparisonA && b === comparisonB) || (a === comparisonB && b === comparisonA));

  const renderGraph = () => (
    <>
      {maskMode &&
        [...CUBE_EDGES, ...STELLA_EDGES, ...COMPLEMENT_EDGES]
          .filter(([a, b]) => (a ^ b) === mask)
          .map(([a, b]) => (
            <line
              key={`mask-outline-${a}-${b}`}
              x1={K8_EXPLORER_POINTS[a].x}
              y1={K8_EXPLORER_POINTS[a].y}
              x2={K8_EXPLORER_POINTS[b].x}
              y2={K8_EXPLORER_POINTS[b].y}
              stroke="#e0e0f0"
              strokeWidth={3.4}
              opacity={0.5}
              aria-hidden="true"
            />
          ))}
      {(distanceMode === "all" || distanceMode === 1) &&
        CUBE_EDGES.map(([a, b], i) => {
          const compared = isComparedEdge(a, b);
          const matched = maskMode && (a ^ b) === mask;
          const active = maskMode ? matched : comparisonComplete ? compared : hlQ3.has(i);
          const dim = maskMode ? !matched : comparisonComplete ? !compared : hl !== null && !active;
          return (
            <line
              key={`q3-${i}`}
              data-k8-edge={`${a}-${b}`}
              data-k8-distance="1"
              data-k8-mask={a ^ b}
              data-k8-edge-active={active}
              x1={K8_EXPLORER_POINTS[a].x}
              y1={K8_EXPLORER_POINTS[a].y}
              x2={K8_EXPLORER_POINTS[b].x}
              y2={K8_EXPLORER_POINTS[b].y}
              stroke={
                matched
                  ? THEORY_LEVELS[mask].color
                  : compared && comparisonMask !== null
                    ? THEORY_LEVELS[comparisonMask].color
                    : K8_Q3_COLOR
              }
              strokeWidth={matched ? 2.2 : compared ? 3.5 : active ? 2 : distanceMode === 1 ? 1.5 : 1}
              opacity={dim ? 0.1 : matched ? 1 : active ? 0.9 : distanceMode === 1 ? 0.75 : 0.4}
            />
          );
        })}
      {(distanceMode === "all" || distanceMode === 2) &&
        STELLA_EDGES.map(([a, b], i) => {
          const compared = isComparedEdge(a, b);
          const matched = maskMode && (a ^ b) === mask;
          const active = maskMode ? matched : comparisonComplete ? compared : hlStella.has(i);
          const dim = maskMode ? !matched : comparisonComplete ? !compared : hl !== null && !active;
          const edgeColor = isDistanceTwo ? (i < TETRA_T0_EDGES.length ? STELLA_T0_COLOR : STELLA_T1_COLOR) : K8_STELLA_COLOR;
          return (
            <line
              key={`st-${i}`}
              data-k8-edge={`${a}-${b}`}
              data-k8-distance="2"
              data-k8-mask={a ^ b}
              data-k8-edge-active={active}
              x1={K8_EXPLORER_POINTS[a].x}
              y1={K8_EXPLORER_POINTS[a].y}
              x2={K8_EXPLORER_POINTS[b].x}
              y2={K8_EXPLORER_POINTS[b].y}
              stroke={
                matched ? THEORY_LEVELS[mask].color : compared && comparisonMask !== null ? THEORY_LEVELS[comparisonMask].color : edgeColor
              }
              strokeWidth={matched ? 2.2 : compared ? 3.5 : active ? 2.2 : isDistanceTwo ? 1.5 : 1.2}
              strokeDasharray={isDistanceTwo || maskMode ? undefined : "5,3"}
              opacity={dim ? 0.1 : matched ? 1 : active ? 0.9 : isDistanceTwo ? 0.75 : 0.35}
            />
          );
        })}
      {(distanceMode === "all" || distanceMode === 3) &&
        COMPLEMENT_EDGES.map(([a, b], i) => {
          const compared = isComparedEdge(a, b);
          const matched = maskMode && (a ^ b) === mask;
          const active = maskMode ? matched : comparisonComplete ? compared : hlM4.has(i);
          const dim = maskMode ? !matched : comparisonComplete ? !compared : hl !== null && !active;
          return (
            <line
              key={`m4-${i}`}
              data-k8-edge={`${a}-${b}`}
              data-k8-distance="3"
              data-k8-mask={a ^ b}
              data-k8-edge-active={active}
              x1={K8_EXPLORER_POINTS[a].x}
              y1={K8_EXPLORER_POINTS[a].y}
              x2={K8_EXPLORER_POINTS[b].x}
              y2={K8_EXPLORER_POINTS[b].y}
              stroke={
                matched
                  ? THEORY_LEVELS[mask].color
                  : compared && comparisonMask !== null
                    ? THEORY_LEVELS[comparisonMask].color
                    : K8_M4_COLOR
              }
              strokeWidth={matched ? 2.2 : compared ? 3.5 : active ? 2.5 : 1.5}
              strokeDasharray={distanceMode === 3 || maskMode ? undefined : "2,4"}
              opacity={dim ? 0.1 : matched ? 1 : active ? 0.9 : distanceMode === 3 ? 0.8 : 0.3}
            />
          );
        })}
      {renderVertices()}
    </>
  );

  const comparisonParityA = comparisonA !== null ? hammingDist(0, comparisonA) % 2 : null;
  const comparisonParityB = comparisonB !== null ? hammingDist(0, comparisonB) % 2 : null;
  const comparisonLayerLabel =
    comparisonDistance === 1
      ? t("theory_stella_compare_distance_1")
      : comparisonDistance === 2
        ? t("theory_stella_compare_distance_2")
        : comparisonDistance === 3
          ? t("theory_stella_compare_distance_3")
          : null;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: SP.lg, width: "100%" }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && (comparisonPair.length > 0 || maskMode)) {
          clearSelection();
          setMask(null);
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <svg
          id="theory-stella-view"
          data-stella-mode={viewMode}
          data-stella-distance={distanceMode}
          data-stella-mask={maskMode ? mask : undefined}
          viewBox="12 -12 156 148"
          style={{ width: "100%", maxWidth: VW }}
          role="group"
          aria-label={t("theory_stella_title")}
        >
          {renderGraph()}
        </svg>
      </div>

      {/* Annotation below SVG — fixed height to prevent layout shift on mode toggle */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {maskMode ? (
          <p className="theory-k8-mask-caption">{t("theory_k8_mask_result", THEORY_LEVELS[mask].bits.join(""), hammingDist(0, mask))}</p>
        ) : viewMode === "k8" ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: FS.xxs, fontFamily: FONT.mono, margin: 0 }}>
              <span style={{ color: K8_Q3_COLOR }}>Q&#x2083;(12)</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}> + </span>
              <span style={{ color: K8_STELLA_COLOR }}>2K&#x2084;(12)</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}> + </span>
              <span style={{ color: K8_M4_COLOR }}>M&#x2084;(4)</span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}> = 28</span>
            </p>
            <p style={{ fontSize: FS.xxs, fontFamily: FONT.mono, color: C.textDimmer, margin: 0 }}>{t("theory_stella_k8_degree")}</p>
          </div>
        ) : nodesOnly ? (
          <p style={{ fontSize: FS.lg, fontFamily: FONT.mono, color: C.textMuted, margin: 0, textAlign: "center" }}>
            {t("theory_stella_nodes_annotation")}
          </p>
        ) : (
          <p style={{ fontSize: FS.lg, fontFamily: FONT.mono, color: C.textMuted, margin: 0, textAlign: "center" }}>
            {t(
              viewMode === "cube"
                ? "theory_stella_distance_1_annotation"
                : viewMode === "stella"
                  ? "theory_stella_distance_2_annotation"
                  : "theory_stella_distance_3_annotation",
            )}
          </p>
        )}
      </div>

      <div className="theory-k8-controls">
        <div
          role="group"
          aria-label={t("theory_stella_distance_modes")}
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: SP.md }}
        >
          {(
            [
              { mode: "nodes", label: "theory_stella_nodes", color: C.accentBright },
              { mode: "cube", label: "theory_stella_distance_1", color: K8_Q3_COLOR },
              { mode: "stella", label: "theory_stella_distance_2", color: K8_STELLA_COLOR },
              { mode: "complement", label: "theory_stella_distance_3", color: K8_M4_COLOR },
              { mode: "k8", label: "theory_stella_distance_all", color: C.accentBright },
            ] as const
          ).map(({ mode, label, color }) => (
            <button
              key={mode}
              className="theory-annotation theory-diagram-button"
              type="button"
              aria-controls="theory-stella-view"
              aria-pressed={viewMode === mode}
              onClick={() => selectViewMode(mode)}
              style={{
                ...S_BTN,
                whiteSpace: "nowrap",
                borderColor: viewMode === mode ? color : C.border,
                color: viewMode === mode ? color : C.textMuted,
              }}
            >
              {t(label)}
            </button>
          ))}
        </div>

        {(distanceMode === 1 || distanceMode === 2) && <K8MaskControls distance={distanceMode} selectedMask={mask} onSelect={selectMask} />}
      </div>

      {viewMode === "k8" && (
        <div className="theory-k8-comparison-status" data-testid="stella-comparison-status" role="status" aria-live="polite">
          {comparisonA === null ? (
            t("theory_stella_compare_select_first")
          ) : !comparisonComplete || comparisonB === null || comparisonMask === null || comparisonDistance === null ? (
            t("theory_stella_compare_select_second", THEORY_LEVELS[comparisonA].short)
          ) : (
            <>
              <div style={{ color: C.textPrimary }}>
                {THEORY_LEVELS[comparisonA].short}
                <sub>{comparisonA}</sub> · {THEORY_LEVELS[comparisonA].bits.join("")} ⊕ {THEORY_LEVELS[comparisonB].short}
                <sub>{comparisonB}</sub> · {THEORY_LEVELS[comparisonB].bits.join("")} = {THEORY_LEVELS[comparisonMask].short}
                <sub>{comparisonMask}</sub> · {THEORY_LEVELS[comparisonMask].bits.join("")}
              </div>
              <div style={{ marginTop: SP.xs }}>
                d<sub>H</sub> = wt({THEORY_LEVELS[comparisonMask].bits.join("")}) = {comparisonDistance} · {comparisonLayerLabel}
              </div>
              <div style={{ marginTop: SP.xs }}>
                |ΔL| = |{comparisonB} − {comparisonA}| = {Math.abs(comparisonB - comparisonA)}
              </div>
              <div style={{ marginTop: SP.xs, fontSize: 11 }}>
                π({THEORY_LEVELS[comparisonA].short})={comparisonParityA} ({comparisonParityA === 0 ? "T0" : "T1"}) · π(
                {THEORY_LEVELS[comparisonB].short})={comparisonParityB} ({comparisonParityB === 0 ? "T0" : "T1"})
              </div>
              <div style={{ marginTop: SP.xs, fontSize: 11, color: C.textMuted }}>{t("theory_stella_compare_parity_note")}</div>
            </>
          )}
        </div>
      )}
      <K8DistanceComparison />
    </div>
  );
});
