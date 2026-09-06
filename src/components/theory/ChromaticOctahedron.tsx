import React, { useState } from "react";
import { THEORY_LEVELS } from "../../data/theory-data";
import { useTranslation } from "../../i18n";
import { usePinReset } from "./pin-reset";
import { DUAL_OCTA_VERTICES, DUAL_OCTA_EDGES, DUAL_OCTA_FACES, projectDualPoint } from "./octahedron-dual-geometry";

type EdgeSelection = { readonly a: number; readonly b: number };
const XOR_ACCENT = "#82b6ff";
const COMPLEMENT_ACCENT = "#f6c26b";
const bitsOf = (lv: number) => THEORY_LEVELS[lv].bits.join("");
const sameEdge = (a: EdgeSelection | null, b: EdgeSelection) => a?.a === b.a && a.b === b.b;
const points = Object.fromEntries(Object.entries(DUAL_OCTA_VERTICES).map(([lv, point]) => [lv, projectDualPoint(point)]));

export const ChromaticOctahedron = React.memo(function ChromaticOctahedron() {
  const { t } = useTranslation();
  const [pinned, setPinned] = useState<EdgeSelection>({ a: 2, b: 4 });
  const [preview, setPreview] = useState<EdgeSelection | null>(null);
  usePinReset(setPreview);
  const selected = preview ?? pinned;
  const selectedEdge = DUAL_OCTA_EDGES.find((edge) => sameEdge(selected, edge))!;
  const activate = (edge: EdgeSelection) => {
    setPinned(edge);
    setPreview(null);
  };
  const interactions = (edge: EdgeSelection) => ({
    "aria-label": t("theory_octa_edge_choice", THEORY_LEVELS[edge.a].short, bitsOf(edge.a), THEORY_LEVELS[edge.b].short, bitsOf(edge.b)),
    "aria-pressed": sameEdge(selected, edge),
    onMouseEnter: () => setPreview(edge),
    onMouseLeave: () => setPreview(null),
    onFocus: () => setPreview(edge),
    onBlur: () => setPreview(null),
    onClick: () => activate(edge),
  });

  return (
    <div data-testid="chromatic-octahedron" className="theory-octahedron" role="group" aria-label={t("theory_octa_aria")}>
      <figure className="theory-octahedron-figure">
        <svg viewBox="85 75 230 250" role="group" aria-label={t("theory_octa_diagram")}>
          {[...DUAL_OCTA_FACES]
            .sort((a, b) => a.center[2] - b.center[2])
            .map((face) => {
              const edgeRole =
                selectedEdge?.xorFace.color === face.color
                  ? "xor"
                  : selectedEdge?.complementFace.color === face.color
                    ? "complement"
                    : undefined;
              const active = edgeRole !== undefined;
              const accent = edgeRole === "complement" ? COMPLEMENT_ACCENT : XOR_ACCENT;
              return (
                <polygon
                  key={face.color}
                  data-octa-surface-face={face.color}
                  data-face-verts={face.verts.join("-")}
                  data-active={active}
                  data-edge-face-role={edgeRole}
                  points={face.verts.map((lv) => points[lv].x + "," + points[lv].y).join(" ")}
                  fill={accent}
                  fillOpacity={active ? 0.18 : face.hidden || selectedEdge ? 0 : 0.025}
                  stroke={active ? accent : "none"}
                  strokeWidth={1.4}
                  strokeDasharray={face.hidden ? "4 4" : undefined}
                  pointerEvents="none"
                />
              );
            })}
          {DUAL_OCTA_EDGES.map((edge) => {
            const { a, b, hidden } = edge;
            const common = sameEdge(selected, edge);
            const xorSide = selectedEdge?.xorFace.verts.includes(a) && selectedEdge.xorFace.verts.includes(b);
            const complementSide = selectedEdge?.complementFace.verts.includes(a) && selectedEdge.complementFace.verts.includes(b);
            const active = common || xorSide || complementSide;
            return (
              <g
                key={a + "-" + b}
                data-octa-edge-control={a + "-" + b}
                className="theory-octahedron-edge"
                role="button"
                tabIndex={0}
                {...interactions(edge)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    activate(edge);
                  }
                }}
              >
                <line
                  className="theory-octahedron-edge-hit"
                  x1={points[a].x}
                  y1={points[a].y}
                  x2={points[b].x}
                  y2={points[b].y}
                  stroke="transparent"
                  strokeWidth={14}
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="stroke"
                />
                <line
                  data-octa-edge={a + "-" + b}
                  data-edge-selected={common}
                  data-hidden={hidden}
                  x1={points[a].x}
                  y1={points[a].y}
                  x2={points[b].x}
                  y2={points[b].y}
                  stroke={common ? "#fff" : xorSide ? XOR_ACCENT : complementSide ? COMPLEMENT_ACCENT : "#8296d8"}
                  strokeWidth={common ? 2 : active ? 1.5 : 1}
                  strokeDasharray={hidden ? "4 4" : undefined}
                  opacity={active ? 1 : selectedEdge ? 0.22 : hidden ? 0.45 : 0.8}
                  pointerEvents="none"
                />
              </g>
            );
          })}
          {Object.keys(DUAL_OCTA_VERTICES)
            .map(Number)
            .map((lv) => {
              const point = points[lv];
              const edgeRole = selectedEdge
                ? selectedEdge.xor === lv
                  ? "xor"
                  : selectedEdge.complement === lv
                    ? "complement"
                    : [selectedEdge.a, selectedEdge.b].includes(lv)
                      ? "input"
                      : undefined
                : undefined;
              const active = edgeRole !== undefined;
              return (
                <g
                  key={lv}
                  data-octa-vertex={lv}
                  data-edge-node-role={edgeRole}
                  pointerEvents="none"
                  opacity={selectedEdge && !active ? 0.4 : 1}
                >
                  <title>{THEORY_LEVELS[lv].short + " · " + bitsOf(lv)}</title>
                  {(edgeRole === "xor" || edgeRole === "complement") && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={10}
                      fill="none"
                      stroke={edgeRole === "xor" ? XOR_ACCENT : COMPLEMENT_ACCENT}
                      strokeWidth={1.75}
                    />
                  )}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={7}
                    fill={THEORY_LEVELS[lv].color}
                    stroke={active ? "#fff" : "#303044"}
                    strokeWidth={active ? 1.5 : 0.8}
                  />
                  <text
                    x={point.x}
                    y={point.y}
                    dominantBaseline="central"
                    textAnchor="middle"
                    fontSize={7}
                    fontWeight={700}
                    fill={lv >= 4 ? "#000" : "#fff"}
                  >
                    {THEORY_LEVELS[lv].short}
                  </text>
                </g>
              );
            })}
        </svg>
        <figcaption>{t("theory_octa_hint")}</figcaption>
      </figure>
      <div className="theory-octahedron-inspector">
        <p className="theory-octahedron-choice-label">{t("theory_octa_edge_choices")}</p>
        <div className="theory-octahedron-choices" role="group" aria-label={t("theory_octa_edge_choices")}>
          {DUAL_OCTA_EDGES.map((edge) => (
            <button key={edge.a + "-" + edge.b} type="button" {...interactions(edge)}>
              <span className="theory-octahedron-swatch" aria-hidden="true" style={{ background: THEORY_LEVELS[edge.a].color }} />
              {THEORY_LEVELS[edge.a].short}–{THEORY_LEVELS[edge.b].short}
              <span className="theory-octahedron-swatch" aria-hidden="true" style={{ background: THEORY_LEVELS[edge.b].color }} />
            </button>
          ))}
        </div>
        <div className="theory-octahedron-status" data-testid="octahedron-selection" role="status" aria-live="polite" aria-atomic="true">
          <strong>{t("theory_octa_edge_selected", THEORY_LEVELS[selectedEdge.a].short, THEORY_LEVELS[selectedEdge.b].short)}</strong>
          <div className="theory-octahedron-edge-results">
            {(
              [
                { kind: "xor", result: selectedEdge.xor, face: selectedEdge.xorFace, accent: XOR_ACCENT, parity: "000" },
                {
                  kind: "complement",
                  result: selectedEdge.complement,
                  face: selectedEdge.complementFace,
                  accent: COMPLEMENT_ACCENT,
                  parity: "111",
                },
              ] as const
            ).map(({ kind, result, face, accent, parity }) => (
              <div key={kind} data-edge-result={kind} className="theory-octahedron-edge-result" style={{ borderColor: accent }}>
                <strong style={{ color: accent }}>{t(kind === "xor" ? "theory_octa_edge_xor" : "theory_octa_edge_complement")}</strong>
                <span className="theory-octahedron-result-color">
                  <span className="theory-octahedron-swatch" aria-hidden="true" style={{ background: THEORY_LEVELS[result].color }} />
                  {THEORY_LEVELS[result].short} <code>{bitsOf(result)}</code>
                </span>
                <p>
                  <code>
                    {kind === "xor" ? "" : "¬("}
                    {bitsOf(selectedEdge.a)} ⊕ {bitsOf(selectedEdge.b)}
                    {kind === "xor" ? "" : ")"} = {bitsOf(result)}
                  </code>
                </p>
                <p>
                  {t("theory_octa_edge_triangle", face.verts.map((lv) => THEORY_LEVELS[lv].short).join(","))}
                  <br />
                  {t("theory_octa_edge_face_xor", parity)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
