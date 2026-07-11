import { createChannel } from "better-sse";

class SSEService {
  private readonly channel = createChannel();

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
}

export const sseService = new SSEService();

// import { createChannel } from "better-sse";

// class SSEService {
//   private readonly channel = createChannel();

//   readonly broadcast = this.channel.broadcast.bind(this.channel);
//   readonly register = this.channel.register.bind(this.channel);
// }

// export const sseService = new SSEService();
