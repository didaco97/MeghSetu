import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AudioLines, Check, X, ArrowUpRight } from "lucide-react";
import Landing from "./Landing";
import Workspace from "./Workspace";
import Chat from "./Chat";
import { Modal } from "./ui";
import { PRESETS, DEMO_IDS } from "./data";
const readPane = () =>
  location.hash.startsWith("#workspace/")
    ? location.hash.split("/")[1] || "forecast"
    : "home";
export default function App() {
  const [pane, setPane] = useState(readPane),
    [location, setLocation] = useState(PRESETS[0]),
    [reference, setReference] = useState(PRESETS[1]),
    [data, setData] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [trace, setTrace] = useState([]),
    [chat, setChat] = useState(false),
    [info, setInfo] = useState(false),
    [toast, setToast] = useState("");
  const request = useRef(),
    sequence = useRef(0),
    toastTimer = useRef();
  useEffect(() => {
    const change = () => {
      setPane(readPane());
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const notify = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }, []);
  const navigate = useCallback((page) => {
    if (page === "home") {
      window.location.hash = "";
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      window.location.hash = "workspace/" + page;
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, []);
  const closeChat = useCallback(() => setChat(false), []),
    closeInfo = useCallback(() => setInfo(false), []);
  const openPreview = useCallback(
    (feature) => navigate(feature.id),
    [navigate],
  );
  const isPreview = DEMO_IDS.includes(pane);
  const selectLocation = useCallback(
    (point) => {
      if (point.lat < 6 || point.lat > 38 || point.lon < 67 || point.lon > 98) {
        notify("Choose a location within India for this prototype.");
        return;
      }
      setLocation(point);
    },
    [notify],
  );
  const runForecast = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const current = ++sequence.current;
    setLoading(true);
    setError("");
    setData(null);
    setTrace([]);
    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, reference }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const e = await response.json();
        throw new Error(e.error || "Forecast request failed.");
      }
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = "",
        hasResult = false;
      const apply = (line) => {
        if (!line.trim() || sequence.current !== current) return;
        const event = JSON.parse(line);
        if (event.type === "step")
          setTrace((prev) => [...prev.filter((x) => x.id !== event.id), event]);
        if (event.type === "error") throw new Error(event.message);
        if (event.type === "result") {
          hasResult = true;
          setData(event.data);
        }
      };
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        lines.forEach(apply);
      }
      if (buffer.trim()) apply(buffer);
      if (!hasResult)
        throw new Error(
          "The forecast connection ended before results arrived. Please retry.",
        );
    } catch (e) {
      if (e.name !== "AbortError" && sequence.current === current)
        setError(e.message || "The weather service is unavailable.");
    } finally {
      if (sequence.current === current) setLoading(false);
    }
  }, [location, reference]);
  useEffect(() => {
    if (isPreview) return;
    runForecast();
    return () => request.current?.abort();
  }, [runForecast, isPreview]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const page = [
    "forecast",
    "comparison",
    "advisory",
    "pipeline",
    ...DEMO_IDS,
  ].includes(pane)
    ? pane
    : "home";
  return (
    <>
      <a
        className="skip-link"
        href={page === "home" ? "#tools" : "#workspace-main-content"}
        onClick={(e) => {
          if (page !== "home") {
            e.preventDefault();
            document.querySelector(".workspace-content")?.focus();
          }
        }}
      >
        Skip to content
      </a>
      {page === "home" ? (
        <Landing
          data={data}
          loading={loading}
          onExplore={navigate}
          onChat={() => setChat(true)}
          onLock={openPreview}
          onLocation={selectLocation}
        />
      ) : (
        <Workspace
          pane={page}
          data={data}
          loading={loading}
          error={error}
          location={location}
          reference={reference}
          trace={trace}
          onNavigate={navigate}
          onSelect={selectLocation}
          onReference={setReference}
          onRun={runForecast}
          onChat={() => setChat(true)}
          onLock={openPreview}
          onInfo={() => setInfo(true)}
          onToast={notify}
        />
      )}
      {page === "home" && (
        <button
          className="chat-fab"
          onClick={() => setChat(true)}
          aria-label="Open MeghSetu assistant"
        >
          <img src="/assets/farmer-adviser.png" alt="" />
          <span>Ask MeghSetu</span>
        </button>
      )}
      <Chat
        open={chat}
        onClose={closeChat}
        runId={data?.runId}
        location={location}
      />
      {info && (
        <Modal
          title="Where the forecast comes from."
          onClose={closeInfo}
          label="DATA & METHOD"
        >
          <p className="modal-lead">
            This prototype retrieves numerical weather model forecasts through
            Open-Meteo. Current conditions are modelled estimates, not on-site
            observations.
          </p>
          <div className="development-note">
            <strong>What the prototype does</strong>
            <p>
              Queries two coordinates, checks the returned series, sums daily
              rainfall and applies explicit demonstration rules. It does not
              perform satellite ingestion, trained ConvCNP inference or
              Panchayat polygon aggregation.
            </p>
          </div>
          <p>
            Retrieved:{" "}
            {data
              ? new Date(data.local.retrievedAt).toLocaleString("en-IN")
              : "Not yet loaded"}
            . The source API does not provide a model issue timestamp in this
            response. The reference location is a comparison point, not an
            official block-area mean.
          </p>
          <a
            className="text-action"
            href="https://open-meteo.com/en/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open forecast documentation <ArrowUpRight size={16} />
          </a>
        </Modal>
      )}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
          >
            <Check size={17} />
            {toast}
            <button
              onClick={() => setToast("")}
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
