"use client";

import { useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendMessage } from "../../store/chatSlice.js";
import { useSocket } from "../../store/SocketProvider.jsx";
import styles from "./ChatInput.module.scss";

const TYPING_STOP_DELAY_MS = 2000;

export default function ChatInput() {
  const dispatch = useDispatch();
  const socket = useSocket();
  const selectedConversation = useSelector((state) => state.chat.selectedConversation);
  const [value, setValue] = useState("");
  const typingTimeoutRef = useRef(null);

  const conversationId =
    selectedConversation?.id ?? selectedConversation?.conversationId ?? null;

  const emitTypingStart = useCallback(() => {
    if (!socket?.connected || !conversationId) return;
    socket.emit("typing_start", { conversationId });
  }, [socket, conversationId]);

  const scheduleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socket?.connected && conversationId) {
        socket.emit("typing_stop", { conversationId });
      }
      typingTimeoutRef.current = null;
    }, TYPING_STOP_DELAY_MS);
  }, [socket, conversationId]);

  const handleChange = (e) => {
    const next = e.target.value;
    setValue(next);
    if (!conversationId) return;
    emitTypingStart();
    scheduleTypingStop();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || !conversationId) return;
    dispatch(sendMessage({ conversationId, body: text }));
    if (socket?.connected) {
      socket.emit("send_message", { conversationId, body: text });
      socket.emit("typing_stop", { conversationId });
    }
    setValue("");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const disabled = !conversationId;

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          className={styles.input}
          placeholder={disabled ? "Select a conversation" : "Type a message…"}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          autoComplete="off"
          aria-label="Message input"
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <svg
            className={styles.sendIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
