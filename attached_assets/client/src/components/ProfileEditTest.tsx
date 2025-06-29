import React, { useState, useEffect } from 'react';
import { ProfileEditModal } from './ProfileEditModal';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ProfileEditTestProps {
  galleryId: string;
  isDarkMode: boolean;
}

export const ProfileEditTest: React.FC<ProfileEditTestProps> = ({ galleryId, isDarkMode }) => {
  const [showModal, setShowModal] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, [galleryId]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading profile data for gallery:', galleryId);
      
      const profileDocRef = doc(db, 'galleries', galleryId, 'profile', 'main');
      const profileDoc = await getDoc(profileDocRef);
      
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        console.log('✅ Profile data loaded:', data);
        setProfileData(data);
      } else {
        console.log('📝 No profile data found, creating default...');
        const defaultProfile = {
          name: 'Test Gallery',
          bio: 'Test gallery description',
          countdownDate: '',
          countdownEndMessage: 'Event completed!',
          countdownMessageDismissed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setProfileData(defaultProfile);
      }
    } catch (err: any) {
      console.error('❌ Error loading profile data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (updatedProfileData: any) => {
    try {
      console.log('🔄 Saving profile data:', updatedProfileData);
      
      let profilePictureUrl = profileData?.profilePicture;
      
      // Handle profile picture update
      if (updatedProfileData.profilePicture instanceof File) {
        console.log('📸 Converting image to base64...');
        const reader = new FileReader();
        profilePictureUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(updatedProfileData.profilePicture as File);
        });
        console.log('✅ Image converted to base64');
      } else if (typeof updatedProfileData.profilePicture === 'string') {
        profilePictureUrl = updatedProfileData.profilePicture;
      }

      const finalProfileData = {
        name: updatedProfileData.name,
        bio: updatedProfileData.bio,
        profilePicture: profilePictureUrl,
        countdownDate: updatedProfileData.countdownDate,
        countdownEndMessage: updatedProfileData.countdownEndMessage,
        countdownMessageDismissed: updatedProfileData.countdownMessageDismissed,
        updatedAt: new Date().toISOString()
      };

      console.log('📝 Final profile data to save:', finalProfileData);
      
      const profileDocRef = doc(db, 'galleries', galleryId, 'profile', 'main');
      await setDoc(profileDocRef, finalProfileData, { merge: true });
      
      setProfileData(finalProfileData);
      console.log('✅ Profile saved successfully');
      alert('Profile saved successfully!');
    } catch (err: any) {
      console.error('❌ Error saving profile:', err);
      alert(`Error saving profile: ${err.message}`);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
        <h3 className="font-semibold mb-2">Error Loading Profile</h3>
        <p className="text-sm">{error}</p>
        <button 
          onClick={loadProfileData}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <h3 className="text-lg font-semibold mb-4">Profile Edit Test</h3>
      
      <div className="mb-4">
        <h4 className="font-medium mb-2">Current Profile Data:</h4>
        <pre className={`p-3 rounded text-sm overflow-auto ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {JSON.stringify(profileData, null, 2)}
        </pre>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
      >
        Open Profile Edit Modal
      </button>

      <ProfileEditModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentProfileData={{
          profilePicture: profileData?.profilePicture,
          name: profileData?.name || 'Test Gallery',
          bio: profileData?.bio || 'Test gallery description',
          countdownDate: profileData?.countdownDate || '',
          countdownEndMessage: profileData?.countdownEndMessage || 'Event completed!',
          countdownMessageDismissed: profileData?.countdownMessageDismissed || false
        }}
        onSave={handleSaveProfile}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
