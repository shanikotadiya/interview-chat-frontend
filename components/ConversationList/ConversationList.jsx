"use client";

import { memo, useEffect, useRef, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setConversations, setSelectedConversation } from "../../store/chatSlice.js";
import styles from "./ConversationList.module.scss";

function formatTimestamp(updatedAt) {
  if (!updatedAt) return "";
  const date = new Date(updatedAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function ConversationItem({ conversation, isSelected, onSelect }) {
  const id = conversation.id ?? conversation.conversationId;
  const title = conversation.title ?? conversation.subject ?? id ?? "Conversation";
  const platform = (conversation.platform ?? "").toLowerCase();
  const lastMessage = conversation.lastMessage ?? "";
  const unreadCount = conversation.unreadCount ?? 0;
  const badgeClass = platform === "slack" ? styles.slack : platform === "gmail" ? styles.gmail : styles.unknown;

  // Render timestamp only after mount to avoid hydration mismatch (relative time differs between server and client)
  const [timestampText, setTimestampText] = useState("");
  useEffect(() => {
    setTimestampText(formatTimestamp(conversation.updatedAt));
  }, [conversation.updatedAt]);

  const handleClick = useCallback(() => {
    onSelect(conversation);
  }, [onSelect, conversation]);

  return (
    <li
      role="button"
      tabIndex={0}
      className={`${styles.item} ${isSelected ? styles.selected : ""}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-pressed={isSelected}
      aria-label={`${title}, ${platform}`}
    >
      <div className={styles.header}>
        <span className={`${styles.badge} ${badgeClass}`}>
          {platform === "slack" ? "Slack" : platform === "gmail" ? "Gmail" : "—"}
        </span>
        <span className={styles.title} title={title}>
          {title}
        </span>
        <span className={styles.timestamp}>{timestampText}</span>
      </div>
      <div className={styles.previewRow}>
        <span className={styles.preview} title={lastMessage}>
          {lastMessage || "No messages"}
        </span>
        {unreadCount > 0 && (
          <span className={styles.unreadBadge} aria-label={`${unreadCount} unread`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
    </li>
  );
}

const MemoizedConversationItem = memo(ConversationItem);

function ConversationListInner({ initialData }) {
  const dispatch = useDispatch();
  const conversations = useSelector((state) => state.chat.conversations);
  const searchQuery = useSelector((state) => state.chat.searchQuery);
  const searchResults = useSelector((state) => state.chat.searchResults);
  const selectedConversation = useSelector((state) => state.chat.selectedConversation);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current || !initialData?.data) return;
    hasHydrated.current = true;
    dispatch(setConversations(Array.isArray(initialData.data) ? initialData.data : []));
  }, [dispatch, initialData]);

  const baseList = conversations.length > 0 ? conversations : (initialData?.data ?? []);
  const list = searchQuery.trim() !== "" ? searchResults : baseList;

  const handleSelect = useCallback(
    (conversation) => {
      dispatch(setSelectedConversation(conversation));
    },
    [dispatch]
  );

  const getConversationId = (c) => c.id ?? c.conversationId;

  return (
    <ul className={styles.list} aria-label="Conversation list">
      {list.length === 0 ? (
        <li className={styles.empty}>
          {searchQuery.trim() !== "" ? "No matching conversations." : "No conversations yet."}
        </li>
      ) : (
        list.map((conv) => (
          <MemoizedConversationItem
            key={getConversationId(conv) ?? JSON.stringify(conv)}
            conversation={conv}
            isSelected={selectedConversation && getConversationId(selectedConversation) === getConversationId(conv)}
            onSelect={handleSelect}
          />
        ))
      )}
    </ul>
  );
}

export default memo(ConversationListInner);
