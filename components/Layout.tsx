
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SupportedLanguage } from '../types';
import { Sprout, Scale, MessageSquare, LogOut, Menu, X, User as UserIcon, Languages, ChevronDown, Info } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path ? "bg-green-700 text-white" : "text-green-100 hover:bg-green-600";

  const getNativeName = (lang: string) => {
    switch (lang) {
      case 'hi': return 'हिंदी';
      case 'kn': return 'ಕನ್ನಡ';
      default: return 'English';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-green-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <Sprout className="h-8 w-8 text-yellow-400 mr-2" />
              <span className="font-bold text-xl text-white tracking-wide">AgriFair</span>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')}`}>
                  {t('nav_home')}
                </Link>
                <Link to="/about" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/about')}`}>
                  {t('nav_about')}
                </Link>
                {user && (
                  <>
                    <Link to="/calculator" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/calculator')}`}>
                      <Scale className="inline-block w-4 h-4 mr-1" />
                      {t('nav_calculator')}
                    </Link>
                    <Link to="/complaints" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/complaints')}`}>
                      <MessageSquare className="inline-block w-4 h-4 mr-1" />
                      {t('nav_complaints')}
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
               {/* Language Dropdown */}
               <div className="relative">
                  <button 
                    onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                    className="flex items-center space-x-2 bg-green-900 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-all border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <Languages className="w-4 h-4" />
                    <span>{getNativeName(language)}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isLangDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsLangDropdownOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 overflow-hidden ring-1 ring-black ring-opacity-5">
                        <div className="py-1">
                          {Object.values(SupportedLanguage).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => {
                                setLanguage(lang);
                                setIsLangDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                                language === lang 
                                  ? 'bg-green-50 text-green-800 font-bold' 
                                  : 'text-gray-700 hover:bg-gray-100 hover:text-green-800'
                              }`}
                            >
                              {getNativeName(lang)}
                              {language === lang && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
               </div>

              {user ? (
                <div className="flex items-center space-x-4 pl-4 border-l border-green-700">
                  <div className="flex flex-col items-end text-green-100 text-sm">
                    <div className="flex items-center font-medium">
                      <UserIcon className="w-3 h-3 mr-1" />
                      {user.username}
                    </div>
                    <span className="text-xs text-green-300 opacity-80">{user.mobile}</span>
                  </div>
                  <button onClick={handleLogout} className="bg-green-900 hover:bg-green-950 text-white px-3 py-2 rounded-md text-sm flex items-center transition-colors">
                    <LogOut className="w-4 h-4 mr-1" />
                    {t('nav_logout')}
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="ml-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-md transition-all">
                  {t('nav_login')}
                </Link>
              )}
            </div>

            <div className="-mr-2 flex md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-green-200 hover:text-white hover:bg-green-700 focus:outline-none">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-green-700">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
               <div className="p-3 bg-green-800 rounded-lg mb-2">
                  <p className="text-green-200 text-xs uppercase font-semibold mb-2 flex items-center">
                    <Languages className="w-3 h-3 mr-1"/> Select Language
                  </p>
                  <div className="flex space-x-2">
                    {Object.values(SupportedLanguage).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`flex-1 px-2 py-2 rounded text-sm font-medium text-center transition-colors border ${
                          language === lang 
                            ? 'bg-white text-green-900 border-white shadow-sm' 
                            : 'text-green-100 border-green-600 hover:bg-green-600'
                        }`}
                      >
                        {getNativeName(lang)}
                      </button>
                    ))}
                  </div>
               </div>
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-white hover:bg-green-600 block px-3 py-2 rounded-md text-base font-medium">
                {t('nav_home')}
              </Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-white hover:bg-green-600 block px-3 py-2 rounded-md text-base font-medium">
                {t('nav_about')}
              </Link>
              {user && (
                <>
                  <div className="px-3 py-2 border-t border-green-600 mt-2 mb-2">
                     <p className="text-green-200 text-xs uppercase font-semibold mb-1">Signed in as:</p>
                     <p className="text-white font-medium">{user.username}</p>
                     <p className="text-green-300 text-sm">{user.mobile}</p>
                  </div>
                  <Link to="/calculator" onClick={() => setIsMenuOpen(false)} className="text-white hover:bg-green-600 block px-3 py-2 rounded-md text-base font-medium">
                    {t('nav_calculator')}
                  </Link>
                  <Link to="/complaints" onClick={() => setIsMenuOpen(false)} className="text-white hover:bg-green-600 block px-3 py-2 rounded-md text-base font-medium">
                    {t('nav_complaints')}
                  </Link>
                  <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-white hover:bg-green-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium">
                    {t('nav_logout')}
                  </button>
                </>
              )}
              {!user && (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="text-white hover:bg-green-600 block px-3 py-2 rounded-md text-base font-medium">
                  {t('nav_login')}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 AgriFair. Empowering Farmers.</p>
        </div>
      </footer>
    </div>
  );
};