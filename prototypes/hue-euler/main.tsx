import React, { useId, useState } from "react";
import { createRoot } from "react-dom/client";
import { bits, frameAt, HUE, LEVELS, TOURS, type Tour, type TourId } from "./model";
import { usePlayback, useReducedMotion } from "./usePlayback";
import "./style.css";

type IconName = "play" | "pause" | "previous" | "next" | "reset";
function Icon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "play" && <path d="m7 4 9 6-9 6Z" fill="currentColor" stroke="none" />}
      {name === "pause" && (
        <>
          <path d="M7 4v12M13 4v12" strokeWidth="3" />
        </>
      )}
      {name === "previous" && (
        <>
          <path d="M4 4v12M15 4l-8 6 8 6Z" />
        </>
      )}
      {name === "next" && (
        <>
          <path d="M16 4v12M5 4l8 6-8 6Z" />
        </>
      )}
      {name === "reset" && (
        <>
          <path d="M4 8a6 6 0 1 1 0 5M4 3v5h5" />
        </>
      )}
    </svg>
  );
}

function Graph({ tour, progress }: { tour: Tour; progress: number }) {
  const frame = frameAt(tour, progress);
  const start = tour.vertices[0];
  return (
    <svg
      className="lab-graph"
      viewBox="0 0 400 310"
      role="img"
      aria-label={`${tour.title}の一筆書き。${frame.completed} / ${tour.steps.length}辺を通過`}
      data-graph={tour.id}
    >
      <title>{tour.title} — 頂点の文字は状態、辺の色は両端のXOR</title>
      {tour.edges.map((edge) => {
        const a = tour.points[edge.a];
        const b = tour.points[edge.b];
        const visited = edge.step < frame.completed;
        const current = edge.step === frame.index && !frame.done;
        const color = LEVELS[edge.a ^ edge.b].color;
        const from = tour.points[frame.step.from];
        return (
          // Keep every stroke and its pen in the edge's original depth layer.
          <g key={edge.key} data-edge={edge.key} data-visited={visited} data-current={current} data-depth={edge.depth}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={color}
              strokeWidth={visited ? 2.6 : 1.5}
              opacity={visited ? 0.95 : 0.3}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {current && frame.fraction > 0 && (
              <>
                <line
                  data-trace
                  x1={from.x}
                  y1={from.y}
                  x2={frame.point.x}
                  y2={frame.point.y}
                  stroke={color}
                  strokeWidth={3.4}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <circle data-pen cx={frame.point.x} cy={frame.point.y} r={3.4} fill="#fff" stroke={color} strokeWidth={1.7} />
              </>
            )}
          </g>
        );
      })}
      {Object.entries(tour.points).map(([level, point]) => {
        const lv = Number(level);
        const origin = lv === start;
        const atNode = frame.done ? lv === start : frame.fraction === 0 && lv === frame.step.from;
        return (
          <g key={level} data-vertex={level}>
            {origin && (
              <circle
                cx={point.x}
                cy={point.y}
                r={15}
                fill="none"
                stroke={frame.done ? "#b9efd4" : "#75808e"}
                strokeWidth={1}
                opacity={frame.done ? 1 : 0.55}
              />
            )}
            {atNode && <circle cx={point.x} cy={point.y} r={13} fill="none" stroke="#fff" strokeWidth={1.3} />}
            <circle
              data-node
              cx={point.x}
              cy={point.y}
              r={10}
              fill={lv === 0 ? "#10151f" : LEVELS[lv].color}
              stroke={lv === 0 ? "#89929e" : "#ffffff66"}
              strokeWidth={1}
            />
            <text
              x={point.x}
              y={point.y}
              dominantBaseline="central"
              textAnchor="middle"
              fill={lv === 0 || lv === 1 || lv === 2 ? "#fff" : "#07111b"}
              fontSize="10"
              fontWeight="750"
            >
              {LEVELS[lv].short}
            </text>
            {origin && (
              <text x={point.x} y={point.y + 28} textAnchor="middle" className="lab-start-label">
                {frame.done ? "帰還" : "出発"}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function HueWheel({ tour, progress }: { tour: Tour; progress: number }) {
  const frame = frameAt(tour, progress);
  const markerId = useId().replace(/:/g, "");
  const phase = HUE.indexOf(frame.step.mask);
  const pointAt = (angle: number) => ({ x: 56 + 37 * Math.sin(angle), y: 56 - 37 * Math.cos(angle) });
  const angle = (phase * Math.PI) / 3;
  const from = pointAt(angle + frame.direction * 0.34);
  const to = pointAt(angle + frame.direction * 0.7);
  return (
    <svg
      className="lab-hue-wheel"
      viewBox="0 0 112 112"
      role="img"
      aria-label={`辺色 ${LEVELS[frame.step.mask].short}。次の色へ${frame.direction === 1 ? "時計回り" : "反時計回り"}`}
    >
      <defs>
        <marker id={markerId} markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <path d="M0 0 4 2.5 0 5" fill="none" stroke="#e0e7f0" strokeWidth="1.1" />
        </marker>
      </defs>
      <circle cx="56" cy="56" r="37" fill="none" stroke="#343c4a" strokeWidth="1" />
      {!frame.done && (
        <path
          d={`M${from.x},${from.y} A37,37 0 0 ${frame.direction === 1 ? 1 : 0} ${to.x},${to.y}`}
          fill="none"
          stroke="#e0e7f0"
          strokeWidth="1.5"
          markerEnd={`url(#${markerId})`}
        />
      )}
      {HUE.map((mask, i) => {
        const p = pointAt((i * Math.PI) / 3);
        const active = mask === frame.step.mask;
        return (
          <g key={mask} data-hue={mask} data-active={active}>
            {active && <circle cx={p.x} cy={p.y} r="12.5" fill="none" stroke="#e4ebf7" strokeWidth="1.4" />}
            <circle cx={p.x} cy={p.y} r="9" fill={LEVELS[mask].color} opacity={active ? 1 : 0.6} />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={mask === 1 || mask === 2 ? "#fff" : "#07111b"}
              fontSize="9"
              fontWeight="750"
            >
              {LEVELS[mask].short}
            </text>
          </g>
        );
      })}
      <text x="56" y="58" dominantBaseline="central" textAnchor="middle" fontSize={frame.done ? 12 : 26} fill="#e1e7ee">
        {frame.done ? "完了" : frame.direction === 1 ? "↻" : "↺"}
      </text>
    </svg>
  );
}

function TourCard({
  tour,
  playing,
  onPlay,
  onStop,
  reducedMotion,
}: {
  tour: Tour;
  playing: boolean;
  onPlay: () => void;
  onStop: () => void;
  reducedMotion: boolean;
}) {
  const { progress, speed, setSpeed, seek } = usePlayback(tour.steps.length, playing, onStop, reducedMotion);
  const frame = frameAt(tour, progress);
  const total = tour.steps.length;
  const atBeginning = progress === 0;
  const descriptionId = `${tour.id}-description`;
  const stopAndSeek = (next: number) => {
    onStop();
    seek(next);
  };
  const message = frame.done
    ? `${total}辺を一度ずつ通り、${LEVELS[tour.vertices[0]].short}に戻りました。`
    : tour.id === "octahedron"
      ? frame.completed >= 6
        ? "後半は、前半の各状態を補色に置き換えた経路です。"
        : "6辺で補色へ。12辺で出発点に戻ります。"
      : "色相環で隣り合う色へ進み、24辺を使い切ります。";

  return (
    <article className="lab-card" data-tour={tour.id} data-progress={progress} data-playing={playing} aria-labelledby={`${tour.id}-title`}>
      <header className="lab-card-heading">
        <div>
          <p className="lab-card-kicker">{tour.subtitle}</p>
          <h2 id={`${tour.id}-title`}>{tour.title}</h2>
        </div>
        <span className="lab-edge-total">
          <strong>{total}</strong>
          <span>辺</span>
        </span>
      </header>
      <div className="lab-stage">
        <Graph tour={tour} progress={progress} />
      </div>
      <div className="lab-reading">
        <HueWheel tour={tour} progress={progress} />
        <div className="lab-transition">
          <p className="lab-small-label">
            {frame.done ? "最後に通った辺" : "いま通る辺"}
            <span className="lab-distance">距離{frame.step.distance}</span>
          </p>
          <div className="lab-equation">
            <span>{LEVELS[frame.step.from].short}</span>
            <span className="lab-equation-arrow">→</span>
            <span>{LEVELS[frame.step.to].short}</span>
            <span className="lab-mask">
              <i style={{ background: LEVELS[frame.step.mask].color }} />
              辺色 {LEVELS[frame.step.mask].short}
            </span>
          </div>
          <code className="lab-bit-equation">
            {bits(frame.step.from)} ⊕ {bits(frame.step.mask)} = {bits(frame.step.to)}
          </code>
          <span className="lab-direction" data-turning={frame.turning}>
            {frame.done ? "出発点に帰還" : frame.turning ? "色相の向きを折り返す" : tour.rule}
          </span>
        </div>
      </div>
      <div className="lab-scrubber">
        <input
          type="range"
          min="0"
          max={total}
          step="1"
          value={frame.completed}
          aria-label={`${tour.title}の通過辺数`}
          aria-valuetext={`${frame.completed} / ${total}辺を通過`}
          onChange={(event) => stopAndSeek(Number(event.target.value))}
          style={{ "--progress": `${(progress / total) * 100}%` } as React.CSSProperties}
        />
        <output aria-label="通過した辺の数">
          <strong>{frame.completed}</strong>
          <span> / {total}</span>
        </output>
      </div>
      <div className="lab-controls">
        <button
          type="button"
          className="lab-icon-button"
          aria-label="一手戻る"
          title="一手戻る"
          disabled={atBeginning}
          onClick={() => stopAndSeek(Math.ceil(progress) - 1)}
        >
          <Icon name="previous" />
        </button>
        <button
          type="button"
          className="lab-play-button"
          aria-pressed={playing}
          aria-describedby={descriptionId}
          onClick={() => {
            if (playing) onStop();
            else {
              if (frame.done) seek(0);
              onPlay();
            }
          }}
        >
          <Icon name={playing ? "pause" : "play"} />
          {playing ? "一時停止" : frame.done ? "もう一度" : atBeginning ? "再生" : "再開"}
        </button>
        <button
          type="button"
          className="lab-icon-button"
          aria-label="一手進む"
          title="一手進む"
          disabled={frame.done}
          onClick={() => stopAndSeek(Math.floor(progress) + 1)}
        >
          <Icon name="next" />
        </button>
        <button
          type="button"
          className="lab-icon-button lab-reset"
          aria-label="最初に戻る"
          title="最初に戻る"
          disabled={atBeginning}
          onClick={() => stopAndSeek(0)}
        >
          <Icon name="reset" />
        </button>
        <label className="lab-speed">
          <span>速さ</span>
          <select aria-label="再生速度" value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
          </select>
        </label>
      </div>
      <p id={descriptionId} className="lab-caption" role="status" aria-live={playing ? "off" : "polite"}>
        {message}
      </p>
      <details className="lab-route">
        <summary>
          経路を確認する<span>{total}本・重複なし</span>
        </summary>
        <div className="lab-route-content">
          <p>頂点を通る順番</p>
          <div className="lab-route-vertices">
            {tour.vertices.map((level, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span aria-hidden="true">→</span>}
                <b data-current={i === frame.completed}>
                  <i style={{ background: LEVELS[level].color }} />
                  {LEVELS[level].short}
                </b>
              </React.Fragment>
            ))}
          </div>
          <p>辺の色をたどる順番</p>
          <div className="lab-route-colors">
            {tour.steps.map((step, i) => (
              <span
                key={step.key}
                data-current={i === frame.index}
                title={`${i + 1}本目：${LEVELS[step.from].short} → ${LEVELS[step.to].short}`}
              >
                <i style={{ background: LEVELS[step.mask].color }} />
                {LEVELS[step.mask].short}
              </span>
            ))}
          </div>
        </div>
      </details>
    </article>
  );
}

function Lab() {
  const [playingId, setPlayingId] = useState<TourId | null>(null);
  const reducedMotion = useReducedMotion();
  return (
    <main className="lab">
      <header className="lab-header">
        <div className="lab-brand">
          <span className="lab-brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          CHROMALUM<span className="lab-prototype-badge">試作</span>
        </div>
        <a href="../../theory-dev.html" target="_blank" rel="noreferrer">
          Theoryを開く <span aria-hidden="true">↗</span>
        </a>
      </header>
      <section className="lab-intro">
        <div>
          <p className="lab-eyebrow">HUE × EULER TOUR</p>
          <h1>色相と、一筆書き。</h1>
        </div>
        <p>
          辺の色をたどると、どんな経路になるのか。
          <br />
          二つの図で、色相環との関係を確かめます。
        </p>
      </section>
      <div className="lab-cards">
        {TOURS.map((tour) => (
          <TourCard
            key={tour.id}
            tour={tour}
            playing={playingId === tour.id}
            onPlay={() => setPlayingId(tour.id)}
            onStop={() => setPlayingId((current) => (current === tour.id ? null : current))}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
      <footer className="lab-footer">
        <p>
          <span className="lab-footer-dot" />
          辺の色は、両端の状態のXORです。<span>頂点には何度でも戻れます。</span>
        </p>
        {reducedMotion && <p>動きを減らす設定に合わせ、一手ごとに切り替えています。</p>}
        <details className="lab-explanation">
          <summary>二つの一筆書きの違い</summary>
          <div>
            <p>
              <strong>八面体：</strong>R → Y → G → C → B → M を2周して全12辺を通ります。6本進んだ状態は、出発点の補色です。
            </p>
            <p>
              <strong>距離1＋距離2：</strong>
              同じ向きの色相順では12本で周期が閉じます。ここでは色相環上の折り返しを許し、隣接する色だけをたどって全24辺を通ります。
            </p>
            <p>どちらも全辺を一度ずつ通って出発点に戻る、オイラー閉路です。</p>
          </div>
        </details>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Lab />
  </React.StrictMode>,
);
