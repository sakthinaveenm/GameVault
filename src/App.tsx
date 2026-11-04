import React, { useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { useProfileStore } from './stores/profileStore';
import './styles/globals.css';

export function App() {
  const { loadProfilesFromDb } = useProfileStore();

  useEffect(() => {
    loadProfilesFromDb();
  }, [loadProfilesFromDb]);

  return <MainLayout />;
}

export default App;
