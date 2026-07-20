import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Context Providers
import { AudioProvider } from './context/AudioContext';
import { StorageProvider, useStorage } from './context/StorageContext';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MiniPlayer from './components/MiniPlayer';
import FullPlayer from './components/FullPlayer';

// Views
import HomeView from './views/HomeView';
import SearchView from './views/SearchView';
import LibraryView from './views/LibraryView';
import PlaylistDetailView from './views/PlaylistDetailView';
import FavoritesView from './views/FavoritesView';
import QueueView from './views/QueueView';
import ProfileView from './views/ProfileView';
import SettingsView from './views/SettingsView';

// Bottom Navigation
import BottomNav from './components/BottomNav';
import ImageCropModal from './components/ImageCropModal';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function MainAppShell() {
  const { loginUser, toast, hideToast } = useStorage();
  const [activeView, setActiveView] = useState('home'); // 'home' | 'search' | 'library' | 'playlist-detail' | 'favorites' | 'queue' | 'profile' | 'settings'
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Custom Login Upload & Crop states
  const [customUploadedAvatar, setCustomUploadedAvatar] = useState('');
  const [loginCropModalOpen, setLoginCropModalOpen] = useState(false);
  const [loginSelectedImgSrc, setLoginSelectedImgSrc] = useState('');

  const handleModalImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Avatar image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLoginSelectedImgSrc(reader.result);
      setLoginCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset file input
  };

  const handleModalCropComplete = (croppedBase64) => {
    setCustomUploadedAvatar(croppedBase64);
    setSelectedAvatarUrl(croppedBase64);
    setLoginCropModalOpen(false);
    setLoginSelectedImgSrc('');
  };

  // Auto-dismiss splash screen after 2.2 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Authentication error state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginNameInput, setLoginNameInput] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
  const [authErrorDetail, setAuthErrorDetail] = useState('');
  const [customClientIdInput, setCustomClientIdInput] = useState(() => localStorage.getItem('mysukoon_client_id') || '');
  const [customYoutubeKeyInput, setCustomYoutubeKeyInput] = useState(() => localStorage.getItem('mysukoon_youtube_api_key') || '');

  // Listen to Jamendo credential errors and prepopulate keys
  React.useEffect(() => {
    const handleAuthFailed = (e) => {
      setAuthErrorDetail(e.detail || 'The current client ID is unauthorized, suspended, or rate-limited.');
      setIsAuthModalOpen(true);
    };

    window.addEventListener('jamendo_auth_failed', handleAuthFailed);
    return () => {
      window.removeEventListener('jamendo_auth_failed', handleAuthFailed);
    };
  }, []);

  // Simple client-side router
  const renderActiveView = () => {
    switch (activeView) {
      case 'home':
        return (
          <HomeView 
            setActiveView={setActiveView} 
            setSearchQuery={setSearchQuery} 
          />
        );
      case 'search':
        return (
          <SearchView 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
          />
        );
      case 'library':
        return (
          <LibraryView 
            setActiveView={setActiveView} 
            setSelectedPlaylistId={setSelectedPlaylistId} 
          />
        );
      case 'playlist-detail':
        return (
          <PlaylistDetailView 
            activeView={activeView}
            setActiveView={setActiveView} 
            playlistId={selectedPlaylistId} 
          />
        );
      case 'favorites':
        return (
          <FavoritesView 
            setActiveView={setActiveView} 
          />
        );
      case 'queue':
        return (
          <QueueView 
            setActiveView={setActiveView} 
          />
        );
      case 'profile':
        return (
          <ProfileView 
            setActiveView={setActiveView} 
          />
        );
      case 'settings':
        return (
          <SettingsView 
            setActiveView={setActiveView} 
          />
        );
      default:
        return <HomeView setActiveView={setActiveView} setSearchQuery={setSearchQuery} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0b0b] text-white">
      {/* Sidebar Navigation (Desktop Drawer) */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        setSelectedPlaylistId={setSelectedPlaylistId}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Sticky Top Header bar */}
        <Header 
          activeView={activeView} 
          setActiveView={setActiveView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAuthModal={() => {
            // Pre-fill input with latest keys
            setCustomClientIdInput(localStorage.getItem('mysukoon_client_id') || '');
            setCustomYoutubeKeyInput(localStorage.getItem('mysukoon_youtube_api_key') || '');
            setAuthErrorDetail('');
            setIsAuthModalOpen(true);
          }}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        {/* Offline alert banner */}
        {isOffline && (
          <div className="bg-amber-600/10 border-b border-amber-500/20 text-amber-500 py-1.5 px-4 text-[10px] font-extrabold tracking-widest uppercase flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
            <span>Offline Mode &bull; Playing Downloaded Library only</span>
          </div>
        )}

        {/* Scrollable Viewport Container */}
        <main className="flex-1 overflow-y-auto px-6 py-6 scrollbar-none">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Persistent Mini Player at bottom */}
      <MiniPlayer setIsPlayerExpanded={setIsPlayerExpanded} setActiveView={setActiveView} />

      {/* Spotify-style Mobile Bottom Navigation */}
      <BottomNav activeView={activeView} setActiveView={setActiveView} />

      {/* Apple-style Fluid Full Screen Player Modal */}
      <FullPlayer 
        isOpen={isPlayerExpanded} 
        onClose={() => setIsPlayerExpanded(false)} 
      />

      {/* --- PREMIUM MOBILE SPLASH SCREEN --- */}
      {showSplash && (
        <div className="fixed inset-0 bg-[#070707] z-[9999] flex flex-col items-center justify-center animate-fade-out pointer-events-none select-none">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border border-spotify-green/25 shadow-[0_0_50px_rgba(29,185,84,0.2)] animate-pulse-slow">
              <img 
                src="/mysukoon_logo.png" 
                alt="MySukoon Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex flex-col items-center gap-1.5 mt-2">
              <span className="text-3xl font-extrabold tracking-tight text-white font-outfit">
                My<span className="text-spotify-green">Sukoon</span>
              </span>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Your Serene Sanctuary</span>
            </div>
            
            {/* Custom glowing dynamic loader bar */}
            <div className="w-20 h-1 bg-neutral-900 rounded-full overflow-hidden mt-3 relative">
              <div className="absolute top-0 bottom-0 left-0 w-8 bg-spotify-green rounded-full animate-slide-infinite" />
            </div>
          </div>
        </div>
      )}

      {/* --- CREDENTIALS CONFIGURATION MODAL --- */}
      {isAuthModalOpen && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAuthModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                  </svg>
                </span>
                <h3 className="text-lg font-bold text-white font-outfit">MySukoon API Keys</h3>
              </div>
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-neutral-800 cursor-pointer transition text-xs font-bold leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {authErrorDetail ? (
                <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg text-xs leading-relaxed">
                  <p className="font-bold mb-1">API Authentication Failure Details:</p>
                  <p>{authErrorDetail}</p>
                </div>
              ) : (
                <p className="text-xs text-neutral-400 leading-relaxed">
                  MySukoon streams music using Jamendo (free music streams) and YouTube (secondary source for Indian songs). Configure your API credentials below.
                </p>
              )}

              {/* Jamendo Client ID Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Jamendo Client ID</label>
                <input
                  type="text"
                  placeholder="Paste your 8-digit client ID here..."
                  value={customClientIdInput}
                  onChange={(e) => setCustomClientIdInput(e.target.value.trim())}
                  className="w-full px-4 py-2.5 bg-neutral-800 text-white rounded-lg text-sm border border-neutral-700 focus:border-spotify-green focus:outline-none transition font-mono"
                  required
                />
              </div>

              {/* YouTube API Key Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                  <span>YouTube Data API v3 Key</span>
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-extrabold tracking-widest uppercase">YouTube Search</span>
                </label>
                <input
                  type="password"
                  placeholder="Paste your YouTube API Key here..."
                  value={customYoutubeKeyInput}
                  onChange={(e) => setCustomYoutubeKeyInput(e.target.value.trim())}
                  className="w-full px-4 py-2.5 bg-neutral-800 text-white rounded-lg text-sm border border-neutral-700 focus:border-spotify-green focus:outline-none transition font-mono"
                />
              </div>

              <div className="text-neutral-500 text-[10px] leading-relaxed bg-neutral-950/30 p-3 rounded-lg border border-neutral-800/40 gap-2 flex flex-col">
                <div>
                  <p className="font-bold text-neutral-400 mb-0.5">Jamendo Key (Free Developer Account):</p>
                  <p>Register at <a href="https://developer.jamendo.com/" target="_blank" rel="noreferrer" className="text-spotify-green hover:underline">developer.jamendo.com</a> to copy your 8-digit client ID.</p>
                </div>
                <div>
                  <p className="font-bold text-neutral-400 mb-0.5">YouTube Key (Google Cloud Console):</p>
                  <p>Go to Google Cloud, enable the "YouTube Data API v3", and generate a credentials API Key.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-neutral-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="px-4 py-2 bg-transparent hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-full text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (customClientIdInput.trim()) {
                      localStorage.setItem('mysukoon_client_id', customClientIdInput.trim());
                    } else {
                      localStorage.removeItem('mysukoon_client_id');
                    }

                    if (customYoutubeKeyInput.trim()) {
                      localStorage.setItem('mysukoon_youtube_api_key', customYoutubeKeyInput.trim());
                    } else {
                      localStorage.removeItem('mysukoon_youtube_api_key');
                    }

                    setIsAuthModalOpen(false);
                    // Reload to immediately refresh and connect with the new key!
                    window.location.reload();
                  }}
                  className="px-5 py-2 bg-spotify-green hover:bg-spotify-green-hover text-black rounded-full text-sm font-extrabold transition cursor-pointer transform active:scale-95 font-inter"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- USER LOGIN MODAL --- */}
      {isLoginModalOpen && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsLoginModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 select-none glassmorphism"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-spotify-green/10 border border-spotify-green/20 text-spotify-green rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A9.75 9.75 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                  </svg>
                </span>
                <h3 className="text-lg font-bold text-white font-outfit">Sukoon Login</h3>
              </div>
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-neutral-800 cursor-pointer transition text-xs font-bold leading-none"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (loginNameInput.trim()) {
                  loginUser(loginNameInput.trim(), selectedAvatarUrl);
                  setIsLoginModalOpen(false);
                  setLoginNameInput('');
                }
              }}
              className="flex flex-col gap-4"
            >
              <p className="text-xs text-neutral-400 leading-relaxed">
                Connect your custom Sukoon profile to customize playlists, track history, and sync your favorite items.
              </p>

              {/* Username Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  placeholder="Enter your name..."
                  value={loginNameInput}
                  onChange={(e) => setLoginNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-800 text-white rounded-lg text-sm border border-neutral-700 focus:border-spotify-green focus:outline-none transition font-sans font-medium"
                  maxLength={15}
                  required
                />
              </div>

              {/* Avatar Presets Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Choose Avatar Preset</label>
                <div className="grid grid-cols-5 gap-2 mt-1 justify-center items-center">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80'
                  ].map((url, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedAvatarUrl(url)}
                      className={`relative aspect-square rounded-full overflow-hidden cursor-pointer transition border-2 flex items-center justify-center p-0.5 ${
                        selectedAvatarUrl === url ? 'border-spotify-green scale-105 shadow-[0_0_10px_rgba(29,185,84,0.3)]' : 'border-transparent hover:border-neutral-700'
                      }`}
                    >
                      <img 
                        src={url} 
                        alt={`Preset ${idx + 1}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  ))}

                  {/* Custom Uploaded Avatar or File Upload Input Trigger */}
                  {customUploadedAvatar ? (
                    <div 
                      onClick={() => setSelectedAvatarUrl(customUploadedAvatar)}
                      className={`relative aspect-square rounded-full overflow-hidden cursor-pointer transition border-2 flex items-center justify-center p-0.5 ${
                        selectedAvatarUrl === customUploadedAvatar ? 'border-spotify-green scale-105 shadow-[0_0_10px_rgba(29,185,84,0.3)]' : 'border-transparent hover:border-neutral-700'
                      }`}
                    >
                      <img 
                        src={customUploadedAvatar} 
                        alt="Uploaded Custom avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                      <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-white">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleModalImageUpload} 
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="relative aspect-square rounded-full overflow-hidden cursor-pointer transition border-2 border-dashed border-neutral-700 hover:border-spotify-green flex flex-col items-center justify-center p-0.5 text-neutral-400 hover:text-white bg-neutral-950/40">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-neutral-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span className="text-[7px] font-extrabold mt-0.5 tracking-wider uppercase">Upload</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleModalImageUpload} 
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 border-t border-neutral-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-4 py-2 bg-transparent hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-full text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-spotify-green hover:bg-spotify-green-hover text-black rounded-full text-xs font-extrabold transition cursor-pointer transform active:scale-95 font-inter"
                >
                  Log In & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Crop Modal */}
      <ImageCropModal
        isOpen={loginCropModalOpen}
        imageSrc={loginSelectedImgSrc}
        onClose={() => {
          setLoginCropModalOpen(false);
          setLoginSelectedImgSrc('');
        }}
        onCropComplete={handleModalCropComplete}
      />

      {/* Floating Toast Message overlay */}
      {toast && (
        <div 
          onClick={hideToast}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 border rounded-full shadow-2xl z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-200 text-xs font-bold flex items-center gap-2 cursor-pointer select-none bg-neutral-900/95 border-neutral-800 text-white hover:border-neutral-700"
        >
          <span className={`w-2 h-2 rounded-full ${toast.type === 'warning' ? 'bg-amber-500' : 'bg-spotify-green'} animate-pulse`}></span>
          <span>{toast.message}</span>
        </div>
      )}



    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StorageProvider>
        <AudioProvider>
          <MainAppShell />
        </AudioProvider>
      </StorageProvider>
    </QueryClientProvider>
  );
}
