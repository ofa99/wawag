"use client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

export default function AdminUsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                if (!user) return;
                const token = await user.getIdToken();

                const res = await fetch("/api/admin/get-users", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error("Failed to fetch users");

                const data = await res.json();
                setUsers(data.users || []);
            } catch (error) {
                console.error(error);
                toast.error("載入會員失敗");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchUsers();
        }
    }, [user]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newMember, setNewMember] = useState({ name: "", email: "", password: "" });

    const handleAddMember = async (e) => {
        e.preventDefault();
        toast.loading("建立會員中...", { id: "create-member" });

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newMember.name,
                    email: newMember.email,
                    password: newMember.password
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("會員建立成功！🎉", { id: "create-member" });
                setShowAddModal(false);
                setNewMember({ name: "", email: "", password: "" });

                // Refresh user list
                const token = await user.getIdToken();
                const refreshRes = await fetch("/api/admin/get-users", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const refreshData = await refreshRes.json();
                setUsers(refreshData.users || []);
            } else {
                toast.error(data.error || "建立會員失敗", { id: "create-member" });
            }
        } catch (error) {
            console.error("Create member error:", error);
            toast.error("建立會員失敗", { id: "create-member" });
        }
    };

    const handleToggleAdmin = async (userId, currentStatus) => {
        const newStatus = !currentStatus;
        const toastId = toast.loading("更新權限中...");

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/update-role", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    isAdmin: newStatus
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`已${newStatus ? "設為" : "移除"}管理員`, { id: toastId });
                // Update local state
                setUsers(users.map(u =>
                    u.uid === userId ? { ...u, isAdmin: newStatus } : u
                ));
            } else {
                toast.error(data.error || "更新失敗", { id: toastId });
            }
        } catch (error) {
            console.error("Update role error:", error);
            toast.error("更新失敗", { id: toastId });
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setShowEditModal(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        // For now, we only support toggling admin in edit modal as per request
        // But we can easily extend to name editing if API supports it.
        // Since update-role only updates role, let's just use that for now.
        // If we want to update name, we need another API or update update-role to be generic update-user.
        // Let's stick to the requested "promote to admin" feature.

        if (editingUser.isAdmin !== editingUser.originalIsAdmin) {
            await handleToggleAdmin(editingUser.uid, !editingUser.isAdmin);
        }
        setShowEditModal(false);
    };

    const handleExportCSV = () => {
        const headers = ["UID", "顯示名稱", "Email", "電話號碼", "LINE 帳號", "等級", "點數", "是否為管理員", "建立時間"];
        const rows = users.map(u => [
            u.uid,
            u.name || "",
            u.email || "",
            u.phone || "",
            u.lineId || "",
            u.level,
            u.points,
            u.isAdmin ? "是" : "否",
            u.createdAt ? new Date(u.createdAt).toLocaleString() : ""
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredUsers = users.filter(u => {
        if (!u) return false; // Skip if user is null/undefined
        const email = (u.email || "").toLowerCase();
        const name = (u.name || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        return email.includes(search) || name.includes(search);
    });

    return (
        <div className="space-y-6 relative">
            {/* Add Member Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-black text-wawag-dark mb-4">新增會員 👤</h2>
                            <p className="text-xs text-gray-500 mb-4 bg-blue-50 p-2 rounded border border-blue-200">
                                ℹ️ 這將建立一個真實的 Firebase 帳戶。使用者可以使用提供的憑證立即登入。
                            </p>
                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">顯示名稱</label>
                                    <Input
                                        required
                                        value={newMember.name}
                                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                        placeholder="e.g. Allen Lu"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Email</label>
                                    <Input
                                        type="email"
                                        required
                                        value={newMember.email}
                                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">預設密碼</label>
                                    <Input
                                        type="password"
                                        value={newMember.password}
                                        onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                                        placeholder="選填"
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowAddModal(false)}
                                    >
                                        取消
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-wawag-blue text-white hover:bg-blue-400"
                                    >
                                        新增會員
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-wawag-dark">會員列表 👥</h2>
                    <p className="text-gray-500 font-medium">管理您的社群會員</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" className="text-sm" onClick={handleExportCSV}>匯出 CSV</Button>
                    <Button className="text-sm" onClick={() => setShowAddModal(true)}>新增會員</Button>
                </div>
            </header>

            <Card className="bg-white/80 border-white/50 backdrop-blur-xl shadow-xl">
                <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                        <Input
                            placeholder="搜尋姓名或 Email..."
                            className="bg-white border-gray-100"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">篩選</Button>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">
                            載入會員中... ⏳
                        </div>
                    ) : (
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-wawag-cream text-gray-500 text-xs uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="p-4">會員</th>
                                    <th className="p-4">等級</th>
                                    <th className="p-4">權限</th>
                                    <th className="p-4">點數</th>
                                    <th className="p-4">每月禮物</th>
                                    <th className="p-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((u) => (
                                    <motion.tr
                                        key={u.uid}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-blue-50/30 transition-colors group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                                                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">{u.name}</div>
                                                    <div className="text-xs text-gray-400">{u.email}</div>
                                                    {(u.phone || u.lineId) && (
                                                        <div className="text-[10px] text-gray-500 mt-0.5 flex gap-2">
                                                            {u.phone && <span>📱 {u.phone}</span>}
                                                            {u.lineId && <span>💬 {u.lineId}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`
                                                px-3 py-1 rounded-full text-xs font-black border
                                                ${u.level >= 7 ? 'bg-wawag-purple-light text-wawag-purple border-wawag-purple/20' : 'bg-wawag-blue-light text-wawag-blue border-wawag-blue/20'}
                                            `}>
                                                LV.{u.level}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={u.isAdmin || false}
                                                    onChange={() => handleToggleAdmin(u.uid, u.isAdmin)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wawag-blue"></div>
                                                <span className="ml-2 text-xs font-medium text-gray-900">
                                                    {u.isAdmin ? "管理員" : "會員"}
                                                </span>
                                            </label>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-mono font-bold text-wawag-pink text-lg">
                                                {u.points.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {u.monthlyGiftClaimedAt ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">
                                                    ✅ 已領取
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                                                    ⏳ 未領取
                                                </span>
                                            )}
                                            {u.monthlyGiftClaimedAt && (
                                                <div className="text-[10px] text-gray-400 mt-1">
                                                    {new Date(u.monthlyGiftClaimedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                variant="ghost"
                                                className="text-xs h-8 px-3 text-gray-400 hover:text-wawag-blue hover:bg-blue-50"
                                                onClick={() => handleEditUser({ ...u, originalIsAdmin: u.isAdmin })}
                                            >
                                                編輯
                                            </Button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!loading && filteredUsers.length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                            找不到符合 "{searchTerm}" 的會員
                        </div>
                    )}
                </div>

                <div className="mt-4 text-center text-xs text-gray-400">
                    顯示 {filteredUsers.length} 位會員
                </div>
            </Card>

            {/* Edit User Modal */}
            <AnimatePresence>
                {showEditModal && editingUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-black text-wawag-dark mb-4">編輯會員 ✏️</h2>
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">顯示名稱</label>
                                    <Input
                                        disabled
                                        value={editingUser.name}
                                        className="bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Email</label>
                                    <Input
                                        disabled
                                        value={editingUser.email}
                                        className="bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">電話號碼</label>
                                    <Input
                                        disabled
                                        value={editingUser.phone || "未填寫"}
                                        className="bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">LINE 帳號</label>
                                    <Input
                                        disabled
                                        value={editingUser.lineId || "未填寫"}
                                        className="bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <span className="font-bold text-gray-700">管理員權限</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={editingUser.isAdmin || false}
                                            onChange={(e) => setEditingUser({ ...editingUser, isAdmin: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wawag-blue"></div>
                                    </label>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        取消
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-wawag-blue text-white hover:bg-blue-400"
                                    >
                                        儲存變更
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
