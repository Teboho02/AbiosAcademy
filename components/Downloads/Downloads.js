import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useDownload } from '../../contexts/DownloadContext';

const Downloads = ({ onVideoPress }) => {
  const { theme } = useTheme();
  const {
    getDownloadedVideos,
    deleteDownload,
    clearAllDownloads,
    getTotalDownloadSize,
    formatFileSize,
  } = useDownload();

  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    loadDownloadedVideos();
  }, []);

  const loadDownloadedVideos = async () => {
    setIsCalculating(true);
    const videos = getDownloadedVideos();
    setDownloadedVideos(videos);

    const size = await getTotalDownloadSize();
    setTotalSize(size);
    setIsCalculating(false);
  };

  const handleDeleteVideo = (video) => {
    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete "${video.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDownload(video.id);
              await loadDownloadedVideos();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete video');
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Downloads',
      'Are you sure you want to delete all downloaded videos?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllDownloads();
              await loadDownloadedVideos();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear downloads');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Downloads</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {downloadedVideos.length} video{downloadedVideos.length !== 1 ? 's' : ''} • {' '}
          {isCalculating ? 'Calculating...' : formatFileSize(totalSize)}
        </Text>
      </View>

      {downloadedVideos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="download-outline" size={64} color={theme.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Downloads</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Download videos to watch them offline
          </Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {downloadedVideos.map((video) => (
              <TouchableOpacity
                key={video.id}
                style={[styles.videoCard, { backgroundColor: theme.cardBackground }]}
                onPress={() => onVideoPress(video)}
                activeOpacity={0.8}
              >
                <View style={styles.videoImageContainer}>
                  <Image
                    source={
                      video.thumbnail_url
                        ? { uri: video.thumbnail_url }
                        : require('../../assets/placeholder1.jpg')
                    }
                    style={styles.videoImage}
                    defaultSource={require('../../assets/placeholder1.jpg')}
                  />
                  <View style={styles.playOverlay}>
                    <Ionicons name="play-circle" size={32} color="white" />
                  </View>
                  <View style={[styles.downloadedBadge, { backgroundColor: theme.success }]}>
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                  </View>
                </View>

                <View style={styles.videoInfo}>
                  <Text style={[styles.videoTitle, { color: theme.text }]} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <Text style={[styles.videoDetails, { color: theme.textSecondary }]}>
                    {video.category} • {video.duration} • {video.difficulty}
                  </Text>
                  <Text style={[styles.downloadDate, { color: theme.textTertiary }]}>
                    Downloaded on {new Date(video.downloadedAt).toLocaleDateString()}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteVideo(video)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Clear All Button */}
          <View style={[styles.footer, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.clearAllButton, { backgroundColor: theme.error + '20', borderColor: theme.error }]}
              onPress={handleClearAll}
            >
              <Ionicons name="trash-outline" size={20} color={theme.error} />
              <Text style={[styles.clearAllText, { color: theme.error }]}>Clear All Downloads</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  videoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  videoImageContainer: {
    width: 120,
    height: 90,
    position: 'relative',
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  downloadedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    padding: 2,
  },
  videoInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoDetails: {
    fontSize: 12,
    marginBottom: 4,
  },
  downloadDate: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  clearAllText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default Downloads;
