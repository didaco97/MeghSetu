import React, { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Satellite,
  Map,
  Layers,
  ChartNoAxesCombined,
  Bell,
  FlaskConical,
  ShieldCheck,
  Radio,
  Send,
  CloudRain,
  Smartphone,
} from "lucide-react";
import "./feature-preview.css";

const FEATURES = {
  downscaling: {
    title: "ConvCNP downscaling",
    subtitle: "From a broad outlook to a finer local picture.",
    icon: BrainCircuit,
    action: "Run downscaling demo",
    stages: [
      "Read sample block forecast",
      "Blend terrain & station context",
      "Animate conditional prediction",
      "Assemble sample local estimates",
    ],
    result: "Sample local surface ready",
    duration: 14000,
  },
  satellite: {
    title: "Satellite ingestion",
    subtitle: "Watch the landscape become a stack of usable layers.",
    icon: Satellite,
    action: "Run ingestion demo",
    stages: [
      "Discover example scene",
      "Preview cloud-quality mask",
      "Align sample feature layers",
      "Package illustrative feature tiles",
    ],
    result: "Sample feature stack ready",
    duration: 12000,
  },
  boundaries: {
    title: "Panchayat boundaries",
    subtitle: "Explore how forecast cells could meet local boundaries.",
    icon: Map,
    action: "Run boundary demo",
    stages: [
      "Load schematic polygons",
      "Preview geometry checks",
      "Intersect sample forecast cells",
      "Summarise fictional Panchayats",
    ],
    result: "Sample boundary summaries ready",
    duration: 11000,
  },
  evidence: {
    title: "Model evidence",
    subtitle: "A preview of how model quality will be explained.",
    icon: ChartNoAxesCombined,
    action: "Run evaluation demo",
    stages: [
      "Select illustrative holdout",
      "Compare toy forecast errors",
      "Reveal sample reliability curve",
      "Prepare demonstration report",
    ],
    result: "Illustrative evaluation ready",
    duration: 13000,
  },
  alerts: {
    title: "Village alerts",
    subtitle: "Follow an advisory from review to a village inbox.",
    icon: Bell,
    action: "Simulate delivery",
    stages: [
      "Review example advisory",
      "Prepare language template",
      "Animate a delivery queue",
      "Show sample recipient receipts",
    ],
    result: "Delivery simulation complete",
    duration: 10000,
  },
};

function useSimulation(duration, autoplay) {
  const [progress, setProgress] = useState(0),
    [running, setRunning] = useState(autoplay);
  useEffect(() => {
    if (!running || progress >= 100) return;
    const timer = setInterval(() => {
      if (!document.hidden)
        setProgress((value) => Math.min(100, value + (250 / duration) * 100));
    }, 250);
    return () => clearInterval(timer);
  }, [running, progress >= 100, duration]);
  const complete = progress >= 100;
  return {
    progress,
    running: running && !complete,
    complete,
    toggle: () => setRunning((value) => !value),
    restart: () => {
      setProgress(0);
      setRunning(true);
    },
    reset: () => {
      setProgress(0);
      setRunning(false);
    },
    finish: () => {
      setProgress(100);
      setRunning(false);
    },
  };
}

