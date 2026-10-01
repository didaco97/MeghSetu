import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  CloudSun,
  CloudRain,
  Leaf,
  ChartNoAxesCombined,
  AudioLines,
  Workflow,
  LockKeyhole,
  Map,
  ArrowDown,
  Menu,
  X,
  Languages,
  Clock3,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Logo } from "./ui";
import MobileShowcase from "./MobileShowcase";
import HeroVision from "./HeroVision";
import { LOCKED, PRESETS } from "./data";
const services = [
  {
    id: "forecast",
    icon: Map,
    title: "Local weather forecast",
    copy: "Explore the map, seven-day outlook and downloadable forecast.",
    action: "View forecast",
  },
  {
    id: "comparison",
    icon: ChartNoAxesCombined,
    title: "Compare locations",
    copy: "Compare rainfall and temperature at two forecast coordinates.",
    action: "Compare weather",
  },
  {
    id: "advisory",
    icon: Leaf,
    title: "Crop planning",
    copy: "Explore weather-based guidance for your crop and growth stage.",
    action: "Plan for your crop",
  },
  {
    id: "pipeline",
    icon: Workflow,
    title: "Forecast processing",
    copy: "Follow retrieval, quality checks and delivery through server events.",
    action: "View processing",
  },
  {
    id: "assistant",
    icon: AudioLines,
    title: "Multilingual assistance",
    copy: "Ask a question or speak in English, Hindi or Marathi.",
    action: "Ask MeghSetu",
  },
];

