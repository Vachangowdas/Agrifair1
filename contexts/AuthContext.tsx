import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { MockDB } from '../services/mockDb';

interface AuthContextType {
  user: User | null;
  login: (mobile: string, otp: string) => Promise<boolean>;
  signup: (username: string, mobile: string, otp: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  requestOtp: (mobile: string) => Promise<string>; // Returns the generated OTP for demo purposes
  checkUserExists: (mobile: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeOtp, setActiveOtp] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for persistent session
    try {
      const storedUser = localStorage.getItem('agrifair_session');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to restore session:", e);
      localStorage.removeItem('agrifair_session');
    }
  }, []);

  const checkUserExists = (mobile: string): boolean => {
    return !!MockDB.findUserByMobile(mobile);
  };

  const requestOtp = async (mobile: string): Promise<string> => {
    // Generate a random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveOtp(code);
    
    // In a real production app, you would call your SMS gateway here.
    // Example: await axios.post('/api/send-otp', { mobile, code });
    
    // For this demo, we log it to the console so the user can see it.
    console.log(`%c[SMS SERVICE] OTP for ${mobile}: ${code}`, 'color: #10B981; font-weight: bold; font-size: 16px; padding: 4px; border: 2px solid #10B981; border-radius: 4px;');

    return new Promise((resolve) => {
      setTimeout(() => resolve(code), 1500); // Simulate network delay
    });
  };

  const login = async (mobile: string, otp: string): Promise<boolean> => {
    // Verify against the active OTP (or '1234' master code for easier testing)
    if ((!activeOtp || otp !== activeOtp) && otp !== '1234') {
      return false;
    }
    
    const foundUser = MockDB.findUserByMobile(mobile);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('agrifair_session', JSON.stringify(foundUser));
      setActiveOtp(null); // Clear OTP after success
      return true;
    }
    return false;
  };

  const signup = async (username: string, mobile: string, otp: string): Promise<boolean> => {
    // Verify against the active OTP (or '1234' master code for easier testing)
    if ((!activeOtp || otp !== activeOtp) && otp !== '1234') {
      return false;
    }

    if (MockDB.findUserByMobile(mobile)) {
      // User already exists
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      username,
      mobile
    };

    MockDB.createUser(newUser);
    setUser(newUser);
    localStorage.setItem('agrifair_session', JSON.stringify(newUser));
    setActiveOtp(null); // Clear OTP after success
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agrifair_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user, requestOtp, checkUserExists }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};