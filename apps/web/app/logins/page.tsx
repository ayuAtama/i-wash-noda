"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("kanawe9310@roastic.com");
  const [password, setPassword] = useState("astolfo_love");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        credentials: "include", // <-- REQUIRED
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      setResponse({
        status: res.status,
        data,
      });
    } catch (error) {
      setResponse({
        error: "Failed to connect to API",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: 320,
        }}
      >
        <h1>Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {response && (
          <pre
            style={{
              background: "#f5f5f5",
              padding: "1rem",
              overflow: "auto",
            }}
          >
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </form>
    </main>
  );
}
