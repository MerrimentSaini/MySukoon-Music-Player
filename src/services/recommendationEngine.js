/**
 * MySukoon Spotify-level AI Recommendation and Data-Tracking Engine
 */

// Preset avatars / images
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

// Fallback high-fidelity curated datasets for Mood-Based streaming (using valid YouTube Video IDs)
export const MOOD_FALLBACKS = {
  chill: [
    {
      id: 'yt_tu_hai_kahan',
      videoId: 'A53SgSiaG0M',
      name: 'Tu Hai Kahan',
      artist_name: 'AUR',
      album_name: 'Tu Hai Kahan Single',
      image: 'https://img.youtube.com/vi/A53SgSiaG0M/mqdefault.jpg',
      duration: 263,
      isYouTube: true,
      source: 'YouTube',
      genre: 'bollywood',
      mood: 'chill',
      language: 'hindi'
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
      source: 'YouTube',
      genre: 'bollywood',
      mood: 'chill',
      language: 'hindi'
    },
    {
      id: 'yt_choo_lo',
      videoId: 'qLCLvzTFVMs',
      name: 'Choo Lo',
      artist_name: 'The Local Train',
      album_name: 'Aalas Ka Pedh',
      image: 'https://img.youtube.com/vi/qLCLvzTFVMs/mqdefault.jpg',
      duration: 233,
      isYouTube: true,
      source: 'YouTube',
      genre: 'indie',
      mood: 'chill',
      language: 'hindi'
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
      source: 'YouTube',
      genre: 'bollywood',
      mood: 'chill',
      language: 'hindi'
    }
  ],
  sad: [
    {
      id: 'yt_agar_tum_saath_ho',
      videoId: 'sK7riqg2mr4',
      name: 'Agar Tum Saath Ho',
      artist_name: 'Alka Yagnik, Arijit Singh',
      album_name: 'Tamasha',
      image: 'https://img.youtube.com/vi/sK7riqg2mr4/mqdefault.jpg',
      duration: 341,
      isYouTube: true,
      source: 'YouTube',
      genre: 'bollywood',
      mood: 'sad',
      language: 'hindi'
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
      source: 'YouTube',
      genre: 'bollywood',
      mood: 'sad',
      language: 'hindi'
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
      source: 'YouTube',
      genre: 'bollywood',
      mood: 'sad',
      language: 'hindi'
    },
    {
      id: 'yt_kabira',
      videoId: 'jHNNMj5bNQw',
      name: 'Kabira',
      artist_name: 'Tochi Raina, Rekha Bhardwaj',
      album_name: 'Yeh Jawaani Hai Deewani',
      image: 'https://img.youtube.com/vi/jHNNMj5bNQw/mqdefault.jpg',
      duration: 251,
      isYouTube: true,
      source: 'YouTube',
      genre: 'bollywood',
      mood: 'sad',
      language: 'hindi'
    }
  ],
  workout: [
    {
      id: 'yt_zinda',
      videoId: '13yI9T4N2nE',
      name: 'Zinda',
      artist_name: 'Siddharth Mahadevan',
      album_name: 'Bhaag Milkha Bhaag',
      image: 'https://img.youtube.com/vi/13yI9T4N2nE/mqdefault.jpg',
      duration: 211,
      isYouTube: true,
      source: 'YouTube',
      genre: 'rock',
      mood: 'workout',
      language: 'hindi'
    },
    {
      id: 'yt_kar_har_maidaan',
      videoId: 'RCd7hK_vD2k',
      name: 'Kar Har Maidaan Fateh',
      artist_name: 'Sukhwinder Singh, Shreya Ghoshal',
      album_name: 'Sanju',
      image: 'https://img.youtube.com/vi/RCd7hK_vD2k/mqdefault.jpg',
      duration: 311,
      isYouTube: true,
      source: 'YouTube',
      genre: 'bollywood',
      mood: 'workout',
      language: 'hindi'
    },
    {
      id: 'yt_chak_de',
      videoId: 'OQ06d6iMhio',
      name: 'Chak De India',
      artist_name: 'Sukhwinder Singh, Salim-Sulaiman',
      album_name: 'Chak De! India',
      image: 'https://img.youtube.com/vi/OQ06d6iMhio/mqdefault.jpg',
      duration: 283,
      isYouTube: true,
      source: 'YouTube',
      genre: 'bollywood',
      mood: 'workout',
      language: 'hindi'
    }
  ],
  focus: [
    {
      id: 'yt_lofi_focus_1',
      videoId: '5Eqb_-j3FDA',
      name: 'Serene Acoustic Guitar Lofi',
      artist_name: 'Lofi Chill Master',
      album_name: 'Lofi Beats',
      image: 'https://img.youtube.com/vi/5Eqb_-j3FDA/mqdefault.jpg',
      duration: 240,
      isYouTube: true,
      source: 'YouTube',
      genre: 'lofi',
      mood: 'focus',
      language: 'instrumental'
    },
    {
      id: 'yt_lofi_focus_2',
      videoId: 'yM04e8d_9K8',
      name: 'Chill Study Beats Session',
      artist_name: 'Lofi Focus Lounge',
      album_name: 'Study Session',
      image: 'https://img.youtube.com/vi/yM04e8d_9K8/mqdefault.jpg',
      duration: 310,
      isYouTube: true,
      source: 'YouTube',
      genre: 'lofi',
      mood: 'focus',
      language: 'instrumental'
    },
    {
      id: 'yt_lofi_focus_3',
      videoId: 'W9W_w0d2cM0',
      name: 'Rainy Night Lofi Ambient',
      artist_name: 'Rain Ambient Study',
      album_name: 'Ambient Focus',
      image: 'https://img.youtube.com/vi/W9W_w0d2cM0/mqdefault.jpg',
      duration: 280,
      isYouTube: true,
      source: 'YouTube',
      genre: 'lofi',
      mood: 'focus',
      language: 'instrumental'
    }
  ]
};

