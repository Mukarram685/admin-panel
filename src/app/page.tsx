"use client";
import { useEffect, useState } from "react";
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
  Info
} from "lucide-react";
import DashboardCard from "@/component/DashboardCard/DashboardCard";
import DataTable from "@/component/DataTable/DataTable";
import Modal from "@/component/Modal/Modal";
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
  const [user, setUser] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingPassengers, setLoadingPassengers] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);

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
          const res = await fetchAPI("/operator/my-trips");
          const tripList = res.trips || [];
          setTrips(tripList);
          
          setStats({
            bookings: tripList.length,
            revenue: 0,
            buses: userData.operatorScope?.buses?.length || 0,
            routes: userData.operatorScope?.cities?.length || 0,
          });
        } else if (userData.role === "superadmin") {
          const [bookingsRes, busesRes, routesRes, companiesRes] = await Promise.all([
            fetchAPI("/bookings/company/all").catch(() => ({ bookings: [] })),
            fetchAPI("/buses/company").catch(() => ({ buses: [] })),
            fetchAPI("/routes/allRoutes").catch(() => ({ routes: [] })),
            fetchAPI("/companies/list").catch(() => ({ companies: [] })),
          ]);

          const bookingsList = bookingsRes.bookings || [];
          const busesList = busesRes.buses || [];
          const routesList = routesRes.routes || [];
          const companiesList = companiesRes.companies || [];

          const totalRev = bookingsList.reduce((acc: number, b: any) => {
              if (b.bookingStatus === 'cancelled') return acc;
              return acc + (b.totalAmount || 0) - (b.refundAmount || 0);
          }, 0);

          setStats({
            bookings: companiesList.length,
            revenue: totalRev,
            buses: busesList.length,
            routes: routesList.length,
          });
          setCompanies(companiesList);
        } else {
          // Company Admin
          const [bookingsRes, busesRes, routesRes] = await Promise.all([
            fetchAPI("/bookings/company/all").catch(() => ({ bookings: [] })),
            fetchAPI("/buses/company").catch(() => ({ buses: [] })),
            fetchAPI("/routes/allRoutes").catch(() => ({ routes: [] })),
          ]);

          const bookingsList = bookingsRes.bookings || [];
          const busesList = busesRes.buses || [];
          const routesList = routesRes.routes || [];

          const totalRev = bookingsList.reduce((acc: number, b: any) => {
              if (b.bookingStatus === 'cancelled') return acc;
              return acc + (b.totalAmount || 0) - (b.refundAmount || 0);
          }, 0);

          setStats({
            bookings: bookingsList.filter((b: any) => b.bookingStatus !== 'cancelled').length,
            revenue: totalRev,
            buses: busesList.length,
            routes: routesList.length,
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

  const tripColumns = [
    { key: "bus", header: "Bus", render: (row: any) => row.bus?.busNumber || "N/A" },
    { key: "route", header: "Route", render: (row: any) => `${row.route?.fromCity} → ${row.route?.toCity}` },
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

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
            {user?.role === "superadmin" ? "Global System Analytics" : 
             user?.role === "operator" ? "Duty Operations Board" : 
             "Company Performance Overview"}
        </h1>
        <p className={styles.subtitle}>
            {user?.role === "superadmin" ? "Real-time logistics, partners, and network telemetry." : 
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
              <span className={styles.infoValue}>{user?.company?.name || "Independent"}</span>
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
            <span>{user?.operatorType?.replace('_', ' ').toUpperCase() || 'TRIP OPERATOR'}</span>
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
          <div className={styles.grid}>
            <DashboardCard 
                title={user?.role === 'superadmin' ? "Active Companies" : 
                       user?.role === 'operator' ? "My Assigned Trips" : 
                       "Total Bookings"} 
                value={stats.bookings.toString()} 
                trend={user?.role === 'superadmin' ? "Partner Businesses" : 
                       user?.role === 'operator' ? "Current Schedule" : 
                       "Confirmed Trips"} 
                trendType="up"
                icon={user?.role === 'superadmin' ? <Building2 size={18} /> : user?.role === 'operator' ? <CalendarClock size={18} /> : <Ticket size={18} />}
            />
            {user?.role !== 'operator' && (
              <DashboardCard 
                  title={user?.role === 'superadmin' ? "Gross System Volume" : "Total Payout Amount"} 
                  value={`PKR ${stats.revenue.toLocaleString()}`} 
                  trend={user?.role === 'superadmin' ? "System Revenue" : "Earnings to Date"} 
                  trendType="up"
                  icon={<DollarSign size={18} />}
              />
            )}
            <DashboardCard 
                title={user?.role === 'superadmin' ? "Global Fleet Size" : 
                       user?.operatorType === 'city_manager' ? "Assigned Cities" : "Operational Fleet"} 
                value={user?.role === 'superadmin' ? stats.buses.toString() : 
                       (user?.operatorType === 'city_manager' ? stats.routes.toString() : stats.buses.toString())} 
                trend="Active Fleet" 
                trendType="up"
                icon={user?.operatorType === 'city_manager' ? <Route size={18} /> : <BusFront size={18} />}
            />
          </div>

          {user?.role === "superadmin" ? (
            <div className={styles.superadminContent}>
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

          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={`Passengers - ${selectedTrip?.bus?.busNumber} (${selectedTrip?.route?.fromCity} to ${selectedTrip?.route?.toCity})`}
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
