"use client";

import { useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useToast } from "@/components/providers/toast-provider";

export function BackendConnectionCheck() {
  const hasCheckedConnection = useRef(false);
  const toast = useToast();

  useEffect(() => {
    if (hasCheckedConnection.current) {
      return;
    }

    hasCheckedConnection.current = true;

    const abortController = new AbortController();

    fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      credentials: "include",
      signal: abortController.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Health check failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((data: { database?: boolean; oauth?: boolean }) => {
        if (data && data.database === false) {
          toast.warning(
            "Running without a database",
            "Messages are served from memory only. Set DATABASE_URL to enable persistence.",
          );
        }
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        toast.error(
          "Backend unreachable",
          "The frontend cannot reach the API. Check that the backend is running and that NEXT_PUBLIC_API_BASE_URL is correct.",
        );
      });

    return () => {
      abortController.abort();
    };
  }, [toast]);

  return null;
}
