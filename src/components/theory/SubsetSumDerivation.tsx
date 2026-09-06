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
        <h4 id="theory-subset-title">{t("theory_subset_title")}</h4>
        <p>{t("theory_subset_intro")}</p>
      </figcaption>
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
        <span>
          <i aria-hidden="true" />
          {t("theory_subset_existing")}
        </span>
        <span>
          <i className="theory-subset-translated" aria-hidden="true" />
          {t("theory_subset_translated")}
        </span>
      </div>
      <p>{t("theory_subset_rule")}</p>
      <strong>&#123;1,2,4&#125;</strong>
    </figure>
  );
});
