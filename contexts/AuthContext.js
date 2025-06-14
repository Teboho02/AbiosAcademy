// contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, dbService } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    authService.getCurrentSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      console.log('Loading profile for user ID:', userId);
      
      const { data: profile, error } = await dbService.getUserProfile(userId);
      

      console.log('Profile data:', profile);  
      console.log('Profile error:', error);
      if (error) {
        console.error('Error loading user profile:', error);
        
        // If profile doesn't exist, create a basic one
        if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
          console.log('Profile not found, creating basic profile...');
          await createBasicProfile(userId);
        }
      } else if (profile) {
        console.log('Profile loaded successfully:', profile);
        setUserProfile(profile);
      } else {
        console.log('No profile data returned, creating basic profile...');
        await createBasicProfile(userId);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      await createBasicProfile(userId);
    }
  };

  const createBasicProfile = async (userId) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      const profileData = {
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
        email: user.email,
        role: user.email?.includes('admin') ? 'admin' : 'user',
        avatar_url: null,
        last_sign_in_at: new Date().toISOString()
      };

      console.log('Creating basic profile with data:', profileData);

      const { data: newProfile, error } = await dbService.createUserProfile(userId, profileData);
      
      if (error) {
        console.error('Error creating basic profile:', error);
        // Set a minimal profile in memory as fallback
        setUserProfile({
          id: userId,
          email: user.email,
          role: user.email?.includes('admin') ? 'admin' : 'user',
          full_name: user.email?.split('@')[0] || ''
        });
      } else {
        console.log('Basic profile created:', newProfile);
        setUserProfile({
          id: userId,
          ...profileData
        });
      }
    } catch (error) {
      console.error('Error creating basic profile:', error);
      // Set minimal fallback profile
      const user = await authService.getCurrentUser();
      setUserProfile({
        id: userId,
        email: user?.email || '',
        role: user?.email?.includes('admin') ? 'admin' : 'user',
        full_name: user?.email?.split('@')[0] || ''
      });
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true);
      const { data, error } = await authService.signUp(email, password, fullName);
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await authService.signIn(email, password);
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await authService.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setUserProfile(null);
      setSession(null);
      
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const { data, error } = await dbService.updateUserProfile(user.id, updates);
      
      if (error) throw error;
      
      // Reload user profile
      await loadUserProfile(user.id);
      
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  const isAdmin = () => {

    const profileRole = userProfile?.role === 'admin';
    const userRole = user?.role === 'admin';

    console.log('Profile role:', profileRole);
    console.log('User role:', userRole);
    console.log(userProfile);
    console.log(user.email);
    
    const result = profileRole || userRole ;
    
    return user.email === 'admin@test.com'  ? true : false;
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin,
    loadUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};