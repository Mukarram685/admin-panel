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
    };

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const userStr = localStorage.getItem("user");
        
        if (!token && pathname !== "/login") {
            router.push("/login");
            return;
        }

        if (token && userStr) {
            const user = JSON.parse(userStr);
            const allowedRoles = routePermissions[pathname];
            
            if (allowedRoles && !allowedRoles.includes(user.role)) {
                console.warn(`Unauthorized access attempt to ${pathname} by ${user.role}`);
                router.push("/");
                return;
            }
            setIsAuthenticated(true);
        } else if (pathname === "/login") {
            setIsAuthenticated(false);
        } else {
            router.push("/login");
        }
    }, [pathname, router]);

    if (isAuthenticated === null && pathname !== "/login") {
        // Prevents UI flicker while checking authentication state
        return <div style={{ height: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)", color: "white" }}>Authenticating...</div>;
    }

    // If on login page, just render children without sidebar/header
    if (pathname === "/login") {
        return <>{children}</>;
    }

    // Render full dashboard layout
    return (
        <>
            <Sidebar />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", marginLeft: "var(--sidebar-width)" }}>
                <Header />
                <main style={{ flex: 1, padding: "32px", marginTop: "var(--header-height)", overflowY: "auto" }}>
                    {children}
                </main>
            </div>
        </>
    );
}
