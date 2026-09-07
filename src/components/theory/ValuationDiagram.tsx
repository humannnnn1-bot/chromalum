import React from "react";
import { THEORY_LEVELS } from "../../data/theory-data";
import { useTranslation } from "../../i18n";

const COMPLEMENTS = [
  [0, 7],
  [1, 6],
  [2, 5],
  [3, 4],
] as const;

function ColorRank({ level }: { level: number }) {
  return (
    <span className="theory-valuation-color">
      <i aria-hidden="true" style={{ background: THEORY_LEVELS[level].color }} />
      {THEORY_LEVELS[level].short}
      <strong>{level}</strong>
    </span>
  );
}

export const ValuationDiagram = React.memo(function ValuationDiagram() {
  const { t } = useTranslation();
  return (
    <div
      id="theory-valuation"
      className="theory-valuation"
      role="group"
      aria-label={t("theory_valuation_title")}
      data-testid="valuation-diagram"
    >
      <figure className="theory-valuation-complement">
        <figcaption>{t("theory_valuation_complement")}</figcaption>
        <div className="theory-valuation-pairs">
          {COMPLEMENTS.map(([a, b]) => (
            <div key={a} className="theory-valuation-pair" data-complement-pair={a + "-" + b}>
              <ColorRank level={a} />
              <span>↔</span>
              <ColorRank level={b} />
              <code>
                {a}+{b}=7
              </code>
            </div>
          ))}
        </div>
        <div className="theory-valuation-complement-formulas">
          <code>L(¬a)=7−L(a)</code>
          <code>T(a)+T(¬a)=1</code>
        </div>
      </figure>
      <p className="theory-valuation-note">{t("theory_valuation_xor_note")}</p>
      <div className="theory-valuation-identities">
        <code>L(a∨b)+L(a∧b)=L(a)+L(b)</code>
        <code>L(a⊕b)=L(a)+L(b)−2L(a∧b)</code>
      </div>
      <p className="theory-valuation-note">{t("theory_valuation_modular_note")}</p>
      <p className="theory-valuation-note">{t("theory_valuation_complement_note")}</p>
      <code className="theory-valuation-toggle">κ(a)=¬a=a⊕W · L(κ(a))=7−L(a)</code>
    </div>
  );
});
