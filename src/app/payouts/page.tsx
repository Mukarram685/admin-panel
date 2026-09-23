"use client";
import { useEffect, useState, useCallback } from "react";
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Building2, 
  BusFront, 
  MapPin, 
  Phone, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Sliders, 
  Send,
  Info,
  CalendarClock,
  Layers,
  Sparkles
} from "lucide-react";
import DashboardCard from "@/component/DashboardCard/DashboardCard";
import DataTable from "@/component/DataTable/DataTable";
import Modal from "@/component/Modal/Modal";
import { fetchAPI } from "@/utils/api";
import { useCompanyFilter } from "@/context/CompanyFilterContext";
import styles from "./page.module.css";

interface PayoutRecord {
  _id: string;
  schedule?: {
    _id: string;
    route?: {
      from: string;
      to: string;
      fromCity?: string;
      toCity?: string;
    };
    bus?: {
      busNumber: string;
      registrationNumber?: string;
      type?: string;
    };
    departureDate?: string;
    departureTime?: string;
    status?: string;
  };
  company?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  amount: number;
  recipientNumber: string;
  status: "pending" | "transferred" | "failed";
  scheduledTime: string;
  transferredAt?: string;
  createdAt: string;
}

interface PendingSettlement {
  scheduleId: string;
  schedule: {
    _id: string;
    route?: {
      from: string;
      to: string;
      fromCity?: string;
      toCity?: string;
    };
    bus?: {
      busNumber: string;
      registrationNumber?: string;
      type?: string;
    };
    departureDate?: string;
    departureTime?: string;
    status?: string;
  };
  company?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  totalBookings: number;
  totalAmount: number;
  recipientNumber: string;
  recipientName: string;
  departureTime: string;
  scheduledPayoutTime: string;
  hoursRemaining: number;
  isEligibleNow: boolean;
  status: string;
}

