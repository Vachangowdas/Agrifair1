
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { CheckCircle, Smartphone, X, MessageSquare, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
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

    if (mobile.length !== 10) {
      setError('Please enter exactly 10 digits.');
      return;
    }

    setIsLoading(true);
    
    // Check if user exists before sending OTP to avoid confusion
    const existingUser = await DatabaseService.findUserByMobile(mobile);

    if (isLogin && !existingUser) {
      setError('Mobile number not registered. Please switch to Registration.');
      setIsLoading(false);
      return;
    } 
    
    if (!isLogin && existingUser) {
      setError('Account already exists. Please switch to Login.');
      setIsLoading(false);
      return;
    }

    setOtpSentMsg(false);
    setDemoOtpNotification(null);
    
    // SYNC DETAILS EARLY: Pass username if registering
    const code = await requestOtp(mobile, !isLogin ? username : undefined);
    
    setIsLoading(false);
    setShowOtp(true);
    setOtpSentMsg(true);
    setDemoOtpNotification(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    let result;
    
    if (isLogin) {
      result = await login(mobile, otp);
    } else {
      result = await signup(username, mobile, otp);
    }

    setIsLoading(false);
    
    if (result.success) {
      setDemoOtpNotification(null);
      navigate('/calculator');
    } else {
      setError(result.message || "Verification Failed");
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
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">SMS Gateway • Just Now</p>
                <p className="font-medium text-sm text-gray-200">Your AgriFair Code is:</p>
                <p className="text-3xl font-black text-white tracking-[0.3em] mt-1">{demoOtpNotification}</p>
              </div>
            </div>
            <button onClick={() => setDemoOtpNotification(null)} className="text-gray-500 hover:text-white p-1"><X size={18}/></button>
          </div>
        </div>
      )}

      <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100 relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-50 rounded-full blur-3xl opacity-50"></div>
          
          <div className="text-center mb-8 relative z-10">
            <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Smartphone className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-black text-green-900 tracking-tight">
              {isLogin ? t('auth_login_title') : t('auth_signup_title')}
            </h2>
            <p className="text-gray-500 text-sm mt-2">Access your fair price reports & history</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-2xl mb-8 flex items-start text-sm animate-shake">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <div className="font-bold">{error}</div>
            </div>
          )}

          {!showOtp ? (
            <form onSubmit={handleGetOtp} className="space-y-6">
               {!isLogin && (
                <div className="relative">
                  <Input 
                    label={t('auth_username')} 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Enter your full name"
                    required 
                    className="h-14 rounded-2xl px-5 text-lg"
                  />
                </div>
              )}
              <div className="relative group">
                <Input 
                  label={t('auth_mobile')} 
                  value={mobile} 
                  onChange={handleMobileChange}
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  required
                  className="h-14 rounded-2xl px-5 text-lg font-mono tracking-widest"
                />
                <div className="absolute right-4 top-10 flex items-center">
                   <div className={`text-[10px] font-black px-2 py-1 rounded-full border transition-all ${mobile.length === 10 ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                      {mobile.length}/10
                   </div>
                </div>
              </div>
              <Button 
                fullWidth 
                type="submit" 
                disabled={isLoading || mobile.length !== 10} 
                className="h-14 rounded-2xl text-lg font-bold shadow-xl shadow-green-200"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t('auth_get_otp')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {otpSentMsg && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-sm text-green-800 flex items-center shadow-sm">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" /> 
                  <div>
                    <span className="font-bold">Code Sent!</span><br/>
                    <span className="text-xs text-green-600">Use <b className="font-mono">1234</b> or last 4 digits of number</span>
                  </div>
                </div>
              )}
              
              <div className="text-center mb-4">
                 <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Verification Code</p>
                 <Input 
                  label="" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  type="text"
                  maxLength={6}
                  placeholder="· · · · · ·"
                  required
                  className="text-center tracking-[1em] font-black text-2xl h-16 rounded-2xl bg-gray-50 border-2 border-green-100 focus:border-green-500"
                />
              </div>

              <Button fullWidth type="submit" disabled={isLoading} className="h-14 rounded-2xl text-lg font-bold shadow-xl">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t('auth_verify')}
              </Button>
              
              <button 
                type="button"
                onClick={() => { setShowOtp(false); setOtp(''); setDemoOtpNotification(null); }}
                className="w-full text-center text-sm font-bold text-gray-400 hover:text-green-700 transition-colors"
              >
                Resend Code or Change Number
              </button>
            </form>
          )}

          <div className="mt-10 text-center pt-8 border-t border-gray-50">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-green-700 font-bold hover:text-green-800 text-sm flex items-center justify-center mx-auto space-x-2 group"
            >
              <span>{isLogin ? t('auth_switch_signup') : t('auth_switch_login')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
