"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";

const CHARACTER = {
  name: "Marco Silva",
  role: "Air & LCL Training Lead at Maersk",
};

const OPENING_MESSAGE = "Hi, thanks for setting up this meeting.";

export default function RoleplaySimulation() {
  const [screen, setScreen] = useState("briefing");
  const [hasRead, setHasRead] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const messagesEndRef = useRef(null);

  const learnerTurns = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSimulation = () => {
    setScreen("chat");
    setMessages([{ role: "assistant", content: OPENING_MESSAGE }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || ended) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/roleplay-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: newMessages, exchangeCount: learnerTurns + 1 }),
    });

    const data = await res.json();

    setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);

    if (data.ended || learnerTurns + 1 >= 12) {
      setEnded(true);
    }

    setLoading(false);
  };

  if (screen === "briefing") {
    return (
      <div style={{ padding: 40, fontFamily: "Arial" }}>
        <h1>Roleplay Briefing</h1>
        <p>
          You are meeting with Marco Silva to align global training standards.
        </p>

        <label>
          <input
            type="checkbox"
            checked={hasRead}
            onChange={(e) => setHasRead(e.target.checked)}
          />
          I’ve read the briefing
        </label>

        <br /><br />

        <button onClick={startSimulation} disabled={!hasRead}>
          Begin
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>{CHARACTER.name}</h2>
      <p>{CHARACTER.role}</p>

      <div style={{ marginBottom: 20 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "10px 0" }}>
            <b>{m.role === "assistant" ? "Marco" : "You"}:</b> {m.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {!ended && (
        <div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ width: "70%", padding: 8 }}
          />
          <button onClick={sendMessage} style={{ padding: 8 }}>
            Send
          </button>
        </div>
      )}

      {ended && <p>Conversation ended.</p>}
    </div>
  );
}
