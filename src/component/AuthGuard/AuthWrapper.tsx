"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/component/Sidebar/Sidebar";
import Header from "@/component/Header/Header";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token && pathname !== "/login") {
            router.push("/login");
        } else {
            setIsAuthenticated(true);
        }
    }, [pathname, router]);

    if (isAuthenticated === null) {
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
