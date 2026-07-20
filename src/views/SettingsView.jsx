import React, { useState } from 'react';
import { ArrowLeft, Trash2, ShieldAlert, Sparkles, Moon, Smartphone, Edit2, Info, User } from 'lucide-react';
import { useStorage } from '../context/StorageContext';

export default function SettingsView({ setActiveView }) {
  const { user, amoledMode, toggleAmoledMode, clearListeningHistory, updateUserProfile, theme, toggleTheme } = useStorage();
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleNameSave = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateUserProfile(nameInput.trim(), user?.avatar || '');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Are you absolutely sure you want to wipe all listening history, recently played, search history, and AI metrics? This cannot be undone.')) {
      clearListeningHistory();
      alert('Your listening history and AI metrics have been cleared successfully.');
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-32 animate-in fade-in duration-300">
      
      {/* Top Header & Back Button */}
      <div className="flex items-center gap-4 px-1">
        <button
          onClick={() => setActiveView('profile')}
          className="p-2 bg-neutral-900/60 hover:bg-neutral-800/80 rounded-full border border-neutral-800/60 text-neutral-400 hover:text-white cursor-pointer transition"
          title="Back to Profile"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Settings</h2>
          <span className="text-xs text-neutral-400">Manage your profile, preferences, and data</span>
        </div>
      </div>

      {/* Profile settings card */}
      <div className="bg-neutral-900/30 border border-neutral-800/40 p-6 rounded-2xl flex flex-col gap-5 glassmorphism">
        <div className="flex items-center gap-2 border-b border-neutral-800/60 pb-3">
          <User size={18} className="text-spotify-green" />
          <h3 className="text-md font-bold tracking-wide text-white uppercase font-inter">Profile Customization</h3>
        </div>

        <form onSubmit={handleNameSave} className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-neutral-400">Display Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="px-4 py-2 flex-1 bg-neutral-950/60 border border-neutral-800/80 rounded-xl text-sm text-white focus:outline-none focus:border-spotify-green transition font-medium"
              placeholder="e.g. Arijit Fan"
              maxLength={15}
              required
            />
            <button
              type="submit"
              className="px-5 py-2 bg-spotify-green text-black font-extrabold text-sm rounded-xl cursor-pointer hover:scale-102 active:scale-98 transition flex items-center gap-1.5"
            >
              <Edit2 size={14} />
              <span>Save</span>
            </button>
          </div>
          {isSaved && (
            <span className="text-xs font-semibold text-spotify-green animate-pulse">
              Profile name updated successfully!
            </span>
          )}
        </form>
      </div>

      {/* Theme preferences card */}
      <div className="bg-neutral-900/30 border border-neutral-800/40 p-6 rounded-2xl flex flex-col gap-5 glassmorphism">
        <div className="flex items-center gap-2 border-b border-neutral-800/60 pb-3">
          <Sparkles size={18} className="text-amber-500 animate-pulse" />
          <h3 className="text-md font-bold tracking-wide text-white uppercase font-inter">Preferences</h3>
        </div>

        {/* Light Theme Toggle */}
        <div className="flex items-center justify-between py-2 border-b border-neutral-800/10 pb-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-white font-outfit">Light Mode Colors</span>
            <span className="text-xs text-neutral-400 max-w-[240px]">
              Switch from standard premium dark style to a highly legible light theme.
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={theme === 'light'}
              onChange={toggleTheme}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green peer-checked:after:bg-black peer-checked:after:border-black"></div>
          </label>
        </div>

        {/* AMOLED Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-white font-outfit">AMOLED Black Theme</span>
            <span className="text-xs text-neutral-400 max-w-[240px]">
              Turn off all backgrounds and use absolute pitch black (#000000) for OLED battery savings.
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={amoledMode}
              onChange={toggleAmoledMode}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green peer-checked:after:bg-black peer-checked:after:border-black"></div>
          </label>
        </div>
      </div>

      {/* Data & Privacy card */}
      <div className="bg-neutral-900/30 border border-neutral-800/40 p-6 rounded-2xl flex flex-col gap-5 glassmorphism">
        <div className="flex items-center gap-2 border-b border-neutral-800/60 pb-3">
          <ShieldAlert size={18} className="text-red-500" />
          <h3 className="text-md font-bold tracking-wide text-white uppercase font-inter">Data & Privacy</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-white font-outfit">Wipe Listening History</span>
            <span className="text-xs text-neutral-400 max-w-sm">
              Clears your recently played tracks, listening time, auto tags, and resets the smart AI recommendation weights back to defaults.
            </span>
          </div>

          <button
            onClick={handleResetData}
            className="px-4 py-2 bg-red-650/10 hover:bg-red-650/20 text-red-550 border border-red-550/30 font-bold text-xs rounded-xl cursor-pointer hover:scale-102 active:scale-98 transition flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            <span>Reset Engine</span>
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-neutral-900/30 border border-neutral-800/40 p-6 rounded-2xl flex flex-col gap-5 glassmorphism">
        <div className="flex items-center gap-2 border-b border-neutral-800/60 pb-3">
          <Info size={18} className="text-blue-400" />
          <h3 className="text-md font-bold tracking-wide text-white uppercase font-inter">About MySukoon</h3>
        </div>

        <div className="flex flex-col gap-4 text-xs text-neutral-400">
          <div className="flex justify-between items-center py-1 border-b border-neutral-900">
            <span>Version</span>
            <span className="font-semibold text-white">v2.5.0 Premium Mobile</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-neutral-900">
            <span>Engine Features</span>
            <span className="font-semibold text-white text-right">Hybrid YouTube + Jamendo Pipeline</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-neutral-900">
            <span>Smart Recommendations</span>
            <span className="font-semibold text-white text-right">Adaptive Auto-tagging & Weighting</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span>Progressive Web App</span>
            <span className="font-semibold text-spotify-green">Service Worker & Install Enabled</span>
          </div>

          <div className="mt-2 text-center p-3 bg-neutral-950/40 border border-neutral-800/30 rounded-xl flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-1 font-bold text-white text-sm font-outfit">
              <Sparkles size={14} className="text-spotify-green" />
              <span>MySukoon Studio</span>
            </div>
            <span className="text-[10px] text-neutral-500">Your ultimate serene listening sanctuary. Made with ♥ for peace.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
