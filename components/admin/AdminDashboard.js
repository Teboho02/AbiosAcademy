// src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert, Platform } from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../contexts/AuthContext';
import { dbService, storageService } from '../../lib/supabase';

const AdminDashboard = () => {
  const { user, userProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exercises, setExercises] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    exercises: 0,
    videoMinutes: 0
  });
  
  const [newExercise, setNewExercise] = useState({
    title: '',
    category: '',
    duration: '',
    difficulty: 'Beginner',
    description: '',
    video: null,
    thumbnail: null
  });
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

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

      // Load stats
      const statsData = await dbService.getAppStats();
      setStats({
        ...statsData,
        exercises: exercisesData?.length || 0,
        videoMinutes: Math.floor(Math.random() * 500) + 100 // Mock data for now
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = async (id) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
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
      
      if (!result.canceled) {
        setNewExercise({...newExercise, video: result.assets[0]});
      }
    } catch (err) {
      console.log('Error picking video:', err);
    }
  };

  const pickThumbnail = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setNewExercise({...newExercise, thumbnail: result.assets[0]});
      }
    } catch (err) {
      console.log('Error picking thumbnail:', err);
    }
  };

  const handleUpload = async () => {
    if (!newExercise.title || !newExercise.category || !newExercise.duration) {
      Alert.alert('Missing Information', 'Please fill all required fields');
      return;
    }

    setUploading(true);
    
    try {
      let videoUrl = null;
      let thumbnailUrl = null;
      let videoPath = null;
      let thumbnailPath = null;

      // Upload video if selected
      if (newExercise.video) {
        const videoResult = await storageService.uploadExerciseVideo(
          newExercise.video, 
          Date.now().toString()
        );
        if (videoResult.error) {
          throw new Error('Failed to upload video');
        }
        videoUrl = videoResult.data.url;
        videoPath = videoResult.data.path;
      }

      // Upload thumbnail if selected
      if (newExercise.thumbnail) {
        const thumbnailResult = await storageService.uploadExerciseThumbnail(
          newExercise.thumbnail, 
          Date.now().toString()
        );
        if (thumbnailResult.error) {
          throw new Error('Failed to upload thumbnail');
        }
        thumbnailUrl = thumbnailResult.data.url;
        thumbnailPath = thumbnailResult.data.path;
      }

      // Create exercise in database
      const exerciseData = {
        title: newExercise.title,
        description: newExercise.description,
        category: newExercise.category,
        duration: newExercise.duration,
        difficulty: newExercise.difficulty,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        video_path: videoPath,
        thumbnail_path: thumbnailPath,
        created_by: user.id,
        views: 0
      };

      const { data, error } = await dbService.createExercise(exerciseData);
      
      if (error) {
        throw new Error(error.message);
      }

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
        thumbnail: null
      });
      
      setShowUploadModal(false);
      Alert.alert('Success', 'Exercise uploaded successfully!');
      
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload exercise');
    } finally {
      setUploading(false);
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

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <Text style={styles.sectionTitle}>Dashboard Overview</Text>
      
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, {backgroundColor: '#4e7bff'}]}>
          <Ionicons name="people" size={30} color="white" />
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        
        <View style={[styles.statCard, {backgroundColor: '#ff6b6b'}]}>
          <Ionicons name="person" size={30} color="white" />
          <Text style={styles.statNumber}>{stats.activeUsers}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>
        
        <View style={[styles.statCard, {backgroundColor: '#6bdb7d'}]}>
          <Ionicons name="barbell" size={30} color="white" />
          <Text style={styles.statNumber}>{stats.exercises}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
        
        <View style={[styles.statCard, {backgroundColor: '#ffb347'}]}>
          <Ionicons name="videocam" size={30} color="white" />
          <Text style={styles.statNumber}>{stats.videoMinutes}</Text>
          <Text style={styles.statLabel}>Minutes of Video</Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityContainer}>
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <FontAwesome name="user-plus" size={18} color="#4e7bff" />
          </View>
          <View>
            <Text style={styles.activityTime}>Yesterday</Text>
          </View>
        </View>
        
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Entypo name="star" size={18} color="#ffb347" />
          </View>
          <View>
            <Text style={styles.activityText}>Exercises received new ratings</Text>
            <Text style={styles.activityTime}>2 days ago</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderExercises = () => (
    <View style={styles.exercisesContainer}>
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => setShowUploadModal(true)}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Upload New Exercise</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.exerciseList}>
        {exercises.map(exercise => (
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
              <View style={styles.exerciseMeta}>
                <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                <Text style={[styles.exerciseDifficulty, 
                             {color: exercise.difficulty === 'Beginner' ? '#6bdb7d' : 
                                      exercise.difficulty === 'Intermediate' ? '#ffb347' : '#ff6b6b'}]}>
                  {exercise.difficulty}
                </Text>
              </View>
              <View style={styles.exerciseViews}>
                <Ionicons name="eye" size={16} color="#777" />
                <Text style={styles.viewsText}>{exercise.views || 0} views</Text>
              </View>
            </View>
            <View style={styles.exerciseActions}>
              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome name="pencil" size={16} color="#4e7bff" />
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
        
        {exercises.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No exercises yet</Text>
            <Text style={styles.emptyStateSubtext}>Upload your first exercise to get started</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderUploadModal = () => (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Upload New Exercise Video</Text>
          <TouchableOpacity onPress={() => setShowUploadModal(false)}>
            <Ionicons name="close" size={24} color="#777" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.uploadForm}>
          <Text style={styles.inputLabel}>Exercise Title*</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter exercise name"
            value={newExercise.title}
            onChangeText={text => setNewExercise({...newExercise, title: text})}
          />
          
          <Text style={styles.inputLabel}>Category*</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Strength, Cardio, Yoga"
            value={newExercise.category}
            onChangeText={text => setNewExercise({...newExercise, category: text})}
          />
          
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
            style={[styles.input, {height: 100}]}
            placeholder="Describe the exercise..."
            multiline
            value={newExercise.description}
            onChangeText={text => setNewExercise({...newExercise, description: text})}
          />
          
          <Text style={styles.inputLabel}>Upload Video</Text>
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={pickVideo}
          >
            <Ionicons name="videocam" size={24} color="#4e7bff" />
            <Text style={styles.uploadButtonText}>
              {newExercise.video ? 'Video Selected' : 'Select Video File'}
            </Text>
            {newExercise.video && (
              <Text style={styles.fileName}>{newExercise.video.name}</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.inputLabel}>Thumbnail Image</Text>
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={pickThumbnail}
          >
            <Ionicons name="image" size={24} color="#4e7bff" />
            <Text style={styles.uploadButtonText}>
              {newExercise.thumbnail ? 'Image Selected' : 'Select Thumbnail'}
            </Text>
          </TouchableOpacity>
          
          {newExercise.thumbnail && (
            <Image source={{uri: newExercise.thumbnail.uri}} style={styles.thumbnailPreview} />
          )}
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <Text style={styles.submitButtonText}>Uploading...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Publish Exercise</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
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
      <ScrollView style={styles.contentContainer}>
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
      </ScrollView>
      
      {/* Bottom Navigation Bar */}
      <BottomTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Upload Modal */}
      {showUploadModal && renderUploadModal()}
      
      {/* Add Button */}
      {activeTab === 'exercises' && !showUploadModal && (
        <TouchableOpacity 
          style={styles.floatingButton} 
          onPress={() => setShowUploadModal(true)}
        >
          <Ionicons name="add" size={32} color="white" />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {},
  appTitle: {
    fontSize: 22,
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
    paddingHorizontal: 20,
    marginBottom: 70,
  },
  dashboardContainer: {},
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: 'white',
  },
  activityContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#999',
  },
  exercisesContainer: {
    flex: 1,
    marginTop: 20,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4e7bff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  exerciseList: {
    marginBottom: 100,
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  exerciseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  exerciseCategory: {
    backgroundColor: '#eef4ff',
    color: '#4e7bff',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 12,
    marginRight: 8,
    marginBottom: 5,
  },
  exerciseDuration: {
    backgroundColor: '#f0f8f1',
    color: '#6bdb7d',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 12,
    marginRight: 8,
    marginBottom: 5,
  },
  exerciseDifficulty: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 12,
    backgroundColor: '#fff9f0',
    marginBottom: 5,
  },
  exerciseViews: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsText: {
    marginLeft: 5,
    color: '#777',
    fontSize: 14,
  },
  exerciseActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  placeholderText: {
    fontSize: 22,
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
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    width: '25%',
  },
  activeTab: {
    backgroundColor: '#eef4ff',
  },
  tabText: {
    marginTop: 5,
    fontSize: 12,
    color: '#777',
  },
  activeTabText: {
    color: '#4e7bff',
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4e7bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  uploadForm: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#f8f9fd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  difficultyButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f8f9fd',
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedDifficulty: {
    backgroundColor: '#eef4ff',
    borderColor: '#4e7bff',
  },
  difficultyText: {
    color: '#777',
    fontWeight: '500',
  },
  selectedDifficultyText: {
    color: '#4e7bff',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  uploadButtonText: {
    marginLeft: 10,
    color: '#4e7bff',
    fontWeight: '500',
  },
  fileName: {
    marginLeft: 10,
    color: '#777',
    fontSize: 12,
    flex: 1,
  },
  thumbnailPreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: 'center',
  },
  submitButton: {
    backgroundColor: '#4e7bff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AdminDashboard;