
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { FeaturedFarmer } from '../types';
import { Quote, User as UserIcon, Camera, Upload, Trash2, ShieldCheck, Loader2, Pencil, X, Save, AlertCircle } from 'lucide-react';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBio, setEditBio] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFarmers = async () => {
    setIsLoadingFarmers(true);
    try {
      if (DatabaseService && typeof DatabaseService.getAllFeaturedFarmers === 'function') {
        const data = await DatabaseService.getAllFeaturedFarmers();
        setFeaturedFarmers(data || []);
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
          // Optimized dimensions for reliable cloud storage
          const MAX_DIM = 450; 
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
            // Lower quality slightly to ensure fast uploads even on 3G/4G
            resolve(canvas.toDataURL('image/jpeg', 0.5)); 
          } else { reject(new Error("Image processing error")); }
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
        setErrorMsg(null);
      } catch (err) {
        setErrorMsg("Could not process image. Please try a different photo.");
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user || !user.id) {
      setErrorMsg("Please login again to verify your account.");
      return;
    }

    if (!photo || !bio) {
      setErrorMsg("A photo and a short bio are required.");
      return;
    }

    setIsActionPending(true);
    const newFarmer: FeaturedFarmer = {
      userId: user.id,
      name: user.username || 'Verified Farmer',
      bio,
      photo,
      date: new Date().toLocaleDateString()
    };

    try {
      // Proactive sync logic is now handled in the service
      await DatabaseService.upsertFeaturedFarmer(newFarmer, user.mobile);
      await fetchFarmers();
      setBio(''); 
      setPhoto(null); 
      setIsUploading(false);
      alert("Success! Your journey is now shared with the community.");
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg(err.message || "Something went wrong. Please check your signal and try again.");
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteProfile = async (targetUserId: string) => {
    const isSelf = String(user?.id) === String(targetUserId);
    if (!confirm(isSelf ? "Remove your profile?" : "Admin: Delete this entry?")) return;
    
    setIsActionPending(true);
    try {
      await DatabaseService.deleteFeaturedFarmer(targetUserId);
      await fetchFarmers();
    } catch (err) {
      alert("Deletion failed.");
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
      await DatabaseService.upsertFeaturedFarmer({ ...farmer, bio: editBio }, user?.mobile);
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
    <div className="max-w-7xl mx-auto px-4 py-12">
       {/* Page Heading */}
       <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-4">{t('about_title')}</h1>
          <div className="w-24 h-1.5 bg-yellow-500 mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{t('about_mission')}</p>
       </div>

       {/* Community Spotlight Section */}
       <section className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-green-50 mb-20 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 relative z-10">
             <div className="max-w-xl">
                <h2 className="text-4xl font-black text-green-900 mb-4 tracking-tight">Community Spotlight</h2>
                <p className="text-gray-600 text-lg">Real stories from the heroes who feed the nation. Join our wall of success.</p>
             </div>
             {user && !myProfile && (
               <Button onClick={() => { setIsUploading(!isUploading); setErrorMsg(null); }} className="flex items-center h-14 px-8 rounded-2xl shadow-xl shadow-green-100">
                 <Camera className="w-5 h-5 mr-2" /> 
                 {isUploading ? 'Cancel' : 'Share My Story'}
               </Button>
             )}
          </div>

          {/* Upload Form */}
          {isUploading && user && !myProfile && (
            <div className="bg-green-50 rounded-3xl p-8 mb-16 border border-green-100 animate-slide-up shadow-inner">
               <div className="flex items-center mb-8">
                 <div className="bg-green-600 p-3 rounded-2xl mr-4 shadow-lg shadow-green-200">
                    <Upload className="w-6 h-6 text-white" />
                 </div>
                 <h3 className="font-black text-green-900 text-2xl">Your Success Story</h3>
               </div>
               
               {errorMsg && (
                 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center text-sm">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="font-bold">{errorMsg}</span>
                 </div>
               )}

               <form onSubmit={handleUploadSubmit} className="grid md:grid-cols-3 gap-10">
                 <div className="md:col-span-1">
                   <div 
                     onClick={() => fileInputRef.current?.click()} 
                     className="aspect-square bg-white border-4 border-dashed border-green-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative shadow-sm hover:shadow-md transition-all group"
                   >
                     {photo ? (
                       <img src={photo} className="w-full h-full object-cover" alt="Preview" />
                     ) : (
                       <div className="text-center p-6">
                         <Camera className="w-14 h-14 text-green-200 mx-auto mb-4 group-hover:scale-110 group-hover:text-green-400 transition-all" />
                         <span className="text-xs text-green-600 font-black uppercase tracking-widest">Add Portrait</span>
                       </div>
                     )}
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                 </div>
                 
                 <div className="md:col-span-2 flex flex-col justify-between">
                   <div>
                     <label className="block text-xs font-black text-green-800 mb-3 uppercase tracking-widest opacity-60">Your Experience (Max 300 chars)</label>
                     <textarea 
                       className="w-full p-6 border-2 border-green-100 rounded-3xl h-44 text-lg focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none resize-none transition-all" 
                       placeholder="Tell us how AgriFair helped your farm..." 
                       value={bio} 
                       onChange={(e) => setBio(e.target.value)} 
                       required 
                       maxLength={300}
                     />
                   </div>
                   <div className="mt-8 flex justify-end">
                     <Button type="submit" disabled={!photo || !bio || isActionPending} className="px-12 h-14 text-lg rounded-2xl shadow-xl shadow-green-200">
                       {isActionPending ? <Loader2 className="animate-spin" /> : 'Publish Story'}
                     </Button>
                   </div>
                 </div>
               </form>
            </div>
          )}

          {/* Spotlight Feed */}
          {isLoadingFarmers ? (
            <div className="py-24 flex flex-col items-center justify-center text-gray-400">
               <Loader2 className="w-14 h-14 animate-spin mb-6 text-green-200" />
               <p className="font-black uppercase tracking-widest text-xs">Accessing Farmers Wall...</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
               {featuredFarmers.length === 0 ? (
                 <div className="col-span-full py-24 text-center text-gray-400 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                    <UserIcon className="w-20 h-20 mx-auto mb-6 opacity-5" />
                    <p className="text-xl font-medium">Be the first to share your journey!</p>
                 </div>
               ) : (
                 featuredFarmers.map((farmer) => {
                   const isOwner = user && String(user.id) === String(farmer.userId);
                   const canManage = isAdmin || isOwner;
                   const isCurrentEditing = editingId === farmer.userId;
                   
                   return (
                     <div key={farmer.userId} className="group bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                        {canManage && (
                          <div className="absolute top-4 right-4 flex space-x-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => isCurrentEditing ? setEditingId(null) : startEditing(farmer)} 
                               className={`p-3 rounded-2xl text-white shadow-xl ${isCurrentEditing ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                             >
                                {isCurrentEditing ? <X size={16} /> : <Pencil size={16} />}
                             </button>
                             <button 
                               onClick={() => handleDeleteProfile(farmer.userId)} 
                               className="p-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 shadow-xl"
                             >
                                <Trash2 size={16} />
                             </button>
                          </div>
                        )}
                        
                        <div className="aspect-[4/5] bg-gray-100 overflow-hidden relative">
                          <img src={farmer.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={farmer.name} />
                          <div className="absolute bottom-6 left-6">
                            <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center text-[10px] font-black text-green-700 shadow-xl border border-white">
                               <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> AGRIFAIR VERIFIED
                            </div>
                          </div>
                        </div>

                        <div className="p-8">
                           <h3 className="font-black text-green-950 text-2xl mb-3">{farmer.name}</h3>
                           
                           {isCurrentEditing ? (
                             <div className="space-y-4">
                               <textarea 
                                 className="w-full p-4 border-2 border-blue-50 rounded-2xl text-sm h-32 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none transition-all" 
                                 value={editBio} 
                                 onChange={(e) => setEditBio(e.target.value)} 
                               />
                               <Button fullWidth onClick={() => saveEdit(farmer)} disabled={isActionPending} className="h-12 text-sm rounded-xl">
                                 {isActionPending ? <Loader2 className="animate-spin w-5 h-5" /> : 'Update Story'}
                               </Button>
                             </div>
                           ) : (
                             <p className="text-gray-600 italic text-base line-clamp-5 leading-relaxed">"{farmer.bio}"</p>
                           )}
                           
                           {!isCurrentEditing && (
                             <div className="pt-6 mt-6 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Joined {farmer.date}</span>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
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
       <section className="bg-green-900 rounded-[3rem] p-10 md:p-20 border border-green-800 mb-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-[100px]"></div>
          <div className="max-w-4xl mx-auto relative z-10">
             <Quote className="w-16 h-16 text-yellow-500 opacity-30 mb-8 mx-auto" />
             <h2 className="text-4xl font-black text-white mb-12 text-center tracking-tight">{t('about_interview_title')}</h2>
             <div className="space-y-10">
                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2rem] border border-white/10 transition-all hover:bg-white/10">
                   <p className="font-black text-yellow-500 mb-4 text-xs uppercase tracking-[0.2em]">Context: The Struggle</p>
                   <p className="font-bold text-white mb-5 text-xl">Q: {t('about_q1')}</p>
                   <p className="text-green-50 italic leading-relaxed text-xl font-light">" {t('about_a1')} "</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2rem] border border-white/10 transition-all hover:bg-white/10">
                   <p className="font-black text-yellow-500 mb-4 text-xs uppercase tracking-[0.2em]">Context: The Solution</p>
                   <p className="font-bold text-white mb-5 text-xl">Q: {t('about_q2')}</p>
                   <p className="text-green-50 italic leading-relaxed text-xl font-light">" {t('about_a2')} "</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2rem] border border-white/10 transition-all hover:bg-white/10">
                   <p className="font-black text-yellow-500 mb-4 text-xs uppercase tracking-[0.2em]">Context: The Future</p>
                   <p className="font-bold text-white mb-5 text-xl">Q: {t('about_q3')}</p>
                   <p className="text-green-50 italic leading-relaxed text-xl font-light">" {t('about_a3')} "</p>
                </div>
             </div>
          </div>
       </section>
    </div>
  );
};

export default About;
