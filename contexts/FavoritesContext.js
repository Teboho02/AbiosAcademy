import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FavoritesContext = createContext();

const FAVORITES_KEY = '@favorite_exercises';

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.log('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.log('Error saving favorites:', error);
    }
  };

  const isFavorite = (exerciseId) => {
    return favorites.some((fav) => fav.id === exerciseId);
  };

  const addFavorite = async (exercise) => {
    try {
      const favoriteItem = {
        id: exercise.id,
        title: exercise.title,
        category: exercise.category,
        duration: exercise.duration,
        difficulty: exercise.difficulty,
        thumbnail_url: exercise.thumbnail_url,
        video_url: exercise.video_url,
        description: exercise.description,
        addedAt: new Date().toISOString(),
      };

      const newFavorites = [...favorites, favoriteItem];
      setFavorites(newFavorites);
      await saveFavorites(newFavorites);
      return true;
    } catch (error) {
      console.log('Error adding favorite:', error);
      return false;
    }
  };

  const removeFavorite = async (exerciseId) => {
    try {
      const newFavorites = favorites.filter((fav) => fav.id !== exerciseId);
      setFavorites(newFavorites);
      await saveFavorites(newFavorites);
      return true;
    } catch (error) {
      console.log('Error removing favorite:', error);
      return false;
    }
  };

  const toggleFavorite = async (exercise) => {
    if (isFavorite(exercise.id)) {
      return await removeFavorite(exercise.id);
    } else {
      return await addFavorite(exercise);
    }
  };

  const clearFavorites = async () => {
    try {
      setFavorites([]);
      await AsyncStorage.removeItem(FAVORITES_KEY);
    } catch (error) {
      console.log('Error clearing favorites:', error);
    }
  };

  const getFavorites = () => {
    return favorites;
  };

  const value = {
    favorites,
    isLoading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    getFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