/**
 * 2. AUTO TAGGING SYSTEM
 * Parses song metadata to dynamically assign Genre, Mood, and Language.
 */
export const tagSong = (track) => {
  if (!track) return { genre: 'pop', mood: 'chill', language: 'english' };

  // If already tagged, respect current tags
  if (track.genre && track.mood && track.language) {
    return {
      genre: track.genre,
      mood: track.mood,
      language: track.language
    };
  }

  const title = (track.name || track.title || '').toLowerCase();
  const artist = (track.artist_name || track.artist || '').toLowerCase();
  const metaText = `${title} ${artist}`.trim();

  let genre = 'pop';
  let mood = 'chill';
  let language = 'english';

  // Indian / Bollywood / Punjabi Matchers
  const isIndianArtist = [
    'arijit', 'shreya', 'kk', 'sonu', 'atif', 'jubin', 'sunidhi', 'darshan', 
    'armaan', 'badshah', 'sidhu', 'diljit', 'honey', 'kishore', 'lata', 'rafi', 
    'asha', 'udit', 'alka', 'kumar sanu', 'shaan', 'himesh', 'pritam', 'rahman', 
    'anirudh', 'mishra', 'jaani', 'b praak', 't-series', 'saregama', 'zeemusic'
  ].some(kw => metaText.includes(kw));

  const isHindiWord = [
    'tum', 'dil', 'hai', 'ki', 'ka', 'se', 'ko', 'meri', 'tere', 'mohabbat', 
    'ishq', 'pyaar', 'zindagi', 'sufi', 'naa', 'kahan', 'meri', 'o maahi', 'raataan',
    'kesariya', 'heeriye', 'bana', 'bheji', 'khuda', 'yaar'
  ].some(kw => title.split(/\s+/).includes(kw));

  if (isIndianArtist || isHindiWord || metaText.includes('hindi') || metaText.includes('bollywood')) {
    genre = 'bollywood';
    language = 'hindi';
    mood = 'romantic';

    if (metaText.includes('sad') || metaText.includes('dard') || metaText.includes('judai') || metaText.includes('channa') || metaText.includes('kabira')) {
      mood = 'sad';
    } else if (metaText.includes('remix') || metaText.includes('dj') || metaText.includes('dance') || metaText.includes('party') || metaText.includes('badshah') || metaText.includes('honey')) {
      mood = 'party';
    }
  }

  if (metaText.includes('punjabi') || metaText.includes('diljit') || metaText.includes('sidhu') || metaText.includes('moosewala') || metaText.includes('guru randhawa')) {
    genre = 'bollywood';
    language = 'punjabi';
    mood = 'party';
  }

  // Lofi / Chill / Focus Matchers
  if (metaText.includes('lofi') || metaText.includes('lo-fi') || metaText.includes('study') || metaText.includes('sleep') || metaText.includes('calm') || metaText.includes('ambient') || metaText.includes('relax')) {
    genre = 'lofi';
    mood = 'focus';
    if (metaText.includes('instrumental') || metaText.includes('guitar') || metaText.includes('piano') || !isIndianArtist) {
      language = 'instrumental';
    }
    if (metaText.includes('chill')) {
      mood = 'chill';
    }
  }

  // Acoustic / Indie Matchers
  if (metaText.includes('acoustic') || metaText.includes('guitar') || metaText.includes('piano') || metaText.includes('indie') || metaText.includes('unplugged')) {
    genre = 'indie';
    mood = 'chill';
  }

  // Workout Matchers
  if (metaText.includes('workout') || metaText.includes('gym') || metaText.includes('motivational') || metaText.includes('energetic') || metaText.includes('zinda') || metaText.includes('chak de')) {
    mood = 'workout';
  }

  return { genre, mood, language };
};

