
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Quote, User, MapPin } from 'lucide-react';

const About: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       {/* Header */}
       <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-900 mb-4">{t('about_title')}</h1>
          <div className="w-24 h-1 bg-yellow-500 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{t('about_mission')}</p>
       </div>

       {/* Interview Section */}
       <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100 mt-8">
          <div className="bg-green-800 p-6 text-white flex items-center">
             <Quote className="w-8 h-8 text-yellow-400 mr-4" />
             <h2 className="text-2xl font-bold">{t('about_interview_title')}</h2>
          </div>
          
          <div className="p-8 grid md:grid-cols-3 gap-8">
             {/* Profile Card */}
             <div className="md:col-span-1">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1595254536643-a6217469a929?q=80&w=600&auto=format&fit=crop" 
                    alt="Farmer Interview" 
                    className="rounded-lg shadow-lg w-full h-auto object-cover border-4 border-green-50"
                  />
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-green-100 flex items-center whitespace-nowrap">
                     <User className="w-4 h-4 text-green-600 mr-2" />
                     <span className="font-bold text-green-900 text-sm">Ram Kishan</span>
                  </div>
                </div>
                <div className="mt-8 text-center bg-green-50 p-4 rounded-lg">
                   <p className="font-bold text-green-800">Wheat Farmer</p>
                   <p className="text-green-600 text-sm">Madhya Pradesh, India</p>
                   <div className="mt-2 text-xs text-gray-500">AgriFair Member since 2023</div>
                </div>
             </div>

             {/* Interview Transcript */}
             <div className="md:col-span-2 space-y-6">
                <div className="bg-white border-l-4 border-green-600 pl-4 py-2 hover:bg-green-50 transition-colors rounded-r-lg">
                   <p className="font-bold text-green-900 text-sm mb-1 uppercase tracking-wide opacity-70">Question</p>
                   <p className="font-semibold text-gray-900 text-lg mb-2">{t('about_q1')}</p>
                   <p className="text-gray-700 italic border-l-2 border-gray-300 pl-3 mt-2">"{t('about_a1')}"</p>
                </div>

                <div className="bg-white border-l-4 border-green-600 pl-4 py-2 hover:bg-green-50 transition-colors rounded-r-lg">
                   <p className="font-bold text-green-900 text-sm mb-1 uppercase tracking-wide opacity-70">Question</p>
                   <p className="font-semibold text-gray-900 text-lg mb-2">{t('about_q2')}</p>
                   <p className="text-gray-700 italic border-l-2 border-gray-300 pl-3 mt-2">"{t('about_a2')}"</p>
                </div>

                <div className="bg-white border-l-4 border-green-600 pl-4 py-2 hover:bg-green-50 transition-colors rounded-r-lg">
                   <p className="font-bold text-green-900 text-sm mb-1 uppercase tracking-wide opacity-70">Question</p>
                   <p className="font-semibold text-gray-900 text-lg mb-2">{t('about_q3')}</p>
                   <p className="text-gray-700 italic border-l-2 border-gray-300 pl-3 mt-2">"{t('about_a3')}"</p>
                </div>
             </div>
          </div>
       </div>

       {/* Team Section */}
       <div className="mt-16 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-green-900 mb-2">{t('about_team_title')}</h2>
            <div className="flex items-center justify-center text-gray-500 mt-2">
               <MapPin className="w-4 h-4 mr-1" />
               <p>{t('about_team_desc')}</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Photo 1 */}
            <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-green-100">
              <div className="absolute inset-0 bg-green-900/10 group-hover:bg-transparent transition-colors z-10"></div>
              {/* NOTE: Update the src below to match your uploaded file, e.g., src="/team1.jpg" */}
              <img 
                src="https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1000&auto=format&fit=crop" 
                alt="Team in Ramanagara" 
                className="w-full h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                <p className="text-white font-semibold flex items-center">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  Field Survey & Data Collection
                </p>
              </div>
            </div>

            {/* Photo 2 */}
            <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-green-100">
              <div className="absolute inset-0 bg-green-900/10 group-hover:bg-transparent transition-colors z-10"></div>
              {/* NOTE: Update the src below to match your uploaded file, e.g., src="/team2.jpg" */}
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop" 
                alt="Team Outreach" 
                className="w-full h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                <p className="text-white font-semibold flex items-center">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  Community Outreach Program
                </p>
              </div>
            </div>
          </div>
       </div>

       {/* Values / Footer Decoration */}
       <div className="grid md:grid-cols-3 gap-6 mt-12 text-center border-t border-gray-200 pt-12">
          <div className="p-4">
             <div className="text-4xl font-bold text-green-200 mb-2">10k+</div>
             <p className="text-gray-600 font-medium">Farmers Empowered</p>
          </div>
          <div className="p-4">
             <div className="text-4xl font-bold text-green-200 mb-2">100%</div>
             <p className="text-gray-600 font-medium">Transparent Calculations</p>
          </div>
          <div className="p-4">
             <div className="text-4xl font-bold text-green-200 mb-2">3</div>
             <p className="text-gray-600 font-medium">Languages Supported</p>
          </div>
       </div>
    </div>
  );
};
export default About;