import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowUpRight, Pause, Play, Satellite } from "lucide-react";
import "./hero-landscape.css";

// This diagram explains the proposed resolution change; it runs no inference.
export default function HeroVision({ onExplore }) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(!document.hidden);
  const root = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(root.current);
    const updateVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);
  const playing = !reduced && !paused && visible && tabVisible;
  return (
    <div className="hero-vision" ref={root} data-playing={playing} data-in-view={visible}>
      <div className="hero-satellite-caption">
        <Satellite size={17} strokeWidth={1.6} />
        <span>A satellite-informed vision<small>Closer to every panchayat.</small></span>
      </div>
      <figure className="hero-resolution-card" aria-label="Concept illustration: block-level forecasts combine with satellite and terrain context to produce proposed panchayat-level outlooks.">
        <figcaption>
          <span>FROM BLOCK TO PANCHAYAT</span>
          <span className="hero-concept-tag">Concept</span>
          {!reduced && <button
            className="hero-motion-toggle"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "Play downscaling illustration" : "Pause downscaling illustration"}
            aria-pressed={paused}
          >{paused ? <Play size={13} /> : <Pause size={13} />}</button>}
        </figcaption>
        <div className="hero-resolution-flow">
          <div className="hero-resolution-stage">
            <svg className="hero-block-grid" viewBox="0 0 66 66" aria-hidden="true">
              <rect x="3" y="3" width="60" height="60" rx="9" fill="#bcdce8" stroke="#6095ab" />
              <path d="M33 3V63M3 33H63" stroke="#e8f6fb" strokeWidth="2" />
              <path d="M18 25H44A7 7 0 0 0 42 11A10 10 0 0 0 23 12A7 7 0 0 0 18 25Z" fill="#f5fcff" transform="translate(0 10)" />
              <path d="M24 43L22 48M33 43L31 48M42 43L40 48" stroke="#338daf" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span><strong>Block forecast</strong><small>Broad-area input</small></span>
          </div>
          <div className="hero-resolution-bridge" aria-hidden="true">
            <span>Downscale</span>
            <svg viewBox="0 0 82 24"><path d="M3 12H76" className="hero-flow-track" /><path d="M3 12H76" className="hero-flow-pulse" /><path d="M69 6L76 12L69 18" /></svg>
            <small>Satellite + terrain</small>
          </div>
          <div className="hero-resolution-stage hero-local-stage">
            <svg className="hero-panchayat-grid" viewBox="0 0 94 66" aria-hidden="true">
              <g stroke="#fff" strokeWidth="2" strokeLinejoin="round">
                {[
                  ["M5 8L31 3L36 26L4 32Z", "#53b9c5"],
                  ["M31 3L63 7L61 28L36 26Z", "#81cec7"],
                  ["M63 7L88 3L91 30L61 28Z", "#99ca99"],
                  ["M4 32L36 26L31 59L8 63Z", "#78c8db"],
                  ["M36 26L61 28L65 61L31 59Z", "#b6d58a"],
                  ["M61 28L91 30L86 58L65 61Z", "#5db4bd"],
                ].map(([d, fill], index) => <path key={d} d={d} fill={fill} style={{ "--parcel-index": index }} />)}
              </g>
              <g fill="#246878" stroke="white" strokeWidth="1.5"><circle cx="21" cy="20" r="3" /><circle cx="49" cy="46" r="3" /><circle cx="76" cy="17" r="3" /></g>
            </svg>
            <span><strong>Panchayat outlooks</strong><small>Local weather detail</small></span>
          </div>
        </div>
        <div className="hero-resolution-footer">
          <span>Proposed approach · Illustrative boundaries</span>
          <button onClick={onExplore}>Explore the demo <ArrowUpRight size={14} /></button>
        </div>
      </figure>
    </div>
  );
}
