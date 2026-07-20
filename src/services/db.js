const DB_NAME = 'MySukoonDB';
const DB_VERSION = 1;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database failed to open:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Object store for playlists
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }

      // Object store for downloads
      if (!db.objectStoreNames.contains('downloads')) {
        db.createObjectStore('downloads', { keyPath: 'id' });
      }
    };
  });
};

export const getPlaylistsFromDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('playlists', 'readonly');
    const store = transaction.objectStore('playlists');
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const savePlaylistToDB = async (playlist) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('playlists', 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.put(playlist);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const deletePlaylistFromDB = async (playlistId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('playlists', 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.delete(playlistId);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const getDownloadsFromDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('downloads', 'readonly');
    const store = transaction.objectStore('downloads');
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const getDownloadFromDB = async (trackId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('downloads', 'readonly');
    const store = transaction.objectStore('downloads');
    const request = store.get(trackId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const saveDownloadToDB = async (track, audioBlob) => {
  const db = await initDB();
  const downloadItem = {
    id: track.id,
    name: track.name,
    artist_name: track.artist_name,
    album_name: track.album_name,
    image: track.image,
    audio: track.audio,
    duration: track.duration,
    isYouTube: !!track.isYouTube,
    source: track.source || 'Jamendo',
    audioBlob: audioBlob,
    downloadedAt: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('downloads', 'readwrite');
    const store = transaction.objectStore('downloads');
    const request = store.put(downloadItem);

    request.onsuccess = () => {
      resolve(downloadItem);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const deleteDownloadFromDB = async (trackId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('downloads', 'readwrite');
    const store = transaction.objectStore('downloads');
    const request = store.delete(trackId);

    request.onsuccess = () => {
      resolve(trackId);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};
