"use client";

import { useEffect } from "react";
import { useStore } from "react-redux";
import { io } from "socket.io-client";
import { addMessage, addTypingUser, removeTypingUser } from "./chatSlice.js";

function getSocketUrl() {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  if (!base) return null;
  return base.replace(/\/$/, "");
}

let socketInstance = null;

export default function SocketProvider({ children }) {
  const store = useStore();

  useEffect(() => {
    const url = getSocketUrl();
    if (!url) return;

    if (socketInstance) return;
    const socket = io(url, { autoConnect: true });
    socketInstance = socket;

    socket.on("connect", () => {
      console.log("[Socket] connected", socket.id);
    });

    const handleNewMessage = (message) => {
      console.log("[Socket] new_message received", message);
      if (!message || (!message.id && !message.conversationId)) return;
      const state = store.getState();
      const selectedId = state.chat.selectedConversation?.id ?? state.chat.selectedConversation?.conversationId;
      if (selectedId && message.conversationId === selectedId) {
        store.dispatch(addMessage(message));
      }
    };

    const handleUserTyping = (payload) => {
      console.log("[Socket] user_typing received", payload);
      const userId = payload?.userId;
      if (userId != null) store.dispatch(addTypingUser(String(userId)));
    };

    const handleTypingStop = (payload) => {
      const userId = payload?.userId;
      if (userId != null) store.dispatch(removeTypingUser(String(userId)));
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("typing_stop", handleTypingStop);

    return () => {
      socket.off("connect");
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("typing_stop", handleTypingStop);
      socket.disconnect();
      socketInstance = null;
    };
  }, [store]);

  return children;
}
