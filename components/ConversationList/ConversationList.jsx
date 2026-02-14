"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setConversations } from "../../store/chatSlice.js";

export default function ConversationList({ initialData }) {
  const dispatch = useDispatch();
  const conversations = useSelector((state) => state.chat.conversations);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current || !initialData?.data) return;
    hasHydrated.current = true;
    dispatch(setConversations(Array.isArray(initialData.data) ? initialData.data : []));
  }, [dispatch, initialData]);

  const list = conversations.length > 0 ? conversations : (initialData?.data ?? []);

  return (
    <ul className="conversationList" aria-label="Conversation list">
      {list.length === 0 ? (
        <li className="conversationListEmpty">No conversations yet.</li>
      ) : (
        list.map((conv) => (
          <li key={conv.id ?? conv.conversationId ?? JSON.stringify(conv)} className="conversationListItem">
            {conv.subject ?? conv.title ?? conv.id ?? "Conversation"}
          </li>
        ))
      )}
    </ul>
  );
}
