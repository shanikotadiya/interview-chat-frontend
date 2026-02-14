"use client";

import { useSelector } from "react-redux";
import styles from "./ChatFooter.module.scss";

export default function ChatFooter() {
  const selectedConversation = useSelector((state) => state.chat.selectedConversation);

  if (!selectedConversation) {
    return (
      <footer className={styles.footer}>
        <span className={styles.label}>Select a conversation</span>
      </footer>
    );
  }

  const name =
    selectedConversation.name ??
    selectedConversation.title ??
    selectedConversation.subject ??
    selectedConversation.id ??
    selectedConversation.conversationId ??
    "Conversation";

  return (
    <footer className={styles.footer}>
      <span className={styles.label}>Chatting with: {name}</span>
    </footer>
  );
}
