"use client";

import { memo, useEffect, useRef, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMessages, prependMessages } from "../../store/chatSlice.js";
import { fetchMessages } from "../../services/api.js";
import TypingIndicator from "../TypingIndicator/TypingIndicator.jsx";
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

function getSenderLabel(message, isOwn) {
  if (isOwn) return "You";
  return message?.senderName ?? message?.sender?.name ?? "User";
}

function MessageItem({ message, isOwn, showSender, isNew }) {
  const [timeText, setTimeText] = useState("");
  const isTyping = Boolean(message.isTyping);

  useEffect(() => {
    if (!isTyping) setTimeText(formatMessageTime(message.createdAt));
  }, [message.createdAt, isTyping]);

  return (
    <li
      className={`${styles.item} ${isOwn ? styles.own : ""} ${isNew ? styles.isNew : ""} ${showSender ? styles.groupStart : ""} ${isTyping ? styles.typingItem : ""}`}
      data-message-id={message.id}
    >
      {showSender && !isTyping && (
        <div className={styles.messageHeader}>
          <span className={styles.senderName}>{getSenderLabel(message, isOwn)}</span>
          <span className={styles.timestamp}>{timeText}</span>
        </div>
      )}
      {isTyping ? (
        <span className={styles.bubble}>
          <span className={styles.typingDot} aria-hidden />
          <span className={styles.typingDot} aria-hidden />
          <span className={styles.typingDot} aria-hidden />
        </span>
      ) : (
        <>
          <span className={styles.bubble}>{message.body ?? ""}</span>
          {!showSender && <span className={styles.timeInline}>{timeText}</span>}
        </>
      )}
    </li>
  );
}

const MemoizedMessageItem = memo(MessageItem);

// Group consecutive messages by same sender; each group has { isOwn, messages }.
function groupMessages(list) {
  const groups = [];
  for (let i = 0; i < list.length; i++) {
    const msg = list[i];
    const isOwn = Boolean(msg.isOwn ?? msg.senderId === "me");
    if (groups.length === 0 || groups[groups.length - 1].isOwn !== isOwn) {
      groups.push({ isOwn, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

function MessageListInner() {
  const dispatch = useDispatch();
  const selectedConversation = useSelector((state) => state.chat.selectedConversation);
  const messages = useSelector((state) => state.chat.messages);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const conversationIdRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const conversationId = selectedConversation?.id ?? selectedConversation?.conversationId ?? null;

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const threshold = 80;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setShowScrollToBottom(!atBottom);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    return () => el.removeEventListener("scroll", check);
  }, [conversationId, messages?.length]);

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
        if (data.length > 0) {
          dispatch(prependMessages(data));
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
              }
            });
          });
        }
        const total = res.total ?? 0;
        const currentCount = messages.length + data.length;
        setHasMore(currentCount < total);
        setPage(nextPage);
      })
      .finally(() => setLoading(false));
  }, [conversationId, page, loading, hasMore, messages.length, dispatch]);

  const list = Array.isArray(messages) ? messages : [];
  const lastMessage = list[list.length - 1];
  const prevLastIdRef = useRef(null);
  const initialLoadDoneRef = useRef(false);
  const prevLoadingRef = useRef(loading);

  const isLastMessageNew =
    lastMessage &&
    initialLoadDoneRef.current &&
    lastMessage.id !== prevLastIdRef.current;

  // Mark initial load as done when loading flips to false for this conversation.
  useEffect(() => {
    if (prevLoadingRef.current && !loading && conversationId) {
      initialLoadDoneRef.current = true;
    }
    prevLoadingRef.current = loading;
  }, [loading, conversationId]);

  useEffect(() => {
    if (!conversationId) initialLoadDoneRef.current = false;
  }, [conversationId]);

  // Scroll to bottom when a new message arrives at the end.
  useEffect(() => {
    if (!lastMessage || !scrollRef.current) return;
    if (lastMessage.id !== prevLastIdRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
      prevLastIdRef.current = lastMessage.id;
    }
  }, [lastMessage?.id, list.length]);

  if (!conversationId) {
    return (
      <div className={styles.container}>
        <div className={styles.emptySelect}>Select a conversation</div>
      </div>
    );
  }

  const groups = groupMessages(list);

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
          <>
            <div className={styles.empty}>No messages yet.</div>
            <TypingIndicator />
          </>
        ) : (
          <>
            <ul className={styles.list}>
              {groups.map((group, gIdx) =>
                group.messages.map((msg, mIdx) => {
                  const isFirstInGroup = mIdx === 0;
                  const isNew = !msg.isTyping && isLastMessageNew && msg.id === lastMessage?.id;
                  return (
                    <MemoizedMessageItem
                      key={msg.id ?? `msg-${gIdx}-${mIdx}`}
                      message={msg}
                      isOwn={group.isOwn}
                      showSender={isFirstInGroup}
                      isNew={isNew}
                    />
                  );
                })
              )}
            </ul>
            <TypingIndicator />
          </>
        )}
      </div>
      {showScrollToBottom && list.length > 0 && (
        <button
          type="button"
          className={styles.scrollToBottomButton}
          onClick={scrollToBottom}
          aria-label="Go to latest message"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default memo(MessageListInner);
