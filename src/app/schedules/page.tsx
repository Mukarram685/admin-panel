"use client";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/utils/api";
import DataTable from "@/component/DataTable/DataTable";
import Modal from "@/component/Modal/Modal";

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
    const [availableBuses, setAvailableBuses] = useState<any[]>([]);
    const [availableOperators, setAvailableOperators] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
    const [passengers, setPassengers] = useState<any[]>([]);
    const [loadingPassengers, setLoadingPassengers] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        routeId: "",
        busId: "",
        operatorId: "",
        departureDate: "",
        departureTime: "08:00",
        arrivalTime: "12:00",
        fare: 500
    });

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) setUser(JSON.parse(userStr));
    }, []);

    const loadSchedules = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem("user");
            const userData = userStr ? JSON.parse(userStr) : null;
            
            let res;
            if (userData?.role === 'operator') {
                res = await fetchAPI("/operator/my-trips");
            } else {
                res = await fetchAPI("/schedules/company");
            }
            setSchedules(res.trips || res.data || res.schedules || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadDropdowns = async () => {
        if (user?.role === 'operator') return; // Operators don't need dropdowns for creation
        try {
            const [routesRes, busesRes, operatorsRes] = await Promise.all([
                fetchAPI("/routes/allRoutes"),
                fetchAPI("/buses/company"),
                fetchAPI("/operator/company")
            ]);
            setAvailableRoutes(routesRes.data || routesRes.routes || []);
            setAvailableBuses(busesRes.buses || busesRes.data || []);
            setAvailableOperators(operatorsRes.operators || operatorsRes.data || []);
        } catch (err) {
            console.error("Failed to load reference data", err);
        }
    };

    useEffect(() => {
        if (user) {
            loadSchedules();
            if (user.role !== 'operator') loadDropdowns();
        }
    }, [user]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError("");
        try {
            await fetchAPI("/schedules/create", {
                method: "POST",
                body: JSON.stringify({ ...formData, fare: Number(formData.fare) }),
            });
            setIsModalOpen(false);
            loadSchedules();
        } catch (err: any) {
            setError(err.message || "Failed to create schedule");
        } finally {
            setCreating(false);
        }
    };

    const handleViewDetails = async (schedule: any) => {
        setSelectedSchedule(schedule);
        setIsDetailModalOpen(true);
        setLoadingPassengers(true);
        try {
            const res = await fetchAPI(`/bookings/schedule/${schedule._id}`);
            // Group seats by passenger details WITHIN each individual booking
            const processedList = (res.bookings || []).flatMap((b: any) => {
                const groups: Record<string, any> = {};
                (b.seats || []).forEach((s: any) => {
                    const key = `${s.passengerName}-${s.passengerCNIC}`;
                    if (!groups[key]) {
                        groups[key] = { 
                            ...s, 
                            pnr: b.pnr, 
                            bookedBy: b.passenger?.name || 'Guest',
                            seatList: [s.seatNumber] 
                        };
                    } else {
                        groups[key].seatList.push(s.seatNumber);
                    }
                });
                return Object.values(groups);
            });
            setPassengers(processedList);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPassengers(false);
        }
    };

    const handleStartTrip = async (id: string) => {
        if (!confirm("Are you sure you want to start this trip?")) return;
        try {
            await fetchAPI(`/operator/trips/${id}/start`, { method: "PATCH" });
            setSchedules((prev: any) => prev.map((s: any) => s._id === id ? { ...s, status: 'in-progress' } : s));
            if (selectedSchedule?._id === id) setSelectedSchedule((prev: any) => ({ ...prev, status: 'in-progress' }));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleCompleteTrip = async (id: string) => {
        if (!confirm("Are you sure you want to mark this trip as completed?")) return;
        try {
            await fetchAPI(`/operator/trips/${id}/complete`, { method: "PATCH" });
            setSchedules((prev: any) => prev.map((s: any) => s._id === id ? { ...s, status: 'completed' } : s));
            if (selectedSchedule?._id === id) setSelectedSchedule((prev: any) => ({ ...prev, status: 'completed' }));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const columns = [
        {
            key: "route", header: "Route", render: (r: any) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{r.route?.fromCity} → {r.route?.toCity}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{r.route?.from} to {r.route?.to}</span>
                </div>
            )
        },
        { key: "bus", header: "Bus", render: (r: any) => `${r.bus?.busNumber} (${r.bus?.type})` },
        { key: "departureDate", header: "Date", render: (r: any) => new Date(r.departureDate).toLocaleDateString() },
        { key: "time", header: "Time", render: (r: any) => `${r.departureTime} - ${r.arrivalTime}` },
        {
            key: "status", header: "Status", render: (r: any) => (
                <span className={`status-badge ${r.status || 'active'}`}>
                    {r.status || 'Active'}
                </span>
            )
        },
        {
            key: "actions", header: "Actions", render: (r: any) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleViewDetails(r)} className="btn-secondary btn-sm">Manifest</button>
                    {user?.role === 'operator' && (
                        <>
                            {r.status === 'active' && (
                                <button onClick={() => handleStartTrip(r._id)} className="btn-primary btn-sm">Start</button>
                            )}
                            {r.status === 'in-progress' && (
                                <button onClick={() => handleCompleteTrip(r._id)} className="btn-primary btn-sm">Complete</button>
                            )}
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <main className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">{user?.role === 'operator' ? "My Assigned Schedules" : "Schedules Management"}</h1>
                    <p className="page-subtitle">
                        {user?.role === 'operator' ? "View your duty manifest and update trip status." : "Coordinate bus departures and manage route timings."}
                    </p>
                </div>
                {user?.role !== 'operator' && (
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                        + Create Schedule
                    </button>
                )}
            </header>

            <DataTable 
                title={user?.role === 'operator' ? "Current Assignments" : "Upcoming Departures"} 
                columns={columns} 
                data={schedules} 
                loading={loading} 
            />

            {/* Create Schedule Modal (Admin Only) */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Dispatch New Schedule">
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label>Select Route</label>
                        <select required className="form-input" value={formData.routeId} onChange={e => setFormData({ ...formData, routeId: e.target.value })}>
                            <option value="">Choose a route...</option>
                            {availableRoutes.map(r => <option key={r._id} value={r._id}>{r.fromCity} -&gt; {r.toCity}</option>)}
                        </select>
                    </div>
                    {/* ... other form fields ... */}
                    <div className="modal-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={creating} className="btn-primary">Create</button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal (Manifest) */}
            <Modal 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)} 
                title={`Passenger Manifest - ${selectedSchedule?.bus?.busNumber}`}
                width="800px"
            >
                <div className="manifest-container">
                    <div className="manifest-header">
                        <div className="m-info">
                            <span className="m-label">Route</span>
                            <span className="m-value">{selectedSchedule?.route?.fromCity} to {selectedSchedule?.route?.toCity}</span>
                        </div>
                        <div className="m-info">
                            <span className="m-label">Departure</span>
                            <span className="m-value">{selectedSchedule?.departureTime} | {new Date(selectedSchedule?.departureDate).toLocaleDateString()}</span>
                        </div>
                        <div className="m-info">
                            <span className="m-label">Status</span>
                            <span className={`status-badge ${selectedSchedule?.status}`}>{selectedSchedule?.status}</span>
                        </div>
                    </div>

                    <div className="p-list">
                        <h3 className="section-title">Booked Passengers</h3>
                        {loadingPassengers ? (
                            <p className="loading-text">Loading passenger logs...</p>
                        ) : passengers.length === 0 ? (
                            <p className="empty-text">No bookings found for this trip.</p>
                        ) : (
                            <table className="p-table">
                                <thead>
                                    <tr>
                                        <th>Seat</th>
                                        <th>Passenger Name</th>
                                        <th>CNIC / ID</th>
                                        <th>Phone</th>
                                        <th>Gender</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {passengers.map((p, idx) => (
                                        <tr key={idx}>
                                            <td><span className="seat-num">{p.seatList.join(', ')}</span></td>
                                            <td className="p-name">{p.passengerName}</td>
                                            <td className="p-cnic">{p.passengerCNIC}</td>
                                            <td>{p.passengerPhone}</td>
                                            <td>{p.gender}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {user?.role === 'operator' && (
                        <div className="manifest-actions">
                            {selectedSchedule?.status === 'active' && (
                                <button 
                                    onClick={() => handleStartTrip(selectedSchedule._id)} 
                                    className="btn-primary w-full"
                                    style={{ marginTop: '24px' }}
                                >
                                    Start Trip Now
                                </button>
                            )}
                            {selectedSchedule?.status === 'in-progress' && (
                                <button 
                                    onClick={() => handleCompleteTrip(selectedSchedule._id)} 
                                    className="btn-primary w-full"
                                    style={{ marginTop: '24px' }}
                                >
                                    Mark Trip as Completed
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            <style jsx>{`
                .page-container { padding: 32px; }
                .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
                .page-title { font-size: 32px; font-weight: 800; margin: 0; color: #f8fafc; }
                .page-subtitle { color: #94a3b8; margin: 4px 0 0 0; font-size: 15px; }
                
                .manifest-header { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; margin-bottom: 24px; border: 1px solid rgba(255, 255, 255, 0.05); }
                .m-info { display: flex; flex-direction: column; gap: 4px; }
                .m-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
                .m-value { font-size: 15px; color: #f8fafc; font-weight: 600; }
                
                .section-title { font-size: 14px; font-weight: 700; color: #f8fafc; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; border-left: 3px solid var(--primary); padding-left: 12px; }
                
                .p-table { width: 100%; border-collapse: collapse; }
                .p-table th { text-align: left; padding: 12px; font-size: 12px; color: #64748b; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
                .p-table td { padding: 16px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.02); font-size: 14px; color: #cbd5e1; }
                
                .seat-num { background: rgba(59, 130, 246, 0.1); color: #60a5fa; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-family: monospace; }
                .p-name { color: #f8fafc; font-weight: 600; }
                .p-cnic { font-family: monospace; color: #94a3b8; }
                
                .status-badge { padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; width: fit-content; }
                .status-badge.active { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .status-badge.in-progress { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .status-badge.completed { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .status-badge.cancelled { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                
                .loading-text { color: #94a3b8; text-align: center; padding: 40px; font-style: italic; }
                .empty-text { color: #64748b; text-align: center; padding: 40px; }
                
                .w-full { width: 100%; }
            `}</style>
        </main>
    );
}