/**
 * 1. USER DATA TRACKING & HISTORICAL DB
 */
export const getHistoryData = () => {
  try {
    const plays = JSON.parse(localStorage.getItem('mysukoon_history_plays') || '{}');
    const skips = JSON.parse(localStorage.getItem('mysukoon_history_skips') || '{}');
    const artists = JSON.parse(localStorage.getItem('mysukoon_history_artists') || '{}');
    const genres = JSON.parse(localStorage.getItem('mysukoon_history_genres') || '{}');
    const moods = JSON.parse(localStorage.getItem('mysukoon_history_moods') || '{}');
    const recent = JSON.parse(localStorage.getItem('mysukoon_history_recent') || '[]');
    const searches = JSON.parse(localStorage.getItem('mysukoon_history_search') || '[]');

    return { plays, skips, artists, genres, moods, recent, searches };
  } catch (e) {
    console.error('[AI Engine] Failed loading localStorage records:', e);
    return { plays: {}, skips: {}, artists: {}, genres: {}, moods: {}, recent: [], searches: [] };
  }
};

/**
 * Track track playback start
 */
export const trackPlay = (track) => {
  if (!track) return;
  try {
    const tags = tagSong(track);
    const history = getHistoryData();

    // 1. Increment Play count
    const trackId = track.id;
    history.plays[trackId] = (history.plays[trackId] || 0) + 1;

    // 2. Weighted preferences
    const artist = track.artist_name;
    if (artist) {
      history.artists[artist] = (history.artists[artist] || 0) + 1;
    }
    if (tags.genre) {
      history.genres[tags.genre] = (history.genres[tags.genre] || 0) + 1;
    }
    if (tags.mood) {
      history.moods[tags.mood] = (history.moods[tags.mood] || 0) + 1;
    }

    // 3. Add to recently played (unique items list)
    // We store the track with its tags included
    const enrichedTrack = { ...track, ...tags };
    const filteredRecent = history.recent.filter(t => t.id !== trackId);
    history.recent = [enrichedTrack, ...filteredRecent].slice(0, 15); // Cap at 15 items

    // Save records
    localStorage.setItem('mysukoon_history_plays', JSON.stringify(history.plays));
    localStorage.setItem('mysukoon_history_artists', JSON.stringify(history.artists));
    localStorage.setItem('mysukoon_history_genres', JSON.stringify(history.genres));
    localStorage.setItem('mysukoon_history_moods', JSON.stringify(history.moods));
    localStorage.setItem('mysukoon_history_recent', JSON.stringify(history.recent));
    localStorage.setItem('mysukoon_recently_played', JSON.stringify(history.recent));
    localStorage.setItem('mysukoon_history', JSON.stringify(history.recent));
    
    // Dispatch a storage update trigger
    window.dispatchEvent(new Event('storage_update'));
  } catch (e) {
    console.error('[AI Engine] Track play logging failed:', e);
  }
};

