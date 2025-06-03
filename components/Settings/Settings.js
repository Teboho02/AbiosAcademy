import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Switch,
  Image
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const Settings = ({ navigation }) => {
  const { user, userProfile, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);

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

  const handleEditProfile = () => {
    Alert.alert('Coming Soon', 'Profile editing will be available soon!');
  };

  const handleNotificationSettings = () => {
    Alert.alert('Coming Soon', 'Notification settings will be available soon!');
  };

  const handlePrivacySettings = () => {
    Alert.alert('Coming Soon', 'Privacy settings will be available soon!');
  };

  const handleHelpCenter = () => {
    Alert.alert('Help Center', 'For support, please contact us at support@abiosacademy.com');
  };

  const handleContactUs = () => {
    Alert.alert('Contact Us', 'Email: support@abiosacademy.com\nPhone: +1 (555) 123-4567');
  };

  const handleRateApp = () => {
    Alert.alert('Rate App', 'Thank you for using Abios Academy! Please rate us on the App Store.');
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Language',
      'Select your preferred language:',
      [
        { text: 'English', onPress: () => {} },
        { text: 'Spanish', onPress: () => {} },
        { text: 'French', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleDownloadQuality = () => {
    Alert.alert(
      'Download Quality',
      'Select video download quality:',
      [
        { text: 'Low (480p)', onPress: () => {} },
        { text: 'Medium (720p)', onPress: () => {} },
        { text: 'High (1080p)', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            {userProfile?.avatar_url ? (
              <Image source={{ uri: userProfile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={32} color="#4e7bff" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userProfile?.full_name || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {userProfile?.role && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={16} color="#4e7bff" />
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsItem} onPress={handleEditProfile}>
              <View style={styles.settingsIcon}>
                <Ionicons name="person-outline" size={20} color="#4e7bff" />
              </View>
              <Text style={styles.settingsItemText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem} onPress={handleNotificationSettings}>
              <View style={styles.settingsIcon}>
                <Ionicons name="notifications-outline" size={20} color="#ff6b6b" />
              </View>
              <Text style={styles.settingsItemText}>Notifications</Text>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#ddd', true: '#4e7bff40' }}
                thumbColor={notifications ? '#4e7bff' : '#999'}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem} onPress={handlePrivacySettings}>
              <View style={styles.settingsIcon}>
                <Ionicons name="lock-closed-outline" size={20} color="#6c5ce7" />
              </View>
              <Text style={styles.settingsItemText}>Privacy & Security</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIcon}>
                <Ionicons name="card-outline" size={20} color="#00b894" />
              </View>
              <Text style={styles.settingsItemText}>Subscription</Text>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Pro</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Preferences */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIcon}>
                <Ionicons name="moon-outline" size={20} color="#2d3436" />
              </View>
              <Text style={styles.settingsItemText}>Dark Mode</Text>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#ddd', true: '#4e7bff40' }}
                thumbColor={darkMode ? '#4e7bff' : '#999'}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem} onPress={handleLanguageChange}>
              <View style={styles.settingsIcon}>
                <Ionicons name="language-outline" size={20} color="#e17055" />
              </View>
              <Text style={styles.settingsItemText}>Language</Text>
              <Text style={styles.settingsItemValue}>English</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem} onPress={handleDownloadQuality}>
              <View style={styles.settingsIcon}>
                <Ionicons name="download-outline" size={20} color="#0984e3" />
              </View>
              <Text style={styles.settingsItemText}>Download Quality</Text>
              <Text style={styles.settingsItemValue}>High</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIcon}>
                <Ionicons name="wifi-outline" size={20} color="#00cec9" />
              </View>
              <Text style={styles.settingsItemText}>Auto-Download on WiFi</Text>
              <Switch
                value={autoDownload}
                onValueChange={setAutoDownload}
                trackColor={{ false: '#ddd', true: '#4e7bff40' }}
                thumbColor={autoDownload ? '#4e7bff' : '#999'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & Feedback */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Support & Feedback</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsItem} onPress={handleHelpCenter}>
              <View style={styles.settingsIcon}>
                <Ionicons name="help-circle-outline" size={20} color="#fdcb6e" />
              </View>
              <Text style={styles.settingsItemText}>Help Center</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem} onPress={handleContactUs}>
              <View style={styles.settingsIcon}>
                <Ionicons name="chatbubble-outline" size={20} color="#74b9ff" />
              </View>
              <Text style={styles.settingsItemText}>Contact Us</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem} onPress={handleRateApp}>
              <View style={styles.settingsIcon}>
                <Ionicons name="star-outline" size={20} color="#ffd700" />
              </View>
              <Text style={styles.settingsItemText}>Rate App</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIcon}>
                <Ionicons name="document-text-outline" size={20} color="#a29bfe" />
              </View>
              <Text style={styles.settingsItemText}>Terms & Privacy</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.settingsSection}>
          <View style={styles.appInfoCard}>
            <View style={styles.appInfo}>
              <Text style={styles.appName}>Abios Academy</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
            </View>
            <View style={styles.appLogo}>
              <Ionicons name="fitness" size={24} color="#4e7bff" />
            </View>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
            </View>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4e7bff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#4e7bff20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    color: '#4e7bff',
    fontWeight: '600',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4e7bff20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fd',
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  settingsItemValue: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  premiumBadge: {
    backgroundColor: '#00b89420',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  premiumText: {
    fontSize: 12,
    color: '#00b894',
    fontWeight: '600',
  },
  appInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
  },
  appLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4e7bff20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff6b6b20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '600',
  },
});

export default Settings;