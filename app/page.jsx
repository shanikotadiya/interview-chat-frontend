import PlatformSidebar from "../components/PlatformSidebar/PlatformSidebar.jsx";
import SearchBar from "../components/SearchBar/SearchBar.jsx";
import ConversationList from "../components/ConversationList/ConversationList.jsx";
import ChatHeader from "../components/ChatHeader/ChatHeader.jsx";
import MessageList from "../components/MessageList/MessageList.jsx";
import ChatFooter from "../components/ChatFooter/ChatFooter.jsx";
import ChatInput from "../components/ChatInput/ChatInput.jsx";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;

const getBackendBase = () =>
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

async function fetchConversationsSSR() {
  const base = getBackendBase().replace(/\/$/, "");
  const url = `${base}/api/conversations?page=${DEFAULT_PAGE}&limit=${DEFAULT_LIMIT}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return { data: [], total: 0, page: DEFAULT_PAGE, limit: DEFAULT_LIMIT, totalPages: 0 };
  }
  const json = await res.json();
  return {
    data: json.data ?? [],
    total: json.total ?? 0,
    page: json.page ?? DEFAULT_PAGE,
    limit: json.limit ?? DEFAULT_LIMIT,
    totalPages: json.totalPages ?? 0,
  };
}

export default async function Home() {
  const initialData = await fetchConversationsSSR();

  return (
    <div className="dashboard">
      <PlatformSidebar />
      <aside className="dashboardSidebar">
        <div className="dashboardSidebarHeader">
          <h1 className="dashboardTitle">Conversations</h1>
          <SearchBar />
        </div>
        <div className="dashboardSidebarList">
          <ConversationList
            initialConversations={initialData.data}
            initialTotal={initialData.total}
          />
        </div>
      </aside>
      <main className="dashboardMain">
        <ChatHeader />
        <div className="dashboardMainContent">
          <MessageList />
        </div>
        <ChatFooter />
        <ChatInput />
      </main>
    </div>
  );
}
