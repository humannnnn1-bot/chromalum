import React, { useState } from "react";
import { K8_EXPLORER_POINTS, STELLA_EDGES, THEORY_LEVELS, hammingDist } from "../../data/theory-data";
import { useTranslation } from "../../i18n";
import { S_BTN } from "../../styles/shared";
import { C, FONT, FS, FW, SP } from "../../styles/tokens";

const CENTER = {
  x: (K8_EXPLORER_POINTS[0].x + K8_EXPLORER_POINTS[7].x) / 2,
  y: (K8_EXPLORER_POINTS[0].y + K8_EXPLORER_POINTS[7].y) / 2,
};
const NODE_R = 6.3;
const FACES = THEORY_LEVELS.map(({ lv }) => ({
  omitted: lv,
  tetra: hammingDist(0, lv) % 2,
  vertices: THEORY_LEVELS.filter((info) => hammingDist(lv, info.lv) === 2).map((info) => info.lv),
})).sort((a, b) => a.tetra - b.tetra || a.omitted - b.omitted);

const S_CELL: React.CSSProperties = { padding: `${SP.sm}px ${SP.lg}px`, textAlign: "center" };
const S_ROW_LABEL: React.CSSProperties = { ...S_CELL, textAlign: "left", fontWeight: FW.normal };