export default function PayoutsPage() {
  const [activeTab, setActiveTab] = useState<"completed" | "pending">("completed");
  const [completedPayouts, setCompletedPayouts] = useState<PayoutRecord[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<PendingSettlement[]>([]);
  const [stats, setStats] = useState({
    totalDisbursed: 0,
    completedCount: 0,
    pendingEscrowAmount: 0,
    pendingCount: 0,
    settlementWindowHours: 24
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sweepLoading, setSweepLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  
  // Modals state
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPending, setSelectedPending] = useState<PendingSettlement | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const { selectedCompanyId: globalCompanyId, selectedCompany } = useCompanyFilter();

  const loadPayoutData = useCallback(async () => {
    try {
      setLoading(true);
      setActionError("");
      const userStr = localStorage.getItem("user");
      if (userStr) setUser(JSON.parse(userStr));

      const queryParam = globalCompanyId ? `?companyId=${globalCompanyId}` : "";
      
      const [listRes, statsRes] = await Promise.all([
        fetchAPI(`/payout/list${queryParam}`).catch(() => ({ completedPayouts: [], pendingSettlements: [] })),
        fetchAPI(`/payout/stats${queryParam}`).catch(() => ({ stats: null }))
      ]);

      setCompletedPayouts(listRes.completedPayouts || []);
      setPendingSettlements(listRes.pendingSettlements || []);

      if (statsRes.stats) {
        setStats(statsRes.stats);
      } else {
        const completedTotal = (listRes.completedPayouts || []).reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
        const pendingTotal = (listRes.pendingSettlements || []).reduce((acc: number, s: any) => acc + (s.totalAmount || 0), 0);
        setStats({
          totalDisbursed: completedTotal,
          completedCount: (listRes.completedPayouts || []).length,
          pendingEscrowAmount: pendingTotal,
          pendingCount: (listRes.pendingSettlements || []).length,
          settlementWindowHours: 24
        });
      }
    } catch (err: any) {
      console.error("Failed to load payout data:", err);
      setActionError(err.message || "Failed to load settlement records");
    } finally {
      setLoading(false);
    }
  }, [globalCompanyId]);

  useEffect(() => {
    loadPayoutData();
  }, [loadPayoutData]);

  const handleTriggerSweep = async () => {
    try {
      setSweepLoading(true);
      setActionSuccess("");
      setActionError("");
      const res = await fetchAPI("/payout/trigger", { method: "POST" });
      setActionSuccess(res.message || "Automated payout sweep executed successfully.");
      await loadPayoutData();
    } catch (err: any) {
      setActionError(err.message || "Failed to execute payout check.");
    } finally {
      setSweepLoading(false);
    }
  };

  const handleManualRelease = async () => {
    if (!selectedPending) return;
    try {
      setManualLoading(true);
      setActionSuccess("");
      setActionError("");
      const res = await fetchAPI(`/payout/process/${selectedPending.scheduleId}`, { method: "POST" });
      setActionSuccess(res.message || "Payout released and disbursed successfully.");
      setIsConfirmModalOpen(false);
      setSelectedPending(null);
      await loadPayoutData();
    } catch (err: any) {
      setActionError(err.message || "Failed to release payout.");
    } finally {
      setManualLoading(false);
    }
  };

  const completedColumns = [
    {
      key: "schedule",
      header: "Schedule / Route",
      render: (row: PayoutRecord) => {
        const route = row.schedule?.route;
        const bus = row.schedule?.bus;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "var(--foreground)" }}>
              <MapPin size={13} style={{ color: "var(--primary)" }} />
              <span>{route?.fromCity || route?.from || "Departure"} → {route?.toCity || route?.to || "Arrival"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
              {bus?.busNumber && <span>🚌 {bus.busNumber}</span>}
              {row.schedule?.departureDate && (
                <span>📅 {new Date(row.schedule.departureDate).toLocaleDateString()} {row.schedule?.departureTime}</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: "company",
      header: "Partner Company",
      render: (row: PayoutRecord) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            background: "rgba(79, 70, 229, 0.12)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "12px"
          }}>
            <Building2 size={15} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--foreground)" }}>
              {row.company?.name || "Company Partner"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {row.recipientNumber ? `📞 ${row.recipientNumber}` : "Admin Account"}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "amount",
      header: "Disbursed Amount",
      render: (row: PayoutRecord) => (
        <div style={{ fontWeight: 700, fontSize: "14px", color: "#34d399" }}>
          PKR {(row.amount || 0).toLocaleString()}
        </div>
      )
    },
    {
      key: "transferredAt",
      header: "Settlement Timestamp",
      render: (row: PayoutRecord) => {
        const dateStr = row.transferredAt || row.createdAt;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--text-muted)" }}>
            <Calendar size={13} />
            <span>{dateStr ? new Date(dateStr).toLocaleString() : "Recently Settled"}</span>
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Disbursement Status",
      render: (row: PayoutRecord) => (
        <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <CheckCircle2 size={12} />
          <span>Settled (Transferred)</span>
        </span>
      )
    },
    {
      key: "actions",
      header: "Action",
      render: (row: PayoutRecord) => (
        <button
          type="button"
          onClick={() => {
            setSelectedPayout(row);
            setIsDetailsModalOpen(true);
          }}
          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
        >
          <Info size={13} />
          <span>Audit</span>
        </button>
      )
    }
  ];

  const pendingColumns = [
    {
      key: "schedule",
      header: "Schedule / Trip",
      render: (row: PendingSettlement) => {
        const route = row.schedule?.route;
        const bus = row.schedule?.bus;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "var(--foreground)" }}>
              <MapPin size={13} style={{ color: "var(--primary)" }} />
              <span>{route?.fromCity || route?.from || "From"} → {route?.toCity || route?.to || "To"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
              {bus?.busNumber && <span>🚌 {bus.busNumber}</span>}
              {row.schedule?.departureDate && (
                <span>📅 {new Date(row.schedule.departureDate).toLocaleDateString()} {row.schedule?.departureTime}</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: "company",
      header: "Beneficiary Company",
      render: (row: PendingSettlement) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Building2 size={15} style={{ color: "var(--primary)" }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>{row.company?.name || row.recipientName}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{row.recipientNumber}</div>
          </div>
        </div>
      )
    },
    {
      key: "totalBookings",
      header: "Booked Tickets",
      render: (row: PendingSettlement) => (
        <span style={{ fontWeight: 600, color: "var(--foreground)" }}>
          {row.totalBookings} tickets
        </span>
      )
    },
    {
      key: "totalAmount",
      header: "Accumulated Escrow",
      render: (row: PendingSettlement) => (
        <div style={{ fontWeight: 700, fontSize: "14px", color: "#fbbf24" }}>
          PKR {(row.totalAmount || 0).toLocaleString()}
        </div>
      )
    },
    {
      key: "timeRemaining",
      header: "12–24h Release Timer",
      render: (row: PendingSettlement) => {
        if (row.isEligibleNow) {
          return (
            <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Clock size={12} />
              <span>Ready for Payout</span>
            </span>
          );
        }
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)" }}>
              ⏳ {row.hoursRemaining} hrs remaining
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Due: {new Date(row.scheduledPayoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      }
    },
    ...(user?.role === "superadmin" ? [{
      key: "actions",
      header: "Override Release",
      render: (row: PendingSettlement) => (
        <button
          type="button"
          onClick={() => {
            setSelectedPending(row);
            setIsConfirmModalOpen(true);
          }}
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
        >
          <Send size={13} />
          <span>Release Now</span>
        </button>
      )
    }] : [])
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Compiling partner settlement logs and escrow telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>
            {user?.role === "superadmin" && selectedCompany 
              ? `${selectedCompany.name} - Settlements & Payouts` 
              : "Settlements & Company Payouts"}
          </h1>
          <p className={styles.subtitle}>
            {user?.role === "superadmin" && selectedCompany 
              ? `Automated 12–24h post-departure revenue disbursements and settlement logs for ${selectedCompany.name}.` 
              : "Automated 12 to 24 hours post-departure partner disbursements and revenue settlement management"}
          </p>
        </div>

        {user?.role === "superadmin" && (
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={handleTriggerSweep}
              disabled={sweepLoading}
              className={styles.btnSweep}
            >
              <RefreshCw size={15} className={sweepLoading ? styles.spinner : ""} />
              <span>{sweepLoading ? "Running Sweep..." : "Run Payout Check Now"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Action alerts */}
      {actionSuccess && (
        <div className={styles.payoutSuccessBanner}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className={styles.payoutErrorBanner}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Informational Policy Banner */}
      <div className={styles.bannerNotice}>
        <div className={styles.bannerContent}>
          <ShieldCheck size={18} style={{ color: "var(--primary)" }} />
          <span>
            <strong>12–24 Hours Settlement Policy:</strong> Ticket booking funds are automatically released and transferred to the company admin account <strong>12 to 24 hours</strong> after the scheduled trip departure.
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className={styles.grid}>
        <DashboardCard
          title="Total Disbursed Revenue"
          value={`PKR ${stats.totalDisbursed.toLocaleString()}`}
          trend="Fully Settled"
          trendType="up"
          icon={<DollarSign size={20} />}
        />
        <DashboardCard
          title="Escrow / Pending Payouts"
          value={`PKR ${stats.pendingEscrowAmount.toLocaleString()}`}
          trend={`${stats.pendingCount} Trips in Escrow`}
          trendType="up"
          icon={<Clock size={20} />}
        />
        <DashboardCard
          title="Settled Trips Count"
          value={stats.completedCount.toString()}
          trend="Disbursements Completed"
          trendType="up"
          icon={<CheckCircle2 size={20} />}
        />
        <DashboardCard
          title="Settlement Window"
          value="12–24 Hours"
          trend="Automated Engine Active"
          trendType="up"
          icon={<CalendarClock size={20} />}
        />
      </div>

      {/* Tabs Selector */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={`${styles.tabBtn} ${activeTab === "completed" ? styles.activeTab : ""}`}
        >
          <CheckCircle2 size={16} />
          <span>Completed Settlements</span>
          <span className={styles.badgePill}>{completedPayouts.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`${styles.tabBtn} ${activeTab === "pending" ? styles.activeTab : ""}`}
        >
          <Clock size={16} />
          <span>Pending Escrow Queue</span>
          <span className={styles.badgePill}>{pendingSettlements.length}</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className={styles.content}>
        {activeTab === "completed" ? (
          <div className={styles.section}>
            <DataTable
              title="Historical Settlement Transactions"
              columns={completedColumns}
              data={completedPayouts}
            />
          </div>
        ) : (
          <div className={styles.section}>
            <DataTable
              title="Trips In Escrow (Pending 12–24h Release)"
              columns={pendingColumns}
              data={pendingSettlements}
            />
          </div>
        )}
      </div>

      {/* Settlement Audit Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedPayout(null);
        }}
        title="Settlement Audit Details"
      >
        {selectedPayout && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{
              padding: "14px",
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Beneficiary Partner</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", marginTop: "2px" }}>
                  {selectedPayout.company?.name || "Company Partner"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  📞 {selectedPayout.recipientNumber}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Settled Payout</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#34d399", marginTop: "2px" }}>
                  PKR {(selectedPayout.amount || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "10px", borderRadius: "6px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "11.5px" }}>Route</span>
                <span style={{ fontWeight: 600 }}>
                  {selectedPayout.schedule?.route?.fromCity || "Departure"} → {selectedPayout.schedule?.route?.toCity || "Arrival"}
                </span>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "10px", borderRadius: "6px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "11.5px" }}>Assigned Bus</span>
                <span style={{ fontWeight: 600 }}>{selectedPayout.schedule?.bus?.busNumber || "N/A"}</span>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "10px", borderRadius: "6px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "11.5px" }}>Departure Date & Time</span>
                <span style={{ fontWeight: 600 }}>
                  {selectedPayout.schedule?.departureDate ? new Date(selectedPayout.schedule.departureDate).toLocaleDateString() : ""} {selectedPayout.schedule?.departureTime}
                </span>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "10px", borderRadius: "6px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "11.5px" }}>Transferred On</span>
                <span style={{ fontWeight: 600 }}>
                  {selectedPayout.transferredAt ? new Date(selectedPayout.transferredAt).toLocaleString() : "Recently"}
                </span>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedPayout(null);
                }}
                className="btn-primary"
              >
                Close Audit
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual Release Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setSelectedPending(null);
        }}
        title="Confirm Manual Payout Release"
      >
        {selectedPending && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
              Are you sure you want to immediately release and transfer the booking revenue for this schedule to the company admin account?
            </p>

            <div style={{
              padding: "14px",
              background: "rgba(79, 70, 229, 0.08)",
              borderRadius: "8px",
              border: "1px solid rgba(79, 70, 229, 0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--foreground)" }}>
                  {selectedPending.company?.name || selectedPending.recipientName}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Account / Phone: {selectedPending.recipientNumber}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Route: {selectedPending.schedule?.route?.fromCity || "Departure"} → {selectedPending.schedule?.route?.toCity || "Arrival"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total To Disburse</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#34d399", marginTop: "2px" }}>
                  PKR {(selectedPending.totalAmount || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setSelectedPending(null);
                }}
                className="btn-secondary"
                disabled={manualLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualRelease}
                className="btn-primary"
                disabled={manualLoading}
              >
                {manualLoading ? "Disbursing..." : "Confirm & Transfer Funds"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
