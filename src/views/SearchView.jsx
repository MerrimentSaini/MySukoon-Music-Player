import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Heart, Plus, Disc, 
  Trash2, Flame, RefreshCw, AlertTriangle,
  Download, CheckCircle
} from 'lucide-react';
import { JamendoApi } from '../services/jamendoApi';
import { searchYoutube, isIndianQuery } from '../services/youtubeApi';
import { useAudio } from '../context/AudioContext';
import { useStorage } from '../context/StorageContext';
import { SkeletonList } from '../components/SkeletonLoader';

const YoutubeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={props.className}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.52 3.5 12 3.5 12 3.5s-7.52 0-9.388.555a3.002 3.002 0 0 0-2.11 2.108C0 8.03 0 12 0 12s0 3.97.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.48 20.5 12 20.5 12 20.5s7.52 0 9.388-.555a3.002 3.002 0 0 0 2.11-2.108C24 15.97 24 12 24 12s0-3.97-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TRENDING_INDIA_TRACKS = [
  {
    id: 'yt_kesariya',
    videoId: 'BddP6PYo2gs',
    name: 'Kesariya',
    artist_name: 'Arijit Singh, Pritam',
    album_name: 'Brahmastra',
    image: 'https://img.youtube.com/vi/BddP6PYo2gs/mqdefault.jpg',
    duration: 268,
    isYouTube: true,
    source: 'YouTube'
  },
  {
    id: 'yt_pehle_bhi_main',
    videoId: 'iAibnO2fD2A',
    name: 'Pehle Bhi Main',
    artist_name: 'Raj Shekhar, Vishal Mishra',
    album_name: 'Animal',
    image: 'https://img.youtube.com/vi/iAibnO2fD2A/mqdefault.jpg',
    duration: 250,
    isYouTube: true,
    source: 'YouTube'
  },
  {
    id: 'yt_apna_bana_le',
    videoId: 'ElZfdU54Cp8',
    name: 'Apna Bana Le',
    artist_name: 'Arijit Singh, Sachin-Jigar',
    album_name: 'Bhediya',
    image: 'https://img.youtube.com/vi/ElZfdU54Cp8/mqdefault.jpg',
    duration: 204,
    isYouTube: true,
    source: 'YouTube'
  },
  {
    id: 'yt_heeriye',
    videoId: 'RLzC55ai0Eo',
    name: 'Heeriye',
    artist_name: 'Jasleen Royal, Arijit Singh',
    album_name: 'Heeriye Single',
    image: 'https://img.youtube.com/vi/RLzC55ai0Eo/mqdefault.jpg',
    duration: 194,
    isYouTube: true,
    source: 'YouTube'
  },
  {
    id: 'yt_agar_tum_saath_ho',
    videoId: 'sK7riqg2mr4',
    name: 'Agar Tum Saath Ho',
    artist_name: 'Alka Yagnik, Arijit Singh',
    album_name: 'Tamasha',
    image: 'https://img.youtube.com/vi/sK7riqg2mr4/mqdefault.jpg',
    duration: 341,
    isYouTube: true,
    source: 'YouTube'
  },
  {
    id: 'yt_tum_hi_ho',
    videoId: 'Umqb9KENgmk',
    name: 'Tum Hi Ho',
    artist_name: 'Arijit Singh, Mithoon',
    album_name: 'Aashiqui 2',
    image: 'https://img.youtube.com/vi/Umqb9KENgmk/mqdefault.jpg',
    duration: 262,
    isYouTube: true,
    source: 'YouTube'
  },
  {
    id: 'yt_channa_mereya',
    videoId: 'z-diRlyLGzo',
    name: 'Channa Mereya',
    artist_name: 'Arijit Singh, Pritam',
    album_name: 'Ae Dil Hai Mushkil',
    image: 'https://img.youtube.com/vi/z-diRlyLGzo/mqdefault.jpg',
    duration: 289,
    isYouTube: true,
    source: 'YouTube'
  },
  {
    id: 'yt_o_maahi',
    videoId: 'y1e_O9bntig',
    name: 'O Maahi',
    artist_name: 'Arijit Singh, Pritam',
    album_name: 'Dunki',
    image: 'https://img.youtube.com/vi/y1e_O9bntig/mqdefault.jpg',
    duration: 233,
    isYouTube: true,
    source: 'YouTube'
  }
];

