
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { CheckCircle, Smartphone, X, MessageSquare, AlertCircle, Hash } from 'lucide-react';
import { DatabaseService } from '../services/mockDb';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState(false);
  const [error, setError] = useState('');
  
  const [demoOtpNotification, setDemoOtpNotification] = useState<string | null>(null);
  
  const { login, signup, requestOtp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (demoOtpNotification) {
      const timer = setTimeout(() => setDemoOtpNotification(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [demoOtpNotification]);

  useEffect(() => {
    setError('');
  }, [isLogin]);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); 
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

    setIsLoading(true);
    
    // Check user existence via async DB service
    const existingUser = await DatabaseService.findUserByMobile(mobile);

    if (isLogin && !existingUser) {
      setError('Mobile number not registered.');
      setIsLoading(false);
      return;
    } 
    
    if (!isLogin && existingUser) {
      setError('User already registered. Please Login.');
      setIsLoading(false);
      return;
    }

    setOtpSentMsg(false);
    setDemoOtpNotification(null);
    
    const code = await requestOtp(mobile);
    
    setIsLoading(false);
    setShowOtp(true);
    setOtpSentMsg(true);
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
      setDemoOtpNotification(null);
      navigate('/calculator');
    } else {
      setError("Invalid OTP or Verification Failed");
    }
  };

  return (
    <>
      {demoOtpNotification && (
        <div className="fixed top-4 right-4 max-w-sm w-full bg-slate-800 text-white p-4 rounded-xl shadow-2xl z-50 border-l-4 border-green-500 animate-bounce-in transition-all">
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <div className="bg-green-600 p-2 rounded-full mr-3">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Messages • Now</p>
                <p className="font-medium text-sm text-gray-200">AgriFair Code:</p>
                <p className="text-2xl font-bold text-white tracking-widest mt-1">{demoOtpNotification}</p>
              </div>
            </div>
            <button onClick={() => setDemoOtpNotification(null)} className="text-gray-500 hover:text-white"><X size={20}/></button>
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start text-sm">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {!showOtp ? (
            <form onSubmit={handleGetOtp}>
               {!isLogin && (
                <Input label={t('auth_username')} value={username} onChange={e => setUsername(e.target.value)} required />
              )}
              <div className="relative">
                <Input 
                  label={t('auth_mobile')} 
                  value={mobile} 
                  onChange={handleMobileChange}
                  type="tel"
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  required
                />
                <span className={`absolute right-3 top-9 text-[10px] font-bold ${mobile.length === 10 ? 'text-green-500' : 'text-gray-300'}`}>
                  {mobile.length}/10
                </span>
              </div>
              <Button fullWidth type="submit" disabled={isLoading}>
                {isLoading ? 'Connecting to Database...' : t('auth_get_otp')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              {otpSentMsg && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-xs text-green-800">
                  <CheckCircle className="inline w-3 h-3 mr-1" /> OTP sent to {mobile}. Check your messages.
                </div>
              )}
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
            </form>
          )}

          <div className="mt-6 text-center pt-4 border-t border-gray-100">
            <button 
              onClick={() => setIsLogin(!isLogin)}
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
