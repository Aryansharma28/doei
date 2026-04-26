import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { supabase } from "../../lib/supabase";

// In-call UI. Joins a LiveKit room, plays the agent's audio, publishes the
// user's mic, shows live transcripts, and ends cleanly on close.
//
// The token endpoint (api/voice/token.ts) verifies the user's Supabase JWT
// and stuffs debts/income/lang into room metadata. Once connected, the
// LiveKit Agents worker picks up the room and starts the conversation.
export function VoiceCallModal({ debts, income, lang, firstName, onClose }) {
  const [status, setStatus] = useState("connecting"); // connecting | connected | ended | error
  const [errorMsg, setErrorMsg] = useState("");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState([]); // { who: "user"|"advisor", text }
  const roomRef = useRef(null);

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

        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.autoplay = true;
            el.style.display = "none";
            document.body.appendChild(el);
          }
        });

        // Live transcripts from the agent's STT/TTS pipeline arrive via
        // LiveKit's transcription events.
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: "var(--accent, #0070f3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 22,
            }}
          >
            ◉
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{t("Je adviseur", "Your advisor")}</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {status === "connecting" && t("Verbinden…", "Connecting…")}
              {status === "connected" && t("In gesprek", "On the call")}
              {status === "ended" && t("Beëindigd", "Ended")}
              {status === "error" && t("Fout", "Error")}
            </div>
          </div>
        </div>

        {status === "error" && (
          <div style={{ color: "#c00", fontSize: 14 }}>{errorMsg}</div>
        )}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            background: "var(--bg-soft, #f5f5f5)",
            borderRadius: 12,
            padding: 12,
            minHeight: 200,
            fontSize: 14,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {transcript.length === 0 && (
            <div style={{ opacity: 0.5, textAlign: "center", marginTop: 60 }}>
              {t(
                "Het transcript verschijnt hier zodra je begint te praten.",
                "The transcript appears here as you talk."
              )}
            </div>
          )}
          {transcript.map((line, i) => (
            <div
              key={i}
              style={{
                alignSelf: line.who === "user" ? "flex-end" : "flex-start",
                background: line.who === "user" ? "var(--accent, #0070f3)" : "white",
                color: line.who === "user" ? "white" : "var(--text-primary, #000)",
                padding: "8px 12px",
                borderRadius: 12,
                maxWidth: "80%",
              }}
            >
              {line.text}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={toggleMute}
            disabled={status !== "connected"}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid var(--card-border, #ddd)",
              background: muted ? "#c00" : "transparent",
              color: muted ? "white" : "inherit",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {muted ? t("Microfoon uit", "Muted") : t("Microfoon aan", "Mic on")}
          </button>
          <button
            onClick={endCall}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: "none",
              background: "#c00",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {t("Ophangen", "End call")}
          </button>
        </div>
      </div>
    </div>
  );
}
