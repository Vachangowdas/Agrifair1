
import React, { useEffect, useState } from 'react';
// Fix for 'no exported member' errors: Using namespace import for react-router-dom
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { TrendingUp, ShieldCheck, Languages, Users, ArrowRight, CheckCircle, Loader2, Smartphone, MessageSquare, X } from 'lucide-react';
import { DatabaseService } from '../services/mockDb';
import { FeaturedFarmer } from '../types';

const { useNavigate } = ReactRouterDOM as any;

const Home: React.FC = () => {
  const { user, signup, requestOtp, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Spotlight state
  const [featuredFarmers, setFeaturedFarmers] = useState<FeaturedFarmer[]>([]);
  const [isLoadingSpotlight, setIsLoadingSpotlight] = useState(true);

  // Quick Signup state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [demoOtpNotification, setDemoOtpNotification] = useState<string | null>(null);

  useEffect(() => {
    const loadSpotlight = async () => {
      setIsLoadingSpotlight(true);
      const data = await DatabaseService.getAllFeaturedFarmers();
      setFeaturedFarmers(data.slice(0, 4));
      setIsLoadingSpotlight(false);
    };
    loadSpotlight();
  }, []);

  const handleGetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupUsername || signupMobile.length !== 10) {
      setAuthError('Please provide a name and 10-digit mobile number.');
      return;
    }
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const exists = await DatabaseService.findUserByMobile(signupMobile);
      if (exists) {
        setAuthError('Account already exists. Please login via the menu.');
        setIsAuthLoading(false);
        return;
      }

      const code = await requestOtp(signupMobile, signupUsername);
      setDemoOtpNotification(code);
      setShowOtpField(true);
    } catch (err) {
      setAuthError('Connection failed. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');

    const result = await signup(signupUsername, signupMobile, signupOtp);
    setIsAuthLoading(false);

    if (result.success) {
      setDemoOtpNotification(null);
      navigate('/calculator');
    } else {
      setAuthError(result.message || 'Verification failed.');
    }
  };

  return (
    <div className="flex flex-col">
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

      {/* Hero Section with Integrated Signup */}
      <div className="relative bg-green-900 min-h-[700px] flex items-center overflow-hidden py-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop" 
            alt="Agriculture Field" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900 via-green-900/60 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-left">
            <div className="inline-flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-full mb-6 animate-fade-in">
               <ShieldCheck className="w-4 h-4" />
               <span className="text-xs font-bold uppercase tracking-widest">Trusted by 10,000+ Farmers</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
              {t('hero_title')}
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-10 font-light max-w-lg">
              {t('hero_subtitle')}
            </p>
            <div className="flex gap-4">
               <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img key={i} className="w-12 h-12 rounded-full border-4 border-green-900 object-cover" src={`https://i.pravatar.cc/150?u=${i+10}`} alt="user" />
                  ))}
               </div>
               <div className="flex flex-col justify-center">
                  <p className="text-white font-bold text-sm">Join the movement</p>
                  <p className="text-green-300 text-xs">Register today for free</p>
               </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            {!isAuthenticated ? (
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20 relative animate-slide-up">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-20"></div>
                
                <h2 className="text-2xl font-black text-green-900 mb-2">{t('auth_signup_title')}</h2>
                <p className="text-gray-500 text-sm mb-6">Start your journey to fair pricing in 30 seconds.</p>

                {authError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-xs font-bold flex items-center">
                    <X className="w-4 h-4 mr-2" /> {authError}
                  </div>
                )}

                {!showOtpField ? (
                  <form onSubmit={handleGetOtp} className="space-y-4">
                    <Input 
                      label={t('auth_username')} 
                      value={signupUsername} 
                      onChange={e => setSignupUsername(e.target.value)}
                      placeholder="e.g. Ram Kishan"
                      required
                      className="h-12"
                    />
                    <Input 
                      label={t('auth_mobile')} 
                      value={signupMobile} 
                      onChange={e => setSignupMobile(e.target.value.replace(/\D/g, '').slice(0,10))}
                      placeholder="Mobile Number"
                      type="tel"
                      required
                      className="h-12 font-mono"
                    />
                    <Button fullWidth type="submit" disabled={isAuthLoading} className="h-14 rounded-2xl font-bold shadow-lg mt-2">
                      {isAuthLoading ? <Loader2 className="animate-spin mx-auto" /> : t('auth_get_otp')}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerify} className="space-y-4">
                    <div className="bg-green-50 p-3 rounded-xl mb-4 border border-green-100 flex items-center">
                      <Smartphone className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-xs text-green-800 font-medium">Verify code sent to {signupMobile}</span>
                    </div>
                    <Input 
                      label={t('auth_otp')} 
                      value={signupOtp} 
                      onChange={e => setSignupOtp(e.target.value)}
                      placeholder="6-digit code"
                      required
                      className="h-14 text-center tracking-widest font-black text-xl"
                    />
                    <Button fullWidth type="submit" disabled={isAuthLoading} className="h-14 rounded-2xl font-bold shadow-lg">
                      {isAuthLoading ? <Loader2 className="animate-spin mx-auto" /> : t('auth_verify')}
                    </Button>
                    <button type="button" onClick={() => setShowOtpField(false)} className="w-full text-center text-xs text-gray-400 font-bold hover:text-green-700">Change Details</button>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md p-10 rounded-[3rem] border border-white/20 text-center text-white max-w-sm">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-black mb-4">Welcome Back!</h2>
                <p className="text-green-100 mb-8 font-light">You are logged in and ready to protect your profit.</p>
                <Button onClick={() => navigate('/calculator')} className="bg-yellow-500 text-green-950 px-8 py-4 rounded-full font-black text-lg">
                  Launch Calculator
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">Transparent Markets for Every Farmer</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">We provide the data and legal reporting tools you need to ensure your harvest gets the respect and revenue it deserves.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: TrendingUp, title: 'Fair Price Engine', desc: 'Advanced AI calculations based on real cultivation costs, transport, and market fluctuations.' },
              { icon: ShieldCheck, title: 'Trader Accountability', desc: 'Officially report unfair middleman practices and build a more transparent trade history.' },
              { icon: Languages, title: 'Regional Support', desc: 'Available in Hindi, Kannada, and English to ensure no farmer is left behind by language barriers.' }
            ].map((f, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-gray-50 border border-transparent hover:border-green-100 hover:bg-white hover:shadow-2xl transition-all duration-300">
                <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                  <f.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Community Spotlight */}
      <div className="bg-green-50 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div>
              <div className="flex items-center space-x-2 text-green-600 font-bold text-sm uppercase tracking-widest mb-2">
                <Users className="w-4 h-4" />
                <span>Our Impact</span>
              </div>
              <h2 className="text-4xl font-bold text-green-900">Community Spotlight</h2>
            </div>
            <button 
              onClick={() => navigate('/about')}
              className="group flex items-center space-x-2 text-green-700 font-bold hover:text-green-800 transition-colors"
            >
              <span>View All Stories</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {isLoadingSpotlight ? (
            <div className="flex flex-col items-center justify-center py-20 text-green-200">
               <Loader2 className="w-12 h-12 animate-spin mb-4" />
               <p className="font-bold uppercase tracking-widest text-xs">Accessing Database...</p>
            </div>
          ) : featuredFarmers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-green-200">
               <Users className="w-16 h-16 text-green-100 mx-auto mb-4" />
               <p className="text-gray-500 text-lg">No spotlight profiles yet. Be the first to share your journey!</p>
               <Button onClick={() => navigate('/about')} className="mt-6">Share My Story</Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredFarmers.map((farmer) => (
                <div key={farmer.userId} className="group bg-white rounded-[2rem] shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500">
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img 
                      src={farmer.photo} 
                      alt={farmer.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute top-4 right-4">
                      <div className="bg-green-600 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">
                        VERIFIED
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{farmer.name}</h3>
                    <p className="text-gray-500 text-xs mb-3 italic">"Farmer from {farmer.date.split('/')[2] || 'Karnataka'}"</p>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {farmer.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
