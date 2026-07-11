import { createChannel, type Session } from "better-sse";
import type { UserRole } from "@/types/role";

export interface SessionState {
  userId: string;
  role: UserRole;
  outletId?: string | null;
}

class SSEService {
  private readonly channel = createChannel<{}, SessionState>();

  broadcast(
    ...args: Parameters<typeof this.channel.broadcast>
  ): ReturnType<typeof this.channel.broadcast> {
    return this.channel.broadcast(...args);
  }

  register(
    ...args: Parameters<typeof this.channel.register>
  ): ReturnType<typeof this.channel.register> {
    return this.channel.register(...args);
  }

  broadcastToRole(data: unknown, eventName: string, role: UserRole) {
    return this.channel.broadcast(data, eventName, {
      filter: (session: Session<SessionState>) => session.state.role === role,
    });
  }

  broadcastToOutlet(data: unknown, eventName: string, outletId: string) {
    return this.channel.broadcast(data, eventName, {
      filter: (session: Session<SessionState>) =>
        session.state.outletId === outletId,
    });
  }

  broadcastToUser(data: unknown, eventName: string, userId: string) {
    return this.channel.broadcast(data, eventName, {
      filter: (session: Session<SessionState>) =>
        session.state.userId === userId,
    });
  }

  broadcastToRoles(data: unknown, eventName: string, roles: UserRole[]) {
    return this.channel.broadcast(data, eventName, {
      filter: (session: Session<SessionState>) =>
        roles.includes(session.state.role),
    });
  }

  broadcastExceptUser(data: unknown, eventName: string, excludeUserId: string) {
    return this.channel.broadcast(data, eventName, {
      filter: (session: Session<SessionState>) =>
        session.state.userId !== excludeUserId,
    });
  }
}

export const sseService = new SSEService();
