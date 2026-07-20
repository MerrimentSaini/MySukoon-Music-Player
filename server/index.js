import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS securely for our React frontend (running on 5173 usually)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range']
}));

app.use(express.json());

// Jamendo API Constants
const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0';

/**
 * Retrieve API client ID safely, supporting dynamic client-side overrides
 */
const getClientId = (req) => {
  return req.query.client_id || req.headers['x-jamendo-client-id'] || process.env.JAMENDO_CLIENT_ID || '709fa152';
};

// Logging helper
const logRequest = (route, params) => {
  console.log(`[${new Date().toISOString()}] GET ${route} - Parameters:`, { ...params, client_id: '***' });
};

/**
 * --- ENDPOINT: TRENDING MUSIC ---
 */
app.get('/api/trending', async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  logRequest('/api/trending', { limit, offset });

  try {
    const params = new URLSearchParams({
      client_id: getClientId(req),
      format: 'json',
      limit,
      offset,
      order: 'popularity_total',
      audioformat: 'mp31', // 128kbps full stream format
      include: 'musicinfo'
    });

    const url = `${JAMENDO_BASE_URL}/tracks/?${params.toString()}`;
    const response = await axios.get(url);
    
    if (response.data?.headers?.status === 'failed') {
      return res.status(400).json({ error: response.data.headers.error_message });
    }

    res.json(response.data.results || []);
  } catch (error) {
    console.error('Trending API Proxy Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch trending tracks from Jamendo' });
  }
});

/**
 * --- ENDPOINT: SEARCH MUSIC ---
 */
app.get('/api/search', async (req, res) => {
  const { query, type = 'all', limit = 20, offset = 0 } = req.query;
  logRequest('/api/search', { query, type, limit, offset });

  if (!query) {
    return res.json([]);
  }

  try {
    const params = {
      client_id: getClientId(req),
      format: 'json',
      limit,
      offset,
      order: 'relevance',
      audioformat: 'mp31',
      include: 'musicinfo'
    };

    if (type === 'songs') {
      params.namesearch = query;
    } else if (type === 'artists') {
      params.artist_name = query;
    } else if (type === 'albums') {
      params.album_name = query;
    } else {
      params.search = query;
    }

    const url = `${JAMENDO_BASE_URL}/tracks/?${new URLSearchParams(params).toString()}`;
    const response = await axios.get(url);

    if (response.data?.headers?.status === 'failed') {
      return res.status(400).json({ error: response.data.headers.error_message });
    }

    res.json(response.data.results || []);
  } catch (error) {
    console.error('Search API Proxy Error:', error.message);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

/**
 * --- ENDPOINT: CATEGORY GENRES ---
 */
app.get('/api/category', async (req, res) => {
  const { tag, limit = 20, offset = 0 } = req.query;
  logRequest('/api/category', { tag, limit, offset });

  if (!tag) {
    return res.status(400).json({ error: 'Category tag parameter is required' });
  }

  try {
    const params = new URLSearchParams({
      client_id: getClientId(req),
      format: 'json',
      limit,
      offset,
      tag: tag.toLowerCase(),
      order: 'popularity_total',
      audioformat: 'mp31',
      include: 'musicinfo'
    });

    const url = `${JAMENDO_BASE_URL}/tracks/?${params.toString()}`;
    const response = await axios.get(url);

    if (response.data?.headers?.status === 'failed') {
      return res.status(400).json({ error: response.data.headers.error_message });
    }

    res.json(response.data.results || []);
  } catch (error) {
    console.error('Category API Proxy Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch category tracks' });
  }
});

/**
 * --- ENDPOINT: HIGH PERFORMANCE BINARY AUDIO STREAM PROXY ---
 * Fetches audio bytes from Jamendo CDN and streams them to resolve CORS and blocked download limits.
 */
app.get('/api/stream', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).send('Audio stream URL parameter is required');
  }

  try {
    console.log(`[Stream Proxy] Fetching audio stream: ${url.slice(0, 60)}...`);

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Referer': 'https://api.jamendo.com/'
    };
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
      console.log(`[Stream Proxy] Forwarding Range: ${req.headers.range}`);
    }

    // Stream GET request to Jamendo CDN
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      headers: headers
    });

    // Forward crucial audio headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mpeg');
    
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    
    if (response.headers['accept-ranges']) {
      res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
    }

    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range']);
    }

    res.status(response.status);

    // Pipe audio bits directly to Express response
    response.data.pipe(res);

    // Clean up if browser cancels or drops request midway
    req.on('close', () => {
      console.log('[Stream Proxy] Connection closed by browser client.');
      response.data.destroy();
    });

  } catch (error) {
    console.error('[Stream Proxy Error] Streaming failed:', error.message);
    
    if (error.response) {
      res.status(error.response.status).send(`Failed fetching audio stream: ${error.message}`);
    } else {
      res.status(500).send('Internal audio streaming error');
    }
  }
});

/**
 * --- ENDPOINT: YOUTUBE SEARCH FALLBACK ---
 * Fetches search results from public YouTube search page without requiring API Key
 */
app.get('/api/youtube-search', async (req, res) => {
  const { query } = req.query;
  logRequest('/api/youtube-search', { query });

  if (!query) {
    return res.json([]);
  }

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = response.data;
    let jsonStr = '';
    const match = html.match(/ytInitialData\s*=\s*({.+?});/);
    if (match) {
      jsonStr = match[1];
    } else {
      const altMatch = html.match(/ytInitialData\s*=\s*({.+?})[;<\n]/);
      if (altMatch) {
        jsonStr = altMatch[1];
      }
    }

    if (!jsonStr) {
      console.warn('[YouTube Proxy] Could not extract ytInitialData from HTML');
      return res.json([]);
    }

    const data = JSON.parse(jsonStr);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    
    const videos = [];
    for (const content of contents) {
      const itemSection = content.itemSectionRenderer;
      if (!itemSection) continue;
      
      for (const item of itemSection.contents || []) {
        const video = item.videoRenderer;
        if (!video) continue;
        
        const videoId = video.videoId;
        const title = video.title?.runs?.[0]?.text || video.title?.accessibility?.accessibilityData?.label;
        const channelName = video.ownerText?.runs?.[0]?.text;
        const durationText = video.lengthText?.simpleText || '';
        const thumbnails = video.thumbnail?.thumbnails || [];
        const imageUrl = thumbnails[thumbnails.length - 1]?.url || '';
        
        let durationSecs = 240;
        if (durationText) {
          const parts = durationText.split(':').map(Number);
          if (parts.length === 2) {
            durationSecs = parts[0] * 60 + parts[1];
          } else if (parts.length === 3) {
            durationSecs = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        }

        videos.push({
          id: `yt_${videoId}`,
          videoId: videoId,
          name: title,
          artist_name: channelName,
          album_name: 'From YouTube',
          image: imageUrl,
          audio: null,
          duration: durationSecs,
          isYouTube: true,
          source: 'YouTube'
        });
      }
    }

    res.json(videos);
  } catch (error) {
    console.error('YouTube Proxy Search Error:', error.message);
    res.status(500).json({ error: 'Failed to search YouTube videos via proxy' });
  }
});

// Boot Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  MySukoon CORS Proxy Server active on port ${PORT}`);
  console.log(`  Listening for client requests at: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
