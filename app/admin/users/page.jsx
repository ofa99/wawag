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
                // In a real app, we'd get the token here. For this phase, we send the email header.
                const res = await fetch("/api/admin/get-users", {
                    headers: {
                        "x-admin-email": user?.email || "" // Use real admin email
                    }
                });

                if (!res.ok) throw new Error("Failed to fetch users");

                const data = await res.json();
                setUsers(data.users || []);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load members");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchUsers();
        } else {
            // Allow fetching even if user context is slow for dev, or handle redirect
            fetchUsers();
        }
    }, [user]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newMember, setNewMember] = useState({ name: "", email: "", password: "" });

    const handleAddMember = async (e) => {
        e.preventDefault();
        toast.loading("Creating member...", { id: "create-member" });

        try {
            const res = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-email": user?.email || ""
                },
                body: JSON.stringify({
                    name: newMember.name,
                    email: newMember.email,
                    password: newMember.password
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Member created successfully! 🎉", { id: "create-member" });
                setShowAddModal(false);
                setNewMember({ name: "", email: "", password: "" });

                // Refresh user list
                fetchUsers();
            } else {
                toast.error(data.error || "Failed to create member", { id: "create-member" });
            }
        } catch (error) {
            console.error("Create member error:", error);
            toast.error("Failed to create member", { id: "create-member" });
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            <h2 className="text-2xl font-black text-wawag-dark mb-4">Add New Member 👤</h2>
                            <p className="text-xs text-gray-500 mb-4 bg-blue-50 p-2 rounded border border-blue-200">
                                ℹ️ This will create a real Firebase Authentication account. The user can login immediately with the provided credentials.
                            </p>
                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Display Name</label>
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
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Default Password</label>
                                    <Input
                                        type="password"
                                        value={newMember.password}
                                        onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                                        placeholder="Optional"
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowAddModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-wawag-blue text-white hover:bg-blue-400"
                                    >
                                        Add Member
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-wawag-dark">Members 👥</h2>
                    <p className="text-gray-500 font-medium">Manage your community members</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" className="text-sm">Export CSV</Button>
                    <Button className="text-sm" onClick={() => setShowAddModal(true)}>Add Member</Button>
                </div>
            </header>

            <Card className="bg-white/80 border-white/50 backdrop-blur-xl shadow-xl">
                <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by name or email..."
                            className="bg-white border-gray-100"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">Filter</Button>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">
                            Loading members... ⏳
                        </div>
                    ) : (
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-wawag-cream text-gray-500 text-xs uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="p-4">Member</th>
                                    <th className="p-4">Level</th>
                                    <th className="p-4">Points</th>
                                    <th className="p-4">Monthly Gift</th>
                                    <th className="p-4 text-right">Actions</th>
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
                                            <div className="font-mono font-bold text-wawag-pink text-lg">
                                                {u.points.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {u.monthlyGiftClaimedAt ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">
                                                    ✅ Claimed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                                                    ⏳ Pending
                                                </span>
                                            )}
                                            {u.monthlyGiftClaimedAt && (
                                                <div className="text-[10px] text-gray-400 mt-1">
                                                    {new Date(u.monthlyGiftClaimedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" className="text-xs h-8 px-3 text-gray-400 hover:text-wawag-blue hover:bg-blue-50">
                                                Edit
                                            </Button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!loading && filteredUsers.length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                            No members found matching "{searchTerm}"
                        </div>
                    )}
                </div>

                <div className="mt-4 text-center text-xs text-gray-400">
                    Showing {filteredUsers.length} members
                </div>
            </Card>
        </div>
    );
}
