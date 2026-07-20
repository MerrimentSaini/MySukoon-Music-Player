import React, { useState } from 'react';
import { Heart, Plus, Trash2, FolderHeart, Music, X, ChevronRight, Play, Download, AlertCircle } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { useAudio } from '../context/AudioContext';

export default function LibraryView({ setActiveView, setSelectedPlaylistId }) {
  const { playlists, favorites, createPlaylist, deletePlaylist, downloadedTracks, deleteDownload } = useStorage();
  const { selectTrack } = useAudio();
  
  // Tab State
  const [activeTab, setActiveTab] = useState('playlists'); // 'playlists' | 'downloads'

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pName.trim()) return;
    createPlaylist(pName.trim(), pDesc.trim());
    setPName('');
    setPDesc('');
    setIsOpen(false);
  };

  const handleOpenPlaylist = (id) => {
    setSelectedPlaylistId(id);
    setActiveView('playlist-detail');
  };

  const handlePlayPlaylist = (playlist, e) => {
    e.stopPropagation();
    if (playlist.tracks.length > 0) {
      selectTrack(playlist.tracks[0], playlist.tracks);
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
      {/* Header section with Create Button */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
        <div className="flex items-center gap-2">
          <FolderHeart className="text-spotify-green" size={24} />
          <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Your Music Library</h2>
        </div>
        
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-spotify-green hover:bg-spotify-green-hover text-black rounded-full text-sm font-extrabold flex items-center gap-1.5 transition transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-spotify-green/10 font-inter"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-neutral-900 pb-2">
        <button 
          onClick={() => setActiveTab('playlists')}
          className={`pb-2 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'playlists' ? 'border-spotify-green text-white font-extrabold' : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Playlists & Likes
        </button>
        <button 
          onClick={() => setActiveTab('downloads')}
          className={`pb-2 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'downloads' ? 'border-spotify-green text-white font-extrabold' : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Offline Downloads ({downloadedTracks.length})
        </button>
      </div>

      {/* Playlists & Likes Tab Content */}
      {activeTab === 'playlists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in duration-200">
          {/* LIKED SONGS SPECIAL BANNER */}
          <div 
            onClick={() => setActiveView('favorites')}
            className="col-span-1 sm:col-span-2 bg-gradient-to-br from-indigo-700 via-pink-600 to-rose-600 p-6 rounded-2xl flex flex-col justify-between cursor-pointer group shadow-xl relative overflow-hidden h-52 sm:h-auto min-h-[208px] transition duration-300 transform hover:scale-[1.01]"
          >
            {/* Decorative glowing light */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

            <div className="flex justify-end items-start">
              <Heart size={36} fill="#ffffff" className="text-white drop-shadow-md group-hover:scale-110 transition duration-300" />
            </div>
            
            <div className="flex flex-col gap-1 z-10">
              <h3 className="text-2xl font-extrabold tracking-tight font-outfit text-white leading-tight">
                Liked Songs
              </h3>
              <span className="text-sm font-semibold text-white/80 font-inter">
                {favorites.length} {favorites.length === 1 ? 'song' : 'songs'} in your vault
              </span>
            </div>

            {/* Special Play button overlay */}
            {favorites.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectTrack(favorites[0], favorites);
                }}
                className="absolute bottom-6 right-6 p-4 bg-white rounded-full text-black shadow-2xl scale-0 group-hover:scale-100 hover:scale-105 active:scale-95 transition duration-300 cursor-pointer"
              >
                <Play size={20} fill="currentColor" />
              </button>
            )}
          </div>

          {/* CUSTOM PLAYLISTS LISTING */}
          {playlists.map((playlist) => {
            const trackCount = playlist.tracks.length;
            return (
              <div
                key={playlist.id}
                onClick={() => handleOpenPlaylist(playlist.id)}
                className="group relative bg-neutral-900/40 hover:bg-neutral-800/80 p-4 rounded-xl flex flex-col gap-4 transition duration-300 border border-neutral-900 hover:border-neutral-800 cursor-pointer h-52 justify-between"
              >
                {/* Cover Gradient Graphic */}
                <div className={`w-full aspect-[21/9] bg-gradient-to-br ${playlist.gradient || 'from-neutral-700 to-neutral-800'} rounded-lg flex items-center justify-center text-white relative shadow-inner overflow-hidden flex-shrink-0`}>
                  <Music size={24} className="opacity-40 group-hover:scale-110 transition duration-300" />
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 bg-black/40 rounded uppercase tracking-wider">
                    List
                  </span>
                  
                  {/* Playlist Play button overlay */}
                  {trackCount > 0 && (
                    <button
                      onClick={(e) => handlePlayPlaylist(playlist, e)}
                      className="absolute bottom-2 right-2 p-2.5 bg-spotify-green hover:bg-spotify-green-hover text-black rounded-full shadow-lg scale-0 group-hover:scale-100 transition duration-300 transform hover:scale-105 cursor-pointer z-20"
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                  )}
                </div>

                {/* Meta details and Actions */}
                <div className="flex flex-col min-w-0 flex-1 justify-end">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-white truncate group-hover:text-spotify-green transition">
                        {playlist.name}
                      </span>
                      <span className="text-xs text-neutral-400 truncate mt-0.5">
                        {trackCount} {trackCount === 1 ? 'song' : 'songs'}
                      </span>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
                          deletePlaylist(playlist.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-500 transition p-1 rounded hover:bg-neutral-800 cursor-pointer"
                      title="Delete Playlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Offline Downloads Tab Content */}
      {activeTab === 'downloads' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {downloadedTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-neutral-900/10 rounded-2xl border border-neutral-900 border-dashed">
              <Download className="text-neutral-600 mb-3 animate-bounce" size={36} />
              <p className="font-semibold text-neutral-350 mb-1">Your offline library is empty</p>
              <p className="text-xs text-neutral-500 mb-5 max-w-sm">Search and download Jamendo tracks to enjoy premium music completely offline.</p>
              <button
                onClick={() => setActiveView('search')}
                className="px-6 py-2 bg-spotify-green text-black rounded-full font-bold hover:scale-105 active:scale-95 transition cursor-pointer font-inter text-sm"
              >
                Go Find Songs
              </button>
            </div>
          ) : (
            <div className="flex flex-col bg-neutral-900/10 border border-neutral-900 rounded-xl overflow-hidden">
              {/* Header Row */}
              <div className="flex items-center gap-4 px-6 py-3 border-b border-neutral-900 text-xs font-bold text-neutral-400 uppercase tracking-wider select-none">
                <span className="w-8 text-center">#</span>
                <span className="flex-1">Title</span>
                <span className="w-1/4 hidden md:block">Album</span>
                <span className="w-20 text-right">Duration</span>
                <span className="w-12"></span>
              </div>

              {/* Rows */}
              <div className="flex flex-col">
                {downloadedTracks.map((track, idx) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 px-6 py-3 border-b border-neutral-900/50 hover:bg-neutral-800/40 transition group cursor-pointer text-neutral-300"
                    onClick={() => selectTrack(track, downloadedTracks)}
                  >
                    {/* Index Column */}
                    <span className="w-8 text-center text-sm font-medium text-neutral-500 group-hover:hidden flex items-center justify-center">
                      {idx + 1}
                    </span>

                    {/* Play Icon on Hover */}
                    <button 
                      className="w-8 justify-center hidden group-hover:flex text-white hover:text-spotify-green transition cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectTrack(track, downloadedTracks);
                      }}
                    >
                      <Play size={16} fill="currentColor" />
                    </button>

                    {/* Title & Artist */}
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <img 
                        src={track.image || '/mysukoon_logo.png'} 
                        alt={track.name} 
                        className="w-10 h-10 object-cover rounded bg-neutral-950 flex-shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate text-white">
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

                    {/* Delete Download Button */}
                    <div className="w-12 flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          if (confirm(`Remove "${track.name}" from downloaded offline songs?`)) {
                            deleteDownload(track.id, track.name);
                          }
                        }}
                        className="text-neutral-500 hover:text-red-500 transition p-1 hover:bg-neutral-800 rounded cursor-pointer"
                        title="Delete Offline Copy"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- CREATE PLAYLIST MODAL DIALOG --- */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white font-outfit">Create New Playlist</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 cursor-pointer transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Playlist Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chill Study Beats"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-800 text-white rounded-lg text-sm border border-neutral-700 focus:border-spotify-green focus:outline-none transition"
                  required
                  maxLength={32}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  placeholder="Describe your playlist..."
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm border border-neutral-700 focus:border-spotify-green focus:outline-none transition h-20 resize-none"
                  maxLength={120}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-neutral-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-transparent hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-full text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-spotify-green hover:bg-spotify-green-hover text-black rounded-full text-sm font-extrabold transition cursor-pointer transform active:scale-95 font-inter"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
