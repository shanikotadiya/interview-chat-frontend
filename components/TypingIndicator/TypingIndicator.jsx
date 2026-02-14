"use client";

import { memo } from "react";
import { useSelector } from "react-redux";
import styles from "./TypingIndicator.module.scss";

function TypingIndicatorInner() {
  const typingUsers = useSelector((state) => state.chat.typingUsers);
  const hasTyping = Array.isArray(typingUsers) && typingUsers.length > 0;

  if (!hasTyping) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : `${typingUsers.length} people typing`;

  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.bubble}>
        <span className={styles.dots} aria-hidden>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
        <span className={styles.label} title={label}>
          {label}
        </span>
      </div>
    </div>
  );
}

export default memo(TypingIndicatorInner);
