import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/Button';
import { TrendingUp, ShieldCheck, Languages } from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

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
      <div className="relative bg-green-900 h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/1920/1080?grayscale&blur=2" 
            alt="Agriculture Field" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-green-900 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            {t('hero_title')}
          </h1>
          <p className="text-xl md:text-2xl text-green-100 mb-8 font-light">
            {t('hero_subtitle')}
          </p>
          <Button 
            onClick={handleCta}
            className="text-lg px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-green-900 font-bold rounded-full transform hover:scale-105 transition-transform"
          >
            {t('hero_cta')}
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Fair Price Engine</h3>
            <p className="text-gray-600">
              Advanced algorithms powered by AI to calculate the true cost of production and ensure you get a profitable margin.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Trader Accountability</h3>
            <p className="text-gray-600">
              A transparent complaint system to report unfair practices and build a safer trading community for farmers.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Languages className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Multi-Language Support</h3>
            <p className="text-gray-600">
              Access the platform in your local language. We break down barriers to ensure every farmer is understood.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
