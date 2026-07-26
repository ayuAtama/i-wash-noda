"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserData {
  name: string;
  email: string;
  "pending email": string | null;
  "email verified": boolean;
  role: string;
  image: string | null;
  "created at": string;
  "updated at": string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/me", {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to fetch profile");
        }
        return res.json();
      })
      .then((data) => {
        setUser(data.data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3000/api/logout", {
        credentials: "include",
      });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontFamily: "var(--font-geist-sans)",
        }}
      >
        <p>Loading profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          gap: "1rem",
          fontFamily: "var(--font-geist-sans)",
        }}
      >
        <p>{error}</p>
        <a href="/login" style={{ color: "#0070f3" }}>
          Go to Login
        </a>
      </main>
    );
  }

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "var(--font-geist-sans)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          border: "1px solid var(--gray-alpha-200, #eaeaea)",
          borderRadius: 12,
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Profile</h1>

        {user?.image && (
          <img
            src={user.image}
            alt="avatar"
            width={80}
            height={80}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        )}

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <Row label="Name" value={user?.name ?? "-"} />
          <Row label="Email" value={user?.email ?? "-"} />
          {user?.["pending email"] && (
            <Row label="Pending Email" value={user["pending email"]} />
          )}
          <Row
            label="Email Verified"
            value={user?.["email verified"] ? "Yes" : "No"}
          />
          <Row label="Role" value={user?.role ?? "-"} />
          <Row label="Created At" value={user?.["created at"] ?? "-"} />
          <Row label="Updated At" value={user?.["updated at"] ?? "-"} />
        </div>

        <button
          onClick={handleLogout}
          style={{
            marginTop: "0.5rem",
            padding: "0.6rem 1.2rem",
            borderRadius: 8,
            border: "1px solid #eaeaea",
            background: "transparent",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "var(--font-geist-sans)",
          }}
        >
          Logout
        </button>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}
    >
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
