import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { supabase } from "../../lib/supabase";

function MicBars({ stream }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!stream) return;
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    src.connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(buf);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const c = canvas.getContext("2d");
      c.clearRect(0, 0, canvas.width, canvas.height);
      const barW = canvas.width / 12;
      for (let i = 0; i < 12; i++) {
        const v = buf[i * 2] / 255;
        const h = Math.max(4, v * canvas.height);
        const x = i * barW + barW * 0.15;
        c.fillStyle = `rgba(0, 112, 243, ${0.4 + v * 0.6})`;
        c.beginPath();
        c.roundRect(x, (canvas.height - h) / 2, barW * 0.7, h, 3);
        c.fill();
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ctx.close();
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={40}
      style={{ display: "block" }}
    />
  );
}

export function VoiceCallModal({ debts, income, lang, firstName, onClose }) {
  const [status, setStatus] = useState("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const [muted, setMuted] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [micStream, setMicStream] = useState(null);
  const roomRef = useRef(null);
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) throw new Error("Not signed in");

        const resp = await fetch("/api/voice/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ debts, income, lang, firstName }),
        });
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.error ?? `Token endpoint returned ${resp.status}`);
        }
        const { token, url } = await resp.json();
        if (cancelled) return;

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.autoplay = true;
            el.style.display = "none";
            document.body.appendChild(el);

            // Detect when the agent is producing audio
            const actx = new AudioContext();
            const src = actx.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
            const analyser = actx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            const buf = new Uint8Array(analyser.frequencyBinCount);
            let raf;
            const poll = () => {
              raf = requestAnimationFrame(poll);
              analyser.getByteFrequencyData(buf);
              const avg = buf.reduce((s, v) => s + v, 0) / buf.length;
              setAgentSpeaking(avg > 5);
            };
            poll();
            track.on("ended", () => { cancelAnimationFrame(raf); actx.close(); });
          }
        });

        room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
          const isLocal = participant?.identity === room.localParticipant.identity;
          const who = isLocal ? "user" : "advisor";
          setTranscript((prev) => {
            const next = [...prev];
            for (const seg of segments) {
              if (!seg.final) continue;
              const last = next[next.length - 1];
              if (last && last.who === who) {
                last.text = `${last.text} ${seg.text}`.trim();
              } else {
                next.push({ who, text: seg.text });
              }
            }
            return next;
          });
        });

        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled) setStatus("ended");
        });

        await room.connect(url, token);
        await room.localParticipant.setMicrophoneEnabled(true);

        // Grab the raw mic stream for the waveform bars
        const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
        const rawTrack = micPub?.track?.mediaStreamTrack;
        if (rawTrack && !cancelled) {
          setMicStream(new MediaStream([rawTrack]));
        }

        if (!cancelled) setStatus("connected");
      } catch (err) {
        console.error("voice call connect failed:", err);
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(err.message ?? "Could not connect");
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      const room = roomRef.current;
      if (room) {
        room.disconnect();
        roomRef.current = null;
      }
      setMicStream(null);
    };
  }, [debts, income, lang, firstName]);

  const toggleMute = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !muted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  };

  const endCall = () => {
    const room = roomRef.current;
    if (room) room.disconnect();
    onClose();
  };

  const t = (nl, en) => (lang === "nl" ? nl : en);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={endCall}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg, #fff)",
          color: "var(--text-primary, #000)",
          borderRadius: 16,
          width: "min(480px, 92vw)",
          maxHeight: "80vh",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: agentSpeaking ? "#00aa44" : "#111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 22,
              transition: "background 0.2s",
              boxShadow: agentSpeaking ? "0 0 0 6px rgba(0,170,68,0.25)" : "none",
            }}
          >
            ◉
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>
              {t("Je adviseur", "Your advisor")}
              {agentSpeaking && (
                <span style={{ marginLeft: 8, fontSize: 12, color: "#00aa44", fontWeight: 400 }}>
                  {t("spreekt…", "speaking…")}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {status === "connecting" && t("Verbinden…", "Connecting…")}
              {status === "connected" && t("In gesprek", "On the call")}
              {status === "ended" && t("Beëindigd", "Ended")}
              {status === "error" && t("Verbindingsfout", "Connection error")}
            </div>
          </div>
        </div>

        {status === "error" && (
          <div
            style={{
              color: "#c00",
              fontSize: 13,
              background: "#fff0f0",
              borderRadius: 8,
              padding: "8px 12px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Transcript */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            background: "var(--bg-soft, #f5f5f5)",
            borderRadius: 12,
            padding: 12,
            minHeight: 180,
            fontSize: 14,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {transcript.length === 0 && (
            <div style={{ opacity: 0.45, textAlign: "center", marginTop: 60 }}>
              {status === "connecting"
                ? t("Verbinden met je adviseur…", "Connecting to your advisor…")
                : t(
                    "Het transcript verschijnt hier zodra je begint te praten.",
                    "The transcript will appear here as you talk."
                  )}
            </div>
          )}
          {transcript.map((line, i) => (
            <div
              key={i}
              style={{
                alignSelf: line.who === "user" ? "flex-end" : "flex-start",
                background: line.who === "user" ? "var(--accent, #0070f3)" : "#111",
                color: "white",
                padding: "8px 12px",
                borderRadius: 12,
                maxWidth: "80%",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              {line.text}
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>

        {/* Mic visualizer + controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: muted ? "#c00" : "#00aa44",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, opacity: 0.6 }}>
              {muted ? t("Microfoon uit", "Mic off") : t("Microfoon aan", "Mic on")}
            </span>
            {!muted && micStream && <MicBars stream={micStream} />}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={toggleMute}
              disabled={status !== "connected"}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid var(--card-border, #ddd)",
                background: muted ? "#c00" : "transparent",
                color: muted ? "white" : "inherit",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {muted ? "🎙 Unmute" : "🔇 Mute"}
            </button>
            <button
              onClick={endCall}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: "none",
                background: "#c00",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {t("Ophangen", "End call")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
