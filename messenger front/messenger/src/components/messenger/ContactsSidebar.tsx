import { AnimatePresence, motion } from "framer-motion";
import {
  Settings,
  Users,
  ArrowLeft,
  Shield,
  Bell,
  Lock,
  KeyRound,
  Eye,
  Pencil,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingsDialog } from "./SettingsDialog";
import { Contact } from "./mockData";
import alexAvatar from "@/assets/images/alex.png";

export type SidebarView = "contacts" | "profile" | "contact";

interface ContactsSidebarProps {
  contacts: Contact[];
  activeContactId: string;
  onSelectContact: (id: string) => void;
  view: SidebarView;
  onChangeView: (view: SidebarView) => void;
  activeContact: Contact | undefined;
}

export function ContactsSidebar({
  contacts,
  activeContactId,
  onSelectContact,
  view,
  onChangeView,
  activeContact,
}: ContactsSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-neutral-950 border-r border-neutral-800 w-80 shrink-0 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-neutral-800 shrink-0">
        <button
          onClick={() => onChangeView(view === "profile" ? "contacts" : "profile")}
          className="flex items-center gap-3 group rounded-lg p-1 -m-1 hover:bg-neutral-900 transition-colors"
          data-testid="button-toggle-profile"
        >
          <div className="relative">
            <Avatar className="w-9 h-9 border border-neutral-800">
              <AvatarImage src={alexAvatar} />
              <AvatarFallback className="bg-neutral-900 text-neutral-400">AR</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-neutral-300 rounded-full border-2 border-neutral-950" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-neutral-100 group-hover:text-white">Alex R.</span>
            <span className="text-[11px] text-neutral-400">
              {view === "profile" ? "Back to chats" : "View profile"}
            </span>
          </div>
        </button>
        <SettingsDialog>
          <button
            className="text-neutral-400 hover:text-neutral-200 transition-colors p-2 rounded-md hover:bg-neutral-900"
            data-testid="button-settings"
          >
            <Settings className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
        </SettingsDialog>
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
              <ContactsView
                contacts={contacts}
                activeContactId={activeContactId}
                onSelectContact={onSelectContact}
              />
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
              <ProfileView onBack={() => onChangeView("contacts")} />
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
              <ContactInfoView contact={activeContact} onBack={() => onChangeView("contacts")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ContactsView({
  contacts,
  activeContactId,
  onSelectContact,
}: {
  contacts: Contact[];
  activeContactId: string;
  onSelectContact: (id: string) => void;
}) {
  return (
    <>
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 text-neutral-400">
        <Users className="w-4 h-4" strokeWidth={1.5} />
        <span className="text-xs uppercase tracking-wider font-medium">Contacts</span>
      </div>
      <ScrollArea className="flex-1 w-full">
        <div className="px-2 pb-3 space-y-0.5">
          {contacts.map((contact) => {
            const isActive = activeContactId === contact.id;
            return (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact.id)}
                data-testid={`button-contact-${contact.id}`}
                className={`w-full flex items-start gap-3 p-2.5 rounded-lg transition-colors text-left ${
                  isActive ? "bg-neutral-900" : "hover:bg-neutral-900/60"
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-10 h-10 border border-neutral-800">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="bg-neutral-900 text-neutral-400 text-xs">
                      {contact.name.replace(/[^A-Za-z]/g, "").substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-neutral-300 rounded-full border-2 border-neutral-950" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                  <div className="flex justify-between items-baseline mb-0.5 gap-2">
                    <span className={`text-sm truncate ${isActive ? "text-white font-medium" : "text-neutral-200"}`}>
                      {contact.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 whitespace-nowrap shrink-0">
                      {contact.lastMessageTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs truncate text-neutral-400">{contact.lastMessage}</span>
                    {contact.unread > 0 && (
                      <span className="h-4 min-w-[16px] flex items-center justify-center px-1 text-[10px] rounded-full bg-neutral-200 text-neutral-950 font-medium shrink-0">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
}

function BackToChatsButton({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-3 border-t border-neutral-800 shrink-0">
      <button
        onClick={onBack}
        data-testid="button-back-to-chats"
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-800 transition-colors border border-neutral-800"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Back to Chats
      </button>
    </div>
  );
}

function ProfileView({ onBack }: { onBack: () => void }) {
  const menuItems = [
    { icon: Lock, label: "Two-Factor Authentication", value: "Enabled" },
    { icon: KeyRound, label: "Encryption Keys", value: "Manage" },
    { icon: Eye, label: "Read Receipts", value: "On" },
    { icon: Bell, label: "Notifications", value: "Default" },
  ];

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center pt-6 pb-4 px-6">
          <Avatar className="w-24 h-24 border border-neutral-800 mb-4">
            <AvatarImage src={alexAvatar} />
            <AvatarFallback className="bg-neutral-900 text-neutral-400">AR</AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-medium text-neutral-100">Alex R.</h2>
          <p className="text-xs text-neutral-400 mt-0.5">@alex.r</p>

          <button
            data-testid="button-edit-profile"
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
            Edit Profile
          </button>

          <p className="text-[13px] text-neutral-400 mt-5 text-center leading-relaxed">
            Designer &amp; engineer. Building quiet interfaces with no distractions.
          </p>
        </div>

        <div className="px-4 mt-2">
          <div className="px-2 pb-2 flex items-center gap-2 text-neutral-400">
            <Shield className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs uppercase tracking-wider font-medium">Privacy</span>
          </div>
          <div className="border border-neutral-800 rounded-lg overflow-hidden divide-y divide-neutral-800 bg-neutral-900/40">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-neutral-900 transition-colors text-left"
                data-testid={`button-privacy-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                  <span className="text-sm text-neutral-200">{item.label}</span>
                </div>
                <span className="text-xs text-neutral-400">{item.value}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="h-6" />
      </ScrollArea>
      <BackToChatsButton onBack={onBack} />
    </div>
  );
}

function ContactInfoView({
  contact,
  onBack,
}: {
  contact: Contact | undefined;
  onBack: () => void;
}) {
  if (!contact) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
          No contact selected.
        </div>
        <BackToChatsButton onBack={onBack} />
      </div>
    );
  }

  const mutualGroups = ["Design Team", "#General", "Product Sync"];
  const sharedMedia = Array.from({ length: 6 });

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center pt-6 pb-4 px-6">
          <Avatar className="w-24 h-24 border border-neutral-800 mb-4">
            <AvatarImage src={contact.avatar} />
            <AvatarFallback className="bg-neutral-900 text-neutral-400">
              {contact.name.replace(/[^A-Za-z]/g, "").substring(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-medium text-neutral-100" data-testid="text-contact-name">
            {contact.name}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {contact.online ? "Active now" : "Last seen recently"}
          </p>
        </div>

        <div className="px-4">
          <div className="px-2 pb-2 flex items-center gap-2 text-neutral-400">
            <Users className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs uppercase tracking-wider font-medium">Mutual Groups</span>
          </div>
          <div className="border border-neutral-800 rounded-lg overflow-hidden divide-y divide-neutral-800 bg-neutral-900/40 mb-5">
            {mutualGroups.map((g) => (
              <div
                key={g}
                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-neutral-900 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-neutral-400" strokeWidth={1.5} />
                </div>
                <span className="text-sm text-neutral-200">{g}</span>
              </div>
            ))}
          </div>

          <div className="px-2 pb-2 flex items-center gap-2 text-neutral-400">
            <ImageIcon className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs uppercase tracking-wider font-medium">Shared Media</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-5">
            {sharedMedia.map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center"
              >
                <ImageIcon className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
              </div>
            ))}
          </div>

          <div className="border border-neutral-800 rounded-lg overflow-hidden divide-y divide-neutral-800 bg-neutral-900/40 mb-2">
            <button className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-neutral-900 transition-colors text-left">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                <span className="text-sm text-neutral-200">Files</span>
              </div>
              <span className="text-xs text-neutral-400">12</span>
            </button>
            <button className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-neutral-900 transition-colors text-left">
              <div className="flex items-center gap-3">
                <LinkIcon className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                <span className="text-sm text-neutral-200">Links</span>
              </div>
              <span className="text-xs text-neutral-400">5</span>
            </button>
          </div>
        </div>
        <div className="h-6" />
      </ScrollArea>
      <BackToChatsButton onBack={onBack} />
    </div>
  );
}
