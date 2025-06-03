// src/components/admin/AdminHome.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome, AntDesign, Ionicons, Entypo } from '@expo/vector-icons';

const AdminHome = () => {
  const navigation = useNavigation();
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
            <Text style={styles.activityText}>12 new users joined today</Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
        </View>
        
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Ionicons name="videocam" size={18} color="#ff6b6b" />
          </View>
          <View>
            <Text style={styles.activityText}>You uploaded a new workout video</Text>
            <Text style={styles.activityTime}>Yesterday</Text>
          </View>
        </View>
        
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Entypo name="star" size={18} color="#ffb347" />
          </View>
          <View>
            <Text style={styles.activityText}>HIIT Workout received 24 new ratings</Text>
            <Text style={styles.activityTime}>2 days ago</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderExercises = () => (
    <View style={styles.exercisesContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddExercise}>
          <AntDesign name="plus" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.exerciseList}>
        {exercises.map(exercise => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseThumbnail}>
              <Ionicons name="barbell" size={24} color="#4e7bff" />
            </View>
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
                <Text style={styles.viewsText}>{exercise.views} views</Text>
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
      </ScrollView>
    </View>
  );

  const renderUsers = () => (
    <View style={styles.usersContainer}>
      <Text style={styles.sectionTitle}>Active Users</Text>
      
      <View style={styles.userList}>
        {users.map(user => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userAvatar}>
              <FontAwesome name="user" size={24} color="#4e7bff" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userJoined}>Joined: {user.joined}</Text>
            </View>
            <View style={styles.userStats}>
              <Text style={styles.workoutCount}>{user.workouts}</Text>
              <Text style={styles.workoutLabel}>Workouts</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>Abios Academy</Text>
          <Text style={styles.adminTitle}>Admin Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#333" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <FontAwesome name="user-circle" size={32} color="#4e7bff" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={24} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dashboard..."
          placeholderTextColor="#999"
        />
      </View>
      
      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons name="grid" size={20} color={activeTab === 'dashboard' ? '#4e7bff' : '#777'} />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'exercises' && styles.activeTab]}
          onPress={() => setActiveTab('exercises')}
        >
          <Ionicons name="barbell" size={20} color={activeTab === 'exercises' ? '#4e7bff' : '#777'} />
          <Text style={[styles.tabText, activeTab === 'exercises' && styles.activeTabText]}>
            Exercises
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons name="people" size={20} color={activeTab === 'users' ? '#4e7bff' : '#777'} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Ionicons name="stats-chart" size={20} color={activeTab === 'analytics' ? '#4e7bff' : '#777'} />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
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
            <Text style={styles.sectionTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonText}>Detailed analytics will be available in the next update</Text>
            <View style={styles.comingSoonPlaceholder}>
              <Ionicons name="stats-chart" size={60} color="#4e7bff" />
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Add Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddExercise}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
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
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: 'white',
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dashboardContainer: {},
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4e7bff',
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
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#f0f5ff',
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
    color: '#333',
    marginBottom: 5,
  },
  exerciseMeta: {
    flexDirection: 'row',
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
  },
  exerciseDuration: {
    backgroundColor: '#f0f8f1',
    color: '#6bdb7d',
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
    backgroundColor: '#fff9f0',
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
  usersContainer: {
    flex: 1,
  },
  userList: {},
  userCard: {
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
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f5ff',
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
    color: '#333',
    marginBottom: 5,
  },
  userJoined: {
    fontSize: 14,
    color: '#999',
  },
  userStats: {
    alignItems: 'center',
  },
  workoutCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4e7bff',
  },
  workoutLabel: {
    fontSize: 12,
    color: '#999',
  },
  analyticsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  comingSoonText: {
    fontSize: 18,
    color: '#777',
    textAlign: 'center',
    marginBottom: 30,
  },
  comingSoonPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f5ff',
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

export default AdminHome;