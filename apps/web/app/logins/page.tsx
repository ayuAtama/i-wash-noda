"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("kanawe9310@roastic.com");
  const [password, setPassword] = useState("astolfo_love");

  const mutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post("/api/login", credentials).then((r) => r.data),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) return;
    mutation.reset();
    mutation.mutate({ email, password });
  }

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

        <button
          type="submit"
          disabled={mutation.isPending || !email || !password}
        >
          {mutation.isPending ? "Logging in..." : "Login"}
        </button>

        {mutation.isError && (
          <pre
            style={{
              background: "#fef2f2",
              color: "#dc2626",
              padding: "1rem",
              overflow: "auto",
            }}
          >
            {JSON.stringify(
              (mutation.error as any)?.response?.data ||
                mutation.error?.message,
              null,
              2,
            )}
          </pre>
        )}

        {mutation.isSuccess && (
          <pre
            style={{
              background: "#f0fdf4",
              color: "#16a34a",
              padding: "1rem",
              overflow: "auto",
            }}
          >
            {JSON.stringify(mutation.data, null, 2)}
          </pre>
        )}
      </form>
    </main>
  );
}
