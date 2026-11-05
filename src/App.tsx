import React from 'react';
import { useStartupStore } from '@/stores/startupStore';
import { useControllerNavigation } from '@/hooks/useControllerNavigation';
import { MainLayout } from '@/layouts/MainLayout';
import { SplashScreen } from '@/features/startup/SplashScreen';
import { ProfileSelectionScreen } from '@/features/startup/ProfileSelectionScreen';
import { CreateProfileScreen } from '@/features/startup/CreateProfileScreen';
import { ProfileAuthScreen } from '@/features/startup/ProfileAuthScreen';
import { EditProfileModal } from '@/features/startup/EditProfileModal';
import { CloudProfileRecoveryModal } from '@/features/startup/CloudProfileRecoveryModal';
import { ProfileSwitchConfirmModal } from '@/features/startup/ProfileSwitchConfirmModal';
import './styles/globals.css';

export function App() {
  // Activate global gamepad + keyboard input mapping hook
  useControllerNavigation();

  const {
    startupState,
    targetEditProfile,
    setTargetEditProfile,
    isSwitchConfirmOpen,
  } = useStartupStore();

  const renderCurrentView = () => {
    switch (startupState) {
      case 'Initializing':
      case 'DatabaseReady':
      case 'LoadingProfiles':
      case 'LoadingProfile':
      case 'Error':
        return <SplashScreen />;

      case 'ProfileSelection':
        return <ProfileSelectionScreen />;

      case 'CreatingProfile':
        return <CreateProfileScreen />;

      case 'AuthenticatingProfile':
        return <ProfileAuthScreen />;

      case 'RecoveringProfile':
        return (
          <>
            <ProfileSelectionScreen />
            <CloudProfileRecoveryModal />
          </>
        );

      case 'DashboardReady':
        return <MainLayout />;

      default:
        return <SplashScreen />;
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#07090e] text-slate-100 select-none">
      {/* Active Screen State Machine Output */}
      {renderCurrentView()}

      {/* Global Modals */}
      {targetEditProfile && (
        <EditProfileModal
          profile={targetEditProfile}
          onClose={() => setTargetEditProfile(null)}
        />
      )}

      {isSwitchConfirmOpen && <ProfileSwitchConfirmModal />}
    </div>
  );
}

export default App;
