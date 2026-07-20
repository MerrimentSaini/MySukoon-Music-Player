import React from 'react';
import { Home, Search, Library, User } from 'lucide-react';

export default function BottomNav({ activeView, setActiveView }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-neutral-950/85 backdrop-blur-xl border-t border-neutral-900/60 flex items-center justify-around z-40 px-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        
        // Match active states including nested/child views
        const isActive = activeView === item.id || 
          (item.id === 'library' && ['playlist-detail', 'favorites', 'queue'].includes(activeView)) ||
          (item.id === 'profile' && activeView === 'settings');

        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 cursor-pointer transition duration-300 relative ${
              isActive ? 'text-pink-400 scale-105' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {/* Tiny top glowing dot for active tab */}
            {isActive && (
              <span className="absolute top-0 w-4 h-0.5 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
            )}
            
            <div className="relative p-1">
              <Icon 
                size={20} 
                className={`transition duration-300 ${isActive ? 'scale-110 stroke-[2px]' : 'scale-100'}`} 
              />
              {isActive && (
                <span className="absolute inset-0 bg-pink-400/20 rounded-full blur-md -z-10 animate-pulse" />
              )}
            </div>
            <span className={`text-[9px] font-bold tracking-wider uppercase font-inter ${isActive ? 'text-pink-300' : 'text-neutral-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
