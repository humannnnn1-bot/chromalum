import React from "react";
import { useTranslation } from "../../i18n";
import { C, FONT, FS, R, SP } from "../../styles/tokens";
import { THEORY_LEVELS } from "../../data/theory-data";
import { SubsetSumDerivation } from "./SubsetSumDerivation";

const S_FORMULA: React.CSSProperties = {
  display: "block",
  color: C.textPrimary,
  fontFamily: FONT.mono,
  fontSize: FS.sm,
  lineHeight: 1.65,
  overflowWrap: "anywhere",
};

const S_NOTE: React.CSSProperties = {
  margin: 0,
  color: C.textDimmer,
  fontSize: FS.sm,
  lineHeight: 1.65,
};

const S_THEOREM: React.CSSProperties = {
  width: "100%",
  maxWidth: 620,
  border: `1px solid ${C.border}`,
  borderRadius: R.xl,
  background: C.bgSurface,
  padding: SP.xl,
  boxSizing: "border-box",
};

export const DerivationMap = React.memo(function DerivationMap() {
  const { t } = useTranslation();

  return (
    <div className="theory-derivation" role="group" aria-label={t("theory_derivation_aria")}>
      <div className="theory-derivation-paths">
        <SubsetSumDerivation />
        <EmpiricalResonance />
      </div>
      <div className="theory-derivation-conclusion">
        <h4>{t("theory_derivation_convergence")}</h4>
        <code>L(g,r,b)=4g+2r+b · T=L/7</code>
        <p>{t("theory_derivation_convergence_note")}</p>
      </div>
    </div>
  );
});

const EmpiricalResonance = React.memo(function EmpiricalResonance() {
  const { t } = useTranslation();

  return (
    <figure className="theory-derivation-order" aria-labelledby="theory-order-title">
      <figcaption>
        <h4 id="theory-order-title">{t("theory_empirical_condition")}</h4>
        <p>{t("theory_empirical_order_intro")}</p>
      </figcaption>
      <code>s(g,r,b)=w_Gg+w_Rr+w_Bb</code>
      <code>w_G&gt;w_R+w_B · w_R&gt;w_B&gt;0</code>
      <ol className="theory-derivation-order-colors" aria-label="K<B<R<M<G<C<Y<W">
        {THEORY_LEVELS.map((info, level) => (
          <li key={level}>
            <span style={{ background: level === 0 ? C.bgRoot : info.color, color: level >= 4 ? "#000" : "#fff" }}>{info.short}</span>
            <span>{level}</span>
          </li>
        ))}
      </ol>
      <code>rank_s(c)=#&#123;x∈A | s(x)&lt;s(c)&#125;</code>
      <p>{t("theory_empirical_rank_note")}</p>
      <strong>B=1 · R=2 · G=4</strong>
    </figure>
  );
});

export const ValuationSummary = React.memo(function ValuationSummary() {
  const { t } = useTranslation();

  return (
    <div role="group" aria-label={t("theory_valuation_title")} style={S_THEOREM}>
      <code style={S_FORMULA}>L(a∨b)+L(a∧b)=L(a)+L(b)</code>
      <p style={{ ...S_NOTE, marginTop: SP.sm }}>{t("theory_valuation_modular_note")}</p>

      <code style={{ ...S_FORMULA, marginTop: SP.xl }}>L(a⊕b)=L(a)+L(b)−2L(a∧b)</code>
      <p style={{ ...S_NOTE, marginTop: SP.sm }}>{t("theory_valuation_xor_note")}</p>

      <code style={{ ...S_FORMULA, marginTop: SP.xl }}>κ(a)=¬a=a⊕W · L(κ(a))=7−L(a) · T(a)+T(κ(a))=1</code>
      <p style={{ ...S_NOTE, marginTop: SP.sm }}>{t("theory_valuation_complement_note")}</p>
    </div>
  );
});
