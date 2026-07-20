import { useState } from 'react';
import { Camera, Settings, Heart, Music, Clock, Sparkles, AlertCircle, Edit3 } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { useAudio } from '../context/AudioContext';
import { getHistoryData } from '../services/recommendationEngine';
import ImageCropModal from '../components/ImageCropModal';

export default function ProfileView({ setActiveView }) {
  const { user, updateUserProfile, favorites } = useStorage();
  const { selectTrack, currentTrack, togglePlay } = useAudio();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  
  // Crop states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImgSrc, setSelectedImgSrc] = useState('');
  
  // Calculate stats from recommendation history at render time
  const history = getHistoryData();
  
  // 1. Calculate songs played (sum all plays)
  const playCounts = Object.values(history.plays);
  const songsPlayed = playCounts.reduce((a, b) => a + b, 0);

  // 2. Calculate listening minutes (approx. 4 mins per song play)
  const listeningMinutes = songsPlayed * 4;

  // 3. Find favorite genre
  const genres = history.genres;
  const sortedGenres = Object.keys(genres).sort((a, b) => genres[b] - genres[a]);
  let favGenre = 'Discovery';
  if (sortedGenres.length > 0) {
    const best = sortedGenres[0];
    favGenre = best.charAt(0).toUpperCase() + best.slice(1);
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Avatar image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImgSrc(reader.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset file input
  };

  const handleCropComplete = (croppedBase64) => {
    updateUserProfile(user?.name || 'Guest', croppedBase64);
    setCropModalOpen(false);
    setSelectedImgSrc('');
  };

  const handleNameSave = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateUserProfile(nameInput.trim(), user?.avatar || '');
      setIsEditingName(false);
    }
  };

  const handlePlayTrack = (track, trackList) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      selectTrack(track, trackList);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-32 animate-in fade-in duration-300">
      
      {/* 1. TOP HEADER COG */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">User Profile</h2>
        <button
          onClick={() => setActiveView('settings')}
          className="p-2 bg-neutral-900/60 hover:bg-neutral-800/80 rounded-full border border-neutral-800/60 text-neutral-400 hover:text-white cursor-pointer transition"
          title="Open Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* 2. AVATAR CARD & EDIT BANNER */}
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-neutral-900/50 via-neutral-900/20 to-neutral-950/40 p-6 rounded-2xl border border-neutral-800/40 glassmorphism relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-spotify-green/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        {/* Base64 File Uploader Avatar */}
        <div className="relative group w-28 h-28 rounded-full overflow-hidden border border-white/10 shadow-2xl flex-shrink-0">
          <img 
            src={user?.avatar || 'https://placehold.co/150x150/181818/ffffff?text=Guest'} 
            alt={user?.name || 'Guest'}
            className="w-full h-full object-cover transition group-hover:opacity-60"
          />
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition duration-300">
            <Camera size={24} className="text-white" />
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden"
            />
          </label>
        </div>

        {/* Username Renamer banner */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0 text-center sm:text-left z-10">
          {isEditingName ? (
            <form onSubmit={handleNameSave} className="flex items-center gap-2 max-w-sm mx-auto sm:mx-0">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-spotify-green transition font-semibold"
                maxLength={15}
                required
                autoFocus
              />
              <button 
                type="submit"
                className="px-4 py-1.5 bg-spotify-green text-black font-extrabold text-xs rounded-lg cursor-pointer transition hover:scale-105 active:scale-95"
              >
                Save
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-white font-outfit truncate max-w-[200px]">
                {user?.name || 'Guest User'}
              </h3>
              <button 
                onClick={() => {
                  setNameInput(user?.name || '');
                  setIsEditingName(true);
                }}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer transition"
                title="Edit name"
              >
                <Edit3 size={15} />
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5 text-xs text-neutral-400 font-semibold tracking-wider uppercase font-inter">
            <Sparkles size={11} className="text-spotify-green animate-pulse" />
            <span>Sukoon Premium Listener</span>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC METRICS DASHBOARD CARDS */}
      <div className="grid grid-cols-3 gap-4">
        {/* Songs Played Card */}
        <div className="bg-neutral-900/30 border border-neutral-800/40 p-4 rounded-xl flex flex-col justify-between glassmorphism relative overflow-hidden">
          <div className="text-neutral-500 mb-2">
            <Music size={18} className="text-spotify-green" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-white font-outfit">{songsPlayed}</span>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Songs Streamed</span>
          </div>
        </div>

        {/* Favorite Genre Card */}
        <div className="bg-neutral-900/30 border border-neutral-800/40 p-4 rounded-xl flex flex-col justify-between glassmorphism relative overflow-hidden">
          <div className="text-neutral-500 mb-2">
            <Sparkles size={18} className="text-amber-500 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-2xl font-extrabold text-white font-outfit truncate">{favGenre}</span>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Favorite Genre</span>
          </div>
        </div>

        {/* Listening Minutes Card */}
        <div className="bg-neutral-900/30 border border-neutral-800/40 p-4 rounded-xl flex flex-col justify-between glassmorphism relative overflow-hidden">
          <div className="text-neutral-500 mb-2">
            <Clock size={18} className="text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-white font-outfit">{listeningMinutes}m</span>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Listening Time</span>
          </div>
        </div>
      </div>

      {/* 4. LIKED SONGS VAULT SHORTCUT */}
      <div className="flex flex-col gap-4 border-t border-neutral-900/50 pt-6">
        <div className="flex items-center gap-2 px-1">
          <Heart size={20} className="text-red-500" fill="currentColor" />
          <h3 className="text-lg font-bold tracking-tight text-white font-outfit">Your Liked Vault</h3>
        </div>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-neutral-900/20 border border-dashed border-neutral-800/60 rounded-xl text-center glassmorphism">
            <AlertCircle size={24} className="text-neutral-500 mb-2" />
            <p className="text-xs text-neutral-400">Your Liked Vault is empty. Start liking songs on SearchView!</p>
          </div>
        ) : (
          <div className="flex flex-col bg-neutral-900/20 border border-neutral-900 rounded-xl overflow-hidden glassmorphism">
            {favorites.slice(0, 5).map((track) => (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track, favorites)}
                className={`flex items-center gap-4 px-4 py-2.5 border-b border-neutral-900/40 hover:bg-neutral-800/20 transition group cursor-pointer ${
                  currentTrack?.id === track.id ? 'bg-neutral-800/10 text-spotify-green' : 'text-neutral-300'
                }`}
              >
                <img 
                  src={track.image || '/mysukoon_logo.png'} 
                  alt={track.name} 
                  className="w-10 h-10 object-cover rounded bg-neutral-950 border border-white/5 flex-shrink-0"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`font-semibold text-xs truncate leading-normal ${currentTrack?.id === track.id ? 'text-spotify-green' : 'text-white'}`}>
                    {track.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 truncate mt-0.5">{track.artist_name}</span>
                </div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono mr-2">{track.source}</span>
              </div>
            ))}
            {favorites.length > 5 && (
              <button
                onClick={() => setActiveView('favorites')}
                className="w-full py-3 bg-neutral-950/20 text-center text-xs font-bold text-neutral-400 hover:text-white transition cursor-pointer"
              >
                Show All {favorites.length} Liked Songs
              </button>
            )}
          </div>
        )}
      </div>

      {/* Crop Modal Component */}
      <ImageCropModal 
        isOpen={cropModalOpen}
        imageSrc={selectedImgSrc}
        onClose={() => {
          setCropModalOpen(false);
          setSelectedImgSrc('');
        }}
        onCropComplete={handleCropComplete}
      />

    </div>
  );
}
