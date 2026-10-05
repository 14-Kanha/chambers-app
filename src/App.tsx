import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, Briefcase, Calendar, CheckCircle2, Search, 
  Users, Plus, Filter, Clock, LogOut, ChevronRight, ChevronLeft, Download, 
  FileCheck, Edit3, X, AlertCircle, ArrowRight, Layers,
  Mail, Lock, User, Square, Mic, Loader2, CalendarDays
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut,
  setPersistence, browserLocalPersistence, browserSessionPersistence
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, updateDoc, query, where, getDocs 
} from 'firebase/firestore';

const getEnvVar = (viteKey, nextKey) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    return import.meta.env[viteKey];
  }
  if (typeof process !== 'undefined' && process.env && process.env[nextKey]) {
    return process.env[nextKey];
  }
  return '';
};

let firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID')
};

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
  }
} catch (e) {
  console.error("Firebase config parsing error", e);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'chambers-prod-app';

const ROLE_HIERARCHY = {
  'SENIOR_ADVOCATE': 4,
  'MANAGER': 3,
  'EMPLOYEE': 2,
  'INTERN': 1,
  'PENDING': -1,
  'FIRED': -2,
  'CLIENT': 0
};

const ROLE_CONFIG = {
  'SENIOR_ADVOCATE': { label: 'Senior Advocate', bg: 'bg-[#4F46E5]', text: 'text-white' },
  'MANAGER': { label: 'Office Manager', bg: 'bg-[#0284C7]', text: 'text-white' },
  'EMPLOYEE': { label: 'Associate', bg: 'bg-[#059669]', text: 'text-white' },
  'INTERN': { label: 'Intern', bg: 'bg-[#D97706]', text: 'text-white' },
  'PENDING': { label: 'Pending Approval', bg: 'bg-gray-200', text: 'text-gray-700' },
  'FIRED': { label: 'Terminated', bg: 'bg-red-100', text: 'text-red-700' }
};

const Card = ({ children, className = "", onClick, ...props }) => (
  <div 
    onClick={onClick} 
    className={`bg-white border border-[#E5E5E5] rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''} ${className}`} 
    {...props}
  >
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', type = 'button', className = "", disabled = false }) => {
  const base = "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100";
  const styles = variant === 'primary' 
    ? `${base} bg-[#111111] text-white hover:bg-black shadow-sm`
    : variant === 'danger' 
    ? `${base} bg-red-600 text-white hover:bg-red-700 shadow-sm`
    : `${base} bg-white text-[#111111] border border-[#E5E5E5] hover:bg-gray-50 hover:border-black shadow-sm`;
  return <button type={type} onClick={onClick} disabled={disabled} className={`${styles} ${className}`}>{children}</button>;
};

const RoleBadge = ({ role }) => {
  const config = ROLE_CONFIG[role] || { label: role, bg: 'bg-gray-100', text: 'text-gray-800' };
  return <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded ${config.bg} ${config.text}`}>{config.label}</span>;
};

const Modal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden border border-[#E5E5E5] animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E5E5] bg-gray-50/80 backdrop-blur-md shrink-0">
          <h3 className="font-bold text-base tracking-tight">{title}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-black"><X className="w-4 h-4"/></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const SidebarItem = ({ id, name, icon: Icon, activeTab, onClick }) => {
  const active = activeTab === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
        active ? 'bg-[#111111] text-white shadow-sm' : 'text-gray-600 hover:bg-[#F0F0F0] hover:text-black'
      }`}
    >
      <Icon className={`w-4 h-4 mr-3 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}/>
      {name}
    </button>
  );
};

const SplashLoader = () => (
  <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center animate-in fade-in duration-500 z-50">
    <div className="relative flex items-center justify-center w-20 h-20 bg-[#111111] rounded-2xl shadow-xl animate-pulse">
      <Scale className="w-10 h-10 text-white" />
    </div>
    <div className="mt-8 flex items-center space-x-2 text-sm font-bold tracking-[0.2em] text-gray-400 uppercase">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Loading Workspace</span>
    </div>
  </div>
);

const AuthView = ({ mode, setMode, onLogin, onCreateOffice, onJoinOffice, onTrackCase, onResetPassword, goBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessAnim, setIsSuccessAnim] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await onLogin(email, password, rememberMe);
        setIsSuccessAnim(true);
      } else if (mode === 'signup') {
        await onCreateOffice(name, email, password, officeName);
        setIsSuccessAnim(true);
      } else if (mode === 'join') {
        await onJoinOffice(name, email, password, inviteCode);
        setIsSuccessAnim(true);
      } else if (mode === 'track') {
        await onTrackCase(trackingNumber);
      } else if (mode === 'reset') {
        await onResetPassword(email);
        setSuccessMsg("If an account exists, a password reset link has been sent to your email.");
      }
    } catch (err) {
      setErrorMsg(err.message || "An error occurred. Please try again.");
    } finally {
      if (mode === 'reset' || mode === 'track' || errorMsg) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col justify-center items-center p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={goBack} className="absolute top-6 left-6 flex items-center text-sm font-medium text-gray-500 hover:text-black transition-colors group">
        <ChevronRight className="w-4 h-4 mr-1 rotate-180 group-hover:-translate-x-1 transition-transform"/> Back to Home
      </button>
      <div className="p-8 max-w-md w-full shadow-2xl bg-white border border-[#E5E5E5] rounded-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-black p-2 rounded-lg"><Scale className="w-5 h-5 text-white"/></div>
          <h2 className="text-xl font-bold tracking-tight">Chambers</h2>
        </div>
        <div className="mb-8">
          <h3 className="text-2xl font-bold tracking-tight mb-2 text-[#111111]">
            {mode === 'login' && 'Log in to workspace'}
            {mode === 'signup' && 'Create law chambers'}
            {mode === 'join' && 'Join an existing office'}
            {mode === 'track' && 'Client Case Tracking'}
            {mode === 'reset' && 'Reset your password'}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {mode === 'login' && 'Enter your credentials to securely access your cases and team tasks.'}
            {mode === 'signup' && 'Set up your practice workspace and invite your team.'}
            {mode === 'join' && 'Enter the invite code provided by your chambers administrator.'}
            {mode === 'track' && 'Enter the tracking code provided by your advocate to view updates.'}
            {mode === 'reset' && 'Enter your email to receive a secure reset link.'}
          </p>
        </div>

        {errorMsg && <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-start animate-in fade-in slide-in-from-top-2"><AlertCircle className="w-4 h-4 mr-2.5 shrink-0 mt-0.5"/> <span>{errorMsg}</span></div>}
        {successMsg && <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100 flex items-start animate-in fade-in slide-in-from-top-2"><CheckCircle2 className="w-4 h-4 mr-2.5 shrink-0 mt-0.5"/> <span>{successMsg}</span></div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'track' ? (
            <div>
              <label htmlFor="auth-tracking-input" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Client Tracking Code</label>
              <input id="auth-tracking-input" name="trackingNumber" required type="text" value={trackingNumber} onChange={e=>setTrackingNumber(e.target.value)} placeholder="e.g. TRK-ABC123" className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-mono uppercase transition-all" />
            </div>
          ) : (
            <>
              {(mode === 'signup' || mode === 'join') && (
                <div>
                  <label htmlFor="auth-name-input" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input id="auth-name-input" name="name" required type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Priya Sharma" className="w-full pl-10 pr-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all" />
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="auth-email-input" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input id="auth-email-input" name="email" required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@chambers.com" className="w-full pl-10 pr-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all" />
                </div>
              </div>
              
              {mode !== 'reset' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="auth-password-input" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Password</label>
                    {mode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => setMode('reset')} 
                        className="text-xs font-bold text-[#111111] relative after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:ease-in-out after:duration-300 after:bg-black"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input id="auth-password-input" name="password" required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all" />
                  </div>

                  {mode === 'login' && (
                    <div className="flex items-center justify-between mt-4">
                      <label className="flex items-center text-xs font-medium text-gray-600 cursor-pointer group select-none">
                        <input 
                          type="checkbox" 
                          checked={rememberMe} 
                          onChange={(e) => setRememberMe(e.target.checked)} 
                          className="w-4 h-4 mr-2 rounded border-gray-300 text-black focus:ring-black cursor-pointer transition-colors" 
                        />
                        <span className="group-hover:text-black transition-colors">Keep me logged in</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label htmlFor="auth-office-input" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Office / Chambers Name</label>
                  <input id="auth-office-input" name="officeName" required type="text" value={officeName} onChange={e=>setOfficeName(e.target.value)} placeholder="e.g. Sharma & Associates" className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all" />
                </div>
              )}
              {mode === 'join' && (
                <div>
                  <label htmlFor="auth-invite-input" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Office Invite Code</label>
                  <input id="auth-invite-input" name="inviteCode" required type="text" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} placeholder="e.g. CH-LEGAL1" className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-mono uppercase transition-all" />
                </div>
              )}
            </>
          )}

          <Button type="submit" disabled={isLoading || isSuccessAnim} className={`w-full py-3.5 mt-2 rounded-xl text-base ${isSuccessAnim ? 'bg-green-600 hover:bg-green-700 !text-white' : ''}`}>
            {isLoading && !isSuccessAnim ? <Loader2 className="w-5 h-5 animate-spin"/> : isSuccessAnim ? (
              <span className="flex items-center animate-in zoom-in duration-300"><CheckCircle2 className="w-5 h-5 mr-2" /> Authenticated</span>
            ) : (
              <>
                {mode === 'login' && 'Log in'}
                {mode === 'signup' && 'Create Practice'}
                {mode === 'join' && 'Request to Join'}
                {mode === 'track' && 'View Case Status'}
                {mode === 'reset' && 'Send Reset Link'}
              </>
            )}
          </Button>

        </form>
        <div className="mt-8 pt-6 border-t border-[#E5E5E5] text-center text-sm text-gray-500 space-y-3">
          {mode === 'login' && (
            <>
              <p>Don't have an office? <button onClick={() => setMode('signup')} className="text-black font-bold hover:underline transition-all">Create chambers</button></p>
              <p>Have an invite code? <button onClick={() => setMode('join')} className="text-black font-bold hover:underline transition-all">Join office</button></p>
              <p>Are you a client? <button onClick={() => setMode('track')} className="text-black font-bold hover:underline transition-all">Track case with code</button></p>
            </>
          )}
          {mode !== 'login' && (
            <p>Already have an account? <button onClick={() => { setMode('login'); setErrorMsg(""); setSuccessMsg(""); setIsSuccessAnim(false); }} className="text-black font-bold hover:underline transition-all">Return to Log in</button></p>
          )}
        </div>
      </Card>
    </div>
  );
};

const ClientPortalView = ({ trackingCode, dbData, onExit }) => {
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const clientCases = dbData.cases.filter(c => c.trackingNumber === trackingCode);
  const [selectedCaseId, setSelectedCaseId] = useState(clientCases[0]?.id || null);

  useEffect(() => {
    if (!selectedCaseId && clientCases.length > 0) setSelectedCaseId(clientCases[0].id);
  }, [clientCases, selectedCaseId]);

  const activeCase = clientCases.find(c => c.id === selectedCaseId) || clientCases[0];
  const updates = dbData.updates.filter(u => u.caseId === activeCase?.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (clientCases.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col justify-center items-center p-6 text-center animate-in fade-in duration-500">
         <AlertCircle className="w-16 h-16 text-amber-500 mb-6"/>
         <h2 className="text-2xl font-bold mb-3">No Cases Found</h2>
         <p className="text-gray-500 text-base mb-8 max-w-sm">We couldn't find any active matters linked to tracking code <strong className="font-mono bg-white px-2 py-1 rounded border shadow-sm">{trackingCode}</strong>.</p>
         <Button onClick={onExit} className="px-8 py-3">Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#111111] font-sans flex flex-col animate-in fade-in zoom-in-95 duration-500">
      <header className="h-16 bg-white border-b border-[#E5E5E5] flex justify-between items-center px-6 md:px-10 shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-black p-1.5 rounded-md"><Scale className="w-4 h-4 text-white"/></div>
          <span className="font-bold tracking-tight text-lg">Client Portal</span>
        </div>
        <Button variant="secondary" onClick={() => setIsExitModalOpen(true)} className="py-1.5 px-4 text-xs font-bold rounded-full">Exit Portal</Button>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 overflow-y-auto">
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center">
             Tracking Group: <span className="text-[#111111] ml-2 font-mono bg-white border border-[#E5E5E5] shadow-sm px-2 py-0.5 rounded">{trackingCode}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Status Dashboard</h1>
        </div>

        {clientCases.length > 1 && (
          <div className="mb-10 flex items-center space-x-3 overflow-x-auto pb-4 scrollbar-hide">
            <Layers className="w-5 h-5 text-gray-400 shrink-0"/>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0 mr-2">Matters:</span>
            {clientCases.map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedCaseId(c.id)}
                className={`px-5 py-2.5 text-sm font-bold rounded-xl border transition-all shrink-0 ${activeCase?.id === c.id ? 'bg-[#111111] text-white border-[#111111] shadow-md scale-105' : 'bg-white text-gray-700 border-[#E5E5E5] hover:border-black hover:shadow-sm'}`}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}

        {activeCase && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-3">{activeCase.title}</h2>
                  <div className="text-sm text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span><strong className="font-sans text-gray-400 text-xs uppercase tracking-wider mr-1">Case No:</strong> {activeCase.caseNumber || 'N/A'}</span>
                    <span>•</span>
                    <span><strong className="font-sans text-gray-400 text-xs uppercase tracking-wider mr-1">CNR:</strong> {activeCase.cnr || 'N/A'}</span>
                    <span>•</span>
                    <span className="font-sans font-medium">{activeCase.court || 'Pending Court'}</span>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase shadow-sm shrink-0 ${activeCase.status === 'Disposed' ? 'bg-gray-200 text-gray-700 border border-gray-300' : 'bg-green-50 text-green-700 border border-green-200'}`}>{activeCase.status || 'Active'}</span>
              </div>
              <div className="border-t border-[#E5E5E5] pt-6 mt-2 flex justify-between items-center text-base">
                <span className="text-gray-500 font-medium">Next Scheduled Hearing:</span>
                <span className="font-bold text-[#D97706] bg-amber-50 px-3 py-1 rounded-md border border-amber-100">
                  {activeCase.nextHearing ? new Date(activeCase.nextHearing).toLocaleDateString('en-US', {weekday: 'long', month:'long', day:'numeric', year:'numeric'}) : 'To Be Determined'}
                </span>
              </div>
            </Card>

            <Card className="p-8">
              <h3 className="font-bold text-xl mb-6 flex items-center border-b border-[#E5E5E5] pb-4"><Clock className="w-5 h-5 mr-3 text-gray-400"/> Procedural Updates</h3>
              <div className="space-y-6">
                {updates.length === 0 ? (
                  <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">No updates have been posted for this matter yet.</p>
                  </div>
                ) : updates.map(u => (
                  <div key={u.id} className="border-l-2 border-gray-200 pl-5 ml-2 relative group">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 bg-gray-300 rounded-full group-hover:bg-black transition-colors"></div>
                    <div className="text-xs font-bold tracking-wider text-gray-400 mb-1.5 uppercase">
                      {new Date(u.timestamp).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}
                    </div>
                    <h4 className="font-bold text-base mb-2 text-[#111111]">{u.title}</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg">{u.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>

      <Modal title="Exit Client Portal" isOpen={isExitModalOpen} onClose={() => setIsExitModalOpen(false)}>
        <div className="bg-gray-50 text-gray-800 p-5 rounded-xl text-sm border border-gray-200 mb-6 shadow-inner leading-relaxed">
          Are you sure you want to securely exit the portal? You will need to re-enter your <strong className="font-mono">Tracking Code</strong> to view updates again.
        </div>
        <div className="flex space-x-4">
          <Button variant="secondary" className="flex-1 py-3" onClick={() => setIsExitModalOpen(false)}>Cancel</Button>
          <Button variant="danger" type="button" onClick={onExit} className="flex-1 py-3 bg-red-600 text-white hover:bg-red-700">Secure Exit</Button>
        </div>
      </Modal>
    </div>
  );
};

const CaseDetailView = ({ activeCaseId, goBack, dbData, currentUser, onOpenNewTask }) => {
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateText, setUpdateText] = useState("");
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCaseData, setEditCaseData] = useState({});
  const [showBriefModal, setShowBriefModal] = useState(false);

  const activeCase = dbData.cases.find(c => c.id === activeCaseId);
  const caseUpdates = dbData.updates.filter(u => u.caseId === activeCaseId).sort((a,b)=>new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  if (!activeCase) return null;

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!updateTitle || !updateText) return;
    
    const updateId = `up_${Date.now()}`;
    const newUpdate = {
      id: updateId,
      caseId: activeCaseId,
      authorId: currentUser.id,
      title: updateTitle,
      text: updateText,
      timestamp: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'updates', updateId), newUpdate);
    setUpdateTitle("");
    setUpdateText("");
  };

  const openEditModal = () => {
    setEditCaseData({
      title: activeCase.title,
      caseNumber: activeCase.caseNumber || '',
      cnr: activeCase.cnr || '',
      court: activeCase.court || '',
      trackingNumber: activeCase.trackingNumber || '',
      nextHearing: activeCase.nextHearing ? activeCase.nextHearing.split('T')[0] : '',
      partyOne: activeCase.partyOne ? [...activeCase.partyOne] : [],
      partyTwo: activeCase.partyTwo ? [...activeCase.partyTwo] : [],
      status: activeCase.status || 'Active'
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in slide-in-from-right-4 duration-300 w-full">
      <button onClick={goBack} className="mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-black transition-colors group">
        <ChevronRight className="w-4 h-4 mr-1 rotate-180 group-hover:-translate-x-1 transition-transform"/> Back to Ledger
      </button>
      
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-4 mb-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#111111]">{activeCase.title}</h2>
            <Button variant="secondary" onClick={openEditModal} className="text-xs px-3 py-1.5 shadow-sm hidden sm:flex">
              <Edit3 className="w-3.5 h-3.5 mr-2"/> Edit Case
            </Button>
          </div>
          <div className="flex flex-wrap items-center text-sm text-gray-600 gap-x-4 gap-y-2 mb-4 bg-white p-3 rounded-lg border border-[#E5E5E5] shadow-sm w-fit">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${activeCase.status === 'Disposed' ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-green-50 text-green-700 border-green-200'}`}>
               {activeCase.status || 'Active'}
            </span>
            <span className="text-gray-300">|</span>
            <span className="font-mono text-black font-semibold"><strong className="text-gray-400 font-sans text-xs uppercase tracking-wider">No:</strong> {activeCase.caseNumber || 'N/A'}</span>
            <span className="text-gray-300">|</span>
            <span className="font-mono text-gray-800"><strong className="text-gray-400 font-sans text-xs uppercase tracking-wider">CNR:</strong> {activeCase.cnr || 'N/A'}</span>
            <span className="text-gray-300">|</span>
            <span className="font-medium">{activeCase.court || 'Pending Court'}</span>
            <span className="text-gray-300">|</span>
            <span className="text-[#D97706] font-bold bg-amber-50 px-2 py-0.5 rounded">Hearing: {activeCase.nextHearing ? new Date(activeCase.nextHearing).toLocaleDateString('en-US') : 'TBD'}</span>
          </div>
          <div className="flex sm:hidden mb-4">
             <Button variant="secondary" onClick={openEditModal} className="text-xs px-3 py-1.5 shadow-sm">
              <Edit3 className="w-3.5 h-3.5 mr-2"/> Edit Case Details
            </Button>
          </div>
          <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 text-indigo-800 px-3 py-1.5 rounded-lg text-xs shadow-sm">
             <span className="font-bold uppercase tracking-wider">Client Tracking ID:</span>
             <span className="font-mono font-bold tracking-widest text-sm bg-white px-2 rounded border border-indigo-100">{activeCase.trackingNumber}</span>
          </div>
        </div>
      </div>

      {( (activeCase.partyOne && activeCase.partyOne.length > 0) || (activeCase.partyTwo && activeCase.partyTwo.length > 0) ) && (
        <Card className="mb-10 p-6 bg-gray-50 border-dashed border-2 text-sm flex flex-col md:flex-row md:divide-x divide-[#E5E5E5] shadow-inner">
           <div className="flex-1 pr-6 pb-6 md:pb-0">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Plaintiff / Petitioner</div>
              <div className="space-y-4">
                {(!activeCase.partyOne || activeCase.partyOne.length === 0) && <div className="text-gray-500 italic">Not specified</div>}
                {activeCase.partyOne?.map((p, i) => (
                  <div key={i} className="bg-white p-3 rounded border border-[#E5E5E5] shadow-sm">
                    <div className="font-bold text-[#111111]">{p.name || 'Unknown'}</div>
                    {p.mobile && <div className="text-gray-500 font-mono mt-1 text-xs flex items-center"><User className="w-3 h-3 mr-1"/> {p.mobile}</div>}
                  </div>
                ))}
              </div>
           </div>
           <div className="flex-1 md:pl-6 pt-6 md:pt-0 border-t md:border-t-0 border-[#E5E5E5]">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Defendant / Respondent</div>
              <div className="space-y-4">
                {(!activeCase.partyTwo || activeCase.partyTwo.length === 0) && <div className="text-gray-500 italic">Not specified</div>}
                {activeCase.partyTwo?.map((p, i) => (
                  <div key={i} className="bg-white p-3 rounded border border-[#E5E5E5] shadow-sm">
                    <div className="font-bold text-[#111111]">{p.name || 'Unknown'}</div>
                    {p.mobile && <div className="text-gray-500 font-mono mt-1 text-xs flex items-center"><User className="w-3 h-3 mr-1"/> {p.mobile}</div>}
                  </div>
                ))}
              </div>
           </div>
        </Card>
      )}

      <div className="space-y-8 max-w-3xl">
        <h3 className="text-xl font-bold border-b border-[#E5E5E5] pb-4 flex items-center">
          <Clock className="w-5 h-5 mr-3 text-gray-400"/> Case History & Updates
        </h3>
        
        {activeCase.previousHearings && activeCase.previousHearings.length > 0 && (
           <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Archived Hearing Dates</div>
              <div className="flex flex-wrap gap-2">
                {activeCase.previousHearings.map((ph, idx) => (
                  <span key={idx} className="text-xs font-mono bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded shadow-sm">
                    {new Date(ph).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}
                  </span>
                ))}
              </div>
           </div>
        )}

        <Card className="p-6 bg-white shadow-md border-t-4 border-t-black">
          <div className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Post New Update</div>
          <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const title = form.updateTitle.value;
              const text = form.updateText.value;
              const newHearing = form.newNextHearing.value;
              if (!title || !text) return;
              
              const updateId = `up_${Date.now()}`;
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'updates', updateId), {
                id: updateId, caseId: activeCaseId, authorId: currentUser.id, title, text, timestamp: new Date().toISOString()
              });
              
              if (newHearing) {
                 const currentHearingStr = activeCase.nextHearing ? (activeCase.nextHearing.includes('T') ? activeCase.nextHearing.split('T')[0] : activeCase.nextHearing) : null;
                 if (currentHearingStr !== newHearing) {
                    const prev = activeCase.previousHearings || [];
                    const updatesForCase = { nextHearing: newHearing };
                    if (currentHearingStr && !prev.includes(currentHearingStr)) {
                       updatesForCase.previousHearings = [...prev, currentHearingStr];
                    }
                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cases', activeCaseId), updatesForCase);
                 }
              }
              form.reset();
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="update-title" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Update Title</label>
                <input id="update-title" name="updateTitle" type="text" placeholder="e.g. Hearing Concluded" className="w-full px-4 py-2.5 text-sm border border-[#E5E5E5] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none bg-[#F9F9F9] focus:bg-white transition-all" required />
              </div>
              <div>
                <label htmlFor="update-hearing" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider text-amber-700">Set Next Hearing Date (Optional)</label>
                <input id="update-hearing" name="newNextHearing" type="date" className="w-full px-4 py-2.5 text-sm border border-amber-200 rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none bg-amber-50 focus:bg-white transition-all" />
              </div>
            </div>
            <div>
              <label htmlFor="update-text" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Detailed Notes</label>
              <textarea id="update-text" name="updateText" placeholder="Detail the proceedings or notes for the team and client..." className="w-full px-4 py-3 text-sm border border-[#E5E5E5] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none min-h-[100px] resize-y bg-[#F9F9F9] focus:bg-white transition-all" required />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" className="py-2.5 px-6">Post Update to Ledger</Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6 border-l-2 ml-6 border-[#E5E5E5] pl-8 relative py-4">
          {caseUpdates.length === 0 && (
            <div className="text-gray-400 italic text-sm py-4">No procedural updates recorded yet.</div>
          )}
          {caseUpdates.map((u) => {
            const author = dbData.users.find(user=>user.id === u.authorId);
            return (
              <div key={u.id} className="relative group animate-in slide-in-from-bottom-2 duration-300">
                <div className="absolute -left-[41px] top-2 w-4 h-4 bg-white border-4 border-[#111111] rounded-full group-hover:scale-125 group-hover:bg-black transition-all"></div>
                <Card className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-lg text-[#111111]">{u.title}</h4>
                    <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2.5 py-1 rounded border border-gray-200 font-medium tracking-wide shadow-sm">{new Date(u.timestamp).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-5 whitespace-pre-wrap leading-relaxed">{u.text}</p>
                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm ${ROLE_CONFIG[author?.role]?.bg || 'bg-gray-200'} ${ROLE_CONFIG[author?.role]?.text || 'text-gray-700'}`}>
                      {author?.name ? author.name.charAt(0) : '?'}
                    </div>
                    <span className="text-xs font-bold text-[#111111]">{author?.name || 'Unknown User'}</span>
                    <RoleBadge role={author?.role || 'PENDING'}/>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Edit Modal */}
      <Modal title="Edit Case Details" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
         <form onSubmit={async (e) => {
            e.preventDefault();
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cases', activeCaseId), {
              ...editCaseData,
              trackingNumber: editCaseData.trackingNumber ? editCaseData.trackingNumber.toUpperCase().trim() : activeCase.trackingNumber,
              nextHearing: editCaseData.nextHearing ? new Date(editCaseData.nextHearing).toISOString() : null,
              status: editCaseData.status || 'Active'
            });
            setIsEditModalOpen(false);
         }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
               <div className="col-span-2">
                 <label htmlFor="edit-case-title" className="block text-xs font-bold text-gray-700 mb-1">Matter Title *</label>
                 <input id="edit-case-title" name="caseTitle" required type="text" value={editCaseData.title || ''} onChange={e=>setEditCaseData({...editCaseData, title: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded-md focus:border-black outline-none text-sm transition-all" />
               </div>
               <div>
                 <label htmlFor="edit-case-number" className="block text-xs font-bold text-gray-700 mb-1">Case Number</label>
                 <input id="edit-case-number" name="caseNumber" type="text" value={editCaseData.caseNumber || ''} onChange={e=>setEditCaseData({...editCaseData, caseNumber: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded-md focus:border-black outline-none text-sm font-mono transition-all" placeholder="e.g. CS/1042/2026" />
               </div>
               <div>
                 <label htmlFor="edit-case-cnr" className="block text-xs font-bold text-gray-700 mb-1">CNR Number</label>
                 <input id="edit-case-cnr" name="cnrNumber" type="text" value={editCaseData.cnr || ''} onChange={e=>setEditCaseData({...editCaseData, cnr: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded-md focus:border-black outline-none text-sm font-mono transition-all" />
               </div>
               <div className="col-span-2">
                 <label htmlFor="edit-case-tracking" className="block text-xs font-bold text-gray-700 mb-1">Client Tracking ID</label>
                 <input id="edit-case-tracking" name="trackingNumber" type="text" value={editCaseData.trackingNumber || ''} onChange={e=>setEditCaseData({...editCaseData, trackingNumber: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-black rounded-md focus:ring-1 focus:ring-black outline-none text-sm font-mono uppercase transition-all shadow-sm" />
               </div>
               <div>
                 <label htmlFor="edit-case-status" className="block text-xs font-bold text-gray-700 mb-1">Matter Status</label>
                 <select id="edit-case-status" value={editCaseData.status || 'Active'} onChange={e => setEditCaseData({...editCaseData, status: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded-md focus:border-black outline-none text-sm transition-all">
                   <option value="Active">Active</option>
                   <option value="Disposed">Disposed Off</option>
                 </select>
               </div>
               <div>
                 <label htmlFor="edit-case-hearing" className="block text-xs font-bold text-gray-700 mb-1">Next Hearing Date</label>
                 <input id="edit-case-hearing" name="nextHearing" type="date" value={editCaseData.nextHearing || ''} onChange={e=>setEditCaseData({...editCaseData, nextHearing: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded-md focus:border-black outline-none text-sm transition-all" />
               </div>
               <div className="col-span-2">
                 <label htmlFor="edit-case-court" className="block text-xs font-bold text-gray-700 mb-1">Court Name / Authority</label>
                 <input id="edit-case-court" name="courtName" type="text" value={editCaseData.court || ''} onChange={e=>setEditCaseData({...editCaseData, court: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded-md focus:border-black outline-none text-sm transition-all" />
               </div>
            </div>
            <Button type="submit" className="w-full py-3.5 mt-4">Save Changes</Button>
         </form>
      </Modal>

    </div>
  );
};

const DashboardView = ({ currentUser, dbData, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  // Modals
  const [isNewMatterOpen, setIsNewMatterOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newCnr, setNewCnr] = useState("");
  const [newCourt, setNewCourt] = useState("");
  const [newTrackingNumber, setNewTrackingNumber] = useState("");
  const [newPartyOne, setNewPartyOne] = useState([{name: '', mobile: ''}]);
  const [newPartyTwo, setNewPartyTwo] = useState([{name: '', mobile: ''}]);

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCaseId, setNewTaskCaseId] = useState("");
  const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  const [isFireModalOpen, setIsFireModalOpen] = useState(false);
  const [userToFire, setUserToFire] = useState(null);
  const [fireReason, setFireReason] = useState("");

  // Ledger Filters
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState("ALL");
  const [ledgerSort, setLedgerSort] = useState("HEARING_ASC");

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [selectedCalDateStr, setSelectedCalDateStr] = useState("");
  const [calEventType, setCalEventType] = useState("WORKING");
  const [calEventTime, setCalEventTime] = useState("");
  const [calEventNote, setCalEventNote] = useState("");

  const [draggingColumn, setDraggingColumn] = useState(null);

  const myOfficeCases = dbData.cases.filter(c => c.officeId === currentUser.officeId);
  const activeCasesCount = myOfficeCases.filter(c => c.status === 'Active').length;
  const myOfficeTasks = dbData.tasks.filter(t => myOfficeCases.map(c=>c.id).includes(t.caseId));
  const myOffice = dbData.offices.find(o => o.id === currentUser.officeId);
  const officeName = myOffice ? myOffice.name : 'your practice';

  const isSeniorOrManager = currentUser.role === 'SENIOR_ADVOCATE' || currentUser.role === 'MANAGER';

  // Reliable Date helpers (YYYY-MM-DD local format)
  const getLocalDateStr = (d) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };
  const todayStr = getLocalDateStr(new Date());

  const futureHearings = myOfficeCases
    .filter(c => {
      if (!c.nextHearing) return false;
      const hStr = c.nextHearing.includes('T') ? c.nextHearing.split('T')[0] : c.nextHearing;
      return hStr >= todayStr;
    })
    .sort((a, b) => {
      const aStr = a.nextHearing.includes('T') ? a.nextHearing.split('T')[0] : a.nextHearing;
      const bStr = b.nextHearing.includes('T') ? b.nextHearing.split('T')[0] : b.nextHearing;
      return aStr.localeCompare(bStr);
    });
    
  let daysUntilNearest = null;
  if (futureHearings.length > 0) {
    const nStr = futureHearings[0].nextHearing.includes('T') ? futureHearings[0].nextHearing.split('T')[0] : futureHearings[0].nextHearing;
    // Accurate day diff using midnights
    const d1 = new Date(todayStr + "T00:00:00");
    const d2 = new Date(nStr + "T00:00:00");
    daysUntilNearest = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  const canUserModifyTask = (task) => {
    if (currentUser.role === 'SENIOR_ADVOCATE') return true; 
    const assigneeIds = task.assigneeIds || [];
    if (!assigneeIds.includes(currentUser.id)) return false; 
    if (currentUser.role === 'MANAGER') return true;
    
    const assignees = assigneeIds.map(id => dbData.users.find(u => u.id === id)).filter(Boolean);
    const myRank = ROLE_HIERARCHY[currentUser.role] || 0;
    const hasHigherRankAssigned = assignees.some(a => (ROLE_HIERARCHY[a.role] || 0) > myRank);
    return !hasHigherRankAssigned;
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { e.target.classList.add('opacity-40', 'scale-95'); }, 0);
  };
  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-40', 'scale-95');
    setDraggingColumn(null);
  };
  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggingColumn !== status) setDraggingColumn(status);
  };
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDraggingColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    const task = dbData.tasks.find(t => t.id === taskId);
    if (task && canUserModifyTask(task)) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), { status: newStatus });
    }
  };

  const openEditTaskModal = (task) => {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskCaseId(task.caseId);
    setNewTaskAssigneeIds(task.assigneeIds || []);
    setNewTaskDueDate(task.dueDate || ''); 
    setIsNewTaskModalOpen(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskCaseId) return;

    const finalAssigneeIds = newTaskAssigneeIds.length > 0 ? newTaskAssigneeIds : [currentUser.id];
    const dueDateStr = newTaskDueDate || 'No date';
    const todayFormattedStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (editingTaskId) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', editingTaskId), {
         title: newTaskTitle, caseId: newTaskCaseId, assigneeIds: finalAssigneeIds, dueDate: newTaskDueDate || dueDateStr
      });
    } else {
      const taskId = `t_${Date.now()}`;
      const newTask = {
        id: taskId,
        caseId: newTaskCaseId,
        title: newTaskTitle,
        assigneeIds: finalAssigneeIds,
        status: 'TODO',
        dueDate: dueDateStr,
        createdAt: todayFormattedStr
      };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), newTask);
    }
    setIsNewTaskModalOpen(false);
  };

  const handleCreateMatter = async (e) => {
    e.preventDefault();
    if (!newTitle) return;
    const caseId = `c_${Date.now()}`;
    const newCase = {
      id: caseId,
      officeId: currentUser.officeId,
      title: newTitle,
      court: newCourt || 'Pending Court Assignment',
      caseNumber: newCaseNumber || '',
      cnr: newCnr || '',
      partyOne: newPartyOne.filter(p => p.name.trim() !== ''),
      partyTwo: newPartyTwo.filter(p => p.name.trim() !== ''),
      nextHearing: null,
      previousHearings: [],
      status: 'Active',
      trackingNumber: newTrackingNumber ? newTrackingNumber.toUpperCase().trim() : `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cases', caseId), newCase);
    setIsNewMatterOpen(false);
    setNewTitle(""); setNewCaseNumber(""); setNewCnr(""); setNewCourt(""); setNewTrackingNumber("");
    setNewPartyOne([{name: '', mobile: ''}]); setNewPartyTwo([{name: '', mobile: ''}]);
    setActiveTab('ledger');
  };

  const handleFireUser = async (e) => {
    e.preventDefault();
    if (!userToFire || !fireReason) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userToFire.id), {
      role: 'FIRED', firedReason: fireReason
    });
    setIsFireModalOpen(false);
  };

  const handleSaveCalendarEvent = async (e) => {
    e.preventDefault();
    if (!selectedCalDateStr) return;
    const eventId = `${currentUser.officeId}_${selectedCalDateStr}`;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'calendarEvents', eventId), {
       id: eventId,
       officeId: currentUser.officeId,
       date: selectedCalDateStr,
       type: calEventType,
       timeBox: calEventTime,
       notes: calEventNote
    });
    setIsCalendarModalOpen(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setActiveCaseId(null);
  };

  // Ledger specific calculations
  const sortedFilteredCases = myOfficeCases.filter(c => {
     if (ledgerFilter !== 'ALL' && c.status !== ledgerFilter) return false;
     if (ledgerSearch) {
        const q = ledgerSearch.toLowerCase();
        if (!c.title.toLowerCase().includes(q) && 
            !(c.caseNumber || '').toLowerCase().includes(q) && 
            !(c.cnr || '').toLowerCase().includes(q) &&
            !(c.trackingNumber || '').toLowerCase().includes(q)) {
           return false;
        }
     }
     return true;
  }).sort((a,b) => {
     if (ledgerSort === 'HEARING_ASC') {
        if(!a.nextHearing) return 1;
        if(!b.nextHearing) return -1;
        return new Date(a.nextHearing).getTime() - new Date(b.nextHearing).getTime();
     }
     if (ledgerSort === 'HEARING_DESC') {
        if(!a.nextHearing) return 1;
        if(!b.nextHearing) return -1;
        return new Date(b.nextHearing).getTime() - new Date(a.nextHearing).getTime();
     }
     if (ledgerSort === 'TITLE_ASC') {
        return a.title.localeCompare(b.title);
     }
     return 0;
  });

  // Calendar calculations
  const curYear = currentCalendarDate.getFullYear();
  const curMonth = currentCalendarDate.getMonth();
  const firstDayOfMonth = new Date(curYear, curMonth, 1).getDay();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  
  const calendarGrid = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarGrid.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarGrid.push(new Date(curYear, curMonth, i));

  const selectedDayCases = selectedCalDateStr ? myOfficeCases.filter(c => {
    if (!c.nextHearing) return false;
    const hStr = c.nextHearing.includes('T') ? c.nextHearing.split('T')[0] : c.nextHearing;
    return hStr === selectedCalDateStr;
  }) : [];

  const selectedOfficeEvt = selectedCalDateStr ? dbData.calendarEvents?.find(e => e.id === `${currentUser.officeId}_${selectedCalDateStr}`) : null;

  const sortedTeam = dbData.users
    .filter(u => u.officeId === currentUser.officeId && u.role !== 'CLIENT')
    .sort((a, b) => (ROLE_HIERARCHY[b.role] ?? -1) - (ROLE_HIERARCHY[a.role] ?? -1));


  if (currentUser.role === 'PENDING') {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <Card className="p-8 text-center max-w-md w-full shadow-xl">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-[#D97706]"/>
          </div>
          <h2 className="text-2xl font-bold mb-3">Account Pending Approval</h2>
          <p className="text-gray-600 text-base mb-8 leading-relaxed">Your request to join the workspace has been received. Please wait for a Senior Advocate or Manager to assign your role access.</p>
          <Button onClick={onLogout} variant="secondary" className="w-full py-3">Sign Out</Button>
        </Card>
      </div>
    );
  }

  if (currentUser.role === 'FIRED') {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <Card className="p-8 text-center max-w-md w-full border-t-4 border-t-red-600 shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600"/>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Access Revoked</h2>
          <p className="text-gray-600 text-base mb-6">Your access to this workspace has been permanently terminated.</p>
          <div className="bg-red-50 text-red-800 p-5 rounded-xl text-sm text-left mb-8 border border-red-200 shadow-inner">
            <span className="font-bold block mb-2 uppercase tracking-wider text-xs">Reason for termination:</span>
            {currentUser.firedReason || 'No specific reason provided.'}
          </div>
          <Button onClick={onLogout} variant="secondary" className="w-full py-3">Sign Out</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#111111] font-sans flex h-screen overflow-hidden">
      <aside className="w-72 bg-white border-r border-[#E5E5E5] flex flex-col flex-shrink-0 z-20 shadow-[2px_0_15px_rgba(0,0,0,0.03)] hidden md:flex">
        <button 
          onClick={() => handleTabChange('overview')} 
          className="h-20 flex items-center px-8 border-b border-[#E5E5E5] hover:bg-gray-50 transition-colors group text-left w-full focus:outline-none shrink-0"
        >
          <div className="bg-black p-2 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300">
            <Scale className="w-5 h-5 text-white"/>
          </div>
          <h1 className="font-bold tracking-tight text-xl ml-4">Chambers</h1>
        </button>
        <div className="px-8 py-5 border-b border-[#E5E5E5] bg-gray-50/50 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</span>
            <span className="text-xs font-bold text-[#111111] flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span> Systems Online
            </span>
          </div>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <SidebarItem id="overview" name="Overview" icon={Clock} activeTab={activeTab} onClick={handleTabChange}/>
          <SidebarItem id="ledger" name="Master Ledger" icon={Briefcase} activeTab={activeTab} onClick={handleTabChange}/>
          <SidebarItem id="calendar" name="Calendar" icon={CalendarDays} activeTab={activeTab} onClick={handleTabChange}/>
          <SidebarItem id="tasks" name="Task Pipeline" icon={CheckCircle2} activeTab={activeTab} onClick={handleTabChange}/>
          {isSeniorOrManager && (
            <SidebarItem id="team" name="Team & Access" icon={Users} activeTab={activeTab} onClick={handleTabChange}/>
          )}
        </nav>
        <div className="p-5 border-t border-[#E5E5E5] cursor-pointer hover:bg-gray-50 transition-colors group shrink-0" onClick={() => setIsLogoutModalOpen(true)}>
          <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-transparent group-hover:border-gray-200 group-hover:shadow-sm transition-all">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner shrink-0 ${ROLE_CONFIG[currentUser.role]?.bg} ${ROLE_CONFIG[currentUser.role]?.text}`}>
              {currentUser.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
            </div>
            <div className="flex flex-col text-left flex-1 overflow-hidden">
              <span className="text-sm font-bold truncate text-[#111111]">{currentUser.name}</span>
              <RoleBadge role={currentUser.role}/>
            </div>
            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors shrink-0"/>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative z-10 bg-[#F9F9F9]">
        <header className="md:hidden h-16 bg-white border-b border-[#E5E5E5] flex justify-between items-center px-4 shrink-0 shadow-sm z-20">
           <button onClick={() => handleTabChange('overview')} className="flex items-center space-x-2 font-bold focus:outline-none">
              <div className="bg-black p-1.5 rounded-lg"><Scale className="w-4 h-4 text-white"/></div>
              <span className="text-lg tracking-tight">Chambers</span>
           </button>
           <div className="flex space-x-1">
             <button onClick={() => handleTabChange('ledger')} className={`p-2 rounded-lg transition-colors ${activeTab==='ledger'?'bg-gray-100 text-black':'text-gray-500 hover:text-black hover:bg-gray-50'}`} aria-label="Master Ledger"><Briefcase className="w-5 h-5"/></button>
             <button onClick={() => handleTabChange('calendar')} className={`p-2 rounded-lg transition-colors ${activeTab==='calendar'?'bg-gray-100 text-black':'text-gray-500 hover:text-black hover:bg-gray-50'}`} aria-label="Calendar"><CalendarDays className="w-5 h-5"/></button>
             <button onClick={() => handleTabChange('tasks')} className={`p-2 rounded-lg transition-colors ${activeTab==='tasks'?'bg-gray-100 text-black':'text-gray-500 hover:text-black hover:bg-gray-50'}`} aria-label="Task Pipeline"><CheckCircle2 className="w-5 h-5"/></button>
             {isSeniorOrManager && (
                <button onClick={() => handleTabChange('team')} className={`p-2 rounded-lg transition-colors ${activeTab==='team'?'bg-gray-100 text-black':'text-gray-500 hover:text-black hover:bg-gray-50'}`} aria-label="Team Access"><Users className="w-5 h-5" /></button>
             )}
             <button onClick={() => setIsLogoutModalOpen(true)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Log Out"><LogOut className="w-5 h-5"/></button>
           </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#F9F9F9] relative">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && !activeCaseId && (
            <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
              <header className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
                <div>
                  <div className="text-xs font-bold tracking-[0.2em] text-gray-400 mb-2 uppercase">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <h2 className="text-4xl font-bold tracking-tight text-[#111111]">
                    {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {currentUser.name.split(' ')[0]}.
                  </h2>
                  <p className="text-gray-500 mt-2 text-lg">Here's the shape of <strong className="text-gray-800 font-semibold">{officeName}</strong> today.</p>
                </div>
                {isSeniorOrManager && (
                  <Button onClick={() => setIsNewMatterOpen(true)} className="py-3 px-6 shadow-md shrink-0">
                    <Plus className="w-5 h-5 mr-2"/> Open New Matter
                  </Button>
                )}
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="p-8 border-l-4 border-l-[#111111]">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center"><Briefcase className="w-5 h-5 mr-2 text-gray-800"/> Active matters</div>
                  <div className="text-6xl font-bold text-[#111111] tracking-tighter">{activeCasesCount.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider bg-gray-100 px-3 py-1.5 rounded-md w-fit mt-4 border border-gray-200">Currently Open</div>
                </Card>
                <Card className="p-8 border-l-4 border-l-[#111111]">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center"><CheckCircle2 className="w-5 h-5 mr-2 text-gray-800"/> My assigned tasks</div>
                  <div className="text-6xl font-bold text-[#111111] tracking-tighter">
                    {myOfficeTasks.filter(t => (t.assigneeIds || []).includes(currentUser.id) && t.status !== 'COMPLETED').length.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-amber-700 font-bold uppercase tracking-wider bg-amber-50 px-3 py-1.5 rounded-md w-fit mt-4 border border-amber-200">Requires Attention</div>
                </Card>
                <Card className="p-8 border-l-4 border-l-[#111111]">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center"><CalendarIcon className="w-5 h-5 mr-2 text-gray-800"/> Upcoming hearings</div>
                  <div className="text-6xl font-bold text-[#111111] tracking-tighter">{futureHearings.length.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-blue-700 font-bold uppercase tracking-wider bg-blue-50 px-3 py-1.5 rounded-md w-fit mt-4 border border-blue-200 shadow-sm">
                     {daysUntilNearest !== null ? (daysUntilNearest === 0 ? 'Hearing Today' : `Next in ${daysUntilNearest} day${daysUntilNearest > 1 ? 's' : ''}`) : 'No Schedule'}
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <div className="flex justify-between items-center mb-6 border-b border-[#E5E5E5] pb-3">
                    <h3 className="font-bold text-xl tracking-tight text-[#111111]">Recent Activity</h3>
                    <button onClick={()=>setActiveTab('ledger')} className="text-sm font-bold text-[#4F46E5] hover:text-indigo-700 hover:underline transition-all">View Ledger &rarr;</button>
                  </div>
                  <div className="space-y-4">
                    {dbData.updates.sort((a,b)=>new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0,4).map(up => {
                      const c = dbData.cases.find(c=>c.id === up.caseId);
                      const u = dbData.users.find(u=>u.id === up.authorId);
                      if(!c || c.officeId !== currentUser.officeId) return null;
                      return (
                        <Card key={up.id} onClick={() => {setActiveTab('ledger'); setActiveCaseId(c.id);}} className="p-5 group">
                          <div className="flex justify-between items-start mb-2 gap-3">
                            <span className="font-bold text-base text-[#111111] group-hover:text-[#4F46E5] transition-colors leading-tight">{c.title}</span>
                            <span className="text-[10px] font-bold text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200 shrink-0">{new Date(up.timestamp).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</span>
                          </div>
                          <div className="text-sm text-gray-600 line-clamp-2 leading-relaxed bg-gray-50 p-2 rounded">{up.text}</div>
                          <div className="mt-4 flex items-center space-x-2 text-xs pt-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[8px] ${ROLE_CONFIG[u?.role]?.bg || 'bg-gray-200'} ${ROLE_CONFIG[u?.role]?.text || 'text-black'}`}>
                               {u?.name ? u.name.charAt(0) : '?'}
                            </div>
                            <span className="font-bold text-gray-800">{u?.name || 'Unknown'}</span>
                          </div>
                        </Card>
                      );
                    })}
                    {dbData.updates.filter(up => { const c = dbData.cases.find(c=>c.id === up.caseId); return c && c.officeId === currentUser.officeId; }).length === 0 && (
                      <div className="p-8 text-center text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl text-sm">
                        No activity recorded in the workspace yet.
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-6 border-b border-[#E5E5E5] pb-3">
                    <h3 className="font-bold text-xl tracking-tight text-[#111111]">Your Priority Tasks</h3>
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full shrink-0 shadow-sm">
                      {myOfficeTasks.filter(t => (t.assigneeIds || []).includes(currentUser.id) && t.status !== 'COMPLETED').length} Pending
                    </span>
                  </div>
                  <div className="space-y-4">
                    {myOfficeTasks
                      .filter(t => (t.assigneeIds || []).includes(currentUser.id) && t.status !== 'COMPLETED')
                      .sort((a, b) => {
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                      })
                      .slice(0, 4)
                      .map(t => {
                        const c = dbData.cases.find(c=>c.id === t.caseId);
                        const canModify = canUserModifyTask(t);
                        return (
                          <Card key={t.id} className="p-5 flex items-center group bg-white border-l-4 border-l-amber-400">
                            <div className="flex flex-col flex-1 pr-5">
                              <span className="font-bold text-base text-[#111111] mb-1.5 group-hover:text-amber-700 transition-colors leading-tight">{t.title}</span>
                              <div className="flex items-center text-xs text-gray-600 space-x-2 bg-gray-50 w-fit px-2 py-1 rounded border border-gray-100">
                                <span className="font-bold truncate max-w-[150px]">{c?.title || 'Unknown Case'}</span>
                                <span className="text-gray-300">|</span>
                                <span className="font-mono text-[10px] uppercase font-bold text-amber-700">Due: {t.dueDate}</span>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center justify-center p-2">
                              <input 
                                id={`overview-task-check-${t.id}`}
                                name={`overviewTaskCheck_${t.id}`}
                                aria-label={`Mark task ${t.title} as completed`}
                                type="checkbox" 
                                disabled={!canModify}
                                className={`w-6 h-6 rounded-md border-gray-300 text-green-600 focus:ring-green-600 shadow-sm ${canModify ? 'cursor-pointer hover:scale-110 transition-transform' : 'opacity-40 cursor-not-allowed'}`} 
                                onChange={async () => {
                                  if (!canModify) return;
                                  await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { status: 'COMPLETED' });
                                }} 
                                title={canModify ? "Mark as Completed" : "Insufficient permissions"} 
                              />
                            </div>
                          </Card>
                        );
                      })}
                    {myOfficeTasks.filter(t => (t.assigneeIds || []).includes(currentUser.id) && t.status !== 'COMPLETED').length === 0 && (
                      <Card className="p-10 text-center flex flex-col items-center justify-center text-gray-500 text-sm border-dashed border-2 bg-gray-50">
                        <CheckCircle2 className="w-10 h-10 text-green-500 mb-3 opacity-50"/>
                        <span className="font-bold text-gray-700 mb-1">All caught up!</span>
                        <span>You have no pending tasks assigned.</span>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Master Ledger Tab */}
          {activeTab === 'ledger' && !activeCaseId && (
            <div className="p-6 md:p-10 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shrink-0">
                <div>
                  <h2 className="text-4xl font-bold tracking-tight text-[#111111]">Master Ledger</h2>
                  <p className="text-base text-gray-500 mt-2">Comprehensive directory of all matters in the workspace.</p>
                </div>
                {isSeniorOrManager && (
                  <Button onClick={() => setIsNewMatterOpen(true)} className="shrink-0 py-3 shadow-md"><Plus className="w-5 h-5 mr-2"/> Open New Matter</Button>
                )}
              </header>
              
              <Card className="flex-1 overflow-hidden flex flex-col min-h-[500px] shadow-lg border-[#E5E5E5]">
                <div className="flex flex-col lg:flex-row gap-3 p-4 md:p-5 border-b border-[#E5E5E5] bg-white shrink-0 z-10 relative">
                  <div className="flex-1 flex items-center bg-[#F9F9F9] px-4 py-2.5 rounded-lg border border-[#E5E5E5] focus-within:border-black transition-colors shadow-inner">
                    <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0"/>
                    <label htmlFor="ledger-search-input" className="sr-only">Search Matters</label>
                    <input id="ledger-search-input" value={ledgerSearch} onChange={e=>setLedgerSearch(e.target.value)} placeholder="Search by title, case number, or CNR..." className="bg-transparent border-none outline-none text-sm w-full font-medium text-[#111111] placeholder-gray-400" />
                  </div>
                  <div className="flex space-x-3">
                     <div className="flex items-center bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg px-3 py-2.5 shadow-sm">
                        <Filter className="w-4 h-4 text-gray-500 mr-2 shrink-0"/>
                        <label htmlFor="ledger-filter-select" className="sr-only">Filter by Status</label>
                        <select id="ledger-filter-select" value={ledgerFilter} onChange={e=>setLedgerFilter(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 cursor-pointer">
                           <option value="ALL">All Statuses</option>
                           <option value="Active">Active</option>
                           <option value="Disposed">Disposed</option>
                        </select>
                     </div>
                     <div className="flex items-center bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg px-3 py-2.5 shadow-sm">
                        <label htmlFor="ledger-sort-select" className="sr-only">Sort by</label>
                        <select id="ledger-sort-select" value={ledgerSort} onChange={e=>setLedgerSort(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 cursor-pointer">
                           <option value="HEARING_ASC">Nearest Hearing</option>
                           <option value="HEARING_DESC">Furthest Hearing</option>
                           <option value="TITLE_ASC">Title (A-Z)</option>
                        </select>
                     </div>
                  </div>
                </div>
                <div className="overflow-y-auto overflow-x-auto flex-1 bg-[#F9F9F9] p-4">
                  <div className="min-w-[900px] bg-white rounded-xl border border-[#E5E5E5] shadow-sm overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#E5E5E5] text-[11px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50">
                      <div className="col-span-4 pl-2">Matter Title & Court</div>
                      <div className="col-span-2">Case No.</div>
                      <div className="col-span-2">CNR</div>
                      <div className="col-span-2 text-right">Next Hearing</div>
                      <div className="col-span-2 text-center">Status</div>
                    </div>
                    {sortedFilteredCases.length === 0 && (
                      <div className="flex flex-col items-center justify-center p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                          <Briefcase className="w-10 h-10 text-gray-300"/>
                        </div>
                        <h3 className="text-xl font-bold text-[#111111] mb-2">No Matters Found</h3>
                        <p className="text-gray-500 text-base max-w-sm mb-6">There are no records matching your current search criteria.</p>
                        {isSeniorOrManager && !ledgerSearch && ledgerFilter === 'ALL' && (
                          <Button onClick={() => setIsNewMatterOpen(true)} className="px-6 py-3"><Plus className="w-5 h-5 mr-2"/> Create Matter</Button>
                        )}
                      </div>
                    )}
                    <div className="divide-y divide-gray-100">
                      {sortedFilteredCases.map((c) => (
                        <div key={c.id} onClick={() => setActiveCaseId(c.id)} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors cursor-pointer group">
                          <div className="col-span-4 pl-2 pr-4 space-y-1.5 border-r border-transparent group-hover:border-gray-200 transition-colors">
                            <div className="font-bold text-base text-[#111111] group-hover:text-[#4F46E5] truncate transition-colors">{c.title}</div>
                            <div className="text-xs text-gray-500 font-medium truncate flex items-center"><Scale className="w-3 h-3 mr-1.5 opacity-50"/> {c.court || 'Pending Court'}</div>
                          </div>
                          <div className="col-span-2">
                            <span className="font-mono bg-white border border-[#E5E5E5] px-2.5 py-1 rounded text-[#111111] text-xs font-bold shadow-sm inline-block truncate max-w-full">{c.caseNumber || 'N/A'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="font-mono bg-gray-50 border border-[#E5E5E5] px-2.5 py-1 rounded text-gray-600 text-xs font-medium inline-block truncate max-w-full">{c.cnr || 'N/A'}</span>
                          </div>
                          <div className="col-span-2 text-right pr-4">
                             <div className="text-sm font-bold text-[#111111]">{c.nextHearing ? new Date(c.nextHearing).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : <span className="text-gray-400 font-medium italic">Unscheduled</span>}</div>
                          </div>
                          <div className="col-span-2 flex items-center justify-between pl-4 border-l border-gray-100">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>{c.status}</span>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-200 shadow-sm group-hover:border-black group-hover:bg-black transition-all shrink-0">
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"/>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeCaseId && (
            <CaseDetailView 
              activeCaseId={activeCaseId} 
              goBack={() => setActiveCaseId(null)} 
              dbData={dbData} 
              currentUser={currentUser} 
              onOpenNewTask={() => {
                setEditingTaskId(null);
                setNewTaskTitle("");
                setNewTaskDueDate("");
                setNewTaskAssigneeIds([]);
                setNewTaskCaseId(activeCaseId);
                setIsNewTaskModalOpen(true);
              }}
            />
          )}

          {/* Task Pipeline Tab */}
          {activeTab === 'tasks' && !activeCaseId && (
            <div className="p-6 md:p-10 h-full flex flex-col max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
                <div>
                  <h2 className="text-4xl font-bold tracking-tight text-[#111111]">Task Pipeline</h2>
                  <p className="text-base text-gray-500 mt-2">Manage workflow across the chambers. Drag cards to update status.</p>
                </div>
                <Button onClick={() => {
                  setEditingTaskId(null);
                  setNewTaskTitle("");
                  setNewTaskDueDate("");
                  setNewTaskAssigneeIds([]);
                  setNewTaskCaseId(myOfficeCases[0]?.id || '');
                  setIsNewTaskModalOpen(true);
                }} className="shrink-0 py-3 shadow-md"><Plus className="w-5 h-5 mr-2"/> Add New Task</Button>
              </header>
              <div className="flex-1 flex gap-6 overflow-x-auto pb-6 scrollbar-hide px-2">
                {['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'].map(status => {
                  const colTasks = myOfficeTasks.filter(t => t.status === status);
                  const isDraggingOver = draggingColumn === status;
                  
                  const colHeaders = {
                    'TODO': { title: 'To Do', color: 'bg-gray-100 border-gray-300 text-gray-800' },
                    'IN_PROGRESS': { title: 'In Progress', color: 'bg-blue-100 border-blue-300 text-blue-800' },
                    'REVIEW': { title: 'Review', color: 'bg-amber-100 border-amber-300 text-amber-800' },
                    'COMPLETED': { title: 'Completed', color: 'bg-green-100 border-green-300 text-green-800' }
                  };
                  
                  return (
                    <div 
                      key={status} 
                      onDragOver={(e) => handleDragOver(e, status)}
                      onDrop={(e) => handleDrop(e, status)}
                      onDragLeave={() => setDraggingColumn(null)}
                      className={`w-80 lg:w-96 flex-shrink-0 flex flex-col rounded-2xl border-2 transition-all duration-200 ${isDraggingOver ? 'bg-gray-100 border-[#111111] border-dashed shadow-inner' : 'bg-gray-50 border-[#E5E5E5] border-solid'} max-h-full`}
                    >
                      <div className="p-4 border-b border-[#E5E5E5] flex justify-between items-center bg-white rounded-t-xl pointer-events-none shrink-0 shadow-sm z-10">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full border ${colHeaders[status].color}`}></div>
                          <h3 className="text-sm font-bold tracking-wider text-[#111111] uppercase">{colHeaders[status].title}</h3>
                        </div>
                        <span className="text-xs bg-gray-100 border border-gray-200 text-[#111111] px-2.5 py-1 rounded-lg font-bold shadow-inner">{colTasks.length}</span>
                      </div>
                      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[200px]">
                        {colTasks.length === 0 && (
                          <div className="h-full flex items-center justify-center opacity-50 border-2 border-dashed border-transparent">
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Drop Here</span>
                          </div>
                        )}
                        {colTasks.map(t => {
                           const c = dbData.cases.find(c=>c.id===t.caseId);
                           const assignees = (t.assigneeIds || []).map(id => dbData.users.find(u=>u.id===id)).filter(Boolean);
                           const canModify = canUserModifyTask(t);
                           return (
                            <Card 
                              key={t.id} 
                              draggable={canModify}
                              onDragStart={(e) => handleDragStart(e, t.id)}
                              onDragEnd={handleDragEnd}
                              className={`p-5 shadow-sm hover:shadow-lg transition-all group bg-white relative border ${status === 'COMPLETED' ? 'opacity-70 grayscale-[50%]' : 'border-[#E5E5E5]'} ${canModify ? 'cursor-grab active:cursor-grabbing hover:border-black' : 'opacity-90'}`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider truncate bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-fit pointer-events-none">{c?.title || 'Unknown Matter'}</div>
                                <button onClick={() => openEditTaskModal(t)} className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-black bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all shadow-sm active:scale-95">
                                  Edit
                                </button>
                              </div>
                              <h4 className={`font-bold text-base mb-4 leading-snug pointer-events-none ${status === 'COMPLETED' ? 'line-through text-gray-500' : 'text-[#111111]'}`}>{t.title}</h4>
                              
                              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                                <div className="flex -space-x-2 overflow-hidden pointer-events-none p-1">
                                  {assignees.length === 0 && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-dashed border-gray-300 px-2 py-1 rounded">Unassigned</span>}
                                  {assignees.map((user, i) => {
                                    const userCfg = ROLE_CONFIG[user.role] || { bg: 'bg-[#111111]', text: 'text-white', label: user.role };
                                    return (
                                      <div key={user.id} style={{zIndex: 10-i}} className={`inline-flex items-center justify-center h-7 w-7 rounded-full ring-2 ring-white ${userCfg.bg} ${userCfg.text} text-[10px] font-bold shadow-sm`} title={`${user.name} (${userCfg.label})`}>
                                        {user.name.charAt(0)}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100 font-bold shadow-inner">
                                  {t.dueDate === 'No date' ? 'No Due Date' : `Due: ${t.dueDate}`}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && !activeCaseId && (
            <div className="p-6 md:p-10 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 shrink-0">
                 <div>
                   <h2 className="text-4xl font-bold tracking-tight text-[#111111]">Office Calendar</h2>
                   <p className="text-base text-gray-500 mt-2">Track upcoming hearings and manage office availability.</p>
                 </div>
                 <div className="flex space-x-3 items-center">
                    <Button variant="secondary" onClick={() => setCurrentCalendarDate(new Date(curYear, curMonth - 1, 1))} className="px-3"><ChevronLeft className="w-5 h-5"/></Button>
                    <div className="text-lg font-bold w-40 text-center uppercase tracking-widest">{currentCalendarDate.toLocaleDateString('en-US', {month: 'long', year:'numeric'})}</div>
                    <Button variant="secondary" onClick={() => setCurrentCalendarDate(new Date(curYear, curMonth + 1, 1))} className="px-3"><ChevronRight className="w-5 h-5"/></Button>
                 </div>
               </header>

               <Card className="p-1 border border-[#E5E5E5] bg-gray-50 shadow-inner">
                 <div className="grid grid-cols-7 gap-1 text-center bg-white rounded-t-lg">
                   {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                     <div key={d} className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{d}</div>
                   ))}
                 </div>
                 <div className="grid grid-cols-7 gap-px bg-[#E5E5E5]">
                   {calendarGrid.map((dayDate, idx) => {
                     if (!dayDate) return <div key={idx} className="bg-gray-50 min-h-[80px] lg:min-h-[100px]"></div>;
                     const dayStr = getLocalDateStr(dayDate);
                     
                     // Cases scheduled for this day
                     const dayCases = myOfficeCases.filter(c => {
                       if(!c.nextHearing) return false;
                       const hStr = c.nextHearing.includes('T') ? c.nextHearing.split('T')[0] : c.nextHearing;
                       return hStr === dayStr;
                     });
                     
                     // Global office event for this day
                     const evtId = `${currentUser.officeId}_${dayStr}`;
                     const officeEvt = dbData.calendarEvents?.find(e => e.id === evtId);

                     const isToday = dayStr === todayStr;

                     return (
                       <div 
                         key={idx} 
                         onClick={() => {
                           setSelectedCalDateStr(dayStr);
                           setCalEventType(officeEvt ? officeEvt.type : 'WORKING');
                           setCalEventTime(officeEvt ? officeEvt.timeBox : '');
                           setCalEventNote(officeEvt ? officeEvt.notes : '');
                           setIsCalendarModalOpen(true);
                         }}
                         className={`bg-white h-20 lg:h-24 p-1.5 flex flex-col group relative transition-colors overflow-hidden cursor-pointer hover:bg-gray-50 ${officeEvt?.type === 'HOLIDAY' ? 'bg-red-50/30' : ''}`}
                       >
                         <div className="flex justify-between items-start mb-1.5">
                           <span className={`text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#111111] text-white shadow-md' : 'text-gray-600 group-hover:text-black'}`}>{dayDate.getDate()}</span>
                           {officeEvt && (
                              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm truncate max-w-[60px] ${officeEvt.type === 'HOLIDAY' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                {officeEvt.type === 'HOLIDAY' ? 'Holiday' : 'Work'}
                              </span>
                           )}
                         </div>
                         
                         {officeEvt?.timeBox && officeEvt.type !== 'HOLIDAY' && (
                           <div className="text-[9px] text-gray-500 font-mono mb-1.5 px-1 truncate">{officeEvt.timeBox}</div>
                         )}

                         <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide pb-1">
                            {dayCases.map(c => (
                              <div key={c.id} className="text-[9px] font-bold text-white bg-[#4F46E5] truncate px-1.5 py-0.5 rounded shadow-sm leading-tight border border-indigo-700">
                                {c.title}
                              </div>
                            ))}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </Card>

               <Modal title="Calendar Day Details" isOpen={isCalendarModalOpen} onClose={() => setIsCalendarModalOpen(false)}>
                 <div className="space-y-6">
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                     <div>
                       <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Selected Date</div>
                       <div className="text-base font-bold text-[#111111]">
                         {selectedCalDateStr ? new Date(selectedCalDateStr + "T00:00:00").toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'}) : ''}
                       </div>
                     </div>
                     {selectedOfficeEvt && (
                       <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit ${selectedOfficeEvt.type === 'HOLIDAY' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                         {selectedOfficeEvt.type === 'HOLIDAY' ? 'Office Holiday' : 'Working Day'}
                       </span>
                     )}
                   </div>

                   <div>
                     <div className="flex items-center justify-between mb-3">
                       <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center">
                         <Briefcase className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                         Hearings Listed Today ({selectedDayCases.length})
                       </h4>
                     </div>

                     {selectedDayCases.length === 0 ? (
                       <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                         <Scale className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                         <p className="text-sm font-medium text-gray-500">No hearings or matters scheduled on this date.</p>
                       </div>
                     ) : (
                       <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                         {selectedDayCases.map(c => (
                           <div key={c.id} className="p-4 bg-white border border-[#E5E5E5] rounded-xl hover:border-black transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center space-x-2 mb-1">
                                 <span className="font-bold text-sm text-[#111111] truncate">{c.title}</span>
                                 <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${c.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'}`}>{c.status || 'Active'}</span>
                               </div>
                               <div className="flex flex-wrap items-center text-xs text-gray-500 gap-x-2 gap-y-1 font-mono">
                                 <span><strong className="font-sans text-[10px] uppercase text-gray-400">No:</strong> {c.caseNumber || 'N/A'}</span>
                                 <span>•</span>
                                 <span><strong className="font-sans text-[10px] uppercase text-gray-400">CNR:</strong> {c.cnr || 'N/A'}</span>
                                 <span>•</span>
                                 <span className="font-sans text-gray-600">{c.court || 'Court Pending'}</span>
                               </div>
                             </div>
                             <Button
                               variant="primary"
                               className="text-xs py-2 px-3 shrink-0 shadow-sm font-bold flex items-center"
                               onClick={() => {
                                 setIsCalendarModalOpen(false);
                                 setActiveTab('ledger');
                                 setActiveCaseId(c.id);
                               }}
                             >
                               <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                               Access Ledger &rarr;
                             </Button>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>

                   {isSeniorOrManager ? (
                     <form onSubmit={handleSaveCalendarEvent} className="border-t border-[#E5E5E5] pt-5 space-y-4">
                       <div className="text-xs font-bold uppercase tracking-wider text-gray-700">Office & Court Schedule Settings</div>
                       
                       <div>
                         <label htmlFor="cal-type-select" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Day Classification</label>
                         <select id="cal-type-select" value={calEventType} onChange={e=>setCalEventType(e.target.value)} className="w-full px-4 py-2.5 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-bold shadow-sm cursor-pointer transition-all">
                           <option value="WORKING">Working / Court Day</option>
                           <option value="HOLIDAY">Office Holiday / Closed</option>
                         </select>
                       </div>

                       {calEventType !== 'HOLIDAY' && (
                         <div className="animate-in fade-in slide-in-from-top-2">
                           <label htmlFor="cal-time-input" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Office / Court Timing</label>
                           <input id="cal-time-input" type="text" value={calEventTime} onChange={e=>setCalEventTime(e.target.value)} placeholder="e.g. 10:00 AM - 5:00 PM" className="w-full px-4 py-2.5 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm shadow-sm transition-all" />
                         </div>
                       )}

                       <div>
                         <label htmlFor="cal-notes-textarea" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Internal Schedule Notes (Optional)</label>
                         <textarea id="cal-notes-textarea" value={calEventNote} onChange={e=>setCalEventNote(e.target.value)} placeholder="e.g. High Court closing early today..." className="w-full px-4 py-2.5 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm min-h-[60px] resize-y shadow-inner transition-all" />
                       </div>

                       <div className="flex space-x-3 pt-2">
                         <Button variant="secondary" type="button" className="flex-1 py-2.5" onClick={() => setIsCalendarModalOpen(false)}>Close</Button>
                         <Button variant="primary" type="submit" className="flex-1 py-2.5">Save Schedule</Button>
                       </div>
                     </form>
                   ) : (
                     selectedOfficeEvt && (
                       <div className="border-t border-[#E5E5E5] pt-4 space-y-2">
                         <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Office Timings & Notes</div>
                         {selectedOfficeEvt.timeBox && (
                           <div className="text-sm font-mono text-gray-800"><strong>Hours:</strong> {selectedOfficeEvt.timeBox}</div>
                         )}
                         {selectedOfficeEvt.notes && (
                           <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">{selectedOfficeEvt.notes}</div>
                         )}
                       </div>
                     )
                   )}
                 </div>
               </Modal>
            </div>
          )}

          {/* Team Access Tab */}
          {activeTab === 'team' && isSeniorOrManager && !activeCaseId && (
             <div className="p-6 md:p-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <header className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 shrink-0">
                 <div>
                   <h2 className="text-4xl font-bold tracking-tight text-[#111111]">Team Access</h2>
                   <p className="text-base text-gray-500 mt-2">Manage roles, approve pending members, and secure your workspace.</p>
                 </div>
                 <div className="bg-white border border-[#E5E5E5] text-[#111111] px-5 py-3 rounded-xl text-sm font-bold flex items-center shadow-md shrink-0">
                   Workspace Invite Code: 
                   <span className="ml-4 font-mono text-lg tracking-widest text-[#4F46E5] bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 select-all">
                     {myOffice?.inviteCode}
                 </span>
                 </div>
               </header>
               <Card className="overflow-hidden shadow-lg border-[#E5E5E5]">
                 <div className="p-5 bg-gray-50 border-b border-[#E5E5E5] text-xs font-bold text-gray-500 uppercase tracking-widest pl-8 flex items-center shadow-sm z-10 relative">
                   <Users className="w-4 h-4 mr-2"/> Active & Pending Members
                 </div>
                 <div className="divide-y divide-gray-100 bg-white">
                   {sortedTeam.map(user => (
                     <div key={user.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors pl-8 gap-4 group">
                       <div className="flex items-center space-x-5">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shadow-md shrink-0 border-2 border-white ring-1 ring-black/5 ${ROLE_CONFIG[user.role]?.bg} ${ROLE_CONFIG[user.role]?.text}`}>
                            {user.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                          </div>
                          <div>
                            <div className="font-bold text-lg text-[#111111] mb-0.5">{user.name} {user.id === currentUser.id && <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600 px-2 py-0.5 rounded ml-2 align-middle">You</span>}</div>
                            <div className="text-sm text-gray-500 font-medium flex items-center"><Mail className="w-3.5 h-3.5 mr-1.5"/> {user.email}</div>
                          </div>
                       </div>
                       <div className="flex items-center space-x-6 sm:pr-4">
                         <RoleBadge role={user.role}/>
                         {currentUser.id !== user.id && (
                           <div className="flex items-center space-x-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                             <label htmlFor={`user-role-select-${user.id}`} className="sr-only">Change Role</label>
                             <select 
                               id={`user-role-select-${user.id}`}
                               name={`userRole_${user.id}`}
                               className="text-xs font-bold uppercase tracking-wider border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black cursor-pointer bg-white shadow-sm hover:bg-gray-50 transition-all focus:ring-2 focus:ring-black/20"
                               value={user.role}
                               onChange={async (e) => {
                                 await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.id), { role: e.target.value });
                               }}
                             >
                               <option value="PENDING">Pending Approval</option>
                               <option value="INTERN">Intern</option>
                               <option value="EMPLOYEE">Associate</option>
                               <option value="MANAGER">Manager</option>
                               <option value="SENIOR_ADVOCATE">Senior Advocate</option>
                               {user.role === 'FIRED' && <option value="FIRED">Terminated</option>}
                             </select>
                             {user.role !== 'FIRED' && (
                               <button 
                                 onClick={() => { setUserToFire(user); setIsFireModalOpen(true); }}
                                 className="p-2.5 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg border border-red-100 transition-all shadow-sm active:scale-95 shrink-0"
                                 title="Revoke Access"
                                 aria-label={`Revoke Access for ${user.name}`}
                               >
                                 <LogOut className="w-4 h-4"/>
                               </button>
                             )}
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               </Card>
             </div>
          )}

        </div>
      </main>
      
      {/* Global Modals that exist outside activeTab flow */}
      <Modal title="Open New Matter" isOpen={isNewMatterOpen} onClose={() => setIsNewMatterOpen(false)}>
        <form onSubmit={handleCreateMatter} className="space-y-6">
          <div className="space-y-5 pb-5 border-b border-gray-100">
            <div>
              <label htmlFor="new-matter-title" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Matter Title *</label>
              <input id="new-matter-title" name="matterTitle" required type="text" value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all shadow-sm" placeholder="e.g. Smith v. State" />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label htmlFor="new-matter-caseno" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Case Number</label>
                <input id="new-matter-caseno" name="caseNumber" type="text" value={newCaseNumber} onChange={e=>setNewCaseNumber(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all font-mono shadow-sm" placeholder="e.g. CS/1042/2026" />
              </div>
              <div>
                <label htmlFor="new-matter-cnr" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">CNR Number</label>
                <input id="new-matter-cnr" name="cnrNumber" type="text" value={newCnr} onChange={e=>setNewCnr(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all font-mono shadow-sm" placeholder="e.g. HC0982-2026" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label htmlFor="new-matter-tracking" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Client Tracking ID</label>
                <input id="new-matter-tracking" name="trackingNumber" type="text" value={newTrackingNumber} onChange={e=>setNewTrackingNumber(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-indigo-300 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm transition-all font-mono uppercase shadow-sm" placeholder="e.g. TRK-ABC123" />
                <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">Clients use this exact code to view their dashboard. Paste an existing code to group matters.</p>
              </div>
              <div>
                <label htmlFor="new-matter-court" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Court / Authority</label>
                <input id="new-matter-court" name="courtName" type="text" value={newCourt} onChange={e=>setNewCourt(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all shadow-sm" placeholder="e.g. District Court" />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="text-xs font-bold tracking-widest text-gray-400 uppercase border-b border-gray-100 pb-2">Parties Involved (Optional)</div>
            
           <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner">
             <div className="text-xs font-bold mb-4 flex justify-between items-center text-[#111111] uppercase tracking-wider">
               <span>Plaintiff / Petitioner</span>
               <button type="button" onClick={() => setNewPartyOne([...newPartyOne, {name:'', mobile:''}])} className="text-white bg-[#111111] hover:bg-black px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm active:scale-95">+ Add</button>
             </div>
             {newPartyOne.map((p, i) => (
               <div key={i} className="flex space-x-3 mb-3 items-start animate-in fade-in slide-in-from-top-2">
                 <div className="flex-1">
                   <input aria-label={`New Plaintiff Name ${i + 1}`} name={`newPartyOneName_${i}`} type="text" placeholder="Full Name" value={p.name} onChange={e => { const newP = [...newPartyOne]; newP[i].name = e.target.value; setNewPartyOne(newP); }} className="w-full px-3 py-2.5 bg-white border border-[#E5E5E5] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all shadow-sm" />
                 </div>
                 <div className="flex-1">
                   <input aria-label={`New Plaintiff Mobile ${i + 1}`} name={`newPartyOneMobile_${i}`} type="text" placeholder="+91 Mobile" value={p.mobile} onChange={e => { const newP = [...newPartyOne]; newP[i].mobile = e.target.value; setNewPartyOne(newP); }} className="w-full px-3 py-2.5 bg-white border border-[#E5E5E5] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all font-mono shadow-sm" />
                 </div>
                 {newPartyOne.length > 1 && (
                   <button type="button" onClick={() => { const newP = [...newPartyOne]; newP.splice(i, 1); setNewPartyOne(newP); }} className="p-2 text-gray-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors mt-0.5"><X className="w-4 h-4"/></button>
                 )}
               </div>
             ))}
           </div>

           <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner">
             <div className="text-xs font-bold mb-4 flex justify-between items-center text-[#111111] uppercase tracking-wider">
               <span>Defendant / Respondent</span>
               <button type="button" onClick={() => setNewPartyTwo([...newPartyTwo, {name:'', mobile:''}])} className="text-white bg-[#111111] hover:bg-black px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm active:scale-95">+ Add</button>
             </div>
             {newPartyTwo.map((p, i) => (
               <div key={i} className="flex space-x-3 mb-3 items-start animate-in fade-in slide-in-from-top-2">
                 <div className="flex-1">
                   <input aria-label={`New Defendant Name ${i + 1}`} name={`newPartyTwoName_${i}`} type="text" placeholder="Full Name" value={p.name} onChange={e => { const newP = [...newPartyTwo]; newP[i].name = e.target.value; setNewPartyTwo(newP); }} className="w-full px-3 py-2.5 bg-white border border-[#E5E5E5] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all shadow-sm" />
                 </div>
                 <div className="flex-1">
                   <input aria-label={`New Defendant Mobile ${i + 1}`} name={`newPartyTwoMobile_${i}`} type="text" placeholder="+91 Mobile" value={p.mobile} onChange={e => { const newP = [...newPartyTwo]; newP[i].mobile = e.target.value; setNewPartyTwo(newP); }} className="w-full px-3 py-2.5 bg-white border border-[#E5E5E5] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all font-mono shadow-sm" />
                 </div>
                 {newPartyTwo.length > 1 && (
                   <button type="button" onClick={() => { const newP = [...newPartyTwo]; newP.splice(i, 1); setNewPartyTwo(newP); }} className="p-2 text-gray-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors mt-0.5"><X className="w-4 h-4"/></button>
                 )}
               </div>
             ))}
           </div>
          </div>
          
          <Button type="submit" className="w-full py-4 mt-8 rounded-xl text-base shadow-lg">Create Matter File</Button>
        </form>
      </Modal>

      <Modal title={editingTaskId ? "Edit Task" : "Create New Task"} isOpen={isNewTaskModalOpen} onClose={() => { setIsNewTaskModalOpen(false); setEditingTaskId(null); setNewTaskAssigneeIds([]); }}>
        <form onSubmit={handleCreateTask} className="space-y-5">
          <div>
            <label htmlFor="task-title-input" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Task Title *</label>
            <input id="task-title-input" name="taskTitle" required type="text" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all shadow-sm" placeholder="e.g. Draft rejoinder for arbitration" />
          </div>

          <div>
            <label htmlFor="task-matter-select" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Linked Matter *</label>
            <select id="task-matter-select" name="linkedMatterId" required value={newTaskCaseId} onChange={e=>setNewTaskCaseId(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all cursor-pointer shadow-sm">
              <option value="" disabled>Select a matter...</option>
              {myOfficeCases.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Assign To (Multiple allowed)</span>
            <div className="max-h-48 overflow-y-auto border border-[#E5E5E5] rounded-xl bg-gray-50 p-2 space-y-1 shadow-inner">
              {dbData.users.filter(u => u.officeId === currentUser.officeId && u.role !== 'CLIENT' && u.role !== 'PENDING').map(u => (
                <label key={u.id} className="flex items-center space-x-3 p-3 hover:bg-white rounded-lg cursor-pointer transition-all border border-transparent hover:border-gray-200 hover:shadow-sm">
                  <input 
                    name={`assignee_${u.id}`}
                    type="checkbox" 
                    checked={newTaskAssigneeIds.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) setNewTaskAssigneeIds([...newTaskAssigneeIds, u.id]);
                      else setNewTaskAssigneeIds(newTaskAssigneeIds.filter(id => id !== u.id));
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-[#111111] focus:ring-black cursor-pointer transition-colors"
                  />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm shrink-0 ${ROLE_CONFIG[u.role]?.bg} ${ROLE_CONFIG[u.role]?.text}`}>
                     {u.name.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-[#111111]">{u.name} <span className="text-gray-400 text-xs ml-1 font-normal tracking-wide">({ROLE_CONFIG[u.role]?.label})</span></span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="task-due-date" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Due Date</label>
            <input id="task-due-date" name="dueDate" type="date" value={newTaskDueDate} onChange={e=>setNewTaskDueDate(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm transition-all shadow-sm" />
          </div>
          <Button type="submit" className="w-full py-4 mt-8 rounded-xl text-base shadow-lg">{editingTaskId ? 'Save Task Changes' : 'Create Task'}</Button>
        </form>
      </Modal>

      <Modal title="Terminate Employee" isOpen={isFireModalOpen} onClose={() => { setIsFireModalOpen(false); setUserToFire(null); setFireReason(""); }}>
        <form onSubmit={handleFireUser} className="space-y-4">
          <div className="bg-red-50 text-red-800 p-5 rounded-xl text-sm border border-red-200 mb-4 shadow-sm leading-relaxed">
            You are about to terminate <strong>{userToFire?.name}</strong>. Their access to the workspace will be immediately revoked.
          </div>
          <div>
            <label htmlFor="fire-reason-textarea" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Reason for Termination (Mandatory)</label>
            <textarea id="fire-reason-textarea" name="terminationReason" required value={fireReason} onChange={e=>setFireReason(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-sm transition-all min-h-[120px] resize-y shadow-inner" placeholder="Detail the reason for immediate termination. This will be visible to the employee." />
          </div>
          <div className="flex space-x-4 mt-8">
            <Button variant="secondary" className="flex-1 py-3" onClick={() => { setIsFireModalOpen(false); setUserToFire(null); setFireReason(""); }}>Cancel</Button>
            <Button variant="danger" type="submit" className="flex-1 py-3">Confirm Termination</Button>
          </div>
        </form>
      </Modal>
      
      <Modal title="Sign Out" isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)}>
        <div className="bg-gray-50 text-gray-800 p-5 rounded-xl text-sm border border-gray-200 mb-8 shadow-inner leading-relaxed">
          Are you sure you want to sign out of your workspace? You will need your credentials to access it again.
        </div>
        <div className="flex space-x-4">
          <Button variant="secondary" className="flex-1 py-3" onClick={() => setIsLogoutModalOpen(false)}>Cancel</Button>
          <Button variant="primary" type="button" onClick={onLogout} className="flex-1 py-3 bg-[#111111] hover:bg-black">Yes, Sign Out</Button>
        </div>
      </Modal>

    </div>
  );
};

export default function App() {
  const [dbData, setDbData] = useState({
    offices: [], users: [], cases: [], updates: [], tasks: [], calendarEvents: []
  });
  
  const [authUser, setAuthUser] = useState(null);
  const [appUser, setAppUser] = useState(null); 
  const [trackedCode, setTrackedCode] = useState(null);
  const [currentView, setCurrentView] = useState(''); // Intentionally blank initially
  const [authMode, setAuthMode] = useState('login');
  const [isInitializing, setIsInitializing] = useState(true);

  // Core Authentication Listener
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch (e) { }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (!user) {
        setAppUser(null);
        setCurrentView('landing');
        setTimeout(() => setIsInitializing(false), 300); // Small delay to prevent flashing
      }
    });
    return () => unsubscribe();
  }, []);

  // Secure Database Tunnel (Only opens if UID exists)
  useEffect(() => {
    if (!authUser?.uid) {
       setAppUser(null);
       setDbData({ offices: [], users: [], cases: [], updates: [], tasks: [], calendarEvents: [] });
       return;
    }

    const cols = ['offices', 'users', 'cases', 'updates', 'tasks', 'calendarEvents'];
    const unsubscribes = cols.map(colName => {
       return onSnapshot(
         collection(db, 'artifacts', appId, 'public', 'data', colName),
         (snapshot) => {
           const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
           setDbData(prev => ({ ...prev, [colName]: data }));
         },
         (error) => console.error(`Error syncing ${colName}:`, error)
       );
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [authUser?.uid]);

  // Profile Resolution and Smooth Routing
  useEffect(() => {
    if (authUser && !authUser.isAnonymous) {
      const userProfile = dbData.users.find(u => u.id === authUser.uid);
      if (userProfile && JSON.stringify(appUser) !== JSON.stringify(userProfile)) {
        setAppUser(userProfile);
        if (currentView !== 'dashboard') setCurrentView('dashboard');
        setTimeout(() => setIsInitializing(false), 400);
      }
    } else if (authUser?.isAnonymous) {
      setTimeout(() => setIsInitializing(false), 400);
    }
  }, [authUser?.uid, dbData.users]);


  const handleLogin = async (email, password, rememberMe) => {
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceType);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleResetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const handleCreateOffice = async (name, email, password, officeName) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    const newOfficeId = `off_${Date.now()}`;
    const inviteCode = `CH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offices', newOfficeId), {
      id: newOfficeId, name: officeName, inviteCode
    });
    
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid), {
      id: uid, officeId: newOfficeId, name, email, role: 'SENIOR_ADVOCATE'
    });
  };

  const handleJoinOffice = async (name, email, password, code) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    const officesRef = collection(db, 'artifacts', appId, 'public', 'data', 'offices');
    const q = query(officesRef, where('inviteCode', '==', code.toUpperCase().trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Invalid invite code. Please ask your administrator.");
    }

    const foundOfficeDoc = querySnapshot.docs[0];
    const foundOffice = { id: foundOfficeDoc.id, ...foundOfficeDoc.data() };
    
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid), {
      id: uid, officeId: foundOffice.id, name, email, role: 'PENDING'
    });
  };

  const handleTrackCase = async (trackingNumber) => {
    if (!authUser) {
      await signInAnonymously(auth);
    }
    setTrackedCode(trackingNumber.toUpperCase().trim());
    setCurrentView('client');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAppUser(null);
    setTrackedCode(null);
    setCurrentView('landing');
  };

  // If the app is booting up or resolving auth, block all rendering with the SplashLoader
  if (isInitializing) {
    return <SplashLoader />;
  }

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-[#F9F9F9] text-[#111111] font-sans flex flex-col animate-in fade-in duration-700">
        <header className="flex justify-between items-center p-6 lg:px-12 bg-[#F9F9F9] shrink-0">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setCurrentView('landing')}>
            <div className="bg-black p-2 rounded-xl group-hover:scale-105 transition-transform shadow-md">
              <Scale className="w-5 h-5 text-white"/>
            </div>
            <span className="font-bold tracking-tight text-xl">Chambers</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => { setAuthMode('track'); setCurrentView('auth'); }} className="text-sm font-bold text-gray-500 hover:text-black transition-colors px-4 py-2">
              Track Case
            </button>
            <button onClick={() => { setAuthMode('login'); setCurrentView('auth'); }} className="text-sm font-bold flex items-center bg-white border border-[#E5E5E5] px-5 py-2.5 rounded-full hover:border-black hover:shadow-md transition-all">
              Log in <ChevronRight className="w-4 h-4 ml-1"/>
            </button>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto -mt-20">
          <div className="text-xs font-bold tracking-[0.2em] text-gray-400 mb-8 uppercase flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Scale className="w-3 h-3 mr-2"/> A calmer way to run your practice
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.95] mb-8 text-[#111111] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Make room <br/> for the law.
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Chambers brings cases, people, and progress into one focused workspace built for the way modern law offices actually work.
          </p>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 w-full sm:w-auto">
            <Button onClick={() => { setAuthMode('login'); setCurrentView('auth'); }} className="w-full sm:w-auto px-8 py-4 rounded-xl text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Log in to your workspace <ArrowRight className="w-4 h-4 ml-2"/>
            </Button>
            <Button variant="secondary" onClick={() => { setAuthMode('track'); setCurrentView('auth'); }} className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-white text-black border border-[#E5E5E5] hover:bg-gray-50 hover:border-black shadow-sm hover:-translate-y-0.5 transition-all">
              Client Case Tracking
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === 'auth') {
    return (
      <AuthView 
        mode={authMode} 
        setMode={setAuthMode} 
        onLogin={handleLogin} 
        onCreateOffice={handleCreateOffice} 
        onJoinOffice={handleJoinOffice} 
        onTrackCase={handleTrackCase} 
        onResetPassword={handleResetPassword}
        goBack={() => setCurrentView('landing')} 
      />
    );
  }

  if (currentView === 'client') {
    return <ClientPortalView trackingCode={trackedCode} dbData={dbData} onExit={handleLogout}/>;
  }

  if (currentView === 'dashboard' && appUser) {
    return <DashboardView currentUser={appUser} dbData={dbData} onLogout={handleLogout}/>;
  }

  // Final fallback (should not be reached)
  return <SplashLoader />;
}
```eof