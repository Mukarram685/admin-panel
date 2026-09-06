"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Layers,
    TrendingUp,
    FileSpreadsheet,
    Building2,
    Clock,
    CheckCircle2,
    Users,
    UserCheck,
    UserPlus,
    BusFront,
    Sparkles,
    PlusCircle,
    MapPin,
    Compass,
    CalendarClock,
    CalendarPlus,
    Ticket,
    DollarSign,
    BarChart3,
    Activity,
    LogOut,
    Sliders
} from "lucide-react";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [userRole, setUserRole] = useState<string>("superadmin");

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

    // Contextual menu items based on current page with dedicated icons
    const getContextualItems = () => {
        switch (pathname) {
            case "/":
                return [
                    { label: "Overview", icon: Layers, action: () => router.push("/") },
                    { label: "Analytics", icon: TrendingUp, action: () => router.push("/reports") },
                    { label: "Reports", icon: FileSpreadsheet, action: () => router.push("/reports") },
                ];
            case "/companies":
                return [
                    { label: "All Companies", icon: Building2, action: () => router.push("/companies") },
                    { label: "Pending Approvals", icon: Clock, action: () => router.push("/companies") },
                    { label: "Approved Partners", icon: CheckCircle2, action: () => router.push("/companies") },
                ];
            case "/operators":
                return [
                    { label: "All Operators", icon: Users, action: () => router.push("/operators") },
                    { label: "Active Staff", icon: UserCheck, action: () => router.push("/operators") },
                    { label: "Register Staff", icon: UserPlus, action: () => router.push("/operators") },
                ];
            case "/buses":
                return [
                    { label: "All Fleet", icon: BusFront, action: () => router.push("/buses") },
                    { label: "Luxury / AC", icon: Sparkles, action: () => router.push("/buses") },
                    { label: "Add Bus", icon: PlusCircle, action: () => router.push("/buses") },
                ];
            case "/routes":
                return [
                    { label: "All Routes", icon: MapPin, action: () => router.push("/routes") },
                    { label: "Intercity Paths", icon: Compass, action: () => router.push("/routes") },
                    { label: "Add Route", icon: PlusCircle, action: () => router.push("/routes") },
                ];
            case "/schedules":
                return [
                    { label: "All Schedules", icon: CalendarClock, action: () => router.push("/schedules") },
                    { label: "Today's Trips", icon: Clock, action: () => router.push("/schedules") },
                    { label: "Dispatch Schedule", icon: CalendarPlus, action: () => router.push("/schedules") },
                ];
            case "/bookings":
                return [
                    { label: "All Bookings", icon: Ticket, action: () => router.push("/bookings") },
                    { label: "Revenue Aggregates", icon: DollarSign, action: () => router.push("/bookings") },
                ];
            case "/reports":
                return [
                    { label: "Revenue Overview", icon: DollarSign, action: () => router.push("/reports") },
                    { label: "Booking Insights", icon: BarChart3, action: () => router.push("/reports") },
                    { label: "Fleet Metrics", icon: TrendingUp, action: () => router.push("/reports") },
                ];
            default:
                return [
                    { label: "Overview", icon: Layers, action: () => router.push("/") },
                    { label: "Settings", icon: Sliders, action: () => router.push("/") },
                ];
        }
    };

    const contextualItems = getContextualItems();

    if (pathname === "/login") return null;

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <aside className={styles.sidebar}>
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
    );
}
