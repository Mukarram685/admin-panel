"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
    const pathname = usePathname();
    const [userRole, setUserRole] = useState<string>("superadmin"); // Default fallback or state

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserRole(user.role || "superadmin");
            } catch (e) {
                console.error("Failed to parse user from localStorage");
            }
        }
    }, []);

    const navItems = [
        { 
            label: "Dashboard", 
            path: "/", 
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> 
        },
        { 
            label: "Companies", 
            path: "/companies", 
            roles: ["superadmin"],
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M9 8h1"></path><path d="M9 12h1"></path><path d="M9 16h1"></path><path d="M14 8h1"></path><path d="M14 12h1"></path><path d="M14 16h1"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path></svg> 
        },
        { 
            label: "Operators", 
            path: "/operators", 
            roles: ["superadmin", "companyadmin"],
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> 
        },
        { 
            label: "Buses", 
            path: "/buses", 
            roles: ["superadmin", "companyadmin"],
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="22" height="13" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line><line x1="1" y1="15" x2="23" y2="15"></line></svg> 
        },
        { 
            label: "Routes", 
            path: "/routes", 
            roles: ["superadmin", "companyadmin"],
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg> 
        },
        { 
            label: "Schedules", 
            path: "/schedules", 
            roles: ["superadmin", "companyadmin", "operator"],
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> 
        },
        { 
            label: "Bookings", 
            path: "/bookings", 
            roles: ["superadmin", "companyadmin"],
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> 
        },
    ];

    const visibleItems = navItems.filter(item => {
        if (!item.roles) return true; // Always show items without roles
        return item.roles.includes(userRole);
    });

    if (pathname === "/login") return null;

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                {/* <span className={styles.logoIcon}>B</span> */}
                <span className={styles.logoText}>BookNGo <small>Admin</small></span>
            </div>
            <nav className={styles.nav}>
                {visibleItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`${styles.navItem} ${pathname === item.path ? styles.active : ""
                            }`}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                    </Link>
                ))}
            </nav>
            <div className={styles.footer}>
                <div className={styles.version}>v2.4.0 Premium</div>
            </div>
        </aside>
    );
}

