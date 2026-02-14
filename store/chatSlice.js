import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedConversation: null,
  typingUsers: [],
  conversations: [],
  messages: [],
  searchQuery: "",
  searchResults: [],
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
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
      state.conversations = action.payload;
    },
    addConversation(state, action) {
      state.conversations.push(action.payload);
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
    setSearchQuery(state, action) {
      state.searchQuery = action.payload ?? "";
    },
    setSearchResults(state, action) {
      state.searchResults = action.payload ?? [];
    },
  },
});

export const {
  setSelectedConversation,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  setConversations,
  addConversation,
  setMessages,
  prependMessages,
  addMessage,
  setSearchQuery,
  setSearchResults,
} = chatSlice.actions;

export default chatSlice.reducer;
