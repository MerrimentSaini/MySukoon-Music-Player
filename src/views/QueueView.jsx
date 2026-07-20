import React from 'react';
import { ArrowUp, ArrowDown, Trash2, ListMusic, Volume2, ShieldAlert } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

export default function QueueView({ setActiveView }) {
  const { 
    queue, 
    queueIndex, 
    currentTrack, 
    removeFromQueue, 
    moveQueueItem, 
    clearQueue, 
    selectTrack 
  } = useAudio();

  const handleClearQueue = () => {
    if (confirm('Are you sure you want to clear your current queue? Playback will stop.')) {
      clearQueue();
    }
  };

  const nextTracks = queue.slice(queueIndex + 1);

  return (
    <div className="flex flex-col gap-6 pb-32">
      {/* Title block with actions */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
        <div className="flex items-center gap-2">
          <ListMusic className="text-spotify-green" size={24} />
          <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Play Queue</h2>
        </div>

        {queue.length > 0 && (
          <button
            onClick={handleClearQueue}
            className="px-4 py-2 border border-red-900/40 hover:border-red-700 bg-red-950/20 text-red-400 hover:text-red-300 rounded-full text-xs font-semibold transition cursor-pointer"
          >
            Clear Queue
          </button>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-neutral-900/10 rounded-2xl border border-neutral-900 border-dashed">
          <ListMusic className="text-neutral-600 mb-3" size={36} />
          <p className="font-semibold text-neutral-300 mb-1">Your play queue is completely empty</p>
          <p className="text-sm text-neutral-500 mb-5">Start playing songs from Home or Search to fill your queue!</p>
          <button
            onClick={() => setActiveView('home')}
            className="px-6 py-2 bg-spotify-green text-black rounded-full font-bold hover:scale-105 active:scale-95 transition cursor-pointer font-inter text-sm"
          >
            Discover Music
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* NOW PLAYING SECTION */}
          {currentTrack && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-inter">Now Playing</span>
              <div className="flex items-center gap-4 px-6 py-4 bg-spotify-green/5 border border-spotify-green/20 rounded-xl">
                <Volume2 className="text-spotify-green animate-pulse" size={20} />
                <img 
                  src={currentTrack.image || '/mysukoon_logo.png'} 
                  alt={currentTrack.name} 
                  className="w-12 h-12 object-cover rounded bg-neutral-950 flex-shrink-0"
                />
                <div className="flex-1 flex flex-col min-w-0">
                  <span className="font-extrabold text-sm text-spotify-green truncate">{currentTrack.name}</span>
                  <span className="text-xs text-neutral-400 truncate mt-0.5">{currentTrack.artist_name}</span>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-black/40 border border-neutral-800 text-spotify-green rounded-full">
                  Active
                </span>
              </div>
            </div>
          )}

          {/* PLAY NEXT LIST */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-inter">
              Next In Queue ({nextTracks.length} tracks)
            </span>

            {nextTracks.length === 0 ? (
              <p className="text-xs text-neutral-500 italic px-2">No upcoming songs. Current song is the last one in this session.</p>
            ) : (
              <div className="flex flex-col bg-neutral-900/10 border border-neutral-900 rounded-xl overflow-hidden">
                {nextTracks.map((track, relativeIdx) => {
                  const actualIdx = queueIndex + 1 + relativeIdx;
                  return (
                    <div 
                      key={`${track.id}_queue_${actualIdx}`}
                      className="flex items-center gap-4 px-6 py-3 border-b border-neutral-900/50 hover:bg-neutral-800/40 transition group"
                    >
                      {/* Index */}
                      <span className="w-6 text-center text-xs text-neutral-500 font-mono">
                        {relativeIdx + 1}
                      </span>

                      {/* Image Details */}
                      <div className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => selectTrack(track, queue)}>
                        <img 
                          src={track.image || '/mysukoon_logo.png'} 
                          alt={track.name} 
                          className="w-10 h-10 object-cover rounded bg-neutral-950 flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-white truncate group-hover:text-spotify-green transition">
                            {track.name}
                          </span>
                          <span className="text-xs text-neutral-400 truncate mt-0.5">{track.artist_name}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        {/* Move Up */}
                        <button
                          onClick={() => moveQueueItem(actualIdx, actualIdx - 1)}
                          disabled={relativeIdx === 0}
                          className="p-1 text-neutral-400 hover:text-white bg-neutral-900/60 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 cursor-pointer transition"
                          title="Move Up"
                        >
                          <ArrowUp size={14} />
                        </button>

                        {/* Move Down */}
                        <button
                          onClick={() => moveQueueItem(actualIdx, actualIdx + 1)}
                          disabled={actualIdx === queue.length - 1}
                          className="p-1 text-neutral-400 hover:text-white bg-neutral-900/60 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 cursor-pointer transition"
                          title="Move Down"
                        >
                          <ArrowDown size={14} />
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromQueue(actualIdx)}
                          className="p-1 text-neutral-400 hover:text-red-500 bg-neutral-900/60 rounded hover:bg-neutral-800 cursor-pointer transition ml-1"
                          title="Remove from queue"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
