import React, { useId } from "react";
import { THEORY_LEVELS } from "../../data/theory-data";
import { useTranslation } from "../../i18n";
import { C } from "../../styles/tokens";
import type { Bit, HammingWord } from "./HammingDiagram";

const CIRCLES = [
  { parity: 2, cx: 170, cy: 94, labelX: 170, labelY: -4 },
  { parity: 4, cx: 220, cy: 156, labelX: 286, labelY: 253 },
  { parity: 1, cx: 120, cy: 156, labelX: 54, labelY: 253 },
] as const;
const POSITIONS = [
  { position: 1, x: 76, y: 194 },
  { position: 2, x: 170, y: 39 },
  { position: 3, x: 125, y: 101 },
  { position: 4, x: 264, y: 194 },
  { position: 5, x: 170, y: 215 },
  { position: 6, x: 215, y: 101 },
  { position: 7, x: 170, y: 153 },
] as const;
const SUBSCRIPTS = "₀₁₂₃₄₅₆₇";

interface Check {
  readonly parity: number;
  readonly channel: string;
  readonly checks: readonly number[];
  readonly failed: Bit | null;
  readonly color: string;
}

interface Props {
  received: HammingWord | null;
  errors: HammingWord;
  checks: readonly Check[];
  hlLevel: number | null;
  onHover: (level: number | null) => void;
  onToggleError: (index: number) => void;
  selectedParity: number | null;
  onSelectParity: (parity: number | null) => void;
}

