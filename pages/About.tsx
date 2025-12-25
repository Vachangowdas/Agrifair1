
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
  
  // Authority States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBio, setEditBio] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFarmers = async () => {
    setIsLoadingFarmers(true);
    const data = await DatabaseService.getAllFeaturedFarmers();
    setFeaturedFarmers(data);
    setIsLoadingFarmers(false);
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  // Optimized image compression for Database Storage
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Smaller max dimension (400px) ensures cross-device sync never fails due to payload size
          const MAX_DIM = 400; 
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // 0.5 quality provides excellent balance of clarity and extremely low file size (~30kb)
            resolve(canvas.toDataURL('image/jpeg', 0.5)); 
          } else {
            reject(new Error("Canvas context failed"));
          }
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
        console.error("Image processing failed:", err);
        alert("Could not process image. Please try a different one.");
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !photo || !bio) return;

    setIsActionPending(true);
    const newFarmer: FeaturedFarmer = {
      userId: user.id,
      name: user.username,
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
      alert("Failed to save profile to cloud. Check internet connection.");
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteProfile = async (targetUserId: string) => {
    const isSelf = user?.id === targetUserId;
    const msg = isSelf 
      ? "Are you sure you want to remove your community profile?" 
      : "ADMIN: Are you sure you want to delete this user's spotlight entry?";
    
    if (!confirm(msg)) return;
    
    setIsActionPending(true);
    await DatabaseService.deleteFeaturedFarmer(targetUserId);
    await fetchFarmers();
    setIsActionPending(false);
  };

  const startEditing = (farmer: FeaturedFarmer) => {
    setEditingId(farmer.userId);
    setEditBio(farmer.bio);
  };

  const saveEdit = async (farmer: FeaturedFarmer) => {
    setIsActionPending(true);
    const updated = { ...farmer, bio: editBio };
    try {
      await DatabaseService.upsertFeaturedFarmer(updated);
      await fetchFarmers();
      setEditingId(null);
    } catch (err) {
      alert("Update failed. Please try again.");
    } finally {
      setIsActionPending(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const myProfile = user ? featuredFarmers.find(f => f.userId === user.id) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       {/* Header */}
       <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-4">{t('about_title')}</h1>
          <div className="w-24 h-1.5 bg-yellow-500 mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{t('about_mission')}</p>
       </div>

       {/* Featured Farmers Community Section */}
       <section className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-green-50 mb-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             {isAdmin && (
               <div className="flex items-center space-x-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 animate-pulse">
                 <span>MASTER ADMIN AUTHORITY</span>
               </div>
             )}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
             <div className="max-w-xl">
                <h2 className="text-4xl font-bold text-green-900 mb-4">Community Spotlight</h2>
                <p className="text-gray-600 text-lg">Real stories from farmers across the country who use AgriFair to protect their livelihood.</p>
             </div>
             {user && (
               <div className="flex items-center gap-3">
                 {!myProfile && (
                   <Button onClick={() => setIsUploading(!isUploading)} className="flex items-center group">
                     <Camera className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" /> 
                     {isUploading ? 'Cancel' : 'Share My Story'}
                   </Button>
                 )}
               </div>
             )}
          </div>

          {isUploading && user && !myProfile && (
            <div className="bg-green-50 rounded-2xl p-8 mb-16 border border-green-100 animate-slide-up shadow-inner">
               <div className="flex items-center mb-6">
                 <div className="bg-green-600 p-2 rounded-lg mr-4">
                    <Upload className="w-5 h-5 text-white" />
                 </div>
                 <h3 className="font-bold text-green-900 text-xl">Publish Your Success Story</h3>
               </div>
               
               <form onSubmit={handleUploadSubmit} className="grid md:grid-cols-3 gap-8">
                 <div className="md:col-span-1">
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="aspect-square bg-white border-4 border-dashed border-green-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-green-100 transition-all overflow-hidden group relative shadow-sm hover:shadow-md"
                   >
                     {photo ? (
                       <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                       <>
                         <Camera className="w-12 h-12 text-green-300 mb-2 group-hover:scale-110 transition-transform" />
                         <span className="text-xs text-green-600 font-bold uppercase tracking-wider">Add Photo</span>
                       </>
                     )}
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                 </div>
                 <div className="md:col-span-2 flex flex-col">
                   <label className="block text-sm font-black text-green-800 mb-2 uppercase tracking-wider opacity-60">Short Bio / Experience</label>
                   <textarea 
                     className="w-full flex-grow p-6 border border-green-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 resize-none h-44 text-lg shadow-sm"
                     placeholder="e.g. 'I am a wheat farmer from Punjab...'"
                     value={bio}
                     onChange={(e) => setBio(e.target.value)}
                     required
                     maxLength={250}
                   />
                   <div className="mt-6 flex justify-end">
                     <Button type="submit" disabled={!photo || !bio || isActionPending} className="px-10 h-12">
                       {isActionPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish to Spotlight'}
                     </Button>
                   </div>
                 </div>
               </form>
            </div>
          )}

          {isLoadingFarmers ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
               <Loader2 className="w-12 h-12 animate-spin mb-4 text-green-200" />
               <p className="font-medium">Loading community stories...</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {featuredFarmers.length === 0 ? (
                 <div className="col-span-full py-20 text-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    <UserIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <p className="text-lg">Our community is growing. Be the first to share your story!</p>
                 </div>
               ) : (
                 featuredFarmers.map((farmer) => {
                   const isOwner = user?.id === farmer.userId;
                   const canManage = isAdmin || isOwner;
                   const isCurrentEditing = editingId === farmer.userId;

                   return (
                     <div key={farmer.userId} className="group bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 relative">
                        {canManage && (
                          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                             {!isCurrentEditing ? (
                               <>
                                 <button 
                                   onClick={() => startEditing(farmer)}
                                   className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                                   title="Edit Profile"
                                 >
                                    <Pencil className="w-3 h-3" />
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteProfile(farmer.userId)}
                                   className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                                   title="Delete Profile"
                                 >
                                    <Trash2 className="w-3 h-3" />
                                 </button>
                               </>
                             ) : (
                               <>
                                 <button 
                                   onClick={() => setEditingId(null)}
                                   className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 shadow-lg"
                                   title="Cancel"
                                 >
                                    <X className="w-3 h-3" />
                                 </button>
                               </>
                             )}
                          </div>
                        )}

                        <div className="aspect-square bg-gray-100 overflow-hidden relative">
                           <img src={farmer.photo} alt={farmer.name} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
                           <div className="absolute top-4 left-4">
                              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center text-[10px] font-black text-green-700 shadow-lg border border-green-100">
                                 <ShieldCheck className="w-3 h-3 mr-1" /> VERIFIED
                              </div>
                           </div>
                        </div>

                        <div className="p-6">
                           <h3 className="font-bold text-green-900 text-xl mb-2">{farmer.name}</h3>
                           
                           {isCurrentEditing ? (
                             <div className="space-y-3">
                               <textarea 
                                 className="w-full p-3 border border-blue-200 rounded-xl text-sm h-28 focus:ring-2 focus:ring-blue-500 outline-none"
                                 value={editBio}
                                 onChange={(e) => setEditBio(e.target.value)}
                               />
                               <Button 
                                 fullWidth 
                                 className="bg-blue-600 hover:bg-blue-700 h-9 text-xs flex items-center justify-center"
                                 onClick={() => saveEdit(farmer)}
                                 disabled={isActionPending}
                               >
                                 {isActionPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                                 Save Changes
                               </Button>
                             </div>
                           ) : (
                             <p className="text-gray-600 italic text-sm leading-relaxed mb-6 line-clamp-4">"{farmer.bio}"</p>
                           )}

                           {!isCurrentEditing && (
                             <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
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

       {/* Interview Section */}
       <section className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-green-100 mb-20 max-w-5xl mx-auto">
          <div className="bg-green-800 p-8 text-white flex flex-col items-center text-center">
             <Quote className="w-12 h-12 text-yellow-400 mb-4 opacity-50" />
             <h2 className="text-3xl font-bold">{t('about_interview_title')}</h2>
             <p className="text-green-200 mt-2 text-sm uppercase tracking-widest font-semibold">Voices from the Field</p>
          </div>
          
          <div className="p-10 lg:p-16 border-b border-gray-100">
             <div className="space-y-10 max-w-3xl mx-auto">
                <div className="bg-green-50 border-l-8 border-green-600 p-6 rounded-xl hover:shadow-md transition-shadow">
                   <p className="font-black text-green-900 text-xs mb-2 uppercase tracking-widest opacity-60 flex items-center">
                      <span className="w-4 h-px bg-green-400 mr-2"></span> Question
                   </p>
                   <p className="font-bold text-gray-900 text-xl mb-4">{t('about_q1')}</p>
                   <p className="text-gray-700 italic text-lg leading-relaxed">"{t('about_a1')}"</p>
                </div>
                <div className="bg-white border-l-8 border-yellow-500 p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                   <p className="font-black text-yellow-600 text-xs mb-2 uppercase tracking-widest opacity-60 flex items-center">
                      <span className="w-4 h-px bg-yellow-400 mr-2"></span> Question
                   </p>
                   <p className="font-bold text-gray-900 text-xl mb-4">{t('about_q2')}</p>
                   <p className="text-gray-700 italic text-lg leading-relaxed">"{t('about_a2')}"</p>
                </div>
                <div className="bg-green-50 border-l-8 border-green-600 p-6 rounded-xl hover:shadow-md transition-shadow">
                   <p className="font-black text-green-900 text-xs mb-2 uppercase tracking-widest opacity-60 flex items-center">
                      <span className="w-4 h-px bg-green-400 mr-2"></span> Question
                   </p>
                   <p className="font-bold text-gray-900 text-xl mb-4">{t('about_q3')}</p>
                   <p className="text-gray-700 italic text-lg leading-relaxed">"{t('about_a3')}"</p>
                </div>
             </div>
          </div>
       </section>
    </div>
  );
};

export default About;
