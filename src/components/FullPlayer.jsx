import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, Play, SkipForward, SkipBack, Heart, Shuffle, Repeat, Repeat1, 
  Volume2, VolumeX, Gauge, Plus, ListMusic, Music, AlertCircle, Download, CheckCircle
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useStorage } from '../context/StorageContext';

export default function FullPlayer({ isOpen, onClose }) {
  const {
    currentTrack, isPlaying, duration, currentTime, volume, playbackSpeed,
    isShuffle, isRepeat, isMuted, isBuffering, togglePlay, seek, changeVolume, toggleMute,
    changeSpeed, playNext, playPrevious, setIsShuffle, setIsRepeat
  } = useAudio();

  const { isFavorite, toggleFavorite, playlists, addTrackToPlaylist, downloadedTracks, downloadingTracks, downloadTrack } = useStorage();
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  const plRef = useRef(null);
  const speedRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (plRef.current && !plRef.current.contains(event.target)) {
        setShowPlaylistMenu(false);
      }
      if (speedRef.current && !speedRef.current.contains(event.target)) {
        setShowSpeedMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const track = currentTrack || {
    id: '',
    name: 'No track playing',
    artist_name: 'Choose a song to start',
    album_name: '',
    image: '',
    duration: 0,
    isYouTube: false
  };

  const shouldShow = isOpen && currentTrack;

  const formatTime = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSeekChange = (e) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e) => {
    changeVolume(parseFloat(e.target.value));
  };

  const toggleRepeatState = () => {
    if (isRepeat === 'none') {
      setIsRepeat('all');
    } else if (isRepeat === 'all') {
      setIsRepeat('one');
    } else {
      setIsRepeat('none');
    }
  };

  const handleAddTrack = (playlistId) => {
    addTrackToPlaylist(playlistId, track);
    setShowPlaylistMenu(false);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isFav = isFavorite(track.id);
  const speedOptions = [0.5, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className={`fixed inset-0 z-50 bg-[#070707] flex flex-col justify-between overflow-y-auto transition-all duration-500 ease-in-out transform ${
      shouldShow ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
    }`}>
      {/* --- AMBIENT ARTWORK BACKDROP BLUR --- */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 pointer-events-none scale-110 transition duration-700" 
        style={{ backgroundImage: `url(${track.image || '/mysukoon_logo.png'})` }}
      ></div>

      {/* --- HEADER --- */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/10">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full text-white cursor-pointer transition active:scale-95"
        >
          <ChevronDown size={24} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-inter">Playing From Queue</span>
          <span className="text-xs font-semibold text-spotify-green truncate max-w-[200px] mt-0.5">{track.album_name || 'Single'}</span>
        </div>

        {/* Actions shortcut in player header */}
        <div className="flex items-center gap-1">
          {/* Download Button */}
          {track && !track.isYouTube && track.audio && (
            <button
              onClick={() => downloadTrack(track)}
              className="p-2 hover:bg-white/10 rounded-full text-white cursor-pointer transition"
              title={
                downloadedTracks.some(t => t.id === track.id)
                  ? "Downloaded Offline"
                  : downloadingTracks[track.id] !== undefined
                  ? `Downloading ${downloadingTracks[track.id]}%`
                  : "Download Offline"
              }
            >
              {downloadedTracks.some(t => t.id === track.id) ? (
                <CheckCircle size={20} className="text-spotify-green" fill="currentColor" />
              ) : downloadingTracks[track.id] !== undefined ? (
                <span className="text-[10px] font-mono text-spotify-green font-bold animate-pulse">{downloadingTracks[track.id]}%</span>
              ) : (
                <Download size={20} />
              )}
            </button>
          )}

          <div className="relative" ref={plRef}>
            <button 
              onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
              className="p-2 hover:bg-white/10 rounded-full text-white cursor-pointer transition"
              title="Add to Playlist"
            >
              <Plus size={20} />
            </button>
          
          {showPlaylistMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-100">
              <span className="block px-3 py-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800">Add to Playlist</span>
              {playlists.length === 0 ? (
                <span className="block px-3 py-2 text-xs text-neutral-500 italic">No playlists found</span>
              ) : (
                playlists.map(pl => (
                  <button
                    key={pl.id}
                    onClick={() => handleAddTrack(pl.id)}
                    className="block w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition truncate cursor-pointer"
                  >
                    {pl.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        </div>
      </header>

      {/* --- MIDDLE BODY CONTROLLER --- */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-8 max-w-lg mx-auto w-full gap-8">
        
        {/* Album Artwork Vinyl Record Circle */}
        <div className="w-full aspect-square max-w-[300px] bg-neutral-950 rounded-full overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-white/10 relative group select-none flex items-center justify-center">
          <img 
            src={track.image || '/mysukoon_logo.png'} 
            alt={track.name} 
            loading="lazy"
            style={isPlaying ? { animation: 'spin-slow 25s linear infinite' } : {}}
            className={`w-full h-full object-cover transition-all duration-500 rounded-full ${isPlaying ? 'scale-[0.98]' : 'scale-[0.93]'}`}
          />
          {/* Vinyl center cutout hole style */}
          <div className="absolute w-8 h-8 bg-neutral-900 border border-white/10 rounded-full shadow-inner flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
          </div>
        </div>

        {/* Track Title, Artist & Heart */}
        <div className="w-full flex items-center justify-between gap-4 mt-2">
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            {/* Scrollable title if very long */}
            <h2 className="text-2xl font-extrabold tracking-tight font-outfit text-white leading-tight truncate">
              {track.name}
            </h2>
            <p className="text-sm font-semibold text-neutral-400 truncate">
              {track.artist_name}
            </p>
          </div>
          
          <button
            onClick={() => toggleFavorite(track)}
            className="text-neutral-400 hover:text-red-500 transition duration-200 transform hover:scale-105 active:scale-95 p-1.5 cursor-pointer"
          >
            <Heart size={24} fill={isFav ? '#ef4444' : 'none'} className={isFav ? 'text-red-500' : ''} />
          </button>
        </div>

        {/* Real-time custom blue/pink bar visualizers */}
        <div className="h-7 flex items-end justify-center gap-[3.5px] mt-1 select-none">
          {[1.2, 0.8, 1.4, 0.9, 1.1, 1.3, 0.7, 1.5, 1.0, 1.2, 0.8, 1.4, 0.9, 1.1, 1.3].map((duration, i) => {
            return (
              <span 
                key={i}
                className="w-[3.5px] bg-gradient-to-t from-blue-400 to-pink-400 rounded-full"
                style={isPlaying ? { 
                  height: '26px',
                  animation: `aura-bounce ${duration}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.05}s`
                } : { height: '4px' }}
              />
            );
          })}
        </div>

        {/* Fluid Seekbar */}
        <div className="w-full flex flex-col gap-1.5">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full cursor-pointer accent-spotify-green"
          />
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control deck */}
        <div className="w-full flex items-center justify-between gap-4 py-2 px-2">
          {/* Shuffle Toggle */}
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-2 transition relative cursor-pointer ${
              isShuffle ? 'text-spotify-green' : 'text-neutral-400 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle size={18} />
            {isShuffle && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-spotify-green rounded-full"></span>}
          </button>

          {/* Skip Back */}
          <button
            onClick={playPrevious}
            className="p-2 text-neutral-300 hover:text-white transition transform active:scale-95 cursor-pointer"
            title="Previous"
          >
            <SkipBack size={24} fill="currentColor" />
          </button>

          {/* Large Center Play */}
          <button
            onClick={togglePlay}
            className={`p-5 bg-white hover:bg-neutral-100 rounded-full text-black transition transform scale-100 hover:scale-105 active:scale-95 shadow-xl shadow-white/5 cursor-pointer flex items-center justify-center w-14 h-14 relative ${isBuffering ? 'animate-pulse ring-4 ring-spotify-green/30' : ''}`}
            disabled={isBuffering}
          >
            {isBuffering ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Play size={22} fill="currentColor" className={isPlaying ? 'hidden' : 'translate-x-[1px]'} />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-[22px] h-[22px] ${isPlaying ? '' : 'hidden'}`}>
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>

          {/* Skip Next */}
          <button
            onClick={() => playNext()}
            className="p-2 text-neutral-300 hover:text-white transition transform active:scale-95 cursor-pointer"
            title="Next"
          >
            <SkipForward size={24} fill="currentColor" />
          </button>

          {/* Repeat State Cycle */}
          <button
            onClick={toggleRepeatState}
            className={`p-2 transition relative cursor-pointer ${
              isRepeat !== 'none' ? 'text-spotify-green' : 'text-neutral-400 hover:text-white'
            }`}
            title={`Repeat State: ${isRepeat}`}
          >
            {isRepeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            {isRepeat !== 'none' && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-spotify-green rounded-full"></span>}
          </button>
        </div>

        {/* Volume & Speed Slider Control Bar */}
        <div className="w-full flex items-center justify-between border-t border-white/5 pt-6 gap-6">
          {/* Playback speed gauge */}
          <div className="relative" ref={speedRef}>
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Gauge size={13} className="text-spotify-green" />
              <span>{playbackSpeed === 1.0 ? 'Normal' : `${playbackSpeed}x`}</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute left-0 bottom-9 w-24 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1 z-20 animate-in fade-in slide-in-from-bottom-1 duration-100">
                {speedOptions.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      changeSpeed(speed);
                      setShowSpeedMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-1.5 text-xs transition cursor-pointer ${
                      playbackSpeed === speed 
                        ? 'text-spotify-green font-bold bg-neutral-800/40' 
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    {speed === 1.0 ? 'Normal' : `${speed}x`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume Deck */}
          <div className="flex-1 flex items-center gap-3">
            <button 
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white cursor-pointer transition p-1"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} className="text-red-500" /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 cursor-pointer accent-white"
            />
          </div>
        </div>

      </main>

      {/* --- FOOTER BANNER --- */}
      <footer className="relative z-10 py-4 px-6 text-center text-[10px] text-neutral-500 font-mono border-t border-white/5 bg-black/10">
        <div className="flex items-center justify-center gap-1">
          <AlertCircle size={10} className="text-spotify-green" />
          <span>{track.isYouTube ? 'Secure audio-focused playback powered by YouTube IFrame API' : 'Full length audio streamed securely via Jamendo v3 API'}</span>
        </div>
      </footer>
    </div>
  );
}
