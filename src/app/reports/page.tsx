"use client";
import { useEffect, useState } from "react";
import { 
  DollarSign, 
  BarChart3, 
  BusFront, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  Calendar,
  AlertCircle,
  Loader2,
  TrendingUp,
  Receipt,
  Ticket
} from "lucide-react";
import DashboardCard from "@/component/DashboardCard/DashboardCard";
import DataTable from "@/component/DataTable/DataTable";
import { fetchAPI } from "@/utils/api";
import styles from "./page.module.css";

export default function Reports() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeBuses: 0,
    cancelledTrips: 0,
  });
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [bookingData, setBookingData] = useState<any[]>([]);

  useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true);
        
        // Fetch booking data for reports
        const bookingsRes = await fetchAPI("/bookings/company/all").catch(() => ({ bookings: [] }));
        const bookingsList = bookingsRes.bookings || bookingsRes.data || [];
        
        // Calculate stats
        const totalRev = bookingsList.reduce((acc: number, b: any) => {
            if (b.bookingStatus === 'cancelled' || b.status === 'cancelled') return acc;
            return acc + (b.totalAmount || 0) - (b.refundAmount || 0);
        }, 0);

        const cancelledCount = bookingsList.filter((b: any) => b.bookingStatus === 'cancelled' || b.status === 'cancelled').length;

        setStats({
          totalRevenue: totalRev,
          totalBookings: bookingsList.length,
          activeBuses: 0,
          cancelledTrips: cancelledCount,
        });

        // Set data for tables
        setRevenueData(bookingsList.slice(0, 5).map((b: any) => ({
          pnr: b.pnr || b.bookingReference || "N/A",
          amount: b.totalAmount || 0,
          status: b.bookingStatus || b.status || "confirmed",
          date: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "Recent",
        })));

        setBookingData(bookingsList.slice(0, 10).map((b: any) => ({
          pnr: b.pnr || b.bookingReference || "N/A",
          totalAmount: b.totalAmount || 0,
          bookingStatus: b.bookingStatus || b.status || "confirmed",
          createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "Recent",
        })));
      } catch (err: any) {
        console.error("Failed to load report data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReportData();
  }, []);

  const renderStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "confirmed" || s === "paid" || s === "completed") {
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={12} />
          {status}
        </span>
      );
    }
    if (s === "cancelled" || s === "refunded") {
      return (
        <span className="badge badge-danger">
          <XCircle size={12} />
          {status}
        </span>
      );
    }
    return (
      <span className="badge badge-warning">
        <Clock size={12} />
        {status || "Pending"}
      </span>
    );
  };

  const revenueColumns = [
    { 
      key: "pnr", 
      header: "PNR Code",
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Receipt size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--foreground)' }}>
            {row.pnr}
          </span>
        </div>
      )
    },
    { 
      key: "amount", 
      header: "Net Amount",
      render: (row: any) => (
        <span style={{ fontWeight: 600, color: '#34d399' }}>
          PKR {(row.amount || 0).toLocaleString()}
        </span>
      )
    },
    { 
      key: "status", 
      header: "Settlement Status",
      render: (row: any) => renderStatusBadge(row.status)
    },
    { 
      key: "date", 
      header: "Transaction Date",
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <Calendar size={13} />
          <span>{row.date}</span>
        </div>
      )
    },
  ];

  const bookingColumns = [
    { 
      key: "pnr", 
      header: "Booking PNR",
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Ticket size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--foreground)' }}>
            {row.pnr}
          </span>
        </div>
      )
    },
    { 
      key: "totalAmount", 
      header: "Gross Total",
      render: (row: any) => (
        <span style={{ fontWeight: 600 }}>
          PKR {(row.totalAmount || 0).toLocaleString()}
        </span>
      )
    },
    { 
      key: "bookingStatus", 
      header: "Lifecycle Status",
      render: (row: any) => renderStatusBadge(row.bookingStatus)
    },
    { 
      key: "createdAt", 
      header: "Booking Date",
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <Calendar size={13} />
          <span>{row.createdAt}</span>
        </div>
      )
    },
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Compiling analytics and telemetry reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reports & Analytics</h1>
        <p className={styles.subtitle}>Comprehensive financial telemetry and operational performance metrics</p>
      </div>

      <div className={styles.grid}>
        <DashboardCard
          title="Total Revenue"
          value={`PKR ${stats.totalRevenue.toLocaleString()}`}
          trend="+12.5%"
          trendType="up"
          icon={<DollarSign size={20} />}
        />
        <DashboardCard
          title="Total Bookings"
          value={stats.totalBookings.toString()}
          trend="+8.2%"
          trendType="up"
          icon={<BarChart3 size={20} />}
        />
        <DashboardCard
          title="Active Buses"
          value={stats.activeBuses.toString()}
          trend="Fleet Active"
          trendType="up"
          icon={<BusFront size={20} />}
        />
        <DashboardCard
          title="Cancelled Trips"
          value={stats.cancelledTrips.toString()}
          trend="-2.3%"
          trendType="down"
          icon={<XCircle size={20} />}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <DataTable
            title="Recent Revenue Transactions"
            columns={revenueColumns}
            data={revenueData}
          />
        </div>

        <div className={styles.section}>
          <DataTable
            title="Recent Booking Logs"
            columns={bookingColumns}
            data={bookingData}
          />
        </div>
      </div>
    </div>
  );
}