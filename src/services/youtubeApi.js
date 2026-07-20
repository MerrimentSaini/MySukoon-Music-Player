/**
 * YouTube Data API v3 Service Layer
 */

const CACHE_PREFIX = 'mysukoon_yt_cache_';
const CACHE_TTL = 1000 * 60 * 10; // Cache YouTube results for 10 minutes

/**
 * Get YouTube API key from local storage or environment variables
 */
export const getYoutubeApiKey = () => {
  return localStorage.getItem('mysukoon_youtube_api_key') || import.meta.env.VITE_YOUTUBE_API_KEY || '';
};

/**
 * Decode HTML entities commonly returned by YouTube API (like &amp;, &quot;, &#39;, etc.)
 */
const decodeHtmlEntities = (str) => {
  if (!str) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
};

/**
 * Check if the search query contains Indian/Bollywood music keywords
 */
export const isIndianQuery = (query) => {
  if (!query) return false;
  const lower = query.toLowerCase().trim();
  const indianKeywords = [
    'hindi', 'bollywood', 'punjabi', 'indian', 'arijit', 'kk', 'atif', 'shreya',
    'sonu nigam', 'neha kakkar', 'jubin', 'sunidhi', 'badshah', 'darshan raval',
    'armaan malik', 'sidhu moosewala', 'diljit', 'honey singh', 'kishore kumar',
    'lata mangeshkar', 'mohd rafi', 'asha bhosle', 'udit narayan', 'alka yagnik',
    'kumar sanu', 'shaan', 'himesh', 'pritam', 'rahman', 'ar rahman', 'anirudh',
    'ankit tiwari', 'divine', 'mc stan', 'raftaar', 'b praak', 'jaani',
    'guru randhawa', 'harrdy sandhu', 'jass manak', 'vishal dadlani', 'shekhar',
    'amit trivedi', 'sukhwinder', 'mohammad rafi', 'lata', 'kishore', 'aslam',
    'ghoshal', 'nigam', 'nautiyal', 't-series', 'saregama', 'zeemusic', 'yrf'
  ];
  return indianKeywords.some(kw => lower.includes(kw));
};

/**
 * Enhance query terms for rich Indian music results
 */
export const enhanceYoutubeQuery = (query) => {
  if (!query) return '';
  const lower = query.trim().toLowerCase();

  // If search query is just an artist name, append "songs" or "music" to guide search
  const artistNames = ['arijit', 'arijit singh', 'kk', 'atif', 'atif aslam', 'shreya', 'shreya ghoshal', 'sonu nigam', 'jubin', 'jubin nautiyal', 'kishore kumar', 'lata mangeshkar', 'mohd rafi'];
  if (artistNames.includes(lower)) {
    return `${query} songs`;
  }

  return query;
};

/**
 * Calculate relevance scoring for Indian music videos
 * Prefers official tracks, audio, lyrics, and filters out reaction/vlog content
 */
const calculateMusicRelevance = (title, channel, description) => {
  const text = `${title} ${channel} ${description || ''}`.toLowerCase();
  let score = 0;

  // Keyword scoring
  if (text.includes('official song') || text.includes('official music video') || text.includes('official video')) score += 150;
  if (text.includes('audio') || text.includes('full audio') || text.includes('lyric')) score += 100;
  if (text.includes('bollywood')) score += 60;
  if (text.includes('hindi')) score += 55;
  if (text.includes('punjabi')) score += 50;

  // Prominent Indian music label channels
  const labels = ['t-series', 'sony music', 'zee music', 'yash raj', 'yrf', 'tips', 'saregama', 'speed records', 'tseries'];
  if (labels.some(lbl => text.includes(lbl))) {
    score += 80;
  }

  return score;
};

/**
 * Query YouTube Data API v3 for video search
 */
export const searchYoutube = async (query) => {
  if (!query || query.trim() === '') return [];

  const apiKey = getYoutubeApiKey();
  const enhancedQuery = enhanceYoutubeQuery(query);
  const cacheKey = `${CACHE_PREFIX}${encodeURIComponent(enhancedQuery.toLowerCase())}`;

  // Check cache
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log('[YouTube Service] Serving cached results for query:', enhancedQuery);
        return data;
      }
    } catch (e) {
      console.warn('[YouTube Service] Failed to read from localStorage cache:', e);
    }
  }

  let filteredTracks = [];
  let fetchedFromOfficial = false;

  if (apiKey) {
    try {
      console.log('[YouTube Service] Attempting search via official YouTube Data API...');
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(enhancedQuery)}&type=video&videoCategoryId=10&maxResults=20&key=${apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        const rawItems = result.items || [];
        fetchedFromOfficial = true;

        const filterKeywords = [
          'shorts', 'podcast', 'interview', 'reaction', 'reacting', 'reacts', 'live', 
          'vlog', 'behind the scenes', 'bts', 'teaser', 'trailer', 'review', 'roast', 
          'unboxing', 'tutorial', 'how to', 'compilation', 'non-stop', 'non stop', 
          'jukebox', '1 hour', '1hour', '10 hours', '10hours', 'loop'
        ];

        filteredTracks = rawItems
          .map(item => {
            const videoId = item.id.videoId;
            const title = decodeHtmlEntities(item.snippet.title);
            const channel = item.snippet.channelTitle;
            const description = item.snippet.description || '';
            
            const fullText = `${title} ${channel} ${description}`.toLowerCase();
            const isFiltered = filterKeywords.some(kw => fullText.includes(kw));

            if (isFiltered) {
              return null;
            }

            return {
              id: `yt_${videoId}`,
              videoId: videoId,
              name: title,
              artist_name: channel,
              album_name: 'From YouTube',
              image: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
              audio: null,
              duration: 240,
              isYouTube: true,
              source: 'YouTube',
              relevanceScore: calculateMusicRelevance(title, channel, description)
            };
          })
          .filter(Boolean);

        filteredTracks.sort((a, b) => b.relevanceScore - a.relevanceScore);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || `HTTP error! status: ${response.status}`;
        console.warn(`[YouTube Service] Official YouTube API limit exceeded or error received: ${message}. Using proxy fallback...`);
      }
    } catch (err) {
      console.warn('[YouTube Service] Official YouTube API error. Using proxy fallback...', err);
    }
  } else {
    console.log('[YouTube Service] No YouTube API key configured. Using proxy search...');
  }

  // Fallback to Express Proxy Scraper
  if (!fetchedFromOfficial) {
    try {
      console.log('[YouTube Service] Fetching search results from local proxy server...');
      const proxyUrl = `http://localhost:5000/api/youtube-search?query=${encodeURIComponent(enhancedQuery)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Proxy returned status ${response.status}`);
      }
      const rawItems = await response.json();
      
      filteredTracks = rawItems.map(item => ({
        ...item,
        relevanceScore: calculateMusicRelevance(item.name, item.artist_name, '')
      }));

      filteredTracks.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (proxyErr) {
      console.error('[YouTube Service] Proxy YouTube search fallback failed:', proxyErr);
      throw new Error('Unable to search YouTube. Backend proxy server is offline or unavailable.');
    }
  }

  // Save to cache
  if (filteredTracks.length > 0) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: filteredTracks,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('[YouTube Service] Failed to write to localStorage cache:', e);
    }
  }

  return filteredTracks;
};
