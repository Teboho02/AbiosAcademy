import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const DownloadContext = createContext();

const DOWNLOADS_KEY = '@downloaded_videos';

export const DownloadProvider = ({ children }) => {
  const [downloads, setDownloads] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load downloads on mount
  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const savedDownloads = await AsyncStorage.getItem(DOWNLOADS_KEY);
      if (savedDownloads) {
        setDownloads(JSON.parse(savedDownloads));
      }
    } catch (error) {
      console.log('Error loading downloads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDownloads = async (newDownloads) => {
    try {
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(newDownloads));
    } catch (error) {
      console.log('Error saving downloads:', error);
    }
  };

  const isDownloaded = (exerciseId) => {
    return downloads[exerciseId] && downloads[exerciseId].status === 'completed';
  };

  const isDownloading = (exerciseId) => {
    return downloads[exerciseId] && downloads[exerciseId].status === 'downloading';
  };

  const getDownloadedVideoUri = (exerciseId) => {
    if (isDownloaded(exerciseId)) {
      return downloads[exerciseId].localUri;
    }
    return null;
  };

  const downloadVideo = async (exercise) => {
    const { id, title, video_url, thumbnail_url, category, duration, difficulty } = exercise;

    if (!video_url) {
      throw new Error('No video URL available');
    }

    // Check if already downloaded
    if (isDownloaded(id)) {
      return downloads[id].localUri;
    }

    // Create a safe filename
    const fileExtension = video_url.split('.').pop().split('?')[0] || 'mp4';
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${safeTitle}_${id}.${fileExtension}`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    try {
      // Update status to downloading
      const newDownloads = {
        ...downloads,
        [id]: {
          id,
          title,
          category,
          duration,
          difficulty,
          thumbnail_url,
          originalUrl: video_url,
          localUri: fileUri,
          status: 'downloading',
          downloadedAt: new Date().toISOString(),
        },
      };
      setDownloads(newDownloads);
      setDownloadProgress({ ...downloadProgress, [id]: 0 });

      // Download the file
      const downloadResumable = FileSystem.createDownloadResumable(
        video_url,
        fileUri,
        {},
        (downloadProgressData) => {
          const progress = downloadProgressData.totalBytesWritten / downloadProgressData.totalBytesExpectedToWrite;
          setDownloadProgress({ ...downloadProgress, [id]: progress });
        }
      );

      const { uri } = await downloadResumable.downloadAsync();

      // Update status to completed
      const completedDownloads = {
        ...downloads,
        [id]: {
          ...newDownloads[id],
          status: 'completed',
          localUri: uri,
        },
      };
      setDownloads(completedDownloads);
      await saveDownloads(completedDownloads);

      // Remove from progress tracking
      const newProgress = { ...downloadProgress };
      delete newProgress[id];
      setDownloadProgress(newProgress);

      return uri;
    } catch (error) {
      console.log('Download error:', error);

      // Update status to failed
      const failedDownloads = {
        ...downloads,
        [id]: {
          ...downloads[id],
          status: 'failed',
          error: error.message,
        },
      };
      setDownloads(failedDownloads);

      // Remove from progress tracking
      const newProgress = { ...downloadProgress };
      delete newProgress[id];
      setDownloadProgress(newProgress);

      throw error;
    }
  };

  const deleteDownload = async (exerciseId) => {
    try {
      const download = downloads[exerciseId];
      if (download && download.localUri) {
        // Delete the file
        const fileInfo = await FileSystem.getInfoAsync(download.localUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(download.localUri);
        }
      }

      // Remove from downloads
      const newDownloads = { ...downloads };
      delete newDownloads[exerciseId];
      setDownloads(newDownloads);
      await saveDownloads(newDownloads);
    } catch (error) {
      console.log('Error deleting download:', error);
      throw error;
    }
  };

  const clearAllDownloads = async () => {
    try {
      // Delete all downloaded files
      for (const exerciseId in downloads) {
        const download = downloads[exerciseId];
        if (download && download.localUri) {
          const fileInfo = await FileSystem.getInfoAsync(download.localUri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(download.localUri);
          }
        }
      }

      // Clear the downloads
      setDownloads({});
      await AsyncStorage.removeItem(DOWNLOADS_KEY);
    } catch (error) {
      console.log('Error clearing downloads:', error);
      throw error;
    }
  };

  const getDownloadedVideos = () => {
    return Object.values(downloads).filter(d => d.status === 'completed');
  };

  const getTotalDownloadSize = async () => {
    let totalSize = 0;
    for (const exerciseId in downloads) {
      const download = downloads[exerciseId];
      if (download && download.localUri && download.status === 'completed') {
        try {
          const fileInfo = await FileSystem.getInfoAsync(download.localUri);
          if (fileInfo.exists) {
            totalSize += fileInfo.size;
          }
        } catch (error) {
          console.log('Error getting file size:', error);
        }
      }
    }
    return totalSize;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const value = {
    downloads,
    downloadProgress,
    isLoading,
    isDownloaded,
    isDownloading,
    getDownloadedVideoUri,
    downloadVideo,
    deleteDownload,
    clearAllDownloads,
    getDownloadedVideos,
    getTotalDownloadSize,
    formatFileSize,
  };

  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
};

export const useDownload = () => {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
};
