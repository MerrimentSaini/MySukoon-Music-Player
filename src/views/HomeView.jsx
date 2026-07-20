import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Play, Heart, Star, Music, History, Sparkles, Flame, 
  Smile, Activity, Compass, Target, User, Disc, Coffee, CloudRain, Moon 
} from 'lucide-react';
import { JamendoApi } from '../services/jamendoApi';
import { searchYoutube } from '../services/youtubeApi';
import { getRecommendations, getTopArtists, MOOD_FALLBACKS } from '../services/recommendationEngine';
import { useAudio } from '../context/AudioContext';
import { useStorage } from '../context/StorageContext';
import { SkeletonGrid } from '../components/SkeletonLoader';

export default function HomeView({ setActiveView, setSearchQuery }) {
  const { selectTrack, currentTrack, isPlaying, togglePlay } = useAudio();
  const { recentlyPlayed, favorites, toggleFavorite, isFavorite, user } = useStorage();
  
  // Custom dashboard states
  const [activeMood, setActiveMood] = useState('chill');
  const [trendingIndiaTracks, setTrendingIndiaTracks] = useState([]);
  const [isTrendingIndiaLoading, setIsTrendingIndiaLoading] = useState(false);
  
  // Fetch Trending Jamendo Tracks (for recommendation pool)
  const { data: trendingTracks, isLoading: isJamendoLoading } = useQuery({
    queryKey: ['trendingTracks'],
    queryFn: () => JamendoApi.getTrendingTracks(18),
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch Live Indian Charts from YouTube Data API
  useEffect(() => {
    const fetchTrendingIndia = async () => {
      setIsTrendingIndiaLoading(true);
      try {
        const results = await searchYoutube("trending hindi songs 2026");
        // Take top 8 trending tracks
        setTrendingIndiaTracks(results.slice(0, 8));
      } catch (err) {
        console.warn('[HomeView] YouTube trending feed failed:', err.message);
      } finally {
        setIsTrendingIndiaLoading(false);
      }
    };

    fetchTrendingIndia();
  }, []);

  // Compute Greeting Greeter
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handlePlayTrack = (track, trackList) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      selectTrack(track, trackList);
    }
  };

  // Compile recommendation list using active history + trending songs
  const recommendedTracks = getRecommendations(trendingTracks || [], 8);
  const topArtists = getTopArtists(5);

  const moodTabs = [
    { id: 'chill', label: 'Chill & Ambient', icon: <Smile size={14} className="inline mr-1" /> },
    { id: 'sad', label: 'Sad & Melancholy', icon: <Disc size={14} className="inline mr-1" /> },
    { id: 'workout', label: 'Workout & Energy', icon: <Activity size={14} className="inline mr-1" /> },
    { id: 'focus', label: 'Deep Focus & Lofi', icon: <Target size={14} className="inline mr-1" /> }
  ];

  const moodTracks = MOOD_FALLBACKS[activeMood] || [];

  return (
    <div className="flex flex-col gap-10 pb-32 animate-in fade-in duration-300">
      
      {/* SECTION 1: Personal Greeter Hero Banner */}
      <section className="hero-banner relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-inner select-none">
        <div className="hero-overlay" />
        <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-[-10px] w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-pink-400 text-xs font-bold tracking-widest uppercase">
            <Sparkles size={13} className="animate-pulse" />
            <span>Peaceful vibes curated for your soul</span>
          </div>
          <h2 className="hero-greeting font-outfit leading-none">
            {getGreeting()}{user?.isLoggedIn ? `, ${user.name}` : ''}! <span className="animate-wiggle inline-block">👋</span>
          </h2>
          <p className="hero-subtitle text-xs sm:text-sm font-medium flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            Enjoy tranquil melodies. Live Jamendo audio active.
          </p>
        </div>
      </section>

      {/* SECTION 1.5: Instant Mood Tuners Dashboard */}
      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider pl-1">Instant Mood Tuner</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'mood-lofi', name: 'Lofi Chill', icon: Coffee, color: 'from-pink-400 to-rose-400' },
            { id: 'mood-rain', name: 'Rainy Vibes', icon: CloudRain, color: 'from-blue-400 to-indigo-500' },
            { id: 'mood-night', name: 'Deep Sleep', icon: Moon, color: 'from-indigo-600 to-purple-800' },
            { id: 'mood-focus', name: 'Zen Study', icon: Sparkles, color: 'from-cyan-400 to-blue-500' },
          ].map((mood) => {
            const IconComp = mood.icon;
            return (
              <button 
                key={mood.id}
                onClick={() => {
                  let targetTrack;
                  if (mood.id === 'mood-lofi') {
                    targetTrack = MOOD_FALLBACKS.focus[0];
                  } else if (mood.id === 'mood-rain') {
                    targetTrack = MOOD_FALLBACKS.focus[1];
                  } else if (mood.id === 'mood-night') {
                    targetTrack = MOOD_FALLBACKS.focus[2];
                  } else {
                    targetTrack = MOOD_FALLBACKS.focus[0];
                  }
                  if (targetTrack) {
                    selectTrack(targetTrack, MOOD_FALLBACKS.focus);
                  }
                }}
                className="bg-white/[0.03] hover:bg-white/[0.07] active:scale-[0.97] transition-all p-3 rounded-2xl flex items-center gap-3 text-left border border-white/[0.04] group cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${mood.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform flex-shrink-0`}>
                  <IconComp size={16} />
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-xs text-white truncate">{mood.name}</p>
                  <p className="text-[9px] text-neutral-400 mt-0.5 leading-none">Tap to tune</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: Recommended For You (AI-Ranked Carousel) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="text-spotify-green" size={20} />
            <h3 className="text-xl font-bold tracking-tight text-white font-outfit">Recommended For You</h3>
          </div>
          <span className="text-[10px] font-extrabold text-spotify-green bg-spotify-green/10 border border-spotify-green/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest scale-90">AI Recommended</span>
        </div>

        {isJamendoLoading ? (
          <SkeletonGrid count={6} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            {recommendedTracks.map((track) => {
              const favorite = isFavorite(track.id);
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div 
                  key={track.id} 
                  className="group relative bg-neutral-900/30 hover:bg-neutral-800/40 p-3 rounded-xl flex flex-col gap-3 transition-all duration-300 border border-neutral-900/60 hover:border-neutral-700/40 cursor-pointer glassmorphism"
                  onClick={() => handlePlayTrack(track, recommendedTracks)}
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-950 shadow-md">
                    <img 
                      src={track.image || '/mysukoon_logo.png'} 
                      alt={track.name} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <button 
                      className="absolute bottom-2.5 right-2.5 p-3 bg-spotify-green hover:bg-spotify-green-hover rounded-full text-black shadow-xl scale-0 group-hover:scale-100 transition duration-300 transform hover:scale-105 z-10 cursor-pointer flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTrack(track, recommendedTracks);
                      }}
                    >
                      {isCurrent && isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <Play size={16} fill="currentColor" className="translate-x-[0.5px]" />
                      )}
                    </button>
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className={`font-bold text-xs truncate leading-snug ${isCurrent ? 'text-spotify-green' : 'text-neutral-100'}`}>
                      {track.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 truncate mt-0.5 flex items-center justify-between">
                      <span className="truncate max-w-[70%]">{track.artist_name}</span>
                      <span className="bg-neutral-900 border border-neutral-800 text-[8px] font-bold px-1.5 py-0.2 rounded text-neutral-500 scale-90 capitalize">{track.genre || 'Pop'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: Recently Played Replay Grid */}
      {recentlyPlayed.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <History className="text-spotify-green" size={20} />
            <h3 className="text-xl font-bold tracking-tight text-white font-outfit">Recently Played</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {recentlyPlayed.slice(0, 6).map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div 
                  key={track.id} 
                  className="group relative bg-neutral-900/20 hover:bg-neutral-800/40 p-3 rounded-lg flex flex-col gap-3 transition duration-300 border border-neutral-900/40 hover:border-neutral-800/60 cursor-pointer glassmorphism"
                  onClick={() => handlePlayTrack(track, recentlyPlayed)}
                >
                  <div className="relative aspect-square rounded-md overflow-hidden bg-neutral-950">
                    <img 
                      src={track.image || '/mysukoon_logo.png'} 
                      alt={track.name} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <button 
                      className="absolute bottom-2 right-2 p-2.5 bg-spotify-green hover:bg-spotify-green-hover rounded-full text-black shadow-lg scale-0 group-hover:scale-100 transition duration-300 transform hover:scale-105 z-10 cursor-pointer flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTrack(track, recentlyPlayed);
                      }}
                    >
                      {isCurrent && isPlaying ? (
                        <svg xmlns="http://www.w3.org/2050/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <Play size={14} fill="currentColor" className="translate-x-[0.5px]" />
                      )}
                    </button>
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className={`font-bold text-xs truncate leading-snug ${isCurrent ? 'text-spotify-green' : 'text-neutral-100'}`}>{track.name}</span>
                    <span className="text-[10px] text-neutral-400 truncate mt-0.5">{track.artist_name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 4: Live Trending in India (YouTube API) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Flame className="text-rose-500" size={20} fill="currentColor" />
            <h3 className="text-xl font-bold tracking-tight text-white font-outfit">Trending in India</h3>
          </div>
          <span className="text-[9px] font-extrabold text-red-500 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 scale-90 origin-right">
            <span>LIVE CHARTS</span>
          </span>
        </div>

        {isTrendingIndiaLoading && trendingIndiaTracks.length === 0 ? (
          <SkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4">
            {trendingIndiaTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => handlePlayTrack(track, trendingIndiaTracks)}
                  className="group bg-neutral-900/30 hover:bg-neutral-800/40 border border-neutral-800/40 hover:border-neutral-700/50 rounded-xl p-3 flex flex-col gap-3 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 glassmorphism"
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
                    <span className="text-[10px] text-neutral-400 truncate mt-0.5 flex items-center justify-between">
                      <span className="truncate max-w-[70%]">{track.artist_name}</span>
                      <span className="bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-extrabold px-1 rounded uppercase tracking-wider scale-90">YT</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 5: Mood-Based Serenity (Filter Tabs + Horizontal Shelf) */}
      <section className="flex flex-col gap-4 border-t border-neutral-900/50 pt-8">
        <div className="flex items-center gap-2 px-1">
          <Smile className="text-spotify-green" size={20} />
          <h3 className="text-xl font-bold tracking-tight text-white font-outfit">Based on Your Mood</h3>
        </div>

        {/* Mood switcher tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 border-b border-neutral-900">
          {moodTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMood(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center cursor-pointer select-none whitespace-nowrap border ${
                activeMood === tab.id
                  ? 'bg-white text-black border-white font-extrabold shadow-md'
                  : 'bg-neutral-900/50 text-neutral-300 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Mood shelf tracks list */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4 mt-2">
          {moodTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track, moodTracks)}
                className="group bg-neutral-900/20 hover:bg-neutral-800/40 p-3.5 rounded-xl border border-neutral-900/40 hover:border-neutral-800/80 cursor-pointer transition-all duration-300 flex items-center gap-3.5 glassmorphism"
              >
                <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-950 shadow-md">
                  <img
                    src={track.image}
                    alt={track.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    {isCurrent && isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5.5 h-5.5 text-spotify-green">
                        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <Play size={14} fill="currentColor" className="text-white translate-x-[0.5px]" />
                    )}
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
      </section>

      {/* SECTION 6: Top Artists (Circular Cards) */}
      {topArtists.length > 0 && (
        <section className="flex flex-col gap-4 border-t border-neutral-900/50 pt-8">
          <div className="flex items-center gap-2 px-1">
            <User className="text-spotify-green" size={20} />
            <h3 className="text-xl font-bold tracking-tight text-white font-outfit">Your Top Artists</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {topArtists.map((art, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSearchQuery(art.name);
                  setActiveView('search');
                }}
                className="group bg-neutral-900/20 hover:bg-neutral-800/30 border border-neutral-800/40 hover:border-neutral-700/50 rounded-xl p-4 flex flex-col items-center text-center cursor-pointer transition-all duration-300 glassmorphism select-none"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border border-white/5 shadow-lg relative">
                  <img 
                    src={art.image} 
                    alt={art.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="font-extrabold text-xs text-white truncate max-w-full leading-normal">
                  {art.name}
                </span>
                <span className="text-[9px] text-neutral-400 mt-1 uppercase font-bold bg-neutral-950/40 px-2 py-0.2 rounded border border-neutral-900 scale-95">{art.plays > 100 ? 'Preset' : `${art.plays} plays`}</span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