export const HammingParitySets = React.memo(function HammingParitySets({
  received,
  errors,
  checks,
  hlLevel,
  onHover,
  onToggleError,
  selectedParity,
  onSelectParity,
}: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const helpId = useId();
  const selected = checks.find((check) => check.parity === selectedParity);
  const orderedChecks = [...checks].sort((a, b) => b.parity - a.parity);
  const checkState = (failed: Bit | null) =>
    t(failed === null ? "theory_hamming_pending" : failed ? "theory_hamming_check_fail" : "theory_hamming_check_pass");

  return (
    <section className="theory-hamming-sets" data-testid="hamming-parity-sets" aria-labelledby={titleId}>
      <header className="theory-hamming-sets-heading">
        <div id={titleId} className="theory-diagram-label">
          {t("theory_hamming_venn_title")}
        </div>
        <p id={helpId}>{t("theory_hamming_venn_help")}</p>
      </header>
      <div className="theory-hamming-sets-layout">
        <figure className="theory-hamming-sets-figure">
          <svg viewBox="22 -20 296 296" role="group" aria-label={t("theory_hamming_venn_aria")} aria-describedby={helpId}>
            {CIRCLES.map(({ parity, cx, cy, labelX, labelY }) => {
              const check = checks.find((entry) => entry.parity === parity)!;
              const active = selectedParity === parity;
              const muted = selectedParity !== null && !active;
              return (
                <g
                  key={parity}
                  data-testid={`hamming-parity-set-${parity}`}
                  data-selected={active}
                  data-check-result={check.failed ?? undefined}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r="86"
                    fill={check.color}
                    fillOpacity={active ? 0.075 : 0.02}
                    stroke={check.color}
                    strokeWidth={active ? 2.4 : 1.4}
                    strokeOpacity={muted ? 0.24 : 0.8}
                    strokeDasharray={check.failed === 1 ? "6 4" : undefined}
                  />
                  <rect x={labelX - 30} y={labelY - 10} width="60" height="20" rx="5" fill={C.bgRoot} />
                  <text
                    x={labelX}
                    y={labelY}
                    dominantBaseline="central"
                    textAnchor="middle"
                    fill={check.color}
                    className="theory-hamming-set-label"
                  >
                    {check.channel} · P{parity}
                  </text>
                </g>
              );
            })}
            {POSITIONS.map(({ position, x, y }) => {
              const info = THEORY_LEVELS[position];
              const bit = received?.[position - 1] ?? null;
              const injected = errors[position - 1] === 1;
              const member = selected?.checks.includes(position) ?? true;
              const highlighted = hlLevel === position;
              const nodeLabel = t(
                "theory_hamming_venn_node_aria",
                `${position}`,
                info.hamming,
                `${bit ?? "–"}`,
                t(injected ? "theory_hamming_venn_remove_error" : "theory_hamming_venn_add_error"),
              );
              return (
                <g
                  key={position}
                  data-testid={`hamming-venn-position-${position}`}
                  data-check-member={member}
                  data-received-bit={bit ?? undefined}
                  data-error-injected={injected}
                  className="theory-hamming-set-node"
                  role="button"
                  tabIndex={0}
                  aria-label={nodeLabel}
                  aria-pressed={injected}
                  onClick={() => onToggleError(position - 1)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      if (!event.repeat) onToggleError(position - 1);
                    }
                  }}
                  onMouseEnter={() => onHover(position)}
                  onMouseLeave={() => onHover(null)}
                  onFocus={() => onHover(position)}
                  onBlur={() => onHover(null)}
                >
                  <circle cx={x} cy={y} r="14" fill={info.color} stroke={C.textWhite} strokeWidth="0.8" />
                  <circle
                    className="theory-hamming-node-focus"
                    cx={x}
                    cy={y}
                    r="20"
                    fill="none"
                    stroke={highlighted ? C.textWhite : "transparent"}
                    strokeWidth="1.6"
                  />
                  {injected && (
                    <g aria-hidden="true">
                      <circle cx={x} cy={y} r="17.5" fill="none" stroke={C.error} strokeWidth="2" />
                      <circle cx={x + 14} cy={y - 14} r="7" fill={C.error} />
                      <text
                        x={x + 14}
                        y={y - 14}
                        dominantBaseline="central"
                        textAnchor="middle"
                        fill="#fff"
                        className="theory-hamming-error-symbol"
                      >
                        !
                      </text>
                    </g>
                  )}
                  <text
                    x={x}
                    y={y}
                    dominantBaseline="central"
                    textAnchor="middle"
                    fill={position >= 4 ? "#000" : "#fff"}
                    className="theory-hamming-received-bit"
                    aria-hidden="true"
                  >
                    {bit ?? "–"}
                  </text>
                  <rect x={x - 31} y={y + 18} width="62" height="17" rx="3" fill={C.bgRoot} aria-hidden="true" />
                  <text
                    x={x}
                    y={y + 29}
                    textAnchor="middle"
                    fill={C.textPrimary}
                    className="theory-hamming-position-label"
                    aria-hidden="true"
                  >
                    {info.short}
                    {SUBSCRIPTS[position]} · {info.hamming}
                  </text>
                  <circle cx={x} cy={y} r="30" fill="transparent" className="theory-hamming-node-target" />
                </g>
              );
            })}
          </svg>
          <figcaption className="theory-hamming-sets-legend">
            <span>
              <b>0 / 1</b> {t("theory_hamming_venn_bit_legend")}
            </span>
            <span>
              <b className="theory-hamming-error-legend">!</b> {t("theory_hamming_venn_error_legend")}
            </span>
            <span>
              <i className="theory-hamming-dashed-legend" aria-hidden="true" /> {t("theory_hamming_venn_failed_legend")}
            </span>
          </figcaption>
        </figure>
        <div className="theory-hamming-sets-inspector">
          <div
            className="theory-hamming-check-choices"
            data-testid="hamming-parity-check-card"
            role="group"
            aria-label={t("theory_hamming_venn_select_check")}
          >
            {orderedChecks.map((check) => (
              <button
                key={check.parity}
                type="button"
                className="theory-hamming-check-choice"
                data-testid={`hamming-venn-check-${check.parity}`}
                data-parity-check-channel={`s${check.channel}`}
                data-parity-check-result={check.failed ?? undefined}
                aria-busy={check.failed === null}
                aria-pressed={selectedParity === check.parity}
                aria-label={`${t("theory_hamming_venn_check_label", check.channel)} P${check.parity}, ${checkState(check.failed)}, ${t("theory_hamming_venn_positions")} ${check.checks.join(" · ")}, s${check.channel} = ${check.failed ?? "–"}`}
                onClick={() => onSelectParity(selectedParity === check.parity ? null : check.parity)}
              >
                <span className="theory-hamming-check-heading">
                  <strong style={{ color: check.color }}>
                    {t("theory_hamming_venn_check_label", check.channel)} <small>P{check.parity}</small>
                  </strong>
                  <span className="theory-hamming-check-state" data-failed={check.failed === 1}>
                    {check.failed === null ? "–" : check.failed ? "×" : "✓"} {checkState(check.failed)}
                  </span>
                </span>
                <span className="theory-hamming-check-members">
                  <span className="theory-hamming-check-positions-full">
                    {t("theory_hamming_venn_positions")} {check.checks.join(" · ")}
                  </span>
                  <span className="theory-hamming-check-positions-short" aria-hidden="true">
                    {check.checks.join("·")}
                  </span>
                  <b>
                    s{check.channel} = {check.failed ?? "–"}
                  </b>
                </span>
              </button>
            ))}
          </div>
          <div className="theory-hamming-set-detail" data-testid="hamming-venn-detail" aria-live="polite">
            {selected ? (
              <>
                <strong style={{ color: selected.color }}>
                  {t("theory_hamming_venn_check_label", selected.channel)} · P{selected.parity}
                </strong>
                <div className="theory-hamming-check-formula">
                  {selected.checks.map((position) => `r${SUBSCRIPTS[position]}`).join(" ⊕ ")}
                </div>
                <div className="theory-hamming-check-values" data-check-value={selected.failed ?? undefined}>
                  {selected.checks.map((position) => received?.[position - 1] ?? "–").join(" ⊕ ")} = <b>{selected.failed ?? "–"}</b>
                </div>
                <p>
                  {t(
                    selected.failed === null
                      ? "theory_hamming_venn_check_pending"
                      : selected.failed
                        ? "theory_hamming_venn_odd"
                        : "theory_hamming_venn_even",
                  )}
                </p>
              </>
            ) : (
              <p>{t("theory_hamming_venn_inspect_hint")}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});
