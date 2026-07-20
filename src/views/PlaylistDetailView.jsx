import { useState } from 'react';
import { ArrowLeft, Play, Heart, Trash2, Clock, Music, ChevronUp, ChevronDown, Edit2, Download, CheckCircle, X } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { useAudio } from '../context/AudioContext';

export default function PlaylistDetailView({ setActiveView, playlistId }) {
  const { 
    playlists, 
    removeTrackFromPlaylist, 
    toggleFavorite, 
    isFavorite, 
    renamePlaylist, 
    reorderSongsInPlaylist, 
    downloadedTracks, 
    downloadingTracks, 
    downloadTrack 
  } = useStorage();
  
  const { selectTrack, currentTrack, isPlaying, togglePlay } = useAudio();

  const playlist = playlists.find(p => p.id === playlistId);

  // Rename states
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="font-semibold text-neutral-400 mb-4">Playlist not found.</p>
        <button 
          onClick={() => setActiveView('library')}
          className="px-6 py-2 bg-spotify-green text-black rounded-full font-bold hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const handlePlayTrack = (track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      selectTrack(track, playlist.tracks);
    }
  };

  const handlePlayPlaylist = () => {
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

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-32">
      {/* Back button and playlist info */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveView('library')}
          className="p-2 bg-neutral-900 rounded-full hover:bg-neutral-800 text-white cursor-pointer transition"
          title="Back to Library"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-inter">
          Playlist
        </span>
      </div>

      {/* Playlist Hero Cover */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">
        <div className={`w-48 h-48 bg-gradient-to-br ${playlist.gradient || 'from-neutral-700 to-neutral-800'} rounded-2xl flex items-center justify-center text-white shadow-xl relative overflow-hidden flex-shrink-0`}>
          <Music size={56} className="opacity-45" />
          <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2 py-0.5 bg-black/55 rounded uppercase tracking-wider">
            Curated
          </span>
        </div>

        <div className="flex-1 flex flex-col gap-2 text-center md:text-left">
          {/* Header text with Edit shortcut */}
          <div className="flex items-center justify-center md:justify-start gap-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-outfit leading-none">
              {playlist.name}
            </h2>
            <button 
              onClick={() => {
                setNewName(playlist.name);
                setNewDesc(playlist.description || '');
                setIsRenameOpen(true);
              }}
              className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-850 hover:border-neutral-750 rounded-lg text-neutral-400 hover:text-white cursor-pointer transition mt-1 flex items-center justify-center"
              title="Edit Playlist Details"
            >
              <Edit2 size={15} />
            </button>
          </div>

          {playlist.description && (
            <p className="text-sm text-neutral-400 font-medium leading-relaxed max-w-xl">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center justify-center md:justify-start gap-3 mt-2 text-xs font-semibold text-neutral-400 font-inter">
            <span>Created {formatDate(playlist.createdAt)}</span>
            <span className="w-1.5 h-1.5 bg-neutral-850 rounded-full"></span>
            <span className="text-white">{playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}</span>
          </div>
        </div>
      </div>

      {/* Primary Actions panel */}
      {playlist.tracks.length > 0 && (
        <div className="flex items-center gap-4 py-2">
          <button
            onClick={handlePlayPlaylist}
            className="px-6 py-3 bg-spotify-green hover:bg-spotify-green-hover text-black rounded-full font-extrabold text-sm flex items-center gap-2 transition transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-spotify-green/20 font-inter"
          >
            <Play size={18} fill="currentColor" />
            <span>Play Playlist</span>
          </button>
        </div>
      )}

      {/* Track list Table */}
      {playlist.tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-neutral-900/10 border border-neutral-900 border-dashed rounded-xl">
          <Music className="text-neutral-600 mb-3" size={32} />
          <p className="font-semibold text-neutral-300 mb-1">This playlist is currently empty</p>
          <p className="text-sm text-neutral-500 mb-4">Start discovering amazing tracks in the search menu!</p>
          <button
            onClick={() => setActiveView('search')}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-full text-xs font-bold transition text-white hover:border-neutral-700 cursor-pointer"
          >
            Go Find Songs
          </button>
        </div>
      ) : (
        <div className="flex flex-col bg-neutral-900/10 border border-neutral-900 rounded-xl overflow-hidden select-none">
          {/* Header Row */}
          <div className="flex items-center gap-4 px-6 py-3 border-b border-neutral-900 text-xs font-bold text-neutral-400 uppercase tracking-wider">
            <span className="w-8 text-center">#</span>
            <span className="flex-1">Title</span>
            <span className="w-1/4 hidden md:block">Album</span>
            <span className="w-20 text-right"><Clock size={15} className="inline mr-1" /></span>
            <span className="w-28"></span>
          </div>

          {/* Rows */}
          <div className="flex flex-col">
            {playlist.tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isFav = isFavorite(track.id);
              const isDownloaded = downloadedTracks.some(t => t.id === track.id);
              const isDownloading = downloadingTracks[track.id] !== undefined;
              
              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-4 px-6 py-3 border-b border-neutral-900/50 hover:bg-neutral-800/40 transition group cursor-pointer ${
                    isCurrent ? 'bg-neutral-900/40 text-spotify-green' : 'text-neutral-300'
                  }`}
                  onClick={() => handlePlayTrack(track)}
                >
                  {/* # Column */}
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

                  {/* Action buttons */}
                  <div className="w-28 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Reorder Up */}
                    <button
                      onClick={() => reorderSongsInPlaylist(playlistId, idx, idx - 1)}
                      disabled={idx === 0}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-white rounded disabled:opacity-20 disabled:cursor-not-allowed hover:bg-neutral-800 cursor-pointer transition"
                      title="Move Up"
                    >
                      <ChevronUp size={14} />
                    </button>

                    {/* Reorder Down */}
                    <button
                      onClick={() => reorderSongsInPlaylist(playlistId, idx, idx + 1)}
                      disabled={idx === playlist.tracks.length - 1}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-white rounded disabled:opacity-20 disabled:cursor-not-allowed hover:bg-neutral-800 cursor-pointer transition"
                      title="Move Down"
                    >
                      <ChevronDown size={14} />
                    </button>

                    {/* Download button for Jamendo tracks */}
                    {!track.isYouTube && (
                      <button
                        onClick={() => downloadTrack(track)}
                        className="text-neutral-500 hover:text-spotify-green transition cursor-pointer"
                        title={
                          isDownloaded
                            ? "Downloaded Offline"
                            : isDownloading
                            ? `Downloading ${downloadingTracks[track.id]}%`
                            : "Download Offline"
                        }
                      >
                        {isDownloaded ? (
                          <CheckCircle size={14} className="text-spotify-green" fill="currentColor" />
                        ) : isDownloading ? (
                          <span className="text-[9px] font-mono text-spotify-green font-bold animate-pulse">{downloadingTracks[track.id]}%</span>
                        ) : (
                          <Download size={14} />
                        )}
                      </button>
                    )}

                    {/* Favorites heart toggler */}
                    <button
                      onClick={() => toggleFavorite(track)}
                      className="text-neutral-400 hover:text-red-500 transition cursor-pointer"
                      title={isFav ? "Remove from Liked Songs" : "Like Song"}
                    >
                      <Heart size={14} fill={isFav ? '#ef4444' : 'none'} className={isFav ? 'text-red-500' : ''} />
                    </button>

                    {/* Delete from playlist */}
                    <button
                      onClick={() => removeTrackFromPlaylist(playlistId, track.id)}
                      className="text-neutral-500 hover:text-red-500 transition p-1 hover:bg-neutral-800 rounded cursor-pointer"
                      title="Remove from Playlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- EDIT PLAYLIST DETAILS MODAL DIALOG --- */}
      {isRenameOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white font-outfit">Edit Playlist Details</h3>
              <button 
                onClick={() => setIsRenameOpen(false)}
                className="text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-neutral-800 cursor-pointer transition flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newName.trim()) return;
                renamePlaylist(playlist.id, newName.trim(), newDesc.trim());
                setIsRenameOpen(false);
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Playlist Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-800 text-white rounded-lg text-sm border border-neutral-700 focus:border-spotify-green focus:outline-none transition font-medium"
                  required
                  maxLength={32}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm border border-neutral-700 focus:border-spotify-green focus:outline-none transition h-20 resize-none"
                  maxLength={120}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-neutral-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameOpen(false)}
                  className="px-4 py-2 bg-transparent hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-full text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-spotify-green hover:bg-spotify-green-hover text-black rounded-full text-xs font-extrabold transition cursor-pointer transform active:scale-95 font-inter"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
