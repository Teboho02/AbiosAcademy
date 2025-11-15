import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkoutHistoryContext = createContext();

const HISTORY_KEY = '@workout_history';

export const WorkoutHistoryProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.log('Error loading workout history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveHistory = async (newHistory) => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.log('Error saving workout history:', error);
    }
  };

  const addWorkout = async (exercise, durationWatched = 0) => {
    try {
      const workout = {
        id: Date.now().toString(),
        exerciseId: exercise.id,
        title: exercise.title,
        category: exercise.category,
        duration: exercise.duration,
        difficulty: exercise.difficulty,
        thumbnail_url: exercise.thumbnail_url,
        durationWatched,
        completedAt: new Date().toISOString(),
        date: new Date().toDateString(),
      };

      const newHistory = [workout, ...history];
      setHistory(newHistory);
      await saveHistory(newHistory);
      return true;
    } catch (error) {
      console.log('Error adding workout:', error);
      return false;
    }
  };

  const getWeeklyStats = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyWorkouts = history.filter((workout) => {
      const workoutDate = new Date(workout.completedAt);
      return workoutDate >= weekAgo && workoutDate <= today;
    });

    const workoutsByDay = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toDateString();
      workoutsByDay[dateStr] = weeklyWorkouts.filter(
        (w) => new Date(w.completedAt).toDateString() === dateStr
      ).length;
    }

    return {
      total: weeklyWorkouts.length,
      byDay: workoutsByDay,
      workouts: weeklyWorkouts,
    };
  };

  const getMonthlyStats = () => {
    const today = new Date();
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const monthlyWorkouts = history.filter((workout) => {
      const workoutDate = new Date(workout.completedAt);
      return workoutDate >= monthAgo && workoutDate <= today;
    });

    return {
      total: monthlyWorkouts.length,
      workouts: monthlyWorkouts,
    };
  };

  const getStreak = () => {
    if (history.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = new Date(today);

    while (true) {
      const dateStr = currentDate.toDateString();
      const hasWorkout = history.some(
        (w) => new Date(w.completedAt).toDateString() === dateStr
      );

      if (hasWorkout) {
        streak++;
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        // If checking today and no workout, still count the streak
        if (currentDate.getTime() === today.getTime()) {
          currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
          continue;
        }
        break;
      }
    }

    return streak;
  };

  const getTotalWorkoutTime = () => {
    let totalMinutes = 0;

    history.forEach((workout) => {
      // Parse duration (e.g., "30 min", "1 hour")
      const durationStr = workout.duration;
      if (durationStr.includes('min')) {
        totalMinutes += parseInt(durationStr);
      } else if (durationStr.includes('hour')) {
        totalMinutes += parseInt(durationStr) * 60;
      }
    });

    return totalMinutes;
  };

  const getCategoryStats = () => {
    const categoryCount = {};

    history.forEach((workout) => {
      if (categoryCount[workout.category]) {
        categoryCount[workout.category]++;
      } else {
        categoryCount[workout.category] = 1;
      }
    });

    return categoryCount;
  };

  const clearHistory = async () => {
    try {
      setHistory([]);
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.log('Error clearing history:', error);
    }
  };

  const value = {
    history,
    isLoading,
    addWorkout,
    getWeeklyStats,
    getMonthlyStats,
    getStreak,
    getTotalWorkoutTime,
    getCategoryStats,
    clearHistory,
  };

  return (
    <WorkoutHistoryContext.Provider value={value}>
      {children}
    </WorkoutHistoryContext.Provider>
  );
};

export const useWorkoutHistory = () => {
  const context = useContext(WorkoutHistoryContext);
  if (!context) {
    throw new Error('useWorkoutHistory must be used within a WorkoutHistoryProvider');
  }
  return context;
};
