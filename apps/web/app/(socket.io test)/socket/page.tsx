"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useSocket, type SocketStatus } from "@/lib/use-socket";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface Item {
  id: string;
  name: string;
  created_at: string;
}

async function fetchItems(): Promise<Item[]> {
  const res = await fetch(`${API_URL}/api/items`, { credentials: "include" });
  const json = await res.json();
  return json.data;
}

async function createItem(name: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/items`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Failed to create item");
  }
  return json;
}

const STATUS_COLOR: Record<SocketStatus, string> = {
  connected: "#22c55e",
  connecting: "#eab308",
  disconnected: "#9ca3af",
  error: "#ef4444",
};

const STATUS_LABEL: Record<SocketStatus, string> = {
  connected: "Connected",
  connecting: "Connecting…",
  disconnected: "Disconnected",
  error: "Error",
};

export default function SocketTest() {
  const queryClient = useQueryClient();

  const handleEvent = useCallback(
    (eventName: string) => {
      if (eventName === "item:updated") {
        queryClient.invalidateQueries({ queryKey: ["items"] });
      }
      if (eventName === "ScheduleUpdated") {
        queryClient.invalidateQueries({ queryKey: ["shifts"] });
      }
    },
    [queryClient],
  );

  const { status, events, connect, disconnect, clearEvents } = useSocket({
    onEvent: handleEvent,
  });

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  const {
    data: items,
    isLoading,
    isError,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const [itemName, setItemName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setItemName("");
      setFormError(null);
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = itemName.trim();
    if (!trimmed) {
      setFormError("Item name is required");
      return;
    }
    setFormError(null);
    createMutation.mutate(trimmed);
  };

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <header style={s.header}>
        <div>
          <h1 style={s.title}>Socket.IO + TanStack Query</h1>
          <p style={s.subtitle}>
            Real-time items — event-driven refetch via Socket.IO
          </p>
        </div>
        <div style={s.statusRow}>
          <span
            style={{
              ...s.badge,
              backgroundColor: STATUS_COLOR[status],
            }}
          />
          <span style={s.statusText}>{STATUS_LABEL[status]}</span>
          <button
            onClick={status === "connected" ? disconnect : connect}
            style={s.btnSmall}
          >
            {status === "connected" ? "Disconnect" : "Connect"}
          </button>
        </div>
      </header>

      {/* ── Items Table ── */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Items</h2>
          <div style={s.sectionMeta}>
            {items && <span style={s.count}>{items.length} total</span>}
            {lastUpdated && (
              <span style={s.timestamp}>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* ── Create Item Form ── */}
        <form onSubmit={handleCreate} style={s.form}>
          <input
            type="text"
            value={itemName}
            onChange={(e) => {
              setItemName(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="New item name…"
            style={s.input}
            disabled={createMutation.isPending}
          />
          <button
            type="submit"
            style={{
              ...s.btnSmall,
              ...(createMutation.isPending
                ? { opacity: 0.6, cursor: "not-allowed" }
                : {}),
            }}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Adding…" : "Add Item"}
          </button>
        </form>
        {formError && <p style={s.formError}>{formError}</p>}
        {createMutation.isSuccess && (
          <p style={s.formSuccess}>Item created successfully</p>
        )}

        {isLoading && <p style={s.loading}>Loading items…</p>}
        {isError && (
          <p style={s.error}>Failed to load items. Is the API running?</p>
        )}

        {items && items.length > 0 && (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>ID</th>
                  <th style={s.th}>Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} style={s.tr}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>{item.name}</td>
                    <td
                      style={{
                        ...s.td,
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        color: "#888",
                      }}
                    >
                      {item.id.slice(0, 8)}…
                    </td>
                    <td style={s.td}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items && items.length === 0 && <p style={s.empty}>No items yet.</p>}
      </section>

      {/* ── Event Log ── */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Event Log</h2>
          <div style={s.sectionMeta}>
            <span style={s.count}>{events.length} events</span>
            {events.length > 0 && (
              <button onClick={clearEvents} style={s.btnSmall}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div style={s.eventLog}>
          {events.length === 0 && (
            <p style={s.empty}>
              No events yet. Items will auto-update here when the server
              broadcasts.
            </p>
          )}
          {[...events].reverse().map((e) => (
            <div key={e.id} style={s.eventRow}>
              <span style={s.eventDot} />
              <div style={s.eventBody}>
                <div style={s.eventLine}>
                  <strong style={s.eventName}>{e.event}</strong>
                  <span style={s.eventTime}>{e.time.toLocaleTimeString()}</span>
                </div>
                {e.data && e.data !== e.event && (
                  <pre style={s.eventData}>{e.data}</pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Styles ── */
const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "2rem 1rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: { fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" },
  subtitle: { fontSize: "0.875rem", color: "#888" },
  statusRow: { display: "flex", alignItems: "center", gap: "0.5rem" },
  badge: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    display: "inline-block",
  },
  statusText: { fontSize: "0.875rem" },
  btnSmall: {
    fontSize: "0.8rem",
    padding: "0.3rem 0.75rem",
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
  },
  section: {
    marginBottom: "2rem",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },
  sectionTitle: { fontSize: "1rem", fontWeight: 600 },
  sectionMeta: { display: "flex", alignItems: "center", gap: "0.75rem" },
  count: { fontSize: "0.8rem", color: "#888" },
  timestamp: { fontSize: "0.8rem", color: "#22c55e" },
  loading: { padding: "1.5rem", textAlign: "center", color: "#888" },
  error: { padding: "1.5rem", textAlign: "center", color: "#ef4444" },
  empty: { padding: "1.5rem", textAlign: "center", color: "#888" },
  form: {
    display: "flex",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    borderTop: "1px solid #f3f4f6",
  },
  input: {
    flex: 1,
    padding: "0.45rem 0.75rem",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: "0.875rem",
    outline: "none",
  },
  formError: {
    padding: "0.4rem 1rem 0.6rem",
    fontSize: "0.8rem",
    color: "#ef4444",
  },
  formSuccess: {
    padding: "0.4rem 1rem 0.6rem",
    fontSize: "0.8rem",
    color: "#22c55e",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" },
  th: {
    textAlign: "left",
    padding: "0.6rem 1rem",
    fontWeight: 600,
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#888",
    borderBottom: "1px solid #e5e7eb",
  },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "0.6rem 1rem" },
  eventLog: {
    maxHeight: 320,
    overflowY: "auto",
    padding: "0.5rem 0",
  },
  eventRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    padding: "0.4rem 1rem",
    borderBottom: "1px solid #f3f4f6",
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#3b82f6",
    marginTop: 6,
    flexShrink: 0,
  },
  eventBody: { flex: 1, minWidth: 0 },
  eventLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.5rem",
  },
  eventName: { fontSize: "0.85rem" },
  eventTime: { fontSize: "0.75rem", color: "#888", whiteSpace: "nowrap" },
  eventData: {
    margin: "0.25rem 0 0",
    fontSize: "0.75rem",
    color: "#666",
    background: "#f9fafb",
    padding: "0.3rem 0.5rem",
    borderRadius: 4,
    overflow: "hidden",
  },
};
