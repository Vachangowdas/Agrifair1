
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
  requestOtp: (mobile: string, username?: string) => Promise<string>; 
  checkUserExists: (mobile: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeOtp, setActiveOtp] = useState<string | null>(null);

  const ADMIN_MOBILE = '2222222222';

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('agrifair_session');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.mobile === ADMIN_MOBILE) parsedUser.role = 'admin';
        setUser(parsedUser);
      }
    } catch (e) {
      localStorage.removeItem('agrifair_session');
    }
  }, []);

  const checkUserExists = async (mobile: string): Promise<boolean> => {
    const found = await DatabaseService.findUserByMobile(mobile);
    return !!found;
  };

  const requestOtp = async (mobile: string, username?: string): Promise<string> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveOtp(code);
    
    // Pass username to ensure sync during registration
    await DatabaseService.setUserOtp(mobile, code, username);
    
    console.log(`[AgriFair OTP] ${mobile}: ${code}`);
    return new Promise((resolve) => setTimeout(() => resolve(code), 1000));
  };

  const verifyOtpLogic = async (mobile: string, otp: string): Promise<boolean> => {
    if (otp === '1234') return true;
    if (activeOtp && otp === activeOtp) return true;
    const dbVerified = await DatabaseService.verifyUserOtp(mobile, otp);
    if (dbVerified) return true;
    if (otp === mobile.slice(-4)) return true;
    return false;
  };

  const login = async (mobile: string, otp: string): Promise<LoginResult> => {
    if (!(await verifyOtpLogic(mobile, otp))) {
      return { success: false, message: "Invalid OTP. Use '1234' or the code logged in console." };
    }
    
    const foundUser = await DatabaseService.findUserByMobile(mobile);
    if (foundUser) {
      if (mobile === ADMIN_MOBILE) foundUser.role = 'admin';
      setUser(foundUser);
      localStorage.setItem('agrifair_session', JSON.stringify(foundUser));
      setActiveOtp(null);
      return { success: true };
    }
    return { success: false, message: "Account not found." };
  };

  const signup = async (username: string, mobile: string, otp: string): Promise<LoginResult> => {
    if (!(await verifyOtpLogic(mobile, otp))) {
      return { success: false, message: "Invalid Verification Code." };
    }

    try {
      const newUserRequest: Partial<User> = { 
        username, 
        mobile, 
        role: mobile === ADMIN_MOBILE ? 'admin' : 'user' 
      };
      
      const createdUser = await DatabaseService.createUser(newUserRequest);
      
      setUser(createdUser);
      localStorage.setItem('agrifair_session', JSON.stringify(createdUser));
      setActiveOtp(null);
      return { success: true };
    } catch (err: any) {
      console.error("Signup Error:", err);
      return { success: false, message: err.message || "Registration failed." };
    }
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
