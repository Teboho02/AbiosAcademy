// src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput, 
  Alert, 
  Platform,
  Modal,
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../contexts/AuthContext';
import { dbService, storageService } from '../../lib/supabase';

const { width } = Dimensions.get('window');

const AdminDashboard = () => {
  const { user, userProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exercises, setExercises] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    exercises: 0,
    videoMinutes: 0,
    totalViews: 0,
    todayUploads: 0
  });
  
  const [newExercise, setNewExercise] = useState({
    title: '',
    category: '',
    duration: '',
    difficulty: 'Beginner',
    description: '',
    video: null,
    thumbnail: null,
    tags: ''
  });
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const categories = ['All', 'Strength', 'Cardio', 'Yoga', 'HIIT', 'Pilates', 'Flexibility'];

  useEffect(() => {
    loadDashboardData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permissions are required to upload media.');
      }
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load exercises
      const { data: exercisesData, error: exercisesError } = await dbService.getExercises();
      if (exercisesError) {
        console.error('Error loading exercises:', exercisesError);
      } else {
        setExercises(exercisesData || []);
      }

      // Load users (if you have a getUsers function)
      try {
        const { data: usersData } = await dbService.getUsers();
        setUsers(usersData || []);
      } catch (error) {
        console.log('Users data not available');
      }

      // Calculate stats
      const statsData = await dbService.getAppStats();
      const totalViews = exercisesData?.reduce((sum, ex) => sum + (ex.views || 0), 0) || 0;
      const todayUploads = exercisesData?.filter(ex => {
        const today = new Date().toDateString();
        const exerciseDate = new Date(ex.created_at).toDateString();
        return today === exerciseDate;
      }).length || 0;

      setStats({
        ...statsData,
        exercises: exercisesData?.length || 0,
        totalViews,
        todayUploads,
        videoMinutes: Math.floor(Math.random() * 500) + 100 // Mock data for now
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleDeleteExercise = async (id) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await dbService.deleteExercise(id);
              if (error) {
                Alert.alert('Error', 'Failed to delete exercise');
              } else {
                setExercises(exercises.filter(ex => ex.id !== id));
                Alert.alert('Success', 'Exercise deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting exercise:', error);
              Alert.alert('Error', 'Failed to delete exercise');
            }
          }
        }
      ]
    );
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets[0]) {
        const video = result.assets[0];
        
        // Check file size (limit to 100MB)
        if (video.size > 100 * 1024 * 1024) {
          Alert.alert('File too large', 'Please select a video smaller than 100MB');
          return;
        }
        
        setNewExercise({...newExercise, video});
      }
    } catch (err) {
      console.log('Error picking video:', err);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  const pickThumbnail = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewExercise({...newExercise, thumbnail: result.assets[0]});
      }
    } catch (err) {
      console.log('Error picking thumbnail:', err);
      Alert.alert('Error', 'Failed to select thumbnail');
    }
  };

  const handleUpload = async () => {
    if (!newExercise.title || !newExercise.category || !newExercise.duration) {
      Alert.alert('Missing Information', 'Please fill all required fields');
      return;
    }

    if (!newExercise.video) {
      Alert.alert('Missing Video', 'Please select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      let videoUrl = null;
      let thumbnailUrl = null;
      let videoPath = null;
      let thumbnailPath = null;

      if (newExercise.video) {
        setUploadProgress(20);
        const timestamp = Date.now();
        const videoFileName = `video_${timestamp}_${newExercise.video.name}`;
        
        const videoResult = await storageService.uploadExerciseVideo(
          newExercise.video, 
          videoFileName
        );
        
        if (videoResult.error) {
          throw new Error('Failed to upload video: ' + videoResult.error.message);
        }
        
        videoUrl = videoResult.data.publicUrl;
        videoPath = videoResult.data.path;
        setUploadProgress(60);
      }

      // Upload thumbnail to exercise-media bucket
      if (newExercise.thumbnail) {
        const timestamp = Date.now();
        const thumbnailFileName = `thumbnail_${timestamp}.jpg`;
        
        const thumbnailResult = await storageService.uploadExerciseThumbnail(
          newExercise.thumbnail, 
          thumbnailFileName
        );
        
        if (thumbnailResult.error) {
          console.warn('Thumbnail upload failed:', thumbnailResult.error);
          // Continue without thumbnail - not critical
        } else {
          thumbnailUrl = thumbnailResult.data.publicUrl;
          thumbnailPath = thumbnailResult.data.path;
        }
        setUploadProgress(80);
      }

      // Create exercise in database
      const exerciseData = {
        title: newExercise.title.trim(),
        description: newExercise.description.trim(),
        category: newExercise.category,
        duration: newExercise.duration,
        difficulty: newExercise.difficulty,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        video_path: videoPath,
        thumbnail_path: thumbnailPath,
        created_by: user.id,
        views: 0,
        tags: newExercise.tags ? newExercise.tags.split(',').map(tag => tag.trim()) : []
      };

      const { data, error } = await dbService.createExercise(exerciseData);
      
      if (error) {
        throw new Error(error.message);
      }

      setUploadProgress(100);
      
      // Update local state
      setExercises([data[0], ...exercises]);
      
      // Reset form
      setNewExercise({
        title: '',
        category: '',
        duration: '',
        difficulty: 'Beginner',
        description: '',
        video: null,
        thumbnail: null,
        tags: ''
      });
      
      setShowUploadModal(false);
      Alert.alert('Success', 'Exercise uploaded successfully!');
      
      // Refresh stats
      await loadDashboardData();
      
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload exercise');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exercise.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || exercise.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const renderDashboard = () => (
    <ScrollView 
      style={styles.dashboardContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.sectionTitle}>Dashboard Overview</Text>
      
      {/* Enhanced Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardLarge, {backgroundColor: '#4e7bff'}]}>
          <View style={styles.statHeader}>
            <Ionicons name="people" size={32} color="white" />
            <View style={styles.statTrend}>
              <Ionicons name="trending-up" size={16} color="white" />
              <Text style={styles.trendText}>+12%</Text>
            </View>
          </View>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
          <Text style={styles.statSubtext}>{stats.activeUsers} active this week</Text>
        </View>
        
        <View style={[styles.statCard, {backgroundColor: '#ff6b6b'}]}>
          <Ionicons name="barbell" size={28} color="white" />
          <Text style={styles.statNumber}>{stats.exercises}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
        
        <View style={[styles.statCard, {backgroundColor: '#6bdb7d'}]}>
          <Ionicons name="eye" size={28} color="white" />
          <Text style={styles.statNumber}>{stats.totalViews}</Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
        
        <View style={[styles.statCard, {backgroundColor: '#ffb347'}]}>
          <Ionicons name="cloud-upload" size={28} color="white" />
          <Text style={styles.statNumber}>{stats.todayUploads}</Text>
          <Text style={styles.statLabel}>Today's Uploads</Text>
        </View>
      </View>
      
      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickActionCard, styles.primaryAction]}
            onPress={() => setShowUploadModal(true)}
          >
            <Ionicons name="cloud-upload" size={28} color="white" />
            <Text style={styles.quickActionTextPrimary}>Upload Exercise</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="analytics" size={24} color="#4e7bff" />
            <Text style={styles.quickActionText}>View Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="people" size={24} color="#4e7bff" />
            <Text style={styles.quickActionText}>Manage Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="settings" size={24} color="#4e7bff" />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
   
      <View style={{height: 100}} />
    </ScrollView>
  );

  const renderExercises = () => (
    <View style={styles.exercisesContainer}>
      {/* Search and Filter Header */}
      <View style={styles.exerciseHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowUploadModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryFilterButton,
              filterCategory === category && styles.activeCategoryFilter
            ]}
            onPress={() => setFilterCategory(category)}
          >
            <Text style={[
              styles.categoryFilterText,
              filterCategory === category && styles.activeCategoryFilterText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Exercise List */}
      <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
        {filteredExercises.map(exercise => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <Image 
              source={
                exercise.thumbnail_url 
                  ? { uri: exercise.thumbnail_url }
                  : require('../../assets/placeholder1.jpg')
              } 
              style={styles.exerciseThumbnail} 
            />
            <View style={styles.exerciseDetails}>
              <Text style={styles.exerciseTitle}>{exercise.title}</Text>
              <Text style={styles.exerciseDescription} numberOfLines={2}>
                {exercise.description}
              </Text>
              <View style={styles.exerciseMeta}>
                <View style={styles.exerciseTag}>
                  <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                </View>
                <View style={styles.exerciseTag}>
                  <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                </View>
                <View style={[styles.exerciseTag, styles.difficultyTag]}>
                  <Text style={[
                    styles.exerciseDifficulty,
                    {color: exercise.difficulty === 'Beginner' ? '#6bdb7d' : 
                            exercise.difficulty === 'Intermediate' ? '#ffb347' : '#ff6b6b'}
                  ]}>
                    {exercise.difficulty}
                  </Text>
                </View>
              </View>
              <View style={styles.exerciseStats}>
                <View style={styles.exerciseStat}>
                  <Ionicons name="eye" size={14} color="#777" />
                  <Text style={styles.exerciseStatText}>{exercise.views || 0}</Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Ionicons name="calendar" size={14} color="#777" />
                  <Text style={styles.exerciseStatText}>
                    {new Date(exercise.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.exerciseActions}>
              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome name="play" size={16} color="#4e7bff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome name="pencil" size={16} color="#ffb347" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => handleDeleteExercise(exercise.id)}
              >
                <FontAwesome name="trash" size={16} color="#ff6b6b" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        {filteredExercises.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {searchQuery || filterCategory !== 'All' ? 'No exercises found' : 'No exercises yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || filterCategory !== 'All' 
                ? 'Try adjusting your search or filter' 
                : 'Upload your first exercise to get started'
              }
            </Text>
          </View>
        )}
        
        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );

  const renderUploadModal = () => (
    <Modal
      visible={showUploadModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowUploadModal(false)}>
            <Ionicons name="close" size={24} color="#777" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Upload Exercise</Text>
          <View style={{width: 24}} />
        </View>
        
        <ScrollView style={styles.uploadForm} showsVerticalScrollIndicator={false}>
          <Text style={styles.inputLabel}>Exercise Title*</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter exercise name"
            value={newExercise.title}
            onChangeText={text => setNewExercise({...newExercise, title: text})}
          />
          
          <Text style={styles.inputLabel}>Category*</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categorySelector}
          >
            {categories.slice(1).map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categorySelectorButton,
                  newExercise.category === category && styles.selectedCategory
                ]}
                onPress={() => setNewExercise({...newExercise, category})}
              >
                <Text style={[
                  styles.categorySelectorText,
                  newExercise.category === category && styles.selectedCategoryText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={styles.inputLabel}>Duration*</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 15 min, 30 min"
            value={newExercise.duration}
            onChangeText={text => setNewExercise({...newExercise, duration: text})}
          />
          
          <Text style={styles.inputLabel}>Difficulty Level*</Text>
          <View style={styles.difficultyContainer}>
            {['Beginner', 'Intermediate', 'Advanced'].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyButton,
                  newExercise.difficulty === level && styles.selectedDifficulty
                ]}
                onPress={() => setNewExercise({...newExercise, difficulty: level})}
              >
                <Text style={[
                  styles.difficultyText,
                  newExercise.difficulty === level && styles.selectedDifficultyText
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the exercise, form tips, benefits..."
            multiline
            numberOfLines={4}
            value={newExercise.description}
            onChangeText={text => setNewExercise({...newExercise, description: text})}
          />
          
          <Text style={styles.inputLabel}>Tags (comma-separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., upper body, core, beginner-friendly"
            value={newExercise.tags}
            onChangeText={text => setNewExercise({...newExercise, tags: text})}
          />
          
          <Text style={styles.inputLabel}>Exercise Video*</Text>
          <TouchableOpacity 
            style={[styles.uploadButton, newExercise.video && styles.uploadButtonSuccess]}
            onPress={pickVideo}
          >
            <Ionicons 
              name={newExercise.video ? "checkmark-circle" : "videocam"} 
              size={24} 
              color={newExercise.video ? "#6bdb7d" : "#4e7bff"} 
            />
            <View style={styles.uploadButtonContent}>
              <Text style={[styles.uploadButtonText, newExercise.video && styles.uploadButtonTextSuccess]}>
                {newExercise.video ? 'Video Selected' : 'Select Video File'}
              </Text>
              {newExercise.video && (
                <Text style={styles.fileName}>{newExercise.video.name}</Text>
              )}
            </View>
          </TouchableOpacity>
          
          <Text style={styles.inputLabel}>Thumbnail Image</Text>
          <TouchableOpacity 
            style={[styles.uploadButton, newExercise.thumbnail && styles.uploadButtonSuccess]}
            onPress={pickThumbnail}
          >
            <Ionicons 
              name={newExercise.thumbnail ? "checkmark-circle" : "image"} 
              size={24} 
              color={newExercise.thumbnail ? "#6bdb7d" : "#4e7bff"} 
            />
            <Text style={[styles.uploadButtonText, newExercise.thumbnail && styles.uploadButtonTextSuccess]}>
              {newExercise.thumbnail ? 'Thumbnail Selected' : 'Select Thumbnail (Optional)'}
            </Text>
          </TouchableOpacity>
          
          {newExercise.thumbnail && (
            <Image source={{uri: newExercise.thumbnail.uri}} style={styles.thumbnailPreview} />
          )}
          
          {/* Upload Progress */}
          {uploading && (
            <View style={styles.uploadProgress}>
              <Text style={styles.uploadProgressText}>Uploading... {uploadProgress}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {width: `${uploadProgress}%`}]} />
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="white" />
                <Text style={styles.submitButtonText}>Publish Exercise</Text>
              </>
            )}
          </TouchableOpacity>
          
          <View style={{height: 50}} />
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4e7bff" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>Abios Academy</Text>
          <Text style={styles.adminTitle}>Admin Dashboard</Text>
          <Text style={styles.userInfo}>Welcome, {userProfile?.full_name || user?.email}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#333" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={handleSignOut}>
            <FontAwesome name="sign-out" size={24} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Content Area */}
      <View style={styles.contentContainer}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'exercises' && renderExercises()}
        {activeTab === 'users' && (
          <View style={styles.placeholderContainer}>
            <Feather name="users" size={48} color="#4e7bff" />
            <Text style={styles.placeholderText}>User Management</Text>
            <Text style={styles.placeholderSubtext}>View and manage all users</Text>
          </View>
        )}
        {activeTab === 'analytics' && (
          <View style={styles.placeholderContainer}>
            <Feather name="bar-chart-2" size={48} color="#4e7bff" />
            <Text style={styles.placeholderText}>Analytics Dashboard</Text>
            <Text style={styles.placeholderSubtext}>View platform insights and metrics</Text>
          </View>
        )}
      </View>
      
      {/* Bottom Navigation Bar */}
      <BottomTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Upload Modal */}
      {renderUploadModal()}
      
      {/* Floating Action Button */}
      {activeTab === 'exercises' && !showUploadModal && (
        <TouchableOpacity 
          style={styles.floatingButton} 
          onPress={() => setShowUploadModal(true)}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Bottom Navigation Bar Component
const BottomTabBar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', icon: 'grid', label: 'Dashboard' },
    { id: 'exercises', icon: 'barbell', label: 'Exercises' },
    { id: 'users', icon: 'people', label: 'Users' },
    { id: 'analytics', icon: 'stats-chart', label: 'Analytics' },
  ];

  return (
    <View style={styles.tabContainer}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Ionicons
            name={activeTab === tab.id ? tab.icon : `${tab.icon}-outline`}
            size={24}
            color={activeTab === tab.id ? '#4e7bff' : '#777'}
          />
          <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fd',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fd',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {},
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  adminTitle: {
    fontSize: 16,
    color: '#777',
    marginTop: 4,
  },
  userInfo: {
    fontSize: 12,
    color: '#4e7bff',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 20,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff6b6b',
  },
  profileButton: {},
  contentContainer: {
    flex: 1,
    marginBottom: 70,
  },
  
  // Dashboard Styles
  dashboardContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statCardLarge: {
    width: width - 40,
    alignItems: 'flex-start',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  statSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  
  // Quick Actions
  quickActionsSection: {
    marginBottom: 30,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryAction: {
    backgroundColor: '#4e7bff',
    width: width - 40,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quickActionTextPrimary: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4e7bff',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Activity Section
  activityContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 14,
    color: '#999',
  },
  
  // Exercises Section
  exercisesContainer: {
    flex: 1,
    backgroundColor: '#f8f9fd',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4e7bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Category Filter
  categoryFilter: {
    marginBottom: 15,
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeCategoryFilter: {
    backgroundColor: '#4e7bff',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeCategoryFilterText: {
    color: 'white',
  },
  
  // Exercise List
  exerciseList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 15,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  exerciseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  exerciseTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  exerciseCategory: {
    fontSize: 12,
    color: '#4e7bff',
    fontWeight: '500',
  },
  exerciseDuration: {
    fontSize: 12,
    color: '#6bdb7d',
    fontWeight: '500',
  },
  difficultyTag: {
    backgroundColor: 'transparent',
  },
  exerciseDifficulty: {
    fontSize: 12,
    fontWeight: '500',
  },
  exerciseStats: {
    flexDirection: 'row',
    gap: 15,
  },
  exerciseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseStatText: {
    fontSize: 12,
    color: '#777',
  },
  exerciseActions: {
    gap: 10,
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Upload Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  uploadForm: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#f8f9fd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  
  // Category Selector
  categorySelector: {
    marginVertical: 10,
  },
  categorySelectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fd',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedCategory: {
    backgroundColor: '#4e7bff',
    borderColor: '#4e7bff',
  },
  categorySelectorText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: 'white',
  },
  
  // Difficulty Selector
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 10,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fd',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    alignItems: 'center',
  },
  selectedDifficulty: {
    backgroundColor: '#4e7bff',
    borderColor: '#4e7bff',
  },
  difficultyText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },
  selectedDifficultyText: {
    color: 'white',
  },
  
  // Upload Buttons
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fd',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    borderStyle: 'dashed',
  },
  uploadButtonSuccess: {
    backgroundColor: '#f0f8f1',
    borderColor: '#6bdb7d',
    borderStyle: 'solid',
  },
  uploadButtonContent: {
    marginLeft: 12,
    flex: 1,
  },
  uploadButtonText: {
    color: '#4e7bff',
    fontWeight: '500',
    fontSize: 16,
  },
  uploadButtonTextSuccess: {
    color: '#6bdb7d',
  },
  fileName: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  thumbnailPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 15,
  },
  
  // Upload Progress
  uploadProgress: {
    marginVertical: 20,
    padding: 16,
    backgroundColor: '#f0f5ff',
    borderRadius: 12,
  },
  uploadProgressText: {
    fontSize: 14,
    color: '#4e7bff',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4e7bff',
    borderRadius: 3,
  },
  
  // Submit Button
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#4e7bff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  
  // Placeholder Screens
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
  
  // Bottom Navigation
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 10,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tab: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    width: '25%',
  },
  activeTab: {
    backgroundColor: '#eef4ff',
  },
  tabText: {
    marginTop: 5,
    fontSize: 12,
    color: '#777',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4e7bff',
    fontWeight: '600',
  },
  
  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4e7bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default AdminDashboard;