import { useState, useRef, useEffect } from "react";
import { Search, Phone, Info, Paperclip, Send, Mic, Play, Check, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  created_at: string;
  isOutgoing: boolean;
  type?: "text" | "voice" | "image" | "file";
  read?: boolean;
}

interface ChatPaneProps {
  chat: any;
  messages: Message[];
  onSendMessage: (text: string, type?: string) => void;
  onFileUpload: (file: File) => void;
  onTitleClick?: () => void;
  currentUser: any;
}

export function ChatPane({ chat, messages, onSendMessage, onFileUpload, onTitleClick, currentUser }: ChatPaneProps) {
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const v = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (v) v.scrollTop = v.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      // Cleanup MediaRecorder on unmount
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSend = () => {
    if (recordedBlob) {
      // Send voice message
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onSendMessage(base64, "voice");
        setRecordedBlob(null);
      };
      reader.readAsDataURL(recordedBlob);
    } else if (inputValue.trim()) {
      onSendMessage(inputValue.trim(), "text");
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      // Audio level visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!isRecording) return;
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(Math.min(100, average));
        requestAnimationFrame(updateLevel);
      };

      mediaRecorder.start();
      setIsRecording(true);
      updateLevel();
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const headerLabel = chat?.username ?? "Select a chat";

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 min-w-0 relative">
      {/* Header */}
      <div className="h-16 px-6 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <button
          onClick={onTitleClick}
          className="text-base font-medium text-neutral-100 hover:text-white transition-colors px-2 -mx-2 py-1 rounded-md hover:bg-neutral-900"
        >
          {headerLabel}
        </button>
        <div className="flex items-center gap-1">
          {[Search, Phone, Info].map((Icon, i) => (
            <button
              key={i}
              className="text-neutral-500 hover:text-neutral-200 transition-colors p-2 rounded-md hover:bg-neutral-900"
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 relative overflow-hidden bg-neutral-950">
        {/* Concentric circles watermark with USE COMMUNITY text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <svg
              width="640"
              height="640"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              className="text-neutral-800 opacity-25"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <circle key={i} cx="50" cy="50" r={4 + i * 4} strokeWidth="0.15" />
              ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-white text-2xl font-black tracking-wider opacity-25"
                style={{ fontFamily: 'Impact, sans-serif' }}
              >
                USE COMMUNITY
              </span>
            </div>
          </div>
        </div>

        <ScrollArea className="h-full px-6 relative" ref={scrollRef}>
          <div className="py-6 flex flex-col gap-4 justify-end min-h-full">
            {messages.length === 0 ? (
              <div className="text-center text-neutral-500 text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg, idx) => {
                const prev = messages[idx - 1];
                const isFirstInSequence = !prev || prev.isOutgoing !== msg.isOutgoing;
                const currentTime = formatTime(msg.created_at || new Date().toISOString());

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
                      {!msg.isOutgoing && chat && (
                        <div className="w-8 shrink-0 flex items-start pt-0.5">
                          {isFirstInSequence ? (
                            <Avatar className="w-8 h-8 border border-neutral-800">
                              <AvatarImage src={chat.avatar || undefined} />
                              <AvatarFallback className="bg-neutral-900 text-neutral-400 text-[10px]">
                                {chat.username?.substring(0, 2).toUpperCase() || "??"}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-8" />
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col gap-1 ${msg.isOutgoing ? "items-end" : "items-start"}`}>
                        {isFirstInSequence && chat && !msg.isOutgoing && (
                          <div className="flex items-baseline gap-2 px-1">
                            <span className="text-xs text-neutral-300 font-medium">{chat.username}</span>
                            <span className="text-[10px] text-neutral-500">{currentTime}</span>
                          </div>
                        )}
                        <div
                          className={`px-3.5 py-2 text-sm leading-relaxed rounded-2xl ${
                            msg.isOutgoing
                              ? "border border-neutral-800 text-neutral-300"
                              : "bg-neutral-900 text-neutral-100"
                          }`}
                        >
                          {msg.type === "voice" ? (
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <button className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors">
                                <Play className="w-4 h-4 ml-0.5" />
                              </button>
                              <div className="flex-1">
                                <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 w-0" />
                                </div>
                                <div className="text-[10px] text-neutral-500 mt-1">Voice message</div>
                              </div>
                            </div>
                          ) : msg.type === "image" ? (
                            <img src={`/uploads/${msg.content}`} alt="Shared" className="max-w-xs rounded" />
                          ) : (
                            msg.content
                          )}
                        </div>
                        {msg.isOutgoing && (
                          <div className="flex items-center gap-1 px-1">
                            <span className="text-[10px] text-neutral-500">{currentTime}</span>
                            {msg.read ? (
                              <CheckCheck className="w-3 h-3 text-blue-500" />
                            ) : (
                              <Check className="w-3 h-3 text-neutral-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 shrink-0 bg-neutral-950">
        {isRecording || recordedBlob ? (
          <div className="flex items-center gap-2 bg-neutral-900 rounded-full px-4 py-3">
            <div className="flex-1 flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-red-500" />
                </div>
                {isRecording && (
                  <div
                    className="absolute inset-0 rounded-full border-2 border-red-500 pointer-events-none"
                    style={{
                      transform: `scale(${1 + audioLevel / 100})`,
                      transition: "transform 0.1s ease-out",
                    }}
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm text-neutral-300">
                  {isRecording ? "Recording..." : "Voice message recorded"}
                </div>
                <div className="text-xs text-neutral-500">
                  {isRecording ? "Tap to stop" : "Tap send to share"}
                </div>
              </div>
            </div>
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="p-2 rounded-full shrink-0 bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <Mic className="w-4 h-4" strokeWidth={1.75} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                className="p-2 rounded-full shrink-0 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
              >
                <Send className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-neutral-900 rounded-full px-4 py-1.5">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${headerLabel}...`}
              className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-100 placeholder:text-neutral-500 min-w-0 py-2"
            />
            <button
              onClick={startRecording}
              className="text-neutral-500 hover:text-neutral-200 transition-colors p-2 shrink-0 rounded-full"
            >
              <Mic className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,audio/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-neutral-500 hover:text-neutral-200 transition-colors p-2 shrink-0"
            >
              <Paperclip className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="p-2 rounded-full shrink-0 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
