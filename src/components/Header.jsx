import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Key, User, LogOut, ChevronDown, Sparkles, Flame, Sun, Moon } from 'lucide-react';
import { getJamendoClientId } from '../services/jamendoApi';
import { useStorage } from '../context/StorageContext';

export default function Header({ 
  activeView, 
  setActiveView, 
  searchQuery, 
  setSearchQuery,
  onOpenAuthModal,
  onOpenLoginModal
}) {
  
  const CLIENT_ID = getJamendoClientId();
  const { user, logoutUser, theme, toggleTheme } = useStorage();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBack = () => {
    setActiveView('home');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-neutral-950/80 backdrop-blur-md px-6 flex items-center justify-between border-b border-neutral-900/50">
      {/* Back and Forward navigation + Title */}
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden sm:flex items-center gap-2">
          <button 
            onClick={handleBack} 
            disabled={activeView === 'home'} 
            className="p-1.5 rounded-full bg-black text-white hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Go Home"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            className="p-1.5 rounded-full bg-black text-white hover:bg-neutral-800 transition opacity-50 cursor-not-allowed"
            disabled
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Embedded search bar when in SearchView */}
        {activeView === 'search' ? (
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="What do you want to listen to?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-800 text-white rounded-full text-sm font-medium border border-transparent focus:border-neutral-700 focus:outline-none focus:bg-neutral-700 transition"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            {activeView === 'home' ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-pink-400 flex items-center justify-center shadow-[0_3px_12px_rgba(99,102,241,0.25)] flex-shrink-0">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-sm font-black bg-gradient-to-r from-blue-400 via-pink-400 to-rose-300 bg-clip-text text-transparent leading-none">MySukoon</h1>
                  <span className="text-[8px] text-pink-400 tracking-widest font-extrabold uppercase mt-0.5 leading-none">DREAM PLAY</span>
                </div>
              </div>
            ) : (
              <>
                {activeView !== 'playlist-detail' && (
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-spotify-green/30 shadow-[0_0_8px_rgba(29,185,84,0.2)] flex-shrink-0">
                    <img src="/mysukoon_logo.png" alt="MySukoon Logo" className="w-full h-full object-cover" />
                  </div>
                )}
                <h1 className="text-lg font-bold tracking-tight text-white capitalize font-outfit truncate">
                  {activeView === 'playlist-detail' ? 'Playlist Details' : activeView}
                </h1>
              </>
            )}
          </div>
        )}
      </div>

      {/* User / API Connection Info */}
      <div className="flex items-center gap-3">
        {activeView === 'home' && (
          <span className="hidden sm:flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-300 border border-pink-500/20 items-center gap-1.5 shadow-[0_0_12px_rgba(244,114,182,0.1)]">
            <Flame className="w-3 h-3 fill-current text-pink-400 animate-pulse" /> Aura Sync
          </span>
        )}

        {/* API Key Modal Display */}
        <button 
          onClick={onOpenAuthModal}
          className="flex items-center gap-2 bg-neutral-900/60 hover:bg-neutral-800/80 px-3 py-1.5 rounded-full border border-neutral-800 text-xs text-neutral-300 transition hover:scale-105 active:scale-95 cursor-pointer font-medium"
          title="API Keys Config"
        >
          <Key size={13} className="text-amber-500" />
          <span className="hidden md:inline font-mono">API Keys</span>
          <span className="inline md:hidden">API</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center p-2.5 bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 rounded-full text-neutral-400 hover:text-white transition hover:scale-105 active:scale-95 cursor-pointer shadow-sm relative"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={13} className="text-amber-400 animate-in spin-in-12 duration-300" />
          ) : (
            <Moon size={13} className="text-indigo-400 animate-in spin-in-12 duration-300" fill="currentColor" />
          )}
        </button>

        {/* Profile Section */}
        {user?.isLoggedIn ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800/90 pl-1.5 pr-3 py-1 rounded-full border border-neutral-855 text-sm font-semibold transition hover:scale-102 active:scale-98 cursor-pointer select-none"
            >
              <img 
                src={user.avatar || 'https://placehold.co/150x150/181818/ffffff?text=User'} 
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover border border-white/10"
              />
              <span className="max-w-[80px] sm:max-w-[120px] truncate text-white text-xs">{user.name}</span>
              <ChevronDown size={14} className={`text-neutral-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100 glassmorphism">
                <div className="px-3 py-2 border-b border-neutral-800/60 flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-white truncate">{user.name}</span>
                  <span className="text-[10px] text-spotify-green font-extrabold tracking-widest uppercase">Sukoon Premium</span>
                </div>
                <button
                  onClick={() => {
                    logoutUser();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <LogOut size={13} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-2 bg-spotify-green hover:bg-spotify-green-hover text-black px-4 py-1.5 rounded-full text-xs font-extrabold transition transform hover:scale-105 active:scale-95 cursor-pointer font-inter shadow-md"
          >
            <User size={13} fill="currentColor" />
            <span>Log In</span>
          </button>
        )}
      </div>
    </header>
  );
}
