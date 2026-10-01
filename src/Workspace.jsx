import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import {
  Map,
  MapPin,
  Search,
  ArrowUpRight,
  ArrowLeft,
  CloudSun,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  Leaf,
  Workflow,
  AudioLines,
  ChartNoAxesCombined,
  LockKeyhole,
  Satellite,
  BrainCircuit,
  Bell,
  ChevronDown,
  RefreshCw,
  Download,
  Info,
  LocateFixed,
  LoaderCircle,
  Check,
  CheckCheck,
  Circle,
  Layers,
  Activity,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Logo, Pill } from "./ui";
import {
  PRESETS,
  LOCKED,
  DEMO_IDS,
  fmt,
  day,
  shortDate,
  weatherLabel,
} from "./data";
const FeaturePreview = lazy(() => import("./FeaturePreview"));
const MapView = lazy(() => import("./MapView"));
const ForecastChart = lazy(() => import("./ForecastChart"));
const nav = [
  ["forecast", Map, "Forecast explorer"],
  ["comparison", ChartNoAxesCombined, "Location comparison"],
  ["advisory", Leaf, "Crop planner"],
  ["pipeline", Workflow, "Processing view"],
];
function WeatherIcon({ code, ...props }) {
  return code === 0 ? (
    <Sun {...props} />
  ) : code >= 51 ? (
    <CloudRain {...props} />
  ) : (
    <CloudSun {...props} />
  );
}
function LocationSearch({ value, onSelect }) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState([]),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const area = useRef();
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      setError("");
      try {
        const r = await fetch("/api/locations?q=" + encodeURIComponent(query), {
          signal: controller.signal,
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setResults(d.results);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  useEffect(() => {
    const handler = (e) => {
      if (!area.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);
  function choose(point) {
    onSelect(point);
    setQuery("");
    setOpen(false);
  }
  return (
    <div className="location-search" ref={area}>
      <Search size={17} />
      <input
        aria-label="Search Indian location"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter") {
            const list = query.length >= 2 ? results : PRESETS;
            if (list[0]) choose(list[0]);
          }
        }}
        placeholder={`Explore a place · ${value.name}`}
      />
      {busy ? <LoaderCircle size={15} className="spin" /> : <kbd>↵</kbd>}
      {open && (
        <div className="search-results">
          <small>
            {query.length >= 2 ? "SEARCH RESULTS" : "TRY A LOCATION"}
          </small>
          {error && <p>{error}</p>}
          {(query.length >= 2 ? results : PRESETS).map((x, i) => (
            <button key={x.name + i} onClick={() => choose(x)}>
              <MapPin size={15} />
              <span>
                <strong>{x.name}</strong>
                <small>{x.region}</small>
              </span>
              <ArrowUpRight size={14} />
            </button>
          ))}
          {query.length >= 2 && !busy && !results.length && !error && (
            <p>No matching location. Try a nearby town or select the map.</p>
          )}
        </div>
      )}
    </div>
  );
}
function Empty({ loading, error, onRetry }) {
  return (
    <div className="empty-state">
      {loading ? (
        <LoaderCircle className="spin" size={34} />
      ) : (
        <CloudSun size={38} />
      )}
      <h3>
        {loading
          ? "Bringing your forecast into focus…"
          : "Your local outlook starts here."}
      </h3>
      <p>
        {error || "Run a forecast to connect the map, charts and crop planner."}
      </p>
      {!loading && (
        <button className="button primary" onClick={onRetry}>
          Load forecast <RefreshCw size={16} />
        </button>
      )}
    </div>
  );
}
function SourceLine({ data, onInfo }) {
  return (
    <div className="source-line">
      <span>
        <span className="live-dot" /> Numerical weather model ·{" "}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open-Meteo
        </a>
      </span>
      <button onClick={onInfo}>
        <Info size={13} /> Data & method
      </button>
      <small>
        Retrieved{" "}
        {new Date(data.local.retrievedAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        IST{data.local.cached ? " · cached" : ""}
      </small>
    </div>
  );
}
function Stats({ data }) {
  const cur = data.local.current;
  return (
    <div className="stats-grid">
      <div className="stat-card featured">
        <CloudSun size={25} />
        <span>Current model temperature</span>
        <strong>
          {fmt(cur.temp)}
          <small>°C</small>
        </strong>
        <p>{weatherLabel(cur.code)}</p>
      </div>
      <div className="stat-card">
        <CloudRain size={23} />
        <span>Rain · next 3 calendar days</span>
        <strong>
          {fmt(data.indicators.rain72h, 1)}
          <small>mm</small>
        </strong>
        <p>Sum of daily precipitation</p>
      </div>
      <div className="stat-card">
        <Droplets size={22} />
        <span>Relative humidity</span>
        <strong>
          {fmt(cur.humidity)}
          <small>%</small>
        </strong>
        <p>Model conditions at {cur.time?.slice(11, 16)} IST</p>
      </div>
      <div className="stat-card">
        <Wind size={24} />
        <span>Wind at 10 metres</span>
        <strong>
          {fmt(cur.wind, 1)}
          <small>km/h</small>
        </strong>
        <p>Modelled near-surface wind</p>
      </div>
    </div>
  );
}
function Weekly({ data }) {
  return (
    <section className="panel weekly-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">PLAN A LITTLE AHEAD</div>
          <h3>The next seven days</h3>
        </div>
        <CloudSun size={21} />
      </div>
      <div className="weekly-list">
        {data.days.map((x, i) => (
          <div className="weekly-day" key={x.date}>
            <div>
              <strong>{i === 0 ? "Today" : day(x.date)}</strong>
              <small>{shortDate(x.date)}</small>
            </div>
            <WeatherIcon code={x.code} size={23} strokeWidth={1.4} />
            <span className="day-rain">
              <Droplets size={11} />
              {fmt(x.rain, 1)} mm
            </span>
            <div className="day-temp">
              <strong>{fmt(x.high)}°</strong>
              <span>{fmt(x.low)}°</span>
            </div>
          </div>
        ))}
      </div>
      <div className="weekly-note">Local model outlook · IST</div>
    </section>
  );
}
function Comparison({ data, reference, onReference }) {
  const [metric, setMetric] = useState("rain");
  return (
    <div className="comparison-layout">
      <section className="panel comparison-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">TWO PLACES. ONE VIEW.</div>
            <h3>Rainfall & temperature comparison</h3>
          </div>
          <div className="segmented">
            <button
              onClick={() => setMetric("rain")}
              className={metric === "rain" ? "active" : ""}
            >
              Rainfall
            </button>
            <button
              onClick={() => setMetric("temp")}
              className={metric === "temp" ? "active" : ""}
            >
              Temperature
            </button>
          </div>
        </div>
        <div className="comparison-points">
          <span>
            <i />
            {data.local.location.name}
            <small>Selected coordinate</small>
          </span>
          <ArrowLeft size={18} />
          <label>
            <i className="amber-dot" />
            <select
              aria-label="Reference location"
              value={PRESETS.findIndex(
                (x) => x.lat === reference.lat && x.lon === reference.lon,
              )}
              onChange={(e) => onReference(PRESETS[Number(e.target.value)])}
            >
              {PRESETS.map((x, i) => (
                <option value={i} key={x.name}>
                  {x.name}
                </option>
              ))}
            </select>
            <small>Comparison coordinate</small>
          </label>
        </div>
        <Suspense fallback={<div className="chart-skeleton" />}>
          <ForecastChart
            data={data.local}
            reference={data.reference}
            metric={metric}
          />
        </Suspense>
        <div className="method-note">
          <Info size={16} />
          <span>
            {data.processing.sameGrid
              ? "Both queries returned the same model grid coordinate, so their outlooks may be identical. "
              : "Two independent queries to the weather model. "}
            No ConvCNP downscaling or official block-area aggregation has been
            applied.
          </span>
        </div>
      </section>
      <section className="panel coordinates-panel">
        <h3>Forecast coordinates & source grid</h3>
        <div>
          {[
            ["Selected query", data.local],
            ["Reference query", data.reference],
          ].map(([name, item]) => (
            <article key={name}>
              <span>{name}</span>
              <strong>{item.location.name}</strong>
              <p>
                Query {item.location.lat.toFixed(4)}° N,{" "}
                {item.location.lon.toFixed(4)}° E
              </p>
              <small>
                Returned grid: {item.grid.lat.toFixed(4)}°,{" "}
                {item.grid.lon.toFixed(4)}°
              </small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
function Planner({ data, onToast }) {
  const [crop, setCrop] = useState("Rice"),
    [stage, setStage] = useState("Vegetative"),
    [items, setItems] = useState(data.advisories),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    setBusy(true);
    setError("");
    fetch("/api/advisory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: data.runId, crop, stage }),
      signal: c.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then((d) => setItems(d.items))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setBusy(false);
      });
    return () => c.abort();
  }, [crop, stage, data.runId]);
  function save() {
    const text = `MeghSetu crop planner\n${data.local.location.name} | ${crop} | ${stage}\nForecast retrieved: ${data.local.retrievedAt}\nPrototype guidance, not an official advisory\n\n${items.map((x) => `${x.title}\n${x.detail}\nBasis: ${x.basis}`).join("\n\n")}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = "MeghSetu-crop-plan.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    onToast("Crop plan saved to your downloads.");
  }
  return (
    <section className="panel planner-panel">
      <div className="planner-top">
        <div>
          <div className="eyebrow">WEATHER MEETS THE FIELD</div>
          <h3>Crop-stage guidance</h3>
          <p>
            Select a crop and stage to explore weather-based planning prompts.
          </p>
        </div>
        <img
          className="planner-crop-art"
          src="/assets/crop-care.png"
          alt="Illustrated wheat, rice and a seedling"
        />
      </div>
      <div className="planner-controls">
        <label>
          Your crop
          <select value={crop} onChange={(e) => setCrop(e.target.value)}>
            {["Rice", "Wheat", "Maize", "Cotton", "Soybean"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Growth stage
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            {["Sowing", "Vegetative", "Flowering", "Harvest"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <Pill tone="amber">Prototype rules</Pill>
      </div>
      {error && (
        <div role="alert" className="inline-error">
          {error}
        </div>
      )}
      <div className={`advisory-grid ${busy ? "is-loading" : ""}`}>
        {items.map((x, i) => (
          <article className={"advisory-item " + x.tone} key={i}>
            <span className="advisory-index">0{i + 1}</span>
            <h4>{x.title}</h4>
            <p>{x.detail}</p>
            <details>
              <summary>Why this is shown</summary>
              <p>{x.basis}</p>
            </details>
            {x.url && (
              <a href={x.url} target="_blank" rel="noopener noreferrer">
                Open IMD KALP reference <ArrowUpRight size={13} />
              </a>
            )}
          </article>
        ))}
      </div>
      <div className="planner-bottom">
        <span>
          Local crop conditions have not been measured. Rules are illustrative.
        </span>
        <button
          className="button secondary"
          disabled={busy || !!error}
          onClick={save}
        >
          <Download size={16} /> Save this plan
        </button>
      </div>
    </section>
  );
}
function Pipeline({ data, trace, loading, onRun, onLock }) {
  const steps = [
    ["coordinates", "Location coordinates"],
    ["fetch", "Forecast retrieval"],
    ["quality", "Data quality checks"],
    ["indicators", "Daily indicators"],
    ["ready", "Workspace delivery"],
  ];
  return (
    <div className="pipeline-layout">
      <section className="pipeline-visual panel">
        <img
          src="/assets/ministry-landscape.png"
          alt="Illustrative landscape, not processed satellite imagery"
        />
        <div className="pipeline-image-tint" />
        <div className="pipeline-image-label">
          <span className={loading ? "live-dot" : "quiet-dot"} />
          {loading ? "FORECAST RUN IN PROGRESS" : "WEATHER PIPELINE"}
        </div>
        <div className={`scan-frame ${loading ? "scanning" : ""}`}>
          <span />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="pipeline-image-bottom">
          <h3>
            {loading
              ? "Bringing the forecast together."
              : "A view into the process."}
          </h3>
          <span>
            Illustrative artwork · satellite ingestion is under development
          </span>
        </div>
      </section>
      <section className="panel pipeline-steps">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">REAL SERVER EVENTS</div>
            <h3>Inside your forecast run</h3>
          </div>
          <Activity size={20} />
        </div>
        <div className="run-steps">
          {steps.map(([id, label], i) => {
            const item = trace.find((x) => x.id === id);
            return (
              <div
                className={"run-step " + (item?.status || "waiting")}
                key={id}
              >
                <span className="step-indicator">
                  {item?.status === "done" ? (
                    <Check size={15} />
                  ) : item?.status === "active" ? (
                    <LoaderCircle size={15} className="spin" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </span>
                <div>
                  <strong>{label}</strong>
                  <small>{item?.label || "Waiting for a forecast run"}</small>
                </div>
                {item && (
                  <time>
                    {item.elapsedMs < 1000
                      ? `${item.elapsedMs}ms`
                      : `${(item.elapsedMs / 1000).toFixed(1)}s`}
                  </time>
                )}
              </div>
            );
          })}
        </div>
        <button className="button primary" onClick={onRun} disabled={loading}>
          {loading ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <RefreshCw size={16} />
          )}{" "}
          {loading ? "Running forecast" : "Run forecast again"}
        </button>
        {data && (
          <div className="run-meta">
            Run {data.runId.slice(0, 8)} · {data.indicators.coverage}/
            {data.indicators.totalDays} rainfall days available
          </div>
        )}
      </section>
      <button className="pipeline-locked" onClick={() => onLock(LOCKED[1])}>
        <Satellite size={22} />
        <span>
          <strong>Satellite ingestion & geospatial processing</strong>
          <small>Planned extension to the weather pipeline</small>
        </span>
        <Pill tone="amber">
          <LockKeyhole size={12} /> Under development
        </Pill>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
export default function Workspace({
  pane,
  data,
  loading,
  error,
  location,
  reference,
  trace,
  onNavigate,
  onSelect,
  onReference,
  onRun,
  onChat,
  onLock,
  onInfo,
  onToast,
}) {
  const [sidebar, setSidebar] = useState(false);
  const isPreview = DEMO_IDS.includes(pane);
  function locate() {
    if (!navigator.geolocation)
      return onToast("Geolocation is not available in this browser.");
    navigator.geolocation.getCurrentPosition(
      (p) =>
        onSelect({
          name: "My location",
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          region: "India",
        }),
      () => onToast("Location access was unavailable. Search a town instead."),
      { timeout: 10000, maximumAge: 300000 },
    );
  }
  function download() {
    if (!data) return;
    const rows = [
      [
        "Date",
        "Rainfall (mm)",
        "Maximum temperature (C)",
        "Minimum temperature (C)",
        "Rain probability (%)",
      ],
      ...data.local.days.map((x) => [
        x.date,
        x.rain ?? "",
        x.high ?? "",
        x.low ?? "",
        x.probability ?? "",
      ]),
    ];
    const blob = new Blob([rows.map((x) => x.join(",")).join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "MeghSetu-forecast.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    onToast("Forecast CSV saved to your downloads.");
  }
  return (
    <div className="workspace">
      <aside className={`sidebar ${sidebar ? "visible" : ""}`}>
        <Logo light onClick={() => onNavigate("home")} />
        <span className="workspace-label">WEATHER SERVICES</span>
        <nav aria-label="Workspace tools">
          {nav.map(([id, Icon, name]) => (
            <button
              key={id}
              className={pane === id ? "active" : ""}
              onClick={() => {
                onNavigate(id);
                setSidebar(false);
              }}
            >
              <Icon size={18} />
              <span>{name}</span>
              {pane === id && <i />}
            </button>
          ))}
          <button onClick={onChat}>
            <AudioLines size={18} />
            <span>Voice assistant</span>
            <span className="new-dot" />
          </button>
        </nav>
        <div className="sidebar-divider" />
        <span className="workspace-label">CONCEPT LAB · DEMO SCREENS</span>
        <nav aria-label="Features under development">
          {LOCKED.map((f, i) => {
            const Icon = [
              BrainCircuit,
              Satellite,
              Map,
              ChartNoAxesCombined,
              Bell,
            ][i];
            return (
              <button
                className={`locked-nav ${pane === f.id ? "active" : ""}`}
                key={f.name}
                aria-current={pane === f.id ? "page" : undefined}
                onClick={() => {
                  onLock(f);
                  setSidebar(false);
                }}
              >
                <Icon size={17} />
                <span>{f.name}</span>
                <LockKeyhole size={12} />
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <Pill>SIH 2026 PROTOTYPE</Pill>
          <div className="sidebar-team">
            <span>HB</span>
            <div>
              HoneyBager<small>Team ID · 133270</small>
            </div>
          </div>
          <button onClick={() => onNavigate("home")}>
            <ArrowLeft size={14} /> Back to the landing page
          </button>
        </div>
      </aside>
      {sidebar && (
        <button
          className="sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() => setSidebar(false)}
        />
      )}
      <div className="workspace-main">
        <header className="workspace-header">
          <button
            className="workspace-menu icon-btn"
            aria-label="Open workspace navigation"
            onClick={() => setSidebar(!sidebar)}
          >
            <Menu size={20} />
          </button>
          {isPreview ? (
            <div className="demo-header-label">
              <BrainCircuit size={18} />
              <strong>Concept lab</strong>
              <span>Interactive feature previews</span>
            </div>
          ) : (
            <LocationSearch value={location} onSelect={onSelect} />
          )}
          {!isPreview && (
            <button
              className="icon-btn geolocate"
              aria-label="Use my location"
              title="Use my location"
              onClick={locate}
            >
              <LocateFixed size={19} />
            </button>
          )}
          <span className="header-date">
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <button className="assistant-top" onClick={onChat}>
            <AudioLines size={18} /> Ask MeghSetu
          </button>
          <span className="avatar">HB</span>
        </header>
        <main
          key={pane}
          id="workspace-main-content"
          className={`workspace-content workspace-${pane}`}
          tabIndex={-1}
        >
          {isPreview ? (
            <Suspense
              fallback={
                <div className="map-loading">Opening the concept lab…</div>
              }
            >
              <FeaturePreview key={pane} feature={pane} />
            </Suspense>
          ) : (
            <>
              <section
                className={
                  pane === "forecast" ? "forecast-screen" : "workspace-screen"
                }
                aria-label="Weather service overview"
              >
                <div className="workspace-title">
                  <div>
                    <div className="eyebrow">
                      <MapPin size={12} /> {location.name.toUpperCase()}{" "}
                      {location.region
                        ? " / " + location.region.toUpperCase()
                        : ""}
                    </div>
                    <h1>
                      {pane === "forecast"
                        ? "Local weather forecast"
                        : pane === "comparison"
                          ? "Compare locations"
                          : pane === "advisory"
                            ? "Crop planning"
                            : "Forecast processing"}
                    </h1>
                    <p>
                      {pane === "forecast"
                        ? "Current model conditions and the seven-day outlook."
                        : pane === "comparison"
                          ? "Compare two locations without losing sight of their sources."
                          : pane === "advisory"
                            ? "Weather-based prompts, with the reasoning visible."
                            : "Actual server events, from the request to your workspace."}
                    </p>
                  </div>
                  <div className="workspace-actions">
                    <button
                      className="button secondary refresh"
                      disabled={loading}
                      onClick={onRun}
                    >
                      {loading ? (
                        <LoaderCircle size={16} className="spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}{" "}
                      {loading ? "Updating" : "Refresh"}
                    </button>
                    {data && (
                      <button
                        className="icon-btn export"
                        aria-label="Download forecast CSV"
                        onClick={download}
                      >
                        <Download size={18} />
                      </button>
                    )}
                  </div>
                </div>
                {error && (
                  <div className="inline-error" role="alert">
                    {error}
                  </div>
                )}
                {pane === "pipeline" ? (
                  <Pipeline
                    data={data}
                    trace={trace}
                    loading={loading}
                    onRun={onRun}
                    onLock={onLock}
                  />
                ) : !data ? (
                  <Empty loading={loading} error={error} onRetry={onRun} />
                ) : (
                  <>
                    {pane === "forecast" && (
                      <>
                        <Stats data={data} />
                        <div className="forecast-layout">
                          <section className="panel map-panel">
                            <div className="panel-heading">
                              <div>
                                <div className="eyebrow">LOCATION EXPLORER</div>
                                <h3>Local forecast map</h3>
                              </div>
                              <Pill>
                                <span className="live-dot" /> Connected
                              </Pill>
                            </div>
                            <Suspense
                              fallback={
                                <div className="map-loading">
                                  Opening the map…
                                </div>
                              }
                            >
                              <MapView
                                location={location}
                                reference={reference}
                                onSelect={onSelect}
                                temperature={data.local.current.temp}
                              />
                            </Suspense>
                            <div className="map-source">
                              <span>
                                {location.lat.toFixed(4)}° N ·{" "}
                                {location.lon.toFixed(4)}° E
                              </span>
                              <button onClick={() => onLock(LOCKED[2])}>
                                <LockKeyhole size={12} /> Panchayat boundaries
                              </button>
                            </div>
                          </section>
                          <Weekly data={data.local} />
                        </div>
                      </>
                    )}
                    {pane === "comparison" && (
                      <Comparison
                        data={data}
                        reference={reference}
                        onReference={onReference}
                      />
                    )}
                    {pane === "advisory" && (
                      <Planner data={data} onToast={onToast} />
                    )}
                  </>
                )}
                {data && <SourceLine data={data} onInfo={onInfo} />}
              </section>
              {pane === "forecast" && data && (
                <section
                  className="forecast-insights"
                  aria-labelledby="trends-title"
                >
                  <div className="forecast-insights-heading">
                    <div className="eyebrow">WEATHER TRENDS & PLANNING</div>
                    <h2 id="trends-title">Plan around the week ahead.</h2>
                    <p>
                      Review rainfall across the next seven days, then explore
                      guidance for your crop.
                    </p>
                  </div>
                  <div className="dashboard-lower">
                    <section className="panel mini-chart">
                      <div className="panel-heading">
                        <div>
                          <div className="eyebrow">SEVEN-DAY COMPARISON</div>
                          <h3>Rainfall outlook</h3>
                        </div>
                        <button
                          className="icon-btn"
                          aria-label="Open full comparison"
                          onClick={() => onNavigate("comparison")}
                        >
                          <ArrowUpRight size={18} />
                        </button>
                      </div>
                      <Suspense fallback={<div className="chart-skeleton" />}>
                        <ForecastChart
                          data={data.local}
                          reference={data.reference}
                        />
                      </Suspense>
                    </section>
                    <section className="next-action">
                      <Leaf size={33} />
                      <div className="eyebrow">AGRICULTURAL PLANNING</div>
                      <h3>Guidance for your crop.</h3>
                      <p>
                        Select a crop and its growth stage to explore
                        weather-based planning prompts and their reasoning.
                      </p>
                      <button
                        className="button primary"
                        onClick={() => onNavigate("advisory")}
                      >
                        Open crop planner <ArrowUpRight size={16} />
                      </button>
                    </section>
                  </div>
                </section>
              )}
            </>
          )}
          <div className="workspace-footer">
            <span>MeghSetu · HoneyBager 133270</span>
            <span>PS26074 / SIH 2026</span>
          </div>
        </main>
      </div>
    </div>
  );
}