/**
 * Track track skip
 */
export const trackSkip = (track) => {
  if (!track) return;
  try {
    const history = getHistoryData();
    const trackId = track.id;
    history.skips[trackId] = (history.skips[trackId] || 0) + 1;
    
    localStorage.setItem('mysukoon_history_skips', JSON.stringify(history.skips));
  } catch (e) {
    console.error('[AI Engine] Track skip logging failed:', e);
  }
};

/**
 * Track search queries
 */
export const trackSearch = (query) => {
  if (!query || query.trim() === '') return;
  try {
    const history = getHistoryData();
    const term = query.trim();
    const filtered = history.searches.filter(q => q.toLowerCase() !== term.toLowerCase());
    const updated = [term, ...filtered].slice(0, 8); // Cap at 8

    localStorage.setItem('mysukoon_history_search', JSON.stringify(updated));
  } catch (e) {
    console.error('[AI Engine] Search logging failed:', e);
  }
};

/**
 * 4. CORE RECOMMENDATION RANKER
 * Formula: Score = (genre match * 5) + (artist match * 4) + (recently played bonus * 3) - (skipped * 6)
 */
export const calculateScore = (track, history) => {
  if (!track) return 0;
  const tags = tagSong(track);

  let score = 0;

  // 1. Genre match preference
  if (tags.genre && history.genres[tags.genre]) {
    score += history.genres[tags.genre] * 5;
  }

  // 2. Artist match preference
  if (track.artist_name && history.artists[track.artist_name]) {
    score += history.artists[track.artist_name] * 4;
  }

  // 3. Mood match preference
  if (tags.mood && history.moods[tags.mood]) {
    score += history.moods[tags.mood] * 3;
  }

  // 4. Boost plays
  if (history.plays[track.id]) {
    score += history.plays[track.id] * 2;
  }

  // 5. Heavy penalty for skips
  if (history.skips[track.id]) {
    score -= history.skips[track.id] * 6;
  }

  // 6. Recency played bonus (preferred but don't play immediately again)
  const isRecentIndex = history.recent.findIndex(t => t.id === track.id);
  if (isRecentIndex !== -1) {
    // If it's recently played, we add some points, but if it is in the first 4-5 tracks, we penalize it slightly to promote discovery
    if (isRecentIndex < 5) {
      score -= 15;
    } else {
      score += 10;
    }
  }

  return score;
};

/**
 * 3. RECOMMENDATION ENGINE SOLVERS
 */
export const getRecommendations = (poolTracks = [], count = 12) => {
  const history = getHistoryData();
  
  // Combine custom presets and poolTracks to ensure a rich selection
  const customPool = [
    ...MOOD_FALLBACKS.chill,
    ...MOOD_FALLBACKS.sad,
    ...MOOD_FALLBACKS.workout,
    ...MOOD_FALLBACKS.focus,
    ...poolTracks
  ];

  // De-duplicate the selection pool based on track ID
  const uniquePoolMap = new Map();
  customPool.forEach(track => {
    uniquePoolMap.set(track.id, track);
  });
  const uniquePool = Array.from(uniquePoolMap.values());

  // Map each track to include its auto-tags, calculate score, and sort
  const scoredTracks = uniquePool.map(track => {
    const tags = tagSong(track);
    const enriched = { ...track, ...tags };
    const score = calculateScore(enriched, history);
    return { ...enriched, aiScore: score };
  });

  // Sort by score descending
  scoredTracks.sort((a, b) => b.aiScore - a.aiScore);

  return scoredTracks.slice(0, count);
};

