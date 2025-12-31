
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Images, Eye, X, ChevronLeft, ChevronRight, Download, Edit2, Save } from 'lucide-react';
import { Appointment, ScanHistoryEntry } from '../../types';

interface ScansOverviewProps {
    clinicalData: Partial<Appointment>;
    setClinicalData?: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
}

const ScansOverview: React.FC<ScansOverviewProps> = ({ clinicalData, setClinicalData }) => {
    const [previewScan, setPreviewScan] = useState<ScanHistoryEntry | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [editingScan, setEditingScan] = useState<ScanHistoryEntry | null>(null);
    const [editForm, setEditForm] = useState<{name: string, comment: string, date: string}>({ name: '', comment: '', date: '' });

    const openPreview = (scan: ScanHistoryEntry) => {
        if (scan.attachmentUrls && scan.attachmentUrls.length > 0) {
            setPreviewScan(scan);
            setCurrentSlideIndex(0);
        }
    };

    const nextSlide = () => {
        if (!previewScan?.attachmentUrls) return;
        setCurrentSlideIndex((prev) => (prev + 1) % previewScan.attachmentUrls!.length);
    };

    const prevSlide = () => {
        if (!previewScan?.attachmentUrls) return;
        setCurrentSlideIndex((prev) => (prev - 1 + previewScan.attachmentUrls!.length) % previewScan.attachmentUrls!.length);
    };

    const handleEditClick = (scan: ScanHistoryEntry) => {
        setEditingScan(scan);
        setEditForm({ name: scan.name, comment: scan.comment, date: scan.date });
    };

    const saveEdit = () => {
        if (editingScan && setClinicalData) {
            setClinicalData(prev => ({
                ...prev,
                scanHistory: prev.scanHistory?.map(s => s.id === editingScan.id ? { ...s, ...editForm } : s)
            }));
            setEditingScan(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Images size={16} className="text-neon-blue"/> Recorded Scans History
                </h4>
                <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-gray-500 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Scan Name</th>
                                <th className="p-4">Findings</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {clinicalData.scanHistory?.map((scan, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-gray-500">{scan.date}</td>
                                    <td className="p-4 text-white font-bold">{scan.name}</td>
                                    <td className="p-4 text-gray-300">{scan.comment}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {setClinicalData && (
                                                <button 
                                                    onClick={() => handleEditClick(scan)} 
                                                    className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                    title="Edit Details"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                            {scan.attachmentUrls && scan.attachmentUrls.length > 0 && (
                                                <button 
                                                    onClick={() => openPreview(scan)} 
                                                    className="p-2 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    <Eye size={16} />
                                                    <span className="text-xs font-bold uppercase hidden md:inline">Preview</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!clinicalData.scanHistory || clinicalData.scanHistory.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center italic">No scan history recorded.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal - Rendered via Portal to escape parent transforms */}
            {editingScan && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="absolute inset-0" onClick={() => setEditingScan(null)}></div>
                    <div className="relative w-full max-w-lg glass-panel rounded-2xl p-8 border border-neon-blue/20 shadow-[0_0_50px_-10px_rgba(0,243,255,0.2)] animate-slide-up">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <h3 className="text-xl font-bold text-white">Edit Scan Details</h3>
                            <button onClick={() => setEditingScan(null)} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase mb-1">Date</label>
                                <input 
                                    type="date" 
                                    value={editForm.date} 
                                    onChange={e => setEditForm({...editForm, date: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-neon-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase mb-1">Scan Name</label>
                                <input 
                                    type="text" 
                                    value={editForm.name} 
                                    onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-neon-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase mb-1">Findings / Comments</label>
                                <textarea 
                                    rows={4}
                                    value={editForm.comment} 
                                    onChange={e => setEditForm({...editForm, comment: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-neon-blue resize-none"
                                />
                            </div>
                            <button 
                                onClick={saveEdit} 
                                className="w-full py-3 bg-neon-blue text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Preview Modal - Rendered via Portal */}
            {previewScan && previewScan.attachmentUrls && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
                    <div className="absolute inset-0" onClick={() => setPreviewScan(null)}></div>
                    <div className="w-full max-w-5xl bg-black border border-white/10 rounded-2xl shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]">
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 z-20">
                            <div>
                                <h3 className="text-lg font-bold text-white">{previewScan.name}</h3>
                                <p className="text-xs text-gray-400">{previewScan.date} • {previewScan.attachmentUrls.length} Files</p>
                            </div>
                            <button onClick={() => setPreviewScan(null)} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Main Viewer */}
                        <div className="flex-1 relative bg-black flex items-center justify-center p-4 min-h-[400px]">
                            {/* Navigation Arrows */}
                            {previewScan.attachmentUrls.length > 1 && (
                                <>
                                    <button onClick={prevSlide} className="absolute left-4 z-10 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all border border-white/20">
                                        <ChevronLeft size={32} />
                                    </button>
                                    <button onClick={nextSlide} className="absolute right-4 z-10 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all border border-white/20">
                                        <ChevronRight size={32} />
                                    </button>
                                </>
                            )}
                            
                            {/* Image */}
                            <img 
                                src={previewScan.attachmentUrls[currentSlideIndex]} 
                                alt={`Scan ${currentSlideIndex + 1}`} 
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg" 
                            />
                            
                            <div className="absolute bottom-4 bg-black/60 px-4 py-2 rounded-full text-white text-sm font-bold border border-white/10 backdrop-blur-md">
                                {currentSlideIndex + 1} / {previewScan.attachmentUrls.length}
                            </div>
                        </div>

                        {/* Footer / Thumbnails */}
                        {previewScan.attachmentUrls.length > 1 && (
                            <div className="p-4 border-t border-white/10 bg-white/5 flex gap-2 overflow-x-auto custom-scrollbar z-20">
                                {previewScan.attachmentUrls.map((url, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setCurrentSlideIndex(idx)}
                                        className={`w-20 h-14 rounded-lg overflow-hidden cursor-pointer border-2 transition-all shrink-0 ${currentSlideIndex === idx ? 'border-neon-blue opacity-100 scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:border-white/30'}`}
                                    >
                                        <img src={url} alt="thumb" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Global Actions */}
                        <div className="absolute top-20 right-6 z-30">
                             <a 
                                href={previewScan.attachmentUrls[currentSlideIndex]} 
                                download={`Scan_${previewScan.name}_${currentSlideIndex+1}`}
                                className="p-3 bg-black/60 hover:bg-neon-blue hover:text-black text-white rounded-full border border-white/20 hover:border-neon-blue transition-all flex items-center justify-center shadow-lg"
                                title="Download Current File"
                             >
                                 <Download size={20} />
                             </a>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ScansOverview;
