import { Server } from "socket.io";
import cookie from "cookie";
import { env } from "../config/env.js";
import { verifySessionToken } from "./authTokenService.js";

let ioInstance;

export function initializeSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: env.frontendUrl,
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      const token = cookies[env.sessionCookieName];
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const payload = verifySessionToken(token);
      socket.data.userId = payload.sub;
      return next();
    } catch (_error) {
      return next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });

  return ioInstance;
}

export function emitToUser(userId, eventName, payload) {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(`user:${userId}`).emit(eventName, payload);
}
