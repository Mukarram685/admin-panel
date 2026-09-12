"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/component/Sidebar/Sidebar";
import Header from "@/component/Header/Header";

import styles from "./AuthWrapper.module.css";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();

    const routePermissions: Record<string, string[]> = {
        "/": ["superadmin", "companyadmin", "operator"],
        "/companies": ["superadmin"],
        "/operators": ["superadmin", "companyadmin"],
        "/buses": ["superadmin", "companyadmin"],
        "/routes": ["superadmin", "companyadmin"],
        "/schedules": ["superadmin", "companyadmin", "operator"],
        "/bookings": ["superadmin", "companyadmin"],
        "/reports": ["superadmin", "companyadmin"],
    };

    useEffect(() => {
        // Auto-close mobile drawer on route navigation
        setSidebarOpen(false);

        const token = localStorage.getItem("accessToken");
        const userStr = localStorage.getItem("user");
        
        if (!token && pathname !== "/login") {
            router.push("/login");
            return;
        }

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                const allowedRoles = routePermissions[pathname];
                
                if (allowedRoles && !allowedRoles.includes(user.role)) {
                    console.warn(`Unauthorized access attempt to ${pathname} by ${user.role}`);
                    router.push("/");
                    return;
                }
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Failed to parse user data from localStorage:", error);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                router.push("/login");
            }
        } else if (pathname === "/login") {
            setIsAuthenticated(false);
        } else {
            router.push("/login");
        }
    }, [pathname, router]);

    if (isAuthenticated === null && pathname !== "/login") {
        // Prevents UI flicker while checking authentication state
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner} />
                <span className={styles.loadingText}>Verifying session...</span>
            </div>
        );
    }

    // If on login page, just render children without sidebar/header
    if (pathname === "/login") {
        return <>{children}</>;
    }

    // Render full responsive dashboard layout
    return (
        <div className={styles.container}>
            <Header 
                isSidebarOpen={sidebarOpen} 
                onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
            />
            <div className={styles.layoutBody}>
                <Sidebar 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)} 
                />
                <main className={styles.main}>
                    {children}
                </main>
            </div>
        </div>
    );
}
