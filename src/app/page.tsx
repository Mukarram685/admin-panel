"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  DollarSign,
  BusFront,
  Ticket,
  CalendarClock,
  Route,
  Users,
  Check,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Mail,
  User,
  Loader2,
  Info,
  CalendarPlus,
  UserPlus
} from "lucide-react";
import DashboardCard from "@/component/DashboardCard/DashboardCard";
import DataTable from "@/component/DataTable/DataTable";
import Modal from "@/component/Modal/Modal";
import { fetchAPI } from "@/utils/api";
import { useCompanyFilter } from "@/context/CompanyFilterContext";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const { selectedCompanyId: globalCompanyId, selectedCompany } = useCompanyFilter();
  const [stats, setStats] = useState({
    bookings: 0,
    revenue: 0,
    buses: 0,
    routes: 0,
    operators: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [companySchedules, setCompanySchedules] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingPassengers, setLoadingPassengers] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);

  // Superadmin raw datasets for reactive filtering
  const [rawSuperadminData, setRawSuperadminData] = useState<{
    bookings: any[];
    buses: any[];
    routes: any[];
    companies: any[];
    operators: any[];
  }>({
    bookings: [],
    buses: [],
    routes: [],
    companies: [],
    operators: [],
  });

  const handleApproveCompany = async (id: string, action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this company?`)) return;
    try {
      await fetchAPI(`/companies/approve/${id}`, {
        method: "PUT",
        body: JSON.stringify({ action }),
      });
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to update company status");
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        
        const userData = JSON.parse(userStr);
        setUser(userData);

        if (userData.role === "operator") {
          if (userData.operatorType === "company_manager") {
            // Company Manager: high-level company fleet, routes, schedules, personnel
            const [busesRes, routesRes, schedulesRes, operatorsRes] = await Promise.all([
              fetchAPI("/buses/company").catch(() => ({ buses: [] })),
              fetchAPI("/routes/allRoutes").catch(() => ({ routes: [] })),
              fetchAPI("/schedules/company").catch(() => ({ schedules: [] })),
              fetchAPI("/operator/company").catch(() => ({ operators: [] })),
            ]);

            const busesList = busesRes.buses || busesRes.data || [];
            const routesList = routesRes.routes || routesRes.data || [];
            const schedulesList = schedulesRes.schedules || schedulesRes.data || [];
            const operatorsList = operatorsRes.operators || operatorsRes.data || [];

            setCompanySchedules(schedulesList);
            setStats({
              bookings: schedulesList.length,
              revenue: 0,
              buses: busesList.length,
              routes: routesList.length,
              operators: operatorsList.length,
            });
          } else if (userData.operatorType === "city_manager") {
            // City Manager: terminal schedules and terminal crew
            const [schedulesRes, operatorsRes] = await Promise.all([
              fetchAPI("/schedules/company").catch(() => ({ schedules: [] })),
              fetchAPI("/operator/company").catch(() => ({ operators: [] })),
            ]);
            const schedulesList = schedulesRes.schedules || schedulesRes.data || [];
            const operatorsList = operatorsRes.operators || operatorsRes.data || [];
            const myCities = userData.operatorScope?.cities || [];
            
            const citySchedules = schedulesList.filter((s: any) => {
              if (!myCities.length) return true;
              return myCities.includes(s.route?.fromCity) || myCities.includes(s.route?.toCity);
            });

            setTrips(citySchedules);
            setStats({
              bookings: citySchedules.length,
              revenue: 0,
              buses: userData.operatorScope?.buses?.length || 0,
              routes: myCities.length || 1,
              operators: operatorsList.length,
            });
          } else {
            // Trip Operator (Conductor/Driver): specific assigned trips
            const res = await fetchAPI("/operator/my-trips");
            const tripList = res.trips || [];
            setTrips(tripList);
            
            setStats({
              bookings: tripList.length,
              revenue: 0,
              buses: userData.operatorScope?.buses?.length || 0,
              routes: userData.operatorScope?.cities?.length || 0,
              operators: 0,
            });
          }
        } else if (userData.role === "superadmin") {
          const [bookingsRes, busesRes, routesRes, companiesRes, operatorsRes] = await Promise.all([
            fetchAPI("/bookings/company/all").catch(() => ({ bookings: [] })),
            fetchAPI("/buses/company").catch(() => ({ buses: [] })),
            fetchAPI("/routes/allRoutes").catch(() => ({ routes: [] })),
            fetchAPI("/companies/list").catch(() => ({ companies: [] })),
            fetchAPI("/operator/company").catch(() => ({ operators: [] })),
          ]);

          const bookingsList = bookingsRes.bookings || [];
          const busesList = busesRes.buses || busesRes.data || [];
          const routesList = routesRes.routes || routesRes.data || [];
          const companiesList = companiesRes.companies || [];
          const operatorsList = operatorsRes.operators || [];

          setRawSuperadminData({
            bookings: bookingsList,
            buses: busesList,
            routes: routesList,
            companies: companiesList,
            operators: operatorsList,
          });
          setCompanies(companiesList);
        } else {
          // Company Admin
          const [bookingsRes, busesRes, routesRes, operatorsRes] = await Promise.all([
            fetchAPI("/bookings/company/all").catch(() => ({ bookings: [] })),
            fetchAPI("/buses/company").catch(() => ({ buses: [] })),
            fetchAPI("/routes/allRoutes").catch(() => ({ routes: [] })),
            fetchAPI("/operator/company").catch(() => ({ operators: [] })),
          ]);

          const bookingsList = bookingsRes.bookings || [];
          const busesList = busesRes.buses || busesRes.data || [];
          const routesList = routesRes.routes || routesRes.data || [];
          const operatorsList = operatorsRes.operators || operatorsRes.data || [];

          const totalRev = bookingsList.reduce((acc: number, b: any) => {
              if (b.bookingStatus === 'cancelled' || b.bookingStatus === 'refunded' || b.status === 'cancelled') return acc;
              return acc + (b.totalAmount || 0) - (b.refundAmount || 0);
          }, 0);

          setStats({
            bookings: bookingsList.filter((b: any) => b.bookingStatus !== 'cancelled' && b.bookingStatus !== 'refunded' && b.status !== 'cancelled').length,
            revenue: totalRev,
            buses: busesList.length,
            routes: routesList.length,
            operators: operatorsList.length,
          });
        }

      } catch (err: any) {
        setError(err.message || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Recalculate Superadmin stats when globalCompanyId changes
  useEffect(() => {
    if (user?.role !== "superadmin") return;

    const { bookings, buses, routes, companies, operators } = rawSuperadminData;

    if (globalCompanyId) {
      const filteredBuses = buses.filter(
        (b: any) => (typeof b.company === "object" ? b.company?._id : b.company) === globalCompanyId
      );
      const filteredRoutes = routes.filter(
        (r: any) => (typeof r.company === "object" ? r.company?._id : r.company) === globalCompanyId
      );
      const filteredOperators = operators.filter(
        (op: any) => (typeof op.company === "object" ? op.company?._id : op.company) === globalCompanyId
      );
      const filteredBookings = bookings.filter((b: any) => {
        const compId =
          typeof b.schedule?.company === "object"
            ? b.schedule.company?._id
            : b.schedule?.company ||
              (typeof b.bus?.company === "object" ? b.bus.company?._id : b.bus?.company);
        return compId === globalCompanyId;
      });

      const totalRev = filteredBookings.reduce((acc: number, b: any) => {
        if (b.bookingStatus === "cancelled" || b.bookingStatus === "refunded" || b.status === "cancelled") return acc;
        return acc + (b.totalAmount || 0) - (b.refundAmount || 0);
      }, 0);

      setStats({
        bookings: filteredBookings.filter(
          (b: any) => b.bookingStatus !== "cancelled" && b.bookingStatus !== "refunded" && b.status !== "cancelled"
        ).length,
        revenue: totalRev,
        buses: filteredBuses.length,
        routes: filteredRoutes.length,
        operators: filteredOperators.length,
      });
    } else {
      const totalRev = bookings.reduce((acc: number, b: any) => {
        if (b.bookingStatus === "cancelled" || b.bookingStatus === "refunded" || b.status === "cancelled") return acc;
        return acc + (b.totalAmount || 0) - (b.refundAmount || 0);
      }, 0);

      const approvedCompanies = companies.filter((c: any) => c.status === "approved" || !c.status);

      setStats({
        bookings: approvedCompanies.length,
        revenue: totalRev,
        buses: buses.length,
        routes: routes.length,
        operators: operators.length,
      });
    }
  }, [globalCompanyId, rawSuperadminData, user]);

  const handleViewPassengers = async (trip: any) => {
    setSelectedTrip(trip);
    setIsModalOpen(true);
    setLoadingPassengers(true);
    try {
      const res = await fetchAPI(`/operator/trips/${trip._id}/passengers`);
      setPassengers(res.passengers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPassengers(false);
    }
  };

  const handleCompleteTrip = async (tripId: string) => {
    if (!confirm("Are you sure you want to mark this trip as completed?")) return;
    try {
      await fetchAPI(`/operator/trips/${tripId}/complete`, { method: "PATCH" });
      setTrips(prev => prev.map(t => t._id === tripId ? { ...t, status: "completed" } : t));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Trip Operator columns (driver/conductor specific duty board)
  const tripColumns = [
    { key: "bus", header: "Bus", render: (row: any) => row.bus?.busNumber || "N/A" },
    { key: "route", header: "Route", render: (row: any) => `${row.route?.fromCity || ''} → ${row.route?.toCity || ''}` },
    { key: "departure", header: "Departure", render: (row: any) => `${new Date(row.departureDate).toLocaleDateString()} at ${row.departureTime}` },
    { key: "status", header: "Status", render: (row: any) => (
      <span className={`badge ${row.status === 'completed' ? 'badge-success' : row.status === 'active' ? 'badge-primary' : 'badge-error'}`}>
        {row.status === 'completed' && <CheckCircle2 size={11} />}
        {row.status === 'active' && <Clock size={11} />}
        {row.status !== 'completed' && row.status !== 'active' && <AlertCircle size={11} />}
        <span>{row.status}</span>
      </span>
    )},
    { key: "actions", header: "Actions", render: (row: any) => (
      <div className={styles.actions}>
        <button className="btn-icon-primary" onClick={() => handleViewPassengers(row)} title="View Manifest">
          <Users size={13} />
          <span>Manifest</span>
        </button>
        {row.status !== "completed" && (
          <button className="btn-icon-success" onClick={() => handleCompleteTrip(row._id)} title="Complete Trip">
            <CheckCircle2 size={13} />
            <span>Complete</span>
          </button>
        )}
      </div>
    )}
  ];

  // Company Manager & City Manager schedule oversight columns
  const companyScheduleColumns = [
    { key: "bus", header: "Bus & Layout", render: (row: any) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc', flexShrink: 0 }}>
          <BusFront size={14} />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{row.bus?.busNumber || "N/A"}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{row.bus?.type || "Standard"} ({row.bus?.totalSeats || 40} seats)</div>
        </div>
      </div>
    )},
    { key: "route", header: "Route Line", render: (row: any) => (
      <div>
        <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{row.route?.fromCity || 'Origin'} → {row.route?.toCity || 'Destination'}</span>
        {row.route?.duration && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>⏱ {row.route?.duration}</div>}
      </div>
    )},
    { key: "departure", header: "Departure Time", render: (row: any) => (
      <div>
        <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>{new Date(row.departureDate).toLocaleDateString()}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>🕒 {row.departureTime} - {row.arrivalTime || 'TBD'}</div>
      </div>
    )},
    { key: "operator", header: "Assigned Operator", render: (row: any) => (
      row.operator ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={12} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{row.operator?.name}</span>
        </div>
      ) : (
        <span className="badge badge-warning">Unassigned</span>
      )
    )},
    { key: "fare", header: "Fare", render: (row: any) => (
      <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>PKR {row.fare?.toLocaleString() || 0}</span>
    )},
    { key: "status", header: "Status", render: (row: any) => (
      <span className={`badge ${row.status === 'completed' ? 'badge-success' : row.status === 'active' || row.status === 'scheduled' ? 'badge-primary' : 'badge-error'}`}>
        {row.status === 'completed' && <CheckCircle2 size={11} />}
        {(row.status === 'active' || row.status === 'scheduled') && <Clock size={11} />}
        {row.status !== 'completed' && row.status !== 'active' && row.status !== 'scheduled' && <AlertCircle size={11} />}
        <span style={{ textTransform: 'capitalize' }}>{row.status}</span>
      </span>
    )},
    { key: "actions", header: "Actions", render: (row: any) => (
      <div className={styles.actions}>
        <button className="btn-icon-primary" onClick={() => handleViewPassengers(row)} title="View Passenger Manifest">
          <Users size={13} />
          <span>Manifest</span>
        </button>
        <button className="btn-icon-secondary" onClick={() => router.push("/schedules")} title="Manage Schedules">
          <CalendarClock size={13} />
          <span>Manage</span>
        </button>
      </div>
    )}
  ];

  const isCompanyManager = user?.role === "operator" && user?.operatorType === "company_manager";
  const isCityManager = user?.role === "operator" && user?.operatorType === "city_manager";

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
            {user?.role === "superadmin" ? (globalCompanyId && selectedCompany ? `${selectedCompany.name} - Operations` : "Global System Analytics") : 
             isCompanyManager ? "Company Operations Command Center" :
             isCityManager ? "Terminal Operations Board" :
             user?.role === "operator" ? "Duty Operations Board" : 
             "Company Performance Overview"}
        </h1>
        <p className={styles.subtitle}>
            {user?.role === "superadmin" ? (globalCompanyId && selectedCompany ? `Viewing operational telemetry, fleet, routes, and revenue for ${selectedCompany.name}.` : "Real-time logistics, partners, and network telemetry.") : 
             isCompanyManager ? "Real-time fleet operations, route networks, departure schedules, and personnel strength." :
             isCityManager ? `Terminal schedules and operator management for ${user?.operatorScope?.cities?.join(", ") || "assigned terminal"}.` :
             user?.role === "operator" ? "Manage assigned departures, passenger manifests, and route milestones." : 
             "Summary of bookings, operational fleet, and revenue performance."}
        </p>
        {error && <p className={styles.error}>{error}</p>}
      </header>

      {user?.role === 'operator' && (
        <section className={styles.operatorHeader}>
          <div className={styles.operatorInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>
                <Building2 size={12} />
                Affiliated Company
              </span>
              <span className={styles.infoValue}>
                {typeof user?.company === 'object' ? user?.company?.name : (user?.company || "Partner Fleet")}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>
                <Mail size={12} />
                Operator Email
              </span>
              <span className={styles.infoValue}>{user?.email}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>
                <User size={12} />
                Personnel Name
              </span>
              <span className={styles.infoValue}>{user?.name}</span>
            </div>
          </div>
          <div className={styles.operatorBadge}>
            <ShieldCheck size={13} />
            <span>{user?.operatorType ? user.operatorType.replace('_', ' ').toUpperCase() : 'TRIP OPERATOR'}</span>
          </div>
        </section>
      )}

      {loading ? (
        <div className={styles.loading}>
            <Loader2 size={36} className={styles.spinner} />
            <p>Collating latest logistics data...</p>
        </div>
      ) : (
        <div className={styles.content}>
          {/* Quick Action Shortcuts for Company Manager OR Superadmin viewing a specific company */}
          {(isCompanyManager || (user?.role === "superadmin" && globalCompanyId && selectedCompany)) && (
            <div className={styles.quickActionsGrid}>
              <button className={styles.quickActionCard} onClick={() => router.push('/buses')}>
                <div className={styles.quickActionIcon}>
                  <BusFront size={20} />
                </div>
                <div className={styles.quickActionInfo}>
                  <h4 className={styles.quickActionTitle}>Company Fleet</h4>
                  <p className={styles.quickActionDesc}>Inspect buses & configurations</p>
                </div>
              </button>

              <button className={styles.quickActionCard} onClick={() => router.push('/routes')}>
                <div className={styles.quickActionIcon}>
                  <Route size={20} />
                </div>
                <div className={styles.quickActionInfo}>
                  <h4 className={styles.quickActionTitle}>Network Routes</h4>
                  <p className={styles.quickActionDesc}>Manage city travel corridors</p>
                </div>
              </button>

              <button className={styles.quickActionCard} onClick={() => router.push('/schedules')}>
                <div className={styles.quickActionIcon}>
                  <CalendarPlus size={20} />
                </div>
                <div className={styles.quickActionInfo}>
                  <h4 className={styles.quickActionTitle}>Dispatch Schedules</h4>
                  <p className={styles.quickActionDesc}>Trip dispatches and assignments</p>
                </div>
              </button>

              <button className={styles.quickActionCard} onClick={() => router.push('/operators')}>
                <div className={styles.quickActionIcon}>
                  <UserPlus size={20} />
                </div>
                <div className={styles.quickActionInfo}>
                  <h4 className={styles.quickActionTitle}>Company Operators</h4>
                  <p className={styles.quickActionDesc}>Supervise managers & staff operators</p>
                </div>
              </button>
            </div>
          )}

          {/* Stats KPI Cards */}
          <div className={styles.grid}>
            <DashboardCard 
                title={user?.role === 'superadmin' ? (globalCompanyId ? "Confirmed Bookings" : "Active Companies") : 
                       isCompanyManager ? "Scheduled Trips" :
                       isCityManager ? "Terminal Trips" :
                       user?.role === 'operator' ? "My Assigned Trips" : 
                       "Total Bookings"} 
                value={stats.bookings.toString()} 
                trend={user?.role === 'superadmin' ? (globalCompanyId ? "Company Bookings" : "Partner Businesses") : 
                       isCompanyManager ? "Active Departures" :
                       isCityManager ? "City Schedules" :
                       user?.role === 'operator' ? "Current Schedule" : 
                       "Confirmed Trips"} 
                trendType="up"
                icon={user?.role === 'superadmin' ? (globalCompanyId ? <Ticket size={18} /> : <Building2 size={18} />) : 
                      (user?.role === 'operator' ? <CalendarClock size={18} /> : <Ticket size={18} />)}
            />
            {user?.role !== 'operator' && (
              <DashboardCard 
                  title={user?.role === 'superadmin' ? (globalCompanyId ? "Company Revenue" : "Gross System Volume") : "Total Payout Amount"} 
                  value={`PKR ${stats.revenue.toLocaleString()}`} 
                  trend={user?.role === 'superadmin' ? (globalCompanyId ? "Revenue from Bookings" : "System Revenue") : "Earnings to Date"} 
                  trendType="up"
                  icon={<DollarSign size={18} />}
              />
            )}
            <DashboardCard 
                title={user?.role === 'superadmin' ? (globalCompanyId ? "Company Fleet" : "Global Fleet Size") : 
                       isCityManager ? "Terminal Buses" : "Operational Fleet"} 
                value={stats.buses.toString()} 
                trend="Active Fleet Units" 
                trendType="up"
                icon={<BusFront size={18} />}
            />
            {(isCompanyManager || isCityManager || user?.role === 'superadmin' || user?.role === 'companyadmin') && (
              <DashboardCard 
                  title={isCityManager ? "Assigned Cities" : "Network Routes"} 
                  value={stats.routes.toString()} 
                  trend="Connected Lines" 
                  trendType="up"
                  icon={<Route size={18} />}
              />
            )}
            {(isCompanyManager || isCityManager || user?.role === 'companyadmin' || (user?.role === 'superadmin' && globalCompanyId)) && (
              <DashboardCard 
                  title="Company Personnel" 
                  value={(stats.operators || 0).toString()} 
                  trend="Active Crew & Staff" 
                  trendType="up"
                  icon={<Users size={18} />}
              />
            )}
          </div>

          {/* Main Content Area */}
          {user?.role === "superadmin" ? (
            <div className={styles.superadminContent}>
              {globalCompanyId && selectedCompany && (
                <section className={styles.tableSection}>
                  <div className={styles.sectionHeader}>
                    <Building2 size={16} className={styles.sectionIcon} />
                    <h2>Company Details: {selectedCompany.name}</h2>
                  </div>
                  <div className={styles.operatorInfo} style={{ padding: "8px 0" }}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Email</span>
                      <span className={styles.infoValue}>{selectedCompany.email || "N/A"}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Phone</span>
                      <span className={styles.infoValue}>{selectedCompany.phone || "N/A"}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Address</span>
                      <span className={styles.infoValue}>{selectedCompany.address || "N/A"}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Status</span>
                      <span className="badge badge-success">
                        <CheckCircle2 size={11} />
                        <span>Active Partner</span>
                      </span>
                    </div>
                  </div>
                </section>
              )}

              <section className={styles.tableSection}>
                <div className={styles.sectionHeader}>
                  <Clock size={16} className={styles.sectionIcon} />
                  <h2>Pending Company Registrations</h2>
                </div>
                <div className="table-responsive">
                  {companies.filter(c => c.status === 'pending').length === 0 ? (
                    <p className={styles.noRequests}>No pending registration requests.</p>
                  ) : (
                    <table className={styles.customTable}>
                      <thead>
                        <tr>
                          <th>Company Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Address</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companies.filter(c => c.status === 'pending').map((company) => (
                          <tr key={company._id}>
                            <td><strong>{company.name}</strong></td>
                            <td>{company.email}</td>
                            <td>{company.phone}</td>
                            <td>{company.address}</td>
                            <td>
                              <div className={styles.actions}>
                                <button className="btn-icon-success" onClick={() => handleApproveCompany(company._id, "approve")}>
                                  <Check size={13} />
                                  <span>Approve</span>
                                </button>
                                <button className="btn-icon-danger" onClick={() => handleApproveCompany(company._id, "reject")}>
                                  <X size={13} />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {!globalCompanyId && (
                <section className={styles.tableSection}>
                  <div className={styles.sectionHeader}>
                    <Building2 size={16} className={styles.sectionIcon} />
                    <h2>Registered Transport Companies</h2>
                  </div>
                  <div className="table-responsive">
                    {companies.filter(c => c.status === 'approved').length === 0 ? (
                      <p className={styles.noRequests}>No active companies registered.</p>
                    ) : (
                      <table className={styles.customTable}>
                        <thead>
                          <tr>
                            <th>Company Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {companies.filter(c => c.status === 'approved').map((company) => (
                            <tr key={company._id}>
                              <td><strong>{company.name}</strong></td>
                              <td>{company.email}</td>
                              <td>{company.phone}</td>
                              <td>{company.address}</td>
                              <td>
                                <span className="badge badge-success">
                                  <CheckCircle2 size={11} />
                                  <span>Approved</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
              )}
            </div>
          ) : isCompanyManager ? (
            <div className={styles.operatorContent}>
              <DataTable 
                title="Company Schedules & Fleet Dispatches" 
                columns={companyScheduleColumns} 
                data={companySchedules} 
                loading={loading}
              />
            </div>
          ) : isCityManager ? (
            <div className={styles.operatorContent}>
              <DataTable 
                title="Terminal Departure Schedules" 
                columns={companyScheduleColumns} 
                data={trips} 
                loading={loading}
              />
            </div>
          ) : user?.role === 'operator' ? (
            <div className={styles.operatorContent}>
              <DataTable 
                title="Your Assigned Duty Manifests" 
                columns={tripColumns} 
                data={trips} 
                loading={loading}
              />
            </div>
          ) : (
            <div className={`glass ${styles.summaryBox}`}>
                <div className={styles.summaryContent}>
                    <div className={styles.summaryHeader}>
                      <Info size={18} className={styles.summaryIcon} />
                      <h3>Operational Performance Notice</h3>
                    </div>
                    <p>
                      Detailed passenger personal information is safeguarded to preserve privacy. Aggregated bookings volume and company financial metrics are synchronized above.
                    </p>
                </div>
            </div>
          )}

          {/* Passenger Manifest Modal */}
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={`Passengers - ${selectedTrip?.bus?.busNumber || 'Bus'} (${selectedTrip?.route?.fromCity || ''} to ${selectedTrip?.route?.toCity || ''})`}
          >
            <div className={styles.passengerList}>
              {loadingPassengers ? (
                <div className={styles.loading}>
                  <Loader2 size={24} className={styles.spinner} />
                  <p>Loading manifests...</p>
                </div>
              ) : passengers.length === 0 ? (
                <p className={styles.noRequests}>No passengers booked for this trip yet.</p>
              ) : (
                <table className={styles.pTable}>
                  <thead>
                    <tr>
                      <th>Seat</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Gender</th>
                      <th>PNR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengers.map((p, i) => (
                      <tr key={i}>
                        <td><span className="badge badge-primary">{p.seatNumber}</span></td>
                        <td>{p.passengerName}</td>
                        <td>{p.passengerPhone}</td>
                        <td>{p.gender}</td>
                        <td><span className={styles.refCode}>{p.pnr}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Modal>
        </div>
      )}
    </main>
  );
}

