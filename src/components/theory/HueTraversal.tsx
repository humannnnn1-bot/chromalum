import React, { useEffect, useState } from "react";
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
  const [selectedEdge, setSelectedEdge] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setSelectedEdge((edge) => (edge + direction + 6) % 6), 900);
    return () => clearInterval(timer);
  }, [playing, direction]);

  const selectEdge = (edge: number) => {
    setPlaying(false);
    setSelectedEdge(edge);
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
        <GrayCodeHex hlLevel={hlLevel} onHover={onHover} selectedEdge={selectedEdge} direction={direction} onSelectEdge={selectEdge} />
      }
      controls={
        <div className="theory-hue-transport">
          <div className="theory-hue-controls">
            <button type="button" onClick={() => selectEdge((selectedEdge - direction + 6) % 6)}>
              {t("theory_hue_previous")}
            </button>
            <button type="button" onClick={() => setPlaying((value) => !value)}>
              {t(playing ? "theory_gray_pause" : "theory_hue_play")}
            </button>
            <button type="button" onClick={() => selectEdge((selectedEdge + direction + 6) % 6)}>
              {t("theory_hue_next")}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setDirection((value) => (value === 1 ? -1 : 1));
              }}
            >
              {t("theory_hue_reverse")}
            </button>
          </div>
          <p role="status" aria-live={playing ? "off" : "polite"} data-hue-transition={`${from}-${to}`}>
            {t(
              "theory_hue_transition",
              `${THEORY_LEVELS[from].short} ${THEORY_LEVELS[from].bits.join("")}`,
              `${THEORY_LEVELS[to].short} ${THEORY_LEVELS[to].bits.join("")}`,
              GRAY_TOGGLES[selectedEdge],
              delta > 0 ? `+${delta}` : `−${-delta}`,
            )}
          </p>
          <p className="theory-hue-hint">{t("theory_hue_link_hint")}</p>
        </div>
      }
    />
  );
});
