
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { FeaturedFarmer } from '../types';
import { Quote, User as UserIcon, Camera, Upload, Trash2, ShieldCheck, Loader2, Pencil, X, Save } from 'lucide-react';
import { Button } from '../components/Button';
import { DatabaseService } from '../services/mockDb';

const About: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [featuredFarmers, setFeaturedFarmers] = useState<FeaturedFarmer[]>([]);
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFarmers, setIsLoadingFarmers] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBio, setEditBio] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFarmers = async () => {
    setIsLoadingFarmers(true);
    try {
      if (typeof DatabaseService.getAllFeaturedFarmers === 'function') {
        const data = await DatabaseService.getAllFeaturedFarmers();
        setFeaturedFarmers(data);
      }
    } catch (err) {
      console.error("Failed to fetch farmers:", err);
    } finally {
      setIsLoadingFarmers(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 400; 
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
          } else {
            if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.5)); 
          } else { reject(new Error("Canvas context failed")); }
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await resizeImage(file);
        setPhoto(compressedBase64);
      } catch (err) {
        alert("Could not process image.");
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUserId = user?.id ? String(user.id) : null;
    
    if (!currentUserId || !photo || !bio) {
      alert("Missing data. Please check login status, photo and bio.");
      return;
    }

    setIsActionPending(true);
    const newFarmer: FeaturedFarmer = {
      userId: currentUserId,
      name: user?.username || 'Verified Farmer',
      bio,
      photo,
      date: new Date().toLocaleDateString()
    };

    try {
      await DatabaseService.upsertFeaturedFarmer(newFarmer);
      await fetchFarmers();
      setBio(''); 
      setPhoto(null); 
      setIsUploading(false);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Verification failed. Please try again in a moment.");
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteProfile = async (targetUserId: string) => {
    const isSelf = String(user?.id) === String(targetUserId);
    if (!confirm(isSelf ? "Remove your profile?" : "ADMIN: Delete this user's spotlight?")) return;
    
    setIsActionPending(true);
    try {
      await DatabaseService.deleteFeaturedFarmer(targetUserId);
      await fetchFarmers();
    } catch (err) {
      alert("Failed to delete.");
    } finally {
      setIsActionPending(false);
    }
  };

  const startEditing = (farmer: FeaturedFarmer) => {
    setEditingId(farmer.userId);
    setEditBio(farmer.bio);
  };

  const saveEdit = async (farmer: FeaturedFarmer) => {
    setIsActionPending(true);
    try {
      await DatabaseService.upsertFeaturedFarmer({ ...farmer, bio: editBio });
      await fetchFarmers();
      setEditingId(null);
    } catch (err) {
      alert("Update failed.");
    } finally {
      setIsActionPending(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const myProfile = user ? featuredFarmers.find(f => String(f.userId) === String(user.id)) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       {/* Page Heading */}
       <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-4">{t('about_title')}</h1>
          <div className="w-24 h-1.5 bg-yellow-500 mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{t('about_mission')}</p>
       </div>

       {/* Community Spotlight Section */}
       <section className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-green-50 mb-20 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
             <div className="max-w-xl">
                <h2 className="text-4xl font-bold text-green-900 mb-4">Community Spotlight</h2>
                <p className="text-gray-600 text-lg">Real stories from farmers across the country who use AgriFair to protect their livelihood.</p>
             </div>
             {user && !myProfile && (
               <Button onClick={() => setIsUploading(!isUploading)} className="flex items-center">
                 <Camera className="w-4 h-4 mr-2" /> 
                 {isUploading ? 'Cancel' : 'Share My Story'}
               </Button>
             )}
          </div>

          {/* Upload Form */}
          {isUploading && user && !myProfile && (
            <div className="bg-green-50 rounded-2xl p-8 mb-16 border border-green-100 animate-slide-up shadow-inner">
               <div className="flex items-center mb-6">
                 <Upload className="w-6 h-6 text-green-600 mr-3" />
                 <h3 className="font-bold text-green-900 text-xl">Publish Your Success Story</h3>
               </div>
               
               <form onSubmit={handleUploadSubmit} className="grid md:grid-cols-3 gap-8">
                 <div className="md:col-span-1">
                   <div 
                     onClick={() => fileInputRef.current?.click()} 
                     className="aspect-square bg-white border-4 border-dashed border-green-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative shadow-sm hover:shadow-md transition-all group"
                   >
                     {photo ? (
                       <img src={photo} className="w-full h-full object-cover" alt="Preview" />
                     ) : (
                       <div className="text-center p-4">
                         <Camera className="w-12 h-12 text-green-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                         <span className="text-xs text-green-600 font-bold uppercase tracking-wider">Add Photo</span>
                       </div>
                     )}
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                 </div>
                 
                 <div className="md:col-span-2 flex flex-col">
                   <label className="block text-xs font-black text-green-800 mb-2 uppercase tracking-widest opacity-60">Your Experience</label>
                   <textarea 
                     className="w-full flex-grow p-6 border border-green-200 rounded-2xl h-44 text-lg focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none resize-none transition-all" 
                     placeholder="Tell other farmers how AgriFair helped you..." 
                     value={bio} 
                     onChange={(e) => setBio(e.target.value)} 
                     required 
                     maxLength={300}
                   />
                   <div className="mt-6 flex justify-end">
                     <Button type="submit" disabled={!photo || !bio || isActionPending} className="px-10 h-12">
                       {isActionPending ? <Loader2 className="animate-spin" /> : 'Publish to Spotlight'}
                     </Button>
                   </div>
                 </div>
               </form>
            </div>
          )}

          {/* Spotlight Feed */}
          {isLoadingFarmers ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
               <Loader2 className="w-12 h-12 animate-spin mb-4 text-green-200" />
               <p className="font-bold uppercase tracking-widest text-xs">Syncing Stories...</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {featuredFarmers.length === 0 ? (
                 <div className="col-span-full py-20 text-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    <UserIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <p className="text-lg">No stories shared yet.</p>
                 </div>
               ) : (
                 featuredFarmers.map((farmer) => {
                   const isOwner = user && String(user.id) === String(farmer.userId);
                   const canManage = isAdmin || isOwner;
                   const isCurrentEditing = editingId === farmer.userId;
                   
                   return (
                     <div key={farmer.userId} className="group bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative transition-all duration-300 hover:shadow-2xl">
                        {canManage && (
                          <div className="absolute top-2 right-2 flex space-x-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => isCurrentEditing ? setEditingId(null) : startEditing(farmer)} 
                               className={`p-2 rounded-full text-white shadow-lg ${isCurrentEditing ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                             >
                                {isCurrentEditing ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                             </button>
                             <button 
                               onClick={() => handleDeleteProfile(farmer.userId)} 
                               className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                             >
                                <Trash2 className="w-3 h-3" />
                             </button>
                          </div>
                        )}
                        
                        <div className="aspect-square bg-gray-100 overflow-hidden relative">
                          <img src={farmer.photo} className="w-full h-full object-cover" alt={farmer.name} />
                          <div className="absolute bottom-4 left-4">
                            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center text-[10px] font-black text-green-700 shadow-sm border border-green-100">
                               <ShieldCheck className="w-3 h-3 mr-1" /> VERIFIED
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                           <h3 className="font-bold text-green-900 text-xl mb-2">{farmer.name}</h3>
                           
                           {isCurrentEditing ? (
                             <div className="space-y-3">
                               <textarea 
                                 className="w-full p-3 border rounded-xl text-sm h-28 focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                                 value={editBio} 
                                 onChange={(e) => setEditBio(e.target.value)} 
                               />
                               <Button fullWidth onClick={() => saveEdit(farmer)} disabled={isActionPending} className="h-10 text-xs">
                                 {isActionPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />}
                                 Save Changes
                               </Button>
                             </div>
                           ) : (
                             <p className="text-gray-600 italic text-sm line-clamp-4 leading-relaxed">"{farmer.bio}"</p>
                           )}
                           
                           {!isCurrentEditing && (
                             <div className="pt-4 mt-4 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Farmer since {farmer.date}</span>
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                             </div>
                           )}
                        </div>
                     </div>
                   );
                 })
               )}
            </div>
          )}
       </section>

       {/* Voices from the Field (Interviews) */}
       <section className="bg-green-50 rounded-3xl p-8 md:p-12 border border-green-100 mb-20">
          <div className="max-w-4xl mx-auto">
             <Quote className="w-12 h-12 text-green-200 mb-6 mx-auto" />
             <h2 className="text-3xl font-bold text-green-900 mb-10 text-center">{t('about_interview_title')}</h2>
             <div className="space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border-l-8 border-green-600 transition-transform hover:-translate-y-1">
                   <p className="font-black text-green-800 mb-3 text-sm uppercase tracking-widest opacity-60">Question</p>
                   <p className="font-bold text-gray-900 mb-4 text-lg">Q: {t('about_q1')}</p>
                   <p className="text-gray-700 italic leading-relaxed text-lg">" {t('about_a1')} "</p>
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-sm border-l-8 border-yellow-500 transition-transform hover:-translate-y-1">
                   <p className="font-black text-green-800 mb-3 text-sm uppercase tracking-widest opacity-60">Question</p>
                   <p className="font-bold text-gray-900 mb-4 text-lg">Q: {t('about_q2')}</p>
                   <p className="text-gray-700 italic leading-relaxed text-lg">" {t('about_a2')} "</p>
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-sm border-l-8 border-green-600 transition-transform hover:-translate-y-1">
                   <p className="font-black text-green-800 mb-3 text-sm uppercase tracking-widest opacity-60">Question</p>
                   <p className="font-bold text-gray-900 mb-4 text-lg">Q: {t('about_q3')}</p>
                   <p className="text-gray-700 italic leading-relaxed text-lg">" {t('about_a3')} "</p>
                </div>
             </div>
          </div>
       </section>
    </div>
  );
};

export default About;
