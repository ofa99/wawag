"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user); // Store the full Firebase User object
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {loading ? (
                <div className="flex items-center justify-center min-h-screen bg-wawag-pink/10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wawag-pink"></div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
