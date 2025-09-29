import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createDocument } from '../services/firestore.js';

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
  verifyUser: (userInfo: Omit<UserInfo, 'createdAt'>) => Promise<void>;
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

      // Save user info to Firebase
      await createDocument('firstTimeUsers', {
        name: completeUserInfo.name,
        phone: completeUserInfo.phone,
        location: completeUserInfo.location,
        timestamp: completeUserInfo.createdAt,
        verified: true,
      });

      // Set verification in localStorage
      localStorage.setItem('verified_user', 'true');
      
      // Update state
      setIsVerifiedUser(true);
      setUserInfo(completeUserInfo);
      setIsModalOpen(false);

      console.log('User verified and data saved successfully');
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