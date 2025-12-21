
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { FeaturedFarmer } from '../types';
import { Quote, User as UserIcon, MapPin, Camera, Upload, CheckCircle, Trash2, Users } from 'lucide-react';
import { Button } from '../components/Button';

const FEATURED_FARMERS_KEY = 'agrifair_featured_farmers';

const About: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [featuredFarmers, setFeaturedFarmers] = useState<FeaturedFarmer[]>([]);
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load featured farmers from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(FEATURED_FARMERS_KEY);
    if (stored) {
      try {
        setFeaturedFarmers(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse featured farmers", e);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !photo || !bio) return;

    const newFarmer: FeaturedFarmer = {
      userId: user.id,
      name: user.username,
      bio,
      photo,
      date: new Date().toLocaleDateString()
    };

    // Update existing or add new
    const updated = [...featuredFarmers.filter(f => f.userId !== user.id), newFarmer];
    setFeaturedFarmers(updated);
    localStorage.setItem(FEATURED_FARMERS_KEY, JSON.stringify(updated));
    
    // Reset form
    setBio('');
    setPhoto(null);
    setIsUploading(false);
    alert("You are now a Featured Farmer!");
  };

  const removeMyProfile = () => {
    if (!user) return;
    const updated = featuredFarmers.filter(f => f.userId !== user.id);
    setFeaturedFarmers(updated);
    localStorage.setItem(FEATURED_FARMERS_KEY, JSON.stringify(updated));
  };

  const myProfile = user ? featuredFarmers.find(f => f.userId === user.id) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       {/* Header */}
       <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-900 mb-4">{t('about_title')}</h1>
          <div className="w-24 h-1 bg-yellow-500 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{t('about_mission')}</p>
       </div>

       {/* Interview Section */}
       <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100 mt-8 max-w-5xl mx-auto">
          <div className="bg-green-800 p-6 text-white flex items-center justify-center">
             <Quote className="w-8 h-8 text-yellow-400 mr-4" />
             <h2 className="text-2xl font-bold">{t('about_interview_title')}</h2>
          </div>
          
          <div className="p-8 border-b border-gray-100">
             {/* Interview Transcript - Now Centered without Profile Card */}
             <div className="space-y-6 max-w-3xl mx-auto">
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

       {/* Featured Farmers Community Section */}
       <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 border border-green-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
             <div>
                <h2 className="text-3xl font-bold text-green-900">Featured Farmers</h2>
                <p className="text-gray-600 mt-2">Celebrating our community members who are making a difference.</p>
             </div>
             {user && (
               <div className="flex items-center gap-3">
                 {myProfile ? (
                   <Button variant="danger" onClick={removeMyProfile} className="flex items-center">
                     <Trash2 className="w-4 h-4 mr-2" /> Remove My Profile
                   </Button>
                 ) : (
                   <Button onClick={() => setIsUploading(!isUploading)} className="flex items-center">
                     <Camera className="w-4 h-4 mr-2" /> 
                     {isUploading ? 'Cancel' : 'Become a Featured Farmer'}
                   </Button>
                 )}
               </div>
             )}
          </div>

          {/* Upload Form (Visible only when isUploading is true) */}
          {isUploading && user && !myProfile && (
            <div className="bg-green-50 rounded-xl p-6 mb-12 border border-green-200 animate-fade-in">
               <h3 className="font-bold text-green-900 mb-4 flex items-center">
                 <Upload className="w-5 h-5 mr-2" /> Tell us your story
               </h3>
               <form onSubmit={handleUploadSubmit} className="grid md:grid-cols-3 gap-6">
                 <div className="md:col-span-1">
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="aspect-square bg-white border-2 border-dashed border-green-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-green-100 transition-colors overflow-hidden group relative"
                   >
                     {photo ? (
                       <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                       <>
                         <Camera className="w-10 h-10 text-green-400 mb-2" />
                         <span className="text-sm text-green-600 font-medium">Click to upload photo</span>
                       </>
                     )}
                     <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold uppercase tracking-wider">Change Photo</span>
                     </div>
                   </div>
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={handleFileChange} 
                     className="hidden" 
                     accept="image/*"
                   />
                 </div>
                 <div className="md:col-span-2 flex flex-col">
                   <label className="block text-sm font-bold text-green-800 mb-2">Short Bio (Who are you and what do you farm?)</label>
                   <textarea 
                     className="w-full flex-grow p-4 border border-green-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 resize-none h-40"
                     placeholder="e.g. I am a rice farmer from Karnataka. AgriFair helped me negotiate a 20% better price this harvest!"
                     value={bio}
                     onChange={(e) => setBio(e.target.value)}
                     required
                     maxLength={250}
                   />
                   <div className="mt-4 flex justify-end">
                     <Button type="submit" disabled={!photo || !bio}>
                       Publish My Profile
                     </Button>
                   </div>
                 </div>
               </form>
            </div>
          )}

          {/* Featured Farmers Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {featuredFarmers.length === 0 ? (
               <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No community profiles yet. Be the first!</p>
               </div>
             ) : (
               featuredFarmers.map((farmer) => (
                 <div key={farmer.userId} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                       <img 
                         src={farmer.photo} 
                         alt={farmer.name} 
                         className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                       />
                    </div>
                    <div className="p-4">
                       <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-green-900">{farmer.name}</h3>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                       </div>
                       <p className="text-sm text-gray-600 line-clamp-3 italic mb-3">"{farmer.bio}"</p>
                       <div className="flex items-center text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                          <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded mr-auto">Community Member</span>
                          <span>Joined {farmer.date}</span>
                       </div>
                    </div>
                 </div>
               ))
             )}
          </div>
       </div>

       {/* Team Section */}
       <div className="mt-20 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-green-900 mb-2">{t('about_team_title')}</h2>
            <div className="flex items-center justify-center text-gray-500 mt-2">
               <MapPin className="w-4 h-4 mr-1" />
               <p>{t('about_team_desc')}</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Field Photo 1 */}
            <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-green-100">
              <div className="absolute inset-0 bg-green-900/10 group-hover:bg-transparent transition-colors z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1000&auto=format&fit=crop" 
                alt="Team in Ramanagara" 
                className="w-full h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                <p className="text-white font-semibold flex items-center">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  Field Survey & Data Collection, Karnataka
                </p>
              </div>
            </div>

            {/* Field Photo 2 */}
            <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-green-100">
              <div className="absolute inset-0 bg-green-900/10 group-hover:bg-transparent transition-colors z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop" 
                alt="Team Outreach" 
                className="w-full h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                <p className="text-white font-semibold flex items-center">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  Ramanagara Community Outreach
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
