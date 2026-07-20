import React from 'react';
import { Home, Search, Library, ListMusic, Heart, PlusCircle } from 'lucide-react';
import { useStorage } from '../context/StorageContext';

export default function Sidebar({ activeView, setActiveView, setSelectedPlaylistId }) {
  const { playlists } = useStorage();

  const mainNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library },
    { id: 'queue', label: 'Queue', icon: ListMusic },
  ];

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-bg p-4 flex-shrink-0 border-r border-neutral-900 h-full overflow-y-auto">
        {/* Logo / Brand Title */}
        <div className="flex items-center gap-2.5 mb-8 px-2 cursor-pointer" onClick={() => setActiveView('home')}>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-spotify-green/30 shadow-[0_0_10px_rgba(29,185,84,0.15)] flex-shrink-0">
            <img src="/mysukoon_logo.png" alt="MySukoon Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-outfit">
            My<span className="text-spotify-green">Sukoon</span>
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1 mb-6">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? 'bg-[#15192b]/50 text-pink-400 border-pink-400/20 shadow-[0_0_15px_rgba(244,114,182,0.08)]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.03] border-transparent'
                }`}
              >
                <div className="relative">
                  <Icon size={20} className={isActive ? 'text-pink-400' : ''} />
                  {isActive && (
                    <span className="absolute inset-0 bg-pink-400/25 rounded-full blur-md -z-10 animate-pulse" />
                  )}
                </div>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <hr className="border-neutral-900 mb-6" />

        {/* Playlists and Favorites section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-2 mb-3 text-xs font-semibold text-muted-text uppercase tracking-wider">
            <span>Playlists</span>
            <button 
              onClick={() => setActiveView('library')} 
              className="text-muted-text hover:text-white transition cursor-pointer"
              title="Create Playlist"
            >
              <PlusCircle size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-1 overflow-y-auto pr-1 flex-1">
            {/* Favorites shortcut */}
            <button
              onClick={() => setActiveView('favorites')}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition text-left cursor-pointer ${
                activeView === 'favorites'
                  ? 'text-spotify-green font-medium'
                  : 'text-muted-text hover:text-white'
              }`}
            >
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-1.5 rounded text-white flex-shrink-0">
                <Heart size={14} fill={activeView === 'favorites' ? 'currentColor' : 'none'} />
              </div>
              <span className="truncate">Liked Songs</span>
            </button>

            {/* Custom playlists */}
            {playlists.length === 0 ? (
              <p className="text-xs text-neutral-600 px-3 mt-2 italic">No playlists yet. Create one in Library!</p>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => {
                    setSelectedPlaylistId(playlist.id);
                    setActiveView('playlist-detail');
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition text-left cursor-pointer ${
                    activeView === 'playlist-detail' && playlist.id === playlist.id // Wait, check later inside detailing
                      ? 'text-spotify-green font-medium bg-neutral-900/30'
                      : 'text-muted-text hover:text-white'
                  }`}
                >
                  <div className={`bg-gradient-to-br ${playlist.gradient || 'from-neutral-700 to-neutral-800'} w-6 h-6 rounded flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0 uppercase`}>
                    {playlist.name.slice(0, 2)}
                  </div>
                  <span className="truncate flex-1">{playlist.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