export const TetraFaceDuality = React.memo(function TetraFaceDuality() {
  const { t } = useTranslation();
  // The R/G/W face is the example used in the accompanying prose.
  const [omitted, setOmitted] = useState(1);
  const face = FACES.find((candidate) => candidate.omitted === omitted)!;
  const [a, b, c] = face.vertices;
  const xor = a ^ b ^ c;
  const majority = (a & b) | (b & c) | (c & a);
  const majorityPoint = K8_EXPLORER_POINTS[majority];
  const centroid = face.vertices.reduce(
    (sum, lv) => ({ x: sum.x + K8_EXPLORER_POINTS[lv].x / 3, y: sum.y + K8_EXPLORER_POINTS[lv].y / 3 }),
    { x: 0, y: 0 },
  );
  const dx = majorityPoint.x - CENTER.x;
  const dy = majorityPoint.y - CENTER.y;
  const length = Math.hypot(dx, dy);
  const faceNames = face.vertices.map((lv) => THEORY_LEVELS[lv].short).join(", ");
  const faceColor = face.tetra === 0 ? "#ffd36e" : "#90c8ff";
  const ones = [0, 1, 2].map((channel) => face.vertices.reduce((sum, lv) => sum + THEORY_LEVELS[lv].bits[channel], 0));
  const rows = [
    ...face.vertices.map((lv) => ({
      key: `input-${lv}`,
      label: t("theory_tetra_face_input", THEORY_LEVELS[lv].short),
      bits: THEORY_LEVELS[lv].bits,
    })),
    { key: "count", label: t("theory_tetra_face_ones"), bits: ones },
    { key: "xor", label: `XOR → ${THEORY_LEVELS[xor].short}`, bits: THEORY_LEVELS[xor].bits },
    { key: "majority", label: `${t("theory_tetra_face_majority")} → ${THEORY_LEVELS[majority].short}`, bits: THEORY_LEVELS[majority].bits },
  ];

  return (
    <figure
      data-testid="tetra-face-duality"
      style={{ margin: `${SP["2xl"]}px auto 0`, display: "flex", flexDirection: "column", alignItems: "center", gap: SP.xl, width: "100%" }}
    >
      <svg
        viewBox="12 -12 156 148"
        role="img"
        aria-label={t("theory_tetra_face_aria", faceNames, THEORY_LEVELS[xor].bits.join(""), THEORY_LEVELS[majority].bits.join(""))}
        style={{ width: "100%", maxWidth: 320 }}
      >
        {STELLA_EDGES.map(([from, to]) => {
          const active = face.vertices.includes(from) && face.vertices.includes(to);
          return (
            <line
              key={`${from}-${to}`}
              data-tetra-face-edge={`${from}-${to}`}
              data-face-boundary={active}
              x1={K8_EXPLORER_POINTS[from].x}
              y1={K8_EXPLORER_POINTS[from].y}
              x2={K8_EXPLORER_POINTS[to].x}
              y2={K8_EXPLORER_POINTS[to].y}
              stroke={active ? faceColor : C.textDimmer}
              strokeWidth={active ? 1.8 : 0.7}
              opacity={active ? 0.95 : 0.18}
            />
          );
        })}
        {/* This auxiliary ray uses the same orthographic projection as the vertices. */}
        <line
          data-centroid-ray={majority}
          x1={CENTER.x}
          y1={CENTER.y}
          x2={majorityPoint.x}
          y2={majorityPoint.y}
          stroke="#fff"
          strokeWidth={0.8}
          strokeDasharray="2 2"
          opacity={0.7}
        />
        <line x1={CENTER.x} y1={CENTER.y} x2={centroid.x} y2={centroid.y} stroke="#fff" strokeWidth={1.5} />
        {[
          { key: "center", point: CENTER, labelX: CENTER.x - (dx / length) * 7, labelY: CENTER.y - (dy / length) * 7 },
          { key: "centroid", point: centroid, labelX: centroid.x - (dy / length) * 7, labelY: centroid.y + (dx / length) * 7 },
        ].map(({ key, point, labelX, labelY }) => (
          <g key={key} data-tetra-marker={key}>
            <line x1={point.x - 1.8} y1={point.y} x2={point.x + 1.8} y2={point.y} stroke="#fff" strokeWidth={0.9} />
            <line x1={point.x} y1={point.y - 1.8} x2={point.x} y2={point.y + 1.8} stroke="#fff" strokeWidth={0.9} />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={6}
              fontFamily={FONT.mono}
              fill="#fff"
              stroke={C.bgRoot}
              strokeWidth={2}
              paintOrder="stroke"
            >
              {key === "center" ? "O" : "g"}
              {key === "centroid" && (
                <tspan baselineShift="sub" fontSize={4}>
                  F
                </tspan>
              )}
            </text>
          </g>
        ))}
        {THEORY_LEVELS.map((info) => {
          const point = K8_EXPLORER_POINTS[info.lv];
          const role = face.vertices.includes(info.lv) ? "input" : info.lv === xor ? "xor" : info.lv === majority ? "majority" : "context";
          const result = role === "xor" || role === "majority";
          const dim = role === "context";
          return (
            <g key={info.lv} data-tetra-face-vertex={info.lv} data-face-role={role}>
              <title>{`${info.short} · ${info.bits.join("")}`}</title>
              {result && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={NODE_R + 2.5}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={0.8}
                  strokeDasharray={role === "xor" ? "2 2" : undefined}
                />
              )}
              <circle
                cx={point.x}
                cy={point.y}
                r={NODE_R}
                fill={info.lv === 0 ? C.bgRoot : info.color}
                stroke={dim ? (info.lv === 0 ? C.textDimmer : info.color) : "#fff"}
                strokeWidth={dim ? 0.6 : 1}
                opacity={dim ? 0.25 : 1}
              />
              <text
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={5.4}
                fontFamily={FONT.mono}
                fontWeight={FW.bold}
                fill={dim ? C.textPrimary : info.lv >= 3 ? "#000" : "#fff"}
                opacity={dim ? 0.45 : 1}
              >
                {info.bits.join("")}
              </text>
              {result && (
                <text
                  x={point.x}
                  y={point.y + (point.y > CENTER.y ? 15 : -13)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={6.5}
                  fontFamily={FONT.mono}
                  fill="#fff"
                >
                  {role === "xor" ? "XOR" : "maj"}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <label style={{ display: "flex", alignItems: "center", gap: SP.xl, fontFamily: FONT.mono, fontSize: FS.lg }}>
        {t("theory_tetra_face_select")}
        <select
          value={omitted}
          onChange={(event) => setOmitted(Number(event.target.value))}
          style={{ ...S_BTN, fontFamily: FONT.mono, minHeight: 30 }}
        >
          {FACES.map((candidate) => (
            <option key={candidate.omitted} value={candidate.omitted}>
              {`T${candidate.tetra} · {${candidate.vertices.map((lv) => THEORY_LEVELS[lv].short).join(", ")}}`}
            </option>
          ))}
        </select>
      </label>
      <figcaption style={{ fontFamily: FONT.mono, fontSize: FS.lg, color: C.textMuted, textAlign: "center", lineHeight: 1.6 }}>
        {t("theory_tetra_face_centroid", THEORY_LEVELS[majority].short)}
      </figcaption>
      <div aria-live="polite" aria-atomic="true" style={{ width: "100%", maxWidth: 340 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: FONT.mono,
            fontSize: FS.lg,
            color: C.textPrimary,
            lineHeight: 1.6,
          }}
        >
          <caption style={{ color: C.textMuted, marginBottom: SP.md }}>{t("theory_tetra_face_table")}</caption>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <th scope="col" style={S_ROW_LABEL}>
                {t("theory_tetra_face_row")}
              </th>
              {["G", "R", "B"].map((channel) => (
                <th key={channel} scope="col" style={S_CELL}>
                  {channel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                data-face-bit-row={row.key}
                style={{ borderTop: row.key === "count" || row.key === "xor" ? `1px solid ${C.border}` : undefined }}
              >
                <th scope="row" style={S_ROW_LABEL}>
                  {row.label}
                </th>
                {row.bits.map((bit, channel) => (
                  <td key={channel} style={S_CELL}>
                    {bit}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
});
