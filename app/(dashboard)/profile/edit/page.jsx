"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function EditProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [profileData, setProfileData] = useState({
        displayName: "",
        photoURL: "",
        phone: "",
        lineId: ""
    });

    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.uid) return;

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setProfileData({
                        displayName: data.displayName || "",
                        photoURL: data.photoURL || data.avatar || "",
                        phone: data.phone || "",
                        lineId: data.lineId || ""
                    });
                    setPreviewUrl(data.photoURL || data.avatar || "");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                toast.error("載入個人資料失敗");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            let photoURL = profileData.photoURL;

            // Upload image if selected
            if (selectedImage) {
                setUploading(true);
                const storage = getStorage();
                const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
                await uploadBytes(storageRef, selectedImage);
                photoURL = await getDownloadURL(storageRef);
                setUploading(false);
            }

            // Update profile via API
            const token = await user.getIdToken();
            const res = await fetch("/api/update-profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    displayName: profileData.displayName,
                    photoURL,
                    phone: profileData.phone,
                    lineId: profileData.lineId
                })
            });

            if (res.ok) {
                toast.success("個人資料已更新！");
                router.push("/dashboard");
            } else {
                const data = await res.json();
                toast.error(data.error || "更新失敗");
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("發生錯誤");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-wawag-cream flex items-center justify-center">
                <div className="text-gray-400">載入中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-wawag-cream pb-24">
            <header className="bg-wawag-pink p-6 rounded-b-4xl shadow-lg">
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => router.back()}
                        className="bg-white/20 hover:bg-white/30 text-white border border-white/50 rounded-xl p-2 backdrop-blur-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Button>
                    <h1 className="text-2xl font-black text-white">編輯個人資料</h1>
                </div>
            </header>

            <div className="p-4 -mt-6 relative z-10 max-w-md mx-auto">
                <Card className="bg-white/90 backdrop-blur-md border-white shadow-xl">
                    <form onSubmit={handleSave} className="p-6 space-y-6">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="w-32 h-32 rounded-full border-4 border-wawag-pink shadow-lg overflow-hidden bg-gray-100 cursor-pointer"
                                    onClick={() => document.getElementById('avatar-upload').click()}
                                >
                                    <img
                                        src={previewUrl || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user?.uid}`}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => document.getElementById('avatar-upload').click()}
                                    className="absolute bottom-0 right-0 bg-wawag-blue text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-400 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </motion.button>
                            </div>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            <p className="text-xs text-gray-400 mt-2">點擊頭像更換照片</p>
                        </div>

                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">顯示名稱</label>
                            <Input
                                required
                                value={profileData.displayName}
                                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                placeholder="請輸入您的名稱"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">電話號碼</label>
                            <Input
                                type="tel"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                placeholder="0912-345-678"
                            />
                        </div>

                        {/* LINE ID */}
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">LINE 帳號</label>
                            <Input
                                value={profileData.lineId}
                                onChange={(e) => setProfileData({ ...profileData, lineId: e.target.value })}
                                placeholder="your_line_id"
                            />
                        </div>

                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Email</label>
                            <Input
                                disabled
                                value={user?.email || ""}
                                className="bg-gray-100 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1 ml-1">Email 無法修改</p>
                        </div>

                        {/* Save Button */}
                        <Button
                            type="submit"
                            disabled={saving || uploading}
                            className="w-full bg-wawag-pink text-white hover:bg-pink-400 shadow-lg shadow-wawag-pink/30"
                        >
                            {uploading ? "上傳圖片中..." : saving ? "儲存中..." : "儲存變更"}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
