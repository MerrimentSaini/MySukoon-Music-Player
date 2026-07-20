import React, { useState } from 'react';
import { 
  Play, SkipForward, SkipBack, Heart, Maximize2, Shuffle, Repeat, Repeat1, 
  Volume2, VolumeX, ListMusic 
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useStorage } from '../context/StorageContext';

export default function MiniPlayer({ setIsPlayerExpanded, setActiveView }) {
  const { 
    currentTrack, isPlaying, togglePlay, playNext, playPrevious,
    currentTime, duration, isBuffering, isShuffle, setIsShuffle,
    isRepeat, setIsRepeat, volume, changeVolume, isMuted, toggleMute 
  } = useAudio();
  const { isFavorite, toggleFavorite } = useStorage();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isFav = isFavorite(currentTrack.id);

  const toggleRepeatState = () => {
    if (isRepeat === 'none') {
      setIsRepeat('all');
    } else if (isRepeat === 'all') {
      setIsRepeat('one');
    } else {
      setIsRepeat('none');
    }
  };

  const handleSeek = (e) => {
    // Optional click-to-seek logic on progress bar
  };

  return (
    <div 
      onClick={() => setIsPlayerExpanded(true)}
      className="fixed bottom-16 md:bottom-0 left-0 right-0 h-18 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800/80 flex items-center justify-between px-4 z-40 cursor-pointer select-none group glassmorphism"
    >
      {/* Subtle Progress Bar top line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-neutral-800/50">
        <div 
          className="h-full bg-spotify-green transition-all duration-100 ease-out shadow-[0_0_10px_#1db954]" 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* LEFT BLOCK: Track info */}
      <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-initial">
        <div className={`relative w-11 h-11 flex-shrink-0 overflow-hidden rounded bg-neutral-950 border ${!currentTrack.image ? 'border-spotify-green/25 shadow-[0_0_10px_rgba(29,185,84,0.2)]' : 'border-white/5'}`}>
          <img 
            src={currentTrack.image || '/mysukoon_logo.png'} 
            alt={currentTrack.name} 
            style={isPlaying ? { animation: 'spin-slow 15s linear infinite' } : {}}
            className={`w-full h-full object-cover ${isPlaying ? 'rounded-full scale-95' : ''}`}
          />
        </div>
        <div className="flex flex-col min-w-0 pr-2">
          <span className="font-bold text-sm text-white truncate group-hover:text-spotify-green transition leading-snug">
            {currentTrack.name}
          </span>
          <span className="text-xs text-neutral-400 truncate flex items-center gap-1.5 mt-0.5">
            <span>{currentTrack.artist_name}</span>
            {currentTrack.isYouTube && (
              <span className="px-1 py-0.2 bg-red-500/10 border border-red-500/25 text-red-500 text-[8px] font-extrabold rounded uppercase tracking-wider scale-90">YT</span>
            )}
          </span>
        </div>
        
        {/* Toggle Favorites Shortcut */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(currentTrack);
          }}
          className="text-neutral-400 hover:text-red-500 transition p-1.5 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Heart size={16} fill={isFav ? '#ef4444' : 'none'} className={isFav ? 'text-red-500' : ''} />
        </button>
      </div>

      {/* CENTER BLOCK: Playback Controls (Desktop only) */}
      <div className="hidden md:flex items-center gap-5" onClick={(e) => e.stopPropagation()}>
        {/* Shuffle */}
        <button
          onClick={() => setIsShuffle(!isShuffle)}
          className={`p-1.5 transition relative cursor-pointer hover:scale-105 active:scale-95 ${
            isShuffle ? 'text-spotify-green' : 'text-neutral-400 hover:text-white'
          }`}
          title="Shuffle"
        >
          <Shuffle size={16} />
          {isShuffle && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-spotify-green rounded-full"></span>}
        </button>

        {/* Previous */}
        <button
          onClick={playPrevious}
          className="p-1.5 text-neutral-400 hover:text-white transition hover:scale-105 active:scale-95 cursor-pointer"
          title="Previous"
        >
          <SkipBack size={18} fill="currentColor" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="p-2.5 bg-white hover:bg-neutral-100 text-black rounded-full transition transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center w-9 h-9 shadow-lg relative"
          disabled={isBuffering}
        >
          {isBuffering ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Play size={16} fill="currentColor" className={isPlaying ? 'hidden' : 'translate-x-[0.5px]'} />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-[16px] h-[16px] ${isPlaying ? '' : 'hidden'}`}>
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>

        {/* Next */}
        <button
          onClick={() => playNext()}
          className="p-1.5 text-neutral-400 hover:text-white transition hover:scale-105 active:scale-95 cursor-pointer"
          title="Next"
        >
          <SkipForward size={18} fill="currentColor" />
        </button>

        {/* Repeat */}
        <button
          onClick={toggleRepeatState}
          className={`p-1.5 transition relative cursor-pointer hover:scale-105 active:scale-95 ${
            isRepeat !== 'none' ? 'text-spotify-green' : 'text-neutral-400 hover:text-white'
          }`}
          title={`Repeat: ${isRepeat}`}
        >
          {isRepeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          {isRepeat !== 'none' && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-spotify-green rounded-full"></span>}
        </button>
      </div>

      {/* RIGHT BLOCK: Volume, Queue, Maximize (Always on right) */}
      <div className="flex items-center gap-2 md:gap-3.5" onClick={(e) => e.stopPropagation()}>
        {/* Play/Pause on Mobile (instead of desktop center) */}
        <button
          onClick={togglePlay}
          className="p-2 md:hidden bg-white hover:bg-neutral-100 text-black rounded-full transition cursor-pointer flex items-center justify-center w-8 h-8 mr-1"
          disabled={isBuffering}
        >
          {isBuffering ? (
            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Play size={14} fill="currentColor" className={isPlaying ? 'hidden' : 'translate-x-[0.5px]'} />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-3.5 h-3.5 ${isPlaying ? '' : 'hidden'}`}>
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>

        {/* View Queue Shortcut */}
        {setActiveView && (
          <button
            onClick={() => setActiveView('queue')}
            className="p-1.5 text-neutral-400 hover:text-white transition hover:scale-105 active:scale-95 cursor-pointer"
            title="Open Play Queue"
          >
            <ListMusic size={17} />
          </button>
        )}

        {/* Volume Control */}
        <div className="relative flex items-center">
          <button
            onClick={toggleMute}
            onMouseEnter={() => setShowVolumeSlider(true)}
            className="p-1.5 text-neutral-400 hover:text-white transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isMuted || volume === 0 ? <VolumeX size={17} className="text-red-500" /> : <Volume2 size={17} />}
          </button>

          {/* Inline desktop volume slider */}
          <div 
            className="hidden md:flex items-center w-20 transition-all duration-300 ml-1"
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-white"
            />
          </div>
        </div>

        {/* Maximize to full screen modal */}
        <button
          onClick={() => setIsPlayerExpanded(true)}
          className="p-1.5 text-neutral-400 hover:text-white transition hover:scale-105 active:scale-95 cursor-pointer ml-1"
          title="Expand Player"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
}
