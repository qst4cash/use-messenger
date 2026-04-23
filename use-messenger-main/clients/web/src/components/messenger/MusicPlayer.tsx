import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import albumArt from "@/assets/images/album.png";

const PLAYLIST = [
  { id: 1, title: "Cosmic Drift", artist: "Synthwave Masters", duration: "4:15" },
  { id: 2, title: "Neon Horizon", artist: "Synthwave Masters", duration: "3:42" },
  { id: 3, title: "Digital Rain", artist: "Synthwave Masters", duration: "2:58" },
  { id: 4, title: "Midnight Drive", artist: "Synthwave Masters", duration: "5:10" },
  { id: 5, title: "Quantum State", artist: "Synthwave Masters", duration: "3:33" },
  { id: 6, title: "Holographic Memories", artist: "Synthwave Masters", duration: "4:05" },
  { id: 7, title: "Silicon Soul", artist: "Synthwave Masters", duration: "3:50" },
];

export function MusicPlayer() {
  const [playing, setPlaying] = useState(true);

  return (
    <div className="hidden lg:flex flex-col h-full bg-neutral-950 border-l border-neutral-800 w-80 shrink-0">
      {/* Player Section */}
      <div className="p-5 shrink-0 flex flex-col">
        <h3 className="text-xs font-medium text-neutral-500 tracking-wider uppercase mb-4">
          Current Player
        </h3>

        <div className="w-full aspect-square rounded-md overflow-hidden mb-4 bg-neutral-900 border border-neutral-800">
          <img src={albumArt} alt="Album Art" className="w-full h-full object-cover grayscale contrast-110" />
        </div>

        <div className="mb-5">
          <h4 className="text-base font-medium text-neutral-100 truncate" data-testid="text-track-title">
            Cosmic Drift
          </h4>
          <p className="text-xs text-neutral-500 truncate mt-0.5">Synthwave Masters</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            className="text-neutral-500 hover:text-neutral-200 transition-colors p-1.5"
            data-testid="button-shuffle"
          >
            <Shuffle className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
          <button
            className="text-neutral-300 hover:text-white transition-colors p-1.5"
            data-testid="button-prev"
          >
            <SkipBack className="w-[20px] h-[20px]" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            data-testid="button-play"
            className="w-11 h-11 rounded-full bg-neutral-200 text-neutral-950 hover:bg-white transition-colors flex items-center justify-center"
          >
            {playing ? (
              <Pause className="w-[18px] h-[18px] fill-current" strokeWidth={1.5} />
            ) : (
              <Play className="w-[18px] h-[18px] fill-current ml-0.5" strokeWidth={1.5} />
            )}
          </button>
          <button
            className="text-neutral-300 hover:text-white transition-colors p-1.5"
            data-testid="button-next"
          >
            <SkipForward className="w-[20px] h-[20px]" strokeWidth={1.5} />
          </button>
          <button
            className="text-neutral-500 hover:text-neutral-200 transition-colors p-1.5"
            data-testid="button-repeat"
          >
            <Repeat className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Playlist */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-neutral-800">
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-xs font-medium text-neutral-500 tracking-wider uppercase">Playlist</h3>
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="pb-4 space-y-1">
            {PLAYLIST.map((track, idx) => {
              const isActive = idx === 0;
              return (
                <button
                  key={track.id}
                  data-testid={`button-track-${track.id}`}
                  className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left ${
                    isActive ? "bg-neutral-900" : "hover:bg-neutral-900/60"
                  }`}
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                    <img src={albumArt} alt="" className="w-full h-full object-cover grayscale" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className={`text-sm truncate ${
                        isActive ? "text-neutral-100 font-medium" : "text-neutral-300"
                      }`}
                    >
                      {track.title}
                    </span>
                    <span className="text-[11px] text-neutral-500 truncate">{track.artist}</span>
                  </div>
                  <span className="text-[10px] text-neutral-600 tabular-nums shrink-0">{track.duration}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
