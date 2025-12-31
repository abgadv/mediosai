
import React, { useMemo, useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Users, Clock, Megaphone, Stethoscope, Activity, Monitor, Bell, Sparkles } from 'lucide-react';

const PublicLiveViewAR: React.FC = () => {
    const { appointments, doctorStatus, callingPatientId, hasAssistantDoctor, assistantDoctorStatus, callingPatientIdAssistant } = useData();
    const { firebaseUser } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    const clinicName = firebaseUser?.displayName || 'العيادة';

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const pt = appointments.find(a => (a.id === callingPatientId || a.id === callingPatientIdAssistant) && a.status === 'checked-in');
        if (pt) {
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                audio.volume = 0.5; audio.play().catch(e => {});
            } catch (e) {}
        }
    }, [callingPatientId, callingPatientIdAssistant, appointments]);

    const liveQueue = useMemo(() => 
        appointments
            .filter(a => a.status === 'checked-in')
            .sort((a, b) => (a.queueOrder ?? 9999) - (b.queueOrder ?? 9999))
            .slice(0, 10), 
    [appointments]);

    const callingPatient = useMemo(() => appointments.find(a => a.id === callingPatientId && a.status === 'checked-in'), [appointments, callingPatientId]);
    const callingAssistantPatient = useMemo(() => appointments.find(a => a.id === callingPatientIdAssistant && a.status === 'checked-in'), [appointments, callingPatientIdAssistant]);
    
    const displayCalling = callingPatient || callingAssistantPatient;

    const inExam = useMemo(() => appointments.find(a => a.status === 'in-exam'), [appointments]);

    const roomInfo = useMemo(() => {
        if (doctorStatus === 'resting') return { label: 'في استراحة', color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/50', iconColor: 'bg-red-500', animate: false };
        if (inExam) return { label: 'في جلسة فحص', color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/50', iconColor: 'bg-orange-500', animate: true };
        if (callingPatient) return { label: 'في انتظار المريض', color: 'text-neon-blue', bgColor: 'bg-neon-blue/10', borderColor: 'border-neon-blue/50', iconColor: 'bg-neon-blue', animate: true };
        return { label: 'متاح الآن', color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/50', iconColor: 'bg-green-500', animate: true };
    }, [doctorStatus, inExam, callingPatient]);

    return (
        <div className="h-screen w-screen bg-[#020202] text-white flex flex-col overflow-hidden p-8 font-arabic selection:bg-neon-blue selection:text-black" dir="rtl">
            <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="flex justify-between items-center mb-10 shrink-0 border-b border-white/10 pb-6 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-2xl border border-white/20">
                        <Activity size={40} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter">{clinicName} <span className="text-neon-blue">OS</span></h1>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">المراقبة الذكية لتدفق المرضى</p>
                    </div>
                </div>
                <div className="text-left">
                    <div className="text-5xl font-mono font-black text-white tracking-tighter" dir="ltr">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-neon-blue font-black text-xl mt-1 drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">
                      {currentTime.toLocaleDateString('ar-EG', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-10 min-h-0 relative z-10">
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-10">
                    <div className={`flex-1 rounded-[40px] border-4 p-10 flex flex-col items-center justify-center text-center transition-all duration-1000 relative overflow-hidden ${displayCalling ? 'border-neon-blue bg-neon-blue/10 shadow-[0_0_100px_-20px_rgba(0,243,255,0.4)] scale-[1.02]' : 'border-white/5 bg-white/5 opacity-40'}`}>
                        {displayCalling && (
                            <>
                                <div className="absolute top-0 right-0 w-full h-3 bg-neon-blue animate-pulse"></div>
                                <div className="relative">
                                    <div className="p-10 bg-neon-blue/20 rounded-full mb-8 animate-bounce-slow border border-neon-blue/30 shadow-[0_0_40px_rgba(0,243,255,0.3)]">
                                        <Megaphone size={100} className="text-neon-blue drop-shadow-[0_0_15px_rgba(0,243,255,0.8)]" />
                                    </div>
                                    <div className="absolute -top-2 -left-2 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-ping"><Bell size={20} fill="white" /></div>
                                </div>
                                <h2 className="text-3xl font-black text-neon-blue uppercase tracking-[0.3em] mb-6 animate-pulse">يتفـضل الأستـاذ /</h2>
                                <div className="bg-black/60 px-10 py-6 rounded-[30px] border-4 border-neon-blue/50 mb-8 backdrop-blur-md shadow-2xl relative">
                                    <h1 className="text-7xl font-black text-white drop-shadow-[0_0_30px_rgba(0,243,255,0.8)] tracking-tight">{displayCalling.name}</h1>
                                </div>
                                <p className="text-gray-300 text-3xl font-bold">بالتـوجه إلى <span className="text-white border-b-2 border-neon-blue pb-1 shadow-[0_2px_10px_rgba(0,243,255,0.5)]">{callingPatient ? 'غرفة الفحص' : 'الطبيب المساعد'}</span></p>
                            </>
                        )}
                        {!displayCalling && <div className="text-gray-600"> <Monitor size={120} className="mx-auto mb-8 opacity-10" /> <h2 className="text-5xl font-black uppercase tracking-widest opacity-20">نظام المراقبة</h2> </div>}
                    </div>

                    <div className={`rounded-[30px] p-10 border-2 flex items-center justify-between transition-all duration-500 ${roomInfo.bgColor} ${roomInfo.borderColor} shadow-2xl`}>
                        <div className="flex items-center gap-8">
                            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center border-2 ${roomInfo.iconColor} border-white/20 text-white shadow-xl`}>
                                <Stethoscope size={56} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-gray-400 text-xl font-black uppercase mb-2">غرفة الفحص</h3>
                                <p className={`text-5xl font-black tracking-tighter ${roomInfo.color} drop-shadow-[0_0_10px_currentColor]`}>
                                    {roomInfo.label}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Assistant Room Status - Only if exists */}
                    {hasAssistantDoctor && (
                        <div className={`rounded-[30px] p-8 border-2 flex items-center justify-between transition-all duration-500 ${assistantDoctorStatus === 'available' ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${assistantDoctorStatus === 'available' ? 'bg-green-500 text-black border-green-500' : 'bg-red-500 text-white border-red-500'} shadow-lg`}>
                                    <Stethoscope size={32} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-[0.2em] mb-1">غرفة الطبيب المساعد</h3>
                                    <p className={`text-3xl font-black uppercase tracking-tighter ${assistantDoctorStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                                        {assistantDoctorStatus === 'available' ? 'متاح الآن' : 'في استراحة'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="col-span-12 lg:col-span-7 bg-white/5 rounded-[40px] border border-white/10 p-10 flex flex-col relative overflow-hidden shadow-2xl backdrop-blur-md">
                    <div className="flex justify-between items-center mb-10 shrink-0">
                        <h3 className="text-4xl font-black text-white flex items-center gap-6">
                            <Users size={48} className="text-neon-blue" /> دور الانتظار
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-neon-blue rounded-full animate-pulse shadow-[0_0_10px_#00f3ff]"></div>
                            <span className="bg-neon-blue/10 text-neon-blue px-8 py-3 rounded-full font-black text-2xl border border-neon-blue/30 shadow-2xl">
                                {liveQueue.length} فـي الانتظار
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6 overflow-hidden">
                        {liveQueue.map((pt, idx) => {
                            const isBeingCalled = callingPatientId === pt.id || callingPatientIdAssistant === pt.id;
                            const isCallingAssistant = callingPatientIdAssistant === pt.id;

                            return (
                                <div key={pt.id} className={`p-8 rounded-[30px] flex justify-between items-center border transition-all duration-700 animate-slide-up ${isBeingCalled && !inExam ? 'bg-neon-blue text-black border-neon-blue scale-[1.03] shadow-[0_0_50px_rgba(0,243,255,0.6)] z-20' : 'bg-white/5 border-white/10'}`}>
                                    <div className="flex items-center gap-10">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl border-2 transition-colors ${isBeingCalled && !inExam ? 'bg-black text-neon-blue border-black' : 'bg-gray-800 text-gray-500 border-white/5'}`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className={`text-5xl font-black tracking-tight ${isBeingCalled && !inExam ? 'text-black' : 'text-white'}`}>{pt.name}</h4>
                                            <div className={`text-xs font-bold mt-2 tracking-widest uppercase ${isBeingCalled && !inExam ? 'text-black/60' : 'text-gray-500'}`}>Appointment Holder {isCallingAssistant && "(مساعد)"}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-4">
                                            <Clock size={32} className={isBeingCalled && !inExam ? 'text-black' : 'text-gray-500'} />
                                            <span className={`text-4xl font-mono font-black ${isBeingCalled && !inExam ? 'text-black' : 'text-neon-blue'}`} dir="ltr">{pt.time}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-10 border-t border-white/10 pt-8 overflow-hidden whitespace-nowrap relative shrink-0">
                        <div className="inline-block animate-marquee-fast text-gray-500 font-bold uppercase tracking-[0.3em] text-2xl">
                            • أهلاً بكم في {clinicName} • رعاية طبية متميزة بتقنيات الجيل القادم • يرجى تجهيز هاتفك لسرعة تسجيل الحضور • نتمنى لكم الشفاء العاجل • 
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes marquee-fast { 0% { transform: translateX(0); } 100% { transform: translateX(50%); } }
                .animate-marquee-fast { animation: marquee-fast 20s linear infinite; display: inline-block; }
                @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
                .animate-bounce-slow { animation: bounce-slow 2.5s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default PublicLiveViewAR;
