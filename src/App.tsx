import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, Briefcase, Calendar, CheckCircle2, FileText, Search, Settings, 
  Users, Plus, Filter, Clock, LogOut, ChevronRight, Download, Upload, 
  FileCheck, Edit3, X, Paperclip, AlertCircle, Mic, Square, ArrowRight, Layers,
  Mail, Lock, User
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, updateDoc 
} from 'firebase/firestore';

// Safely configure Firebase.
// This attempts to pull from Vercel env variables first (NEXT_PUBLIC_). 
// If they fail or are missing, it falls back directly to the valid API keys you provided.
let firebaseConfig = {
  apiKey: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY : "AIzaSyDL3dgiAvCplblJF0cjDK3O4e41hytysiI",
  authDomain: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN : "chamber-app-fa0f7.firebaseapp.com",
  projectId: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID : "chamber-app-fa0f7",
  storageBucket: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET : "chamber-app-fa0f7.firebasestorage.app",
  messagingSenderId: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID : "691076974969",
  appId: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? process.env.NEXT_PUBLIC_FIREBASE_APP_ID : "1:691076974969:web:34d38d49d23187c04987a8",
  measurementId: "G-FZE4V95WEF"
};

// Canvas Preview Environment Support
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
  <div onClick={onClick} className={`bg-white border border-[#E5E5E5] rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', type = 'button', className = "", disabled = false }) => {
  const base = "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = variant === 'primary' 
    ? `${base} bg-[#111111] text-white hover:bg-black shadow-sm`
    : `${base} bg-[#F0F0F0] text-[#111111] hover:bg-[#E5E5E5]`;
  return <button type={type} onClick={onClick} disabled={disabled} className={`${styles} ${className}`}>{children}</button>;
};

const RoleBadge = ({ role }) => {
  const config = ROLE_CONFIG[role] || { label: role, bg: 'bg-gray-100', text: 'text-gray-800' };
  return <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded ${config.bg} ${config.text}`}>{config.label}</span>;
};

const Modal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden border border-[#E5E5E5] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E5E5] bg-gray-50 shrink-0">
          <h3 className="font-bold text-base tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-black"><X className="w-4 h-4" /></button>
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
      className={`w-full flex items-center px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
        active ? 'bg-[#111111] text-white shadow-sm' : 'text-gray-600 hover:bg-[#F0F0F0] hover:text-black'
      }`}
    >
      <Icon className="w-4 h-4 mr-3" />
      {name}
    </button>
  );
};

const AuthView = ({ mode, setMode, onLogin, onCreateOffice, onJoinOffice, onTrackCase, onResetPassword, goBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      if (mode === 'login') await onLogin(email, password);
      else if (mode === 'signup') await onCreateOffice(name, email, password, officeName);
      else if (mode === 'join') await onJoinOffice(name, email, password, inviteCode);
      else if (mode === 'track') await onTrackCase(trackingNumber);
      else if (mode === 'reset') {
        await onResetPassword(email);
        setSuccessMsg("If an account exists, a password reset link has been sent to your email.");
      }
    } catch (err) {
      setErrorMsg(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col justify-center items-center p-6 relative">
      <button onClick={goBack} className="absolute top-6 left-6 flex items-center text-sm font-medium text-gray-500 hover:text-black transition-colors">
        <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to Home
      </button>
      <Card className="p-8 max-w-md w-full shadow-lg">
        <div className="flex items-center space-x-2 mb-6">
          <Scale className="w-5 h-5 text-black" />
          <h2 className="text-xl font-bold tracking-tight">Chambers</h2>
        </div>
        <div className="mb-6">
          <h3 className="text-2xl font-bold tracking-tight mb-1">
            {mode === 'login' && 'Log in to workspace'}
            {mode === 'signup' && 'Create law chambers'}
            {mode === 'join' && 'Join an existing office'}
            {mode === 'track' && 'Client Case Tracking'}
            {mode === 'reset' && 'Reset your password'}
          </h3>
          <p className="text-sm text-gray-500">
            {mode === 'login' && 'Enter your credentials to access your cases.'}
            {mode === 'signup' && 'Set up your practice workspace.'}
            {mode === 'join' && 'Enter your invite code provided by your admin.'}
            {mode === 'track' && 'Enter the tracking code provided by your advocate.'}
            {mode === 'reset' && 'Enter your email to receive a secure reset link.'}
          </p>
        </div>

        {errorMsg && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 flex items-start"><AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" /> <span>{errorMsg}</span></div>}
        {successMsg && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200 flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 shrink-0 mt-0.5" /> <span>{successMsg}</span></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'track' ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Client Tracking Code</label>
              <input required type="text" value={trackingNumber} onChange={e=>setTrackingNumber(e.target.value)} placeholder="e.g. TRK-ABC123" className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm font-mono uppercase" />
            </div>
          ) : (
            <>
              {(mode === 'signup' || mode === 'join') && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input required type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Priya Sharma" className="w-full pl-9 pr-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm" />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@chambers.com" className="w-full pl-9 pr-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm" />
                </div>
              </div>
              
              {mode !== 'reset' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-700">Password</label>
                    {mode === 'login' && <button type="button" onClick={() => setMode('reset')} className="text-xs font-medium text-[#4F46E5] hover:underline">Forgot password?</button>}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-9 pr-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm" />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Office / Chambers Name</label>
                  <input required type="text" value={officeName} onChange={e=>setOfficeName(e.target.value)} placeholder="e.g. Sharma & Associates" className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm" />
                </div>
              )}
              {mode === 'join' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Office Invite Code</label>
                  <input required type="text" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} placeholder="e.g. CH-LEGAL1" className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm font-mono uppercase" />
                </div>
              )}
            </>
          )}
          <Button type="submit" disabled={isLoading} className="w-full py-3.5 mt-2">
            {isLoading ? 'Processing...' : (
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
        <div className="mt-6 pt-6 border-t border-[#E5E5E5] text-center text-sm text-gray-500 space-y-2">
          {mode === 'login' && (
            <>
              <p>Don't have an office? <button onClick={() => setMode('signup')} className="text-black font-bold hover:underline">Create chambers</button></p>
              <p>Have an invite code? <button onClick={() => setMode('join')} className="text-black font-bold hover:underline">Join office</button></p>
              <p>Are you a client? <button onClick={() => setMode('track')} className="text-black font-bold hover:underline">Track case with code</button></p>
            </>
          )}
          {mode !== 'login' && (
            <p>Already have an account? <button onClick={() => { setMode('login'); setErrorMsg(""); setSuccessMsg(""); }} className="text-black font-bold hover:underline">Return to Log in</button></p>
          )}
        </div>
      </Card>
    </div>
  );
};

const ClientPortalView = ({ trackingCode, dbData, onExit }) => {
  const clientCases = dbData.cases.filter(c => c.trackingNumber === trackingCode);
  const [selectedCaseId, setSelectedCaseId] = useState(clientCases[0]?.id || null);

  useEffect(() => {
    if (!selectedCaseId && clientCases.length > 0) setSelectedCaseId(clientCases[0].id);
  }, [clientCases, selectedCaseId]);

  const activeCase = clientCases.find(c => c.id === selectedCaseId) || clientCases[0];
  
  const updates = dbData.updates.filter(u => u.caseId === activeCase?.id).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  const docs = dbData.documents.filter(d => d.caseId === activeCase?.id);
  const invoices = dbData.invoices.filter(i => i.caseId === activeCase?.id);

  if (clientCases.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col justify-center items-center p-6 text-center">
         <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
         <h2 className="text-xl font-bold mb-2">No Cases Found</h2>
         <p className="text-gray-500 text-sm mb-6 max-w-sm">We couldn't find any active matters linked to tracking code <strong className="font-mono">{trackingCode}</strong>.</p>
         <Button onClick={onExit}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#111111] font-sans flex flex-col">
      <header className="h-16 bg-white border-b border-[#E5E5E5] flex justify-between items-center px-6 md:px-8 shrink-0">
        <div className="flex items-center space-x-2">
          <Scale className="w-5 h-5 text-black" />
          <span className="font-bold tracking-tight">Client Portal</span>
        </div>
        <Button variant="secondary" onClick={onExit} className="py-1.5 px-3 text-xs">Exit Portal</Button>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 overflow-y-auto">
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center">
             Tracking Code: <span className="text-[#111111] ml-2 font-mono bg-gray-200 px-2 py-0.5 rounded">{trackingCode}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Case Status Dashboard</h1>
        </div>

        {clientCases.length > 1 && (
          <div className="mb-8 flex items-center space-x-2 overflow-x-auto pb-2">
            <Layers className="w-4 h-4 text-gray-400 mr-1 shrink-0" />
            <span className="text-xs font-bold text-gray-500 uppercase shrink-0 mr-2">Your Matters:</span>
            {clientCases.map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedCaseId(c.id)}
                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all shrink-0 ${activeCase?.id === c.id ? 'bg-[#111111] text-white border-[#111111] shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-black hover:bg-gray-50'}`}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}

        {activeCase && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{activeCase.title}</h2>
                  <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono">
                    <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200 text-[#111111] font-semibold">Case No: {activeCase.caseNumber || 'N/A'}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200 text-[#111111] font-semibold">CNR: {activeCase.cnr || 'N/A'}</span>
                    <span>Court: {activeCase.court || 'Pending'}</span>
                  </div>
                </div>
                <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-bold shrink-0">{activeCase.status}</span>
              </div>
              <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center text-sm">
                <span className="text-gray-500">Next Hearing Date:</span>
                <span className="font-bold text-[#D97706]">{activeCase.nextHearing ? new Date(activeCase.nextHearing).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'}) : 'TBD'}</span>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center"><Clock className="w-4 h-4 mr-2 text-gray-400"/> Recent Updates</h3>
                <div className="space-y-4">
                  {updates.length === 0 && <p className="text-sm text-gray-500 italic">No updates posted yet.</p>}
                  {updates.map(u => (
                    <div key={u.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
                        <span>{new Date(u.timestamp).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                      </div>
                      <h4 className="font-bold text-sm mb-1 text-[#111111]">{u.title}</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{u.text}</p>
                      {u.attachment && (
                        <div className="mt-2 text-xs font-medium text-[#4F46E5] flex items-center">
                           <Paperclip className="w-3 h-3 mr-1" /> Document attached to vault
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <div className="space-y-8">
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center"><FileText className="w-4 h-4 mr-2 text-gray-400"/> Documents & Filings</h3>
                  <div className="space-y-2">
                    {docs.length === 0 && <p className="text-sm text-gray-500 italic">No documents available.</p>}
                    {docs.map(d => (
                      <div key={d.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm group hover:border-black transition-colors">
                        <div className="flex flex-col">
                           <span className="font-medium text-gray-800">{d.name}</span>
                           <span className="text-[10px] text-gray-400 font-mono mt-0.5">{new Date(d.date).toLocaleDateString('en-US')}</span>
                        </div>
                        <Download className="w-4 h-4 text-gray-400 cursor-pointer group-hover:text-[#4F46E5] transition-colors" />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center"><FileCheck className="w-4 h-4 mr-2 text-gray-400"/> Invoices & Billing</h3>
                  <div className="space-y-2">
                    {invoices.length === 0 && <p className="text-sm text-gray-500 italic">No invoices generated.</p>}
                    {invoices.map(inv => (
                      <div key={inv.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                        <div>
                          <div className="font-bold font-mono text-[#111111]">{inv.id}</div>
                          <div className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="font-bold text-[#111111]">₹{inv.amount.toLocaleString('en-IN')}</div>
                          <span className={`mt-1 text-[10px] uppercase px-2 py-0.5 rounded font-bold ${inv.status === 'SETTLED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
      </main>
    </div>
  );
};

const CaseDetailView = ({ activeCaseId, goBack, dbData, currentUser, onOpenNewTask }) => {
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateText, setUpdateText] = useState("");
  const [updateAttachmentFile, setUpdateAttachmentFile] = useState(null);
  const [updateAttachmentName, setUpdateAttachmentName] = useState("");
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCaseData, setEditCaseData] = useState({});
  const [showBriefModal, setShowBriefModal] = useState(false);
  
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [newDocFile, setNewDocFile] = useState(null);
  const [newDocName, setNewDocName] = useState("");
  const [newDocDate, setNewDocDate] = useState(new Date().toISOString().split('T')[0]);

  const activeCase = dbData.cases.find(c => c.id === activeCaseId);
  const caseUpdates = dbData.updates.filter(u => u.caseId === activeCaseId).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const caseTasks = dbData.tasks.filter(t => t.caseId === activeCaseId);
  const caseDocs = dbData.documents.filter(d => d.caseId === activeCaseId);

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!updateTitle || !updateText) return;
    
    const docDisplayName = updateAttachmentName || updateAttachmentFile?.name;
    const updateId = `up_${Date.now()}`;
    const newUpdate = {
      id: updateId,
      caseId: activeCaseId,
      authorId: currentUser.id,
      title: updateTitle,
      text: updateText,
      timestamp: new Date().toISOString(),
      attachment: docDisplayName || null
    };
    
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'updates', updateId), newUpdate);
    
    if (docDisplayName) {
      const docId = `d_${Date.now()}`;
      const newDoc = {
        id: docId,
        caseId: activeCaseId,
        name: docDisplayName,
        date: new Date().toISOString().split('T')[0]
      };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'documents', docId), newDoc);
    }
    
    setUpdateTitle("");
    setUpdateText("");
    setUpdateAttachmentFile(null);
    setUpdateAttachmentName("");
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!newDocFile) return;
    const docId = `d_${Date.now()}`;
    const documentRecord = {
      id: docId,
      caseId: activeCaseId,
      name: newDocName || newDocFile.name,
      date: newDocDate
    };
    
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'documents', docId), documentRecord);
    setIsDocModalOpen(false);
    setNewDocFile(null);
    setNewDocName("");
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
      partyTwo: activeCase.partyTwo ? [...activeCase.partyTwo] : []
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdits = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cases', activeCaseId), {
      ...editCaseData,
      trackingNumber: editCaseData.trackingNumber ? editCaseData.trackingNumber.toUpperCase().trim() : activeCase.trackingNumber,
      nextHearing: editCaseData.nextHearing ? new Date(editCaseData.nextHearing).toISOString() : null
    });
    setIsEditModalOpen(false);
  };

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

  if (!activeCase) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in slide-in-from-right-4 duration-300 w-full">
      <button onClick={goBack} className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-black transition-colors">
        <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to Ledger
      </button>
      
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-3xl font-bold tracking-tight">{activeCase.title}</h2>
            <button onClick={openEditModal} className="p-1.5 text-gray-400 hover:text-[#111111] hover:bg-gray-100 rounded-md transition-colors" title="Edit Case Details">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center text-sm text-gray-600 gap-x-3 gap-y-2 mb-3">
            <span className="font-mono bg-white border border-[#E5E5E5] shadow-sm px-2 py-0.5 rounded text-black text-xs font-semibold">Case No: {activeCase.caseNumber || 'N/A'}</span>
            <span className="font-mono bg-gray-100 border border-[#E5E5E5] px-2 py-0.5 rounded text-gray-800 text-xs font-medium">CNR: {activeCase.cnr || 'N/A'}</span>
            <span>{activeCase.court || 'Pending Court Assignment'}</span>
            <span>•</span>
            <span className="text-[#D97706] font-medium">Next Hearing: {activeCase.nextHearing ? new Date(activeCase.nextHearing).toLocaleDateString('en-US') : 'TBD'}</span>
          </div>
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-1 rounded-md text-xs">
             <span className="font-semibold uppercase tracking-wider">Client Tracking ID (Group):</span>
             <span className="font-mono font-bold tracking-widest text-sm">{activeCase.trackingNumber}</span>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setShowBriefModal(true)} className="flex items-center shadow-sm shrink-0">
          <FileCheck className="w-4 h-4 mr-2" /> Export Case Brief
        </Button>
      </div>

      {( (activeCase.partyOne && activeCase.partyOne.length > 0) || (activeCase.partyTwo && activeCase.partyTwo.length > 0) ) && (
        <Card className="mb-8 p-5 bg-[#F9F9F9] border-dashed border-2 text-sm flex flex-col sm:flex-row sm:divide-x divide-[#E5E5E5]">
           <div className="flex-1 pr-6 pb-4 sm:pb-0">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Plaintiff / Petitioner / Applicant</div>
              <div className="space-y-3">
                {(!activeCase.partyOne || activeCase.partyOne.length === 0) && <div className="text-gray-500 italic">Not specified</div>}
                {activeCase.partyOne?.map((p, i) => (
                  <div key={i}>
                    <div className="font-semibold text-gray-800">{p.name || 'Unknown'}</div>
                    {p.mobile && <div className="text-gray-500 font-mono mt-0.5 text-xs">Ph: {p.mobile}</div>}
                  </div>
                ))}
              </div>
           </div>
           <div className="flex-1 sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-[#E5E5E5]">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Defendant / Respondent / Non-Applicant</div>
              <div className="space-y-3">
                {(!activeCase.partyTwo || activeCase.partyTwo.length === 0) && <div className="text-gray-500 italic">Not specified</div>}
                {activeCase.partyTwo?.map((p, i) => (
                  <div key={i}>
                    <div className="font-semibold text-gray-800">{p.name || 'Unknown'}</div>
                    {p.mobile && <div className="text-gray-500 font-mono mt-0.5 text-xs">Ph: {p.mobile}</div>}
                  </div>
                ))}
              </div>
           </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-4 bg-white border border-[#E5E5E5] shadow-sm">
            <form onSubmit={handlePostUpdate} className="space-y-3">
              <input type="text" placeholder="Update Title (e.g. Affidavit Filed)" value={updateTitle} onChange={e=>setUpdateTitle(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-md focus:border-black outline-none bg-[#F9F9F9]" required />
              <textarea placeholder="Detailed notes for the team and client timeline..." value={updateText} onChange={e=>setUpdateText(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-md focus:border-black outline-none min-h-[80px] resize-y bg-[#F9F9F9]" required />
              <div className="flex justify-between items-center mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input type="file" id="ledger-attachment" className="hidden" onChange={(e) => { setUpdateAttachmentFile(e.target.files[0]); setUpdateAttachmentName(e.target.files[0]?.name || ''); }} accept=".pdf,.doc,.docx,.jpg,.png" />
                  <label htmlFor="ledger-attachment" className="flex items-center text-xs font-bold text-gray-600 hover:text-[#111111] cursor-pointer transition-colors bg-white border border-[#E5E5E5] px-3 py-1.5 rounded-md shadow-sm">
                    <Paperclip className="w-3.5 h-3.5 mr-2" />
                    {updateAttachmentFile ? <span className="truncate max-w-[120px]">{updateAttachmentFile.name}</span> : 'Attach File'}
                  </label>
                  
                  {updateAttachmentFile && (
                    <div className="flex items-center space-x-1 animate-in fade-in">
                       <input 
                         type="text" 
                         placeholder="Display Name (e.g. Signed Order)" 
                         value={updateAttachmentName} 
                         onChange={e => setUpdateAttachmentName(e.target.value)}
                         className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-black outline-none w-48 shadow-inner"
                       />
                       <button type="button" onClick={() => { setUpdateAttachmentFile(null); setUpdateAttachmentName(""); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                <Button type="submit" className="py-1.5 text-xs shrink-0">Post to Ledger</Button>
              </div>
            </form>
          </Card>

          <div className="space-y-6 border-l-2 ml-4 border-[#E5E5E5] pl-6 relative py-4">
            {caseUpdates.map((u) => {
              const author = dbData.users.find(user=>user.id === u.authorId);
              return (
                <div key={u.id} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 bg-white border-2 border-[#111111] rounded-full group-hover:scale-125 transition-transform"></div>
                  <Card className="p-5 hover:border-black transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold">{u.title}</h4>
                      <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{new Date(u.timestamp).toLocaleDateString('en-US')}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{u.text}</p>
                    {u.attachment && (
                      <div className="mb-4 inline-block">
                        <button className="flex items-center text-xs font-semibold bg-gray-50 border border-gray-200 px-3 py-2 rounded-md hover:bg-gray-100 hover:border-black transition-colors">
                          <Paperclip className="w-3.5 h-3.5 mr-2 text-[#4F46E5]" />
                          {u.attachment}
                        </button>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                      <span className="text-xs font-semibold text-[#111111]">{author?.name || 'Unknown'}</span>
                      <RoleBadge role={author?.role || 'PENDING'} />
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-gray-400"/> Active Tasks</h3>
              <button onClick={onOpenNewTask} className="text-[10px] uppercase tracking-wider font-bold bg-[#111111] text-white px-2.5 py-1.5 rounded flex items-center hover:bg-black transition-colors shadow-sm">
                <Plus className="w-3 h-3 mr-1" /> Add Task
              </button>
            </div>
            <div className="space-y-3">
              {caseTasks.length === 0 ? <div className="text-sm text-gray-500 italic p-4 text-center bg-gray-50 rounded border border-dashed border-gray-200">No active tasks.</div> : caseTasks.map(t => {
                const assignees = (t.assigneeIds || []).map(id => dbData.users.find(u=>u.id===id)).filter(Boolean);
                const canModify = canUserModifyTask(t);
                return (
                  <div key={t.id} className="flex justify-between items-start text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0 group">
                    <div className="flex-1 pr-3">
                      <div className={`font-medium mb-1 ${t.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-[#111111]'}`}>{t.title}</div>
                      {t.voiceNote && (
                        <div className="mt-1.5 mb-1.5 text-[11px] bg-purple-50 text-purple-800 p-2 rounded-md border border-purple-100 italic leading-snug">
                          🎤 Voice Note: "{t.voiceNote}"
                        </div>
                      )}
                      <div className="text-[10px] text-gray-500 mt-1 flex flex-wrap items-center gap-2 font-mono">
                        <span className="bg-gray-50 border border-gray-200 px-1 py-0.5 rounded">Due: {t.dueDate}</span>
                        <div className="flex -space-x-1 overflow-hidden ml-1">
                           {assignees.map((user) => (
                             <div key={user.id} className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-[#111111] text-white text-center text-[8px] font-bold leading-5" title={user.name}>
                               {user.name.charAt(0)}
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={t.status === 'COMPLETED'} 
                      disabled={!canModify}
                      onChange={async () => {
                        if (!canModify) return;
                        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), {
                           status: t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
                        });
                      }} 
                      className={`mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black ${canModify ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`} 
                      title={canModify ? "Toggle Status" : "Insufficient permissions to edit this task."}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
          
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center"><Download className="w-4 h-4 mr-2 text-gray-400"/> Document Vault</h3>
              <button onClick={() => setIsDocModalOpen(true)} className="text-xs font-bold bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded flex items-center transition-colors">
                <Upload className="w-3 h-3 mr-1" /> Upload
              </button>
            </div>
            <div className="space-y-2">
              {caseDocs.length === 0 && <div className="text-sm text-gray-500 italic p-4 text-center bg-gray-50 rounded border border-dashed border-gray-200">No documents uploaded.</div>}
              {caseDocs.map((doc) => (
                <button key={doc.id} className="w-full flex items-center justify-between p-2.5 text-sm hover:bg-[#F9F9F9] rounded-lg border border-transparent hover:border-black transition-colors group">
                  <div className="flex flex-col text-left overflow-hidden pr-2">
                    <span className="text-[#111111] font-medium truncate group-hover:text-[#4F46E5] transition-colors">{doc.name}</span>
                    <span className="text-[10px] font-mono text-gray-400 mt-0.5 bg-gray-50 px-1 py-0.5 rounded w-fit">{new Date(doc.date).toLocaleDateString('en-US')}</span>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-black flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal title="Edit Case Details" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
         <form onSubmit={handleSaveEdits} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
               <div className="col-span-2">
                 <label className="block text-xs font-bold text-gray-700 mb-1">Matter Title *</label>
                 <input required type="text" value={editCaseData.title || ''} onChange={e=>setEditCaseData({...editCaseData, title: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded-md focus:border-black outline-none text-sm transition-all" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1">Case Number</label>
                 <input type="text" value={editCaseData.caseNumber || ''} onChange={e=>setEditCaseData({...editCaseData, caseNumber: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded-md focus:border-black outline-none text-sm font-mono transition-all" placeholder="e.g. CS/1042/2026" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1">CNR Number</label>
                 <input type="text" value={editCaseData.cnr || ''} onChange={e=>setEditCaseData({...editCaseData, cnr: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded-md focus:border-black outline-none text-sm font-mono transition-all" />
               </div>
               <div className="col-span-2">
                 <label className="block text-xs font-bold text-gray-700 mb-1">Client Tracking ID (Group multiple cases for one client)</label>
                 <input type="text" value={editCaseData.trackingNumber || ''} onChange={e=>setEditCaseData({...editCaseData, trackingNumber: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-black rounded-md focus:ring-1 focus:ring-black outline-none text-sm font-mono uppercase transition-all shadow-sm" placeholder="e.g. TRK-ABC123" />
                 <p className="text-[10px] text-gray-500 mt-1">Clients use this exact code to view their dashboard. Paste an existing code to group matters.</p>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1">Next Hearing Date</label>
                 <input type="date" value={editCaseData.nextHearing || ''} onChange={e=>setEditCaseData({...editCaseData, nextHearing: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded-md focus:border-black outline-none text-sm transition-all" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1">Court Name / Authority</label>
                 <input type="text" value={editCaseData.court || ''} onChange={e=>setEditCaseData({...editCaseData, court: e.target.value})} className="w-full px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded-md focus:border-black outline-none text-sm transition-all" />
               </div>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-4 pt-2">
               <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">Parties Involved</div>
               
               <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                 <div className="text-xs font-bold mb-3 flex justify-between items-center text-[#111111]">
                   <span>Plaintiff / Petitioner / Applicant</span>
                   <button type="button" onClick={() => setEditCaseData({...editCaseData, partyOne: [...(editCaseData.partyOne||[]), {name:'', mobile:''}]})} className="text-white bg-[#111111] hover:bg-black px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">+ Add</button>
                 </div>
                 {(editCaseData.partyOne || []).map((p, i) => (
                   <div key={i} className="flex space-x-2 mb-2 items-start animate-in fade-in slide-in-from-top-2">
                     <div className="flex-1">
                       <input type="text" placeholder="Full Name" value={p.name} onChange={e => { const newP = [...editCaseData.partyOne]; newP[i].name = e.target.value; setEditCaseData({...editCaseData, partyOne: newP}); }} className="w-full px-2 py-1.5 bg-white border border-[#E5E5E5] rounded focus:border-black outline-none text-sm transition-all shadow-sm" />
                     </div>
                     <div className="flex-1">
                       <input type="text" placeholder="+91..." value={p.mobile} onChange={e => { const newP = [...editCaseData.partyOne]; newP[i].mobile = e.target.value; setEditCaseData({...editCaseData, partyOne: newP}); }} className="w-full px-2 py-1.5 bg-white border border-[#E5E5E5] rounded focus:border-black outline-none text-sm font-mono transition-all shadow-sm" />
                     </div>
                     <button type="button" onClick={() => { const newP = [...editCaseData.partyOne]; newP.splice(i, 1); setEditCaseData({...editCaseData, partyOne: newP}); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                   </div>
                 ))}
                 {(!editCaseData.partyOne || editCaseData.partyOne.length === 0) && <div className="text-xs text-gray-400 italic">No parties added.</div>}
               </div>

               <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                 <div className="text-xs font-bold mb-3 flex justify-between items-center text-[#111111]">
                   <span>Defendant / Respondent / Non-Applicant</span>
                   <button type="button" onClick={() => setEditCaseData({...editCaseData, partyTwo: [...(editCaseData.partyTwo||[]), {name:'', mobile:''}]})} className="text-white bg-[#111111] hover:bg-black px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">+ Add</button>
                 </div>
                 {(editCaseData.partyTwo || []).map((p, i) => (
                   <div key={i} className="flex space-x-2 mb-2 items-start animate-in fade-in slide-in-from-top-2">
                     <div className="flex-1">
                       <input type="text" placeholder="Full Name" value={p.name} onChange={e => { const newP = [...editCaseData.partyTwo]; newP[i].name = e.target.value; setEditCaseData({...editCaseData, partyTwo: newP}); }} className="w-full px-2 py-1.5 bg-white border border-[#E5E5E5] rounded focus:border-black outline-none text-sm transition-all shadow-sm" />
                     </div>
                     <div className="flex-1">
                       <input type="text" placeholder="+91..." value={p.mobile} onChange={e => { const newP = [...editCaseData.partyTwo]; newP[i].mobile = e.target.value; setEditCaseData({...editCaseData, partyTwo: newP}); }} className="w-full px-2 py-1.5 bg-white border border-[#E5E5E5] rounded focus:border-black outline-none text-sm font-mono transition-all shadow-sm" />
                     </div>
                     <button type="button" onClick={() => { const newP = [...editCaseData.partyTwo]; newP.splice(i, 1); setEditCaseData({...editCaseData, partyTwo: newP}); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                   </div>
                 ))}
                 {(!editCaseData.partyTwo || editCaseData.partyTwo.length === 0) && <div className="text-xs text-gray-400 italic">No parties added.</div>}
               </div>
            </div>
            
            <Button type="submit" className="w-full py-3.5 mt-4">Save Changes</Button>
         </form>
      </Modal>

      <Modal title="Generate Case Brief" isOpen={showBriefModal} onClose={() => setShowBriefModal(false)}>
        <div className="bg-gray-50 p-6 rounded-md border border-gray-200 font-serif text-sm h-64 overflow-y-auto mb-4">
          <div className="text-center mb-6 border-b pb-4">
            <h1 className="font-bold text-lg uppercase tracking-widest">{dbData.offices.find(o=>o.id === activeCase.officeId)?.name || 'Chambers'}</h1>
            <div className="text-gray-500 text-xs mt-1 font-sans">CONFIDENTIAL CASE BRIEF</div>
          </div>
          <h2 className="font-bold text-lg mb-1">{activeCase.title}</h2>
          <div className="mb-4 text-xs font-sans text-gray-600 font-mono bg-white inline-block px-2 py-1 border border-gray-200 rounded">
            Case No: {activeCase.caseNumber || 'N/A'} | CNR: {activeCase.cnr || 'N/A'} | Court: {activeCase.court || 'Pending'}
          </div>
          
          {( (activeCase.partyOne && activeCase.partyOne.length > 0) || (activeCase.partyTwo && activeCase.partyTwo.length > 0) ) && (
            <div className="mb-6 pb-4 border-b border-gray-200 text-xs font-sans flex justify-between">
              <div className="flex-1 pr-4">
                <strong className="block text-[10px] uppercase text-gray-500 mb-1">Plaintiff / Petitioner</strong>
                {(!activeCase.partyOne || activeCase.partyOne.length === 0) && 'N/A'}
                {activeCase.partyOne?.map((p,i) => (
                   <div key={i}>{p.name} {p.mobile && `(${p.mobile})`}</div>
                ))}
              </div>
              <div className="flex-1 text-right pl-4">
                <strong className="block text-[10px] uppercase text-gray-500 mb-1">Defendant / Respondent</strong>
                {(!activeCase.partyTwo || activeCase.partyTwo.length === 0) && 'N/A'}
                {activeCase.partyTwo?.map((p,i) => (
                   <div key={i}>{p.name} {p.mobile && `(${p.mobile})`}</div>
                ))}
              </div>
            </div>
          )}

          <h3 className="font-bold underline mb-2 tracking-wider text-xs uppercase font-sans">Procedural History</h3>
          {caseUpdates.map(u => (
            <div key={u.id} className="mb-3 pl-4 border-l-2 border-black font-sans text-xs">
              <strong className="block mb-0.5">{new Date(u.timestamp).toLocaleDateString('en-US')} - {u.title}</strong> 
              <span className="text-gray-700">{u.text}</span>
            </div>
          ))}
        </div>
        <Button className="w-full" onClick={() => { setShowBriefModal(false); }}>
          <Download className="w-4 h-4 mr-2" /> Download Print-Ready PDF
        </Button>
      </Modal>

      <Modal title="Upload Document" isOpen={isDocModalOpen} onClose={() => { setIsDocModalOpen(false); setNewDocFile(null); setNewDocName(""); }}>
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Select File</label>
            <input required type="file" onChange={e => {
                setNewDocFile(e.target.files[0]);
                if (!newDocName && e.target.files[0]) {
                  setNewDocName(e.target.files[0].name);
                }
              }} className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-md focus:border-black outline-none bg-[#F9F9F9]" accept=".pdf,.doc,.docx,.jpg,.png" />
          </div>
          {newDocFile && (
             <div className="animate-in fade-in">
               <label className="block text-xs font-bold text-gray-700 mb-1">Document Display Name</label>
               <input required type="text" value={newDocName} onChange={e => setNewDocName(e.target.value)} placeholder="e.g. Affidavit of Evidence" className="w-full px-4 py-3 bg-[#F9F9F9] border border-black rounded-lg focus:ring-1 focus:ring-black outline-none text-sm transition-all shadow-sm" />
               <p className="text-[10px] text-gray-500 mt-1">This name will be displayed in the vault instead of the raw filename.</p>
             </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Document Date</label>
            <input required type="date" value={newDocDate} onChange={e => setNewDocDate(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm transition-all" />
          </div>
          <Button type="submit" className="w-full py-3.5 mt-6"><Upload className="w-4 h-4 mr-2"/> Upload to Vault</Button>
        </form>
      </Modal>
    </div>
  );
};

const DashboardView = ({ currentUser, dbData, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCaseId, setActiveCaseId] = useState(null);
  
  const [isNewMatterOpen, setIsNewMatterOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newCnr, setNewCnr] = useState("");
  const [newCourt, setNewCourt] = useState("");
  const [newTrackingNumber, setNewTrackingNumber] = useState("");
  const [newPartyOne, setNewPartyOne] = useState([{name: '', mobile: ''}]);
  const [newPartyTwo, setNewPartyTwo] = useState([{name: '', mobile: ''}]);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceCaseId, setInvoiceCaseId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceFile, setInvoiceFile] = useState(null);

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCaseId, setNewTaskCaseId] = useState("");
  const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskVoiceNote, setNewTaskVoiceNote] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const [isFireModalOpen, setIsFireModalOpen] = useState(false);
  const [userToFire, setUserToFire] = useState(null);
  const [fireReason, setFireReason] = useState("");

  const [draggingColumn, setDraggingColumn] = useState(null);

  const myOfficeCases = dbData.cases.filter(c => c.officeId === currentUser.officeId);
  const activeCasesCount = myOfficeCases.filter(c => c.status === 'Active').length;
  const myOfficeTasks = dbData.tasks.filter(t => myOfficeCases.map(c=>c.id).includes(t.caseId));

  const isSeniorOrManager = currentUser.role === 'SENIOR_ADVOCATE' || currentUser.role === 'MANAGER';

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

  const handleStartVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setNewTaskVoiceNote(transcript);
      if (!newTaskTitle) {
        setNewTaskTitle(transcript.slice(0, 50));
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { e.target.classList.add('opacity-40'); }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-40');
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
    setNewTaskVoiceNote(task.voiceNote || '');
    setNewTaskDueDate(task.dueDate || ''); 
    setIsNewTaskModalOpen(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskCaseId) return;

    const finalAssigneeIds = newTaskAssigneeIds.length > 0 ? newTaskAssigneeIds : [currentUser.id];
    const dueDateStr = newTaskDueDate || 'No date';
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (editingTaskId) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', editingTaskId), {
         title: newTaskTitle, caseId: newTaskCaseId, assigneeIds: finalAssigneeIds, voiceNote: newTaskVoiceNote, dueDate: newTaskDueDate || dueDateStr
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
        createdAt: todayStr,
        voiceNote: newTaskVoiceNote
      };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), newTask);
    }

    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
    setIsNewTaskModalOpen(false);
    setEditingTaskId(null);
    setNewTaskTitle("");
    setNewTaskCaseId("");
    setNewTaskAssigneeIds([]);
    setNewTaskDueDate("");
    setNewTaskVoiceNote("");
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceCaseId || !invoiceAmount) return;
    
    const randomId = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invId = `INV-${randomId}`;
    const newInvoice = {
      id: invId,
      officeId: currentUser.officeId,
      caseId: invoiceCaseId,
      amount: parseFloat(invoiceAmount),
      status: 'DRAFT',
      date: new Date().toLocaleDateString('en-CA'),
      attachment: invoiceFile ? invoiceFile.name : null
    };

    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'invoices', invId), newInvoice);
    setIsInvoiceModalOpen(false);
    setInvoiceCaseId("");
    setInvoiceAmount("");
    setInvoiceFile(null);
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
      status: 'Active',
      trackingNumber: newTrackingNumber ? newTrackingNumber.toUpperCase().trim() : `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cases', caseId), newCase);
    setIsNewMatterOpen(false);
    setNewTitle("");
    setNewCaseNumber("");
    setNewCnr("");
    setNewCourt("");
    setNewTrackingNumber("");
    setNewPartyOne([{name: '', mobile: ''}]);
    setNewPartyTwo([{name: '', mobile: ''}]);
    setActiveTab('ledger');
  };

  const handleFireUser = async (e) => {
    e.preventDefault();
    if (!userToFire || !fireReason) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userToFire.id), {
      role: 'FIRED', firedReason: fireReason
    });
    setIsFireModalOpen(false);
    setUserToFire(null);
    setFireReason("");
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setActiveCaseId(null);
  };

  if (currentUser.role === 'PENDING') {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-[#D97706] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Account Pending Approval</h2>
          <p className="text-gray-600 text-sm mb-6">Your request to join the workspace has been received. Please wait for a Senior Advocate or Manager to assign your role access.</p>
          <Button onClick={onLogout} variant="secondary" className="w-full">Sign Out</Button>
        </Card>
      </div>
    );
  }

  if (currentUser.role === 'FIRED') {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md w-full border-t-4 border-t-red-600">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Revoked</h2>
          <p className="text-gray-600 text-sm mb-4">Your access to this workspace has been permanently terminated.</p>
          <div className="bg-red-50 text-red-800 p-4 rounded-md text-sm text-left mb-6 border border-red-100">
            <span className="font-bold block mb-1">Reason for termination:</span>
            {currentUser.firedReason || 'No specific reason provided.'}
          </div>
          <Button onClick={onLogout} variant="secondary" className="w-full">Sign Out</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#111111] font-sans flex h-screen overflow-hidden">
      <aside className="w-64 bg-white border-r border-[#E5E5E5] flex flex-col flex-shrink-0 z-20 shadow-[2px_0_12px_rgba(0,0,0,0.02)] hidden md:flex">
        <button 
          onClick={() => handleTabChange('overview')} 
          className="h-16 flex items-center px-6 border-b border-[#E5E5E5] hover:bg-gray-50 transition-colors group text-left w-full focus:outline-none"
        >
          <Scale className="w-5 h-5 mr-2 text-black group-hover:scale-110 transition-transform" />
          <h1 className="font-bold tracking-tight text-lg">Chambers</h1>
        </button>
        <div className="px-6 py-4 border-b border-[#E5E5E5] bg-gray-50 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></span> Systems Online
          </span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <SidebarItem id="overview" name="Overview" icon={Clock} activeTab={activeTab} onClick={handleTabChange} />
          <SidebarItem id="ledger" name="Master Ledger" icon={Briefcase} activeTab={activeTab} onClick={handleTabChange} />
          <SidebarItem id="tasks" name="Task Pipeline" icon={CheckCircle2} activeTab={activeTab} onClick={handleTabChange} />
          {isSeniorOrManager && (
            <>
              <SidebarItem id="financials" name="Financials" icon={FileText} activeTab={activeTab} onClick={handleTabChange} />
              <SidebarItem id="team" name="Team & Access" icon={Users} activeTab={activeTab} onClick={handleTabChange} />
            </>
          )}
        </nav>
        <div className="p-4 border-t border-[#E5E5E5] cursor-pointer hover:bg-gray-50 transition-colors group shrink-0" onClick={onLogout}>
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${ROLE_CONFIG[currentUser.role]?.bg} ${ROLE_CONFIG[currentUser.role]?.text}`}>
              {currentUser.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
            </div>
            <div className="flex flex-col text-left flex-1 overflow-hidden">
              <span className="text-sm font-semibold truncate group-hover:text-[#4F46E5] transition-colors">{currentUser.name}</span>
              <RoleBadge role={currentUser.role} />
            </div>
            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors shrink-0" />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="md:hidden h-14 bg-white border-b border-[#E5E5E5] flex justify-between items-center px-4 shrink-0">
           <button onClick={() => handleTabChange('overview')} className="flex items-center space-x-2 font-bold focus:outline-none">
              <Scale className="w-5 h-5 text-black" />
              <span>Chambers</span>
           </button>
           <div className="flex space-x-2">
             <button onClick={() => handleTabChange('ledger')} className="p-2 text-gray-500 hover:text-black"><Briefcase className="w-5 h-5" /></button>
             <button onClick={() => handleTabChange('tasks')} className="p-2 text-gray-500 hover:text-black"><CheckCircle2 className="w-5 h-5" /></button>
             <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-600"><LogOut className="w-5 h-5" /></button>
           </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#F9F9F9]">
          
          {}
          {activeTab === 'overview' && !activeCaseId && (
            <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in duration-300">
              <header className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                  <div className="text-xs font-bold tracking-[0.2em] text-gray-400 mb-2 uppercase">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <h2 className="text-4xl font-bold tracking-tight">
                    {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {currentUser.name.split(' ')[0]}.
                  </h2>
                  <p className="text-gray-500 mt-2 text-lg">Here's the shape of your practice today.</p>
                </div>
                {isSeniorOrManager && (
                  <Button onClick={() => setIsNewMatterOpen(true)} className="py-3 px-5 shadow-sm shrink-0">
                    <Plus className="w-4 h-4 mr-2" /> New matter
                  </Button>
                )}
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card className="p-6 border-l-4 border-l-[#111111] hover:shadow-md transition-shadow">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center"><Briefcase className="w-4 h-4 mr-2"/> Active matters</div>
                  <div className="text-5xl font-bold text-[#111111]">{activeCasesCount.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-green-700 font-medium bg-green-50 px-2 py-1 rounded w-fit mt-3 border border-green-200">+1 this month</div>
                </Card>
                <Card className="p-6 border-l-4 border-l-[#111111] hover:shadow-md transition-shadow">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2"/> My assigned tasks</div>
                  <div className="text-5xl font-bold text-[#111111]">
                    {myOfficeTasks.filter(t => (t.assigneeIds || []).includes(currentUser.id) && t.status !== 'COMPLETED').length.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded w-fit mt-3 border border-amber-200">Pending action</div>
                </Card>
                <Card className="p-6 border-l-4 border-l-[#111111] hover:shadow-md transition-shadow">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center"><Calendar className="w-4 h-4 mr-2"/> Upcoming hearings</div>
                  <div className="text-5xl font-bold text-[#111111]">{myOfficeCases.filter(c=>c.nextHearing).length.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded w-fit mt-3 border border-blue-200">Next in 5 days</div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl tracking-tight">Recent matter activity</h3>
                    <button onClick={()=>setActiveTab('ledger')} className="text-sm font-medium text-gray-500 hover:text-black transition-colors">View all</button>
                  </div>
                  <div className="space-y-4">
                    {dbData.updates.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,4).map(up => {
                      const c = dbData.cases.find(c=>c.id === up.caseId);
                      const u = dbData.users.find(u=>u.id === up.authorId);
                      if(!c || c.officeId !== currentUser.officeId) return null;
                      return (
                        <Card key={up.id} onClick={() => {setActiveTab('ledger'); setActiveCaseId(c.id);}} className="p-5 hover:border-black transition-all cursor-pointer group">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <span className="font-bold text-[15px] group-hover:text-[#4F46E5] transition-colors">{c.title}</span>
                            <span className="text-[10px] text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100 shrink-0">{new Date(up.timestamp).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</span>
                          </div>
                          <div className="text-sm text-gray-600 line-clamp-1">{up.text}</div>
                          <div className="mt-3 flex items-center space-x-2 text-xs border-t border-gray-50 pt-3">
                            <span className="font-semibold text-[#111111]">{u?.name || 'Unknown'}</span>
                            <RoleBadge role={u?.role || 'PENDING'} />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl tracking-tight">Assigned tasks (by due date)</h3>
                    <span className="bg-[#111111] text-white text-[10px] font-bold px-2 py-1 rounded-full shrink-0">
                      {myOfficeTasks.filter(t => (t.assigneeIds || []).includes(currentUser.id) && t.status !== 'COMPLETED').length} left
                    </span>
                  </div>
                  <div className="space-y-4">
                    {myOfficeTasks
                      .filter(t => (t.assigneeIds || []).includes(currentUser.id) && t.status !== 'COMPLETED')
                      .sort((a, b) => {
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return new Date(a.dueDate) - new Date(b.dueDate);
                      })
                      .slice(0, 4)
                      .map(t => {
                        const c = dbData.cases.find(c=>c.id === t.caseId);
                        const canModify = canUserModifyTask(t);
                        return (
                          <Card key={t.id} className="p-5 flex items-center hover:border-black transition-colors group">
                            <div className="flex flex-col flex-1 pr-4">
                              <span className="font-bold text-[15px] text-[#111111] mb-1 group-hover:text-[#4F46E5] transition-colors">{t.title}</span>
                              <div className="flex items-center text-xs text-gray-500 space-x-2">
                                <span className="font-medium text-gray-800">{c?.title || 'Unknown Case'}</span>
                                <span>•</span>
                                <span className="font-mono text-[10px] uppercase bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">Due: {t.dueDate}</span>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              disabled={!canModify}
                              className={`w-5 h-5 rounded border-gray-300 text-black focus:ring-black ${canModify ? 'cursor-pointer hover:scale-110 transition-transform' : 'opacity-40 cursor-not-allowed'}`} 
                              onChange={async () => {
                                if (!canModify) return;
                                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { status: 'COMPLETED' });
                              }} 
                              title={canModify ? "Mark as Completed" : "Insufficient permissions"} 
                            />
                          </Card>
                        );
                      })}
                    {myOfficeTasks.filter(t => (t.assigneeIds || []).includes(currentUser.id) && t.status !== 'COMPLETED').length === 0 && (
                      <Card className="p-8 text-center text-gray-500 text-sm border-dashed border-2">
                        You have no pending tasks assigned to you. All caught up! 🎉
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          {activeTab === 'ledger' && !activeCaseId && (
            <div className="p-6 md:p-10 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in duration-300">
              <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shrink-0">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Master Ledger</h2>
                  <p className="text-sm text-gray-500 mt-1">Directory of all active and inactive matters in your chambers.</p>
                </div>
                {isSeniorOrManager && (
                  <Button onClick={() => setIsNewMatterOpen(true)} className="shrink-0"><Plus className="w-4 h-4 mr-2" /> New Matter</Button>
                )}
              </header>
              <Card className="flex-1 overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-4 md:p-5 border-b border-[#E5E5E5] flex items-center bg-gray-50 shrink-0">
                  <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                  <input type="text" placeholder="Search Case Number, CNR, Client, or Matter..." className="bg-transparent border-none outline-none text-sm w-full focus:ring-0 font-medium" />
                </div>
                <div className="overflow-y-auto overflow-x-auto flex-1 p-2">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#E5E5E5] text-[10px] font-bold text-gray-400 uppercase tracking-wider mx-2">
                      <div className="col-span-3">Matter Details</div>
                      <div className="col-span-2">Case Number</div>
                      <div className="col-span-2">CNR Code</div>
                      <div className="col-span-3">Recent Activity</div>
                      <div className="col-span-2 text-right">Next Hearing</div>
                    </div>
                    {myOfficeCases.length === 0 && (
                      <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
                        <Briefcase className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-[#111111] mb-2">No Active Matters</h3>
                        <p className="text-gray-500 text-sm max-w-sm mb-6">Your workspace is completely empty.</p>
                        {isSeniorOrManager && (
                          <Button onClick={() => setIsNewMatterOpen(true)}><Plus className="w-4 h-4 mr-2"/>Create First Matter</Button>
                        )}
                      </div>
                    )}
                    {myOfficeCases.map((c, idx) => {
                      const latestUpdate = dbData.updates.filter(u=>u.caseId === c.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];
                      return (
                        <div key={c.id} onClick={() => setActiveCaseId(c.id)} className={`p-4 mx-2 flex items-center hover:bg-[#F9F9F9] rounded-lg transition-colors cursor-pointer group ${idx !== 0 ? 'border-t border-[#E5E5E5]' : ''}`}>
                          <div className="grid grid-cols-12 gap-4 w-full items-center">
                            <div className="col-span-3 space-y-1">
                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-[15px] group-hover:text-black transition-colors">{c.title}</span>
                              </div>
                              <div className="text-xs text-gray-500 font-medium">{c.court || 'Pending Court'}</div>
                            </div>
                            <div className="col-span-2">
                              <span className="font-mono bg-white border border-[#E5E5E5] px-2 py-1 rounded text-[#111111] text-[11px] font-semibold shadow-sm">{c.caseNumber || 'N/A'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="font-mono bg-gray-50 border border-[#E5E5E5] px-2 py-1 rounded text-gray-600 text-[11px]">{c.cnr || 'N/A'}</span>
                            </div>
                            <div className="col-span-3 pr-4">
                               {latestUpdate ? (
                                 <div className="text-[13px] text-gray-600 line-clamp-1 italic font-serif">"{latestUpdate.title}"</div>
                               ) : (
                                 <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider bg-gray-50 w-fit px-2 py-0.5 rounded border border-gray-200">No updates</div>
                               )}
                            </div>
                            <div className="col-span-2 flex items-center justify-end space-x-4">
                              <div className="text-right">
                                <div className="text-sm font-bold text-[#111111]">{c.nextHearing ? new Date(c.nextHearing).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'TBD'}</div>
                              </div>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-gray-200 transition-all shrink-0">
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                setNewTaskVoiceNote("");
                setNewTaskAssigneeIds([]);
                setNewTaskCaseId(activeCaseId);
                setIsNewTaskModalOpen(true);
              }}
            />
          )}

          {}
          {activeTab === 'tasks' && !activeCaseId && (
            <div className="p-6 md:p-10 h-full flex flex-col max-w-[1400px] mx-auto animate-in fade-in duration-300">
              <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Task Pipeline</h2>
                  <p className="text-sm text-gray-500 mt-1">Drag and drop tasks across stages to update their progress.</p>
                </div>
                <Button onClick={() => {
                  setEditingTaskId(null);
                  setNewTaskTitle("");
                  setNewTaskDueDate("");
                  setNewTaskVoiceNote("");
                  setNewTaskAssigneeIds([]);
                  setNewTaskCaseId(myOfficeCases[0]?.id || '');
                  setIsNewTaskModalOpen(true);
                }} className="shrink-0"><Plus className="w-4 h-4 mr-2" /> Add Task</Button>
              </header>
              <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
                {['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'].map(status => {
                  const colTasks = myOfficeTasks.filter(t => t.status === status);
                  const isDraggingOver = draggingColumn === status;
                  return (
                    <div 
                      key={status} 
                      onDragOver={(e) => handleDragOver(e, status)}
                      onDrop={(e) => handleDrop(e, status)}
                      onDragLeave={() => setDraggingColumn(null)}
                      className={`w-80 flex-shrink-0 flex flex-col rounded-2xl border-2 transition-all duration-200 ${isDraggingOver ? 'bg-gray-100 border-[#111111] border-dashed shadow-inner' : 'bg-gray-50 border-[#E5E5E5] border-solid'} max-h-full`}
                    >
                      <div className="p-4 border-b border-[#E5E5E5] flex justify-between items-center bg-white rounded-t-xl pointer-events-none shrink-0">
                        <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase">{status.replace('_', ' ')}</h3>
                        <span className="text-xs bg-gray-100 border border-gray-200 text-[#111111] px-2 py-0.5 rounded-full font-bold">{colTasks.length}</span>
                      </div>
                      <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[150px]">
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
                              className={`p-4 shadow-sm hover:shadow-md transition-all group bg-white relative border border-[#E5E5E5] ${canModify ? 'cursor-grab active:cursor-grabbing hover:border-black' : 'opacity-90'}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate pointer-events-none">{c?.title || 'Unknown'}</div>
                                <button onClick={() => openEditTaskModal(t)} className="text-[10px] font-bold underline text-gray-400 hover:text-[#111111] bg-gray-50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  Edit
                                </button>
                              </div>
                              <h4 className="font-bold text-sm mb-2 leading-snug pointer-events-none text-[#111111]">{t.title}</h4>
                              {t.voiceNote && (
                                <div className="mb-3 text-[11px] bg-purple-50 text-purple-800 p-2 rounded-md border border-purple-100 italic">
                                  🎤 "{t.voiceNote}"
                                </div>
                              )}
                              <div className="text-[10px] text-gray-400 mb-3 font-mono bg-gray-50 p-1 rounded inline-block w-full">Created: {t.createdAt || 'N/A'} | Due: {t.dueDate}</div>
                              <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                                <div className="flex -space-x-1.5 overflow-hidden pointer-events-none">
                                  {assignees.length === 0 && <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest border border-dashed px-1 py-0.5 rounded">Unassigned</span>}
                                  {assignees.map((user, i) => (
                                     <div key={user.id} style={{zIndex: 10-i}} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-[#111111] text-white text-center text-[10px] font-bold leading-6 shadow-sm" title={user.name}>
                                       {user.name.charAt(0)}
                                     </div>
                                  ))}
                                </div>
                                <select 
                                  className={`text-[10px] font-bold bg-white outline-none border border-gray-200 rounded px-1.5 py-1 uppercase tracking-wider shadow-sm ${canModify ? 'cursor-pointer hover:bg-gray-50 hover:border-black' : 'opacity-50 cursor-not-allowed'}`}
                                  value={t.status}
                                  disabled={!canModify}
                                  onChange={async (e) => {
                                    if (!canModify) return;
                                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { status: e.target.value });
                                  }}
                                >
                                  <option value="TODO">Todo</option>
                                  <option value="IN_PROGRESS">Doing</option>
                                  <option value="REVIEW">Review</option>
                                  <option value="COMPLETED">Done</option>
                                </select>
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

          {}
          {activeTab === 'team' && isSeniorOrManager && (
             <div className="p-6 md:p-10 max-w-4xl mx-auto animate-in fade-in duration-300">
               <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shrink-0">
                 <div>
                   <h2 className="text-3xl font-bold tracking-tight">Team Access</h2>
                   <p className="text-sm text-gray-500 mt-1">Manage office members and set role-based permissions.</p>
                 </div>
                 <div className="bg-white border border-[#E5E5E5] text-[#111111] px-4 py-2.5 rounded-lg text-sm font-medium flex items-center shadow-sm shrink-0">
                   Invite Code: <span className="ml-3 font-mono font-bold tracking-widest text-[#4F46E5] bg-indigo-50 px-2 py-0.5 rounded">{dbData.offices.find(o=>o.id === currentUser.officeId)?.inviteCode}</span>
                 </div>
               </header>
               <Card className="overflow-hidden">
                 <div className="p-4 bg-gray-50 border-b border-[#E5E5E5] text-xs font-bold text-gray-500 uppercase tracking-wider pl-6">
                   Workspace Members
                 </div>
                 <div className="divide-y divide-[#E5E5E5]">
                   {dbData.users.filter(u => u.officeId === currentUser.officeId && u.role !== 'CLIENT').map(user => (
                     <div key={user.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors pl-6 gap-4">
                       <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner shrink-0 ${ROLE_CONFIG[user.role]?.bg} ${ROLE_CONFIG[user.role]?.text}`}>
                            {user.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                          </div>
                          <div>
                            <div className="font-bold text-[#111111]">{user.name}</div>
                            <div className="text-sm text-gray-500 font-medium">{user.email}</div>
                          </div>
                       </div>
                       <div className="flex items-center space-x-4">
                         <RoleBadge role={user.role} />
                         {currentUser.id !== user.id && (
                           <div className="flex items-center space-x-2">
                             <select 
                               className="text-xs font-bold uppercase tracking-wider border border-[#E5E5E5] rounded p-2 outline-none focus:border-black cursor-pointer bg-white shadow-sm hover:bg-gray-50 transition-colors"
                               value={user.role}
                               onChange={async (e) => {
                                 await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.id), { role: e.target.value });
                               }}
                             >
                               <option value="PENDING">Pending</option>
                               <option value="INTERN">Intern</option>
                               <option value="EMPLOYEE">Associate</option>
                               <option value="MANAGER">Manager</option>
                               <option value="SENIOR_ADVOCATE">Senior Advocate</option>
                               {user.role === 'FIRED' && <option value="FIRED">Terminated</option>}
                             </select>
                             {user.role !== 'FIRED' && (
                               <button 
                                 onClick={() => { setUserToFire(user); setIsFireModalOpen(true); }}
                                 className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-md border border-transparent hover:border-red-200 transition-colors shrink-0"
                                 title="Terminate Employee"
                               >
                                 <X className="w-4 h-4" />
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

          {}
          {activeTab === 'financials' && isSeniorOrManager && (
             <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in duration-300">
               <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
                 <div>
                    <h2 className="text-3xl font-bold tracking-tight">Financials</h2>
                    <p className="text-sm text-gray-500 mt-1">Track billables and sent invoices strictly restricted to management.</p>
                 </div>
                 <Button onClick={() => setIsInvoiceModalOpen(true)} className="shrink-0"><Plus className="w-4 h-4 mr-2" /> Generate Invoice</Button>
               </header>
               <Card className="overflow-hidden overflow-x-auto">
                 <table className="w-full text-left text-sm min-w-[700px]">
                   <thead className="bg-gray-50 border-b border-[#E5E5E5]">
                     <tr>
                       <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Invoice ID</th>
                       <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Matter</th>
                       <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Date</th>
                       <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Amount</th>
                       <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#E5E5E5]">
                     {dbData.invoices.filter(i=>i.officeId === currentUser.officeId).length === 0 && (
                        <tr><td colSpan="5" className="p-8 text-center text-gray-500 italic">No invoices generated yet.</td></tr>
                     )}
                     {dbData.invoices.filter(i=>i.officeId === currentUser.officeId).map(inv => (
                       <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                         <td className="p-5 font-mono font-bold text-[#111111]">
                           {inv.id}
                           {inv.attachment && <div className="text-[10px] text-[#4F46E5] font-sans mt-0.5 flex items-center font-medium"><Paperclip className="w-3 h-3 mr-1"/> {inv.attachment}</div>}
                         </td>
                         <td className="p-5 font-medium">{dbData.cases.find(c=>c.id===inv.caseId)?.title || 'Unknown'}</td>
                         <td className="p-5 text-gray-500 font-medium">{new Date(inv.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</td>
                         <td className="p-5 font-bold">₹{inv.amount.toLocaleString('en-IN')}</td>
                         <td className="p-5 text-right">
                            <select 
                             className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md cursor-pointer border-none outline-none shadow-sm transition-colors ${inv.status==='SETTLED' ? 'bg-gray-100 text-gray-400 line-through' : 'bg-[#111111] text-white hover:bg-black'}`}
                             value={inv.status}
                             onChange={async (e) => {
                               await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'invoices', inv.id), { status: e.target.value });
                             }}
                           >
                             <option value="DRAFT">Draft</option>
                             <option value="SENT">Sent</option>
                             <option value="SETTLED">Settled</option>
                           </select>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </Card>
             </div>
          )}

          {}
          <Modal title="Open New Matter" isOpen={isNewMatterOpen} onClose={() => setIsNewMatterOpen(false)}>
            <form onSubmit={handleCreateMatter} className="space-y-5">
              <div className="space-y-4 pb-4 border-b border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Matter Title *</label>
                  <input required type="text" value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm transition-all shadow-sm" placeholder="e.g. Smith v. State" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Case Number</label>
                    <input type="text" value={newCaseNumber} onChange={e=>setNewCaseNumber(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm transition-all font-mono shadow-sm" placeholder="e.g. CS/1042/2026" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CNR Number</label>
                    <input type="text" value={newCnr} onChange={e=>setNewCnr(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm transition-all font-mono shadow-sm" placeholder="e.g. HC0982-2026" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Client Tracking ID (Grouping Code)</label>
                    <input type="text" value={newTrackingNumber} onChange={e=>setNewTrackingNumber(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-black rounded-lg focus:ring-1 focus:ring-black outline-none text-sm transition-all font-mono uppercase shadow-sm" placeholder="e.g. TRK-ABC123" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Court Name / Authority</label>
                    <input type="text" value={newCourt} onChange={e=>setNewCourt(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm transition-all shadow-sm" placeholder="e.g. District Court" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">Parties Involved (Optional)</div>
                
               <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                 <div className="text-xs font-bold mb-3 flex justify-between items-center text-[#111111]">
                   <span>Plaintiff / Petitioner / Applicant</span>
                   <button type="button" onClick={() => setNewPartyOne([...newPartyOne, {name:'', mobile:''}])} className="text-white bg-[#111111] hover:bg-black px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm">+ Add Person</button>
                 </div>
                 {newPartyOne.map((p, i) => (
                   <div key={i} className="flex space-x-2 mb-2 items-start animate-in fade-in slide-in-from-top-2">
                     <div className="flex-1">
                       <input type="text" placeholder="Full Name" value={p.name} onChange={e => { const newP = [...newPartyOne]; newP[i].name = e.target.value; setNewPartyOne(newP); }} className="w-full px-2 py-1.5 bg-white border border-[#E5E5E5] rounded focus:border-black outline-none text-sm transition-all shadow-sm" />
                     </div>
                     <div className="flex-1">
                       <input type="text" placeholder="+91..." value={p.mobile} onChange={e => { const newP = [...newPartyOne]; newP[i].mobile = e.target.value; setNewPartyOne(newP); }} className="w-full px-2 py-1.5 bg-white border border-[#E5E5E5] rounded focus:border-black outline-none text-sm transition-all font-mono shadow-sm" />
                     </div>
                     {newPartyOne.length > 1 && (
                       <button type="button" onClick={() => { const newP = [...newPartyOne]; newP.splice(i, 1); setNewPartyOne(newP); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                     )}
                   </div>
                 ))}
               </div>

               <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                 <div className="text-xs font-bold mb-3 flex justify-between items-center text-[#111111]">
                   <span>Defendant / Respondent / Non-Applicant</span>
                   <button type="button" onClick={() => setNewPartyTwo([...newPartyTwo, {name:'', mobile:''}])} className="text-white bg-[#111111] hover:bg-black px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm">+ Add Person</button>
                 </div>
                 {newPartyTwo.map((p, i) => (
                   <div key={i} className="flex space-x-2 mb-2 items-start animate-in fade-in slide-in-from-top-2">
                     <div className="flex-1">
                       <input type="text" placeholder="Full Name" value={p.name} onChange={e => { const newP = [...newPartyTwo]; newP[i].name = e.target.value; setNewPartyTwo(newP); }} className="w-full px-2 py-1.5 bg-white border border-[#E5E5E5] rounded focus:border-black outline-none text-sm transition-all shadow-sm" />
                     </div>
                     <div className="flex-1">
                       <input type="text" placeholder="+91..." value={p.mobile} onChange={e => { const newP = [...newPartyTwo]; newP[i].mobile = e.target.value; setNewPartyTwo(newP); }} className="w-full px-2 py-1.5 bg-white border border-[#E5E5E5] rounded focus:border-black outline-none text-sm transition-all font-mono shadow-sm" />
                     </div>
                     {newPartyTwo.length > 1 && (
                       <button type="button" onClick={() => { const newP = [...newPartyTwo]; newP.splice(i, 1); setNewPartyTwo(newP); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                     )}
                   </div>
                 ))}
               </div>
              </div>
              
              <Button type="submit" className="w-full py-3.5 mt-6">Create Matter File</Button>
            </form>
          </Modal>

          <Modal title={editingTaskId ? "Edit Task" : "Create New Task"} isOpen={isNewTaskModalOpen} onClose={() => { setIsNewTaskModalOpen(false); setEditingTaskId(null); setNewTaskAssigneeIds([]); if(recognitionRef.current) recognitionRef.current.stop(); setIsRecording(false); }}>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Task Title *</label>
                <div className="flex items-center space-x-2">
                  <input required type="text" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} className="flex-1 px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm transition-all shadow-sm" placeholder="e.g. Draft rejoinder for arbitration" />
                  <button 
                    type="button" 
                    onClick={handleStartVoiceRecording}
                    className={`p-3 rounded-lg border flex items-center justify-center transition-all shadow-sm ${isRecording ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'}`}
                    title={isRecording ? "Stop Recording" : "Record Voice Note"}
                  >
                    {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                {isRecording && <div className="text-xs text-red-600 mt-1.5 font-bold animate-pulse">Listening... Speak clearly into your microphone.</div>}
              </div>

              {newTaskVoiceNote && (
                <div className="animate-in fade-in">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Voice Note Transcript</label>
                  <textarea value={newTaskVoiceNote} onChange={e=>setNewTaskVoiceNote(e.target.value)} className="w-full px-3 py-2 text-xs bg-purple-50 border border-purple-200 rounded-lg outline-none text-purple-900 italic shadow-inner" rows="2" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Linked Matter *</label>
                <select required value={newTaskCaseId} onChange={e=>setNewTaskCaseId(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm transition-all cursor-pointer shadow-sm">
                  <option value="" disabled>Select a matter...</option>
                  {myOfficeCases.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assign To (Multiple allowed)</label>
                <div className="max-h-32 overflow-y-auto border border-[#E5E5E5] rounded-lg bg-[#F9F9F9] p-2 space-y-1 shadow-inner">
                  {dbData.users.filter(u => u.officeId === currentUser.officeId && u.role !== 'CLIENT' && u.role !== 'PENDING').map(u => (
                    <label key={u.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-md cursor-pointer transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={newTaskAssigneeIds.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) setNewTaskAssigneeIds([...newTaskAssigneeIds, u.id]);
                          else setNewTaskAssigneeIds(newTaskAssigneeIds.filter(id => id !== u.id));
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#111111] focus:ring-black cursor-pointer"
                      />
                      <span className="text-sm font-medium text-[#111111]">{u.name} <span className="text-gray-400 text-xs ml-1 font-normal">({ROLE_CONFIG[u.role]?.label})</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Due Date</label>
                <input type="date" value={newTaskDueDate} onChange={e=>setNewTaskDueDate(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm transition-all shadow-sm" />
              </div>
              <Button type="submit" className="w-full py-3.5 mt-6">{editingTaskId ? 'Save Changes' : 'Create Task'}</Button>
            </form>
          </Modal>

          <Modal title="Generate Invoice" isOpen={isInvoiceModalOpen} onClose={() => { setIsInvoiceModalOpen(false); setInvoiceFile(null); }}>
             <form onSubmit={handleGenerateInvoice} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1">Select Matter</label>
                 <select required value={invoiceCaseId} onChange={e=>setInvoiceCaseId(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm transition-all cursor-pointer shadow-sm">
                   <option value="" disabled>Select a matter to bill...</option>
                   {myOfficeCases.map(c => (
                     <option key={c.id} value={c.id}>{c.title}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1">Invoice Amount (₹)</label>
                 <input required type="number" min="0" step="0.01" value={invoiceAmount} onChange={e=>setInvoiceAmount(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-black outline-none text-sm transition-all shadow-sm" placeholder="e.g. 50000" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1">Attach Invoice PDF (Optional)</label>
                 <input type="file" onChange={e => setInvoiceFile(e.target.files[0])} className="w-full px-3 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg text-sm shadow-sm" accept=".pdf" />
               </div>
               <Button type="submit" className="w-full py-3.5 mt-6">Create Draft Invoice</Button>
             </form>
          </Modal>

          <Modal title="Terminate Employee" isOpen={isFireModalOpen} onClose={() => { setIsFireModalOpen(false); setUserToFire(null); setFireReason(""); }}>
            <form onSubmit={handleFireUser} className="space-y-4">
              <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm border border-red-200 mb-4 shadow-sm">
                You are about to terminate <strong>{userToFire?.name}</strong>. Their access to the workspace will be immediately revoked.
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Termination (Mandatory)</label>
                <textarea required value={fireReason} onChange={e=>setFireReason(e.target.value)} className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:border-red-500 outline-none text-sm transition-all min-h-[100px] resize-y shadow-inner" placeholder="Detail the reason for immediate termination. This will be visible to the employee." />
              </div>
              <div className="flex space-x-3 mt-6">
                <Button variant="secondary" className="flex-1" onClick={() => { setIsFireModalOpen(false); setUserToFire(null); setFireReason(""); }}>Cancel</Button>
                <button type="submit" className="flex-1 bg-red-600 text-white py-2 px-4 text-sm font-medium rounded-md hover:bg-red-700 transition-colors shadow-sm active:scale-95">Confirm Termination</button>
              </div>
            </form>
          </Modal>

        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [dbData, setDbData] = useState({
    offices: [], users: [], cases: [], updates: [], tasks: [], documents: [], invoices: []
  });
  
  const [authUser, setAuthUser] = useState(null);
  const [appUser, setAppUser] = useState(null); 
  const [trackedCode, setTrackedCode] = useState(null);
  const [currentView, setCurrentView] = useState('landing');
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    const initAuth = async () => {
      // Used by the Canvas preview environment
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
          console.warn("Failed to sign in with custom token.", e);
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) {
       setAppUser(null);
       return;
    }

    const cols = ['offices', 'users', 'cases', 'updates', 'tasks', 'documents', 'invoices'];
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
  }, [authUser]);

  useEffect(() => {
    if (authUser && !authUser.isAnonymous) {
      const userProfile = dbData.users.find(u => u.id === authUser.uid);
      if (userProfile) {
        setAppUser(userProfile);
        setCurrentView('dashboard');
      }
    }
  }, [authUser, dbData.users]);


  const handleLogin = async (email, password) => {
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
    const foundOffice = dbData.offices.find(o => o.inviteCode === code.toUpperCase());
    if (!foundOffice) throw new Error("Invalid invite code. Please ask your administrator.");
    
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    
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

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-[#F9F9F9] text-[#111111] font-sans flex flex-col">
        <header className="flex justify-between items-center p-6 lg:px-12 bg-[#F9F9F9] shrink-0">
          <div className="flex items-center space-x-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => setCurrentView('landing')}>
            <Scale className="w-5 h-5 text-black" />
            <span className="font-bold tracking-tight">Chambers</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => { setAuthMode('track'); setCurrentView('auth'); }} className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
              Track Case
            </button>
            <button onClick={() => { setAuthMode('login'); setCurrentView('auth'); }} className="text-sm font-bold flex items-center hover:text-gray-600 transition-colors">
              Log in <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto -mt-20">
          <div className="text-xs font-bold tracking-[0.2em] text-gray-400 mb-8 uppercase flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Scale className="w-3 h-3 mr-2" /> A calmer way to run your practice
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.95] mb-8 text-[#111111] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Make room <br/> for the law.
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Chambers brings cases, people, and progress into one focused workspace built for the way modern law offices actually work.
          </p>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 w-full sm:w-auto">
            <Button onClick={() => { setAuthMode('login'); setCurrentView('auth'); }} className="w-full sm:w-auto px-8 py-3.5 text-base shadow-lg shadow-black/20 hover:shadow-xl hover:scale-105 transition-all">
              Log in to your workspace <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="secondary" onClick={() => { setAuthMode('track'); setCurrentView('auth'); }} className="w-full sm:w-auto px-8 py-3.5 text-base font-bold bg-white text-black border border-[#E5E5E5] hover:bg-gray-50 hover:border-black shadow-sm transition-all">
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
    return <ClientPortalView trackingCode={trackedCode} dbData={dbData} onExit={handleLogout} />;
  }

  if (currentView === 'dashboard' && appUser) {
    return <DashboardView currentUser={appUser} dbData={dbData} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111111]"></div>
    </div>
  );
}