"use client";

import { useState } from "react";
import styles from "./ChatInput.module.scss";

export default function ChatInput({ conversationId, onSend, isSending }) {
  const [value, setValue] = useState("");

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || !conversationId) return;
    const promise = onSend(conversationId, text);
    if (promise && typeof promise.then === "function") {
      promise.then(() => setValue(""));
    } else {
      setValue("");
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
          disabled={disabled || !value.trim() || isSending}
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
