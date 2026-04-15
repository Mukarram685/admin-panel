"use client";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/utils/api";
import DashboardCard from "@/component/DashboardCard/DashboardCard";

export default function BookingsPage() {
    const [stats, setStats] = useState({
        count: 0,
        amount: 0
    });
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetchAPI("/bookings/company/all");
            const bookings = res.data || res.bookings || [];
            
            const activeBookings = bookings.filter((b: any) => b.status !== 'cancelled');
            const totalAmount = activeBookings.reduce((acc: number, b: any) => acc + (b.totalAmount || 0) - (b.refundAmount || 0), 0);

            setStats({
                count: activeBookings.length,
                amount: totalAmount
            });
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <main className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Bookings Summary</h1>
                    <p className="page-subtitle">Consolidated operational metrics without individual data access.</p>
                </div>
            </header>

            {loading ? (
                <div className="loading-state">
                    <p>Loading summary data...</p>
                </div>
            ) : (
                <div className="summary-grid">
                    <DashboardCard 
                        title="Total Active Bookings" 
                        value={stats.count.toString()} 
                        trend="Net Volume" 
                        trendType="up"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
                    />
                    <DashboardCard 
                        title="Total Payout Amount" 
                        value={`Rs ${stats.amount.toLocaleString()}`} 
                        trend="To be sent to company" 
                        trendType="up"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
                    />
                </div>
            )}

            <div className="privacy-notice">
                <div className="privacy-icon">🔒</div>
                <div className="privacy-text">
                    <h3>Data Privacy Enforcement</h3>
                    <p>
                        In accordance with your privacy settings, individual passenger details and transaction identifiers 
                        are hidden from this management panel. You are viewing consolidated company-wide aggregates only.
                    </p>
                </div>
            </div>

            <style jsx>{`
                .page-container { padding: 40px; }
                .page-header { margin-bottom: 40px; }
                .page-title { font-size: 36px; font-weight: 800; margin: 0; color: #f8fafc; letter-spacing: -0.025em; }
                .page-subtitle { color: #94a3b8; margin: 8px 0 0 0; font-size: 16px; }
                
                .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; list-style: none; padding: 0; }
                
                .loading-state { padding: 80px; text-align: center; color: #64748b; font-size: 18px; }

                .privacy-notice {
                    margin-top: 48px;
                    padding: 32px;
                    border-radius: 24px;
                    background: rgba(59, 130, 246, 0.05);
                    border: 1px solid rgba(59, 130, 246, 0.1);
                    display: flex;
                    gap: 24px;
                    align-items: flex-start;
                    backdrop-filter: blur(10px);
                }
                .privacy-icon { font-size: 32px; }
                .privacy-text h3 { margin: 0 0 8px 0; font-size: 18px; color: #f8fafc; }
                .privacy-text p { margin: 0; color: #94a3b8; line-height: 1.6; font-size: 15px; }
            `}</style>
        </main>
    );
}


