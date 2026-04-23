import { useState, useRef, useEffect } from "react";
import { Search, Phone, Info, Paperclip, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Contact, Message } from "./mockData";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatPaneProps {
  contact: Contact | undefined;
  onTitleClick?: () => void;
}

export function ChatPane({ contact, onTitleClick }: ChatPaneProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contact) setMessages(contact.messages || []);
  }, [contact]);

  useEffect(() => {
    if (scrollRef.current) {
      const v = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (v) v.scrollTop = v.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || !contact) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOutgoing: true,
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const headerLabel = contact?.name ?? "#General";

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 min-w-0 relative">
      {/* Header */}
      <div className="h-16 px-6 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <button
          onClick={onTitleClick}
          className="text-base font-medium text-neutral-100 hover:text-white transition-colors px-2 -mx-2 py-1 rounded-md hover:bg-neutral-900"
          data-testid="button-chat-title"
        >
          {headerLabel}
        </button>
        <div className="flex items-center gap-1">
          {[Search, Phone, Info].map((Icon, i) => (
            <button
              key={i}
              className="text-neutral-500 hover:text-neutral-200 transition-colors p-2 rounded-md hover:bg-neutral-900"
              data-testid={`button-header-action-${i}`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 relative overflow-hidden bg-neutral-950">
        {/* Concentric circles watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            width="640"
            height="640"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            className="text-neutral-700 opacity-30"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <circle key={i} cx="50" cy="50" r={4 + i * 4} strokeWidth="0.15" />
            ))}
          </svg>
        </div>

        <ScrollArea className="h-full px-6 relative" ref={scrollRef}>
          <div className="py-6 flex flex-col gap-4 justify-end min-h-full">
            {messages.map((msg, idx) => {
              const prev = messages[idx - 1];
              const isFirstInSequence = !prev || prev.isOutgoing !== msg.isOutgoing;
              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${msg.isOutgoing ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-3 max-w-[72%] ${
                      msg.isOutgoing ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {!msg.isOutgoing && contact && (
                      <div className="w-8 shrink-0 flex items-start pt-0.5">
                        {isFirstInSequence ? (
                          <Avatar className="w-8 h-8 border border-neutral-800">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback className="bg-neutral-900 text-neutral-400 text-[10px]">
                              {contact.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col gap-1 ${msg.isOutgoing ? "items-end" : "items-start"}`}>
                      {isFirstInSequence && contact && !msg.isOutgoing && (
                        <div className="flex items-baseline gap-2 px-1">
                          <span className="text-xs text-neutral-300 font-medium">{contact.name}</span>
                          <span className="text-[10px] text-neutral-500">{msg.timestamp}</span>
                        </div>
                      )}
                      <div
                        className={`px-3.5 py-2 text-sm leading-relaxed rounded-2xl ${
                          msg.isOutgoing
                            ? "border border-neutral-800 text-neutral-300"
                            : "bg-neutral-900 text-neutral-100"
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.isOutgoing && (
                        <span className="text-[10px] text-neutral-500 px-1">{msg.timestamp}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 shrink-0 bg-neutral-950">
        <div className="flex items-center gap-2 bg-neutral-900 rounded-full px-4 py-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type a message in ${headerLabel}...`}
            data-testid="input-message"
            className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-100 placeholder:text-neutral-500 min-w-0 py-2"
          />
          <button
            className="text-neutral-500 hover:text-neutral-200 transition-colors p-2 shrink-0"
            data-testid="button-attach"
          >
            <Paperclip className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleSend}
            data-testid="button-send"
            className="p-2 rounded-full shrink-0 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
          >
            <Send className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
