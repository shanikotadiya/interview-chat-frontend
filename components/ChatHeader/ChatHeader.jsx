"use client";

import { useSelector } from "react-redux";
import styles from "./ChatHeader.module.scss";

function PlatformIcon({ platform }) {
  const p = (platform ?? "").toLowerCase();
  const iconClass = p === "slack" ? styles.slack : p === "gmail" ? styles.gmail : styles.all;

  return (
    <span className={`${styles.platformIcon} ${iconClass}`} aria-hidden>
      {p === "slack" ? <SlackIcon /> : p === "gmail" ? <GmailIcon /> : <AllIcon />}
    </span>
  );
}

function SlackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="currentColor"
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
      />
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="currentColor"
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
      />
    </svg>
  );
}

function AllIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
      />
    </svg>
  );
}

export default function ChatHeader() {
  const selectedConversation = useSelector((state) => state.chat.selectedConversation);
  const typingUsers = useSelector((state) => state.chat.typingUsers);
  const isTyping = Array.isArray(typingUsers) && typingUsers.length > 0;

  if (!selectedConversation) {
    return (
      <header className={styles.header}>
        <span className={`${styles.platformIcon} ${styles.all}`} aria-hidden>
          <AllIcon />
        </span>
        <div className={styles.content}>
          <p className={styles.placeholder}>Select a conversation</p>
        </div>
      </header>
    );
  }

  const title = selectedConversation.title ?? selectedConversation.subject ?? selectedConversation.id ?? selectedConversation.conversationId ?? "Conversation";
  const platform = selectedConversation.platform ?? "";

  return (
    <header className={styles.header}>
      <PlatformIcon platform={platform} />
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.status}>{isTyping ? "Typing..." : "Online"}</p>
      </div>
    </header>
  );
}
