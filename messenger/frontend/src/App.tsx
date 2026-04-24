import { useState, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";

import { ContactsSidebar, SidebarView } from "@/components/messenger/ContactsSidebar";
import { ChatPane } from "@/components/messenger/ChatPane";
import { MusicPlayer } from "@/components/messenger/MusicPlayer";

const queryClient = new QueryClient();

interface Message {
  id: string;
  chat_id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
  type?: string;
}

function Messenger() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarView, setSidebarView] = useState<SidebarView>("contacts");
  const wsRef = useRef<WebSocket | null>(null);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (sidebarView !== "contacts") {
          // If in any menu, return to contacts
          setSidebarView("contacts");
        } else if (activeChat) {
          // If in contacts and chat is active, close the chat
          setActiveChat(null);
          setMessages([]);
        }
        // Remove focus from any focused element
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarView, activeChat]);

  // Get API base URL
  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || window.location.origin;
  };

  // Load current user
  useEffect(() => {
    if (!token) return;

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);

      // Check if token is expired
      if (decoded.exp && decoded.exp < now) {
        handleLogout();
        return;
      }

      fetch(`${getApiUrl()}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            handleLogout();
            return;
          }
          return res.json();
        })
        .then((users) => {
          if (!users) return;
          const user = users.find((u: any) => u.id === decoded.user_id);
          setCurrentUser(user);
        })
        .catch(() => handleLogout());
    } catch (error) {
      handleLogout();
    }
  }, [token]);

  // Load chats
  const loadChats = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      // Transform chat data to include other user's info
      const transformedChats = (data || [])
        .map((chat: any) => {
          const otherUser = chat.users?.find((u: any) => u.id !== currentUser?.id);
          return {
            ...chat,
            user_id: otherUser?.id,
            username: otherUser?.nickname || otherUser?.username,
            avatar: otherUser?.avatar,
          };
        })
        .filter((chat: any) => chat.username); // Filter out chats without username

      setChats(transformedChats);
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadChats();
    }
  }, [token, currentUser]);

  // WebSocket connection
  useEffect(() => {
    if (!token) return;

    const apiUrl = getApiUrl();
    const wsHost = apiUrl.replace(/^http/, 'ws').replace(/^https/, 'wss');
    const wsUrl = `${wsHost}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          const newMessage: Message = {
            id: data.id?.toString() || Date.now().toString(),
            chat_id: data.chat_id,
            user_id: data.user_id,
            username: data.username,
            content: data.content,
            created_at: data.created_at,
            type: data.message_type,
          };

          // Add message if it's for active chat
          setMessages((prev) => {
            if (activeChat && data.chat_id === activeChat.id) {
              // Avoid duplicates
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            }
            return prev;
          });

          // Update chat list only if not already loading
          setChats((prevChats) => {
            const chatIndex = prevChats.findIndex(c => c.id === data.chat_id);
            if (chatIndex !== -1) {
              const updatedChats = [...prevChats];
              updatedChats[chatIndex] = {
                ...updatedChats[chatIndex],
                last_message: data.content,
                last_message_time: data.created_at,
              };
              return updatedChats;
            }
            return prevChats;
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [token]);

  // Load messages when chat changes
  useEffect(() => {
    if (!activeChat || !token) {
      setMessages([]);
      return;
    }

    fetch(`${getApiUrl()}/api/chats/${activeChat.id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const formattedMessages = (data || []).map((msg: any) => ({
          id: msg.id?.toString() || Date.now().toString(),
          chat_id: msg.chat_id,
          user_id: msg.user_id,
          username: msg.username,
          content: msg.content,
          created_at: msg.created_at,
          isOutgoing: msg.user_id === currentUser?.id,
          type: msg.type,
        }));
        setMessages(formattedMessages);
      })
      .catch(console.error);
  }, [activeChat, token, currentUser]);

  const handleLogin = (newToken: string, user: any) => {
    setToken(newToken);
    setCurrentUser(user);
    localStorage.setItem("token", newToken);
  };

  const handleLogout = () => {
    // Close WebSocket before logout
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem("token");
    setChats([]);
    setActiveChat(null);
    setMessages([]);
  };

  const handleSelectChat = async (selectedUser: any) => {
    // Check if chat already exists
    const existingChat = chats.find(chat =>
      chat.user_id === selectedUser.id || chat.id === selectedUser.id
    );

    if (existingChat) {
      setActiveChat(existingChat);
      setSidebarView("contacts");
      return;
    }

    // Create new chat
    try {
      const response = await fetch(`${getApiUrl()}/api/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
        }),
      });

      if (!response.ok) {
        console.error("Failed to create chat:", response.statusText);
        return;
      }

      const newChat = await response.json();

      // Transform chat data to include other user's info
      const otherUser = newChat.users?.find((u: any) => u.id !== currentUser?.id);
      const transformedChat = {
        ...newChat,
        user_id: otherUser?.id,
        username: otherUser?.nickname || otherUser?.username,
        avatar: otherUser?.avatar,
      };

      setChats((prev) => [...prev, transformedChat]);
      setActiveChat(transformedChat);
      setSidebarView("contacts");
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  const handleSendMessage = (text: string, type: string = "text") => {
    if (!activeChat || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const message = {
      type: "message",
      chat_id: activeChat.id,
      content: text,
      message_type: type,
    };

    wsRef.current.send(JSON.stringify(message));
  };

  const handleFileUpload = async (file: File) => {
    if (!activeChat || !token) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${getApiUrl()}/api/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error("File upload failed:", response.statusText);
        return;
      }

      const data = await response.json();

      if (data.filename) {
        handleSendMessage(data.filename, file.type.startsWith("image/") ? "image" : "file");
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (currentUser) {
      currentUser.avatar = newAvatarUrl;
      setCurrentUser({ ...currentUser });
    }
  };

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="dark h-screen w-full flex overflow-hidden bg-neutral-950 text-neutral-100">
      <ContactsSidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        view={sidebarView}
        onChangeView={setSidebarView}
        currentUser={currentUser}
        token={token}
        onLogout={handleLogout}
        onAvatarUpdate={handleAvatarUpdate}
      />
      <ChatPane
        chat={activeChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        onTitleClick={() => setSidebarView("contact")}
        currentUser={currentUser}
      />
      <MusicPlayer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Messenger} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
