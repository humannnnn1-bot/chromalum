import React, { memo } from "react";
import { LEVEL_INFO, LEVEL_CANDIDATES } from "../color-engine";
import { rgbStr, hexStr } from "../utils";
import { S_NAV_ARROW, S_SWATCH } from "../styles";
import type { ColorAction } from "../color-reducer";
import { useTranslation } from "../i18n";

interface Props {
  cc: number[];
  dispatch: React.Dispatch<ColorAction>;
  brushLevel: number;
}

export const ColorMappingList = memo(function ColorMappingList({ cc, dispatch, brushLevel }: Props) {
  const { t } = useTranslation();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
      {LEVEL_INFO.map((info, i) => {
        const alts = LEVEL_CANDIDATES[i], ci = cc[i] % alts.length, cur = alts[ci], has = alts.length > 1;
        const isActive = brushLevel === i;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 6px",
            background: isActive ? "#1a1a30" : "#0f0f20", borderRadius: 4,
            border: isActive ? "1px solid #4060aa" : "1px solid transparent", transition: "border-color .15s" }}>
            <div style={{ width: 18, height: 18, borderRadius: 3,
              background: `rgb(${info.gray},${info.gray},${info.gray})`,
              border: "1px solid #2a2a40", flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "#5a5a7a", width: 44 }}>L{i} {info.name.slice(0, 3)}</span>
            {has && <button onClick={() => dispatch({ type: "cycle_color", lv: i, dir: -1 })}
              aria-label={t("aria_prev_color", i, info.name)} style={S_NAV_ARROW}>◀</button>}
            <div style={{ width: 28, height: 20, borderRadius: 3, background: rgbStr(cur.rgb),
              border: "1px solid #3a3a5a", flexShrink: 0 }} />
            {has && <button onClick={() => dispatch({ type: "cycle_color", lv: i, dir: 1 })}
              aria-label={t("aria_next_color", i, info.name)} style={S_NAV_ARROW}>▶</button>}
            <span style={{ fontSize: 8, color: "#6a6a8a" }}>{hexStr(cur.rgb)}</span>
            {has && <span style={{ fontSize: 7, color: "#5a5a6a", marginLeft: 2 }}>{cur.hueLabel}</span>}
            {has && <div style={{ display: "flex", gap: 3, marginLeft: "auto" }}>
              {alts.map((a, j) =>
                <button key={j}
                  onClick={() => dispatch({ type: "set_color", lv: i, idx: j })}
                  title={`${hexStr(a.rgb)} ${a.hueLabel}`}
                  aria-label={t("aria_color_candidate", i, hexStr(a.rgb), a.hueLabel)}
                  style={{ ...S_SWATCH, width: 16, height: 16, borderRadius: 3, background: rgbStr(a.rgb),
                    border: j === ci ? "2px solid #fff" : "1px solid #2a2a40",
                    opacity: j === ci ? 1 : .5 }} />)}
            </div>}
          </div>);
      })}
    </div>
  );
}, (prev, next) =>
  prev.brushLevel === next.brushLevel &&
  prev.dispatch === next.dispatch &&
  prev.cc.length === next.cc.length &&
  prev.cc.every((v, i) => v === next.cc[i])
);
