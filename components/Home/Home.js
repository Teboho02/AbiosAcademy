import React, { useState, useEffect } from "react";
import { 
  Text, 
  TouchableOpacity, 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  RefreshControl,
  Image,
  Dimensions
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { dbService } from '../../lib/supabase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

function Home() {
    const navigation = useNavigation();
    const { user, userProfile, signOut, isAdmin } = useAuth();
    const [exercises, setExercises] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('home');

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            const [exercisesResult] = await Promise.all([
                dbService.getExercises(),
                loadUserStats()
            ]);

            if (exercisesResult.error) {
                console.error('Error loading exercises:', exercisesResult.error);
            } else {
                setExercises(exercisesResult.data || []);
            }

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserStats = async () => {
        try {
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
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Logout', 
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await signOut();
                        if (error) {
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const navigateToAdmin = () => {
        navigation.navigate('AdminDashboard');
    };

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
                        Good {getTimeOfDay()}, {getFirstName()}! 💪
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
            {userStats && (
                <View style={styles.quickStatsCard}>
                    <Text style={styles.quickStatsTitle}>This Week</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(userStats.weeklyProgress / userStats.weeklyGoal) * 100}%` }]} />
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
            )}

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>Quick Start</Text>
                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity style={[styles.quickActionCard, styles.primaryAction]}>
                        <Ionicons name="play-circle" size={32} color="white" />
                        <Text style={styles.quickActionTextPrimary}>Start Workout</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionCard}>
                        <Ionicons name="library" size={24} color="#4e7bff" />
                        <Text style={styles.quickActionText}>Browse Plans</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionCard}>
                        <Ionicons name="stats-chart" size={24} color="#4e7bff" />
                        <Text style={styles.quickActionText}>Progress</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionCard}>
                        <Ionicons name="trophy" size={24} color="#4e7bff" />
                        <Text style={styles.quickActionText}>Challenges</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Featured Exercises */}
            <View style={styles.featuredSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Popular Workouts</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseScroll}>
                    {exercises.slice(0, 5).map((exercise, index) => (
                        <TouchableOpacity key={exercise.id || index} style={styles.exerciseCard}>
                            <Image 
                                source={
                                    exercise.thumbnail_url 
                                        ? { uri: exercise.thumbnail_url }
                                        : require('../../assets/placeholder1.jpg')
                                } 
                                style={styles.exerciseImage}
                            />
                            <View style={styles.exerciseInfo}>
                                <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                                <Text style={styles.exerciseDetails}>
                                    {exercise.duration} • {exercise.difficulty}
                                </Text>
                                <View style={styles.exerciseMeta}>
                                    <Ionicons name="people" size={12} color="#666" />
                                    <Text style={styles.exerciseViews}>{exercise.views || 0}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Categories */}
            <View style={styles.categoriesSection}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <View style={styles.categoriesGrid}>
                    <TouchableOpacity style={styles.categoryCard}>
                        <View style={[styles.categoryIcon, { backgroundColor: '#ff6b6b20' }]}>
                            <Ionicons name="fitness" size={24} color="#ff6b6b" />
                        </View>
                        <Text style={styles.categoryText}>Strength</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.categoryCard}>
                        <View style={[styles.categoryIcon, { backgroundColor: '#4ecdc420' }]}>
                            <Ionicons name="heart" size={24} color="#4ecdc4" />
                        </View>
                        <Text style={styles.categoryText}>Cardio</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.categoryCard}>
                        <View style={[styles.categoryIcon, { backgroundColor: '#45b7d120' }]}>
                            <Ionicons name="leaf" size={24} color="#45b7d1" />
                        </View>
                        <Text style={styles.categoryText}>Yoga</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.categoryCard}>
                        <View style={[styles.categoryIcon, { backgroundColor: '#f9ca2420' }]}>
                            <Ionicons name="flash" size={24} color="#f9ca24" />
                        </View>
                        <Text style={styles.categoryText}>HIIT</Text>
                    </TouchableOpacity>
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

    const renderWorkoutsContent = () => (
        <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>My Workouts</Text>
            
            {exercises.map((exercise, index) => (
                <TouchableOpacity key={exercise.id || index} style={styles.workoutListCard}>
                    <Image 
                        source={
                            exercise.thumbnail_url 
                                ? { uri: exercise.thumbnail_url }
                                : require('../../assets/placeholder1.jpg')
                        } 
                        style={styles.workoutListImage}
                    />
                    <View style={styles.workoutListInfo}>
                        <Text style={styles.workoutListTitle}>{exercise.title}</Text>
                        <Text style={styles.workoutListDetails}>
                            {exercise.category} • {exercise.duration} • {exercise.difficulty}
                        </Text>
                        <View style={styles.workoutListMeta}>
                            <Ionicons name="eye" size={14} color="#666" />
                            <Text style={styles.workoutListViews}>{exercise.views || 0} views</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.playButton}>
                        <Ionicons name="play" size={20} color="white" />
                    </TouchableOpacity>
                </TouchableOpacity>
            ))}
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

    const getTimeOfDay = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    };

    const getFirstName = () => {
        return userProfile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
    };

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

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity 
                    style={[styles.navItem, activeTab === 'home' && styles.activeNavItem]}
                    onPress={() => setActiveTab('home')}
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
    quickActionsSection: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    quickActionCard: {
        width: (width - 60) / 2,
        backgroundColor: 'white',
        borderRadius: 12,
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
    },
    quickActionTextPrimary: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginTop: 8,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4e7bff',
        marginTop: 8,
    },
    featuredSection: {
        marginBottom: 25,
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
        width: 180,
        backgroundColor: 'white',
        borderRadius: 12,
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    exerciseImage: {
        width: '100%',
        height: 100,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
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
    workoutListImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
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
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4e7bff',
        justifyContent: 'center',
        alignItems: 'center',
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
});

export default Home;