export default function Landing({
  data,
  loading,
  onExplore,
  onChat,
  onLock,
  onLocation,
}) {
  const [menu, setMenu] = useState(false),
    [place, setPlace] = useState(0);
  const reduced = useReducedMotion(),
    header = useRef();
  useEffect(() => {
    const root = document.documentElement;
    const measure = () =>
      root.style.setProperty(
        "--portal-header-height",
        `${header.current?.getBoundingClientRect().height || 130}px`,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(header.current);
    measure();
    root.classList.add("portal-scroll");
    const anchor = window.location.hash.slice(1);
    const anchorFrame = requestAnimationFrame(() => {
      if (["idea", "mobile-preview", "tools", "workflow", "team"].includes(anchor)) {
        document.getElementById(anchor)?.scrollIntoView({ block: "start", behavior: "instant" });
      }
    });
    return () => {
      cancelAnimationFrame(anchorFrame);
      observer.disconnect();
      root.classList.remove("portal-scroll");
      root.style.removeProperty("--portal-header-height");
    };
  }, []);
  const reveal = {
    initial: { opacity: 0, y: reduced ? 0 : 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.1 },
    transition: { duration: 0.4 },
  };
  function explore() {
    onLocation(PRESETS[place]);
    onExplore("forecast");
  }
  return (
    <div className="landing civic-landing">
      <div className="portal-masthead" ref={header}>
        <div className="portal-utility">
          <span>
            SIH 2026 PROTOTYPE <i /> MoES / IMD · PS26074
          </span>
          <button
            onClick={onChat}
            aria-label="Language assistance in English, Hindi or Marathi"
          >
            <Languages size={14} />
            <span>English · हिन्दी · मराठी</span>
          </button>
        </div>
        <header className="portal-identity">
          <div className="portal-brand">
            <Logo
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: reduced ? "instant" : "smooth",
                })
              }
            />
            <span className="portal-descriptor">
              LOCAL WEATHER & AGRICULTURAL PLANNING
            </span>
          </div>
          <div className="portal-institution">
            <strong>Ministry of Earth Sciences</strong>
            <span>
              India Meteorological Department · Problem statement context
            </span>
          </div>
          <div className="portal-team">
            <strong>HoneyBager</strong>
            <span>
              TEAM ID <b>133270</b>
            </span>
          </div>
        </header>
        <div className="portal-navigation">
          <button
            className="portal-menu"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-label={menu ? "Close navigation" : "Open navigation"}
          >
            {menu ? <X size={19} /> : <Menu size={19} />}
            <span>Menu</span>
          </button>
          <nav className={menu ? "expanded" : ""} aria-label="Main navigation">
            {[
              ["idea", "Home"],
              ["mobile-preview", "Mobile preview"],
              ["tools", "Citizen services"],
              ["workflow", "How it works"],
              ["team", "Project & roadmap"],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
                {label}
              </a>
            ))}
          </nav>
          <button
            className="portal-launch"
            onClick={() => onExplore("forecast")}
          >
            Open workspace <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
      <main>
        <section
          className="portal-section portal-hero landscape-hero"
          id="idea"
          aria-labelledby="portal-title"
        >
          <picture className="hero-artwork" aria-hidden="true">
            <source srcSet="/assets/hero-satellite-landscape.webp" type="image/webp" />
            <img
              src="/assets/hero-satellite-landscape.png"
              alt=""
              width="2560"
              height="1195"
              fetchPriority="high"
            />
          </picture>
          <div className="portal-hero-grid">
            <motion.div {...reveal} className="portal-hero-copy">
              <div className="portal-kicker">
                <span /> WEATHER INFORMATION FOR LOCAL DECISIONS
              </div>
              <h1 id="portal-title">
                Local weather.
                <br />
                <span>Informed farming.</span>
              </h1>
              <p>
                Explore forecasts for your location, compare nearby weather and
                plan around the needs of your crop.
              </p>
              <form
                className="portal-location-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  explore();
                }}
              >
                <label htmlFor="landing-location">
                  Choose a location to get started
                </label>
                <div>
                  <MapPin size={19} />
                  <select
                    id="landing-location"
                    value={place}
                    onChange={(e) => setPlace(Number(e.target.value))}
                  >
                    {PRESETS.map((p, i) => (
                      <option key={p.name} value={i}>
                        {p.name}, {p.region}
                      </option>
                    ))}
                  </select>
                  <button type="submit">
                    View forecast <ArrowRight size={17} />
                  </button>
                </div>
              </form>
              <div className="portal-hero-links">
                <button onClick={onChat}>
                  <AudioLines size={18} /> Ask in your language
                </button>
                <a href="#mobile-preview">
                  See it on mobile <ChevronRight size={16} />
                </a>
              </div>
              <div className="portal-context">
                <CheckCircle2 size={16} />
                <span>
                  SIH prototype addressing MoES / IMD Problem Statement 26074
                </span>
              </div>
            </motion.div>
            <HeroVision onExplore={() => onLock(LOCKED.find((feature) => feature.id === "downscaling"))} />
          </div>
          <div className="portal-summary-strip">
            <div>
              <CloudRain size={22} />
              <span>
                <strong>7-day outlook</strong>
                <small>Rainfall, temperature & wind</small>
              </span>
            </div>
            <div>
              <Leaf size={22} />
              <span>
                <strong>Crop-stage planning</strong>
                <small>Weather-based guidance</small>
              </span>
            </div>
            <div>
              <AudioLines size={22} />
              <span>
                <strong>3 languages</strong>
                <small>English, Hindi & Marathi</small>
              </span>
            </div>
            <a href="#tools" aria-label="Explore citizen services">
              <span>Explore services</span>
              <ArrowDown size={19} />
            </a>
          </div>
        </section>
        <MobileShowcase data={data} onExplore={onExplore} onChat={onChat} />
        <section
          className="portal-section portal-services"
          id="tools"
          aria-labelledby="services-title"
        >
          <div className="portal-section-heading">
            <div>
              <div className="portal-kicker">02 / CITIZEN SERVICES</div>
              <h2 id="services-title">Weather information you can use.</h2>
            </div>
            <span className="portal-availability">
              <span /> 5 services available in the prototype
            </span>
          </div>
          <div className="portal-service-grid">
            {services.map(({ id, icon: Icon, title, copy, action }, i) => (
              <motion.button
                {...reveal}
                key={id}
                className={`portal-service ${i === 0 ? "featured-service" : ""}`}
                onClick={() => (id === "assistant" ? onChat() : onExplore(id))}
              >
                <div className="portal-service-top">
                  <Icon size={26} />
                  <span>0{i + 1}</span>
                </div>
                {id === "advisory" && (
                  <img
                    className="service-art crop-art"
                    src="/assets/crop-care.png"
                    alt=""
                    loading="lazy"
                  />
                )}
                {id === "assistant" && (
                  <img
                    className="service-art adviser-art"
                    src="/assets/farmer-adviser.png"
                    alt=""
                    loading="lazy"
                  />
                )}
                <h3>{title}</h3>
                <p>{copy}</p>
                {i === 0 && (
                  <div className="portal-service-weather" aria-hidden="true">
                    <CloudSun size={64} strokeWidth={1} />
                    <span>
                      7<small>DAY OUTLOOK</small>
                    </span>
                  </div>
                )}
                <span className="portal-service-action">
                  {action}
                  <ArrowUpRight size={19} />
                </span>
              </motion.button>
            ))}
          </div>
          <div className="portal-section-note">
            <Clock3 size={16} />
            <p>
              Forecasts are retrieved on request. Source, retrieval time and
              data limitations remain available in the workspace.
            </p>
          </div>
        </section>
        <section
          className="portal-section portal-method"
          id="workflow"
          aria-labelledby="method-title"
        >
          <div className="portal-section-heading">
            <div>
              <div className="portal-kicker">03 / HOW IT WORKS</div>
              <h2 id="method-title">From a forecast to a local decision.</h2>
            </div>
            <span className="portal-heading-aside">One connected workflow</span>
          </div>
          <div className="portal-method-grid">
            <figure className="portal-landscape">
              <img
                src="/assets/ministry-landscape.png"
                alt="AI-generated illustration of agricultural fields in Maharashtra beneath monsoon clouds"
                loading="lazy"
              />
              <div className="portal-landscape-grid" aria-hidden="true" />
              <figcaption>
                <span>THE MEGHSETU VISION</span>
                <strong>
                  Weather intelligence.
                  <br />
                  Within everyone's reach.
                </strong>
                <small>Illustrative artwork · AI-generated PNG</small>
              </figcaption>
            </figure>
            <div className="portal-method-content">
              <ol>
                {[
                  [
                    "Choose your location",
                    "Search an Indian town or select a point on the map.",
                  ],
                  [
                    "Retrieve the weather outlook",
                    "The server fetches model forecasts, checks the data and prepares daily indicators.",
                  ],
                  [
                    "Explore and plan",
                    "Compare locations, review crop-stage guidance and ask questions in your language.",
                  ],
                ].map(([title, copy], i) => (
                  <li key={title}>
                    <span>0{i + 1}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{copy}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="portal-method-actions">
                <button
                  className="button primary"
                  onClick={() => onExplore("pipeline")}
                >
                  View a forecast run <ArrowUpRight size={17} />
                </button>
                <span>
                  <CheckCircle2 size={15} /> Live backend event tracking
                </span>
              </div>
              <p className="portal-method-note">
                Current forecasts use Open-Meteo. Satellite ingestion and
                trained Panchayat downscaling are planned extensions.
              </p>
            </div>
          </div>
        </section>
        <section
          className="portal-section portal-project"
          id="team"
          aria-labelledby="project-title"
        >
          <div className="portal-section-heading">
            <div>
              <div className="portal-kicker">04 / PROJECT & DEVELOPMENT</div>
              <h2 id="project-title">
                Building towards Panchayat-scale forecasts.
              </h2>
            </div>
            <span className="portal-heading-aside">
              Smart India Hackathon 2026
            </span>
          </div>
          <div className="portal-project-grid">
            <div className="portal-roadmap">
              <div className="portal-roadmap-heading">
                <strong>Explore concept previews</strong>
                <span>
                  <LockKeyhole size={13} /> Demo screens available
                </span>
              </div>
              {LOCKED.map((feature, i) => (
                <button key={feature.name} onClick={() => onLock(feature)}>
                  <span className="portal-roadmap-number">
                    {String(i + 6).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{feature.name}</strong>
                    <small>{feature.tag}</small>
                  </span>
                  <LockKeyhole size={16} />
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
            <aside className="portal-project-card">
              <span className="portal-kicker">DESIGNED & DEVELOPED BY</span>
              <h3>HoneyBager</h3>
              <div className="portal-team-id">
                <span>TEAM ID</span>
                <strong>133270</strong>
              </div>
              <p>
                MeghSetu connects weather information with agricultural planning
                for local communities.
              </p>
              <dl>
                <div>
                  <dt>Problem statement</dt>
                  <dd>PS26074</dd>
                </div>
                <div>
                  <dt>Organisation context</dt>
                  <dd>MoES / IMD</dd>
                </div>
                <div>
                  <dt>Project status</dt>
                  <dd>Working SIH prototype</dd>
                </div>
              </dl>
              <button
                className="button primary"
                onClick={() => onExplore("forecast")}
              >
                Explore the workspace <ArrowUpRight size={17} />
              </button>
            </aside>
          </div>
          <footer className="portal-footer">
            <span>MeghSetu · HoneyBager · SIH 2026 prototype</span>
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Weather data: Open-Meteo <ArrowUpRight size={12} />
            </a>
            <button onClick={onChat}>Help & language assistance</button>
          </footer>
        </section>
      </main>
    </div>
  );
}
