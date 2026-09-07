import React from "react";
import { useTranslation } from "../../i18n";

const STEPS = [0, 1, 2, 4].map((weight) => ({
  weight,
  sums: Array.from({ length: Math.max(1, 2 * weight) }, (_, sum) => sum),
}));

export const SubsetSumDerivation = React.memo(function SubsetSumDerivation() {
  const { t } = useTranslation();

  return (
    <figure className="theory-subset" data-testid="subset-sum-derivation" aria-labelledby="theory-subset-title">
      <figcaption>
        <div id="theory-subset-title" className="theory-diagram-label">
          {t("theory_subset_title")}
        </div>
        <p>{t("theory_subset_intro")}</p>
      </figcaption>
      <div className="theory-subset-visual">
        <ol className="theory-subset-steps">
          {STEPS.map(({ weight, sums }) => (
            <li key={weight} data-subset-weight={weight}>
              <span className="theory-subset-weight">{weight === 0 ? t("theory_subset_start") : `+${weight}`}</span>
              <div className="theory-subset-values">
                {sums.map((sum) => (
                  <span key={sum} data-subset-value={sum} data-subset-translated={weight > 0 && sum >= weight}>
                    {sum}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
        <div className="theory-subset-legend">
          <span title={t("theory_subset_existing")}>
            <i aria-hidden="true" />
            {t("theory_subset_existing_short")}
          </span>
          <span title={t("theory_subset_translated")}>
            <i className="theory-subset-translated" aria-hidden="true" />
            {t("theory_subset_translated_short")}
          </span>
        </div>
      </div>
      <div className="theory-derivation-result">
        <span>{t("theory_derivation_weights")}</span>
        <strong>&#123;1,2,4&#125;</strong>
      </div>
    </figure>
  );
});
