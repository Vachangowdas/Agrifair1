
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { DatabaseService } from '../services/mockDb';

interface LoginResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  login: (mobile: string, otp: string) => Promise<LoginResult>;
  signup: (username: string, mobile: string, otp: string) => Promise<LoginResult>;
  logout: () => void;
  isAuthenticated: boolean;
  requestOtp: (mobile: string) => Promise<string>; 
  checkUserExists: (mobile: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeOtp, setActiveOtp] = useState<string | null>(null);

  // The official Admin mobile number
  const ADMIN_MOBILE = '2222222222';

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('agrifair_session');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Reinforce admin role on session restore
        if (parsedUser.mobile === ADMIN_MOBILE) parsedUser.role = 'admin';
        setUser(parsedUser);
      }
    } catch (e) {
      console.error("Failed to restore session:", e);
      localStorage.removeItem('agrifair_session');
    }
  }, []);

  const checkUserExists = async (mobile: string): Promise<boolean> => {
    const found = await DatabaseService.findUserByMobile(mobile);
    return !!found;
  };

  const requestOtp = async (mobile: string): Promise<string> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveOtp(code);
    
    // Attempt to save to DB for cross-device support (best effort)
    await DatabaseService.setUserOtp(mobile, code);

    console.log(`%c[SMS SERVICE] OTP for ${mobile}: ${code}`, 'color: #10B981; font-weight: bold; font-size: 16px; padding: 4px; border: 2px solid #10B981; border-radius: 4px;');

    return new Promise((resolve) => {
      setTimeout(() => resolve(code), 1500);
    });
  };

  const verifyOtpLogic = async (mobile: string, otp: string): Promise<boolean> => {
    // 1. Check Master Code
    if (otp === '1234') return true;

    // 2. Check Local State (Same Device)
    if (activeOtp && otp === activeOtp) return true;

    // 3. Check Database (Cross Device)
    const dbVerified = await DatabaseService.verifyUserOtp(mobile, otp);
    if (dbVerified) return true;

    // 4. Emergency Fallback: Last 4 digits of mobile number
    // This ensures you can ALWAYS login if you know the number
    if (otp === mobile.slice(-4)) return true;

    return false;
  };

  const login = async (mobile: string, otp: string): Promise<LoginResult> => {
    const isOtpValid = await verifyOtpLogic(mobile, otp);

    if (!isOtpValid) {
      return { success: false, message: "Invalid OTP. Try '1234' or the code on screen." };
    }
    
    let foundUser = await DatabaseService.findUserByMobile(mobile);
    
    if (foundUser) {
      // Admin Authority Check
      if (mobile === ADMIN_MOBILE) {
        foundUser.role = 'admin';
      }
      
      setUser(foundUser);
      localStorage.setItem('agrifair_session', JSON.stringify(foundUser));
      setActiveOtp(null);
      return { success: true };
    }
    
    return { success: false, message: "Account not found. Please Register first." };
  };

  const signup = async (username: string, mobile: string, otp: string): Promise<LoginResult> => {
    const isOtpValid = await verifyOtpLogic(mobile, otp);

    if (!isOtpValid) {
      return { success: false, message: "Invalid Verification Code." };
    }

    const existingUser = await DatabaseService.findUserByMobile(mobile);
    if (existingUser) {
      return { success: false, message: "User already exists. Please Login." };
    }

    const userData: Partial<User> = {
      username,
      mobile,
      role: mobile === ADMIN_MOBILE ? 'admin' : 'user'
    };

    try {
      await DatabaseService.createUser(userData);
      const createdUser = await DatabaseService.findUserByMobile(mobile);
      if (createdUser) {
        setUser(createdUser);
        localStorage.setItem('agrifair_session', JSON.stringify(createdUser));
        setActiveOtp(null);
        return { success: true };
      }
    } catch (err) {
      console.error("Signup failed:", err);
      return { success: false, message: "Database Error. Try again." };
    }
    return { success: false, message: "Registration failed." };
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
