"use client";

import { useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendMessage, addMessage } from "../../store/chatSlice.js";
import { useSocket } from "../../store/SocketProvider.jsx";
import { sendMessageApi } from "../../services/api.js";
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
    setValue("");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (socket?.connected) socket.emit("typing_stop", { conversationId });

    sendMessageApi("slack", conversationId, text)
      .then((res) => {
        const message = res.data ?? res.message ?? res;
        const normalized = {
          id: message.id ?? message.ts,
          body: message.body ?? message.text ?? text,
          conversationId: message.conversationId ?? conversationId,
          createdAt: message.createdAt ?? new Date().toISOString(),
          isOwn: true,
        };
        dispatch(addMessage(normalized));
      })
      .catch(() => {
        // Typing placeholder remains; could show toast later
      });
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
