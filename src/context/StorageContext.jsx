/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { getStreamUrl } from '../services/jamendoApi';
import {
  getPlaylistsFromDB,
  savePlaylistToDB,
  deletePlaylistFromDB,
  getDownloadsFromDB,
  saveDownloadToDB,
  deleteDownloadFromDB
} from '../services/db';

const StorageContext = createContext(null);

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};

const RANDOM_GRADIENTS = [
  'from-pink-500 to-rose-500',
  'from-purple-600 to-indigo-600',
  'from-emerald-500 to-teal-500',
  'from-cyan-500 to-blue-500',
  'from-amber-500 to-orange-500',
  'from-violet-600 to-purple-600',
  'from-red-500 to-pink-500',
  'from-blue-600 to-indigo-700'
];

export const StorageProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mysukoon_favorites') || localStorage.getItem('mysukoon_liked') || '[]');
    } catch {
      return [];
    }
  });
  const [playlists, setPlaylists] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mysukoon_recently_played') || localStorage.getItem('mysukoon_history') || '[]');
    } catch {
      return [];
    }
  });
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mysukoon_user') || localStorage.getItem('mysukoon_profile') || '{"isLoggedIn":false,"name":"","avatar":""}');
    } catch {
      return { isLoggedIn: false, name: '', avatar: '' };
    }
  });
  const [amoledMode, setAmoledMode] = useState(() => {
    return localStorage.getItem('mysukoon_amoled') === 'true';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mysukoon_theme') || 'dark';
  });
  
  // Downloads state
  const [downloadedTracks, setDownloadedTracks] = useState([]);
  const [downloadingTracks, setDownloadingTracks] = useState({});
  
  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => setToast(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load initial data and run migrations
  useEffect(() => {
    try {
      const isAmoled = localStorage.getItem('mysukoon_amoled') === 'true';
      const storedTheme = localStorage.getItem('mysukoon_theme') || 'dark';

      if (isAmoled) {
        document.body.classList.add('amoled-theme');
      }

      if (storedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
        document.documentElement.classList.remove('dark-theme');
      } else {
        document.documentElement.classList.add('dark-theme');
        document.documentElement.classList.remove('light-theme');
      }
    } catch (e) {
      console.error('Failed to load local storage data', e);
    }

    // Load playlists & downloaded tracks from IndexedDB, handle one-time local storage migration
    const loadIndexedDBData = async () => {
      try {
        const storedLocalPlaylists = localStorage.getItem('mysukoon_playlists');
        if (storedLocalPlaylists) {
          try {
            const parsed = JSON.parse(storedLocalPlaylists);
            if (Array.isArray(parsed) && parsed.length > 0) {
              for (const pl of parsed) {
                await savePlaylistToDB(pl);
              }
              console.log('[Migration] Migrated local storage playlists to IndexedDB.');
            }
          } catch (e) {
            console.error('[Migration] Failed migrating local storage playlists:', e);
          }
          localStorage.removeItem('mysukoon_playlists');
        }

        const dbPlaylists = await getPlaylistsFromDB();
        setPlaylists(dbPlaylists || []);

        const dbDownloads = await getDownloadsFromDB();
        setDownloadedTracks(dbDownloads || []);
      } catch (err) {
        console.error('Failed to load data from IndexedDB:', err);
      }
    };

    loadIndexedDBData();
  }, []);

  // Sync recently played on custom event from AudioContext
  useEffect(() => {
    const syncRecentlyPlayed = () => {
      try {
        const storedRecent = JSON.parse(localStorage.getItem('mysukoon_recently_played') || localStorage.getItem('mysukoon_history') || '[]');
        setRecentlyPlayed(storedRecent);
      } catch (e) {
        console.error('Error syncing recently played', e);
      }
    };

    window.addEventListener('storage_update', syncRecentlyPlayed);
    window.addEventListener('storage', syncRecentlyPlayed);
    
    return () => {
      window.removeEventListener('storage_update', syncRecentlyPlayed);
      window.removeEventListener('storage', syncRecentlyPlayed);
    };
  }, []);

  // --- Favorites Manager ---
  const addFavorite = (track) => {
    if (favorites.some(t => t.id === track.id)) return;
    const updated = [track, ...favorites];
    setFavorites(updated);
    localStorage.setItem('mysukoon_favorites', JSON.stringify(updated));
    localStorage.setItem('mysukoon_liked', JSON.stringify(updated));
    showToast(`Added "${track.name}" to Liked Songs`);
  };

  const removeFavorite = (trackId) => {
    const track = favorites.find(t => t.id === trackId);
    const updated = favorites.filter(t => t.id !== trackId);
    setFavorites(updated);
    localStorage.setItem('mysukoon_favorites', JSON.stringify(updated));
    localStorage.setItem('mysukoon_liked', JSON.stringify(updated));
    if (track) {
      showToast(`Removed "${track.name}" from Liked Songs`);
    }
  };

  const isFavorite = (trackId) => {
    return favorites.some(t => t.id === trackId);
  };

  const toggleFavorite = (track) => {
    if (isFavorite(track.id)) {
      removeFavorite(track.id);
    } else {
      addFavorite(track);
    }
  };

  // --- Playlists Manager ---
  const createPlaylist = async (name, description = '') => {
    const randomGradient = RANDOM_GRADIENTS[Math.floor(Math.random() * RANDOM_GRADIENTS.length)];
    const newPlaylist = {
      id: `playlist_${Date.now()}`,
      name,
      description,
      gradient: randomGradient,
      tracks: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    try {
      await savePlaylistToDB(newPlaylist);
      setPlaylists(prev => [...prev, newPlaylist]);
      showToast(`Created playlist "${name}"`);
      return newPlaylist;
    } catch (e) {
      console.error('Failed to create playlist:', e);
      showToast('Failed to create playlist');
    }
  };

  const deletePlaylist = async (playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    try {
      await deletePlaylistFromDB(playlistId);
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      if (playlist) {
        showToast(`Deleted playlist "${playlist.name}"`);
      }
    } catch (e) {
      console.error('Failed to delete playlist:', e);
      showToast('Failed to delete playlist');
    }
  };

  const renamePlaylist = async (playlistId, newName, newDescription) => {
    let playlist = null;
    
    setPlaylists(prev => {
      const pl = prev.find(p => p.id === playlistId);
      if (!pl) return prev;
      
      playlist = {
        ...pl,
        name: newName,
        description: newDescription,
        lastModified: new Date().toISOString()
      };
      
      savePlaylistToDB(playlist).catch(e => console.error('Failed to rename playlist in IndexedDB:', e));
      return prev.map(p => p.id === playlistId ? playlist : p);
    });
    
    setTimeout(() => {
      if (playlist) {
        showToast(`Playlist renamed to "${newName}"`);
      }
    }, 0);
  };

  const addTrackToPlaylist = async (playlistId, track) => {
    let playlistName = '';
    let alreadyExists = false;
    
    setPlaylists(prev => {
      const pl = prev.find(p => p.id === playlistId);
      if (!pl) return prev;
      playlistName = pl.name;
      if (pl.tracks.some(t => t.id === track.id)) {
        alreadyExists = true;
        return prev;
      }
      
      const updatedPlaylist = {
        ...pl,
        tracks: [...pl.tracks, track],
        lastModified: new Date().toISOString()
      };
      
      savePlaylistToDB(updatedPlaylist).catch(e => console.error('Failed to save updated playlist:', e));
      return prev.map(p => p.id === playlistId ? updatedPlaylist : p);
    });
    
    setTimeout(() => {
      if (alreadyExists) {
        showToast(`"${track.name}" is already in "${playlistName}"`);
      } else if (playlistName) {
        showToast(`Added "${track.name}" to "${playlistName}"`);
      }
    }, 0);
  };

  const removeTrackFromPlaylist = async (playlistId, trackId) => {
    let playlistName = '';
    let trackName = '';
    
    setPlaylists(prev => {
      const pl = prev.find(p => p.id === playlistId);
      if (!pl) return prev;
      playlistName = pl.name;
      const targetTrack = pl.tracks.find(t => t.id === trackId);
      if (targetTrack) trackName = targetTrack.name;
      
      const updatedPlaylist = {
        ...pl,
        tracks: pl.tracks.filter(t => t.id !== trackId),
        lastModified: new Date().toISOString()
      };
      
      savePlaylistToDB(updatedPlaylist).catch(e => console.error('Failed to save updated playlist:', e));
      return prev.map(p => p.id === playlistId ? updatedPlaylist : p);
    });
    
    setTimeout(() => {
      if (trackName) {
        showToast(`Removed "${trackName}" from "${playlistName}"`);
      }
    }, 0);
  };

  const reorderSongsInPlaylist = async (playlistId, fromIdx, toIdx) => {
    setPlaylists(prev => {
      const pl = prev.find(p => p.id === playlistId);
      if (!pl) return prev;
      
      if (fromIdx < 0 || fromIdx >= pl.tracks.length || toIdx < 0 || toIdx >= pl.tracks.length) return prev;
      
      const newTracks = [...pl.tracks];
      const [movedTrack] = newTracks.splice(fromIdx, 1);
      newTracks.splice(toIdx, 0, movedTrack);
      
      const updatedPlaylist = {
        ...pl,
        tracks: newTracks,
        lastModified: new Date().toISOString()
      };
      
      savePlaylistToDB(updatedPlaylist).catch(e => console.error('Failed to save reordered playlist:', e));
      return prev.map(p => p.id === playlistId ? updatedPlaylist : p);
    });
  };

  // --- Downloads Manager ---
  const downloadTrack = async (track) => {
    if (!track.audio) {
      showToast('Offline download not supported for YouTube streams.', 'warning');
      return;
    }
    if (downloadedTracks.some(t => t.id === track.id)) {
      showToast('Track is already downloaded.', 'info');
      return;
    }
    if (downloadingTracks[track.id] !== undefined) {
      return; // already downloading
    }

    setDownloadingTracks(prev => ({ ...prev, [track.id]: 0 }));

    try {
      const streamUrl = getStreamUrl(track.audio);
      const response = await fetch(streamUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body.getReader();
      let receivedBytes = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        if (totalBytes > 0) {
          const progress = Math.round((receivedBytes / totalBytes) * 100);
          setDownloadingTracks(prev => ({ ...prev, [track.id]: progress }));
        }
      }

      const blob = new Blob(chunks, { type: 'audio/mpeg' });
      const downloadItem = await saveDownloadToDB(track, blob);

      setDownloadedTracks(prev => [...prev, downloadItem]);
      showToast(`Downloaded "${track.name}" offline!`);
    } catch (err) {
      console.error('Download failed:', err);
      if (err.name === 'QuotaExceededError' || err.message?.includes('quota')) {
        showToast('Download failed: Disk quota exceeded.', 'warning');
      } else {
        showToast(`Download failed: Check your proxy server connection.`, 'warning');
      }
    } finally {
      setDownloadingTracks(prev => {
        const next = { ...prev };
        delete next[track.id];
        return next;
      });
    }
  };

  const deleteDownload = async (trackId, trackName) => {
    try {
      await deleteDownloadFromDB(trackId);
      setDownloadedTracks(prev => prev.filter(t => t.id !== trackId));
      showToast(`Removed "${trackName}" from downloads.`);
    } catch (e) {
      console.error('Failed to delete download:', e);
      showToast(`Failed to delete downloaded track.`);
    }
  };

  // --- User Profile Session ---
  const loginUser = (name, avatar) => {
    const session = { isLoggedIn: true, name, avatar };
    setUser(session);
    localStorage.setItem('mysukoon_user', JSON.stringify(session));
    localStorage.setItem('mysukoon_profile', JSON.stringify(session));
    showToast(`Logged in as ${name}`);
  };

  const logoutUser = () => {
    const session = { isLoggedIn: false, name: '', avatar: '' };
    setUser(session);
    localStorage.removeItem('mysukoon_user');
    localStorage.removeItem('mysukoon_profile');
    showToast('Logged out');
  };

  const updateUserProfile = (name, avatarBase64) => {
    const updated = { isLoggedIn: true, name, avatar: avatarBase64 };
    setUser(updated);
    localStorage.setItem('mysukoon_user', JSON.stringify(updated));
    localStorage.setItem('mysukoon_profile', JSON.stringify(updated));
  };

  const toggleAmoledMode = () => {
    const nextVal = !amoledMode;
    setAmoledMode(nextVal);
    localStorage.setItem('mysukoon_amoled', nextVal ? 'true' : 'false');
    if (nextVal) {
      document.body.classList.add('amoled-theme');
    } else {
      document.body.classList.remove('amoled-theme');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('mysukoon_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    }
  };

  const clearListeningHistory = () => {
    localStorage.removeItem('mysukoon_history_plays');
    localStorage.removeItem('mysukoon_history_skips');
    localStorage.removeItem('mysukoon_history_artists');
    localStorage.removeItem('mysukoon_history_genres');
    localStorage.removeItem('mysukoon_history_moods');
    localStorage.removeItem('mysukoon_history_recent');
    localStorage.removeItem('mysukoon_recently_played');
    localStorage.removeItem('mysukoon_history');
    localStorage.removeItem('mysukoon_history_search');
    localStorage.removeItem('mysukoon_stats_time');
    
    setRecentlyPlayed([]);
    window.dispatchEvent(new Event('storage_update'));
    showToast('Cleared listening history & metrics');
  };

  return (
    <StorageContext.Provider value={{
      favorites,
      playlists,
      recentlyPlayed,
      user,
      amoledMode,
      theme,
      downloadedTracks,
      downloadingTracks,
      toast,
      showToast,
      hideToast,
      addFavorite,
      removeFavorite,
      isFavorite,
      toggleFavorite,
      createPlaylist,
      deletePlaylist,
      renamePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      reorderSongsInPlaylist,
      downloadTrack,
      deleteDownload,
      loginUser,
      logoutUser,
      updateUserProfile,
      toggleAmoledMode,
      toggleTheme,
      clearListeningHistory
    }}>
      {children}
    </StorageContext.Provider>
  );
};
