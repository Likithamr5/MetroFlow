"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { LiveStationSnapshot } from "../lib/types";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting" | "error";

interface UseLiveStationReturn {
  data: LiveStationSnapshot | null;
  isLive: boolean;
  status: ConnectionStatus;
  error: string | null;
  lastPing: Date | null;
  reconnect: () => void;
}

export function useLiveStation(stationId: string | number): UseLiveStationReturn {
  const [data, setData] = useState<LiveStationSnapshot | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [lastPing, setLastPing] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  // Compute WebSocket URL from environment or current window
  const getWsUrl = useCallback((id: string | number) => {
    const rawApiUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    let wsHost = rawApiUrl.replace(/^http:\/\//, "ws://").replace(/^https:\/\//, "wss://");
    if (!wsHost.startsWith("ws://") && !wsHost.startsWith("wss://")) {
      wsHost = `ws://${wsHost}`;
    }
    // Remove trailing slashes
    wsHost = wsHost.replace(/\/+$/, "");
    return `${wsHost}/ws/station/${encodeURIComponent(String(id).trim())}`;
  }, []);

  const connect = useCallback(() => {
    if (!stationId) return;

    // Clean up existing socket
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      } catch (e) {
        console.warn("Closing prior WS error:", e);
      }
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const url = getWsUrl(stationId);
    setStatus(reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting");
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        reconnectAttemptsRef.current = 0;
        setStatus("connected");
        setError(null);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const snapshot: LiveStationSnapshot = JSON.parse(event.data);
          setData(snapshot);
          setLastPing(new Date());
          setError(null);
        } catch (err) {
          console.error("Failed to parse station WS snapshot:", err);
        }
      };

      ws.onerror = (evt) => {
        if (!isMountedRef.current) return;
        console.warn("WebSocket encounter error on station:", stationId, evt);
        setError("Connection issue with live station stream.");
        setStatus("error");
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        setStatus("disconnected");

        // Normal close code 1000 means intentional cleanup, don't immediately retry
        if (event.code !== 1000) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 8000);
          setStatus("reconnecting");
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, delay);
        }
      };
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      console.error("Failed to initiate WebSocket:", err);
      setError(err instanceof Error ? err.message : "Failed to initiate WebSocket connection");
      setStatus("error");
      // Schedule reconnect
      reconnectAttemptsRef.current += 1;
      const delay = Math.min(2000 * reconnectAttemptsRef.current, 10000);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) connect();
      }, delay);
    }
  }, [stationId, getWsUrl]);

  useEffect(() => {
    isMountedRef.current = true;
    reconnectAttemptsRef.current = 0;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        try {
          wsRef.current.onclose = null;
          wsRef.current.onerror = null;
          wsRef.current.close(1000, "Component unmounted or station changed");
        } catch (e) {
          console.warn("Cleanup WS close error:", e);
        }
        wsRef.current = null;
      }
    };
  }, [connect]);

  const manualReconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  return {
    data,
    isLive: status === "connected",
    status,
    error,
    lastPing,
    reconnect: manualReconnect,
  };
}
