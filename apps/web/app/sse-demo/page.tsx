"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useSSE } from "@/lib/use-sse";

interface Item {
  id: string;
  name: string;
  created_at: string;
}

interface ItemsResponse {
  success: boolean;
  message: string;
  data: Item[];
}

function fetchItems(): Promise<ItemsResponse> {
  return api.get("/api/items").then((r) => r.data);
}

function createItem(name: string) {
  return api.post("/api/items", { name });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    connected: "#22c55e",
    connecting: "#eab308",
    disconnected: "#6b7280",
    error: "#ef4444",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 9999,
        fontSize: 13,
        fontWeight: 500,
        color: "#fff",
        backgroundColor: colors[status] || "#6b7280",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "#fff",
        }}
      />
      {status}
    </span>
  );
}

export default function SSEDemoPage() {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  const { status, events, connect, disconnect, clearEvents } = useSSE({
    onEvent: (eventName) => {
      if (eventName === "item:updated") {
        queryClient.invalidateQueries({ queryKey: ["items"] });
      }
    },
  });

  const mutation = useMutation({
    mutationFn: () => createItem(name),
    onSuccess: () => {
      setName("");
    },
  });

  const items = data?.data ?? [];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        SSE + TanStack Query
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        SSE pushes a notification → query auto-refetches fresh data from the
        REST endpoint.
      </p>

      {/* Connection */}
      <section style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <StatusBadge status={status} />
          <button
            onClick={connect}
            disabled={status === "connected" || status === "connecting"}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              backgroundColor:
                status === "connected" || status === "connecting"
                  ? "#f3f4f6"
                  : "#fff",
              cursor:
                status === "connected" || status === "connecting"
                  ? "not-allowed"
                  : "pointer",
              fontSize: 13,
            }}
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            disabled={status === "disconnected"}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              backgroundColor: status === "disconnected" ? "#f3f4f6" : "#fff",
              cursor: status === "disconnected" ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            Disconnect
          </button>
        </div>
      </section>

      {/* Event log */}
      <section style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>
            Event Log{" "}
            <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 14 }}>
              ({events.length})
            </span>
          </h2>
          <button
            onClick={clearEvents}
            disabled={events.length === 0}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              backgroundColor: events.length === 0 ? "#f3f4f6" : "#fff",
              cursor: events.length === 0 ? "not-allowed" : "pointer",
              fontSize: 12,
            }}
          >
            Clear
          </button>
        </div>
        {events.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: 14 }}>
            No events yet. Connect and create an item above.
          </p>
        ) : (
          <div
            style={{
              maxHeight: 300,
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
          >
            {[...events].reverse().map((e) => (
              <div
                key={e.id}
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid #f3f4f6",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "#3b82f6", fontWeight: 600 }}>
                    {e.event}
                  </span>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>
                    {e.time.toLocaleTimeString()}
                  </span>
                </div>
                <pre
                  style={{
                    margin: 0,
                    color: "#374151",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {e.data}
                </pre>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create item form — real POST /api/items */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Create Item (POST /api/items)
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            mutation.mutate();
          }}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name..."
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #3b82f6",
              backgroundColor: mutation.isPending ? "#bfdbfe" : "#eff6ff",
              color: "#1d4ed8",
              cursor:
                mutation.isPending || !name.trim() ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {mutation.isPending ? "Creating..." : "Create"}
          </button>
        </form>
        {mutation.isError && (
          <p style={{ color: "#ef4444", marginTop: 8, fontSize: 13 }}>
            Error: {mutation.error.message}
          </p>
        )}
        {mutation.isSuccess && (
          <p style={{ color: "#22c55e", marginTop: 8, fontSize: 13 }}>
            Created! SSE should trigger a refetch now.
          </p>
        )}
      </section>

      {/* Items table */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Items{" "}
          <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 14 }}>
            ({items.length}){isFetching && " refetching..."}
          </span>
        </h2>
        {items.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: 14 }}>
            No items yet. Create one above.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr
                style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}
              >
                <th style={{ padding: "8px 12px" }}>Name</th>
                <th style={{ padding: "8px 12px" }}>ID</th>
                <th style={{ padding: "8px 12px" }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: Item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 500 }}>
                    {item.name}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    {item.id.slice(0, 8)}...
                  </td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
