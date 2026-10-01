import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  AudioLines,
  BatteryFull,
  Check,
  ChevronRight,
  CloudRain,
  CloudSun,
  Droplets,
  Leaf,
  MapPin,
  MousePointer2,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Send,
  Smartphone,
  Wind,
} from "lucide-react";
import { day, fmt, weatherLabel } from "./data";
import "./mobile-showcase.css";

const STEPS = [
  {
    title: "Your local outlook",
    short: "Forecast",
    icon: CloudSun,
    copy: "Check the forecast, switch the chart and explore the days ahead.",
    action: "Explore the forecast",
    route: "forecast",
  },
  {
    title: "A plan for your crop",
    short: "Crops",
    icon: Leaf,
    copy: "Choose a crop and its stage to bring field planning into focus.",
    action: "Open crop planner",
    route: "advisory",
  },
  {
    title: "A little help, in your language",
    short: "Ask",
    icon: AudioLines,
    copy: "See an example conversation with your weather companion.",
    action: "Try the real assistant",
    route: "assistant",
  },
];
const TICKS = 32;

function AutoTap({ visible }) {
  return visible ? (
    <span className="handset-auto-tap" aria-hidden="true">
      <i />
      <MousePointer2 size={19} fill="white" />
    </span>
  ) : null;
}

function ForecastScreen({
  data,
  phase,
  playing,
  metric,
  onMetric,
  selectedDay,
  onDay,
}) {
  const days = data?.local.days || [],
    current = data?.local.current;
  const entries = days.length ? days : Array.from({ length: 7 }, () => ({}));
  const value = days[selectedDay],
    chartKey = metric === "Rainfall" ? "rain" : "high";
  const maximum = Math.max(
    1,
    ...entries.map((item) => Number(item[chartKey]) || 0),
  );
  return (
    <div className="handset-page handset-forecast">
      <div className="handset-page-heading">
        <span>YOUR LOCAL OUTLOOK</span>
        <h3>Weather, at a glance.</h3>
      </div>
      <div className="handset-weather-card">
        <div>
          <small>Current model temperature</small>
          <strong>
            {fmt(current?.temp)}
            <span>°C</span>
          </strong>
          <span>{data ? weatherLabel(current.code) : "Loading outlook…"}</span>
        </div>
        <CloudSun size={48} strokeWidth={1.2} />
      </div>
      <div className="handset-weather-stats">
        <div>
          <Droplets size={13} />
          <span>
            Humidity<strong>{fmt(current?.humidity)}%</strong>
          </span>
        </div>
        <div>
          <Wind size={13} />
          <span>
            Wind
            <strong>
              {fmt(current?.wind, 1)} <small>km/h</small>
            </strong>
          </span>
        </div>
      </div>
      <div className="handset-chart-card">
        <div className="handset-chart-heading">
          <strong>7-day outlook</strong>
          <span>{metric === "Rainfall" ? "mm" : "°C"}</span>
        </div>
        <div
          className="handset-metric"
          role="group"
          aria-label="Phone preview chart variable"
        >
          {["Temperature", "Rainfall"].map((name) => (
            <button
              key={name}
              aria-pressed={metric === name}
              onClick={() => onMetric(name)}
            >
              {name}
              <AutoTap
                visible={
                  playing && name === "Rainfall" && phase >= 6 && phase < 10
                }
              />
            </button>
          ))}
        </div>
        <div
          className={`handset-chart-bars ${metric === "Rainfall" ? "rainfall" : ""}`}
        >
          {entries.map((item, index) => (
            <button
              key={item.date || index}
              aria-label={`Preview ${item.date ? day(item.date) : `day ${index + 1}`} forecast`}
              aria-pressed={selectedDay === index}
              onClick={() => onDay(index)}
            >
              <span className="handset-bar-track">
                <i
                  style={{
                    height: `${item[chartKey] == null ? 3 : Math.max(5, (Number(item[chartKey]) / maximum) * 100)}%`,
                  }}
                />
              </span>
              <small>{item.date ? day(item.date).slice(0, 2) : "—"}</small>
              <AutoTap
                visible={playing && index === 1 && phase >= 17 && phase < 21}
              />
            </button>
          ))}
        </div>
        <div className="handset-day-reading">
          <span>{value?.date ? day(value.date) : "Forecast loading"}</span>
          <strong>
            {fmt(value?.[chartKey], metric === "Rainfall" ? 1 : 0)}{" "}
            {metric === "Rainfall" ? "mm" : "°C"}
          </strong>
        </div>
      </div>
      <div className="handset-source">
        <span />{" "}
        {data ? "Open-Meteo · current query" : "Waiting for forecast data"}
      </div>
    </div>
  );
}

