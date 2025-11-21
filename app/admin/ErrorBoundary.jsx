"use client";
import { Component } from "react";

export class AdminErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Admin Error Boundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-wawag-cream flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-black text-wawag-dark mb-2">發生錯誤</h1>
                        <p className="text-gray-600 mb-4">後台載入時發生問題</p>
                        <details className="text-left bg-gray-50 p-4 rounded-xl mb-4">
                            <summary className="cursor-pointer font-bold text-sm text-gray-700">錯誤詳情</summary>
                            <pre className="text-xs mt-2 text-red-600 overflow-auto">
                                {this.state.error?.toString()}
                            </pre>
                        </details>
                        <button
                            onClick={() => window.location.href = "/dashboard"}
                            className="bg-wawag-pink text-white px-6 py-3 rounded-xl font-bold hover:bg-pink-400 transition-colors"
                        >
                            返回前台
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
