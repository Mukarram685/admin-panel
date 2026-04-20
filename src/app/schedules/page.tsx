<<<<<<< HEAD
"use client";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/utils/api";
import DataTable from "@/component/DataTable/DataTable";
import Modal from "@/component/Modal/Modal";

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
    const [availableBuses, setAvailableBuses] = useState<any[]>([]);
    const [availableOperators, setAvailableOperators] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const loadSchedules = async () => {
        try {
            setLoading(true);
            const res = await fetchAPI("/schedules/company");
            setSchedules(res.data || res.schedules || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadDropdowns = async () => {
        try {
            const [routesRes, busesRes, operatorsRes] = await Promise.all([
                fetchAPI("/routes/allRoutes"),
                fetchAPI("/buses/company"),
                fetchAPI("/operator/company")
            ]);
            const rts = routesRes.data || routesRes.routes || [];
            const bss = busesRes.buses || busesRes.data || [];
            const ops = operatorsRes.operators || operatorsRes.data || [];
            
            setAvailableRoutes(rts);
            setAvailableBuses(bss);
            setAvailableOperators(ops);

            if (rts.length > 0 && !formData.routeId) setFormData(prev => ({ ...prev, routeId: rts[0]._id }));
            if (bss.length > 0 && !formData.busId) setFormData(prev => ({ ...prev, busId: bss[0]._id }));
            if (ops.length > 0 && !formData.operatorId) setFormData(prev => ({ ...prev, operatorId: ops[0]._id }));
        } catch (err) {
            console.error("Failed to load reference data", err);
        }
    };

    useEffect(() => {
        loadSchedules();
        loadDropdowns();
    }, []);

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

    const columns = [
        {
            key: "route", header: "Route", render: (r: any) => (
                r.route ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{r.route.fromCity} → {r.route.toCity}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{r.route.from} to {r.route.to}</span>
                    </div>
                ) : "N/A"
            )
        },
        { key: "bus", header: "Bus", render: (r: any) => r.bus ? `${r.bus.busNumber} (${r.bus.type})` : "N/A" },
        { 
            key: "operator", 
            header: "Operator", 
            render: (r: any) => {
                if (!r.operator) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>;
                
                // Handle populated object
                if (typeof r.operator === 'object' && r.operator.name) {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{r.operator.name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{r.operator.email}</span>
                        </div>
                    );
                }
                
                // Handle case where it's just an ID (not populated)
                return <span style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {String(r.operator).substring(0, 8)}...</span>;
            }
        },
        { key: "departureDate", header: "Date", render: (r: any) => new Date(r.departureDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) },
        { 
            key: "time", header: "Time", render: (r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#f8fafc' }}>{r.departureTime}</span>
                    <span style={{ color: '#475569' }}>→</span>
                    <span style={{ color: '#94a3b8' }}>{r.arrivalTime}</span>
                </div>
            )
        },
        { key: "fare", header: "Fare", render: (r: any) => <span style={{ fontWeight: 700, color: '#10b981' }}>Rs {r.fare}</span> },
        {
            key: "status", header: "Status", render: (r: any) => (
                <span className={`status-badge ${r.status || 'scheduled'}`}>
                    {r.status || 'Scheduled'}
                </span>
            )
        }
    ];

    return (
        <main className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Schedules Management</h1>
                    <p className="page-subtitle">Coordinate bus departures and manage route timings.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                    + Create Schedule
                </button>
            </header>

            <DataTable 
                title="Upcoming Departures" 
                columns={columns} 
                data={schedules} 
                loading={loading} 
            />

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="Dispatch New Schedule"
            >
                <form onSubmit={handleCreate}>
                    {error && <div className="error-text">{error}</div>}

                    <div className="form-group">
                        <label>Select Route</label>
                        <select required className="form-input" value={formData.routeId} onChange={e => setFormData({ ...formData, routeId: e.target.value })}>
                            <option value="" disabled>Choose a route...</option>
                            {availableRoutes.map(r => <option key={r._id} value={r._id}>{r.fromCity} -&gt; {r.toCity} ({r.distance}km)</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Select Bus</label>
                        <select required className="form-input" value={formData.busId} onChange={e => setFormData({ ...formData, busId: e.target.value })}>
                            <option value="" disabled>Choose a bus...</option>
                            {availableBuses.map(b => <option key={b._id} value={b._id}>{b.busNumber} - {b.type} ({b.totalSeats} seats)</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Select Operator</label>
                        <select required className="form-input" value={formData.operatorId} onChange={e => setFormData({ ...formData, operatorId: e.target.value })}>
                            <option value="" disabled>Choose an operator...</option>
                            {availableOperators.map(o => <option key={o._id} value={o._id}>{o.name} ({o.email})</option>)}
                        </select>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Departure Date</label>
                            <input type="date" required className="form-input" value={formData.departureDate} onChange={e => setFormData({ ...formData, departureDate: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Fare (Rs)</label>
                            <input type="number" required min={100} className="form-input" value={formData.fare} onChange={e => setFormData({ ...formData, fare: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Departure Time</label>
                            <input type="time" required className="form-input" value={formData.departureTime} onChange={e => setFormData({ ...formData, departureTime: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Arrival Time</label>
                            <input type="time" required className="form-input" value={formData.arrivalTime} onChange={e => setFormData({ ...formData, arrivalTime: e.target.value })} />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={creating} className="btn-primary">
                            {creating ? 'Dispatching...' : 'Dispatch Schedule'}
                        </button>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
                .page-container { padding: 32px; }
                .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
                .page-title { font-size: 32px; font-weight: 800; margin: 0; color: #f8fafc; letter-spacing: -0.025em; }
                .page-subtitle { color: #94a3b8; margin: 4px 0 0 0; font-size: 15px; }
                
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
                .form-group { margin-bottom: 20px; }
                .form-group label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .form-input { width: 100%; padding: 12px 16px; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--card-border); border-radius: 12px; color: white; outline: none; transition: all 0.2s; }
                .form-input:focus { border-color: var(--primary); background: rgba(0, 0, 0, 0.3); }
                
                .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
                .btn-secondary { background: transparent; border: 1px solid var(--card-border); color: #94a3b8; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
                .btn-secondary:hover { background: rgba(255, 255, 255, 0.05); color: white; }
                
                .error-text { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 12px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.2); }
                
                .status-badge { padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
                .status-badge.scheduled { background: rgba(79, 70, 229, 0.1); color: #818cf8; }
                .status-badge.completed { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .status-badge.cancelled { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
            `}</style>
        </main>
    );
}

=======
"use client";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/utils/api";
import DataTable from "@/component/DataTable/DataTable";
import Modal from "@/component/Modal/Modal";

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
    const [availableBuses, setAvailableBuses] = useState<any[]>([]);
    const [availableOperators, setAvailableOperators] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const loadSchedules = async () => {
        try {
            setLoading(true);
            const res = await fetchAPI("/schedules/company");
            setSchedules(res.data || res.schedules || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadDropdowns = async () => {
        try {
            const [routesRes, busesRes, operatorsRes] = await Promise.all([
                fetchAPI("/routes/allRoutes"),
                fetchAPI("/buses/company"),
                fetchAPI("/operator/company")
            ]);
            const rts = routesRes.data || routesRes.routes || [];
            const bss = busesRes.buses || busesRes.data || [];
            const ops = operatorsRes.operators || operatorsRes.data || [];
            
            setAvailableRoutes(rts);
            setAvailableBuses(bss);
            setAvailableOperators(ops);

            if (rts.length > 0 && !formData.routeId) setFormData(prev => ({ ...prev, routeId: rts[0]._id }));
            if (bss.length > 0 && !formData.busId) setFormData(prev => ({ ...prev, busId: bss[0]._id }));
            if (ops.length > 0 && !formData.operatorId) setFormData(prev => ({ ...prev, operatorId: ops[0]._id }));
        } catch (err) {
            console.error("Failed to load reference data", err);
        }
    };

    useEffect(() => {
        loadSchedules();
        loadDropdowns();
    }, []);

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

    const columns = [
        {
            key: "route", header: "Route", render: (r: any) => (
                r.route ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{r.route.fromCity} → {r.route.toCity}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{r.route.from} to {r.route.to}</span>
                    </div>
                ) : "N/A"
            )
        },
        { key: "bus", header: "Bus", render: (r: any) => r.bus ? `${r.bus.busNumber} (${r.bus.type})` : "N/A" },
        { 
            key: "operator", 
            header: "Operator", 
            render: (r: any) => {
                if (!r.operator) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>;
                
                // Handle populated object
                if (typeof r.operator === 'object' && r.operator.name) {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{r.operator.name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{r.operator.email}</span>
                        </div>
                    );
                }
                
                // Handle case where it's just an ID (not populated)
                return <span style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {String(r.operator).substring(0, 8)}...</span>;
            }
        },
        { key: "departureDate", header: "Date", render: (r: any) => new Date(r.departureDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) },
        { 
            key: "time", header: "Time", render: (r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#f8fafc' }}>{r.departureTime}</span>
                    <span style={{ color: '#475569' }}>→</span>
                    <span style={{ color: '#94a3b8' }}>{r.arrivalTime}</span>
                </div>
            )
        },
        { key: "fare", header: "Fare", render: (r: any) => <span style={{ fontWeight: 700, color: '#10b981' }}>Rs {r.fare}</span> },
        {
            key: "status", header: "Status", render: (r: any) => (
                <span className={`status-badge ${r.status || 'scheduled'}`}>
                    {r.status || 'Scheduled'}
                </span>
            )
        }
    ];

    return (
        <main className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Schedules Management</h1>
                    <p className="page-subtitle">Coordinate bus departures and manage route timings.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                    + Create Schedule
                </button>
            </header>

            <DataTable 
                title="Upcoming Departures" 
                columns={columns} 
                data={schedules} 
                loading={loading} 
            />

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="Dispatch New Schedule"
            >
                <form onSubmit={handleCreate}>
                    {error && <div className="error-text">{error}</div>}

                    <div className="form-group">
                        <label>Select Route</label>
                        <select required className="form-input" value={formData.routeId} onChange={e => setFormData({ ...formData, routeId: e.target.value })}>
                            <option value="" disabled>Choose a route...</option>
                            {availableRoutes.map(r => <option key={r._id} value={r._id}>{r.fromCity} -&gt; {r.toCity} ({r.distance}km)</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Select Bus</label>
                        <select required className="form-input" value={formData.busId} onChange={e => setFormData({ ...formData, busId: e.target.value })}>
                            <option value="" disabled>Choose a bus...</option>
                            {availableBuses.map(b => <option key={b._id} value={b._id}>{b.busNumber} - {b.type} ({b.totalSeats} seats)</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Select Operator</label>
                        <select required className="form-input" value={formData.operatorId} onChange={e => setFormData({ ...formData, operatorId: e.target.value })}>
                            <option value="" disabled>Choose an operator...</option>
                            {availableOperators.map(o => <option key={o._id} value={o._id}>{o.name} ({o.email})</option>)}
                        </select>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Departure Date</label>
                            <input type="date" required className="form-input" value={formData.departureDate} onChange={e => setFormData({ ...formData, departureDate: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Fare (Rs)</label>
                            <input type="number" required min={100} className="form-input" value={formData.fare} onChange={e => setFormData({ ...formData, fare: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Departure Time</label>
                            <input type="time" required className="form-input" value={formData.departureTime} onChange={e => setFormData({ ...formData, departureTime: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Arrival Time</label>
                            <input type="time" required className="form-input" value={formData.arrivalTime} onChange={e => setFormData({ ...formData, arrivalTime: e.target.value })} />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={creating} className="btn-primary">
                            {creating ? 'Dispatching...' : 'Dispatch Schedule'}
                        </button>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
                .page-container { padding: 32px; }
                .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
                .page-title { font-size: 32px; font-weight: 800; margin: 0; color: #f8fafc; letter-spacing: -0.025em; }
                .page-subtitle { color: #94a3b8; margin: 4px 0 0 0; font-size: 15px; }
                
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
                .form-group { margin-bottom: 20px; }
                .form-group label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .form-input { width: 100%; padding: 12px 16px; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--card-border); border-radius: 12px; color: white; outline: none; transition: all 0.2s; }
                .form-input:focus { border-color: var(--primary); background: rgba(0, 0, 0, 0.3); }
                
                .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
                .btn-secondary { background: transparent; border: 1px solid var(--card-border); color: #94a3b8; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
                .btn-secondary:hover { background: rgba(255, 255, 255, 0.05); color: white; }
                
                .error-text { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 12px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.2); }
                
                .status-badge { padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
                .status-badge.scheduled { background: rgba(79, 70, 229, 0.1); color: #818cf8; }
                .status-badge.completed { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .status-badge.cancelled { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
            `}</style>
        </main>
    );
}

>>>>>>> 86ee75c02c0583956c087c6cf678380e698c0661
