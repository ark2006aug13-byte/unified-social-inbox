"use client";

import { useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";

export function BackendConnectionCheck() {
  const hasCheckedConnection = useRef(false);

  useEffect(() => {
    if (hasCheckedConnection.current) {
      return;
    }

    hasCheckedConnection.current = true;

    const abortController = new AbortController();

    fetch(`${API_BASE_URL}/api/test`, {
      method: "GET",
      credentials: "include",
      signal: abortController.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        console.error("API Error:", error);
      });

    return () => {
      abortController.abort();
    };
  }, []);

  return null;
}
