"use client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export default function AdminPointsPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    // Assuming these new states are intended to be added for the new handleUpdatePoints logic
    const [selectedUser, setSelectedUser] = useState(null);
    const [pointsAmount, setPointsAmount] = useState("");
    const [showModal, setShowModal] = useState(false);


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

    const handleUpdatePoints = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;

        const amount = parseInt(pointsAmount);
        if (isNaN(amount) || amount === 0) {
            toast.error("請輸入有效的點數");
            return;
        }

        // Optimistic Update
        const oldUsers = [...users];
        setUsers(users.map(u => {
            if (u.uid === selectedUser.uid) {
                return { ...u, points: (u.points || 0) + amount };
            }
            return u;
        }));

        setShowModal(false);
        toast.loading("更新點數中...", { id: "update-points" });

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/update-points", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: selectedUser.uid,
                    amount: amount
                })
            });

            if (res.ok) {
                toast.success("點數更新成功！✨", { id: "update-points" });
                // Refresh to get exact server state
                const refreshRes = await fetch("/api/admin/get-users", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const refreshData = await refreshRes.json();
                setUsers(refreshData.users || []);
            } else {
                throw new Error("Update failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("更新失敗，還原變更", { id: "update-points" });
            setUsers(oldUsers); // Revert
        }
    };

    const filteredUsers = users.filter(u =>
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-wawag-dark">點數紀錄 📊</h2>
                    <p className="text-gray-500 font-medium">手動管理使用者點數</p>
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
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">
                            載入點數資料... ⏳
                        </div>
                    ) : (
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-wawag-cream text-gray-500 text-xs uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="p-4">會員</th>
                                    <th className="p-4">目前點數</th>
                                    <th className="p-4 text-center">增加點數</th>
                                    <th className="p-4 text-center">扣除點數</th>
                                    <th className="p-4 text-right">最後更新</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((u) => (
                                    <motion.tr
                                        key={u.uid}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-blue-50/30 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                                                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">{u.name}</div>
                                                    <div className="text-xs text-gray-400">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-mono font-bold text-wawag-pink text-lg">
                                                {(u.points || 0).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    onClick={() => handleAdjustPoints(u.uid, 50)}
                                                    className="bg-green-100 text-green-600 hover:bg-green-200 shadow-none h-8 px-3 text-xs"
                                                >
                                                    +50
                                                </Button>
                                                <Button
                                                    onClick={() => handleAdjustPoints(u.uid, 100)}
                                                    className="bg-green-100 text-green-600 hover:bg-green-200 shadow-none h-8 px-3 text-xs"
                                                >
                                                    +100
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    onClick={() => handleAdjustPoints(u.uid, -50)}
                                                    className="bg-red-100 text-red-500 hover:bg-red-200 shadow-none h-8 px-3 text-xs"
                                                >
                                                    -50
                                                </Button>
                                                <Button
                                                    onClick={() => handleAdjustPoints(u.uid, -100)}
                                                    className="bg-red-100 text-red-500 hover:bg-red-200 shadow-none h-8 px-3 text-xs"
                                                >
                                                    -100
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-xs text-gray-400 font-mono">
                                                {u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : "-"}
                                            </div>
                                            <div className="text-[10px] text-gray-300">
                                                {u.updatedAt ? new Date(u.updatedAt).toLocaleTimeString() : ""}
                                            </div>
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
            </Card>
        </div>
    );
}
