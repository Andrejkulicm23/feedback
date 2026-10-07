import React, { useState } from "react";
import "./feedback.css";

const EMOJIS = ["😡", "😕", "😐", "🙂", "😄"];

export default function Feedback() {
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected === null) return;
    setStatus("sending");
    try {
      const payload = {
        emoji: EMOJIS[selected],
        rating: selected + 1,
        ts: new Date().toISOString(),
      };

      const res = await fetch("http://localhost:4000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let body: any = null;
        try {
          body = await res.json();
        } catch (e) {
          /* ignore */
        }
        console.error("Server error", res.status, body);
        setErrorMsg(body?.error || `Server returned ${res.status}`);
        setStatus("error");
      } else {
        setStatus("sent");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="feedback-thanks">
        <h2>Děkujeme za zpětnou vazbu!</h2>
        <p>Vaše odpověď byla uložena.</p>
      </div>
    );
  }

  return (
    <main className="feedback-root">
      <form className="feedback-card" onSubmit={handleSubmit}>
        <h1 className="feedback-title">Jak se vám dnes daří?</h1>
        <div className="emoji-row">
          {EMOJIS.map((e, i) => (
            <button
              key={i}
              type="button"
              className={"emoji-btn " + (selected === i ? "selected" : "")}
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
            >
              <span className="emoji" aria-hidden>
                {e}
              </span>
            </button>
          ))}
        </div>

        <div className="actions">
          <button
            className="submit"
            type="submit"
            disabled={selected === null || status === "sending"}
          >
            {status === "sending" ? "Odesílám…" : "Odeslat zpětnou vazbu"}
          </button>
          {status === "error" && (
            <span className="error">
              {errorMsg || "Došlo k chybě, zkuste to prosím znovu."}
            </span>
          )}
        </div>
      </form>
    </main>
  );
}
