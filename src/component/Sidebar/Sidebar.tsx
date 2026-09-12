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
    Layers,
    TrendingUp,
    FileSpreadsheet,
    Clock,
    CheckCircle2,
    Users,
    UserCheck,
    UserPlus,
    Sparkles,
    PlusCircle,
    Compass,
    CalendarPlus,
    DollarSign,
    Activity,
    LogOut,
    Sliders,
    X,
    ShieldCheck
} from "lucide-react";
import styles from "./Sidebar.module.css";

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
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

    // Main navigation items for mobile drawer
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

    const visibleNavItems = navItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    });

    // Contextual menu items based on current page with dedicated icons
    const getContextualItems = () => {
        switch (pathname) {
            case "/":
                return [
                    { label: "Overview", icon: Layers, action: () => navigate("/") },
                    { label: "Analytics", icon: TrendingUp, action: () => navigate("/reports") },
                    { label: "Reports", icon: FileSpreadsheet, action: () => navigate("/reports") },
                ];
            case "/companies":
                return [
                    { label: "All Companies", icon: Building2, action: () => navigate("/companies") },
                    { label: "Pending Approvals", icon: Clock, action: () => navigate("/companies") },
                    { label: "Approved Partners", icon: CheckCircle2, action: () => navigate("/companies") },
                ];
            case "/operators":
                return [
                    { label: "All Operators", icon: Users, action: () => navigate("/operators") },
                    { label: "Active Staff", icon: UserCheck, action: () => navigate("/operators") },
                    { label: "Register Staff", icon: UserPlus, action: () => navigate("/operators") },
                ];
            case "/buses":
                return [
                    { label: "All Fleet", icon: BusFront, action: () => navigate("/buses") },
                    { label: "Luxury / AC", icon: Sparkles, action: () => navigate("/buses") },
                    { label: "Add Bus", icon: PlusCircle, action: () => navigate("/buses") },
                ];
            case "/routes":
                return [
                    { label: "All Routes", icon: MapPin, action: () => navigate("/routes") },
                    { label: "Intercity Paths", icon: Compass, action: () => navigate("/routes") },
                    { label: "Add Route", icon: PlusCircle, action: () => navigate("/routes") },
                ];
            case "/schedules":
                return [
                    { label: "All Schedules", icon: CalendarClock, action: () => navigate("/schedules") },
                    { label: "Today's Trips", icon: Clock, action: () => navigate("/schedules") },
                    { label: "Dispatch Schedule", icon: CalendarPlus, action: () => navigate("/schedules") },
                ];
            case "/bookings":
                return [
                    { label: "All Bookings", icon: Ticket, action: () => navigate("/bookings") },
                    { label: "Revenue Aggregates", icon: DollarSign, action: () => navigate("/bookings") },
                ];
            case "/reports":
                return [
                    { label: "Revenue Overview", icon: DollarSign, action: () => navigate("/reports") },
                    { label: "Booking Insights", icon: BarChart3, action: () => navigate("/reports") },
                    { label: "Fleet Metrics", icon: TrendingUp, action: () => navigate("/reports") },
                ];
            default:
                return [
                    { label: "Overview", icon: Layers, action: () => navigate("/") },
                    { label: "Settings", icon: Sliders, action: () => navigate("/") },
                ];
        }
    };

    const navigate = (path: string) => {
        router.push(path);
        onClose?.();
    };

    const contextualItems = getContextualItems();

    if (pathname === "/login") return null;

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        onClose?.();
        router.push("/login");
    };

    return (
        <>
            {isOpen && <div className={styles.backdrop} onClick={onClose} aria-label="Close menu backdrop" />}
            
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                {/* Mobile Header */}
                <div className={styles.mobileHeader}>
                    <div className={styles.mobileLogo} onClick={() => navigate("/")} role="button" tabIndex={0}>
                        <div className={styles.mobileLogoIcon}>
                            <BusFront size={16} />
                        </div>
                        <span className={styles.mobileLogoText}>BookNGo</span>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn} aria-label="Close sidebar">
                        <X size={18} />
                    </button>
                </div>

                {/* Mobile User Profile */}
                <div className={styles.mobileUserCard}>
                    <div className={styles.mobileAvatar}>
                        {userName ? userName.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div className={styles.mobileUserInfo}>
                        <span className={styles.mobileUserName}>{userName}</span>
                        <span className={styles.mobileUserRole}>
                            <ShieldCheck size={11} />
                            {userRole}
                        </span>
                    </div>
                </div>

                {/* Mobile Main Navigation */}
                <div className={styles.mobileNavSection}>
                    <h4 className={styles.sectionTitle}>Main Navigation</h4>
                    {visibleNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}
                            >
                                <span className={styles.iconContainer}>
                                    <Icon size={14} />
                                </span>
                                <span className={styles.itemLabel}>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Contextual Quick Actions */}
                <div className={styles.header}>
                    <div className={styles.headerIcon}>
                        <Sliders size={13} />
                    </div>
                    <h3 className={styles.title}>Quick Actions</h3>
                </div>
                
                <nav className={styles.nav}>
                    {contextualItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={index}
                                onClick={item.action}
                                className={styles.navItem}
                                title={item.label}
                            >
                                <span className={styles.iconContainer}>
                                    <Icon size={14} />
                                </span>
                                <span className={styles.itemLabel}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className={styles.footer}>
                    <div className={styles.statusIndicator}>
                        <span className={styles.statusDot}></span>
                        <span className={styles.statusText}>System Live</span>
                        <Activity size={12} className={styles.activityIcon} />
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
                        <LogOut size={13} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
