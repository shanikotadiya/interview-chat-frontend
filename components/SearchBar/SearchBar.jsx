"use client";

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setSearchQuery, setConversations, restoreConversations } from "../../store/chatSlice.js";
import { searchConversations } from "../../services/api.js";
import styles from "./SearchBar.module.scss";

const DEBOUNCE_MS = 500;

function SearchBarInner() {
  const dispatch = useDispatch();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);
  const searchIdRef = useRef(0);

  useEffect(() => {
    const trimmed = value.trim();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (trimmed === "") {
      dispatch(setSearchQuery(""));
      dispatch(restoreConversations());
      setLoading(false);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      searchIdRef.current += 1;
      const currentSearchId = searchIdRef.current;
      setLoading(true);

      searchConversations(trimmed, 1, 50)
        .then((res) => {
          if (searchIdRef.current !== currentSearchId) return;
          dispatch(setSearchQuery(trimmed));
          dispatch(setConversations(res.data ?? []));
        })
        .catch(() => {
          if (searchIdRef.current !== currentSearchId) return;
          dispatch(setSearchQuery(trimmed));
          dispatch(setConversations([]));
        })
        .finally(() => {
          if (searchIdRef.current === currentSearchId) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, dispatch]);

  const handleChange = useCallback((e) => {
    setValue(e.target.value);
  }, []);

  return (
    <div className={styles.wrapper}>
      <span className={styles.icon} aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>
      <input
        type="search"
        className={styles.input}
        value={value}
        onChange={handleChange}
        placeholder="Search conversations…"
        aria-label="Search conversations"
        autoComplete="off"
      />
      {loading && <span className={styles.loadingIndicator} aria-label="Searching" />}
    </div>
  );
}

export default memo(SearchBarInner);
