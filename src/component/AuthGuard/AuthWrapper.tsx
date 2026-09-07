"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/component/Sidebar/Sidebar";
import Header from "@/component/Header/Header";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
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
            <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", justifyContent: "center", background: "var(--background)", color: "var(--text-muted)" }}>
                <div style={{ width: "36px", height: "36px", border: "3px solid rgba(255, 255, 255, 0.1)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.02em" }}>Verifying session...</span>
            </div>
        );
    }

    // If on login page, just render children without sidebar/header
    if (pathname === "/login") {
        return <>{children}</>;
    }

    // Render full dashboard layout
    return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
            <Header />
            <div style={{ display: "flex", marginTop: "var(--header-height)", flex: 1, width: "100%", minWidth: 0, minHeight: "calc(100vh - var(--header-height))" }}>
                <Sidebar />
                <main style={{ flex: 1, minWidth: 0, width: "calc(100% - var(--sidebar-width))", maxWidth: "calc(100% - var(--sidebar-width))", padding: "24px 28px", boxSizing: "border-box", overflowY: "auto", overflowX: "hidden" }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
