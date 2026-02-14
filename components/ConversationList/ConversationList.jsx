"use client";

import { memo, useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setConversations, setInitialConversations, setSelectedConversation, appendConversations } from "../../store/chatSlice.js";
import { fetchConversations } from "../../services/api.js";
import styles from "./ConversationList.module.scss";

const CONVERSATIONS_PAGE_SIZE = 50;

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

function ConversationListInner({ initialConversations = [], initialTotal }) {
  const dispatch = useDispatch();
  const conversations = useSelector((state) => state.chat.conversations);
  const searchQuery = useSelector((state) => state.chat.searchQuery);
  const selectedPlatform = useSelector((state) => state.chat.selectedPlatform);
  const selectedConversation = useSelector((state) => state.chat.selectedConversation);
  const hasHydrated = useRef(false);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const [nextPage, setNextPage] = useState(2);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasHydrated.current) return;
    const list = Array.isArray(initialConversations) ? initialConversations : [];
    hasHydrated.current = true;
    dispatch(setConversations(list));
    dispatch(setInitialConversations(list));
    if (initialTotal != null) setHasMore(list.length < initialTotal);
    setNextPage(2);
  }, [dispatch, initialConversations, initialTotal]);

  const list = conversations.length > 0 ? conversations : (initialConversations ?? []);

  const filteredList = useMemo(() => {
    if (selectedPlatform === "all") return list;
    const p = String(selectedPlatform).toLowerCase();
    return list.filter((c) => (c.platform ?? "").toLowerCase() === p);
  }, [list, selectedPlatform]);

  const isShowingMainList = searchQuery.trim() === "";

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore || !isShowingMainList) return;
    loadingRef.current = true;
    setLoading(true);
    fetchConversations(nextPage, CONVERSATIONS_PAGE_SIZE)
      .then((res) => {
        const data = res.data ?? [];
        dispatch(appendConversations(data));
        setHasMore(data.length >= CONVERSATIONS_PAGE_SIZE);
        setNextPage((p) => p + 1);
      })
      .catch(() => setHasMore(false))
      .finally(() => {
        loadingRef.current = false;
        setLoading(false);
      });
  }, [hasMore, isShowingMainList, nextPage, dispatch]);

  useEffect(() => {
    if (!isShowingMainList || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !loadingRef.current) loadMore();
      },
      { root: null, rootMargin: "100px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isShowingMainList, hasMore, loading, loadMore]);

  const handleSelect = useCallback(
    (conversation) => {
      dispatch(setSelectedConversation(conversation));
    },
    [dispatch]
  );

  const getConversationId = (c) => c.id ?? c.conversationId;

  return (
    <>
      <ul className={styles.list} aria-label="Conversation list">
        {filteredList.length === 0 ? (
          <li className={styles.empty}>
            {searchQuery.trim() !== ""
              ? "No matching conversations."
              : selectedPlatform !== "all"
                ? "No conversations for this platform."
                : "No conversations yet."}
          </li>
        ) : (
          filteredList.map((conv) => (
            <MemoizedConversationItem
              key={getConversationId(conv) ?? JSON.stringify(conv)}
              conversation={conv}
              isSelected={selectedConversation && getConversationId(selectedConversation) === getConversationId(conv)}
              onSelect={handleSelect}
            />
          ))
        )}
      </ul>
      {isShowingMainList && hasMore && (
        <div ref={sentinelRef} className={styles.sentinel}>
          {loading && <span className={styles.loadingSpinner} aria-label="Loading more" />}
        </div>
      )}
    </>
  );
}

export default memo(ConversationListInner);
