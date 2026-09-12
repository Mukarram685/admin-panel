"use client";
import { useEffect, useState } from "react";
import { Ticket, Wallet, ShieldCheck, Lock, Loader2, Sparkles } from "lucide-react";
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
            
            const activeBookings = bookings.filter((b: any) => b.status !== 'cancelled' && b.bookingStatus !== 'cancelled');
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
                    <p className="page-subtitle">Consolidated operational metrics and aggregated revenue tracking.</p>
                </div>
            </header>

            {loading ? (
                <div className="loading-state">
                    <Loader2 size={32} className="spin-icon" />
                    <p>Loading summary data...</p>
                </div>
            ) : (
                <div className="summary-grid">
                    <DashboardCard 
                        title="Total Active Bookings" 
                        value={stats.count.toString()} 
                        trend="Net Volume" 
                        trendType="up"
                        icon={<Ticket size={20} />}
                    />
                    <DashboardCard 
                        title="Total Payout Amount" 
                        value={`PKR ${stats.amount.toLocaleString()}`} 
                        trend="Settlement Pipeline" 
                        trendType="up"
                        icon={<Wallet size={20} />}
                    />
                </div>
            )}

            <div className="privacy-notice glass">
                <div className="privacy-icon-box">
                    <ShieldCheck size={26} />
                </div>
                <div className="privacy-text">
                    <div className="privacy-heading">
                        <Lock size={15} />
                        <h3>Data Privacy Enforcement</h3>
                    </div>
                    <p>
                        In accordance with enterprise data privacy and security compliance, individual passenger PII 
                        and transactional identifiers are restricted from direct export. You are viewing verified 
                        company-wide aggregate operational telemetry.
                    </p>
                </div>
            </div>

            <style jsx>{`
                .page-container { 
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;
                    box-sizing: border-box;
                }
                .page-header { 
                    margin-bottom: 4px; 
                    width: 100%;
                }
                .page-title { 
                    font-size: clamp(20px, 3.5vw, 26px); 
                    font-weight: 800; 
                    margin: 0; 
                    color: var(--foreground); 
                    letter-spacing: -0.025em; 
                    line-height: 1.2;
                }
                .page-subtitle { 
                    color: var(--text-muted); 
                    margin: 6px 0 0 0; 
                    font-size: clamp(12px, 2vw, 13px); 
                    line-height: 1.5;
                }
                
                .summary-grid { 
                    display: grid; 
                    grid-template-columns: repeat(2, minmax(0, 1fr)); 
                    gap: 16px; 
                    width: 100%;
                    box-sizing: border-box;
                }

                @media (max-width: 640px) {
                    .summary-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                }
                
                .loading-state { 
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 64px 20px; 
                    gap: 16px;
                    color: var(--text-muted); 
                    font-size: 14px; 
                    width: 100%;
                }

                .spin-icon {
                    animation: spin 1s linear infinite;
                    color: var(--primary);
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .privacy-notice {
                    margin-top: 16px;
                    padding: 24px;
                    display: flex;
                    gap: 20px;
                    align-items: flex-start;
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    background: linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(30, 27, 75, 0.25));
                    width: 100%;
                    box-sizing: border-box;
                    border-radius: var(--radius-lg);
                }

                @media (max-width: 640px) {
                    .privacy-notice {
                        flex-direction: column;
                        gap: 14px;
                        padding: 16px 14px;
                        border-radius: var(--radius-md);
                    }
                }

                .privacy-icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: var(--radius-md);
                    background: var(--primary-light);
                    color: #a5b4fc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    border: 1px solid rgba(99, 102, 241, 0.3);
                }

                @media (max-width: 640px) {
                    .privacy-icon-box {
                        width: 40px;
                        height: 40px;
                    }
                }

                .privacy-heading {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--foreground);
                    margin-bottom: 6px;
                }

                .privacy-heading h3 { 
                    margin: 0; 
                    font-size: 15px; 
                    font-weight: 700;
                }

                .privacy-text p { 
                    margin: 0; 
                    color: var(--text-muted); 
                    line-height: 1.6; 
                    font-size: 13px; 
                }

                @media (max-width: 640px) {
                    .page-container {
                        gap: 18px;
                    }
                }
            `}</style>
        </main>
    );
}


