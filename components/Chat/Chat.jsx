"use client";

import { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../../store/SocketProvider.jsx";
import { addMessage, setMessages } from "../../store/chatSlice.js";
import { sendMessageApi, fetchMessages as fetchMessagesApi } from "../../services/api.js";
import ChatHeader from "../ChatHeader/ChatHeader.jsx";
import MessageList from "../MessageList/MessageList.jsx";
import ChatFooter from "../ChatFooter/ChatFooter.jsx";
import ChatInput from "../ChatInput/ChatInput.jsx";

export default function Chat() {
  const dispatch = useDispatch();
  const socket = useSocket();
  const [isSending, setIsSending] = useState(false);
  const selectedConversation = useSelector((state) => state.chat.selectedConversation);
  const activeChannelId = selectedConversation?.id ?? selectedConversation?.conversationId ?? null;

  const fetchMessages = useCallback(() => {
    if (!activeChannelId) return;
    fetchMessagesApi(activeChannelId, 1, 100)
      .then((res) => {
        const list = res.data ?? res.messages ?? [];
        const sorted = Array.isArray(list)
          ? [...list].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
          : [];
        dispatch(setMessages(sorted));
      })
      .catch(() => {});
  }, [activeChannelId, dispatch]);

  useEffect(() => {
    if (!activeChannelId) return;
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeChannelId, fetchMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (!message) return;
      const msgChannelId = message.channelId ?? message.conversationId;
      if (msgChannelId != null && msgChannelId === activeChannelId) {
        const normalized = {
          ...message,
          body: message.body ?? message.text,
        };
        dispatch(addMessage(normalized));
      }
    };

    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, activeChannelId, dispatch]);

  const handleSend = useCallback(
    (channelId, text) => {
      if (!channelId || !text?.trim()) return Promise.reject();
      setIsSending(true);
        return sendMessageApi("slack", channelId, text.trim())
        .then((response) => {
          const msg = response.data ?? response;
          dispatch(addMessage({ ...msg, isOwnMessage: true, isOwn: true }));
          setIsSending(false);
        })
        .catch(() => {
          setIsSending(false);
        });
    },
    [dispatch]
  );

  return (
    <>
      <ChatHeader />
      <div className="dashboardMainContent">
        <MessageList />
      </div>
      <ChatFooter />
      <ChatInput
        conversationId={activeChannelId}
        onSend={handleSend}
        isSending={isSending}
      />
    </>
  );
}
