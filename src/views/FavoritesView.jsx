import React from 'react';
import { ArrowLeft, Play, Heart, Clock, Music } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { useAudio } from '../context/AudioContext';

export default function FavoritesView({ setActiveView }) {
  const { favorites, toggleFavorite } = useStorage();
  const { selectTrack, currentTrack, isPlaying, togglePlay } = useAudio();

  const handlePlayTrack = (track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      selectTrack(track, favorites);
    }
  };

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      selectTrack(favorites[0], favorites);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col gap-6 pb-32">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveView('library')}
          className="p-2 bg-neutral-900 rounded-full hover:bg-neutral-800 text-white cursor-pointer transition"
          title="Back to Library"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-inter">
          Library
        </span>
      </div>

      {/* Hero Cover Banner */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">
        <div className="w-48 h-48 bg-gradient-to-br from-indigo-700 via-pink-600 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl relative overflow-hidden flex-shrink-0">
          <Heart size={64} fill="#ffffff" className="text-white drop-shadow-lg" />
          <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2 py-0.5 bg-black/45 rounded uppercase tracking-wider">
            Favorite
          </span>
        </div>

        <div className="flex-1 flex flex-col gap-2 text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-outfit leading-none">
            Liked Songs
          </h2>
          <p className="text-sm text-neutral-400 font-medium leading-relaxed max-w-xl">
            Your personal collection of favorite tracks, synced locally for immediate offline references.
          </p>
          <div className="flex items-center justify-center md:justify-start gap-3 mt-2 text-xs font-semibold text-neutral-400 font-inter">
            <span>Synced in Local Storage</span>
            <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full"></span>
            <span className="text-white">{favorites.length} {favorites.length === 1 ? 'song' : 'songs'}</span>
          </div>
        </div>
      </div>

      {/* Play button */}
      {favorites.length > 0 && (
        <div className="flex items-center gap-4 py-2">
          <button
            onClick={handlePlayAll}
            className="px-6 py-3 bg-spotify-green hover:bg-spotify-green-hover text-black rounded-full font-extrabold text-sm flex items-center gap-2 transition transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-spotify-green/20 font-inter"
          >
            <Play size={18} fill="currentColor" />
            <span>Play All Liked</span>
          </button>
        </div>
      )}

      {/* Liked list table */}
      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-neutral-900/10 border border-neutral-900 border-dashed rounded-xl">
          <Heart className="text-neutral-600 mb-3" size={32} />
          <p className="font-semibold text-neutral-300 mb-1">Your vault of liked songs is empty</p>
          <p className="text-sm text-neutral-500 mb-4">Click the Heart icon on any song to save it here!</p>
          <button
            onClick={() => setActiveView('search')}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-full text-xs font-bold transition text-white hover:border-neutral-700 cursor-pointer"
          >
            Find Songs to Like
          </button>
        </div>
      ) : (
        <div className="flex flex-col bg-neutral-900/10 border border-neutral-900 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center gap-4 px-6 py-3 border-b border-neutral-900 text-xs font-bold text-neutral-400 uppercase tracking-wider">
            <span className="w-8 text-center">#</span>
            <span className="flex-1">Title</span>
            <span className="w-1/4 hidden md:block">Album</span>
            <span className="w-20 text-right"><Clock size={15} className="inline mr-1" /></span>
            <span className="w-12"></span>
          </div>

          {/* Rows */}
          <div className="flex flex-col">
            {favorites.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-4 px-6 py-3 border-b border-neutral-900/50 hover:bg-neutral-800/40 transition group cursor-pointer ${
                    isCurrent ? 'bg-neutral-900/40 text-spotify-green' : 'text-neutral-300'
                  }`}
                  onClick={() => handlePlayTrack(track)}
                >
                  {/* Index Column */}
                  <span className="w-8 text-center text-sm font-medium text-neutral-500 group-hover:hidden flex items-center justify-center">
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-3.5 w-3.5">
                        <div className="w-[2.5px] bg-spotify-green rounded-t eq-bar-1 h-1.5"></div>
                        <div className="w-[2.5px] bg-spotify-green rounded-t eq-bar-2 h-3"></div>
                        <div className="w-[2.5px] bg-spotify-green rounded-t eq-bar-3 h-2"></div>
                      </div>
                    ) : (
                      idx + 1
                    )}
                  </span>
                  
                  {/* Play icon on Hover */}
                  <button 
                    className="w-8 justify-center hidden group-hover:flex text-white hover:text-spotify-green transition cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayTrack(track);
                    }}
                  >
                    <Play size={16} fill="currentColor" className={isCurrent && isPlaying ? 'hidden' : ''} />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${isCurrent && isPlaying ? '' : 'hidden'}`}>
                      <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Title & Artist */}
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <img 
                      src={track.image || '/mysukoon_logo.png'} 
                      alt={track.name} 
                      className="w-10 h-10 object-cover rounded bg-neutral-950 flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className={`font-semibold text-sm truncate ${isCurrent ? 'text-spotify-green' : 'text-white'}`}>
                        {track.name}
                      </span>
                      <span className="text-xs text-neutral-400 truncate">{track.artist_name}</span>
                    </div>
                  </div>

                  {/* Album */}
                  <span className="w-1/4 hidden md:block text-sm text-neutral-400 truncate">
                    {track.album_name || 'Single'}
                  </span>

                  {/* Duration */}
                  <span className="w-20 text-right text-sm text-neutral-400">
                    {formatDuration(track.duration)}
                  </span>

                  {/* Liked heart action column */}
                  <div className="w-12 flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleFavorite(track)}
                      className="text-red-500 hover:text-neutral-500 transition cursor-pointer"
                      title="Unlike Song"
                    >
                      <Heart size={16} fill="#ef4444" className="text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
