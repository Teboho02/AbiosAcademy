// lib/supabase.js
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://koihmghbdfgaudvrjpbq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvaWhtZ2hiZGZnYXVkdnJqcGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODA2MzgsImV4cCI6MjA2NDU1NjYzOH0.O0ZXjahioYGzeQlTktSQMSLngYk4otfS1gupgSccuFQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Auth helper functions
export const authService = {
  // Sign up new user
  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })
    return { data, error }
  },

  // Sign in user
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helper functions
export const dbService = {
  // User operations
  async createUserProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
    return { data, error }
  },

  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  async updateUserProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
    return { data, error }
  },

  // Exercise operations
  async getExercises() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createExercise(exerciseData) {
    const { data, error } = await supabase
      .from('exercises')
      .insert([
        {
          ...exerciseData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
    return { data, error }
  },

  async updateExercise(exerciseId, updates) {
    const { data, error } = await supabase
      .from('exercises')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', exerciseId)
    return { data, error }
  },

  async deleteExercise(exerciseId) {
    const { data, error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', exerciseId)
    return { data, error }
  },

  // Analytics and stats
  async getAppStats() {
    const [usersCount, exercisesCount, activeUsersCount] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('exercises').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_sign_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ])

    return {
      totalUsers: usersCount.count || 0,
      totalExercises: exercisesCount.count || 0,
      activeUsers: activeUsersCount.count || 0
    }
  }
}

// Storage helper functions
export const storageService = {
  // Upload file to storage
  async uploadFile(bucket, filePath, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)
    return { data, error }
  },

  // Get public URL for file
  getPublicUrl(bucket, filePath) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    return data.publicUrl
  },

  // Delete file from storage
  async deleteFile(bucket, filePath) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([filePath])
    return { data, error }
  },

  // Upload exercise video
  async uploadExerciseVideo(file, exerciseId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${exerciseId}_${Date.now()}.${fileExt}`
    const filePath = `videos/${fileName}`
    
    const { data, error } = await this.uploadFile('exercise-media', filePath, file)
    if (error) return { data: null, error }
    
    const publicUrl = this.getPublicUrl('exercise-media', filePath)
    return { data: { path: filePath, url: publicUrl }, error: null }
  },

  // Upload exercise thumbnail
  async uploadExerciseThumbnail(file, exerciseId) {
    const fileExt = file.name?.split('.').pop() || 'jpg'
    const fileName = `${exerciseId}_${Date.now()}.${fileExt}`
    const filePath = `thumbnails/${fileName}`
    
    const { data, error } = await this.uploadFile('exercise-media', filePath, file)
    if (error) return { data: null, error }
    
    const publicUrl = this.getPublicUrl('exercise-media', filePath)
    return { data: { path: filePath, url: publicUrl }, error: null }
  }
}