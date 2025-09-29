import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createDocument, getDocuments, updateDocument } from '../services/firestore.js';
import { where } from 'firebase/firestore';

interface UserInfo {
  name: string;
  phone: string;
  location?: {
    country: string;
    region: string;
    city: string;
    ip: string;
  };
  createdAt: Date;
}

interface UserVerificationContextType {
  isVerifiedUser: boolean;
  isModalOpen: boolean;
  userInfo: UserInfo | null;
  openVerificationModal: () => void;
  closeVerificationModal: () => void;
  verifyUser: (userInfo: Omit<UserInfo, 'createdAt'>) => Promise<{ isReturningUser: boolean }>;
  checkVerificationStatus: () => boolean;
}

const UserVerificationContext = createContext<UserVerificationContextType | undefined>(undefined);

export function UserVerificationProvider({ children }: { children: ReactNode }) {
  const [isVerifiedUser, setIsVerifiedUser] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Check verification status on component mount
  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = (): boolean => {
    const verified = localStorage.getItem('verified_user') === 'true';
    setIsVerifiedUser(verified);
    return verified;
  };

  const openVerificationModal = () => {
    setIsModalOpen(true);
  };

  const closeVerificationModal = () => {
    setIsModalOpen(false);
  };

  const verifyUser = async (userData: Omit<UserInfo, 'createdAt'>) => {
    try {
      // Create user info object with timestamp
      const completeUserInfo: UserInfo = {
        ...userData,
        createdAt: new Date(),
      };

      // Check if user already exists with same name, phone, and location
      // First query by name and phone (indexed fields for better performance)
      const existingUsers = await getDocuments('firstTimeUsers', [
        where('name', '==', completeUserInfo.name.trim()),
        where('phone', '==', completeUserInfo.phone.trim()),
      ]);

      // Further filter by location in memory (since Firestore has limited compound query support)
      const duplicateUser = existingUsers.find(user => {
        // If no location data available for current user, consider it a potential duplicate
        // based on name and phone alone (more conservative approach)
        if (!completeUserInfo.location) {
          return true; 
        }
        
        // If existing user has no location data, skip location comparison
        if (!user.location) {
          return true; // Consider as duplicate based on name and phone
        }
        
        // Compare all location fields for exact match
        return (
          user.location.country === completeUserInfo.location.country &&
          user.location.region === completeUserInfo.location.region &&
          user.location.city === completeUserInfo.location.city
        );
      });

      let userDocument;

      if (duplicateUser) {
        // User already exists, just update verification status if needed
        console.log(`Existing user found (ID: ${duplicateUser.id}), updating verification status`);
        userDocument = await updateDocument('firstTimeUsers', duplicateUser.id, {
          verified: true,
          lastLoginAt: completeUserInfo.createdAt,
        });
      } else {
        // New user, create a new entry
        console.log('New user detected, creating new entry in database');
        userDocument = await createDocument('firstTimeUsers', {
          name: completeUserInfo.name.trim(),
          phone: completeUserInfo.phone.trim(),
          location: completeUserInfo.location,
          timestamp: completeUserInfo.createdAt,
          verified: true,
        });
      }

      // Set verification in localStorage
      localStorage.setItem('verified_user', 'true');
      
      // Update state
      setIsVerifiedUser(true);
      setUserInfo(completeUserInfo);
      setIsModalOpen(false);

      console.log(`User verified successfully - ${duplicateUser ? 'Returning user' : 'New user'}`);
      
      // Return information about whether this was a returning user
      return { isReturningUser: !!duplicateUser };
    } catch (error) {
      console.error('Error verifying user:', error);
      throw error;
    }
  };

  const value: UserVerificationContextType = {
    isVerifiedUser,
    isModalOpen,
    userInfo,
    openVerificationModal,
    closeVerificationModal,
    verifyUser,
    checkVerificationStatus,
  };

  return (
    <UserVerificationContext.Provider value={value}>
      {children}
    </UserVerificationContext.Provider>
  );
}

export function useUserVerification() {
  const context = useContext(UserVerificationContext);
  if (context === undefined) {
    throw new Error('useUserVerification must be used within a UserVerificationProvider');
  }
  return context;
}