/**
 * 5. AUTOPLAY AI ALGORITHM
 * Picks next song based on highest score, avoiding last 5 songs, prioritizing same mood/artist
 */
export const solveNextAutoplay = (currentTrack, queue = [], historyPool = []) => {
  const history = getHistoryData();
  const tags = tagSong(currentTrack);

  // Blacklist: Last 5 played songs from recent history + active current track
  const blacklistIds = new Set([
    ...(currentTrack ? [currentTrack.id] : []),
    ...history.recent.slice(0, 5).map(t => t.id)
  ]);

  // Combine queue and custom fallback pool as candidates
  const candidates = [
    ...queue,
    ...MOOD_FALLBACKS.chill,
    ...MOOD_FALLBACKS.sad,
    ...MOOD_FALLBACKS.workout,
    ...MOOD_FALLBACKS.focus,
    ...historyPool
  ];

  // De-duplicate candidates and filter out blacklisted IDs
  const uniqueCandidatesMap = new Map();
  candidates.forEach(c => {
    if (c && !blacklistIds.has(c.id)) {
      uniqueCandidatesMap.set(c.id, c);
    }
  });
  const activeCandidates = Array.from(uniqueCandidatesMap.values());

  if (activeCandidates.length === 0) {
    // If no candidate survives blacklist, fallback to any mood song outside current
    const absoluteFallback = [...MOOD_FALLBACKS.chill, ...MOOD_FALLBACKS.sad].filter(c => c.id !== currentTrack?.id);
    return absoluteFallback[Math.floor(Math.random() * absoluteFallback.length)];
  }

  // Score each candidate
  const scoredCandidates = activeCandidates.map(c => {
    const cTags = tagSong(c);
    const enriched = { ...c, ...cTags };
    let score = calculateScore(enriched, history);

    // Contextual boost (Autoplay prioritizes same mood/artist)
    if (currentTrack) {
      if (enriched.artist_name === currentTrack.artist_name) {
        score += 15; // heavy boost same artist
      }
      if (cTags.mood === tags.mood) {
        score += 10; // boost same mood
      }
      if (cTags.genre === tags.genre) {
        score += 8; // boost same genre
      }
    }

    return { ...enriched, autoplayScore: score };
  });

  // Sort descending
  scoredCandidates.sort((a, b) => b.autoplayScore - a.autoplayScore);

  console.log('[AI Engine] Autoplay next ranked candidates:', scoredCandidates.slice(0, 3).map(s => `${s.name} (${s.autoplayScore})`));
  return scoredCandidates[0];
};

/**
 * 6. TOP ARTISTS SOLVER
 * Extracts the user's most frequently played artists based on play counts
 */
export const getTopArtists = (count = 5) => {
  const history = getHistoryData();
  const artistCounts = history.artists;

  const sortedArtists = Object.keys(artistCounts).map(name => ({
    name,
    plays: artistCounts[name]
  }));

  sortedArtists.sort((a, b) => b.plays - a.plays);

  // High quality presets to display initially if history is empty
  const presets = [
    { name: 'Arijit Singh', plays: 100, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
    { name: 'Shreya Ghoshal', plays: 90, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
    { name: 'Kishore Kumar', plays: 80, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
    { name: 'Lata Mangeshkar', plays: 70, image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80' }
  ];

  if (sortedArtists.length === 0) {
    return presets.slice(0, count);
  }

  // Map user played artists, combining with preset placeholders for visuals
  return sortedArtists.slice(0, count).map((art, idx) => {
    const presetMatch = presets.find(p => p.name.toLowerCase() === art.name.toLowerCase());
    return {
      name: art.name,
      plays: art.plays,
      image: presetMatch?.image || presets[idx % presets.length].image
    };
  });
};
