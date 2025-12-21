
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/Button';
import { TrendingUp, ShieldCheck, Languages, Users, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { DatabaseService } from '../services/mockDb';
import { FeaturedFarmer } from '../types';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [featuredFarmers, setFeaturedFarmers] = useState<FeaturedFarmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSpotlight = async () => {
      setIsLoading(true);
      const data = await DatabaseService.getAllFeaturedFarmers();
      // Show only the 4 most recent on the home page
      setFeaturedFarmers(data.slice(0, 4));
      setIsLoading(false);
    };
    loadSpotlight();
  }, []);

  const handleCta = () => {
    if (user) {
      navigate('/calculator');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-green-900 h-[650px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop" 
            alt="Agriculture Field" 
            className="w-full h-full object-cover opacity-40 scale-105 animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-green-900 via-green-900/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-full mb-6 animate-fade-in">
             <ShieldCheck className="w-4 h-4" />
             <span className="text-xs font-bold uppercase tracking-widest">Trusted by 10,000+ Farmers</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-2xl leading-tight">
            {t('hero_title')}
          </h1>
          <p className="text-xl md:text-2xl text-green-100 mb-10 font-light max-w-2xl mx-auto">
            {t('hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={handleCta}
              className="text-lg px-10 py-5 bg-yellow-500 hover:bg-yellow-400 text-green-950 font-black rounded-full shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              {t('hero_cta')}
            </Button>
            <Button 
              onClick={() => navigate('/about')}
              variant="outline"
              className="text-lg px-10 py-5 border-white text-white hover:bg-white hover:text-green-900 font-bold rounded-full"
            >
              Learn Our Story
            </Button>
          </div>
        </div>
      </div>

      {/* Main Features */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">Why AgriFair?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">We provide the tools and data you need to ensure your harvest gets the respect and revenue it deserves.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: TrendingUp, title: 'Fair Price Engine', desc: 'Advanced AI calculations based on real cultivation costs and market fluctuations.' },
              { icon: ShieldCheck, title: 'Trader Accountability', desc: 'Report unfair middleman practices and build a more transparent market for all.' },
              { icon: Languages, title: 'Regional Support', desc: 'Fully accessible in Hindi, Kannada, and English to reach every corner of India.' }
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

      {/* Community Spotlight - Featured Farmers fetched from DB */}
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

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-green-200">
               <Loader2 className="w-12 h-12 animate-spin mb-4" />
               <p className="font-bold uppercase tracking-widest text-xs">Accessing Database...</p>
            </div>
          ) : featuredFarmers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-green-200">
               <Users className="w-16 h-16 text-green-100 mx-auto mb-4" />
               <p className="text-gray-500 text-lg">No spotlight profiles yet. Be the first to share your journey!</p>
               <Button onClick={() => navigate('/auth')} className="mt-6">Join Our Community</Button>
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

          {!user && (
            <div className="mt-16 bg-green-900 rounded-[2.5rem] p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <img src="https://www.transparenttextures.com/patterns/leaf.png" alt="" className="w-full h-full object-repeat" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Are you an AgriFair Farmer?</h3>
              <p className="text-green-200 mb-8 max-w-lg mx-auto">Sign up today to calculate your fair price, file complaints, and get featured in our community spotlight.</p>
              <Button 
                onClick={() => navigate('/auth')} 
                className="bg-white text-green-900 hover:bg-green-50 px-10 py-4 font-black rounded-full shadow-xl"
              >
                Create Free Account
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
