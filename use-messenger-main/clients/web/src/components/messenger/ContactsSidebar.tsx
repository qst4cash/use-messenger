import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Settings,
  Users,
  ArrowLeft,
  Search,
  Camera,
  Save,
  Image as ImageIcon,
  Mic,
  FileText,
  X,
  Check,
  CheckCheck,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingsDialog } from "./SettingsDialog";

export type SidebarView = "contacts" | "profile" | "contact" | "search";

interface Chat {
  id: number;
  user_id: number;
  username: string;
  avatar?: string;
  last_message?: string;
  last_message_time?: string;
  unread?: number;
  online?: boolean;
  read?: boolean;
}

interface ContactsSidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  view: SidebarView;
  onChangeView: (view: SidebarView) => void;
  currentUser: any;
  token: string;
  onLogout: () => void;
  onAvatarUpdate?: (avatarUrl: string) => void;
}

export function ContactsSidebar({
  chats,
  activeChat,
  onSelectChat,
  view,
  onChangeView,
  currentUser,
  token,
  onLogout,
  onAvatarUpdate,
}: ContactsSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-neutral-950 border-r border-neutral-800 w-80 shrink-0 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-neutral-800 shrink-0">
        <button
          onClick={() => onChangeView(view === "profile" ? "contacts" : "profile")}
          className="flex items-center gap-3 group rounded-lg p-1 -m-1 hover:bg-neutral-900 transition-colors"
        >
          <div className="relative">
            <Avatar className="w-9 h-9 border border-neutral-800">
              <AvatarImage src={currentUser?.avatar || undefined} />
              <AvatarFallback className="bg-neutral-900 text-neutral-400">
                {currentUser?.username?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-neutral-950" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-neutral-100 group-hover:text-white">
              {currentUser?.nickname || currentUser?.username || "User"}
            </span>
            <span className="text-[11px] text-neutral-400">
              {view === "profile" ? "Back to chats" : "View profile"}
            </span>
          </div>
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onChangeView("search")}
            className="text-neutral-400 hover:text-neutral-200 transition-colors p-2 rounded-md hover:bg-neutral-900"
          >
            <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
          <SettingsDialog currentUser={currentUser} onLogout={onLogout}>
            <button className="text-neutral-400 hover:text-neutral-200 transition-colors p-2 rounded-md hover:bg-neutral-900">
              <Settings className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </SettingsDialog>
        </div>
      </div>

      {/* Animated views */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {view === "contacts" && (
            <motion.div
              key="contacts"
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -16, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col"
            >
              <ChatsView chats={chats} activeChat={activeChat} onSelectChat={onSelectChat} currentUser={currentUser} />
            </motion.div>
          )}
          {view === "profile" && (
            <motion.div
              key="profile"
              initial={{ x: 16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 16, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col"
            >
              <ProfileView onBack={() => onChangeView("contacts")} currentUser={currentUser} token={token} onAvatarUpdate={onAvatarUpdate} />
            </motion.div>
          )}
          {view === "search" && (
            <motion.div
              key="search"
              initial={{ x: 16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 16, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col"
            >
              <SearchView
                onBack={() => onChangeView("contacts")}
                token={token}
                onSelectUser={(user) => {
                  onSelectChat(user);
                  onChangeView("contacts");
                }}
              />
            </motion.div>
          )}
          {view === "contact" && (
            <motion.div
              key="contact"
              initial={{ x: 16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 16, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col"
            >
              <ContactInfoView
                contact={activeChat}
                onBack={() => onChangeView("contacts")}
                token={token}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChatsView({
  chats,
  activeChat,
  onSelectChat,
  currentUser,
}: {
  chats: Chat[];
  activeChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  currentUser: any;
}) {
  return (
    <>
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 text-neutral-400">
        <Users className="w-4 h-4" strokeWidth={1.5} />
        <span className="text-xs uppercase tracking-wider font-medium">Chats</span>
      </div>
      <ScrollArea className="flex-1 w-full">
        <div className="px-2 pb-3 space-y-0.5">
          {chats.length === 0 ? (
            <div className="text-center text-neutral-500 text-sm py-8">
              No chats yet. Search for users to start chatting.
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = activeChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-lg transition-colors text-left ${
                    isActive ? "bg-neutral-900" : "hover:bg-neutral-900/60"
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="w-10 h-10 border border-neutral-800">
                      <AvatarImage src={chat.avatar || undefined} />
                      <AvatarFallback className="bg-neutral-900 text-neutral-400 text-xs">
                        {chat.username?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    {chat.online && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-neutral-950" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                    <div className="flex justify-between items-baseline mb-0.5 gap-2">
                      <span className={`text-sm truncate ${isActive ? "text-white font-medium" : "text-neutral-200"}`}>
                        {chat.username}
                      </span>
                      {chat.last_message_time && (
                        <span className="text-[10px] text-neutral-400 whitespace-nowrap shrink-0">
                          {chat.last_message_time}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        {chat.last_message && chat.user_id !== currentUser?.id && (
                          <>
                            {chat.read ? (
                              <CheckCheck className="w-3 h-3 text-blue-500 shrink-0" />
                            ) : (
                              <Check className="w-3 h-3 text-neutral-500 shrink-0" />
                            )}
                          </>
                        )}
                        <span className="text-xs truncate text-neutral-400">
                          {chat.last_message || `Start chatting with ${chat.username}`}
                        </span>
                      </div>
                      {chat.unread && chat.unread > 0 && (
                        <span className="h-4 min-w-[16px] flex items-center justify-center px-1 text-[10px] rounded-full bg-neutral-200 text-neutral-950 font-medium shrink-0">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </>
  );
}

function SearchView({
  onBack,
  token,
  onSelectUser,
}: {
  onBack: () => void;
  token: string;
  onSelectUser: (user: any) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        const filtered = data.filter((u: any) =>
          u.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setUsers(filtered);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, token]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          autoFocus
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2 pb-3 space-y-0.5">
          {loading ? (
            <div className="text-center text-neutral-500 text-sm py-8">Searching...</div>
          ) : users.length === 0 ? (
            <div className="text-center text-neutral-500 text-sm py-8">
              {searchQuery ? "No users found" : "Type to search users"}
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-900/60 transition-colors text-left"
              >
                <Avatar className="w-10 h-10 border border-neutral-800">
                  <AvatarImage src={user.avatar ? `/uploads/${user.avatar}` : undefined} />
                  <AvatarFallback className="bg-neutral-900 text-neutral-400 text-xs">
                    {user.nickname?.substring(0, 2).toUpperCase() || user.username?.substring(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm text-neutral-200">{user.nickname || user.username}</div>
                  <div className="text-xs text-neutral-500">@{user.username}</div>
                  {user.bio && <div className="text-xs text-neutral-500 truncate">{user.bio}</div>}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-neutral-800 shrink-0">
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-800 transition-colors border border-neutral-800"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Back to Chats
        </button>
      </div>
    </div>
  );
}

function ProfileView({ onBack, currentUser, token, onAvatarUpdate }: { onBack: () => void; currentUser: any; token: string; onAvatarUpdate?: (avatarUrl: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nickname, setNickname] = useState(currentUser?.nickname || currentUser?.username || "");
  const [saving, setSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const handleSaveBio = async () => {
    if (!currentUser?.id) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/users/${currentUser.id}/bio`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsEditing(false);
        if (currentUser) {
          currentUser.bio = data.bio;
        }
      } else {
        const error = await response.text();
        console.error("Failed to save bio:", error);
        alert("Failed to save bio");
      }
    } catch (error) {
      console.error("Failed to save bio:", error);
      alert("Failed to save bio");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!currentUser?.id) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/users/${currentUser.id}/nickname`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsEditingNickname(false);
        if (currentUser) {
          currentUser.nickname = data.nickname;
        }
      } else {
        const error = await response.text();
        console.error("Failed to save nickname:", error);
        alert("Failed to save nickname");
      }
    } catch (error) {
      console.error("Failed to save nickname:", error);
      alert("Failed to save nickname");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create 1:1 aspect ratio image
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target?.result as string;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;

        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

        canvas.toBlob(async (blob) => {
          if (!blob) return;

          const formData = new FormData();
          formData.append('avatar', blob, 'avatar.jpg');

          try {
            const response = await fetch("/api/users/avatar", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              if (currentUser && data.avatar) {
                currentUser.avatar = data.avatar;
                // Call parent callback to update avatar everywhere
                if (onAvatarUpdate) {
                  onAvatarUpdate(data.avatar);
                }
              }
            } else {
              console.error("Failed to upload avatar");
              alert("Failed to upload avatar");
            }
          } catch (error) {
            console.error("Failed to upload avatar:", error);
          }
        }, 'image/jpeg', 0.9);
      };
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center pt-6 pb-4 px-6">
          <div className="relative">
            <Avatar
              className="w-24 h-24 border border-neutral-800 mb-4 cursor-pointer"
              onClick={() => setShowAvatarModal(true)}
            >
              <AvatarImage src={currentUser?.avatar || undefined} />
              <AvatarFallback className="bg-neutral-900 text-neutral-400">
                {currentUser?.nickname?.substring(0, 2).toUpperCase() || currentUser?.username?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
          </div>
          <h2 className="text-lg font-medium text-neutral-100">{currentUser?.nickname || currentUser?.username || "User"}</h2>
          <p className="text-xs text-neutral-400 mt-0.5">@{currentUser?.username || "user"}</p>

          <div className="flex gap-2 mt-3">
            <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 transition-colors cursor-pointer">
              <Camera className="w-3.5 h-3.5" strokeWidth={1.5} />
              Avatar
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
            <button
              onClick={() => setIsEditingNickname(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 transition-colors"
            >
              <User className="w-3.5 h-3.5" strokeWidth={1.5} />
              Nickname
            </button>
          </div>

          {isEditingNickname && (
            <div className="w-full mt-3 space-y-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                placeholder="Enter new nickname..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNickname}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-xs text-white transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditingNickname(false);
                    setNickname(currentUser?.nickname || currentUser?.username || "");
                  }}
                  className="px-3 py-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="w-full mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-400 uppercase tracking-wider">Bio</span>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-blue-500 hover:text-blue-400"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveBio}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-xs text-white transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setBio(currentUser?.bio || "");
                    }}
                    className="px-3 py-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-neutral-400 leading-relaxed">
                {currentUser?.bio || "No bio yet"}
              </p>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowAvatarModal(false)}
        >
          <div className="relative max-w-lg w-full p-4">
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute top-6 right-6 text-white hover:text-neutral-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={currentUser?.avatar || undefined}
              alt="Avatar"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}

      <div className="p-3 border-t border-neutral-800 shrink-0">
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-800 transition-colors border border-neutral-800"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Back to Chats
        </button>
      </div>
    </div>
  );
}

function ContactInfoView({
  contact,
  onBack,
  token,
}: {
  contact: Chat | null;
  onBack: () => void;
  token: string;
}) {
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    if (!contact || !token) return;

    // Fetch full user info
    fetch(`/api/users/${contact.user_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setContactInfo)
      .catch(console.error);

    // Fetch media from chat
    fetch(`/api/chats/${contact.id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((messages) => {
        const mediaMessages = messages.filter(
          (m: any) => m.type === "image" || m.type === "voice" || m.type === "file"
        );
        setMedia(mediaMessages);
      })
      .catch(console.error);
  }, [contact, token]);

  if (!contact) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
          No contact selected.
        </div>
        <div className="p-3 border-t border-neutral-800 shrink-0">
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-800 transition-colors border border-neutral-800"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center pt-6 pb-4 px-6">
          <Avatar
            className="w-24 h-24 border border-neutral-800 mb-4 cursor-pointer"
            onClick={() => setShowAvatarModal(true)}
          >
            <AvatarImage src={contact.avatar || undefined} />
            <AvatarFallback className="bg-neutral-900 text-neutral-400">
              {contact.username?.substring(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-medium text-neutral-100">{contact.username}</h2>
          <p className="text-xs text-neutral-400 mt-0.5">@{contact.username}</p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {contact.online ? "Active now" : "Last seen recently"}
          </p>
          {contactInfo?.bio && (
            <p className="text-[13px] text-neutral-400 mt-3 text-center leading-relaxed">
              {contactInfo.bio}
            </p>
          )}
        </div>

        <div className="px-4">
          <div className="px-2 pb-2 flex items-center gap-2 text-neutral-400">
            <ImageIcon className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs uppercase tracking-wider font-medium">Shared Media</span>
          </div>
          {media.length === 0 ? (
            <div className="text-center text-neutral-500 text-sm py-4">No media shared yet</div>
          ) : (
            <div className="space-y-1 mb-5">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-neutral-900/40 border border-neutral-800"
                >
                  {item.type === "image" && <ImageIcon className="w-4 h-4 text-neutral-400" />}
                  {item.type === "voice" && <Mic className="w-4 h-4 text-neutral-400" />}
                  {item.type === "file" && <FileText className="w-4 h-4 text-neutral-400" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-neutral-300 truncate">{item.content}</div>
                    <div className="text-[10px] text-neutral-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowAvatarModal(false)}
        >
          <div className="relative max-w-lg w-full p-4">
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute top-6 right-6 text-white hover:text-neutral-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={contact.avatar || undefined}
              alt="Avatar"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}

      <div className="p-3 border-t border-neutral-800 shrink-0">
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-800 transition-colors border border-neutral-800"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Back to Chats
        </button>
      </div>
    </div>
  );
}
