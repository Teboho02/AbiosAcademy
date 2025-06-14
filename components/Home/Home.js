
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Text, 
  TouchableOpacity, 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  RefreshControl,
  Image,
  Dimensions,
  Modal,
  StatusBar,
  ActivityIndicator
} from "react-native";
import { Video } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { dbService } from '../../lib/supabase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Memoized Video Player Modal Component
const VideoPlayerModal = React.memo(({ visible, exercise, onClose }) => {
  const [status, setStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = React.useRef(null);

  const handlePlaybackStatusUpdate = useCallback((status) => {
    setStatus(status);
    if (status.isLoaded) {
      setIsLoading(false);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (status.isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
  }, [status.isPlaying]);

  const handleFullscreenUpdate = useCallback(async ({ fullscreenUpdate }) => {
    if (fullscreenUpdate === Video.FULLSCREEN_UPDATE_PLAYER_DID_DISMISS) {
      // Handle fullscreen dismiss if needed
    }
  }, []);

  React.useEffect(() => {
    if (visible && exercise?.video_url) {
      // Increment view count when video is opened
      dbService.incrementExerciseViews(exercise.id).catch(console.error);
    }
  }, [visible, exercise]);

  // Reset loading state when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      setIsLoading(true);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.videoModalContainer}>
        <StatusBar hidden />
        
        {/* Header */}
        <View style={styles.videoModalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle} numberOfLines={1}>
              {exercise?.title}
            </Text>
            <Text style={styles.videoMeta}>
              {exercise?.category} • {exercise?.duration} • {exercise?.difficulty}
            </Text>
          </View>
        </View>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          {exercise?.video_url ? (
            <>
              <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: exercise.video_url }}
                useNativeControls
                resizeMode="contain"
                shouldPlay={false}
                isLooping={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onFullscreenUpdate={handleFullscreenUpdate}
              />
              
              {isLoading && (
                <View style={styles.videoLoadingOverlay}>
                  <ActivityIndicator size="large" color="white" />
                  <Text style={styles.loadingText}>Loading video...</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noVideoContainer}>
              <Ionicons name="videocam-off" size={64} color="#666" />
              <Text style={styles.noVideoText}>Video not available</Text>
            </View>
          )}
        </View>

        {/* Exercise Details */}
        <View style={styles.videoDetailsContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.exerciseDescriptionTitle}>About this exercise</Text>
            <Text style={styles.exerciseDescriptionText}>
              {exercise?.description || 'No description available.'}
            </Text>
            
            <View style={styles.exerciseMetaContainer}>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={20} color="#4e7bff" />
                <Text style={styles.metaText}>{exercise?.duration}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="fitness" size={20} color="#4e7bff" />
                <Text style={styles.metaText}>{exercise?.difficulty}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="eye" size={20} color="#4e7bff" />
                <Text style={styles.metaText}>{exercise?.views || 0} views</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

// Memoized Exercise Card Component
const ExerciseCard = React.memo(({ exercise, onPress, style }) => (
  <TouchableOpacity 
    style={[styles.exerciseCard, style]}
    onPress={() => onPress(exercise)}
    activeOpacity={0.8}
  >
    <View style={styles.exerciseImageContainer}>
      <Image 
        source={
          exercise.thumbnail_url 
            ? { uri: exercise.thumbnail_url }
            : require('../../assets/placeholder1.jpg')
        } 
        style={styles.exerciseImage}
        defaultSource={require('../../assets/placeholder1.jpg')}
      />
      <View style={styles.playOverlay}>
        <Ionicons name="play-circle" size={32} color="white" />
      </View>
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{exercise.duration}</Text>
      </View>
    </View>
    <View style={styles.exerciseInfo}>
      <Text style={styles.exerciseTitle} numberOfLines={2}>
        {exercise.title}
      </Text>
      <Text style={styles.exerciseDetails}>
        {exercise.category} • {exercise.difficulty}
      </Text>
      <View style={styles.exerciseMeta}>
        <Ionicons name="eye" size={12} color="#666" />
        <Text style={styles.exerciseViews}>{exercise.views || 0}</Text>
      </View>
    </View>
  </TouchableOpacity>
));

// Memoized Category Card Component
const CategoryCard = React.memo(({ icon, color, title, onPress }) => (
  <TouchableOpacity style={styles.categoryCard} onPress={onPress}>
    <View style={[styles.categoryIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color={color.replace('20', '')} />
    </View>
    <Text style={styles.categoryText}>{title}</Text>
  </TouchableOpacity>
));

// Main Home Component
function Home() {
  const navigation = useNavigation();
  const { user, userProfile, signOut, isAdmin } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Memoized values
  const firstName = useMemo(() => {
    return userProfile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  }, [userProfile?.full_name, user?.email]);

  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }, []);

  const featuredExercises = useMemo(() => exercises.slice(0, 5), [exercises]);

  const categories = useMemo(() => [
    { icon: 'fitness', color: '#ff6b6b20', title: 'Strength' },
    { icon: 'heart', color: '#4ecdc420', title: 'Cardio' },
    { icon: 'leaf', color: '#45b7d120', title: 'Yoga' },
    { icon: 'flash', color: '#f9ca2420', title: 'HIIT' }
  ], []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [exercisesResult] = await Promise.all([
        dbService.getExercises(),
        loadUserStats()
      ]);

      if (exercisesResult.error) {
        console.error('Error loading exercises:', exercisesResult.error);
        Alert.alert('Error', 'Failed to load exercises. Please try again.');
      } else {
        setExercises(exercisesResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadUserStats = useCallback(async () => {
    try {
      // This should be replaced with actual API call
      setUserStats({
        totalWorkouts: 24,
        totalMinutes: 720,
        currentStreak: 5,
        weeklyGoal: 150,
        weeklyProgress: 90
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await signOut();
              if (error) {
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  }, [signOut]);

  const navigateToAdmin = useCallback(() => {
    navigation.navigate('AdminDashboard');
  }, [navigation]);

  const handlePlayExercise = useCallback((exercise) => {
    setSelectedExercise(exercise);
    setShowVideoModal(true);
  }, []);

  const handleCloseVideo = useCallback(() => {
    setShowVideoModal(false);
    setSelectedExercise(null);
  }, []);

  const handleCategoryPress = useCallback((category) => {
    // Navigate to category-specific exercises or filter
    console.log('Category pressed:', category);
  }, []);

  const renderQuickStats = useMemo(() => {
    if (!userStats) return null;

    return (
      <View style={styles.quickStatsCard}>
        <Text style={styles.quickStatsTitle}>This Week</Text>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill, 
            { width: `${Math.min((userStats.weeklyProgress / userStats.weeklyGoal) * 100, 100)}%` }
          ]} />
        </View>
        <Text style={styles.progressText}>
          {userStats.weeklyProgress} / {userStats.weeklyGoal} minutes
        </Text>
        
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>{userStats.currentStreak}</Text>
            <Text style={styles.quickStatLabel}>Day Streak</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>{userStats.totalWorkouts}</Text>
            <Text style={styles.quickStatLabel}>Workouts</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>{Math.floor(userStats.totalMinutes / 60)}h</Text>
            <Text style={styles.quickStatLabel}>Total Time</Text>
          </View>
        </View>
      </View>
    );
  }, [userStats]);

  const renderHomeContent = () => (
    <ScrollView 
      style={styles.content} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeText}>
          <Text style={styles.welcomeTitle}>
            Good {timeOfDay}, {firstName}! 💪
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Ready for your next workout?
          </Text>
        </View>
        <TouchableOpacity style={styles.profileAvatar}>
          <Ionicons name="person" size={24} color="#4e7bff" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      {renderQuickStats}

      {/* Featured Exercises */}
      <View style={styles.featuredSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Workouts</Text>
          <TouchableOpacity onPress={() => setActiveTab('workouts')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4e7bff" />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseScroll}>
            {featuredExercises.map((exercise, index) => (
              <ExerciseCard 
                key={exercise.id || index}
                exercise={exercise}
                onPress={handlePlayExercise}
                style={index === featuredExercises.length - 1 ? { marginRight: 20 } : null}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <CategoryCard
              key={index}
              icon={category.icon}
              color={category.color}
              title={category.title}
              onPress={() => handleCategoryPress(category.title)}
            />
          ))}
        </View>
      </View>

      {/* Admin Access */}
      {isAdmin() && (
        <TouchableOpacity style={styles.adminCard} onPress={navigateToAdmin}>
          <View style={styles.adminIcon}>
            <Ionicons name="settings" size={24} color="#6c5ce7" />
          </View>
          <View style={styles.adminText}>
            <Text style={styles.adminTitle}>Admin Dashboard</Text>
            <Text style={styles.adminSubtitle}>Manage exercises and users</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderWorkoutsContent = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>My Workouts</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4e7bff" />
        </View>
      ) : exercises.length > 0 ? (
        exercises.map((exercise, index) => (
          <TouchableOpacity 
            key={exercise.id || index} 
            style={styles.workoutListCard}
            onPress={() => handlePlayExercise(exercise)}
            activeOpacity={0.8}
          >
            <View style={styles.workoutImageContainer}>
              <Image 
                source={
                  exercise.thumbnail_url 
                    ? { uri: exercise.thumbnail_url }
                    : require('../../assets/placeholder1.jpg')
                } 
                style={styles.workoutListImage}
                defaultSource={require('../../assets/placeholder1.jpg')}
              />
              <View style={styles.workoutPlayOverlay}>
                <Ionicons name="play" size={20} color="white" />
              </View>
            </View>
            <View style={styles.workoutListInfo}>
              <Text style={styles.workoutListTitle} numberOfLines={2}>
                {exercise.title}
              </Text>
              <Text style={styles.workoutListDetails}>
                {exercise.category} • {exercise.duration} • {exercise.difficulty}
              </Text>
              <View style={styles.workoutListMeta}>
                <Ionicons name="eye" size={14} color="#666" />
                <Text style={styles.workoutListViews}>{exercise.views || 0} views</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyWorkouts}>
          <Ionicons name="barbell-outline" size={64} color="#ccc" />
          <Text style={styles.emptyWorkoutsText}>No workouts available</Text>
          <Text style={styles.emptyWorkoutsSubtext}>Check back later for new exercises</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderProgressContent = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Your Progress</Text>
      
      {/* Weekly Progress Chart */}
      <View style={styles.progressCard}>
        <Text style={styles.cardTitle}>This Week's Activity</Text>
        <View style={styles.weeklyChart}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <View key={day} style={styles.dayColumn}>
              <View style={[styles.dayBar, { height: Math.random() * 60 + 20 }]} />
              <Text style={styles.dayLabel}>{day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.achievementsCard}>
        <Text style={styles.cardTitle}>Recent Achievements</Text>
        <View style={styles.achievementsList}>
          <View style={styles.achievementItem}>
            <View style={styles.achievementIcon}>
              <Ionicons name="flame" size={20} color="#ff6b6b" />
            </View>
            <View style={styles.achievementText}>
              <Text style={styles.achievementTitle}>5 Day Streak!</Text>
              <Text style={styles.achievementDate}>Today</Text>
            </View>
          </View>
          <View style={styles.achievementItem}>
            <View style={styles.achievementIcon}>
              <Ionicons name="trophy" size={20} color="#ffd700" />
            </View>
            <View style={styles.achievementText}>
              <Text style={styles.achievementTitle}>First Workout Complete</Text>
              <Text style={styles.achievementDate}>3 days ago</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderSettingsContent = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Settings</Text>
      
      {/* Profile Section */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="person-outline" size={20} color="#666" />
          <Text style={styles.settingsItemText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="notifications-outline" size={20} color="#666" />
          <Text style={styles.settingsItemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" />
          <Text style={styles.settingsItemText}>Privacy</Text>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* App Settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>App Settings</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="moon-outline" size={20} color="#666" />
          <Text style={styles.settingsItemText}>Dark Mode</Text>
          <View style={styles.toggle}>
            <View style={styles.toggleInactive} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="language-outline" size={20} color="#666" />
          <Text style={styles.settingsItemText}>Language</Text>
          <Text style={styles.settingsItemValue}>English</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="download-outline" size={20} color="#666" />
          <Text style={styles.settingsItemText}>Download Quality</Text>
          <Text style={styles.settingsItemValue}>High</Text>
        </TouchableOpacity>
      </View>

      {/* Support */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Support</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="help-circle-outline" size={20} color="#666" />
          <Text style={styles.settingsItemText}>Help Center</Text>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.settingsItemText}>Contact Us</Text>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="star-outline" size={20} color="#666" />
          <Text style={styles.settingsItemText}>Rate App</Text>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Account */}
      <View style={styles.settingsCard}>
        <TouchableOpacity style={[styles.settingsItem, styles.logoutItem]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
          <Text style={[styles.settingsItemText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'workouts':
        return renderWorkoutsContent();
      case 'progress':
        return renderProgressContent();
      case 'settings':
        return renderSettingsContent();
      default:
        return renderHomeContent();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.appTitle}>Abios Academy</Text>
          {userProfile?.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Video Player Modal */}
      <VideoPlayerModal
        visible={showVideoModal}
        exercise={selectedExercise}
        onClose={handleCloseVideo}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' && styles.activeNavItem]}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={activeTab === 'home' ? 'home' : 'home-outline'} 
            size={24} 
            color={activeTab === 'home' ? '#4e7bff' : '#999'} 
          />
          <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'workouts' && styles.activeNavItem]}
          onPress={() => setActiveTab('workouts')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={activeTab === 'workouts' ? 'barbell' : 'barbell-outline'} 
            size={24} 
            color={activeTab === 'workouts' ? '#4e7bff' : '#999'} 
          />
          <Text style={[styles.navText, activeTab === 'workouts' && styles.activeNavText]}>
            Workouts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'progress' && styles.activeNavItem]}
          onPress={() => setActiveTab('progress')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={activeTab === 'progress' ? 'stats-chart' : 'stats-chart-outline'} 
            size={24} 
            color={activeTab === 'progress' ? '#4e7bff' : '#999'} 
          />
          <Text style={[styles.navText, activeTab === 'progress' && styles.activeNavText]}>
            Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'settings' && styles.activeNavItem]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'} 
            size={24} 
            color={activeTab === 'settings' ? '#4e7bff' : '#999'} 
          />
          <Text style={[styles.navText, activeTab === 'settings' && styles.activeNavText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fd',
    },
    header: {
        backgroundColor: 'white',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    appTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    roleBadge: {
        backgroundColor: '#4e7bff20',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        color: '#4e7bff',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    welcomeSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeText: {
        flex: 1,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    profileAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4e7bff20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickStatsCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickStatsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4e7bff',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    quickStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    quickStatItem: {
        alignItems: 'center',
    },
    quickStatNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4e7bff',
        marginBottom: 4,
    },
    quickStatLabel: {
        fontSize: 12,
        color: '#666',
    },
    featuredSection: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    seeAllText: {
        fontSize: 14,
        color: '#4e7bff',
        fontWeight: '500',
    },
    exerciseScroll: {
        marginLeft: -20,
        paddingLeft: 20,
    },
    exerciseCard: {
        width: 200,
        backgroundColor: 'white',
        borderRadius: 12,
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    exerciseImageContainer: {
        position: 'relative',
    },
    exerciseImage: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    durationBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    durationText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    exerciseInfo: {
        padding: 12,
    },
    exerciseTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    exerciseDetails: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },
    exerciseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    exerciseViews: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    categoriesSection: {
        marginBottom: 25,
    },
    categoriesGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: (width - 80) / 4,
        alignItems: 'center',
    },
    categoryIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
    },
    adminCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    adminIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6c5ce720',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    adminText: {
        flex: 1,
    },
    adminTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    adminSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    
    // Workouts Screen Styles
    workoutListCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    workoutImageContainer: {
        position: 'relative',
        marginRight: 12,
    },
    workoutListImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    workoutPlayOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    workoutListInfo: {
        flex: 1,
    },
    workoutListTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    workoutListDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    workoutListMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    workoutListViews: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    emptyWorkouts: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyWorkoutsText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 20,
        textAlign: 'center',
    },
    emptyWorkoutsSubtext: {
        fontSize: 16,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
    },

    // Video Player Modal Styles
    videoModalContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    videoModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    closeButton: {
        marginRight: 15,
    },
    videoInfo: {
        flex: 1,
    },
    videoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    videoMeta: {
        fontSize: 14,
        color: '#ccc',
    },
    videoContainer: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },
    video: {
        width: width,
        height: width * 9/16, // 16:9 aspect ratio
    },
    videoLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingSpinner: {
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 10,
        fontSize: 16,
    },
    noVideoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    noVideoText: {
        color: '#666',
        fontSize: 18,
        marginTop: 15,
    },
    videoDetailsContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    exerciseDescriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    exerciseDescriptionText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 20,
    },
    exerciseMetaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    metaItem: {
        alignItems: 'center',
        flex: 1,
    },
    metaText: {
        fontSize: 14,
        color: '#333',
        marginTop: 5,
        fontWeight: '500',
    },
    tagsContainer: {
        marginBottom: 20,
    },
    tagsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    tagsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },

    // Progress Screen Styles
    progressCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    weeklyChart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 80,
        marginBottom: 10,
    },
    dayColumn: {
        alignItems: 'center',
        flex: 1,
    },
    dayBar: {
        width: 20,
        backgroundColor: '#4e7bff',
        borderRadius: 10,
        marginBottom: 8,
    },
    dayLabel: {
        fontSize: 12,
        color: '#666',
    },
    achievementsCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    achievementsList: {
        gap: 16,
    },
    achievementItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    achievementIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8f9fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    achievementText: {
        flex: 1,
    },
    achievementTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    achievementDate: {
        fontSize: 14,
        color: '#666',
    },

    // Settings Screen Styles
    settingsCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    settingsCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        padding: 20,
        paddingBottom: 0,
        marginBottom: 10,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fd',
    },
    settingsItemText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    settingsItemValue: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    toggle: {
        width: 50,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    toggleInactive: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#ddd',
    },
    toggleActive: {
        backgroundColor: '#4e7bff',
        alignSelf: 'flex-end',
    },
    logoutItem: {
        borderBottomWidth: 0,
    },
    logoutText: {
        color: '#ff6b6b',
    },

    // Bottom Navigation
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingVertical: 8,
        paddingBottom: 20,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    activeNavItem: {
        backgroundColor: '#4e7bff10',
        borderRadius: 12,
        marginHorizontal: 4,
    },
    navText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        fontWeight: '500',
    },
    activeNavText: {
        color: '#4e7bff',
        fontWeight: '600',
    },
});

export default Home;