import { useState, useRef, useEffect } from "react";
import { Search, Phone, Info, Paperclip, Send, Mic, Play, Check, CheckCheck, X, Download, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  content: string;
  created_at: string;
  isOutgoing: boolean;
  type?: "text" | "voice" | "image" | "file";
  read?: boolean;
  file_name?: string;
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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({});
  const [audioDuration, setAudioDuration] = useState<{ [key: string]: number }>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const v = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (v) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
          v.scrollTop = v.scrollHeight;
        }, 100);
      }
    }
  }, [messages, chat]);

  // Handle ESC key to close image modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && imageModalOpen) {
        setImageModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [imageModalOpen]);

  useEffect(() => {
    return () => {
      // Cleanup MediaRecorder on unmount
      cleanupMediaRecorder();
    };
  }, []);

  // Cleanup when chat changes
  useEffect(() => {
    cleanupMediaRecorder();
  }, [chat?.id]);

  const cleanupMediaRecorder = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setAudioLevel(0);
    setRecordedBlob(null);
  };

  const handleSend = () => {
    if (recordedBlob) {
      // Send voice message as file upload
      const file = new File([recordedBlob], "voice.webm", { type: "audio/webm" });
      onFileUpload(file);
      setRecordedBlob(null);
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
      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        alert(`File is too large. Maximum size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        e.target.value = ''; // Reset input
        return;
      }
      onFileUpload(file);
    }
  };

  const toggleAudioPlay = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingAudio(null);
      setAudioProgress((prev) => ({ ...prev, [audioUrl]: 0 }));
    } else {
      // Start playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Load metadata to get duration
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration((prev) => ({ ...prev, [audioUrl]: audio.duration }));
      });

      // Update progress
      audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress((prev) => ({ ...prev, [audioUrl]: progress }));
      });

      audio.play();
      setPlayingAudio(audioUrl);

      audio.onended = () => {
        setPlayingAudio(null);
        setAudioProgress((prev) => ({ ...prev, [audioUrl]: 0 }));
      };
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const headerLabel = chat?.username ?? "Select a chat";

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 min-w-0 relative">
      {/* Concentric circles watermark - fixed position behind everything */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
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

      {/* Header - always visible, but content only when chat is selected */}
      <div className="h-16 px-6 border-b border-neutral-800 flex items-center justify-between shrink-0 relative z-10">
        {chat ? (
          <>
            <div className="flex-1"></div>
            <button
              onClick={onTitleClick}
              className="text-base font-medium text-neutral-100 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-neutral-900"
            >
              {headerLabel}
            </button>
            <div className="flex-1 flex items-center justify-end gap-1">
              <button className="text-neutral-500 hover:text-neutral-200 transition-colors p-2 rounded-md hover:bg-neutral-900">
                <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
              <button className="text-neutral-500 hover:text-neutral-200 transition-colors p-2 rounded-md hover:bg-neutral-900">
                <Phone className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
            </div>
          </>
        ) : null}
      </div>

      {/* Message Area */}
      <div className="flex-1 relative overflow-hidden">
        {chat && (
          <ScrollArea className="h-full px-6 relative z-10" ref={scrollRef}>
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
                  <motion.div
                    key={msg.id}
                    initial={{
                      x: msg.isOutgoing ? 100 : -100,
                      opacity: 0
                    }}
                    animate={{
                      x: 0,
                      opacity: 1
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8
                    }}
                    className={`flex w-full ${msg.isOutgoing ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[45%] ${
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
                          className={`px-3.5 py-2 text-sm leading-relaxed rounded-2xl break-words ${
                            msg.isOutgoing
                              ? "border border-neutral-800 text-neutral-300"
                              : "bg-neutral-900 text-neutral-100"
                          }`}
                          style={{ wordWrap: "break-word", overflowWrap: "break-word", whiteSpace: "pre-wrap", maxWidth: "100%", wordBreak: "break-word" }}
                        >
                          {msg.type === "voice" ? (
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <button
                                onClick={() => toggleAudioPlay(msg.content)}
                                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors shrink-0"
                              >
                                {playingAudio === msg.content ? (
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                ) : (
                                  <Play className="w-4 h-4 ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 transition-all duration-100"
                                    style={{ width: `${audioProgress[msg.content] || 0}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <div className="text-[10px] text-neutral-500">Voice message</div>
                                  <div className="text-[10px] text-neutral-400">
                                    {formatDuration(audioDuration[msg.content] || 0)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : msg.type === "audio" ? (
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <button
                                onClick={() => toggleAudioPlay(msg.content)}
                                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors shrink-0"
                              >
                                {playingAudio === msg.content ? (
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                ) : (
                                  <Play className="w-4 h-4 ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-neutral-300 truncate">{msg.file_name || "Audio file"}</div>
                                <div className="h-1 bg-neutral-800 rounded-full overflow-hidden mt-1">
                                  <div
                                    className="h-full bg-blue-500 transition-all duration-100"
                                    style={{ width: `${audioProgress[msg.content] || 0}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <div className="text-[10px] text-neutral-500">Audio</div>
                                  <div className="text-[10px] text-neutral-400">
                                    {formatDuration(audioDuration[msg.content] || 0)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : msg.type === "image" ? (
                            <img
                              src={msg.content}
                              alt="Shared"
                              className="max-w-xs rounded cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => {
                                setSelectedImage(msg.content);
                                setImageModalOpen(true);
                              }}
                            />
                          ) : msg.type === "file" ? (
                            <a
                              href={msg.content}
                              download={msg.file_name || msg.content}
                              className="flex items-center gap-2 px-3 py-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
                            >
                              <FileText className="w-4 h-4 text-neutral-400" />
                              <span className="text-sm">{msg.file_name || msg.content}</span>
                              <Download className="w-4 h-4 text-neutral-400 ml-2" />
                            </a>
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
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
        )}
      </div>

      {/* Input Area - animated slide up from bottom */}
      <AnimatePresence>
        {chat && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8
            }}
            className="p-4 shrink-0 bg-neutral-950 relative z-10"
          >
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
      </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setImageModalOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
            onClick={() => setImageModalOpen(false)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
