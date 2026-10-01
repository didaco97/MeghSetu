import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Send,
  Mic,
  Square,
  Volume2,
  AudioLines,
  ArrowUpRight,
  Sparkles,
  LoaderCircle,
  VolumeX,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Modal } from "./ui";

export default function Chat({ open, onClose, runId, location }) {
  const [messages, setMessages] = useState([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [language, setLanguage] = useState("English"),
    [error, setError] = useState(""),
    [recording, setRecording] = useState(false),
    [transcribing, setTranscribing] = useState(false),
    [speaking, setSpeaking] = useState(null);
  const scroll = useRef(),
    recorder = useRef(),
    stream = useRef(),
    timer = useRef(),
    audio = useRef(),
    request = useRef(),
    alive = useRef(true),
    openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    scroll.current?.scrollTo({
      top: scroll.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);
  function stopAudio() {
    audio.current?.pause();
    audio.current = null;
    setSpeaking(null);
  }
  function cleanupMic() {
    clearTimeout(timer.current);
    stream.current?.getTracks().forEach((x) => x.stop());
    stream.current = null;
  }
  useEffect(() => {
    if (!open) {
      stopAudio();
      if (recorder.current?.state === "recording") {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      cleanupMic();
      setRecording(false);
    }
  }, [open]);
  useEffect(
    () => () => {
      alive.current = false;
      request.current?.abort();
      cleanupMic();
      audio.current?.pause();
    },
    [],
  );
  async function speak(text, index) {
    stopAudio();
    setSpeaking(index);
    setError("");
    try {
      const r = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 2350), language }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (!openRef.current) {
        setSpeaking(null);
        return;
      }
      const player = new Audio(`data:${d.mimeType};base64,${d.audio}`);
      audio.current = player;
      player.onended = () => setSpeaking(null);
      await player.play();
    } catch (e) {
      setSpeaking(null);
      setError(e.message || "Audio could not be played.");
    }
  }
  async function send(text = input, voice = false) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setError("");
    const history = messages.map((x) => ({ role: x.role, content: x.text }));
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setBusy(true);
    request.current = new AbortController();
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, history, runId, language }),
        signal: request.current.signal,
      });
      const d = await response.json();
      if (!response.ok) throw new Error(d.error);
      setMessages((prev) => [...prev, { role: "assistant", ...d }]);
      if (voice && openRef.current) speak(d.text, history.length + 1);
    } catch (e) {
      if (e.name !== "AbortError")
        setError(
          e.message || "The assistant is unavailable. Please try again.",
        );
    } finally {
      setBusy(false);
    }
  }
  async function record() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        "Voice recording is not supported in this browser. You can still type.",
      );
      return;
    }
    setError("");
    stopAudio();
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (!openRef.current) {
        cleanupMic();
        return;
      }
      const type = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = new MediaRecorder(
        stream.current,
        type ? { mimeType: type } : {},
      );
      recorder.current = rec;
      const chunks = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = async () => {
        cleanupMic();
        setRecording(false);
        if (!chunks.length || !openRef.current) return;
        setTranscribing(true);
        try {
          const form = new FormData();
          const mime = rec.mimeType || "audio/webm";
          const recordingBlob = new Blob(chunks, { type: mime });
          if (recordingBlob.size > 4 * 1024 * 1024) {
            throw new Error("Keep recordings below 4 MB. Please record a shorter question.");
          }
          form.append(
            "audio",
            recordingBlob,
            mime.includes("mp4") ? "question.mp4" : "question.webm",
          );
          const r = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: form,
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          if (!d.text?.trim())
            throw new Error("No speech was detected. Please try again.");
          if (openRef.current) await send(d.text, true);
        } catch (e) {
          setError(e.message);
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      setRecording(true);
      timer.current = setTimeout(() => {
        if (rec.state === "recording") rec.stop();
      }, 25000);
    } catch {
      cleanupMic();
      setError(
        "Microphone access was not available. Allow it in your browser or type your question.",
      );
    }
  }
  if (!open) return null;
  return (
    <Modal
      title="Your weather companion."
      onClose={onClose}
      label="MEGHSETU ASSISTANT"
    >
      <div className="chat-context">
        <span className="live-dot" />
        <span>
          {location.name}
          {runId
            ? " · Forecast connected"
            : " · Run a forecast for local context"}
        </span>
        <select
          aria-label="Assistant language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {["English", "Hindi", "Marathi"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <div className="chat-log" ref={scroll} aria-live="polite">
        {!messages.length && (
          <div className="chat-empty">
            <div className="voice-orb adviser-orb">
              <img src="/assets/farmer-adviser.png" alt="Illustrated MeghSetu agricultural adviser"/>
            </div>
            <h3>Ask about your local outlook.</h3>
            <p>
              Type a question, or tap the microphone.
              <br />
              Voice recordings are limited to 25 seconds.
            </p>
            <div className="suggestions">
              {[
                "Will it rain this week?",
                "How should I read this forecast?",
                "What can MeghSetu do today?",
              ].map((x) => (
                <button key={x} onClick={() => send(x)}>
                  {x}
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div className={`chat-message ${m.role}`} key={i}>
            <div className="message-label">
              {m.role === "user" ? "YOU" : "MEGHSETU"}
            </div>
            <ReactMarkdown>{m.text}</ReactMarkdown>
            {m.sources?.length > 0 && (
              <div className="chat-sources">
                {m.sources.map((s, j) => (
                  <a
                    key={s.url + j}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.label || "Source"} · {s.title}
                    <ArrowUpRight size={11} />
                  </a>
                ))}
              </div>
            )}
            {m.role === "assistant" && (
              <button
                className="listen-btn"
                onClick={() =>
                  speaking === i ? stopAudio() : speak(m.text, i)
                }
              >
                {speaking === i ? <VolumeX size={14} /> : <Volume2 size={14} />}{" "}
                {speaking === i ? "Stop audio" : "Listen"}
              </button>
            )}
          </div>
        ))}
        {busy && (
          <div className="chat-thinking">
            <span />
            <span />
            <span /> Reading the forecast and sources
          </div>
        )}
      </div>
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <button
          type="button"
          className={`mic-btn ${recording ? "recording" : ""}`}
          aria-label={recording ? "Stop recording" : "Record voice question"}
          disabled={busy || transcribing}
          onClick={record}
        >
          {recording ? (
            <Square size={18} />
          ) : transcribing ? (
            <LoaderCircle className="spin" size={19} />
          ) : (
            <Mic size={19} />
          )}
        </button>
        <input
          aria-label="Message MeghSetu"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
          placeholder={
            recording ? "Listening… tap stop when ready" : "Ask MeghSetu…"
          }
          disabled={recording || transcribing}
        />
        <button
          className="send-btn"
          aria-label="Send message"
          disabled={!input.trim() || busy || recording || transcribing}
        >
          <Send size={18} />
        </button>
      </form>
      <p className="chat-footnote">
        {recording
          ? "Recording your question. Audio is sent for transcription when you stop."
          : "Answers use your forecast context and cited sources. Review guidance before field decisions."}
      </p>
    </Modal>
  );
}
