import { useStore, createStore } from "@tanstack/react-store";
import type { Role } from "@/lib/api/types";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export interface SessionUser {
  name: string | null;
  email: string;
  role: Role;
  image: string | null;
  emailVerified: boolean;
}

export interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
}

export const sessionStore = createStore<SessionState>({
  status: "loading",
  user: null,
});

export function useSession() {
  return useStore(sessionStore);
}

export function setSession(user: SessionUser) {
  sessionStore.setState(() => ({ status: "authenticated", user }));
}

export function setUnauthenticated() {
  sessionStore.setState(() => ({ status: "unauthenticated", user: null }));
}

export const ROLE_HOME: Record<Role, string> = {
  super_admin: "/super/outlets",
  outlet_admin: "/admin",
  worker: "/jobs/available",
  driver: "/jobs/pickup",
  customer: "/",
};
