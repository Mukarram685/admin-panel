"use client";
import { useEffect, useState } from "react";
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
        {row.status}
      </span>
    )},
    { key: "actions", header: "Actions", render: (row: any) => (
      <div className={styles.actions}>
        <button className="btn-secondary btn-sm" onClick={() => handleViewPassengers(row)}>Passengers</button>
        {row.status !== "completed" && (
          <button className="btn-primary btn-sm" onClick={() => handleCompleteTrip(row._id)}>Complete</button>
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
            {user?.role === "superadmin" ? "Real-time insights across all registered bus companies." : 
             user?.role === "operator" ? "Manage your assigned trips and passenger manifests." : 
             "Summary of your company's bookings and operational health."}
        </p>
        {error && <p className={styles.error}>{error}</p>}
      </header>

      {user?.role === 'operator' && (
        <section className={styles.operatorHeader}>
          <div className={styles.operatorInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Affiliated Company</span>
              <span className={styles.infoValue}>{user?.company?.name || "Independent"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Operator Email</span>
              <span className={styles.infoValue}>{user?.email}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Personnel Name</span>
              <span className={styles.infoValue}>{user?.name}</span>
            </div>
          </div>
          <div className={styles.operatorBadge}>
            {user?.operatorType?.replace('_', ' ').toUpperCase() || 'TRIP OPERATOR'}
          </div>
        </section>
      )}

      {loading ? (
        <div className={styles.loading}>
            <div className={styles.spinner}></div>
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
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
            />
            {user?.role !== 'operator' && (
              <DashboardCard 
                  title={user?.role === 'superadmin' ? "Gross System Volume" : "Total Payout Amount"} 
                  value={`Rs ${stats.revenue.toLocaleString()}`} 
                  trend={user?.role === 'superadmin' ? "System-wide Revenue" : "Earnings to date"} 
                  trendType="up"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
              />
            )}
            <DashboardCard 
                title={user?.role === 'superadmin' ? "Global Fleet Size" : 
                       user?.operatorType === 'city_manager' ? "Assigned Cities" : "Operational Fleet"} 
                value={user?.role === 'superadmin' ? stats.buses.toString() : 
                       (user?.operatorType === 'city_manager' ? stats.routes.toString() : stats.buses.toString())} 
                trend="Active Logistics" 
                trendType="up"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="22" height="13" rx="2" ry="2"></rect><path d="M7 21h0"></path><path d="M17 21h0"></path><path d="M4 17h0"></path><path d="M20 17h0"></path></svg>}
            />
          </div>

          {user?.role === "superadmin" ? (
            <div className={styles.superadminContent}>
              <section className={styles.tableSection}>
                <h2>Pending Company Registrations</h2>
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
                                <button className="btn-primary btn-sm" onClick={() => handleApproveCompany(company._id, "approve")}>Approve</button>
                                <button className="btn-secondary btn-sm" onClick={() => handleApproveCompany(company._id, "reject")}>Reject</button>
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
                <h2>Registered Transport Companies</h2>
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
                              <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>Approved</span>
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
                title="Your Assigned Tasks" 
                columns={tripColumns} 
                data={trips} 
                loading={loading}
              />
            </div>
          ) : (
            <div className={`glass glass-card ${styles.summaryBox}`}>
                  <div className={styles.summaryContent}>
                      <h3>Operational Performance Notice</h3>
                      <p>
                        Detailed passenger and operator information is restricted to protect privacy. Only consolidated volumes and financial metrics are displayed on this dashboard.
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
                <p>Loading manifests...</p>
              ) : passengers.length === 0 ? (
                <p>No passengers booked for this trip yet.</p>
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
                        <td>{p.seatNumber}</td>
                        <td>{p.passengerName}</td>
                        <td>{p.passengerPhone}</td>
                        <td>{p.gender}</td>
                        <td>{p.pnr}</td>
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
