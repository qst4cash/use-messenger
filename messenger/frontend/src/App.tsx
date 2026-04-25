import { useState, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
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
  read?: boolean;
  file_name?: string;
}

function Messenger() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarView, setSidebarView] = useState<SidebarView>("contacts");
  const wsRef = useRef<WebSocket | null>(null);
  const activeChatRef = useRef<any>(null);
  const currentUserRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Keep refs in sync
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

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
            unread: chat.unread_count || 0,
            last_message: chat.last_message || '',
            last_message_time: chat.last_message_time || null,
            last_message_user_id: chat.last_message_user_id || null,
            last_message_type: chat.last_message_type || '',
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

  // WebSocket connection with reconnection
  useEffect(() => {
    if (!token) return;

    const connectWebSocket = () => {
      const apiUrl = getApiUrl();
      const wsHost = apiUrl.replace(/^http/, 'ws').replace(/^https/, 'wss');
      const wsUrl = `${wsHost}/ws?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttemptsRef.current = 0;
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
              content: data.file_url || data.content,
              created_at: data.created_at,
              type: data.message_type,
              read: data.read || false,
              file_name: data.file_name || '',
            };

            // Add message if it's for active chat - use ref to avoid stale closure
            setMessages((prev) => {
              if (activeChatRef.current && data.chat_id === activeChatRef.current.id) {
                // Avoid duplicates
                if (prev.some(m => m.id === newMessage.id)) return prev;

                // Add isOutgoing field
                const messageWithOutgoing = {
                  ...newMessage,
                  isOutgoing: currentUserRef.current && data.user_id === currentUserRef.current.id
                };

                return [...prev, messageWithOutgoing];
              }
              return prev;
            });

            // Update chat list
            setChats((prevChats) => {
              const chatIndex = prevChats.findIndex(c => c.id === data.chat_id);
              if (chatIndex !== -1) {
                const updatedChats = [...prevChats];
                updatedChats[chatIndex] = {
                  ...updatedChats[chatIndex],
                  last_message: data.content,
                  last_message_time: data.created_at,
                  last_message_user_id: data.user_id,
                  last_message_type: data.message_type || '',
                  read: false,
                };
                return updatedChats;
              }
              return prevChats;
            });
          } else if (data.type === "user_status") {
            // Update user online status
            setChats((prevChats) => {
              return prevChats.map(chat => {
                if (chat.user_id === data.user_id) {
                  return { ...chat, online: data.online };
                }
                return chat;
              });
            });

            // Update active chat if it's the same user
            if (activeChatRef.current && activeChatRef.current.user_id === data.user_id) {
              setActiveChat((prev: any) => prev ? { ...prev, online: data.online } : prev);
            }
          } else if (data.type === "messages_read") {
            // Mark messages as read in active chat
            if (activeChatRef.current && activeChatRef.current.id === data.chat_id) {
              setMessages((prev) =>
                prev.map(msg =>
                  msg.user_id === currentUserRef.current?.id ? { ...msg, read: true } : msg
                )
              );
            }

            // Update chat list to show read status - only if last message was from current user
            setChats((prevChats) => {
              return prevChats.map(chat => {
                if (chat.id === data.chat_id && chat.last_message_user_id === currentUserRef.current?.id) {
                  return { ...chat, read: true };
                }
                return chat;
              });
            });
          } else if (data.type === "unread_count") {
            // Update unread count for specific chat
            if (data.user_id === currentUserRef.current?.id) {
              setChats((prevChats) => {
                return prevChats.map(chat => {
                  if (chat.id === data.chat_id) {
                    return { ...chat, unread: data.unread_count };
                  }
                  return chat;
                });
              });
            }
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
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < 10) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting in ${delay}ms...`);
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token]);

  // Load messages when chat changes
  useEffect(() => {
    if (!activeChat || !token) {
      setMessages([]);
      return;
    }

    // Reset unread count for this chat
    setChats((prevChats) =>
      prevChats.map(chat =>
        chat.id === activeChat.id ? { ...chat, unread: 0 } : chat
      )
    );

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
          content: msg.file_url || msg.content,
          created_at: msg.created_at,
          isOutgoing: msg.user_id === currentUser?.id,
          type: msg.file_type ? msg.file_type : "text",
          read: msg.read || false,
          file_name: msg.file_name || '',
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

    // Validate message length (max 5000 characters)
    if (type === "text" && text.trim().length > 5000) {
      toast({
        title: "Message too long",
        variant: "destructive",
      });
      return;
    }

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

    // Check file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chat_id", activeChat.id.toString());

    // Determine file type - voice messages have specific name
    let fileType = "file";
    if (file.name === "voice.webm") {
      fileType = "voice";
    } else if (file.type.startsWith("image/")) {
      fileType = "image";
    } else if (file.type.startsWith("video/")) {
      fileType = "video";
    } else if (file.type.startsWith("audio/")) {
      fileType = "audio";
    }

    formData.append("file_type", fileType);

    try {
      const response = await fetch(`${getApiUrl()}/api/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        toast({
          title: "Upload failed",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      console.log("File uploaded successfully:", data);
      toast({
        title: fileType === "voice" ? "Voice message sent" : "File uploaded",
      });
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast({
        title: "Upload failed",
        variant: "destructive",
      });
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
