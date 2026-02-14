"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useStore } from "react-redux";
import { io } from "socket.io-client";
import { addMessage, conversationNewMessage, addTypingUser, removeTypingUser } from "./chatSlice.js";

function getSocketUrl() {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  if (!base) return null;
  return base.replace(/\/$/, "");
}

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

let socketInstance = null;

export default function SocketProvider({ children }) {
  const store = useStore();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const url = getSocketUrl();
    if (!url) return;

    if (socketInstance) {
      setSocket(socketInstance);
      return;
    }
    const socketObj = io(url, { autoConnect: true });
    socketInstance = socketObj;
    setSocket(socketObj);

    socketObj.on("connect", () => {
      console.log("[Socket] connected", socketObj.id);
    });

    const handleNewMessage = (message) => {
      console.log("[Socket] new_message received", message);
      if (!message || (!message.id && !message.conversationId)) return;
      store.dispatch(conversationNewMessage(message));
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

    socketObj.on("new_message", handleNewMessage);
    socketObj.on("user_typing", handleUserTyping);
    socketObj.on("typing_stop", handleTypingStop);

    return () => {
      socketObj.off("connect");
      socketObj.off("new_message", handleNewMessage);
      socketObj.off("user_typing", handleUserTyping);
      socketObj.off("typing_stop", handleTypingStop);
      socketObj.disconnect();
      socketInstance = null;
      setSocket(null);
    };
  }, [store]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