function Select({ label, value, values, onChange }) {
  return (
    <label className="demo-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}
function Stat({ label, value, suffix }) {
  return (
    <div className="demo-stat">
      <small>{label}</small>
      <strong>
        {value}
        <span>{suffix}</span>
      </strong>
    </div>
  );
}
function DemoNote({ children }) {
  return <details className="demo-note-details"><summary>About this simulation</summary><p className="demo-detail-note">{children}</p></details>;
}
function FigureHead({ eyebrow, title, children }) {
  return (
    <div className="demo-figure-head">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
function Legend({ temperature = false }) {
  return (
    <div className="demo-legend">
      <span>{temperature ? "Cooler" : "Less rain"}</span>
      <i className={temperature ? "temperature" : ""} />
      <span>{temperature ? "Warmer" : "More rain"}</span>
      <small>Illustrative values</small>
    </div>
  );
}

function HeatGrid({ fine = false, progress, temperature, density }) {
  const columns = fine ? (density === "Fine" ? 12 : 8) : 4,
    rows = fine ? 8 : 4;
  return (
    <div
      className={`demo-heatgrid ${fine ? "fine" : "coarse"}`}
      style={{ gridTemplateColumns: `repeat(${columns},1fr)` }}
      aria-label={
        fine
          ? "Illustrative fine forecast grid"
          : "Illustrative coarse forecast grid"
      }
      role="img"
    >
      {Array.from({ length: columns * rows }, (_, index) => {
        const x = (index % columns) / columns,
          y = Math.floor(index / columns) / rows;
        const amount =
          0.3 +
          0.36 * Math.sin(x * 4.2 + y * 2) +
          0.18 * Math.cos(y * 7 - x * 3);
        const visible =
          !fine || progress > 25 + (index / (columns * rows)) * 55;
        return (
          <span
            key={index}
            className={visible ? "revealed" : ""}
            style={{
              background: visible
                ? `hsl(${temperature ? 36 - amount * 28 : 186 + amount * 23} ${temperature ? 78 : 64}% ${87 - amount * 46}%)`
                : "#e8f3f7",
            }}
          >
            {!fine && (
              <small>
                {(temperature ? 26 + amount * 7 : 8 + amount * 22).toFixed(1)}
              </small>
            )}
          </span>
        );
      })}
    </div>
  );
}

function Downscaling({ sim }) {
  const [metric, setMetric] = useState("Rainfall"),
    [density, setDensity] = useState("Fine");
  const temperature = metric === "Temperature";
  return (
    <>
      <div className="demo-options">
        <Select
          label="Forecast variable"
          value={metric}
          values={["Rainfall", "Temperature"]}
          onChange={(value) => {
            setMetric(value);
            sim.restart();
          }}
        />
        <Select
          label="Preview grid"
          value={density}
          values={["Fine", "Standard"]}
          onChange={(value) => {
            setDensity(value);
            sim.restart();
          }}
        />
        <span>
          <Layers size={15} /> Block → local grid
        </span>
      </div>
      <div className="demo-body">
        <section className="demo-panel downscale-stage">
          <FigureHead
            eyebrow="SPATIAL RESOLUTION PREVIEW"
            title="One outlook. More local detail."
          >
            <span className="demo-mini-tag">Synthetic field</span>
          </FigureHead>
          <div className="downscale-visual">
            <div className="downscale-grid-wrap">
              <span className="demo-figure-label">01 / COARSE INPUT</span>
              <HeatGrid progress={sim.progress} temperature={temperature} />
              <div className="demo-grid-caption">
                <strong>Block forecast</strong>
                <small>4 × 4 example cells</small>
              </div>
            </div>
            <div className="downscale-connector">
              <span />
              <div className={sim.running ? "model-node active" : "model-node"}>
                <BrainCircuit size={29} />
              </div>
              <span />
              <small>
                ConvCNP
                <br />
                concept
              </small>
            </div>
            <div className="downscale-grid-wrap">
              <span className="demo-figure-label">02 / LOCAL OUTPUT</span>
              <HeatGrid
                fine
                density={density}
                progress={sim.progress}
                temperature={temperature}
              />
              <div className="demo-grid-caption">
                <strong>Local sample surface</strong>
                <small>
                  {density === "Fine" ? "12 × 8" : "8 × 8"} illustrative cells
                </small>
              </div>
            </div>
          </div>
          <Legend temperature={temperature} />
          <div className="demo-context-features">
            {[
              [Layers, "Terrain"],
              [Radio, "Stations"],
              [CloudRain, "Forecast"],
            ].map(([Icon, label], i) => (
              <div
                key={label}
                className={sim.progress > 15 + i * 10 ? "ready" : ""}
              >
                <Icon size={17} />
                <span>{label} context</span>
                <Check size={13} />
              </div>
            ))}
          </div>
        </section>
        <RunPanel sim={sim} feature="downscaling">
          <div className="demo-result-grid">
            <Stat
              label="Sample cells"
              value={sim.complete ? (density === "Fine" ? "96" : "64") : "—"}
            />
            <Stat label="Variable" value={metric} />
          </div>
          <DemoNote>
            This animation explains the proposed flow. It does not run ConvCNP
            weights or establish forecast resolution.
          </DemoNote>
        </RunPanel>
      </div>
    </>
  );
}

function SatellitePreview({ sim }) {
  const [layer, setLayer] = useState("Vegetation"),
    [mask, setMask] = useState(true);
  return (
    <>
      <div className="demo-options">
        <Select
          label="Feature layer"
          value={layer}
          values={["Vegetation", "Rainfall", "Terrain"]}
          onChange={(value) => {
            setLayer(value);
            sim.restart();
          }}
        />
        <label className="demo-checkbox">
          <input
            type="checkbox"
            checked={mask}
            onChange={(event) => setMask(event.target.checked)}
          />
          Preview quality mask
        </label>
        <span>
          <Satellite size={16} /> Example scene / 001
        </span>
      </div>
      <div className="demo-body">
        <section className="demo-panel satellite-stage">
          <FigureHead
            eyebrow="GEOSPATIAL WORKBENCH"
            title="A landscape, layer by layer."
          >
            <span className="demo-mini-tag">Illustrative artwork</span>
          </FigureHead>
          <div
            className={`demo-satellite-view layer-${layer.toLowerCase()} ${sim.progress > 45 ? "layer-ready" : ""}`}
          >
            <img
              src="/assets/ministry-landscape.png"
              alt="AI-generated agricultural landscape used to illustrate a satellite workflow"
            />
            <div className="satellite-colour-layer" />
            <div className="satellite-grid" />
            {mask && (
              <div
                className={`satellite-cloud-mask ${sim.progress > 30 ? "resolved" : ""}`}
              >
                <span />
                <span />
                <span />
              </div>
            )}
            <div className="satellite-crosshair">
              <i />
              <i />
            </div>
            <div
              className="satellite-scan"
              style={{ top: `${10 + sim.progress * 0.8}%` }}
            >
              <span>FEATURE SCAN · {Math.round(sim.progress)}%</span>
            </div>
            <span className="satellite-scene-id">
              <Satellite size={15} /> DEMO SCENE 001
            </span>
            <div className="satellite-view-caption">
              <strong>{layer} feature preview</strong>
              <span>Schematic overlay · not observed imagery</span>
            </div>
            <div className="satellite-corners">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="satellite-layer-stack">
            {["Source scene", "Quality mask", `${layer} tiles`].map(
              (name, i) => (
                <div
                  className={sim.progress > (i + 1) * 23 ? "ready" : ""}
                  key={name}
                >
                  <Layers size={17} />
                  <span>{name}</span>
                  {sim.progress > (i + 1) * 23 ? (
                    <Check size={14} />
                  ) : (
                    <span className="demo-wait-dot" />
                  )}
                </div>
              ),
            )}
          </div>
        </section>
        <RunPanel sim={sim} feature="satellite">
          <div className="demo-result-grid">
            <Stat label="Sample tiles" value={sim.complete ? "24" : "—"} />
            <Stat label="Selected layer" value={layer} />
          </div>
          <DemoNote>
            The scan, mask and tile states are visual effects over generated
            artwork. No satellite data is fetched or processed.
          </DemoNote>
        </RunPanel>
      </div>
    </>
  );
}

const POLYGONS = [
  {
    name: "Panchayat A",
    id: "DEMO-001",
    points: "70,75 185,40 235,125 175,205 55,170",
    center: [140, 125],
    rain: "18.4",
    cells: 14,
  },
  {
    name: "Panchayat B",
    id: "DEMO-002",
    points: "185,40 320,55 348,145 235,125",
    center: [271, 94],
    rain: "23.1",
    cells: 11,
  },
  {
    name: "Panchayat C",
    id: "DEMO-003",
    points: "320,55 438,80 482,187 348,145",
    center: [400, 125],
    rain: "27.6",
    cells: 16,
  },
  {
    name: "Panchayat D",
    id: "DEMO-004",
    points: "55,170 175,205 220,295 93,323 38,258",
    center: [120, 245],
    rain: "16.8",
    cells: 12,
  },
  {
    name: "Panchayat E",
    id: "DEMO-005",
    points: "175,205 235,125 348,145 346,270 220,295",
    center: [270, 216],
    rain: "21.3",
    cells: 18,
  },
  {
    name: "Panchayat F",
    id: "DEMO-006",
    points: "348,145 482,187 459,304 346,270",
    center: [410, 232],
    rain: "25.2",
    cells: 15,
  },
];
function Boundaries({ sim }) {
  const [selected, setSelected] = useState(4),
    [grid, setGrid] = useState(true),
    item = POLYGONS[selected];
  return (
    <>
      <div className="demo-options">
        <Select
          label="Select a sample Panchayat"
          value={item.name}
          values={POLYGONS.map((p) => p.name)}
          onChange={(name) =>
            setSelected(POLYGONS.findIndex((p) => p.name === name))
          }
        />
        <label className="demo-checkbox">
          <input
            type="checkbox"
            checked={grid}
            onChange={(event) => setGrid(event.target.checked)}
          />
          Show forecast grid
        </label>
        <span>
          <Map size={16} /> Fictional district
        </span>
      </div>
      <div className="demo-body">
        <section className="demo-panel boundary-stage">
          <FigureHead
            eyebrow="AREA AGGREGATION PREVIEW"
            title="Give every area a local view."
          >
            <span className="demo-mini-tag">Schematic geography</span>
          </FigureHead>
          <div className="demo-boundary-map">
            <svg
              viewBox="0 0 520 360"
              role="group"
              aria-label="Six fictional Panchayat boundaries; choose one to view its sample summary"
            >
              <defs>
                <pattern
                  id="demo-cells"
                  width="25"
                  height="25"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 25 0 L 0 0 0 25"
                    fill="none"
                    stroke="#3186a5"
                    strokeWidth=".7"
                  />
                </pattern>
                <clipPath id="demo-polygons">
                  {POLYGONS.map((p) => (
                    <polygon key={p.id} points={p.points} />
                  ))}
                </clipPath>
              </defs>
              <path
                d="M 0 280 Q 100 330 210 160 T 520 85"
                className="boundary-river"
              />
              {POLYGONS.map((p, i) => (
                <g
                  key={p.id}
                  className={`demo-polygon ${selected === i ? "selected" : ""} ${sim.progress > i * 8 ? "visible" : ""}`}
                  onClick={() => setSelected(i)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(i);
                    }
                  }}
                  tabIndex="0"
                  role="button"
                  aria-label={`Select ${p.name}`}
                  aria-pressed={selected === i}
                >
                  <polygon points={p.points} />
                  <text x={p.center[0]} y={p.center[1]}>
                    {p.name.slice(-1)}
                  </text>
                </g>
              ))}
              {grid && (
                <rect
                  width="520"
                  height="360"
                  fill="url(#demo-cells)"
                  clipPath="url(#demo-polygons)"
                  opacity={sim.progress > 45 ? 0.7 : 0.15}
                  className="boundary-grid"
                />
              )}
              <path
                d="M 140 125 L 271 94 L 400 125 M 120 245 L 270 216 L 410 232"
                className="boundary-links"
                strokeDashoffset={100 - sim.progress}
              />
            </svg>
            <div className="boundary-compass">
              <span>N</span>
              <ArrowUpRight size={19} />
            </div>
            <div className="boundary-map-caption">
              <span className="demo-wait-dot" /> Click an area to inspect its
              sample data
            </div>
          </div>
          <div className="boundary-summary">
            <div>
              <small>SELECTED AREA · {item.id}</small>
              <h3>{item.name}</h3>
            </div>
            <Stat
              label="Sample rain"
              value={sim.complete ? item.rain : "—"}
              suffix="mm"
            />
            <Stat
              label="Example cells"
              value={sim.complete ? item.cells : "—"}
            />
          </div>
        </section>
        <RunPanel sim={sim} feature="boundaries">
          <div className="boundary-checks">
            <span>
              <Check size={14} />
              Six fictional polygons
            </span>
            <span>
              <Check size={14} />
              No real LGD identifiers
            </span>
            <span>
              <Layers size={14} />
              Illustrative overlap only
            </span>
          </div>
          <DemoNote>
            These shapes are invented for the interface preview. Verified
            administrative geometry and area-weighted aggregation are not
            connected.
          </DemoNote>
        </RunPanel>
      </div>
    </>
  );
}

function Evidence({ sim }) {
  const [view, setView] = useState("Reliability"),
    [split, setSplit] = useState("Geographic holdout");
  const reliability = view === "Reliability";
  return (
    <>
      <div className="demo-options">
        <Select
          label="Evaluation design"
          value={split}
          values={["Geographic holdout", "Time holdout"]}
          onChange={(value) => {
            setSplit(value);
            sim.restart();
          }}
        />
        <div className="demo-tabs" role="group" aria-label="Evaluation chart">
          {["Reliability", "Error comparison"].map((name) => (
            <button
              key={name}
              aria-pressed={view === name}
              onClick={() => setView(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <span>
          <FlaskConical size={16} /> Toy evaluation set
        </span>
      </div>
      <div className="demo-body">
        <section className="demo-panel evidence-stage">
          <FigureHead
            eyebrow="EVALUATION EXPLAINER"
            title={
              reliability
                ? "Confidence, made visible."
                : "Compare before claiming."
            }
          >
            <span className="demo-mini-tag">Illustrative chart</span>
          </FigureHead>
          <div
            className="demo-evidence-chart"
            role="img"
            aria-label={
              reliability
                ? "Toy reliability curve approaching the ideal diagonal, not measured model performance"
                : "Toy error comparison; illustrative baseline 5.8 mm and candidate 4.1 mm, not measured model performance"
            }
          >
            <svg viewBox="0 0 560 290">
              <defs>
                <linearGradient id="evidence-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#40bad4" stopOpacity=".27" />
                  <stop offset="1" stopColor="#40bad4" stopOpacity="0" />
                </linearGradient>
                <clipPath id="curve-reveal">
                  <rect x="50" y="0" height="260" width={sim.progress * 4.7} />
                </clipPath>
              </defs>
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i}>
                  <path
                    d={`M 55 ${235 - i * 50} H 520`}
                    stroke="#dcebf1"
                    strokeDasharray="3 6"
                  />
                  <text
                    x="40"
                    y={240 - i * 50}
                    textAnchor="end"
                    className="evidence-tick"
                  >
                    {reliability ? i / 4 : i * 2}
                  </text>
                </g>
              ))}
              {reliability ? (
                <>
                  <path
                    d="M 55 235 L 520 35"
                    stroke="#a6b9c1"
                    strokeDasharray="5 7"
                    strokeWidth="2"
                  />
                  <g clipPath="url(#curve-reveal)">
                    <path
                      d={
                        split === "Geographic holdout"
                          ? "M 55 235 L 148 211 L 241 169 L 334 120 L 427 80 L 520 40 L 520 235 Z"
                          : "M 55 235 L 148 204 L 241 180 L 334 130 L 427 73 L 520 46 L 520 235 Z"
                      }
                      fill="url(#evidence-fill)"
                    />
                    <path
                      d={
                        split === "Geographic holdout"
                          ? "M 55 235 L 148 211 L 241 169 L 334 120 L 427 80 L 520 40"
                          : "M 55 235 L 148 204 L 241 180 L 334 130 L 427 73 L 520 46"
                      }
                      fill="none"
                      stroke="#0984ad"
                      strokeWidth="4"
                      strokeLinejoin="round"
                    />
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <circle
                        key={n}
                        cx={55 + n * 93}
                        cy={
                          (split === "Geographic holdout"
                            ? [235, 211, 169, 120, 80, 40]
                            : [235, 204, 180, 130, 73, 46])[n]
                        }
                        r="5"
                        fill="white"
                        stroke="#0984ad"
                        strokeWidth="3"
                      />
                    ))}
                  </g>
                  {[0, 0.2, 0.4, 0.6, 0.8, 1].map((n, i) => (
                    <text
                      key={n}
                      x={55 + i * 93}
                      y="259"
                      textAnchor="middle"
                      className="evidence-tick"
                    >
                      {n}
                    </text>
                  ))}
                  <text
                    x="285"
                    y="283"
                    textAnchor="middle"
                    className="evidence-axis"
                  >
                    Predicted probability → observed frequency
                  </text>
                </>
              ) : (
                <>
                  {[
                    {
                      x: 130,
                      h: 145,
                      c: "#a4c5d4",
                      name: "Baseline",
                      v: "5.8",
                    },
                    {
                      x: 330,
                      h: 102.5,
                      c: "#1aa0c1",
                      name: "Candidate",
                      v: "4.1",
                    },
                  ].map((item) => (
                    <g key={item.name}>
                      <rect
                        x={item.x}
                        y={235 - item.h * Math.min(1, sim.progress / 75)}
                        width="105"
                        height={item.h * Math.min(1, sim.progress / 75)}
                        rx="7"
                        fill={item.c}
                      />
                      <text
                        x={item.x + 52}
                        y="261"
                        textAnchor="middle"
                        className="evidence-tick"
                      >
                        {item.name}
                      </text>
                      {sim.complete && (
                        <text
                          x={item.x + 52}
                          y={222 - item.h}
                          textAnchor="middle"
                          className="evidence-value"
                        >
                          {item.v} mm
                        </text>
                      )}
                    </g>
                  ))}
                  <text
                    x="285"
                    y="284"
                    textAnchor="middle"
                    className="evidence-axis"
                  >
                    Sample mean absolute error · lower is better
                  </text>
                </>
              )}
            </svg>
          </div>
          <div className="evidence-legend">
            <span>
              <i />
              Sample {reliability ? "reliability" : "candidate"}
            </span>
            <span>
              <i />
              {reliability ? "Ideal reference" : "Sample baseline"}
            </span>
            <strong>Not measured performance</strong>
          </div>
          <div className="evidence-evaluations">
            {[
              "Holdout separation",
              "Uncertainty calibration",
              "Versioned evidence",
            ].map((name, i) => (
              <div
                key={name}
                className={sim.progress > (i + 1) * 24 ? "ready" : ""}
              >
                <ShieldCheck size={19} />
                <span>{name}</span>
                <small>Workflow preview</small>
              </div>
            ))}
          </div>
        </section>
        <RunPanel sim={sim} feature="evidence">
          <div className="demo-result-grid">
            <Stat label="Example version" value="concept-01" />
            <Stat label="Evidence status" value="Illustrative" />
          </div>
          <DemoNote>
            These curves and numbers are toy examples for the presentation. They
            are not benchmark results, accuracy claims or pilot outcomes.
          </DemoNote>
        </RunPanel>
      </div>
    </>
  );
}

