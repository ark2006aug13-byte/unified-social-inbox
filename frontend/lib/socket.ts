"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";

let socket: Socket | null = null;
let connecting = false;

/**
 * Returns the shared socket instance, creating it on first use.
 *
 * The connection falls back to polling when the websocket upgrade is blocked
 * by a proxy, and it retries with backoff so a temporarily unreachable backend
 * does not permanently break live updates.
 */
export function getSocket(): Socket {
  if (socket) {
    return socket;
  }

  connecting = true;

  socket = io(API_BASE_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    connecting = false;
  });

  socket.on("disconnect", () => {
    connecting = false;
  });

  socket.on("connect_error", () => {
    connecting = false;
  });

  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  connecting = false;
}

export function isSocketConnecting() {
  return connecting;
}