function CropScreen({ crop, stage, phase, playing, onCrop, onStage }) {
  return (
    <div className="handset-page handset-crops">
      <div className="handset-page-heading">
        <span>WEATHER MEETS THE FIELD</span>
        <h3>Plan for your crop.</h3>
      </div>
      <div className="handset-crop-hero">
        <img src="/assets/crop-care.png" alt="" />
        <span>
          SMALL DECISIONS.
          <br />
          <strong>A better prepared day.</strong>
        </span>
      </div>
      <div className="handset-crop-controls">
        <label>
          Crop
          <select
            aria-label="Phone preview crop"
            value={crop}
            onChange={(event) => onCrop(event.target.value)}
          >
            <option>Rice</option>
            <option>Wheat</option>
            <option>Maize</option>
          </select>
          <AutoTap visible={playing && phase >= 8 && phase < 12} />
        </label>
        <label>
          Growth stage
          <select
            aria-label="Phone preview growth stage"
            value={stage}
            onChange={(event) => onStage(event.target.value)}
          >
            <option>Vegetative</option>
            <option>Flowering</option>
            <option>Harvest</option>
          </select>
          <AutoTap visible={playing && phase >= 15 && phase < 19} />
        </label>
      </div>
      <div className="handset-crop-guidance" key={`${crop}-${stage}`}>
        <span>
          <Leaf size={13} />
          EXAMPLE GUIDANCE
        </span>
        <h4>
          {crop} · {stage.toLowerCase()}
        </h4>
        <p>
          {stage === "Harvest"
            ? "Review the rainfall outlook before scheduling harvest and drying."
            : "Check local crop and soil conditions alongside the weather outlook."}
        </p>
        <div>
          <Check size={12} /> Check the official local bulletin
        </div>
      </div>
      <div className="handset-small-note">
        Sample planning prompt. Open the crop planner for current guidance.
      </div>
    </div>
  );
}

function AssistantScreen({ phase, playing, sent, onSend }) {
  const question = "How can I plan my field work?",
    questionVisible = sent || phase >= 9,
    responseVisible = sent || phase >= 20;
  const chars = sent
    ? question.length
    : Math.max(0, Math.min(question.length, (phase - 8) * 4));
  return (
    <div className="handset-page handset-assistant">
      <div className="handset-assistant-profile">
        <span>
          <img
            src="/assets/farmer-adviser.png"
            alt="MeghSetu adviser illustration"
          />
        </span>
        <h3>Your weather companion.</h3>
        <small>English · हिन्दी · मराठी</small>
      </div>
      <div className="handset-example-label">EXAMPLE CONVERSATION</div>
      <div className="handset-conversation">
        <div
          className={`handset-message-question ${questionVisible ? "shown" : ""}`}
        >
          {questionVisible ? question.slice(0, chars) : ""}
          {playing && questionVisible && chars < question.length && <i />}
        </div>
        {questionVisible && !responseVisible && (
          <div className="handset-typing" aria-label="Example reply appearing">
            <span />
            <span />
            <span />
          </div>
        )}
        {responseVisible && (
          <div className="handset-message-answer">
            <span>
              <CloudSun size={12} /> MEGHSETU
            </span>
            <p>
              Start with your seven-day outlook, then check crop-stage guidance
              and the official local bulletin.
            </p>
            <div>
              <AudioLines size={12} />
              <span>
                {Array.from({ length: 12 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      height: `${4 + ((i * 7) % 12)}px`,
                      animationDelay: `${i * 0.07}s`,
                    }}
                  />
                ))}
              </span>
              <small>Voice preview</small>
            </div>
          </div>
        )}
        {!questionVisible && (
          <div className="handset-chat-invitation">
            <AudioLines size={26} />
            <p>
              A question today.
              <br />A clearer plan tomorrow.
            </p>
          </div>
        )}
      </div>
      <button
        className="handset-sample-prompt"
        onClick={onSend}
        aria-label="Play example question in phone preview"
      >
        <span>{question}</span>
        <Send size={13} />
        <AutoTap visible={playing && phase >= 7 && phase < 11} />
      </button>
      <div className="handset-small-note">
        Illustrative chat · no microphone or API call
      </div>
    </div>
  );
}

