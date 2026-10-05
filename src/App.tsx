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
      <Icon ${active 'group-hover:scale-110'}`} 'scale-110' : ? className="{`w-4" duration-200 h-4 mr-3 transition-transform/>
      {name}
    </button>
  );
};

const SplashLoader = () => (
  <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center animate-in fade-in duration-500 z-50">
    <div className="relative flex items-center justify-center w-20 h-20 bg-[#111111] rounded-2xl shadow-xl animate-pulse">
      <Scale className="w-10 h-10 text-white"/>
    </div>
    <div className="mt-8 flex items-center space-x-2 text-sm font-bold tracking-[0.2em] text-gray-400 uppercase">
      <Loader2 className="w-4 h-4 animate-spin"/>
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

          <Button !text-white' ${isSuccessAnim ''}`} 'bg-green-600 : ? className="{`w-full" disabled="{isLoading" hover:bg-green-700 isSuccessAnim} mt-2 py-3.5 rounded-xl text-base type="submit" ||>
            {isLoading && !isSuccessAnim ? <Loader2 className="w-5 h-5 animate-spin"/> : isSuccessAnim ? (
              <span className="flex items-center animate-in zoom-in duration-300"><CheckCircle2 className="w-5 h-5 mr-2"/> Authenticated</span>
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
      </div>
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
         <Button className="px-8 py-3" onClick="{onExit}">Return to Home</Button>
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
        <Button onClick="{()" variant="secondary"> setIsExitModalOpen(true)} className="py-1.5 px-4 text-xs font-bold rounded-full">Exit Portal</Button>
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

      <Modal isOpen="{isExitModalOpen}" onClose="{()" title="Exit Client Portal"> setIsExitModalOpen(false)}>
        <div className="bg-gray-50 text-gray-800 p-5 rounded-xl text-sm border border-gray-200 mb-6 shadow-inner leading-relaxed">
          Are you sure you want to securely exit the portal? You will need to re-enter your <strong className="font-mono">Tracking Code</strong> to view updates again.
        </div>
        <div className="flex space-x-4">
          <Button className="flex-1 py-3" onClick="{()" variant="secondary"> setIsExitModalOpen(false)}>Cancel</Button>
          <Button className="flex-1 py-3 bg-red-600 text-white hover:bg-red-700" onClick="{onExit}" type="button" variant="danger">Secure Exit</Button>
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
            <Button className="text-xs px-3 py-1.5 shadow-sm hidden sm:flex" onClick="{openEditModal}" variant="secondary">
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
             <Button className="text-xs px-3 py-1.5 shadow-sm" onClick="{openEditModal}" variant="secondary">
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
              const form = e.target as HTMLFormElement;
              const titleInput = form.elements.namedItem('updateTitle') as HTMLInputElement;
              const textInput = form.elements.namedItem('updateText') as HTMLTextAreaElement;
              const hearingInput = form.elements.namedItem('newNextHearing') as HTMLInputElement;
              
              const title = titleInput.value;
              const text = textInput.value;
              const newHearing = hearingInput.value;

              if (!title || !text) return;
              
              const updateId = `up_${Date.now()}`;
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'updates', updateId), {
                id: updateId, caseId: activeCaseId, authorId: currentUser.id, title, text, timestamp: new Date().toISOString()
              });
              
              if (newHearing) {
                 const currentHearingStr = activeCase.nextHearing ? (activeCase.nextHearing.includes('T') ? activeCase.nextHearing.split('T')[0] : activeCase.nextHearing) : null;
                 if (currentHearingStr !== newHearing) {
                    const prev = activeCase.previousHearings || [];
                    const updatesForCase: any = { nextHearing: newHearing };
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
              <Button className="py-2.5 px-6" type="submit">Post Update to Ledger</Button>
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
                    <RoleBadge 'PENDING'} role="{author?.role" ||/>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Edit Modal */}
      <Modal isOpen="{isEditModalOpen}" onClose="{()" title="Edit Case Details"> setIsEditModalOpen(false)}>
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
                 <label htmlFor="edit-case-tracking" className="block text-xs font-bold text-gray-700 mb-1">Client Tracking ID (Group multiple cases for one client)</label>
                 <input id="edit-case-tracking" name="trackingNumber" type="text" value={editCaseData.trackingNumber || ''} onChange={e=>setEditCaseData({...editCaseData, trackingNumber: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-black rounded-md focus:ring-1 focus:ring-black outline-none text-sm font-mono uppercase transition-all shadow-sm" placeholder="e.g. TRK-ABC123" />
                 <p className="text-[10px] text-gray-500 mt-1">Clients use this exact code to view their dashboard. Paste an existing code to group matters.</p>
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
            <Button className="w-full py-3.5 mt-4" type="submit">Save Changes</Button>
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
          <Button className="w-full py-3" onClick="{onLogout}" variant="secondary">Sign Out</Button>
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
          <Button className="w-full py-3" onClick="{onLogout}" variant="secondary">Sign Out</Button>
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
          <SidebarItem activeTab="{activeTab}" icon="{Clock}" id="overview" name="Overview" onClick="{handleTabChange}"/>
          <SidebarItem activeTab="{activeTab}" icon="{Briefcase}" id="ledger" name="Master Ledger" onClick="{handleTabChange}"/>
          <SidebarItem activeTab="{activeTab}" icon="{CalendarDays}" id="calendar" name="Calendar" onClick="{handleTabChange}"/>
          <SidebarItem activeTab="{activeTab}" icon="{CheckCircle2}" id="tasks" name="Task Pipeline" onClick="{handleTabChange}"/>
          {isSeniorOrManager && (
            <SidebarItem activeTab="{activeTab}" icon="{Users}" id="team" name="Team & Access" onClick="{handleTabChange}"/>
          )}
        </nav>
        <div className="p-5 border-t border-[#E5E5E5] cursor-pointer hover:bg-gray-50 transition-colors group shrink-0" onClick={() => setIsLogoutModalOpen(true)}>
          <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-transparent group-hover:border-gray-200 group-hover:shadow-sm transition-all">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner shrink-0 ${ROLE_CONFIG[currentUser.role]?.bg} ${ROLE_CONFIG[currentUser.role]?.text}`}>
              {currentUser.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
            </div>
            <div className="flex flex-col text-left flex-1 overflow-hidden">
              <span className="text-sm font-bold truncate text-[#111111]">{currentUser.name}</span>
              <RoleBadge role="{currentUser.role}"/>
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
                <button onClick={() => handleTabChange('team')} className={`p-2 rounded-lg transition-colors ${activeTab==='team'?'bg-gray-100 text-black':'text-gray-500 hover:text-black hover:bg-gray-50'}`} aria-label="Team Access"><Users className="w-5 h-5"/></button>
             )}
             <button onClick={() => setIsLogoutModalOpen(true)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Log Out"><LogOut className="w-5 h-5"/></button>
           </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#F9F9F9] relative">
          {renderContent()}
        </div>
      </main>
      
      {/* Global Modals that exist outside activeTab flow */}
      <Modal isOpen="{isNewMatterOpen}" onClose="{()" title="Open New Matter"> setIsNewMatterOpen(false)}>
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
          
          <Button className="w-full py-4 mt-8 rounded-xl text-base shadow-lg" type="submit">Create Matter File</Button>
        </form>
      </Modal>

      <Modal "Create "Edit : ? New Task" Task"} isOpen="{isNewTaskModalOpen}" onClose="{()" title="{editingTaskId"> { setIsNewTaskModalOpen(false); setEditingTaskId(null); setNewTaskAssigneeIds([]); }}>
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
          <Button className="w-full py-4 mt-8 rounded-xl text-base shadow-lg" type="submit">{editingTaskId ? 'Save Task Changes' : 'Create Task'}</Button>
        </form>
      </Modal>

      <Modal isOpen="{isFireModalOpen}" onClose="{()" title="Terminate Employee"> { setIsFireModalOpen(false); setUserToFire(null); setFireReason(""); }}>
        <form onSubmit={handleFireUser} className="space-y-4">
          <div className="bg-red-50 text-red-800 p-5 rounded-xl text-sm border border-red-200 mb-4 shadow-sm leading-relaxed">
            You are about to terminate <strong>{userToFire?.name}</strong>. Their access to the workspace will be immediately revoked.
          </div>
          <div>
            <label htmlFor="fire-reason-textarea" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Reason for Termination (Mandatory)</label>
            <textarea id="fire-reason-textarea" name="terminationReason" required value={fireReason} onChange={e=>setFireReason(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-sm transition-all min-h-[120px] resize-y shadow-inner" placeholder="Detail the reason for immediate termination. This will be visible to the employee." />
          </div>
          <div className="flex space-x-4 mt-8">
            <Button className="flex-1 py-3" onClick="{()" variant="secondary"> { setIsFireModalOpen(false); setUserToFire(null); setFireReason(""); }}>Cancel</Button>
            <Button className="flex-1 py-3" type="submit" variant="danger">Confirm Termination</Button>
          </div>
        </form>
      </Modal>
      
      <Modal isOpen="{isLogoutModalOpen}" onClose="{()" title="Sign Out"> setIsLogoutModalOpen(false)}>
        <div className="bg-gray-50 text-gray-800 p-5 rounded-xl text-sm border border-gray-200 mb-8 shadow-inner leading-relaxed">
          Are you sure you want to sign out of your workspace? You will need your credentials to access it again.
        </div>
        <div className="flex space-x-4">
          <Button className="flex-1 py-3" onClick="{()" variant="secondary"> setIsLogoutModalOpen(false)}>Cancel</Button>
          <Button className="flex-1 py-3 bg-[#111111] hover:bg-black" onClick="{onLogout}" type="button" variant="primary">Yes, Sign Out</Button>
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
    // 1. Create the Auth account first so the user is authenticated for Firestore rules
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    // 2. Query the office using the invite code now that the user is authenticated
    const officesRef = collection(db, 'artifacts', appId, 'public', 'data', 'offices');
    const q = query(officesRef, where('inviteCode', '==', code.toUpperCase().trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Invalid invite code. Please ask your administrator.");
    }

    const foundOfficeDoc = querySnapshot.docs[0];
    const foundOffice = { id: foundOfficeDoc.id, ...foundOfficeDoc.data() };
    
    // 3. Save the pending user profile
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
    return <SplashLoader/>;
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
            <Button onClick="{()"> { setAuthMode('login'); setCurrentView('auth'); }} className="w-full sm:w-auto px-8 py-4 rounded-xl text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Log in to your workspace <ArrowRight className="w-4 h-4 ml-2"/>
            </Button>
            <Button onClick="{()" variant="secondary"> { setAuthMode('track'); setCurrentView('auth'); }} className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-white text-black border border-[#E5E5E5] hover:bg-gray-50 hover:border-black shadow-sm hover:-translate-y-0.5 transition-all">
              Client Case Tracking
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === 'auth') {
    return (
      <AuthView goBack="{()" mode="{authMode}" onCreateOffice="{handleCreateOffice}" onJoinOffice="{handleJoinOffice}" onLogin="{handleLogin}" onResetPassword="{handleResetPassword}" onTrackCase="{handleTrackCase}" setMode="{setAuthMode}"> setCurrentView('landing')} 
      />
    );
  }

  if (currentView === 'client') {
    return <ClientPortalView dbData="{dbData}" onExit="{handleLogout}" trackingCode="{trackedCode}"/>;
  }

  if (currentView === 'dashboard' && appUser) {
    return <DashboardView currentUser="{appUser}" dbData="{dbData}" onLogout="{handleLogout}"/>;
  }

  // Final fallback (should not be reached)
  return <SplashLoader/>;
}
```eof