const MESSAGES = {
  English: {
    Rainfall:
      "Example rain advisory: rainfall may affect field work. Review the official local bulletin before planning irrigation or spraying.",
    Heat: "Example heat advisory: plan strenuous field work for cooler hours and check the official local weather bulletin.",
  },
  Hindi: {
    Rainfall:
      "नमूना वर्षा सलाह: बारिश से खेत का काम प्रभावित हो सकता है। सिंचाई या छिड़काव की योजना से पहले आधिकारिक स्थानीय बुलेटिन देखें।",
    Heat: "नमूना गर्मी सलाह: खेत का कठिन काम ठंडे समय में करें और आधिकारिक स्थानीय मौसम बुलेटिन देखें।",
  },
  Marathi: {
    Rainfall:
      "नमुना पावसाचा सल्ला: पावसामुळे शेतीच्या कामावर परिणाम होऊ शकतो. सिंचन किंवा फवारणीपूर्वी अधिकृत स्थानिक बुलेटिन पाहा.",
    Heat: "नमुना उष्णतेचा सल्ला: शेतीची कष्टाची कामे थंड वेळेत करा आणि अधिकृत स्थानिक हवामान बुलेटिन पाहा.",
  },
};
function Alerts({ sim, approved, onApprove }) {
  const [language, setLanguage] = useState("English"),
    [event, setEvent] = useState("Rainfall"),
    [channel, setChannel] = useState("SMS");
  const change = (setter, value) => {
    setter(value);
    sim.reset();
    onApprove(false);
  };
  return (
    <>
      <div className="demo-options">
        <Select
          label="Advisory template"
          value={event}
          values={["Rainfall", "Heat"]}
          onChange={(value) => change(setEvent, value)}
        />
        <Select
          label="Message language"
          value={language}
          values={["English", "Hindi", "Marathi"]}
          onChange={(value) => change(setLanguage, value)}
        />
        <Select
          label="Channel preview"
          value={channel}
          values={["SMS", "WhatsApp"]}
          onChange={(value) => change(setChannel, value)}
        />
      </div>
      <div className="demo-body">
        <section className="demo-panel alerts-stage">
          <FigureHead
            eyebrow="ADVISORY DELIVERY PREVIEW"
            title="The right message. Closer to home."
          >
            <span className="demo-mini-tag">No messages sent</span>
          </FigureHead>
          <div className="alerts-composition">
            <div className="alert-draft">
              <div className="alert-draft-heading">
                <CloudRain size={22} />
                <span>EXAMPLE {event.toUpperCase()} ADVISORY</span>
              </div>
              <h3>A clear, local-language message.</h3>
              <p lang={{ English: "en", Hindi: "hi", Marathi: "mr" }[language]}>
                {MESSAGES[language][event]}
              </p>
              <div className="alert-audience">
                <Map size={16} />
                <span>Fictional villages A, B & C</span>
                <small>3 sample recipients</small>
              </div>
              <label className="demo-approval">
                <input
                  type="checkbox"
                  checked={approved}
                  disabled={sim.running || sim.complete}
                  onChange={(e) => onApprove(e.target.checked)}
                />
                <span>
                  Mark this sample advisory as reviewed
                  <small>
                    Demonstrates the proposed officer approval step.
                  </small>
                </span>
              </label>
            </div>
            <div
              className={`demo-phone ${sim.progress > 55 ? "message-arrived" : ""}`}
            >
              <div className="demo-phone-speaker" />
              <div className="phone-top">
                <span>9:41</span>
                <Radio size={13} />
              </div>
              <div className="phone-app">
                <div>
                  <Bell size={17} />
                </div>
                <strong>MeghSetu</strong>
                <span>{channel} preview</span>
              </div>
              <span className="phone-demo-label">DEMO INBOX</span>
              <div
                className="phone-message"
                lang={{ English: "en", Hindi: "hi", Marathi: "mr" }[language]}
              >
                {sim.progress > 55 ? (
                  <>
                    <strong>Sample advisory</strong>
                    <p>{MESSAGES[language][event]}</p>
                    <small>
                      <Check size={12} />
                      Simulated receipt
                    </small>
                  </>
                ) : (
                  <div className="phone-waiting">
                    <Smartphone size={31} />
                    <span>
                      Your sample message
                      <br />
                      will appear here.
                    </span>
                  </div>
                )}
              </div>
              <div className="phone-home" />
            </div>
          </div>
          <div className="alert-recipients">
            {["Village A", "Village B", "Village C"].map((name, i) => (
              <div
                key={name}
                className={sim.progress > 65 + i * 12 ? "received" : ""}
              >
                <span className="recipient-avatar">{name.slice(-1)}</span>
                <div>
                  <strong>{name}</strong>
                  <small>
                    {sim.progress > 65 + i * 12
                      ? "Simulated receipt"
                      : sim.running
                        ? "Demo queue"
                        : "Sample recipient"}
                  </small>
                </div>
                {sim.progress > 65 + i * 12 ? (
                  <Check size={16} />
                ) : (
                  <Send size={15} />
                )}
              </div>
            ))}
          </div>
        </section>
        <RunPanel sim={sim} feature="alerts" approved={approved}>
          <div className="demo-result-grid">
            <Stat
              label="Sample receipts"
              value={sim.complete ? "3 / 3" : "—"}
            />
            <Stat label="Real messages" value="0" />
          </div>
          <DemoNote>
            Everything stays in this browser. There are no real contacts,
            messaging gateways or external deliveries.
          </DemoNote>
        </RunPanel>
      </div>
    </>
  );
}