export default function MobileShowcase({ data, onExplore, onChat }) {
  const reduced = useReducedMotion(),
    section = useRef(),
    phoneViewport = useRef();
  const [autoplay, setAutoplay] = useState(() => !reduced),
    [visible, setVisible] = useState(false),
    [frame, setFrame] = useState(0);
  const [manualMetric, setManualMetric] = useState(null),
    [manualDay, setManualDay] = useState(null),
    [manualCrop, setManualCrop] = useState(null),
    [manualStage, setManualStage] = useState(null),
    [sent, setSent] = useState(false);
  const active = Math.floor(frame / TICKS) % 3,
    phase = frame % TICKS,
    step = STEPS[active],
    playing = autoplay && visible;
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 },
    );
    observer.observe(section.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (reduced) setAutoplay(false);
  }, [reduced]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      if (!document.hidden) setFrame((value) => (value + 1) % (TICKS * 3));
    }, 250);
    return () => clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    if (playing && [0, 18, 23].includes(phase)) {
      const pane = phoneViewport.current;
      pane?.scrollTo({
        top: phase === 0 ? 0 : pane.scrollHeight,
        behavior: reduced ? "instant" : "smooth",
      });
    }
  }, [active, phase, playing, reduced]);
  function resetChoices() {
    setManualMetric(null);
    setManualDay(null);
    setManualCrop(null);
    setManualStage(null);
    setSent(false);
  }
  function choose(index) {
    setAutoplay(false);
    setFrame(index * TICKS);
    resetChoices();
  }
  function interact(setter, value) {
    setAutoplay(false);
    setter(value);
  }
  function toggle() {
    if (!autoplay) resetChoices();
    setAutoplay((value) => !value);
  }
  const action =
    active === 0
      ? phase < 8
        ? "Checking the local outlook"
        : phase < 18
          ? "Switching to rainfall"
          : "Exploring the next day's forecast"
      : active === 1
        ? phase < 10
          ? "Opening crop planning"
          : phase < 16
            ? "Choosing wheat"
            : "Reviewing the harvest stage"
        : phase < 9
          ? "Opening the weather assistant"
          : phase < 20
            ? "Asking a sample question"
            : "Reading an example reply";
  return (
    <section
      ref={section}
      id="mobile-preview"
      className="portal-section mobile-showcase"
      data-in-view={visible}
      aria-labelledby="mobile-showcase-title"
    >
      <div className="mobile-showcase-layout">
        <div className="mobile-showcase-copy">
          <div className="portal-kicker">
            <Smartphone size={14} />
            01 / MEGHSETU ON MOBILE
          </div>
          <h2 id="mobile-showcase-title">
            A local outlook.
            <br />
            <span>Always within reach.</span>
          </h2>
          <p>
            The same MeghSetu, made for the palm of your hand. Watch the
            walkthrough, or tap a screen to explore it yourself.
          </p>
          <div
            className="mobile-journey-steps"
            role="group"
            aria-label="Mobile preview screens"
          >
            {STEPS.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.short}
                  aria-pressed={active === index}
                  onClick={() => choose(index)}
                >
                  <span className="mobile-step-icon">
                    <Icon size={20} />
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.copy}</small>
                    <b>{item.short}</b>
                  </span>
                  <span className="mobile-step-number">0{index + 1}</span>
                  {active === index && (
                    <i style={{ width: `${((phase + 1) / TICKS) * 100}%` }} />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mobile-showcase-actions">
            <button
              className="button primary"
              onClick={() => (active === 2 ? onChat() : onExplore(step.route))}
            >
              {step.action}
              <ArrowUpRight size={16} />
            </button>
            <span>One website. Every screen.</span>
          </div>
        </div>
        <div className="mobile-showcase-stage">
          <div className="mobile-stage-orbit orbit-a" aria-hidden="true" />
          <div className="mobile-stage-orbit orbit-b" aria-hidden="true" />
          <div className="mobile-stage-plinth" aria-hidden="true" />
          <div className="mobile-floating-note note-local">
            <MapPin size={19} />
            <span>
              Local by design
              <strong>{data?.local.location.name || "Your community"}</strong>
            </span>
          </div>
          <div className="mobile-floating-note note-language">
            <img src="/assets/farmer-adviser.png" alt="" />
            <span>
              A familiar voice<strong>English · हिन्दी · मराठी</strong>
            </span>
          </div>
          <div
            className={`showcase-handset ${playing ? "tour-playing" : "tour-paused"}`}
            onFocusCapture={() => setAutoplay(false)}
          >
            <div className="handset-hardware" aria-hidden="true">
              <span />
              <i />
              <b />
            </div>
            <div className="handset-screen">
              <div className="handset-status" aria-hidden="true">
                <span>9:41</span>
                <div>
                  <Radio size={10} />
                  <BatteryFull size={14} />
                </div>
              </div>
              <div className="handset-brandbar">
                <CloudSun size={21} />
                <strong>
                  MeghSetu<span>.</span>
                </strong>
                <span>PREVIEW</span>
              </div>
              <div className="handset-location">
                <MapPin size={10} />
                {data?.local.location.name || "Your location"}
                <span>Weather & farming</span>
              </div>
              <div
                className="handset-page-viewport"
                ref={phoneViewport}
                key={active}
              >
                {active === 0 && (
                  <ForecastScreen
                    data={data}
                    phase={phase}
                    playing={playing}
                    metric={
                      manualMetric || (phase >= 8 ? "Rainfall" : "Temperature")
                    }
                    onMetric={(value) => interact(setManualMetric, value)}
                    selectedDay={manualDay ?? (phase >= 18 ? 1 : 0)}
                    onDay={(value) => interact(setManualDay, value)}
                  />
                )}{" "}
                {active === 1 && (
                  <CropScreen
                    phase={phase}
                    playing={playing}
                    crop={manualCrop || (phase >= 10 ? "Wheat" : "Rice")}
                    stage={
                      manualStage || (phase >= 16 ? "Harvest" : "Vegetative")
                    }
                    onCrop={(value) => interact(setManualCrop, value)}
                    onStage={(value) => interact(setManualStage, value)}
                  />
                )}{" "}
                {active === 2 && (
                  <AssistantScreen
                    phase={phase}
                    playing={playing}
                    sent={sent}
                    onSend={() => interact(setSent, true)}
                  />
                )}
              </div>
              <nav
                className="handset-bottom-nav"
                aria-label="Phone preview navigation"
              >
                {STEPS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.short}
                      aria-label={`Show ${item.short.toLowerCase()} in phone preview`}
                      aria-current={active === index ? "page" : undefined}
                      onClick={() => choose(index)}
                    >
                      <Icon size={15} />
                      <span>{item.short}</span>
                      <AutoTap
                        visible={
                          playing && index === (active + 1) % 3 && phase >= 28
                        }
                      />
                    </button>
                  );
                })}
              </nav>
              <div className="handset-home-bar" aria-hidden="true" />
            </div>
          </div>
          <div className="mobile-tour-controls">
            <button
              onClick={toggle}
              aria-label={
                autoplay
                  ? "Pause mobile walkthrough"
                  : "Play mobile walkthrough"
              }
              aria-pressed={!autoplay}
            >
              {autoplay ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <div>
              <span>
                {autoplay ? "AUTOMATIC WALKTHROUGH" : "EXPLORE AT YOUR PACE"}
              </span>
              <strong>{autoplay ? action : step.title}</strong>
            </div>
            <button
              aria-label="Restart mobile walkthrough"
              onClick={() => {
                resetChoices();
                setFrame(0);
                setAutoplay(true);
              }}
            >
              <RotateCcw size={14} />
            </button>
            <span>
              0{active + 1}
              <i>/ 03</i>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
