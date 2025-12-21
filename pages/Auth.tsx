
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { CheckCircle, Smartphone, X, MessageSquare, AlertCircle } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState(false);
  const [error, setError] = useState('');
  
  // State for simulated SMS notification
  const [demoOtpNotification, setDemoOtpNotification] = useState<string | null>(null);
  
  const { login, signup, requestOtp, checkUserExists } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Auto-hide notification after 10 seconds
  useEffect(() => {
    if (demoOtpNotification) {
      const timer = setTimeout(() => setDemoOtpNotification(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [demoOtpNotification]);

  // Clear error when switching modes
  useEffect(() => {
    setError('');
  }, [isLogin]);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Filter non-digits
    if (value.length <= 10) {
      setMobile(value);
      if (error) setError('');
    }
  };

  const handleGetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile) return;
    setError('');

    // Strict 10-digit check
    if (mobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    // Logic Check 1: Login Mode - User MUST exist
    if (isLogin) {
      const exists = checkUserExists(mobile);
      if (!exists) {
        setError('Mobile number not registered.');
        return;
      }
    } 
    // Logic Check 2: Signup Mode - User MUST NOT exist
    else {
      const exists = checkUserExists(mobile);
      if (exists) {
        setError('User already registered. Please Login.');
        return;
      }
    }

    setIsLoading(true);
    setOtpSentMsg(false);
    setDemoOtpNotification(null);
    
    // Request OTP from context
    const code = await requestOtp(mobile);
    
    setIsLoading(false);
    setShowOtp(true);
    setOtpSentMsg(true);
    
    // Show the "Fake SMS" notification
    setDemoOtpNotification(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    let success = false;
    
    if (isLogin) {
      success = await login(mobile, otp);
    } else {
      success = await signup(username, mobile, otp);
    }

    setIsLoading(false);
    if (success) {
      setDemoOtpNotification(null); // Clear notification on success
      navigate('/calculator');
    } else {
      // If signup failed but we passed initial checks, it likely means duplication or system error
      if (!isLogin && checkUserExists(mobile)) {
         setError("User already registered.");
      } else {
         setError("Invalid OTP or Action Failed");
      }
    }
  };

  const switchToRegister = () => {
    setIsLogin(false);
    setShowOtp(false);
    setOtpSentMsg(false);
    setOtp('');
    setDemoOtpNotification(null);
    setError('');
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setShowOtp(false);
    setOtpSentMsg(false);
    setOtp('');
    setDemoOtpNotification(null);
    setError('');
  };

  return (
    <>
      {/* Simulated SMS Notification Toast */}
      {demoOtpNotification && (
        <div className="fixed top-4 right-4 max-w-sm w-full bg-slate-800 text-white p-4 rounded-xl shadow-2xl z-50 border-l-4 border-green-500 animate-bounce-in transition-all">
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <div className="bg-green-600 p-2 rounded-full mr-3">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Messages • Now</p>
                <p className="font-medium text-sm text-gray-200">AgriFair Verification Code:</p>
                <p className="text-2xl font-bold text-white tracking-widest mt-1">{demoOtpNotification}</p>
              </div>
            </div>
            <button 
              onClick={() => setDemoOtpNotification(null)} 
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X size={20}/>
            </button>
          </div>
        </div>
      )}

      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="text-center mb-6">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800">
              {isLogin ? t('auth_login_title') : t('auth_signup_title')}
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start flex-col text-sm">
              <div className="flex items-center mb-1">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="font-bold">{error}</span>
              </div>
              {error.includes('not registered') && (
                <button 
                  onClick={switchToRegister}
                  className="ml-7 text-red-800 underline hover:text-red-900 font-medium"
                >
                  Click here to Register &rarr;
                </button>
              )}
              {error.includes('already registered') && (
                <button 
                  onClick={switchToLogin}
                  className="ml-7 text-red-800 underline hover:text-red-900 font-medium"
                >
                  Click here to Login &rarr;
                </button>
              )}
            </div>
          )}

          {!showOtp ? (
            <form onSubmit={handleGetOtp}>
               {!isLogin && (
                <Input 
                  label={t('auth_username')} 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              )}
              <Input 
                label={t('auth_mobile')} 
                value={mobile} 
                onChange={handleMobileChange}
                type="tel"
                placeholder="e.g. 9876543210"
                maxLength={10}
                required
              />
              <Button fullWidth type="submit" disabled={isLoading}>
                {isLoading ? 'Sending OTP...' : t('auth_get_otp')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              {otpSentMsg && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">OTP Sent!</p>
                    <p className="text-xs mt-1">Check the notification bubble at the top right of your screen.</p>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-500 mb-4 text-center">
                Enter the code sent to <span className="font-bold text-gray-700">{mobile}</span>
              </p>
              
              <Input 
                label={t('auth_otp')} 
                value={otp} 
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                type="text"
                maxLength={6}
                placeholder="XXXXXX"
                required
                className="text-center tracking-widest font-mono text-lg"
              />
              
              <Button fullWidth type="submit" disabled={isLoading}>
                {isLoading ? 'Verifying...' : t('auth_verify')}
              </Button>
              
              <button 
                type="button" 
                onClick={() => { setShowOtp(false); setOtpSentMsg(false); setOtp(''); setDemoOtpNotification(null); setError(''); }}
                className="w-full mt-4 text-sm text-green-600 hover:underline"
              >
                Change Mobile Number
              </button>
            </form>
          )}

          <div className="mt-6 text-center pt-4 border-t border-gray-100">
            <button 
              onClick={isLogin ? switchToRegister : switchToLogin}
              className="text-green-700 font-medium hover:underline text-sm"
            >
              {isLogin ? t('auth_switch_signup') : t('auth_switch_login')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
