/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getStreamUrl } from '../services/jamendoApi';
import { trackPlay, trackSkip, solveNextAutoplay } from '../services/recommendationEngine';
import { getDownloadFromDB } from '../services/db';
import { useStorage } from './StorageContext';

const AudioContext = createContext(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const { showToast } = useStorage();

  // Global native audio element reference
  const audioRef = useRef(new Audio());
  
  // Track retries dynamically to prevent infinite loops
  const retryCountRef = useRef(0);

  // YouTube player references
  const ytPlayerRef = useRef(null);
  const [, setIsYtReady] = useState(false);
  const pendingVideoIdRef = useRef(null);
  const pendingVideoAutoplayRef = useRef(true);
  
  // States - Restore state from localStorage for Resume Playback
  const [currentTrack, setCurrentTrack] = useState(() => {
    try {
      const saved = localStorage.getItem('mysukoon_last_played_track');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => {
    const saved = localStorage.getItem('mysukoon_playback_position');
    return saved ? parseFloat(saved) : 0;
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('mysukoon_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isShuffle, setIsShuffle] = useState(() => {
    return localStorage.getItem('mysukoon_shuffle_mode') === 'true';
  });
  const [isRepeat, setIsRepeat] = useState(() => {
    return localStorage.getItem('mysukoon_repeat_mode') || 'none';
  });
  const [queue, setQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('mysukoon_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [queueIndex, setQueueIndex] = useState(() => {
    const saved = localStorage.getItem('mysukoon_queue_index');
    return saved ? parseInt(saved, 10) : -1;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // References to keep lexical state fresh inside event callbacks
  const stateRef = useRef({
    queue: [],
    queueIndex: -1,
    isShuffle: false,
    isRepeat: 'none',
    currentTrack: null,
    playbackSpeed: 1.0,
    volume: 0.8,
    isMuted: false,
    currentTime: 0
  });

  useEffect(() => {
    stateRef.current = {
      queue,
      queueIndex,
      isShuffle,
      isRepeat,
      currentTrack,
      playbackSpeed,
      volume,
      isMuted,
      currentTime
    };
  });

  // Track Object URL for downloads to avoid memory leaks
  const objectUrlRef = useRef(null);

  // Dynamic Audio Source Resolver (Offline vs Online)
  const resolveTrackAudioSrc = async (track) => {
    if (!track) return '';
    try {
      const downloaded = await getDownloadFromDB(track.id);
      if (downloaded && downloaded.audioBlob) {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        const objUrl = URL.createObjectURL(downloaded.audioBlob);
        objectUrlRef.current = objUrl;
        console.log('[Audio Engine] Playing offline downloaded version for:', track.name);
        return objUrl;
      }
    } catch (e) {
      console.warn('[Audio Engine] Failed to load offline downloaded song:', e);
    }
    return getStreamUrl(track.audio);
  };

  // Sync state values to localStorage
  useEffect(() => {
    localStorage.setItem('mysukoon_volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('mysukoon_repeat_mode', isRepeat);
  }, [isRepeat]);

  useEffect(() => {
    localStorage.setItem('mysukoon_shuffle_mode', isShuffle.toString());
  }, [isShuffle]);

  useEffect(() => {
    localStorage.setItem('mysukoon_queue', JSON.stringify(queue));
    localStorage.setItem('mysukoon_queue_index', queueIndex.toString());
  }, [queue, queueIndex]);

  useEffect(() => {
    if (currentTrack) {
      localStorage.setItem('mysukoon_last_played_track', JSON.stringify(currentTrack));
    } else {
      localStorage.removeItem('mysukoon_last_played_track');
      localStorage.removeItem('mysukoon_playback_position');
    }
  }, [currentTrack]);

  // Position saving throttle helper
  const lastSavedTimeRef = useRef(0);
  const savePlaybackPosition = (time) => {
    if (Math.abs(time - lastSavedTimeRef.current) > 2) {
      localStorage.setItem('mysukoon_playback_position', time.toString());
      lastSavedTimeRef.current = time;
    }
  };

  // Initialize cross-origin permissions
  useEffect(() => {
    audioRef.current.crossOrigin = "anonymous";
  }, []);

  // --- YouTube Player Lifecycle Setup ---
  const initYoutubePlayer = () => {
    if (ytPlayerRef.current) return;
    const container = document.getElementById('youtube-player');
    if (!container) return;

    try {
      console.log('[Audio Engine] Initializing YouTube IFrame Player...');
      ytPlayerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
          autoplay: 1,
          controls: 0, // hide native controls for audio-focused experience
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            console.log('[Audio Engine] YouTube Player instance ready');
            setIsYtReady(true);
            event.target.setVolume(stateRef.current.volume * 100);
            if (stateRef.current.isMuted) event.target.mute();
            
            // If we have a pending video, load/cue it now!
            if (pendingVideoIdRef.current) {
              const videoId = pendingVideoIdRef.current;
              const autoplay = pendingVideoAutoplayRef.current;
              const savedPos = parseFloat(localStorage.getItem('mysukoon_playback_position') || '0');
              
              console.log('[Audio Engine] Handling pending YouTube video:', videoId, 'autoplay:', autoplay);
              if (autoplay) {
                event.target.loadVideoById({
                  videoId: videoId,
                  startSeconds: 0
                });
                setIsPlaying(true);
              } else {
                event.target.cueVideoById({
                  videoId: videoId,
                  startSeconds: savedPos
                });
                setIsPlaying(false);
              }
              pendingVideoIdRef.current = null;
            } else if (stateRef.current.currentTrack?.isYouTube) {
              const savedPos = parseFloat(localStorage.getItem('mysukoon_playback_position') || '0');
              event.target.cueVideoById({
                videoId: stateRef.current.currentTrack.videoId,
                startSeconds: savedPos
              });
              setIsPlaying(false);
            }
          },
          onStateChange: (event) => {
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsBuffering(false);
              // Synced speed booster
              if (ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
                try {
                  ytPlayerRef.current.setPlaybackRate(stateRef.current.playbackSpeed);
                } catch { /* ignore */ }
              }
            } else if (state === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              setIsBuffering(false);
            } else if (state === window.YT.PlayerState.BUFFERING) {
              setIsBuffering(true);
            } else if (state === window.YT.PlayerState.ENDED) {
              setIsBuffering(false);
              setIsPlaying(false);
              
              // Handle Repeat One
              if (stateRef.current.isRepeat === 'one') {
                if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
                  ytPlayerRef.current.seekTo(0, true);
                  ytPlayerRef.current.playVideo();
                  setIsPlaying(true);
                }
              } else {
                playNextRef.current(true); // Auto-advance queue using latest ref
              }
            }
          },
          onError: (event) => {
            console.error('[Audio Engine] YouTube Player error event:', event.data);
            setIsBuffering(false);
            setIsPlaying(false);
            showToast('Unable to play YouTube track. Check your API key limits.', 'warning');
          }
        }
      });
    } catch (e) {
      console.error('[Audio Engine] Failed to initialize YouTube player:', e);
    }
  };

  const ensureYoutubePlayerInitialized = () => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      return true;
    }
    if (!window.YT || !window.YT.Player) return false;
    initYoutubePlayer();
    return true;
  };

  // --- Recently Played Helper ---
  const saveToRecentlyPlayed = (track) => {
    if (!track) return;
    try {
      const recent = JSON.parse(localStorage.getItem('mysukoon_recently_played') || '[]');
      const filtered = recent.filter(t => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 20); // Cap at 20
      localStorage.setItem('mysukoon_recently_played', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage_update'));
    } catch (e) {
      console.error('Failed to update recently played in localStorage', e);
    }
  };

  // --- Media Session Metadata helper ---
  const updateMediaSessionMetadata = (track) => {
    try {
      if ('mediaSession' in navigator && window.MediaMetadata && track) {
        const artUrl = track.shareimage || track.image || 'https://placehold.co/400x400/181818/ffffff?text=MySukoon';
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.name,
          artist: track.artist_name,
          album: track.album_name || 'MySukoon Single',
          artwork: [
            { src: artUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: artUrl, sizes: '128x128', type: 'image/jpeg' },
            { src: artUrl, sizes: '192x192', type: 'image/jpeg' },
            { src: artUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: artUrl, sizes: '384x384', type: 'image/jpeg' },
            { src: artUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        });
      }
    } catch (e) {
      console.warn('[Audio Engine] Failed to update Media Session Metadata:', e);
    }
  };

  // --- Controls Functions ---
  const togglePlay = () => {
    if (!stateRef.current.currentTrack) return;
    
    if (stateRef.current.currentTrack.isYouTube) {
      ensureYoutubePlayerInitialized();
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
        try {
          const state = ytPlayerRef.current.getPlayerState();
          if (state === window.YT.PlayerState.PLAYING) {
            ytPlayerRef.current.pauseVideo();
            setIsPlaying(false);
          } else {
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          }
        } catch (e) {
          console.error('[Audio Engine] YouTube play toggle failed:', e);
        }
      } else {
        if (isPlaying) {
          setIsPlaying(false);
          pendingVideoIdRef.current = null;
        } else {
          setIsPlaying(true);
          pendingVideoIdRef.current = stateRef.current.currentTrack.videoId;
          pendingVideoAutoplayRef.current = true;
        }
      }
    } else {
      const audio = audioRef.current;
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error('Play failed:', err));
      }
    }
  };

  const seek = (time) => {
    if (stateRef.current.currentTrack?.isYouTube) {
      ensureYoutubePlayerInitialized();
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        try {
          ytPlayerRef.current.seekTo(time, true);
          setCurrentTime(time);
        } catch (e) {
          console.error('[Audio Engine] YouTube seek failed:', e);
        }
      }
    } else {
      const audio = audioRef.current;
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changeVolume = (val) => {
    const v = parseFloat(val);
    setVolume(v);
    if (v > 0) setIsMuted(false);
    
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(v * 100);
      } catch { /* ignore */ }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    
    if (ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
      try {
        if (nextMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume * 100);
        }
      } catch { /* ignore */ }
    }
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(parseFloat(speed));
  };

  const selectTrack = (track, trackList = []) => {
    if (!track) return;
    
    // Update queue context if a new list is provided
    if (trackList.length > 0) {
      setQueue(trackList);
      const index = trackList.findIndex(t => t.id === track.id);
      setQueueIndex(index !== -1 ? index : 0);
    } else {
      // Just playing single track: Add to queue if not present, and play
      const idx = queue.findIndex(t => t.id === track.id);
      if (idx !== -1) {
        setQueueIndex(idx);
      } else {
        const newQueue = [...queue, track];
        setQueue(newQueue);
        setQueueIndex(newQueue.length - 1);
      }
    }
    
    setCurrentTrack(track);
  };

  const playNext = (auto = false) => {
    const { queue, queueIndex, isShuffle, isRepeat, currentTrack, currentTime } = stateRef.current;
    if (queue.length === 0) return;

    if (auto && isRepeat === 'one' && currentTrack) {
      if (currentTrack.isYouTube) {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
          try {
            ytPlayerRef.current.seekTo(0, true);
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
            return;
          } catch { /* ignore */ }
        }
      } else {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.error('Audio auto replay failed:', err));
        return;
      }
    }

    // Skip logging on manual next click
    if (!auto && currentTrack && currentTime > 2 && currentTime < 25) {
      console.log('[AI Engine] User skipped track quickly:', currentTrack.name);
      trackSkip(currentTrack);
    }

    if (isShuffle) {
      let randomIndex = queueIndex;
      if (queue.length > 1) {
        while (randomIndex === queueIndex) {
          randomIndex = Math.floor(Math.random() * queue.length);
        }
      } else {
        randomIndex = 0;
      }
      setQueueIndex(randomIndex);
      setCurrentTrack(queue[randomIndex]);
      return;
    }

    let nextIndex = queueIndex + 1;

    if (nextIndex >= queue.length) {
      if (isRepeat === 'all') {
        nextIndex = 0; // Wrap around
      } else if (auto) {
        // AI Autoplay activation when song reaches the end!
        console.log('[AI Engine] Autoplay solved next track...');
        const nextAiTrack = solveNextAutoplay(currentTrack, queue);
        if (nextAiTrack) {
          selectTrack(nextAiTrack);
          return;
        }
        setIsPlaying(false);
        audioRef.current.pause();
        if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
          try {
            ytPlayerRef.current.stopVideo();
          } catch { /* ignore */ }
        }
        return;
      } else {
        return;
      }
    }

    setQueueIndex(nextIndex);
    setCurrentTrack(queue[nextIndex]);
  };

  const playPrevious = () => {
    const { queue, queueIndex, isShuffle, isRepeat, currentTime, currentTrack } = stateRef.current;
    if (queue.length === 0) return;

    // Skip logging on manual back click
    if (currentTrack && currentTime > 2 && currentTime < 25) {
      console.log('[AI Engine] User skipped track quickly (Previous):', currentTrack.name);
      trackSkip(currentTrack);
    }

    if (currentTime > 3) {
      seek(0);
      return;
    }

    if (isShuffle) {
      let randomIndex = queueIndex;
      if (queue.length > 1) {
        while (randomIndex === queueIndex) {
          randomIndex = Math.floor(Math.random() * queue.length);
        }
      } else {
        randomIndex = 0;
      }
      setQueueIndex(randomIndex);
      setCurrentTrack(queue[randomIndex]);
      return;
    }

    let prevIndex = queueIndex - 1;

    if (prevIndex < 0) {
      if (isRepeat === 'all') {
        prevIndex = queue.length - 1; // Wrap to last
      } else {
        prevIndex = 0; // Stick to first
      }
    }

    setQueueIndex(prevIndex);
    setCurrentTrack(queue[prevIndex]);
  };

  // --- Queue Alterations ---
  const addToQueue = (track) => {
    if (queue.some(t => t.id === track.id)) return; // Avoid duplicates
    setQueue([...queue, track]);
    if (queueIndex === -1) {
      setQueueIndex(0);
      setCurrentTrack(track);
    }
  };

  const addToQueueNext = (track) => {
    const filteredQueue = queue.filter(t => t.id !== track.id);
    const newQueue = [...filteredQueue];
    const insertPos = queueIndex + 1;
    newQueue.splice(insertPos, 0, track);
    setQueue(newQueue);
    if (queueIndex === -1) {
      setQueueIndex(0);
      setCurrentTrack(track);
    }
  };

  const removeFromQueue = (index) => {
    const newQueue = queue.filter((_, idx) => idx !== index);
    setQueue(newQueue);
    
    if (index === queueIndex) {
      // If we removed the playing track, play next
      if (newQueue.length === 0) {
        setCurrentTrack(null);
        setQueueIndex(-1);
        setIsPlaying(false);
        audioRef.current.pause();
        if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
          try {
            ytPlayerRef.current.stopVideo();
          } catch { /* ignore */ }
        }
      } else {
        const nextIdx = index >= newQueue.length ? 0 : index;
        setQueueIndex(nextIdx);
        setCurrentTrack(newQueue[nextIdx]);
      }
    } else if (index < queueIndex) {
      // Adjust index
      setQueueIndex(queueIndex - 1);
    }
  };

  const clearQueue = () => {
    audioRef.current.pause();
    audioRef.current.src = '';
    
    if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
      try {
        ytPlayerRef.current.stopVideo();
      } catch { /* ignore */ }
    }
    
    setCurrentTrack(null);
    setIsPlaying(false);
    setQueue([]);
    setQueueIndex(-1);
    setCurrentTime(0);
    setDuration(0);
  };

  const moveQueueItem = (fromIdx, toIdx) => {
    if (fromIdx < 0 || fromIdx >= queue.length || toIdx < 0 || toIdx >= queue.length) return;
    const newQueue = [...queue];
    const [movedItem] = newQueue.splice(fromIdx, 1);
    newQueue.splice(toIdx, 0, movedItem);
    
    // Adjust queueIndex
    let newIndex = queueIndex;
    if (queueIndex === fromIdx) {
      newIndex = toIdx;
    } else if (queueIndex > fromIdx && queueIndex <= toIdx) {
      newIndex -= 1;
    } else if (queueIndex < fromIdx && queueIndex >= toIdx) {
      newIndex += 1;
    }
    
    setQueue(newQueue);
    setQueueIndex(newIndex);
  };

  // Dynamically load YouTube Player API and setup DOM placeholder
  useEffect(() => {
    // Create and append the off-screen youtube-player div to document.body
    let container = document.getElementById('youtube-player');
    if (!container) {
      container = document.createElement('div');
      container.id = 'youtube-player';
      container.style.position = 'absolute';
      container.style.width = '200px';
      container.style.height = '200px';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '-9999';
      document.body.appendChild(container);
    }

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      setTimeout(() => {
        initYoutubePlayer();
      }, 500);
    };

    if (window.YT && window.YT.Player) {
      setTimeout(() => {
        initYoutubePlayer();
      }, 500);
    }

    return () => {
      // Clean up player container on unmount to prevent leaks
      const el = document.getElementById('youtube-player');
      if (el) {
        el.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling interval to keep YouTube playback times updated
  useEffect(() => {
    let timer;
    if (isPlaying && currentTrack?.isYouTube) {
      timer = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const time = ytPlayerRef.current.getCurrentTime();
            const dur = ytPlayerRef.current.getDuration();
            setCurrentTime(time || 0);
            savePlaybackPosition(time || 0);
            if (dur && dur > 0) {
              setDuration(dur);
            }
          } catch { /* ignore */ }
        }
      }, 250);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentTrack]);

  // Initialize and attach native audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleDurationChange = () => {
      if (!stateRef.current.currentTrack?.isYouTube) {
        setDuration(audio.duration || 0);
      }
    };
    const handleTimeUpdate = () => {
      if (!stateRef.current.currentTrack?.isYouTube) {
        const time = audio.currentTime || 0;
        setCurrentTime(time);
        savePlaybackPosition(time);
      }
    };
    
    // Buffering and loading event handlers
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    const handleCanPlay = () => setIsBuffering(false);
    const handleSeeking = () => setIsBuffering(true);
    const handleSeeked = () => setIsBuffering(false);
    const handleLoadStart = () => setIsBuffering(true);
    const handleLoadedData = () => setIsBuffering(false);

    // Automatic Recovery Retry logic on errors
    const handleAudioError = () => {
      // Ignore errors when playing YouTube tracks, as they are triggered by clearing the HTML5 audio source
      if (stateRef.current.currentTrack?.isYouTube) {
        return;
      }

      console.warn(`[Audio Engine] Playback error encountered:`, audio.error);
      setIsBuffering(false);
      
      // Check offline mode
      if (!navigator.onLine) {
        showToast('Playback failed: You are offline. Download this track to play offline!', 'warning');
        setIsPlaying(false);
        return;
      }
      
      const track = stateRef.current.currentTrack;
      if (retryCountRef.current < 3 && track?.audio) {
        retryCountRef.current += 1;
        const savedTime = audio.currentTime;
        console.log(`[Audio Engine] Attempting automatic playback recovery (Retry ${retryCountRef.current}/3) at position ${savedTime}s...`);
        
        setTimeout(() => {
          resolveTrackAudioSrc(track).then((srcUrl) => {
            audio.src = srcUrl;
            audio.load();
            audio.currentTime = savedTime;
            audio.play()
              .then(() => {
                console.log('[Audio Engine] Playback recovery succeeded!');
                retryCountRef.current = 0; // reset
              })
              .catch(err => {
                console.error('[Audio Engine] Playback recovery retry failed:', err);
              });
          });
        }, 1500);
      } else {
        console.error('[Audio Engine] Maximum auto-retries reached. Playback failed permanently.');
        showToast('Unable to stream this track. Please check your network or try another song.', 'warning');
        setIsPlaying(false);
      }
    };

    const handleEnded = () => {
      const { isRepeat } = stateRef.current;
      if (isRepeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(err => console.error('Audio auto replay failed:', err));
      } else {
        playNextRef.current(true); // Automatically advance using latest ref
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleAudioError);
    
    // Add buffering listeners
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('seeking', handleSeeking);
    audio.addEventListener('seeked', handleSeeked);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleAudioError);
      
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('seeking', handleSeeking);
      audio.removeEventListener('seeked', handleSeeked);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isInitialLoadRef = useRef(true);

  // Handle source changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!currentTrack) return;

    const isInitial = isInitialLoadRef.current;
    isInitialLoadRef.current = false;

    // Track play history in AI recommendation database, but ONLY if not initial restore
    if (!isInitial) {
      trackPlay(currentTrack);
    }

    if (currentTrack.isYouTube) {
      // Pause and clear native player
      audio.pause();
      audio.src = '';
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsBuffering(true);
      const savedPos = isInitial ? parseFloat(localStorage.getItem('mysukoon_playback_position') || '0') : 0;
      setCurrentTime(savedPos);
      setDuration(currentTrack.duration || 240);
      
      const inited = ensureYoutubePlayerInitialized();
      if (inited && ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        try {
          if (isInitial) {
            ytPlayerRef.current.cueVideoById({
              videoId: currentTrack.videoId,
              startSeconds: savedPos
            });
            ytPlayerRef.current.setVolume(volume * 100);
            if (isMuted) {
              ytPlayerRef.current.mute();
            } else {
              ytPlayerRef.current.unMute();
            }
            setIsPlaying(false);
          } else {
            ytPlayerRef.current.loadVideoById({
              videoId: currentTrack.videoId,
              startSeconds: 0
            });
            ytPlayerRef.current.setVolume(volume * 100);
            if (isMuted) {
              ytPlayerRef.current.mute();
            } else {
              ytPlayerRef.current.unMute();
            }
            setIsPlaying(true);
          }
        } catch (err) {
          console.error('[Audio Engine] Failed loading YouTube video:', err);
        }
      } else {
        console.log('[Audio Engine] YouTube player not ready yet. Queuing video ID:', currentTrack.videoId);
        pendingVideoIdRef.current = currentTrack.videoId;
        pendingVideoAutoplayRef.current = !isInitial;
      }
      
      if (!isInitial) {
        saveToRecentlyPlayed(currentTrack);
      }
      updateMediaSessionMetadata(currentTrack);
    } else if (currentTrack.audio) {
      // Pause YouTube player if active
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch { /* ignore */ }
      }

      retryCountRef.current = 0;
      
      resolveTrackAudioSrc(currentTrack).then((srcUrl) => {
        audio.src = srcUrl;
        audio.load();
        audio.playbackRate = playbackSpeed;
        
        const savedPos = isInitial ? parseFloat(localStorage.getItem('mysukoon_playback_position') || '0') : 0;
        if (savedPos > 0) {
          audio.currentTime = savedPos;
          setCurrentTime(savedPos);
        }

        if (isInitial) {
          setIsPlaying(false);
        } else {
          audio.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
              console.error('Audio play failed:', err);
              setIsPlaying(false);
            });
        }
      });

      if (!isInitial) {
        saveToRecentlyPlayed(currentTrack);
      }
      updateMediaSessionMetadata(currentTrack);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  // Sync playback speed across both HTML5 Audio and YouTube players
  useEffect(() => {
    const audio = audioRef.current;
    audio.playbackRate = playbackSpeed;
    
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
      try {
        ytPlayerRef.current.setPlaybackRate(playbackSpeed);
      } catch { /* ignore */ }
    }
  }, [playbackSpeed, currentTrack, isPlaying]);

  // Sync volume & mute
  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        if (isMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume * 100);
        }
      } catch { /* ignore */ }
    }
  }, [volume, isMuted]);

  // Sync Media Session Playback State
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Setup Refs for all active control actions to be safely called from media session API
  const playNextRef = useRef(null);
  const playPreviousRef = useRef(null);
  const togglePlayRef = useRef(null);

  useEffect(() => {
    playNextRef.current = playNext;
    playPreviousRef.current = playPrevious;
    togglePlayRef.current = togglePlay;
  });

  // Setup Media Session Action Handlers
  useEffect(() => {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          if (togglePlayRef.current) togglePlayRef.current();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          if (togglePlayRef.current) togglePlayRef.current();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          if (playPreviousRef.current) playPreviousRef.current();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          if (playNextRef.current) playNextRef.current();
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            seek(details.seekTime);
          }
        });
      } catch (error) {
        console.warn('Media Session Action Handlers registration failed:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AudioContext.Provider value={{
      currentTrack,
      isPlaying,
      duration,
      currentTime,
      volume,
      playbackSpeed,
      isShuffle,
      isRepeat,
      queue,
      queueIndex,
      isMuted,
      isBuffering,
      togglePlay,
      seek,
      changeVolume,
      toggleMute,
      changeSpeed,
      selectTrack,
      playNext,
      playPrevious,
      addToQueue,
      addToQueueNext,
      removeFromQueue,
      clearQueue,
      moveQueueItem,
      setIsShuffle,
      setIsRepeat
    }}>
      {children}
    </AudioContext.Provider>
  );
};
