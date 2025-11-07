import { useEffect, useState, useRef } from "react";
import ioClient from "socket.io-client";

export const useSocket = (token: string) => {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  // useRef без типа (TS сам выведет ReturnType)
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!token) return;

    // Подключаемся
    socketRef.current = ioClient("http://localhost:4000", { auth: { token } });

    // Подписка на события
    socketRef.current.on("connect", () => setConnected(true));
    socketRef.current.on("disconnect", () => setConnected(false));

    socketRef.current.on("mapUpdate", (data: any) =>
      setEvents((prev) => [...prev, { type: "mapUpdate", data }])
    );
    socketRef.current.on("buildUpdate", (data: any) =>
      setEvents((prev) => [...prev, { type: "buildUpdate", data }])
    );
    socketRef.current.on("collectUpdate", (data: any) =>
      setEvents((prev) => [...prev, { type: "collectUpdate", data }])
    );

    // Функция очистки
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const sendEvent = (event: string, data: any) => {
    socketRef.current?.emit(event, data);
  };

  return { connected, events, sendEvent };
};