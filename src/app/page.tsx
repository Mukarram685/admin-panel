"use client";
import { useEffect, useState } from "react";
import DashboardCard from "@/component/DashboardCard/DashboardCard";
import { fetchAPI } from "@/utils/api";
import styles from "./page.module.css";

export default function Home() {
  const [stats, setStats] = useState({
    bookings: 0,
    revenue: 0,
    buses: 0,
    routes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.name || "Admin");
        }

        const [bookingsRes, busesRes, routesRes] = await Promise.all([
          fetchAPI("/bookings/company/all").catch(() => ({ data: [] })),
          fetchAPI("/buses/company").catch(() => ({ buses: [] })),
          fetchAPI("/routes/allRoutes").catch(() => ({ routes: [] })),
        ]);

        const bookingsList = bookingsRes.data || [];
        const busesList = busesRes.buses || busesRes.data || [];
        const routesList = routesRes.data || routesRes.routes || [];

        // Calculate total amount to be sent to company (Net Revenue)
        const totalRev = bookingsList.reduce((acc: number, b: any) => {
            if (b.status === 'cancelled') return acc; // Skip cancelled bookings or handle refund logic
            return acc + (b.totalAmount || 0) - (b.refundAmount || 0);
        }, 0);

        setStats({
          bookings: bookingsList.filter((b: any) => b.status !== 'cancelled').length,
          revenue: totalRev,
          buses: busesList.length,
          routes: routesList.length,
        });

      } catch (err: any) {
        setError(err.message || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Company Analytics</h1>
        <p className={styles.subtitle}>Consolidated summary of bookings and earnings.</p>
        {error && <p className={styles.error}>{error}</p>}
      </header>

      {loading ? (
        <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Gathering financial data...</p>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.grid}>
            <DashboardCard 
                title="Total Bookings" 
                value={stats.bookings.toString()} 
                trend="Confirmed Trips" 
                trendType="up"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
            />
            <DashboardCard 
                title="Total Payout Amount" 
                value={`Rs ${stats.revenue.toLocaleString()}`} 
                trend="To be sent to company" 
                trendType="up"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
            />
            <DashboardCard 
                title="Operational Fleet" 
                value={stats.buses.toString()} 
                trend="Active Buses" 
                trendType="up"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="22" height="13" rx="2" ry="2"></rect><path d="M7 21h0"></path><path d="M17 21h0"></path><path d="M4 17h0"></path><path d="M20 17h0"></path></svg>}
            />
          </div>

          <div className={`glass glass-card ${styles.summaryBox}`}>
                <div className={styles.summaryContent}>
                    <h3>Data Privacy Notice</h3>
                    <p>Detailed passenger and operator information is restricted to protect privacy. Only consolidated volumes and financial metrics are displayed on this dashboard.</p>
                </div>
          </div>
        </div>
      )}
    </main>
  );
}

