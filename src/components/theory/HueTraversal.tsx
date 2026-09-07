import React, { useState } from "react";
import { GRAY_PATH, GRAY_TOGGLES, THEORY_LEVELS } from "../../data/theory-data";
import { useTranslation } from "../../i18n";
import { GrayCodeHex } from "./GrayCodeHex";
import { ToneZigzag } from "./ToneZigzag";

interface Props {
  hlLevel: number | null;
  onHover: (level: number | null) => void;
}

export const HueTraversal = React.memo(function HueTraversal({ hlLevel, onHover }: Props) {
  const { t } = useTranslation();
  const [{ selectedEdge, direction }, setTraversal] = useState<{ selectedEdge: number; direction: 1 | -1 }>({
    selectedEdge: 0,
    direction: 1,
  });

  const selectEdge = (edge: number) => {
    setTraversal((current) => ({ ...current, selectedEdge: edge }));
    onHover(null);
  };
  const step = (nextDirection: 1 | -1) => {
    setTraversal((current) => {
      // Continue from the selected edge's destination, including when changing direction.
      const start = current.direction === 1 ? current.selectedEdge + 1 : current.selectedEdge;
      return {
        selectedEdge: (start + (nextDirection === 1 ? 0 : -1) + GRAY_PATH.length) % GRAY_PATH.length,
        direction: nextDirection,
      };
    });
    onHover(null);
  };
  const from = GRAY_PATH[direction === 1 ? selectedEdge : (selectedEdge + 1) % 6];
  const to = GRAY_PATH[direction === 1 ? (selectedEdge + 1) % 6 : selectedEdge];
  const delta = to - from;

  return (
    <ToneZigzag
      hlLevel={hlLevel}
      onHover={onHover}
      selectedEdge={selectedEdge}
      direction={direction}
      onSelectEdge={selectEdge}
      companion={
        <div className="theory-hue-cycle-panel">
          <GrayCodeHex
            hlLevel={hlLevel}
            onHover={onHover}
            selectedEdge={selectedEdge}
            direction={direction}
            onSelectEdge={selectEdge}
            controls={
              <div className="theory-hue-controls">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={t("theory_hue_counterclockwise")}
                  title={t("theory_hue_counterclockwise")}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 10a9 9 0 1 1 2.64 8.36M3 4v6h6" />
                  </svg>
                </button>
                <button type="button" onClick={() => step(1)} aria-label={t("theory_hue_clockwise")} title={t("theory_hue_clockwise")}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 10a9 9 0 1 1 2.64 8.36M3 4v6h6" transform="translate(24 0) scale(-1 1)" />
                  </svg>
                </button>
              </div>
            }
          />
        </div>
      }
      status={
        <p className="theory-hue-status" role="status" aria-live="polite" data-hue-transition={`${from}-${to}`}>
          {t(
            "theory_hue_transition",
            `${THEORY_LEVELS[from].short} ${THEORY_LEVELS[from].bits.join("")}`,
            `${THEORY_LEVELS[to].short} ${THEORY_LEVELS[to].bits.join("")}`,
            GRAY_TOGGLES[selectedEdge],
            delta > 0 ? `+${delta}` : `−${-delta}`,
          )}
        </p>
      }
    />
  );
});
