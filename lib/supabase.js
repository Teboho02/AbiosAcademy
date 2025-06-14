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


  async incrementExerciseViews(exerciseId) {
    // First, get the current view count
    const { data: exercise, error: fetchError } = await supabase
      .from('exercises')
      .select('views')
      .eq('id', exerciseId)
      .single();

    if (fetchError) return { data: null, error: fetchError };

    // Increment the view count
    const newViews = (exercise.views || 0) + 1;

    // Update the exercise with the new view count
    const { data, error } = await supabase
      .from('exercises')
      .update({ 
        views: newViews,
        updated_at: new Date().toISOString()
      })
      .eq('id', exerciseId);

    return { data, error };
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
    // Generate public URL if video_path exists
    if (exerciseData.video_path) {
      exerciseData.video_url = storageService.getPublicUrl(
        'exercise-media', 
        exerciseData.video_path
      );
    }
    
    if (exerciseData.thumbnail_path) {
      exerciseData.thumbnail_url = storageService.getPublicUrl(
        'exercise-media', 
        exerciseData.thumbnail_path
      );
    }

    const { data, error } = await supabase
      .from('exercises')
      .insert([{
        ...exerciseData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
    
    return { data, error };
  },

  async updateExercise(exerciseId, updates) {
    // Regenerate URLs if paths are updated
    if (updates.video_path) {
      updates.video_url = storageService.getPublicUrl(
        'exercise-media', 
        updates.video_path
      );
    }
    
    if (updates.thumbnail_path) {
      updates.thumbnail_url = storageService.getPublicUrl(
        'exercise-media', 
        updates.thumbnail_path
      );
    }

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
  },

  // Fix missing video URLs in existing records
  async fixMissingMediaUrls() {
    // Get exercises with media paths but no URLs
    const { data: exercises, error: fetchError } = await supabase
      .from('exercises')
      .select('id, video_path, thumbnail_path')
      .or('video_url.is.null,thumbnail_url.is.null')

    if (fetchError || !exercises) {
      return { error: fetchError || new Error('No exercises found') }
    }

    // Prepare batch updates
    const updates = exercises.map(exercise => {
      const update = { id: exercise.id }
      
      if (exercise.video_path) {
        update.video_url = storageService.getPublicUrl(
          'exercise-media', 
          exercise.video_path
        )
      }
      
      if (exercise.thumbnail_path) {
        update.thumbnail_url = storageService.getPublicUrl(
          'exercise-media', 
          exercise.thumbnail_path
        )
      }
      
      return update
    })

    // Execute batch update
    const { data, error: updateError } = await supabase
      .from('exercises')
      .upsert(updates)
      .select()

    return { data, error: updateError }
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
    
    // Handle MIME types
    const mimeType = fileExt.toLowerCase() === 'mp4' 
      ? 'video/mp4' 
      : 'video/quicktime';
    
    let uploadData;
    if (file.uri) {
      // React Native
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: mimeType,
        name: fileName,
      });
      uploadData = formData;
    } else {
      uploadData = file;
    }
    
    const { data, error } = await supabase.storage
      .from('exercise-media')
      .upload(filePath, uploadData, {
        contentType: mimeType
      });
    
    if (error) return { data: null, error }
    
    const publicUrl = this.getPublicUrl('exercise-media', filePath)
    return { data: { path: filePath, url: publicUrl }, error: null }
  },

  // Upload exercise thumbnail
  async uploadExerciseThumbnail(file, exerciseId) {
    const fileExt = file.name?.split('.').pop() || 
                    file.uri?.split('.').pop() || 
                    'jpg';
    const fileName = `${exerciseId}_${Date.now()}.${fileExt}`
    const filePath = `thumbnails/${fileName}`
    
    // Handle MIME types for images
    const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    
    let uploadData;
    if (file.uri) {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: mimeType,
        name: fileName,
      });
      uploadData = formData;
    } else {
      uploadData = file;
    }
    
    const { data, error } = await supabase.storage
      .from('exercise-media')
      .upload(filePath, uploadData, {
        contentType: mimeType
      });
    
    if (error) return { data: null, error }
    
    const publicUrl = this.getPublicUrl('exercise-media', filePath)
    return { data: { path: filePath, url: publicUrl }, error: null }
  }
}