function RunPanel({ sim, feature, children, approved = true }) {
  const config = FEATURES[feature],
    stage = Math.min(3, Math.floor(sim.progress / 25));
  return (
    <aside className="demo-panel demo-run-panel">
      <div className="demo-run-heading">
        <div className="demo-run-icon">
          <config.icon size={22} />
        </div>
        <div>
          <span>SIMULATION TIMELINE</span>
          <h2>
            {sim.complete
              ? "Preview complete"
              : sim.running
                ? "Bringing it together"
                : sim.progress > 0
                  ? "Preview paused"
                  : "Ready to explore"}
          </h2>
        </div>
      </div>
      <div className="demo-progress-label">
        <span>
          {sim.complete
            ? "Sample result ready"
            : sim.running
              ? "Animating workflow"
              : "Browser-only preview"}
        </span>
        <strong>{Math.round(sim.progress)}%</strong>
      </div>
      <div
        className="demo-progress"
        role="progressbar"
        aria-label="Demo simulation progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sim.progress)}
      >
        <span style={{ width: `${sim.progress}%` }} />
      </div>
      <ol className="demo-steps">
        {config.stages.map((text, i) => (
          <li
            key={text}
            className={
              sim.complete || stage > i
                ? "done"
                : stage === i && sim.progress > 0
                  ? "current"
                  : ""
            }
          >
            <span>
              {sim.complete || stage > i ? <Check size={13} /> : `0${i + 1}`}
            </span>
            <div>
              <strong>{text}</strong>
              <small>
                {sim.complete || stage > i
                  ? "Preview step complete"
                  : stage === i && sim.progress > 0
                    ? sim.running
                      ? "Simulating…"
                      : "Paused"
                    : "Queued in demo"}
              </small>
            </div>
            {stage === i && sim.running && <i />}
          </li>
        ))}
      </ol>
      <div className="demo-run-controls">
        <button
          className="button primary"
          onClick={
            sim.running ? sim.toggle : sim.complete || sim.progress === 0 ? sim.restart : sim.toggle
          }
          disabled={!approved}
        >
          <span>
            {sim.running ? (
              <Pause size={16} />
            ) : sim.complete ? (
              <RotateCcw size={16} />
            ) : (
              <Play size={16} />
            )}
          </span>
          {sim.running
            ? "Pause simulation"
            : sim.complete
              ? "Replay simulation"
              : sim.progress > 0
                ? "Resume simulation"
                : config.action}
        </button>
        {sim.progress > 0 && !sim.complete && (
          <button
            className="icon-btn"
            aria-label="Restart simulation"
            onClick={sim.restart}
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>
      {!approved && (
        <p className="demo-approval-hint">
          Review the sample advisory to start.
        </p>
      )}
      {!sim.complete && (
        <button className="demo-skip" onClick={sim.finish} disabled={!approved}>
          Show sample result <ArrowRight size={13} />
        </button>
      )}
      <div className={`demo-output ${sim.complete ? "ready" : ""}`}>
        <span>
          <FlaskConical size={13} />
          {sim.complete ? config.result : "RESULT PREVIEW"}
        </span>
        {children}
      </div>
    </aside>
  );
}

export default function FeaturePreview({ feature }) {
  const config = FEATURES[feature],
    reduced = useReducedMotion(),
    sim = useSimulation(config.duration, !reduced && feature !== "alerts");
  const [approved, setApproved] = useState(false);
  const Icon = config.icon;
  return (
    <section
      className={`feature-preview preview-${feature} ${sim.running ? "is-running" : "is-paused"}`}
      aria-labelledby="demo-page-title"
    >
      <div className="demo-page-heading">
        <div>
          <div className="eyebrow">
            <Icon size={13} /> MEGHSETU / CONCEPT LAB
          </div>
          <h1 id="demo-page-title">{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>
        <div className="demo-simulation-badge">
          <FlaskConical size={16} />
          <span>
            Demo simulation<small>Feature under development</small>
          </span>
        </div>
      </div>
      <div className="demo-disclosure">
        <span>
          <span className="demo-wait-dot" />
          Interactive concept preview
        </span>
        <p>
          Illustrative sample data · browser animation only · no backend
          processing
        </p>
      </div>
      {feature === "downscaling" && <Downscaling sim={sim} />}
      {feature === "satellite" && <SatellitePreview sim={sim} />}
      {feature === "boundaries" && <Boundaries sim={sim} />}
      {feature === "evidence" && <Evidence sim={sim} />}
      {feature === "alerts" && (
        <Alerts sim={sim} approved={approved} onApprove={setApproved} />
      )}
    </section>
  );
}
