"use client";
import { useEffect, useState } from "react";
import {
    CalendarPlus,
    FileText,
    Edit3,
    Play,
    CheckCircle2,
    Clock,
    BusFront,
    User,
    CalendarClock,
    DollarSign,
    AlertCircle,
    Info,
    Tag,
    Phone,
    ArrowRight
} from "lucide-react";
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

    // Edit modal states for company admin / superadmin (only bus & operator can be edited)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);
    const [editFormData, setEditFormData] = useState({
        busId: "",
        operatorId: ""
    });
    const [updating, setUpdating] = useState(false);
    const [editError, setEditError] = useState("");

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        routeId: "",
        busId: "",
        operatorId: "",
        departureDate: getTodayDate(),
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
        if (user?.role === 'operator') return;
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

    const handleOpenEdit = (schedule: any) => {
        setEditingSchedule(schedule);
        setEditFormData({
            busId: schedule.bus?._id || schedule.bus || "",
            operatorId: schedule.operator?._id || schedule.operator || ""
        });
        setEditError("");
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSchedule) return;
        setUpdating(true);
        setEditError("");
        try {
            const res = await fetchAPI(`/schedules/update/${editingSchedule._id}`, {
                method: "PUT",
                body: JSON.stringify(editFormData),
            });
            if (res.success && res.schedule) {
                setSchedules((prev: any) => prev.map((s: any) => s._id === editingSchedule._id ? res.schedule : s));
            } else {
                loadSchedules();
            }
            setIsEditModalOpen(false);
            setEditingSchedule(null);
        } catch (err: any) {
            setEditError(err.message || "Failed to update schedule");
        } finally {
            setUpdating(false);
        }
    };

    const handleViewDetails = async (schedule: any) => {
        setSelectedSchedule(schedule);
        setIsDetailModalOpen(true);
        setLoadingPassengers(true);
        try {
            const res = await fetchAPI(`/bookings/schedule/${schedule._id}`);
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--foreground)' }}>
                        <span>{r.route?.fromCity}</span>
                        <ArrowRight size={13} color="var(--primary)" />
                        <span>{r.route?.toCity}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.route?.from} to {r.route?.to}</span>
                </div>
            )
        },
        { 
            key: "bus", 
            header: "Assigned Bus", 
            render: (r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BusFront size={14} color="var(--primary)" />
                    <span style={{ fontWeight: 600 }}>{r.bus?.busNumber}</span>
                    <span className="badge badge-info" style={{ fontSize: '10px' }}>{r.bus?.type}</span>
                </div>
            )
        },
        { 
            key: "operator", 
            header: "Driver / Conductor", 
            render: (r: any) => {
                if (r.operator && typeof r.operator === 'object') {
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={13} color="var(--text-secondary)" />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{r.operator.name}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.operator.email}</span>
                            </div>
                        </div>
                    );
                }
                return <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.operator ? `ID: ${String(r.operator).substring(0, 8)}...` : 'N/A'}</span>;
            }
        },
        { 
            key: "departureDate", 
            header: "Date", 
            render: (r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                    <Clock size={13} color="var(--text-secondary)" />
                    <span>{new Date(r.departureDate).toLocaleDateString()}</span>
                </div>
            )
        },
        { key: "time", header: "Time Range", render: (r: any) => `${r.departureTime} - ${r.arrivalTime}` },
        {
            key: "status", header: "Status", render: (r: any) => (
                <span className={`badge ${
                    r.status === 'completed' ? 'badge-success' : 
                    r.status === 'in-progress' ? 'badge-warning' : 
                    r.status === 'cancelled' ? 'badge-error' : 'badge-info'
                }`}>
                    {r.status === 'completed' && <CheckCircle2 size={11} />}
                    {r.status === 'in-progress' && <Clock size={11} />}
                    {r.status === 'cancelled' && <AlertCircle size={11} />}
                    {(!r.status || r.status === 'active') && <Clock size={11} />}
                    <span>{r.status || 'Active'}</span>
                </span>
            )
        },
        {
            key: "actions", header: "Actions", render: (r: any) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleViewDetails(r)} className="btn-icon-primary" title="View Manifest">
                        <FileText size={13} />
                        <span>Manifest</span>
                    </button>
                    {user?.role !== 'operator' && (
                        <button 
                            onClick={() => handleOpenEdit(r)} 
                            className="btn-icon-primary"
                            title="Edit Assignment"
                            disabled={r.status === 'completed' || r.status === 'cancelled'}
                            style={{ opacity: (r.status === 'completed' || r.status === 'cancelled') ? 0.4 : 1 }}
                        >
                            <Edit3 size={13} />
                            <span>Edit</span>
                        </button>
                    )}
                    {user?.role === 'operator' && (
                        <>
                            {r.status === 'active' && (
                                <button onClick={() => handleStartTrip(r._id)} className="btn-icon-success" title="Start Departure">
                                    <Play size={13} />
                                    <span>Start</span>
                                </button>
                            )}
                            {r.status === 'in-progress' && (
                                <button onClick={() => handleCompleteTrip(r._id)} className="btn-icon-success" title="Complete Journey">
                                    <CheckCircle2 size={13} />
                                    <span>Complete</span>
                                </button>
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
                    <h1 className="page-title">{user?.role === 'operator' ? "Assigned Duty Departures" : "Schedules & Dispatching"}</h1>
                    <p className="page-subtitle">
                        {user?.role === 'operator' ? "View passenger manifests, departure schedules, and update trip milestones." : "Coordinate vehicle departures, assign drivers, and manage route timings."}
                    </p>
                </div>
                {user?.role !== 'operator' && (
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                        <CalendarPlus size={15} />
                        <span>Dispatch Schedule</span>
                    </button>
                )}
            </header>

            <DataTable 
                title={user?.role === 'operator' ? "Assigned Shifts" : "Upcoming Departures"} 
                columns={columns} 
                data={schedules} 
                loading={loading} 
            />

            {/* Create Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="Dispatch New Schedule"
            >
                <form onSubmit={handleCreate}>
                    {error && <div className="error-text">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">Select Route</label>
                        <select required className="form-select" value={formData.routeId} onChange={e => setFormData({ ...formData, routeId: e.target.value })}>
                            <option value="" disabled>Choose a route...</option>
                            {availableRoutes.map(r => <option key={r._id} value={r._id}>{r.fromCity} → {r.toCity} ({r.distance}km)</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Assign Bus</label>
                        <select required className="form-select" value={formData.busId} onChange={e => setFormData({ ...formData, busId: e.target.value })}>
                            <option value="" disabled>Choose a bus...</option>
                            {availableBuses.map(b => <option key={b._id} value={b._id}>{b.busNumber} - {b.type} ({b.totalSeats} seats)</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Assign Operator / Conductor</label>
                        <select required className="form-select" value={formData.operatorId} onChange={e => setFormData({ ...formData, operatorId: e.target.value })}>
                            <option value="" disabled>Choose an operator...</option>
                            {availableOperators.map(o => <option key={o._id} value={o._id}>{o.name} ({o.email})</option>)}
                        </select>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Departure Date</label>
                            <input 
                                type="date" 
                                required 
                                min={getTodayDate()}
                                className="form-input date-picker" 
                                value={formData.departureDate} 
                                onClick={(e) => e.currentTarget.showPicker?.()}
                                onFocus={(e) => e.currentTarget.showPicker?.()}
                                onChange={e => setFormData({ ...formData, departureDate: e.target.value })} 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ticket Fare (PKR)</label>
                            <input type="number" required min={100} className="form-input" value={formData.fare} onChange={e => setFormData({ ...formData, fare: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Departure Time</label>
                            <input 
                                type="time" 
                                required 
                                className="form-input time-picker" 
                                value={formData.departureTime} 
                                onClick={(e) => e.currentTarget.showPicker?.()}
                                onFocus={(e) => e.currentTarget.showPicker?.()}
                                onChange={e => setFormData({ ...formData, departureTime: e.target.value })} 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Arrival Time</label>
                            <input 
                                type="time" 
                                required 
                                className="form-input time-picker" 
                                value={formData.arrivalTime} 
                                onClick={(e) => e.currentTarget.showPicker?.()}
                                onFocus={(e) => e.currentTarget.showPicker?.()}
                                onChange={e => setFormData({ ...formData, arrivalTime: e.target.value })} 
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={creating} className="btn-primary">
                            <CalendarPlus size={15} />
                            <span>{creating ? 'Dispatching...' : 'Dispatch Schedule'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal (Only Bus and Operator) */}
            <Modal 
                isOpen={isEditModalOpen} 
                onClose={() => { setIsEditModalOpen(false); setEditingSchedule(null); }} 
                title={`Edit Schedule Assignment - ${editingSchedule?.bus?.busNumber || 'Assignment'}`}
            >
                <form onSubmit={handleUpdate}>
                    {editError && <div className="error-text">{editError}</div>}

                    <div className="edit-info-banner">
                        <div className="info-item">
                            <span className="info-label">Route</span>
                            <span className="info-value">{editingSchedule?.route?.fromCity} → {editingSchedule?.route?.toCity}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Date & Time</span>
                            <span className="info-value">
                                {editingSchedule?.departureDate ? new Date(editingSchedule.departureDate).toLocaleDateString() : ''} ({editingSchedule?.departureTime} - {editingSchedule?.arrivalTime})
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Booked Seats</span>
                            <span className="info-value">
                                {editingSchedule?.bookedSeats?.length || 0} / {editingSchedule?.bus?.totalSeats || 0} seats
                            </span>
                        </div>
                    </div>

                    <div className="edit-hint-note">
                        <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span><strong>Policy:</strong> Only the <strong>Bus Number</strong> and <strong>Assigned Operator</strong> can be changed for an existing schedule.</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Assign New Bus</label>
                        <select 
                            required 
                            className="form-select" 
                            value={editFormData.busId} 
                            onChange={e => setEditFormData({ ...editFormData, busId: e.target.value })}
                        >
                            <option value="" disabled>Choose a bus...</option>
                            {availableBuses.map(b => (
                                <option key={b._id} value={b._id}>
                                    {b.busNumber} - {b.type} ({b.totalSeats} seats)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Assign New Operator</label>
                        <select 
                            required 
                            className="form-select" 
                            value={editFormData.operatorId} 
                            onChange={e => setEditFormData({ ...editFormData, operatorId: e.target.value })}
                        >
                            <option value="" disabled>Choose an operator...</option>
                            {availableOperators.map(o => (
                                <option key={o._id} value={o._id}>
                                    {o.name} ({o.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="modal-actions">
                        <button 
                            type="button" 
                            onClick={() => { setIsEditModalOpen(false); setEditingSchedule(null); }} 
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button type="submit" disabled={updating} className="btn-primary">
                            <Edit3 size={15} />
                            <span>{updating ? 'Saving Changes...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal (Manifest) */}
            <Modal 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)} 
                title={`Passenger Manifest - ${selectedSchedule?.bus?.busNumber || 'Bus'}`}
                width="800px"
            >
                <div className="manifest-container">
                    <div className="manifest-header">
                        <div className="m-info">
                            <span className="m-label">Journey Route</span>
                            <span className="m-value">{selectedSchedule?.route?.fromCity} to {selectedSchedule?.route?.toCity}</span>
                        </div>
                        <div className="m-info">
                            <span className="m-label">Scheduled Departure</span>
                            <span className="m-value">{selectedSchedule?.departureTime} | {new Date(selectedSchedule?.departureDate).toLocaleDateString()}</span>
                        </div>
                        <div className="m-info">
                            <span className="m-label">Status</span>
                            <span className={`badge ${selectedSchedule?.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>
                                {selectedSchedule?.status || 'Active'}
                            </span>
                        </div>
                    </div>

                    <div className="p-list">
                        <h3 className="section-title">Verified Manifest</h3>
                        {loadingPassengers ? (
                            <p className="loading-text">Loading passenger manifests...</p>
                        ) : passengers.length === 0 ? (
                            <p className="empty-text">No passenger bookings found for this trip.</p>
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
                                    style={{ marginTop: '20px' }}
                                >
                                    <Play size={15} />
                                    <span>Start Journey Now</span>
                                </button>
                            )}
                            {selectedSchedule?.status === 'in-progress' && (
                                <button 
                                    onClick={() => handleCompleteTrip(selectedSchedule._id)} 
                                    className="btn-primary w-full"
                                    style={{ marginTop: '20px' }}
                                >
                                    <CheckCircle2 size={15} />
                                    <span>Mark Trip as Completed</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            <style jsx>{`
                .page-container {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .page-title {
                    font-size: 26px;
                    font-weight: 800;
                    margin: 0;
                    color: var(--foreground);
                    letter-spacing: -0.025em;
                }
                .page-subtitle {
                    color: var(--text-muted);
                    margin: 6px 0 0 0;
                    font-size: 13px;
                }

                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
                
                .edit-info-banner { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 14px; background: rgba(255, 255, 255, 0.03); border-radius: var(--radius-md); margin-bottom: 16px; border: 1px solid var(--card-border); }
                .info-item { display: flex; flex-direction: column; gap: 4px; }
                .info-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
                .info-value { font-size: 13px; color: var(--foreground); font-weight: 600; }
                .edit-hint-note { font-size: 13px; color: var(--text-muted); background: var(--info-light); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(59, 130, 246, 0.25); margin-bottom: 18px; line-height: 1.4; display: flex; gap: 8px; align-items: flex-start; }

                .error-text { background: var(--danger-light); color: var(--danger); padding: 10px 14px; border-radius: var(--radius-md); font-size: 13px; margin-bottom: 16px; border: 1px solid rgba(239, 68, 68, 0.25); }
                
                .manifest-header { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 16px; background: var(--subtle-bg); border-radius: var(--radius-md); margin-bottom: 20px; border: 1px solid var(--card-border); }
                .m-info { display: flex; flex-direction: column; gap: 4px; }
                .m-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
                .m-value { font-size: 14px; color: var(--foreground); font-weight: 600; }
                
                .section-title { font-size: 13px; font-weight: 700; color: var(--foreground); margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.05em; border-left: 3px solid var(--primary); padding-left: 10px; }
                
                .p-table { width: 100%; border-collapse: collapse; }
                .p-table th { text-align: left; padding: 10px 12px; font-size: 11px; color: var(--text-secondary); border-bottom: 1px solid var(--card-border); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
                .p-table td { padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); font-size: 13px; color: var(--text-muted); }
                
                .seat-num { background: var(--primary-light); color: #a5b4fc; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 700; font-family: monospace; font-size: 12px; }
                .p-name { color: var(--foreground); font-weight: 600; }
                .p-cnic { font-family: monospace; color: var(--text-secondary); font-size: 12px; }
                
                .loading-text { color: var(--text-muted); text-align: center; padding: 32px; font-style: italic; }
                .empty-text { color: var(--text-secondary); text-align: center; padding: 32px; }
                
                .w-full { width: 100%; }
            `}</style>
        </main>
    );
}