export default function SearchView({ searchQuery, setSearchQuery }) {
  const safeSearchQuery = searchQuery || '';
  const { selectTrack, currentTrack, isPlaying, togglePlay } = useAudio();
  const { isFavorite, toggleFavorite, playlists, addTrackToPlaylist, downloadedTracks, downloadingTracks, downloadTrack } = useStorage();
  const [debouncedQuery, setDebouncedQuery] = useState(safeSearchQuery);
  
  // Custom state hooks following guidelines strictly
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ytError, setYtError] = useState(false);
  
  const [recentSearches, setRecentSearches] = useState(() => {
    const stored = localStorage.getItem('mysukoon_recent_searches');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  
  const [activeMenuTrackId, setActiveMenuTrackId] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(10);

  const menuRef = useRef(null);
  const observerRef = useRef(null);

  // Define helper functions and callbacks first to guarantee safe hoisting and prevent TDZ ReferenceErrors
  const saveRecentSearch = useCallback((query) => {
    if (!query || query.trim() === '') return;
    const term = query.trim();
    
    setRecentSearches(prev => {
      const filtered = Array.isArray(prev) ? prev.filter(q => q && q.toLowerCase() !== term.toLowerCase()) : [];
      const updated = [term, ...filtered].slice(0, 6); // Cap at 6 searches
      localStorage.setItem('mysukoon_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeRecentSearch = (e, queryToRemove) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = Array.isArray(prev) ? prev.filter(q => q !== queryToRemove) : [];
      localStorage.setItem('mysukoon_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('mysukoon_recent_searches');
  };

  const handlePlayTrack = (track, trackList) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      selectTrack(track, trackList);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '3:45';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAddToPlaylist = (playlistId, track) => {
    addTrackToPlaylist(playlistId, track);
    setActiveMenuTrackId(null);
  };

  // Debugging search query inputs
  useEffect(() => {
    console.log('[SearchView] Current input searchQuery value:', searchQuery);
  }, [searchQuery]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(safeSearchQuery);
    }, 450);

    return () => clearTimeout(handler);
  }, [safeSearchQuery]);

  // Click outside to close playlist dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuTrackId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeDebouncedQuery = debouncedQuery || '';
  const isSearchActive = safeDebouncedQuery.trim() !== '';

  // Safe search logic wrapping all API calls in try-catch blocks
  useEffect(() => {
    const handleSearch = async () => {
      const query = safeDebouncedQuery;
      
      // Prevent empty searches
      if (!query || !query.trim()) {
        setResults([]);
        setError(null);
        setLoading(false);
        setYtError(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setYtError(false);
        setDisplayLimit(10); // Reset pagination limit when starting a new search
        console.log('[SearchView] handleSearch input value:', query);

        const isIndian = isIndianQuery(query);
        let jamendoPromise = Promise.resolve([]);
        let youtubePromise = Promise.resolve([]);

        // YouTube search (try-caught internally)
        youtubePromise = searchYoutube(query).catch(err => {
          console.error('[SearchView] YouTube API failed:', err);
          setYtError(true);
          return [];
        });

        // Jamendo search: always fetched as fallback or supplementary tracks
        jamendoPromise = JamendoApi.searchTracks(query, 'all', 35, 0).catch(err => {
          console.error('[SearchView] Jamendo API failed:', err);
          return [];
        });

        const [jamendoTracks, youtubeTracks] = await Promise.all([jamendoPromise, youtubePromise]);
        
        // Merge results into a flat list
        const jamendoList = Array.isArray(jamendoTracks) ? jamendoTracks : [];
        const youtubeList = Array.isArray(youtubeTracks) ? youtubeTracks : [];

        let merged = [];
        if (youtubeList.length > 0) {
          // If YouTube returns results: show YouTube songs first.
          // Then Jamendo results (if available). Both should coexist.
          merged = [...youtubeList, ...jamendoList];
        } else {
          // Fallback to Jamendo tracks when YouTube has no results or fails
          console.log('[SearchView] YouTube search returned no results. Showing Jamendo tracks.');
          merged = jamendoList;
        }

        console.log('[SearchView] handleSearch API success size:', merged.length);
        const validatedResults = Array.isArray(merged) ? merged : [];
        setResults(validatedResults);
        
        // Automatically save successful searches
        if (validatedResults.length > 0) {
          saveRecentSearch(query);
        }
      } catch (err) {
        console.error('[SearchView] Fatal Search Error Caught:', err);
        setResults([]);
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    handleSearch();
  }, [safeDebouncedQuery, saveRecentSearch]);

  // Infinite scroll trigger via IntersectionObserver
  useEffect(() => {
    if (!isSearchActive || loading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        // Load more songs from local merged list
        if (displayLimit < results.length) {
          setDisplayLimit(prev => prev + 10);
        }
      }
    }, { threshold: 0.1 });

    const currentTarget = observerRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [isSearchActive, loading, displayLimit, results.length]);

  const mergedTracks = Array.isArray(results) ? results : [];
  const topResult = mergedTracks.length > 0 ? mergedTracks[0] : null;
  const songsList = mergedTracks.slice(0, displayLimit);

  // Mock circular Artists matching the query
  const getArtistResults = () => {
    if (!isSearchActive || !Array.isArray(mergedTracks) || mergedTracks.length === 0) return [];
    
    try {
      const names = Array.from(new Set(mergedTracks.map(t => t?.artist_name).filter(Boolean)));
      return names.slice(0, 5).map((name, i) => {
        const matchingTrack = mergedTracks.find(t => t?.artist_name === name);
        return {
          id: `artist_${i}`,
          name: name,
          image: matchingTrack?.image || 'https://placehold.co/150x150/282828/ffffff?text=Artist'
        };
      });
    } catch (e) {
      console.error('[SearchView] Error building artists results:', e);
      return [];
    }
  };

  // Mock square Albums matching the query
  const getAlbumResults = () => {
    if (!isSearchActive || !Array.isArray(mergedTracks) || mergedTracks.length === 0) return [];
    
    try {
      const albums = Array.from(new Set(mergedTracks.map(t => t?.album_name).filter(Boolean)));
      return albums.slice(0, 5).map((album, i) => {
        const matchingTrack = mergedTracks.find(t => t?.album_name === album);
        return {
          id: `album_${i}`,
          name: album,
          artist: matchingTrack?.artist_name || 'Various Artists',
          image: matchingTrack?.image || 'https://placehold.co/150x150/181818/ffffff?text=Album'
        };
      });
    } catch (e) {
      console.error('[SearchView] Error building albums results:', e);
      return [];
    }
  };

  const artists = getArtistResults();
  const albums = getAlbumResults();

  return (
    <div className="flex flex-col gap-8 pb-32">
      
      {/* 1. INITIAL/EMPTY STATE: Recent Searches & Trending India */}
      {!isSearchActive && (
        <div className="flex flex-col gap-10 animate-in fade-in duration-300">
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight text-white font-outfit">Recent Searches</h3>
                <button 
                  onClick={clearAllRecent}
                  className="text-xs text-neutral-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  <Trash2 size={13} />
                  <span>Clear All</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {recentSearches.map((term, index) => (
                  <div
                    key={index}
                    onClick={() => setSearchQuery(term)}
                    className="group bg-neutral-900/40 hover:bg-neutral-800/50 border border-neutral-800/40 hover:border-neutral-700/60 rounded-xl p-3.5 flex items-center justify-between gap-2 cursor-pointer transition duration-300 relative glassmorphism overflow-hidden"
                  >
                    <span className="text-xs font-semibold text-neutral-200 truncate pr-3 group-hover:text-white transition">
                      {term}
                    </span>
                    <button
                      onClick={(e) => removeRecentSearch(e, term)}
                      className="text-neutral-500 hover:text-white p-1 rounded-full hover:bg-neutral-800 cursor-pointer transition text-[9px] leading-none"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curated "Trending India" Dashboard */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg">
                <Flame size={18} fill="currentColor" />
              </span>
              <h3 className="text-xl font-bold tracking-tight text-white font-outfit">Trending India</h3>
            </div>
            
            <p className="text-xs text-neutral-400 -mt-2">The hottest Indian & Bollywood chartbusters. Plays instantly from YouTube.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4 mt-1">
              {TRENDING_INDIA_TRACKS.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => handlePlayTrack(track, TRENDING_INDIA_TRACKS)}
                    className="group bg-neutral-900/30 hover:bg-neutral-800/40 border border-neutral-800/40 hover:border-neutral-700/50 rounded-xl p-3 flex flex-col gap-3 cursor-pointer transition-all duration-300 hover:-translate-y-1 glassmorphism"
                  >
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-950 border border-white/5 shadow-md">
                      <img
                        src={track.image}
                        alt={track.name}
                        loading="lazy"
                        className="w-full h-full object-cover transform transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="p-3 bg-spotify-green hover:bg-spotify-green-hover text-black rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition duration-300 flex items-center justify-center">
                          {isCurrent && isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <Play size={20} fill="currentColor" className="translate-x-[0.5px]" />
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`font-bold text-xs truncate leading-snug ${isCurrent ? 'text-spotify-green' : 'text-neutral-100'}`}>
                        {track.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 truncate mt-0.5">
                        {track.artist_name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. LOADING STATE */}
      {isSearchActive && loading && mergedTracks.length === 0 && (
        <div className="bg-neutral-900/10 p-6 rounded-2xl border border-neutral-900/60 glassmorphism">
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw size={18} className="animate-spin text-spotify-green" />
            <span className="text-sm font-semibold text-neutral-400">Searching global databases...</span>
          </div>
          <SkeletonList count={5} />
        </div>
      )}

      {/* 3. CONNECTION/ERROR STATE */}
      {isSearchActive && !loading && error && mergedTracks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-neutral-900/10 border border-neutral-800/40 rounded-2xl glassmorphism animate-in fade-in duration-300">
          <AlertTriangle size={44} className="text-amber-500 mb-4" />
          <h3 className="text-lg font-bold tracking-tight text-white mb-1 font-outfit">Search Interrupted</h3>
          <p className="text-xs text-neutral-400 max-w-sm mb-4">
            {error || "Something went wrong. Please try again."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-spotify-green text-black font-extrabold rounded-full text-xs hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            Retry Search
          </button>
        </div>
      )}

      {/* 4. SEARCH RESULTS LAYOUT (Spotify Layout) */}
      {isSearchActive && !loading && !error && mergedTracks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-neutral-900/10 border border-neutral-800/40 rounded-2xl glassmorphism animate-in fade-in duration-300">
          <Disc size={44} className="text-neutral-600 mb-4 animate-spin" />
          <h3 className="text-lg font-bold tracking-tight text-white mb-1 font-outfit">No matches found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mb-4">
            Could not find any matching results for "{safeDebouncedQuery}" in Indian or Jamendo databases.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full text-xs font-bold transition cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {isSearchActive && mergedTracks.length > 0 && (
        <div className="flex flex-col gap-10 animate-in fade-in duration-300">
          
          {/* Subtle background update indicator */}
          {loading && (
            <div className="flex items-center gap-2 text-xs font-semibold text-spotify-green bg-neutral-900/40 border border-neutral-800/40 px-3.5 py-1.5 rounded-full max-w-max glassmorphism animate-pulse -mb-4">
              <RefreshCw size={12} className="animate-spin text-spotify-green animate-in spin-in duration-300" />
              <span>Updating results...</span>
            </div>
          )}
          
          {/* TOP RESULT & SONGS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Top Result Column (Large card on left) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <h3 className="text-lg font-bold tracking-tight text-white font-outfit">Top Result</h3>
              
              {topResult && (
                <div 
                  onClick={() => handlePlayTrack(topResult, mergedTracks)}
                  className="group bg-neutral-900/30 hover:bg-neutral-800/30 border border-neutral-800/30 hover:border-neutral-700/50 rounded-2xl p-5 flex flex-col justify-end min-h-[250px] relative cursor-pointer transition-all duration-300 glassmorphism overflow-hidden select-none"
                >
                  {/* Subtle hover gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-0 opacity-80"></div>
                  
                  {/* Absolute positioning of play button */}
                  <div className="absolute right-6 bottom-6 z-10">
                    <span className="p-4 bg-spotify-green hover:bg-spotify-green-hover text-black rounded-full shadow-2xl flex items-center justify-center transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300">
                      {currentTrack?.id === topResult.id && isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <Play size={24} fill="currentColor" className="translate-x-[0.5px]" />
                      )}
                    </span>
                  </div>

                  {/* Artwork */}
                  <img 
                    src={topResult.image || '/mysukoon_logo.png'} 
                    alt={topResult.name}
                    loading="lazy"
                    className="w-24 h-24 object-cover rounded-xl shadow-2xl border border-white/5 mb-6 z-10"
                  />

                  {/* Text meta */}
                  <div className="flex flex-col z-10 mt-2">
                    <span className="text-xl font-bold tracking-tight text-white truncate max-w-[90%] leading-snug">
                      {topResult.name}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-neutral-300 font-semibold truncate max-w-[200px]">
                        {topResult.artist_name}
                      </span>
                      <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-[9px] font-bold text-neutral-400 rounded-full flex items-center gap-1 scale-95">
                        {topResult.isYouTube ? (
                          <>
                            <YoutubeIcon className="w-2.5 h-2.5 text-red-500" />
                            <span>YouTube</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span>Jamendo</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Songs List Column (Top list on right) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <h3 className="text-lg font-bold tracking-tight text-white font-outfit">Songs</h3>
              
              <div className="flex flex-col bg-neutral-900/10 border border-neutral-900 rounded-xl overflow-hidden glassmorphism">
                <div className="flex flex-col">
                  {results && results.length > 0 ? (
                    songsList.map((track, idx) => {
                      if (!track) return null;
                      const isCurrent = currentTrack?.id === track.id;
                      const isFav = isFavorite(track.id);
                      return (
                        <div
                          key={track.id}
                          onClick={() => handlePlayTrack(track, mergedTracks)}
                          className={`flex items-center gap-4 px-4 py-2.5 border-b border-neutral-900/40 hover:bg-neutral-800/20 transition group cursor-pointer ${
                            isCurrent ? 'bg-neutral-800/10 text-spotify-green' : 'text-neutral-300'
                          }`}
                        >
                          {/* Play control on hover */}
                          <span className="w-6 text-center text-xs font-semibold text-neutral-500 group-hover:hidden flex items-center justify-center">
                            {isCurrent && isPlaying ? (
                              <div className="flex items-end gap-0.5 h-3 w-3">
                                <div className="w-[2px] bg-spotify-green rounded-t eq-bar-1 h-1"></div>
                                <div className="w-[2px] bg-spotify-green rounded-t eq-bar-2 h-2.5"></div>
                                <div className="w-[2px] bg-spotify-green rounded-t eq-bar-3 h-2"></div>
                              </div>
                            ) : (
                              idx + 1
                            )}
                          </span>
                          
                          <button 
                            className="w-6 justify-center hidden group-hover:flex text-white hover:text-spotify-green transition cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayTrack(track, mergedTracks);
                            }}
                          >
                            <Play size={13} fill="currentColor" className={isCurrent && isPlaying ? 'hidden' : ''} />
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-3.5 h-3.5 ${isCurrent && isPlaying ? '' : 'hidden'}`}>
                              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25z" clipRule="evenodd" />
                            </svg>
                          </button>

                          {/* Title block */}
                          <div className="flex-1 flex items-center gap-3 min-w-0">
                            <img 
                              src={track.image || '/mysukoon_logo.png'} 
                              alt={track.name} 
                              loading="lazy"
                              className="w-10 h-10 object-cover rounded bg-neutral-950 border border-white/5 flex-shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className={`font-semibold text-xs truncate leading-normal ${isCurrent ? 'text-spotify-green' : 'text-white'}`}>
                                {track.name}
                              </span>
                              <span className="text-[10px] text-neutral-400 truncate flex items-center gap-1.5 mt-0.5">
                                <span>{track.artist_name}</span>
                                {track.isYouTube ? (
                                  <span className="px-1 py-0.2 bg-red-500/10 border border-red-500/25 text-red-500 text-[8px] font-extrabold rounded uppercase tracking-wider flex items-center gap-0.5 scale-90 origin-left">
                                    <YoutubeIcon className="w-2 h-2" />
                                    <span>YouTube</span>
                                  </span>
                                ) : (
                                  <span className="px-1 py-0.2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[8px] font-extrabold rounded uppercase tracking-wider flex items-center gap-0.5 scale-90 origin-left">
                                    <span>Jamendo</span>
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Duration */}
                          <span className="w-14 text-right text-xs text-neutral-400 pr-2">
                            {formatDuration(track.duration)}
                          </span>

                          {/* Action buttons */}
                          <div className="w-16 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* Download Button */}
                            {!track.isYouTube && (
                              <button
                                onClick={() => downloadTrack(track)}
                                className="text-neutral-400 hover:text-spotify-green transition cursor-pointer"
                                title={
                                  downloadedTracks.some(t => t.id === track.id)
                                    ? "Downloaded Offline"
                                    : downloadingTracks[track.id] !== undefined
                                    ? `Downloading ${downloadingTracks[track.id]}%`
                                    : "Download Offline"
                                }
                              >
                                {downloadedTracks.some(t => t.id === track.id) ? (
                                  <CheckCircle size={14} className="text-spotify-green" fill="currentColor" />
                                ) : downloadingTracks[track.id] !== undefined ? (
                                  <span className="text-[9px] font-mono text-spotify-green font-bold animate-pulse">{downloadingTracks[track.id]}%</span>
                                ) : (
                                  <Download size={14} />
                                )}
                              </button>
                            )}

                            <button
                              onClick={() => toggleFavorite(track)}
                              className="text-neutral-400 hover:text-red-500 transition cursor-pointer"
                            >
                              <Heart size={14} fill={isFav ? '#ef4444' : 'none'} className={isFav ? 'text-red-500' : ''} />
                            </button>

                            <div className="relative">
                              <button
                                onClick={() => setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id)}
                                className="text-neutral-400 hover:text-white transition p-1 cursor-pointer"
                              >
                                <Plus size={14} />
                              </button>

                              {activeMenuTrackId === track.id && (
                                <div 
                                  ref={menuRef}
                                  className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100"
                                >
                                  <span className="block px-3 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-800">Add to Playlist</span>
                                  {playlists.length === 0 ? (
                                    <span className="block px-3 py-2 text-xs text-neutral-500 italic">No playlists found</span>
                                  ) : (
                                    playlists.map((pl) => (
                                      <button
                                        key={pl.id}
                                        onClick={() => handleAddToPlaylist(pl.id, track)}
                                        className="block w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition truncate cursor-pointer"
                                      >
                                        {pl.name}
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-neutral-500 italic">
                      No results found
                    </div>
                  )}
                </div>
                
                {/* Scroll Trigger */}
                <div ref={observerRef} className="h-6 w-full pointer-events-none"></div>
              </div>
            </div>

          </div>

          {/* ARTISTS (Circular Grid) */}
          {artists.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold tracking-tight text-white font-outfit">Artists</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {artists.map((art) => (
                  <div
                    key={art.id}
                    className="group bg-neutral-900/20 hover:bg-neutral-800/30 border border-neutral-800/40 hover:border-neutral-700/50 rounded-xl p-4 flex flex-col items-center text-center cursor-pointer transition-all duration-300 glassmorphism select-none"
                    onClick={() => setSearchQuery(art.name)}
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border border-white/5 shadow-md">
                      <img 
                        src={art.image} 
                        alt={art.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <span className="font-bold text-xs text-white truncate max-w-full leading-normal">
                      {art.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-extrabold mt-1">Artist</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALBUMS (Square Grid) */}
          {albums.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold tracking-tight text-white font-outfit">Albums</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {albums.map((alb) => (
                  <div
                    key={alb.id}
                    className="group bg-neutral-900/20 hover:bg-neutral-800/30 border border-neutral-800/40 hover:border-neutral-700/50 rounded-xl p-4 flex flex-col cursor-pointer transition-all duration-300 glassmorphism select-none"
                    onClick={() => setSearchQuery(alb.name)}
                  >
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 border border-white/5 shadow-md">
                      <img 
                        src={alb.image} 
                        alt={alb.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="p-2.5 bg-spotify-green text-black rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition duration-300 flex items-center justify-center">
                          <Play size={14} fill="currentColor" className="translate-x-[0.5px]" />
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-white truncate max-w-full leading-snug">
                      {alb.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 truncate mt-0.5">
                      {alb.artist}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom helper */}
          {ytError && (
            <div className="flex items-center gap-2.5 p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-500 text-xs">
              <AlertTriangle size={15} />
              <span>Some YouTube tracks could not be loaded due to API key limits. Using high-fidelity Jamendo streams.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
