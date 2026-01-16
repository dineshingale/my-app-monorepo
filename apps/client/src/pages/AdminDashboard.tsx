import { useState, useEffect } from 'react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'train' | 'claims'>('train');
    const [subTab, setSubTab] = useState<'authentic' | 'manual' | 'fraud'>('manual');
    const [file, setFile] = useState<File | null>(null);

    const getFilteredClaims = () => {
        let filtered = claims;
        // Default to showing all if no score (backwards compatibility), or filter by tab

        switch (subTab) {
            case 'fraud':
                filtered = claims.filter(c => (c.authenticity_score !== undefined && c.authenticity_score !== "" && c.authenticity_score <= 3) || c.Fraud_Risk === 'High');
                break;
            case 'manual':
                filtered = claims.filter(c => (c.authenticity_score === undefined || c.authenticity_score === "") || (c.authenticity_score > 3 && c.authenticity_score < 7));
                break;
            case 'authentic':
                filtered = claims.filter(c => c.authenticity_score !== undefined && c.authenticity_score !== "" && c.authenticity_score >= 7);
                break;
        }

        // Sort by Rank DESC
        return filtered.sort((a, b) => (b.rank_score || 0) - (a.rank_score || 0));
    };
    const [isTraining, setIsTraining] = useState(false);
    const [modelStatus, setModelStatus] = useState<any>(null);
    const [claims, setClaims] = useState<any[]>([]);

    useEffect(() => {
        fetchModelStatus();
        if (activeTab === 'claims') {
            fetchClaims();
        }
    }, [activeTab]);

    const fetchModelStatus = () => {
        fetch('http://localhost:8000/api/model/status')
            .then(res => res.json())
            .then(data => setModelStatus(data))
            .catch(err => console.error(err));
    };

    const fetchClaims = () => {
        fetch('http://localhost:8000/api/claims')
            .then(res => res.json())
            .then(data => setClaims(data))
            .catch(err => console.error(err));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleTrain = async () => {
        if (!file) return;
        setIsTraining(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/api/train', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                alert('Training Complete!');
                setModelStatus({ active: true, meta: data.meta });
            } else {
                alert('Training failed: ' + data.detail);
            }
        } catch (error) {
            console.error(error);
            alert('Training error');
        } finally {
            setIsTraining(false);
        }
    };

    const [selectedClaim, setSelectedClaim] = useState<any>(null);

    return (
        <div className="container">
            <div className="card">
                <h2 className="mb-4">🛡️ Admin Command Center</h2>

                <div className="flex mb-4" style={{ gap: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                    <button
                        className={activeTab === 'train' ? '' : 'secondary'}
                        onClick={() => setActiveTab('train')}
                        style={{ width: 'auto' }}
                    >
                        🧠 Train AI Brain
                    </button>
                    <button
                        className={activeTab === 'claims' ? '' : 'secondary'}
                        onClick={() => setActiveTab('claims')}
                        style={{ width: 'auto' }}
                    >
                        📊 View Claims
                    </button>
                </div>

                {activeTab === 'train' && (
                    <div>
                        <h3>Upload Training Data</h3>
                        <p className="subtitle">Upload a CSV containing historical claims (Description, Policy_Type, Amount, Customer_Tenure).</p>

                        <div className="mb-4">
                            <input type="file" onChange={handleFileChange} accept=".csv" />
                        </div>

                        <button onClick={handleTrain} disabled={isTraining || !file} style={{ maxWidth: '200px' }}>
                            {isTraining ? 'Training...' : '🚀 Train Model Now'}
                        </button>

                        {modelStatus && (
                            <div className="details mt-4">
                                <h4>Current Model Status</h4>
                                {modelStatus.active ? (
                                    <>
                                        <p><span className="success">Active</span></p>
                                        <p><strong>Trained At:</strong> <span>{modelStatus.meta?.timestamp}</span></p>
                                        <p><strong>Training Count:</strong> <span>{modelStatus.meta?.training_count}</span></p>
                                    </>
                                ) : (
                                    <p className="danger">No model active. Please train the system.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'claims' && (
                    <div>
                        <div className="flex mb-4 justify-between items-center">
                            <h3>Submitted Claims Log</h3>
                            <button
                                onClick={() => {
                                    const data = getFilteredClaims();
                                    if (data.length === 0) {
                                        alert("No claims to export.");
                                        return;
                                    }
                                    const headers = Object.keys(data[0]);
                                    const csvContent = [
                                        headers.join(","),
                                        ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? "" : value)).join(","))
                                    ].join("\n");

                                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", url);
                                    link.setAttribute("download", `claims_export_${new Date().toISOString().slice(0, 19).replace(/:/g, "")}.csv`);
                                    link.style.visibility = 'hidden';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.9rem',
                                    width: 'auto',
                                    backgroundColor: '#10B981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                📥 Export to CSV
                            </button>
                        </div>

                        {/* CLASSIFICATION TABS */}
                        <div className="flex mb-4" style={{ gap: '0.5rem' }}>
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === 'manual'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                onClick={() => setSubTab('manual')}
                                style={{
                                    background: subTab === 'manual' ? '#FEF3C7' : '#fff',
                                    color: subTab === 'manual' ? '#92400E' : '#64748B',
                                    border: subTab === 'manual' ? '1px solid #FCD34D' : '1px solid #E2E8F0',
                                    width: 'auto'
                                }}
                            >
                                ✋ Manual Check Needed
                            </button>
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                                onClick={() => setSubTab('authentic')}
                                style={{
                                    background: subTab === 'authentic' ? '#D1FAE5' : '#fff',
                                    color: subTab === 'authentic' ? '#065F46' : '#64748B',
                                    border: subTab === 'authentic' ? '1px solid #6EE7B7' : '1px solid #E2E8F0',
                                    width: 'auto'
                                }}
                            >
                                ✅ Authentic
                            </button>
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                                onClick={() => setSubTab('fraud')}
                                style={{
                                    background: subTab === 'fraud' ? '#FEE2E2' : '#fff',
                                    color: subTab === 'fraud' ? '#991B1B' : '#64748B',
                                    border: subTab === 'fraud' ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
                                    width: 'auto'
                                }}
                            >
                                🚨 Fraud
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                <thead>
                                    <tr style={{ background: '#f5f7fb', textAlign: 'left' }}>
                                        <th style={{ padding: '0.75rem' }}>ID</th>
                                        <th style={{ padding: '0.75rem' }}>Auth</th>
                                        <th style={{ padding: '0.75rem' }}>Prio</th>
                                        <th style={{ padding: '0.75rem' }}>Rank</th>
                                        <th style={{ padding: '0.75rem' }}>Category</th>
                                        <th style={{ padding: '0.75rem' }}>Amount</th>
                                        <th style={{ padding: '0.75rem' }}>Risk</th>
                                        <th style={{ padding: '0.75rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFilteredClaims().length === 0 ? (
                                        <tr><td colSpan={8} style={{ padding: '1rem', textAlign: 'center' }}>No claims in this category.</td></tr>
                                    ) : (
                                        getFilteredClaims().map((claim, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => setSelectedClaim(claim)} className="hover:bg-slate-50">
                                                <td style={{ padding: '0.75rem' }}>{claim.Customer_ID}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                                        background: claim.authenticity_score >= 7 ? '#D1FAE5' : claim.authenticity_score <= 3 ? '#FEE2E2' : '#FEF3C7',
                                                        color: claim.authenticity_score >= 7 ? '#065F46' : claim.authenticity_score <= 3 ? '#991B1B' : '#92400E'
                                                    }}>{claim.authenticity_score ?? '-'}</span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>{claim.priority_score ?? '-'}</td>
                                                <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{claim.rank_score ?? '-'}</td>
                                                <td style={{ padding: '0.75rem' }}>{claim.Category}</td>
                                                <td style={{ padding: '0.75rem' }}>${claim.Amount}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        color: claim.Fraud_Risk === 'High' ? 'var(--color-danger)' : 'var(--color-success)',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {claim.Fraud_Risk}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <button className="secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}>View</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {selectedClaim && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setSelectedClaim(null)}>
                    <div className="card" style={{ maxWidth: '600px', width: '100%', margin: '20px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3>Claim Details</h3>
                            <button onClick={() => setSelectedClaim(null)} style={{ width: 'auto', background: 'transparent', color: '#000', padding: '5px' }}>✕</button>
                        </div>

                        <div className="details">
                            <p><strong>Customer ID:</strong> <span>{selectedClaim.Customer_ID}</span></p>
                            <p><strong>Category:</strong> <span>{selectedClaim.Category}</span></p>
                            <p><strong>Amount:</strong> <span>${selectedClaim.Amount}</span></p>
                            <p><strong>Tenure:</strong> <span>{selectedClaim.Tenure} Years</span></p>
                            <div className="flex justify-between" style={{ borderBottom: '1px solid #eee', marginTop: '10px', paddingBottom: '10px' }}>
                                <div className="text-center">
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Authenticity</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedClaim.authenticity_score ?? '-'}</div>
                                </div>
                                <div className="text-center">
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Priority</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedClaim.priority_score ?? '-'}</div>
                                </div>
                                <div className="text-center">
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Rank</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3B82F6' }}>{selectedClaim.rank_score ?? '-'}</div>
                                </div>
                            </div>
                            <p><strong>Date:</strong> <span>{selectedClaim.Timestamp}</span></p>
                            <p><strong>Fraud Risk:</strong> <span style={{ color: selectedClaim.Fraud_Risk === 'High' ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'bold' }}>{selectedClaim.Fraud_Risk}</span></p>
                            <p><strong>Anomaly Score:</strong> <span>{selectedClaim.Anomaly_Score ? Number(selectedClaim.Anomaly_Score).toFixed(4) : '-'}</span></p>
                        </div>

                        <div className="mt-4">
                            <strong>Description:</strong>
                            <p style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #eee', marginTop: '5px' }}>
                                {selectedClaim.Description}
                            </p>
                        </div>

                        <div className="flex mt-4" style={{ gap: '10px' }}>
                            <button className="secondary" onClick={() => setSelectedClaim(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}
