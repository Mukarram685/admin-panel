"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Building2,
    UserCog,
    BusFront,
    MapPin,
    CalendarClock,
    Ticket,
    BarChart3,
    Search,
    LogOut,
    ShieldCheck,
    Menu,
    X
} from "lucide-react";
import styles from "./Header.module.css";

interface HeaderProps {
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
}

export default function Header({ isSidebarOpen = false, onToggleSidebar }: HeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [userRole, setUserRole] = useState<string>("superadmin");
    const [userName, setUserName] = useState<string>("Admin");

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserRole(user.role || "superadmin");
                setUserName(user.name || "Admin");
            } catch (e) {
                console.error("Failed to parse user from localStorage");
            }
        }
    }, []);

    const navItems = [
        { 
            label: "Dashboard", 
            path: "/", 
            icon: LayoutDashboard,
            roles: ["superadmin", "companyadmin", "operator"]
        },
        { 
            label: "Companies", 
            path: "/companies", 
            icon: Building2,
            roles: ["superadmin"]
        },
        { 
            label: "Operators", 
            path: "/operators", 
            icon: UserCog,
            roles: ["superadmin", "companyadmin"]
        },
        { 
            label: "Buses", 
            path: "/buses", 
            icon: BusFront,
            roles: ["superadmin", "companyadmin"]
        },
        { 
            label: "Routes", 
            path: "/routes", 
            icon: MapPin,
            roles: ["superadmin", "companyadmin"]
        },
        { 
            label: "Schedules", 
            path: "/schedules", 
            icon: CalendarClock,
            roles: ["superadmin", "companyadmin", "operator"]
        },
        { 
            label: "Bookings", 
            path: "/bookings", 
            icon: Ticket,
            roles: ["superadmin", "companyadmin"]
        },
        { 
            label: "Reports", 
            path: "/reports", 
            icon: BarChart3,
            roles: ["superadmin", "companyadmin"]
        },
    ];

    const visibleItems = navItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    });

    if (pathname === "/login") return null;

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <header className={styles.header}>
            <div className={styles.leftSection}>
                <button
                    className={styles.hamburgerBtn}
                    onClick={onToggleSidebar}
                    aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                    title={isSidebarOpen ? "Close menu" : "Open menu"}
                >
                    {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </button>

                <div className={styles.logo} onClick={() => router.push("/")} role="button" tabIndex={0}>
                    <div className={styles.logoIconBox}>
                        <BusFront size={18} />
                    </div>
                    <span className={styles.logoText}>BookNGo</span>
                </div>
            </div>
            
            <nav className={styles.nav}>
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            title={item.label}
                        >
                            <Icon size={15} className={styles.navIcon} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className={styles.rightSection}>
                <div className={styles.searchContainer}>
                    <Search size={15} className={styles.searchIcon} />
                    <input type="text" placeholder="Search operations..." className={styles.search} />
                </div>
                
                <div className={styles.profile}>
                    <div className={styles.avatar} title={userName}>
                        {userName ? userName.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{userName}</span>
                        <span className={styles.userRole}>
                            <ShieldCheck size={11} />
                            {userRole}
                        </span>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn} title="Sign out of panel">
                        <LogOut size={14} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
