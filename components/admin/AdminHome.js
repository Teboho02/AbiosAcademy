// src/components/admin/AdminHome.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome, AntDesign, Ionicons, Entypo } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const AdminHome = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for demonstration
  const [exercises, setExercises] = useState([
    { id: 1, title: 'Chest Press', category: 'Strength', duration: '15 min', difficulty: 'Intermediate', views: 1245 },
    { id: 2, title: 'HIIT Workout', category: 'Cardio', duration: '20 min', difficulty: 'Advanced', views: 2456 },
    { id: 3, title: 'Yoga Flow', category: 'Flexibility', duration: '30 min', difficulty: 'Beginner', views: 3567 },
    { id: 4, title: 'Leg Day', category: 'Strength', duration: '25 min', difficulty: 'Intermediate', views: 1890 },
  ]);
  
  const [users, setUsers] = useState([
    { id: 1, name: 'Alex Johnson', joined: '2 weeks ago', workouts: 12 },
    { id: 2, name: 'Maria Garcia', joined: '1 month ago', workouts: 24 },
    { id: 3, name: 'David Smith', joined: '3 days ago', workouts: 3 },
  ]);
  
  const stats = {
    totalUsers: 1245,
    activeUsers: 845,
    exercises: 56,
    videoMinutes: 482
  };

  const handleDeleteExercise = (id) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleAddExercise = () => {
    navigation.navigate('AddExercise');
  };

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <Text style={[styles.sectionTitle, {color: theme.text}]}>Dashboard Overview</Text>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, {backgroundColor: theme.primary}]}>
          <Ionicons name="people" size={30} color="white" />
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>

        <View style={[styles.statCard, {backgroundColor: theme.error}]}>
          <Ionicons name="person" size={30} color="white" />
          <Text style={styles.statNumber}>{stats.activeUsers}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>

        <View style={[styles.statCard, {backgroundColor: theme.success}]}>
          <Ionicons name="barbell" size={30} color="white" />
          <Text style={styles.statNumber}>{stats.exercises}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>

        <View style={[styles.statCard, {backgroundColor: theme.warning}]}>
          <Ionicons name="videocam" size={30} color="white" />
          <Text style={styles.statNumber}>{stats.videoMinutes}</Text>
          <Text style={styles.statLabel}>Minutes of Video</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, {color: theme.text}]}>Recent Activity</Text>
      <View style={[styles.activityContainer, {backgroundColor: theme.cardBackground}]}>
        <View style={[styles.activityItem, {borderBottomColor: theme.border}]}>
          <View style={[styles.activityIcon, {backgroundColor: theme.primary + '20'}]}>
            <FontAwesome name="user-plus" size={18} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.activityText, {color: theme.text}]}>12 new users joined today</Text>
            <Text style={[styles.activityTime, {color: theme.textSecondary}]}>2 hours ago</Text>
          </View>
        </View>

        <View style={[styles.activityItem, {borderBottomColor: theme.border}]}>
          <View style={[styles.activityIcon, {backgroundColor: theme.error + '20'}]}>
            <Ionicons name="videocam" size={18} color={theme.error} />
          </View>
          <View>
            <Text style={[styles.activityText, {color: theme.text}]}>You uploaded a new workout video</Text>
            <Text style={[styles.activityTime, {color: theme.textSecondary}]}>Yesterday</Text>
          </View>
        </View>

        <View style={[styles.activityItem, {borderBottomColor: theme.border}]}>
          <View style={[styles.activityIcon, {backgroundColor: theme.warning + '20'}]}>
            <Entypo name="star" size={18} color={theme.warning} />
          </View>
          <View>
            <Text style={[styles.activityText, {color: theme.text}]}>HIIT Workout received 24 new ratings</Text>
            <Text style={[styles.activityTime, {color: theme.textSecondary}]}>2 days ago</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderExercises = () => (
    <View style={styles.exercisesContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, {backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder}]}
          placeholder="Search exercises..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={[styles.addButton, {backgroundColor: theme.primary}]} onPress={handleAddExercise}>
          <AntDesign name="plus" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.exerciseList}>
        {exercises.map(exercise => (
          <View key={exercise.id} style={[styles.exerciseCard, {backgroundColor: theme.cardBackground}]}>
            <View style={[styles.exerciseThumbnail, {backgroundColor: theme.primary + '20'}]}>
              <Ionicons name="barbell" size={24} color={theme.primary} />
            </View>
            <View style={styles.exerciseDetails}>
              <Text style={[styles.exerciseTitle, {color: theme.text}]}>{exercise.title}</Text>
              <View style={styles.exerciseMeta}>
                <Text style={[styles.exerciseCategory, {backgroundColor: theme.primary + '20', color: theme.primary}]}>{exercise.category}</Text>
                <Text style={[styles.exerciseDuration, {backgroundColor: theme.success + '20', color: theme.success}]}>{exercise.duration}</Text>
                <Text style={[styles.exerciseDifficulty,
                             {color: exercise.difficulty === 'Beginner' ? theme.success :
                                      exercise.difficulty === 'Intermediate' ? theme.warning : theme.error,
                              backgroundColor: exercise.difficulty === 'Beginner' ? theme.success + '20' :
                                      exercise.difficulty === 'Intermediate' ? theme.warning + '20' : theme.error + '20'}]}>
                  {exercise.difficulty}
                </Text>
              </View>
              <View style={styles.exerciseViews}>
                <Ionicons name="eye" size={16} color={theme.textSecondary} />
                <Text style={[styles.viewsText, {color: theme.textSecondary}]}>{exercise.views} views</Text>
              </View>
            </View>
            <View style={styles.exerciseActions}>
              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome name="pencil" size={16} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteExercise(exercise.id)}
              >
                <FontAwesome name="trash" size={16} color={theme.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderUsers = () => (
    <View style={styles.usersContainer}>
      <Text style={[styles.sectionTitle, {color: theme.text}]}>Active Users</Text>

      <View style={styles.userList}>
        {users.map(user => (
          <View key={user.id} style={[styles.userCard, {backgroundColor: theme.cardBackground}]}>
            <View style={[styles.userAvatar, {backgroundColor: theme.primary + '20'}]}>
              <FontAwesome name="user" size={24} color={theme.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, {color: theme.text}]}>{user.name}</Text>
              <Text style={[styles.userJoined, {color: theme.textSecondary}]}>Joined: {user.joined}</Text>
            </View>
            <View style={styles.userStats}>
              <Text style={[styles.workoutCount, {color: theme.primary}]}>{user.workouts}</Text>
              <Text style={[styles.workoutLabel, {color: theme.textSecondary}]}>Workouts</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.cardBackground, borderBottomColor: theme.border}]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.appTitle, {color: theme.text}]}>Abios Academy</Text>
          <Text style={[styles.adminTitle, {color: theme.textSecondary}]}>Admin Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color={theme.text} />
            <View style={[styles.notificationBadge, {backgroundColor: theme.error}]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <FontAwesome name="user-circle" size={32} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, {backgroundColor: theme.cardBackground}]}>
        <MaterialIcons name="search" size={24} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, {color: theme.text}]}
          placeholder="Search dashboard..."
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      {/* Navigation Tabs */}
      <View style={[styles.tabContainer, {backgroundColor: theme.cardBackground}]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && {backgroundColor: theme.primary + '20'}]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons name="grid" size={20} color={activeTab === 'dashboard' ? theme.primary : theme.textSecondary} />
          <Text style={[styles.tabText, {color: activeTab === 'dashboard' ? theme.primary : theme.textSecondary}]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'exercises' && {backgroundColor: theme.primary + '20'}]}
          onPress={() => setActiveTab('exercises')}
        >
          <Ionicons name="barbell" size={20} color={activeTab === 'exercises' ? theme.primary : theme.textSecondary} />
          <Text style={[styles.tabText, {color: activeTab === 'exercises' ? theme.primary : theme.textSecondary}]}>
            Exercises
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && {backgroundColor: theme.primary + '20'}]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons name="people" size={20} color={activeTab === 'users' ? theme.primary : theme.textSecondary} />
          <Text style={[styles.tabText, {color: activeTab === 'users' ? theme.primary : theme.textSecondary}]}>
            Users
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && {backgroundColor: theme.primary + '20'}]}
          onPress={() => setActiveTab('analytics')}
        >
          <Ionicons name="stats-chart" size={20} color={activeTab === 'analytics' ? theme.primary : theme.textSecondary} />
          <Text style={[styles.tabText, {color: activeTab === 'analytics' ? theme.primary : theme.textSecondary}]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView style={styles.contentContainer}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'exercises' && renderExercises()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'analytics' && (
          <View style={styles.analyticsContainer}>
            <Text style={[styles.sectionTitle, {color: theme.text}]}>Coming Soon</Text>
            <Text style={[styles.comingSoonText, {color: theme.textSecondary}]}>Detailed analytics will be available in the next update</Text>
            <View style={[styles.comingSoonPlaceholder, {backgroundColor: theme.primary + '20'}]}>
              <Ionicons name="stats-chart" size={60} color={theme.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={[styles.floatingButton, {backgroundColor: theme.primary}]} onPress={handleAddExercise}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  headerLeft: {},
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  adminTitle: {
    fontSize: 16,
    marginTop: 4,
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
  },
  profileButton: {},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  activeTab: {},
  tabText: {
    marginTop: 5,
    fontSize: 12,
  },
  activeTabText: {
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dashboardContainer: {},
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
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
    borderRadius: 12,
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityText: {
    fontSize: 16,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
  },
  exercisesContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  exerciseList: {
    marginBottom: 100,
  },
  exerciseCard: {
    flexDirection: 'row',
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
    width: 60,
    height: 60,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  exerciseMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  exerciseCategory: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 12,
    marginRight: 8,
  },
  exerciseDuration: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 12,
    marginRight: 8,
  },
  exerciseDifficulty: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 12,
  },
  exerciseViews: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsText: {
    marginLeft: 5,
    fontSize: 14,
  },
  exerciseActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 15,
  },
  usersContainer: {
    flex: 1,
  },
  userList: {},
  userCard: {
    flexDirection: 'row',
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
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  userJoined: {
    fontSize: 14,
  },
  userStats: {
    alignItems: 'center',
  },
  workoutCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  workoutLabel: {
    fontSize: 12,
  },
  analyticsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  comingSoonText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  comingSoonPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default AdminHome;