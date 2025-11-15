import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

const EnhancedVideoPlayer = ({ videoUri, onError, onLoad }) => {
  const { theme } = useTheme();
  const videoRef = useRef(null);

  const [status, setStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  let controlsTimeout = useRef(null);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, []);

  const resetControlsTimeout = () => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    setShowControls(true);
    controlsTimeout.current = setTimeout(() => {
      if (status.isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handlePlaybackStatusUpdate = (playbackStatus) => {
    setStatus(playbackStatus);

    if (playbackStatus.isLoaded) {
      setIsLoading(false);
      setError(null);

      // Check if buffering
      if (playbackStatus.isBuffering) {
        setIsBuffering(true);
      } else {
        setIsBuffering(false);
      }

      if (onLoad) {
        onLoad(playbackStatus);
      }
    } else if (playbackStatus.error) {
      const errorMessage = playbackStatus.error;
      console.log('Video error:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleRetry = async () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(retryCount + 1);

    try {
      await videoRef.current?.unloadAsync();
      await videoRef.current?.loadAsync({ uri: videoUri }, { shouldPlay: false });
    } catch (err) {
      setError('Failed to load video. Please try again.');
      setIsLoading(false);
    }
  };

  const togglePlayPause = async () => {
    resetControlsTimeout();

    if (status.isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
  };

  const handleSeek = async (forward) => {
    resetControlsTimeout();

    if (status.isLoaded) {
      const seekTime = forward ? 10000 : -10000; // 10 seconds
      const newPosition = status.positionMillis + seekTime;
      await videoRef.current?.setPositionAsync(Math.max(0, newPosition));
    }
  };

  const toggleFullscreen = async () => {
    resetControlsTimeout();

    if (status.isLoaded) {
      await videoRef.current?.presentFullscreenPlayer();
    }
  };

  const changePlaybackRate = async (rate) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    resetControlsTimeout();

    if (status.isLoaded) {
      await videoRef.current?.setRateAsync(rate, true);
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getProgress = () => {
    if (status.isLoaded && status.durationMillis) {
      return (status.positionMillis / status.durationMillis) * 100;
    }
    return 0;
  };

  if (error && retryCount < 3) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: '#000' }]}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>Failed to load video</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={handleRetry}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error && retryCount >= 3) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: '#000' }]}>
        <Ionicons name="videocam-off" size={64} color="#666" />
        <Text style={styles.errorText}>Unable to play video</Text>
        <Text style={styles.errorSubtext}>Please check your connection and try again later</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={resetControlsTimeout}
    >
      <Video
        ref={videoRef}
        style={styles.video}
        source={{ uri: videoUri }}
        useNativeControls={false}
        resizeMode="contain"
        shouldPlay={false}
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      {/* Buffering Indicator */}
      {isBuffering && !isLoading && (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="large" color="white" />
        </View>
      )}

      {/* Controls Overlay */}
      {showControls && status.isLoaded && !isLoading && (
        <View style={styles.controlsOverlay}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowSpeedMenu(!showSpeedMenu)}
            >
              <Text style={styles.speedText}>{playbackRate}x</Text>
            </TouchableOpacity>
          </View>

          {/* Center Controls */}
          <View style={styles.centerControls}>
            <TouchableOpacity
              style={styles.seekButton}
              onPress={() => handleSeek(false)}
            >
              <Ionicons name="play-back" size={36} color="white" />
              <Text style={styles.seekText}>10</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={status.isPlaying ? 'pause' : 'play'}
                size={48}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.seekButton}
              onPress={() => handleSeek(true)}
            >
              <Ionicons name="play-forward" size={36} color="white" />
              <Text style={styles.seekText}>10</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getProgress()}%`, backgroundColor: theme.primary },
                  ]}
                />
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>
                  {formatTime(status.positionMillis || 0)}
                </Text>
                <Text style={styles.timeText}>
                  {formatTime(status.durationMillis || 0)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={toggleFullscreen}
            >
              <Ionicons name="expand" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Speed Menu */}
      {showSpeedMenu && (
        <View style={[styles.speedMenu, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.speedMenuTitle, { color: theme.text }]}>Playback Speed</Text>
          {PLAYBACK_RATES.map((rate) => (
            <TouchableOpacity
              key={rate}
              style={[
                styles.speedMenuItem,
                playbackRate === rate && { backgroundColor: theme.primary + '20' },
              ]}
              onPress={() => changePlaybackRate(rate)}
            >
              <Text
                style={[
                  styles.speedMenuItemText,
                  { color: playbackRate === rate ? theme.primary : theme.text },
                ]}
              >
                {rate}x
              </Text>
              {playbackRate === rate && (
                <Ionicons name="checkmark" size={20} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: width * 9 / 16,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 14,
  },
  bufferingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    width: width,
    height: width * 9 / 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  speedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  centerControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  seekButton: {
    position: 'relative',
    padding: 12,
  },
  seekText: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  playPauseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
  },
  fullscreenButton: {
    padding: 8,
  },
  speedMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    borderRadius: 12,
    padding: 8,
    minWidth: 150,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  speedMenuTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  speedMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  speedMenuItemText: {
    fontSize: 16,
  },
});

export default EnhancedVideoPlayer;
