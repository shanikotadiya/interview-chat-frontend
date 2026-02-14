import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  platform: "all",
  selectedPlatform: "all",
  selectedConversation: null,
  typingUsers: [],
  conversations: [],
  initialConversations: [],
  messages: [],
  searchQuery: "",
  searchResults: [],
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setPlatform(state, action) {
      const value = action.payload ?? "all";
      state.platform = value;
      state.selectedPlatform = value;
    },
    setSelectedConversation(state, action) {
      state.selectedConversation = action.payload;
    },
    setTypingUsers(state, action) {
      state.typingUsers = action.payload;
    },
    addTypingUser(state, action) {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser(state, action) {
      state.typingUsers = state.typingUsers.filter((id) => id !== action.payload);
    },
    setConversations(state, action) {
      state.conversations = action.payload ?? [];
    },
    setInitialConversations(state, action) {
      state.initialConversations = action.payload ?? [];
    },
    restoreConversations(state) {
      state.conversations = state.initialConversations.length ? [...state.initialConversations] : [];
    },
    addConversation(state, action) {
      state.conversations.push(action.payload);
    },
    appendConversations(state, action) {
      state.conversations = state.conversations.concat(action.payload ?? []);
    },
    setMessages(state, action) {
      state.messages = action.payload;
    },
    prependMessages(state, action) {
      state.messages = (action.payload ?? []).concat(state.messages);
    },
    addMessage(state, action) {
      state.messages.push(action.payload);
    },
    conversationNewMessage(state, action) {
      const message = action.payload;
      if (!message || message.conversationId == null) return;
      const cid = String(message.conversationId);
      const list = state.conversations;
      const idx = list.findIndex(
        (c) => (c.id ?? c.conversationId) === cid
      );
      if (idx === -1) return;
      const conv = list[idx];
      const updated = {
        ...conv,
        lastMessage: message.body ?? conv.lastMessage ?? "",
        updatedAt: message.createdAt ?? conv.updatedAt,
      };
      state.conversations = [
        updated,
        ...list.slice(0, idx),
        ...list.slice(idx + 1),
      ];
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload ?? "";
    },
    setSearchResults(state, action) {
      state.searchResults = action.payload ?? [];
    },
  },
});

export const {
  setPlatform,
  setSelectedConversation,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  setConversations,
  setInitialConversations,
  restoreConversations,
  addConversation,
  appendConversations,
  setMessages,
  prependMessages,
  addMessage,
  conversationNewMessage,
  setSearchQuery,
  setSearchResults,
} = chatSlice.actions;

export default chatSlice.reducer;
