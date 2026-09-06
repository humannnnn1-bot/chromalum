import React from "react";
import { THEORY_LEVELS, hammingDist } from "../../data/theory-data";
import { useTranslation } from "../../i18n";

function ColorLabel({ level }: { level: number }) {
  const color = THEORY_LEVELS[level];
  return (
    <span className="theory-k8-color-label">
      <i style={{ background: color.color }} aria-hidden="true" />
      <span>
        {color.short} <code>{color.bits.join("")}</code>
      </span>
    </span>
  );
}

export const K8MaskControls = React.memo(function K8MaskControls({
  distance,
  selectedMask,
  onSelect,
}: {
  distance: 1 | 2;
  selectedMask: number | null;
  onSelect: (mask: number) => void;
}) {
  const { t } = useTranslation();
  const masks = distance === 1 ? [4, 2, 1] : [3, 5, 6];

  return (
    <div className="theory-k8-masks">
      <span id="theory-k8-mask-label">{t("theory_k8_mask_title")}</span>
      <div role="group" aria-labelledby="theory-k8-mask-label" className="theory-k8-mask-buttons">
        {masks.map((mask) => (
          <button
            key={mask}
            type="button"
            data-k8-mask-control={mask}
            aria-controls="theory-stella-view"
            aria-pressed={selectedMask === mask}
            aria-label={t("theory_k8_mask_aria", THEORY_LEVELS[mask].short, THEORY_LEVELS[mask].bits.join(""))}
            onClick={() => onSelect(mask)}
          >
            <ColorLabel level={mask} />
          </button>
        ))}
      </div>
    </div>
  );
});

const COMPARISONS = [
  [0, 1],
  [1, 2],
  [3, 4],
] as const;

export const K8DistanceComparison = React.memo(function K8DistanceComparison() {
  const { t } = useTranslation();
  return (
    <div className="theory-k8-comparison" data-testid="k8-distance-comparison">
      <table>
        <caption>{t("theory_k8_comparison_title")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("theory_k8_comparison_pair")}</th>
            <th scope="col">
              {t("theory_k8_comparison_distance")}
              <code>d_H</code>
            </th>
            <th scope="col">
              {t("theory_k8_comparison_gap")}
              <code>|ΔL|</code>
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISONS.map(([a, b]) => (
            <tr key={a} data-k8-comparison-pair={`${a}-${b}`}>
              <th scope="row">
                <span className="theory-k8-comparison-pair">
                  <ColorLabel level={a} /> ↔ <ColorLabel level={b} />
                </span>
              </th>
              <td data-pair-distance={hammingDist(a, b)}>{hammingDist(a, b)}</td>
              <td data-pair-gap={Math.abs(a - b)}>{Math.abs(a - b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="theory-k8-note">{t("theory_k8_comparison_note")}</p>
    </div>
  );
});
