"use client";

import { memo, useEffect, useRef, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMessages, prependMessages } from "../../store/chatSlice.js";
import { fetchMessages } from "../../services/api.js";
import styles from "./MessageList.module.scss";

const MESSAGES_PER_PAGE = 20;

function formatMessageTime(createdAt) {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function MessageItem({ message, isOwn }) {
  const [timeText, setTimeText] = useState("");

  useEffect(() => {
    setTimeText(formatMessageTime(message.createdAt));
  }, [message.createdAt]);

  return (
    <li className={`${styles.item} ${isOwn ? styles.own : ""}`} data-message-id={message.id}>
      <span className={styles.bubble}>{message.body ?? ""}</span>
      <span className={styles.time}>{timeText}</span>
    </li>
  );
}

const MemoizedMessageItem = memo(MessageItem);

function MessageListInner() {
  const dispatch = useDispatch();
  const selectedConversation = useSelector((state) => state.chat.selectedConversation);
  const messages = useSelector((state) => state.chat.messages);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const conversationIdRef = useRef(null);

  const conversationId = selectedConversation?.id ?? selectedConversation?.conversationId ?? null;

  // Load initial messages when conversation changes
  useEffect(() => {
    if (!conversationId) {
      dispatch(setMessages([]));
      setPage(1);
      setHasMore(true);
      conversationIdRef.current = null;
      return;
    }
    if (conversationIdRef.current === conversationId) return;
    conversationIdRef.current = conversationId;
    setPage(1);
    setHasMore(true);

    let cancelled = false;
    setLoading(true);
    fetchMessages(conversationId, 1, MESSAGES_PER_PAGE)
      .then((res) => {
        if (!cancelled) {
          dispatch(setMessages(res.data ?? []));
          const total = res.total ?? 0;
          setHasMore((res.data?.length ?? 0) < total);
        }
      })
      .catch(() => {
        if (!cancelled) dispatch(setMessages([]));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, dispatch]);

  const loadMore = useCallback(() => {
    if (!conversationId || loading || !hasMore) return;
    const nextPage = page + 1;
    setLoading(true);
    fetchMessages(conversationId, nextPage, MESSAGES_PER_PAGE)
      .then((res) => {
        const data = res.data ?? [];
        if (data.length > 0) dispatch(prependMessages(data));
        const total = res.total ?? 0;
        const currentCount = messages.length + data.length;
        setHasMore(currentCount < total);
        setPage(nextPage);
      })
      .finally(() => setLoading(false));
  }, [conversationId, page, loading, hasMore, messages.length, dispatch]);

  if (!conversationId) {
    return (
      <div className={styles.container}>
        <div className={styles.emptySelect}>Select a conversation</div>
      </div>
    );
  }

  const list = Array.isArray(messages) ? messages : [];

  return (
    <div className={styles.container}>
      {hasMore && list.length > 0 && (
        <div className={styles.loadMoreRow}>
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "Loading…" : "Load older messages"}
          </button>
        </div>
      )}
      <div className={styles.scrollArea} ref={scrollRef}>
        {list.length === 0 && !loading ? (
          <div className={styles.empty}>No messages yet.</div>
        ) : (
          <ul className={styles.list}>
            {list.map((msg, index) => (
              <MemoizedMessageItem
                key={msg.id ?? `msg-${index}`}
                message={msg}
                isOwn={Boolean(msg.isOwn ?? (index % 2 === 1))}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default memo(MessageListInner);
