"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/component/Sidebar/Sidebar";
import Header from "@/component/Header/Header";

import { CompanyFilterProvider } from "@/context/CompanyFilterContext";
import styles from "./AuthWrapper.module.css";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();

    const isRoutePermitted = (user: any, path: string) => {
        const role = user?.role;
        const opType = user?.operatorType;

        if (path === "/login") return true;
        if (role === "superadmin") return true;
        if (role === "companyadmin") {
            return path !== "/companies";
        }
        if (role === "operator") {
            if (path === "/" || path === "/schedules") return true;
            if (opType === "company_manager") {
                return ["/", "/operators", "/buses", "/routes", "/schedules"].includes(path);
            }
            if (opType === "city_manager") {
                return ["/", "/operators", "/schedules"].includes(path);
            }
            // trip_operator
            return ["/", "/schedules"].includes(path);
        }
        return false;
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
                
                if (!isRoutePermitted(user, pathname)) {
                    console.warn(`Unauthorized access attempt to ${pathname} by ${user.role} (${user.operatorType})`);
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
        <CompanyFilterProvider>
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
        </CompanyFilterProvider>
    );
}
