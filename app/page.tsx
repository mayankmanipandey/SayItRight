'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AnalysisResult, HistorySession } from '@/types';

/* ─── App Phases ─── */
type AppPhase = 'login' | 'blackhole' | 'dashboard';

/* ─── Static Preset Options ─── */
const RECIPIENT_OPTIONS = [
  'Professor',
  'Manager / Boss',
  'Peer / Colleague',
  'Client / Customer',
  'Partner / Spouse',
  'Roommate / Friend',
  'Landlord',
  'Other',
];

const SITUATION_OPTIONS = [
  'Assignment Extension',
  'Deadline Extension',
  'Raising an Issue or Disagreement',
  'Declining a Request',
  'Asking for Help or Feedback',
  'Apologizing for a Mistake',
  'Other',
];

const TONE_OPTIONS = [
  'Respectful',
  'Professional',
  'Friendly',
  'Confident',
  'Firm',
  'Warm',
  'Angry',
  'Happy',
  'Love',
];

export type AppTheme = 'light' | 'dark' | 'galaxy' | 'cyberpunk' | 'sunset' | 'love';

export const THEME_OPTIONS: { id: AppTheme; name: string; desc: string; colors: string[] }[] = [
  {
    id: 'light',
    name: 'Clean Light',
    desc: 'Crisp executive light with slate & indigo accents',
    colors: ['#FFFFFF', '#F8FAFC', '#6366F1', '#0F172A'],
  },
  {
    id: 'dark',
    name: 'Obsidian Dark',
    desc: 'Modern deep slate & obsidian with indigo glow',
    colors: ['#0B0F19', '#111827', '#818CF8', '#F9FAFB'],
  },
  {
    id: 'galaxy',
    name: 'Cosmic Galaxy',
    desc: 'Deep purple nebula with starlight glow',
    colors: ['#070414', '#110B26', '#A855F7', '#DDD6FE'],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    desc: 'High-voltage electric cyan & neon accents',
    colors: ['#040810', '#0A1220', '#06B6D4', '#E0F2FE'],
  },
  {
    id: 'sunset',
    name: 'Sunset Dusk',
    desc: 'Warm dusky twilight with coral & amber glow',
    colors: ['#130B14', '#1F1020', '#F43F5E', '#FFF1F2'],
  },
  {
    id: 'love',
    name: 'Velvet Rose (Love)',
    desc: 'Romantic blush velvet with crimson & pink warmth',
    colors: ['#14070F', '#220B1B', '#EC4899', '#FFF0F5'],
  },
];

const HACKATHON_PRESETS = [
  {
    label: '🎓 Student → Professor (Extension Request)',
    recipient: 'Professor',
    situation: 'Assignment Extension',
    tone: ['Respectful', 'Professional'],
    context: 'CS 101 Midterm Project due tonight',
    roughMessage: "Sir I couldn't submit the assignment because I was busy with other work. Please give me 2 more days.",
  },
  {
    label: '💼 Employee → Manager (Salary & Raise Request)',
    recipient: 'Manager / Boss',
    situation: 'Raising an Issue or Disagreement',
    tone: ['Professional', 'Confident'],
    context: 'Annual review meeting next week',
    roughMessage: 'I think I deserve a raise because I worked hard this year and inflation is high. Give me a 15% raise.',
  },
  {
    label: '🤝 Peer → Teammate (Declining Extra Tasks)',
    recipient: 'Peer / Colleague',
    situation: 'Declining a Request',
    tone: ['Respectful', 'Firm'],
    context: 'Sprint deadline tomorrow',
    roughMessage: 'I cannot help you with your bug tasks because I have my own work to finish. Figure it out yourself.',
  },
  {
    label: '❤️ Partner → Spouse (Resolving a Misunderstanding)',
    recipient: 'Partner / Spouse',
    situation: 'Raising an Issue or Disagreement',
    tone: ['Warm', 'Love'],
    context: 'Canceled date night & feeling disconnected',
    roughMessage: 'You never make time for me anymore and you canceled our dinner date again. Do you even care about us?',
  },
];

const PRE_REGISTERED_ACCOUNTS = [
  { name: 'Alex (Student Demo)', email: 'alex@student.edu', pass: 'student123', role: 'Student' },
  { name: 'Sarah (Workplace Demo)', email: 'sarah@company.com', pass: 'work123', role: 'Professional' },
];

const LOADING_STEPS = [
  'Understanding what you mean...',
  'Checking how the recipient may interpret it...',
  'Evaluating tone, clarity, & accountability...',
  'Building your improved message...',
  'Distilling your reusable communication lesson...',
];

/* ─── Black Hole Taglines ─── */
const TAGLINES = [
  'Help people say hard things',
  'in the right way.',
];

export default function Home() {
  /* ═══════ Phase Management ═══════ */
  const [appPhase, setAppPhase] = useState<AppPhase>('login');
  const [blackholeProgress, setBlackholeProgress] = useState(0);

  const [activeTab, setActiveTab] = useState<'practice' | 'history'>('practice');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    name: string;
    isGuest: boolean;
    isCustomUser: boolean;
  }>({
    email: 'guest',
    name: 'Guest User',
    isGuest: true,
    isCustomUser: false,
  });

  // AI Mode Selection for all accounts (Live vs Demo)
  const [aiMode, setAiMode] = useState<'live' | 'demo'>('live');

  // Login form inputs (for login page)
  const [loginEmailInput, setLoginEmailInput] = useState('');
  const [loginPassInput, setLoginPassInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Result View Mode Selector (Choice Bar)
  const [viewMode, setViewMode] = useState<'full' | 'quick'>('full');
  const [quickToneIndex, setQuickToneIndex] = useState<number>(0);

  // Form State
  const [recipient, setRecipient] = useState('Professor');
  const [customRecipient, setCustomRecipient] = useState('');
  const [situation, setSituation] = useState('Assignment Extension');
  const [customSituation, setCustomSituation] = useState('');
  const [selectedTones, setSelectedTones] = useState<string[]>(['Respectful', 'Professional']);
  const [context, setContext] = useState('');
  const [roughMessage, setRoughMessage] = useState('');

  // UI & Processing State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Result & History State
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeAltIndex, setActiveAltIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // History List State
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<HistorySession | null>(null);

  // Account switcher modal (within dashboard)
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountEmailInput, setAccountEmailInput] = useState('');
  const [accountPassInput, setAccountPassInput] = useState('');

  // Settings & Theme Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('light');

  const resultRef = useRef<HTMLDivElement>(null);

  // Load saved theme preference on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('say-it-right-theme') as AppTheme | null;
      if (savedTheme && THEME_OPTIONS.some((t) => t.id === savedTheme)) {
        setCurrentTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleThemeChange = (newTheme: AppTheme) => {
    setCurrentTheme(newTheme);
    try {
      localStorage.setItem('say-it-right-theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    } catch {
      // ignore
    }
    const themeName = THEME_OPTIONS.find((t) => t.id === newTheme)?.name || newTheme;
    showToast(`🎨 Theme changed to ${themeName}`);
  };

  /* ═══════ Black Hole Animation ═══════ */
  useEffect(() => {
    if (appPhase !== 'blackhole') return;
    
    const totalDuration = 3500; // 3.5 seconds
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const progress = Math.min((elapsed / totalDuration) * 100, 100);
      setBlackholeProgress(progress);

      if (elapsed >= totalDuration) {
        clearInterval(timer);
        setTimeout(() => {
          setAppPhase('dashboard');
        }, 400);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [appPhase]);

  // Cycle loading messages while processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isSubmitting]);

  // Lazy load history when history tab or current user changes
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  /* ═══════ Login Handlers ═══════ */
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmailInput.includes('@')) {
      setLoginError('Please enter a valid email address');
      return;
    }
    if (!loginPassInput || loginPassInput.length < 4) {
      setLoginError('Password must be at least 4 characters');
      return;
    }

    const name = loginEmailInput.split('@')[0];
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

    setCurrentUser({
      email: loginEmailInput,
      name: formattedName,
      isGuest: false,
      isCustomUser: true,
    });
    setAppPhase('blackhole');
  };

  const handleDemoLogin = (account: typeof PRE_REGISTERED_ACCOUNTS[0]) => {
    setCurrentUser({
      email: account.email,
      name: account.name,
      isGuest: false,
      isCustomUser: false,
    });
    setAppPhase('blackhole');
  };

  const handleGuestContinue = () => {
    setCurrentUser({
      email: 'guest',
      name: 'Guest User',
      isGuest: true,
      isCustomUser: false,
    });
    setAppPhase('blackhole');
  };

  const handleLogout = () => {
    setCurrentUser({ email: 'guest', name: 'Guest User', isGuest: true, isCustomUser: false });
    setResult(null);
    setViewingHistoryItem(null);
    setHistory([]);
    setLoginEmailInput('');
    setLoginPassInput('');
    setLoginError(null);
    setAppPhase('login');
  };

  /* ═══════ Account Switcher (within dashboard) ═══════ */
  const handleAccountSwitch = (account: typeof PRE_REGISTERED_ACCOUNTS[0]) => {
    setCurrentUser({
      email: account.email,
      name: account.name,
      isGuest: false,
      isCustomUser: false,
    });
    setShowAccountModal(false);
    showToast(`Switched to ${account.name}`);
  };

  const handleAccountCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountEmailInput.includes('@')) {
      showToast('Please enter a valid email address');
      return;
    }
    if (!accountPassInput || accountPassInput.length < 4) {
      showToast('Password must be at least 4 characters');
      return;
    }
    const name = accountEmailInput.split('@')[0];
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    setCurrentUser({
      email: accountEmailInput,
      name: formattedName,
      isGuest: false,
      isCustomUser: true,
    });
    setShowAccountModal(false);
    showToast(`Signed in as ${formattedName}`);
  };

  const handleAccountGuestSwitch = () => {
    setCurrentUser({ email: 'guest', name: 'Guest User', isGuest: true, isCustomUser: false });
    setShowAccountModal(false);
    showToast('Switched to Guest Mode');
  };

  /* ═══════ Preset & Form Handlers ═══════ */
  const loadPreset = (preset: typeof HACKATHON_PRESETS[0]) => {
    setRecipient(preset.recipient);
    setCustomRecipient('');
    setSituation(preset.situation);
    setCustomSituation('');
    setSelectedTones(preset.tone);
    setContext(preset.context);
    setRoughMessage(preset.roughMessage);
    setResult(null);
    setViewingHistoryItem(null);
    showToast(`⚡ Loaded preset: ${preset.recipient}`);
  };

  const fetchHistory = async () => {
    if (currentUser.isGuest) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/history?userEmail=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setHistory(json.data);
        }
      }
    } catch {
      // silently handle
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/history?id=${encodeURIComponent(id)}&userEmail=${encodeURIComponent(currentUser.email)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        showToast('Session deleted from history');
      }
    } catch {
      // ignore
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your history sessions?')) return;
    try {
      const res = await fetch(`/api/history?all=true&userEmail=${encodeURIComponent(currentUser.email)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory([]);
        showToast('All history cleared');
      }
    } catch {
      // ignore
    }
  };

  const toggleTone = (tone: string) => {
    setSelectedTones((prev) => {
      if (prev.includes(tone)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((t) => t !== tone);
      }
      return [...prev, tone];
    });
  };

  // Resolve "Other" fields to actual values
  const getResolvedRecipient = () => recipient === 'Other' ? (customRecipient.trim() || 'Other') : recipient;
  const getResolvedSituation = () => situation === 'Other' ? (customSituation.trim() || 'Other') : situation;

  const triggerAnalysisPayload = async (messageToAnalyze: string) => {
    if (messageToAnalyze.trim().length < 10) {
      setError('Please enter a draft message of at least 10 characters long.');
      return;
    }

    // Validate "Other" fields
    if (recipient === 'Other' && !customRecipient.trim()) {
      setError('Please specify who you are writing to.');
      return;
    }
    if (situation === 'Other' && !customSituation.trim()) {
      setError('Please describe the situation.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);
    setViewingHistoryItem(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          isCustomUser: currentUser.isCustomUser,
          aiMode,
          recipient: getResolvedRecipient(),
          situation: getResolvedSituation(),
          tone: selectedTones,
          context,
          roughMessage: messageToAnalyze,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "We couldn't analyze your message right now. Please try again.");
        return;
      }

      setResult(json.data);
      setIsDemoMode(!!json.isDemo);
      setActiveAltIndex(0);
      setQuickToneIndex(0);
      showToast('✨ Improved message & coaching analysis generated!');

      // Refresh history silently if logged in
      if (!currentUser.isGuest) {
        fetchHistory();
      }

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerAnalysisPayload(roughMessage);
  };

  const handleCopy = useCallback(async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast('✓ Message copied to clipboard!');
    } catch {
      // fallback
    }
  }, []);

  const handleResetForm = () => {
    setResult(null);
    setViewingHistoryItem(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeDisplayResult = viewingHistoryItem ? viewingHistoryItem.result : result;
  const activeIsDemo = viewingHistoryItem ? viewingHistoryItem.isDemo : isDemoMode;

  // Build Quick Tone options list dynamically
  const quickToneOptions = activeDisplayResult ? [
    { name: '✨ Recommended Improved', text: activeDisplayResult.improvedMessage },
    ...activeDisplayResult.alternatives.map((alt) => ({
      name: `🎭 ${alt.tone}`,
      text: alt.message,
    })),
  ] : [];

  const activeQuickText = quickToneOptions[quickToneIndex]?.text || activeDisplayResult?.improvedMessage || '';

  /* ═══════════════════════════════════════════════════════════════════
     PHASE 1: LOGIN PAGE
  ═══════════════════════════════════════════════════════════════════ */
  if (appPhase === 'login') {
    return (
      <div className="login-page">
        <div className="login-container">
          {/* Animated background orbs */}
          <div className="login-bg-orb login-bg-orb-1" />
          <div className="login-bg-orb login-bg-orb-2" />
          <div className="login-bg-orb login-bg-orb-3" />

          <div className="login-card">
            {/* Logo & Brand */}
            <div className="login-header">
              <div className="login-logo">
                <span className="login-logo-icon">💬</span>
              </div>
              <h1 className="login-title">Say It Right</h1>
              <p className="login-subtitle">AI Communication Coach</p>
              <p className="login-tagline">Help people say hard things — in the right way.</p>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="login-form-group">
                <label className="login-label">Email</label>
                <input
                  type="email"
                  className="login-input"
                  placeholder="your.email@gmail.com"
                  value={loginEmailInput}
                  onChange={(e) => setLoginEmailInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="login-form-group">
                <label className="login-label">Password</label>
                <input
                  type="password"
                  className="login-input"
                  placeholder="Enter your password"
                  value={loginPassInput}
                  onChange={(e) => setLoginPassInput(e.target.value)}
                  required
                />
              </div>

              {loginError && (
                <div className="login-error">{loginError}</div>
              )}

              <button type="submit" className="login-submit-btn">
                Sign In / Create Account →
              </button>
            </form>

            {/* Divider */}
            <div className="login-divider">
              <span>or continue with</span>
            </div>

            {/* Demo Accounts */}
            <div className="login-demo-section">
              {PRE_REGISTERED_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  className="login-demo-btn"
                  onClick={() => handleDemoLogin(acc)}
                >
                  <span className="login-demo-avatar">{acc.role === 'Student' ? '🎓' : '💼'}</span>
                  <div className="login-demo-info">
                    <span className="login-demo-name">{acc.name}</span>
                    <span className="login-demo-email">{acc.email}</span>
                  </div>
                  <span className="login-demo-arrow">→</span>
                </button>
              ))}
            </div>

            {/* Guest */}
            <button className="login-guest-btn" onClick={handleGuestContinue}>
              👤 Continue as Guest
              <span className="login-guest-note">No history saved</span>
            </button>
          </div>

          {/* Footer */}
          <p className="login-footer">
            Built for communication, powered by AI coaching.
          </p>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════
     PHASE 2: CINEMATIC BLACK HOLE INTRO
  ═══════════════════════════════════════════════════════════════════ */
  if (appPhase === 'blackhole') {
    return (
      <div className="blackhole-page">
        {/* Animated star field background */}
        <div className="star-field">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Black Hole Core */}
        <div className="blackhole-wrapper">
          <div className="blackhole-outer-ring" />
          <div className="blackhole-mid-ring" />
          <div className="blackhole-inner-ring" />
          <div className="blackhole-core">
            <div className="blackhole-core-inner" />
          </div>
          <div className="blackhole-glow" />
        </div>

        {/* Taglines */}
        <div className="blackhole-text">
          <h1
            className="blackhole-tagline"
            style={{ opacity: blackholeProgress > 15 ? 1 : 0 }}
          >
            {TAGLINES[0]}
          </h1>
          <h2
            className="blackhole-tagline blackhole-tagline-accent"
            style={{ opacity: blackholeProgress > 40 ? 1 : 0 }}
          >
            {TAGLINES[1]}
          </h2>
        </div>

        {/* Progress bar */}
        <div className="blackhole-progress">
          <div
            className="blackhole-progress-fill"
            style={{ width: `${blackholeProgress}%` }}
          />
        </div>

        {/* Welcome text */}
        <p
          className="blackhole-welcome"
          style={{ opacity: blackholeProgress > 70 ? 1 : 0 }}
        >
          Welcome, {currentUser.name}
        </p>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════
     PHASE 3: MAIN DASHBOARD
  ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="app-container">
      {/* ─── Top Control Bar: Account & AI Mode Toggle ─── */}
      <div className="top-bar">
        <div className="top-bar-left">
          <span className="top-bar-label">Account:</span>
          {currentUser.isGuest ? (
            <span className="badge badge-warning">👤 Guest</span>
          ) : currentUser.isCustomUser ? (
            <span className="badge badge-success">🟢 {currentUser.name}</span>
          ) : (
            <span className="badge badge-accent">🔑 {currentUser.name}</span>
          )}
        </div>

        <div className="top-bar-right">
          {/* AI Mode Toggle */}
          <div className="ai-mode-toggle">
            <span className="top-bar-label">AI Engine:</span>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${aiMode === 'live' ? 'toggle-active-live' : ''}`}
                onClick={() => { setAiMode('live'); showToast('🟢 Switched to Live AI'); }}
              >
                🟢 Live AI
              </button>
              <button
                type="button"
                className={`toggle-btn ${aiMode === 'demo' ? 'toggle-active-demo' : ''}`}
                onClick={() => { setAiMode('demo'); showToast('⚡ Switched to Demo Mode'); }}
              >
                ⚡ Demo
              </button>
            </div>
          </div>
          {/* Settings & Themes Button */}
          <button
            className="btn-icon"
            onClick={() => setShowSettingsModal(true)}
            title="Settings & Themes"
            aria-label="Settings and Themes"
          >
            ⚙️
          </button>
          {/* Switch Account Button */}
          <button
            className="btn-icon"
            onClick={() => setShowAccountModal(true)}
            title="Switch Account"
            aria-label="Switch Account"
          >
            👥
          </button>
          {/* Logout Button */}
          <button
            className="btn-icon btn-icon-danger"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            🚪
          </button>
        </div>
      </div>

      {/* ─── Header & Hero ─── */}
      <header className="app-header">
        <div className="brand-badge">
          ✨ Say It Right — AI Communication Coach
        </div>
        <h1 className="brand-title">SAY IT RIGHT</h1>
        <p className="brand-description" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.4rem' }}>
          This isn&apos;t just an AI text rewriter. It teaches you <span style={{ color: 'var(--color-accent)', textDecoration: 'underline', textUnderlineOffset: '4px' }}>WHY</span> your message works.
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)', maxWidth: '580px', margin: '0 auto' }}>
          Communicate difficult messages appropriately across academic, workplace, and interpersonal situations without losing your intent.
        </p>
      </header>

      {/* ─── Navigation Tabs ─── */}
      <nav className="nav-tabs" role="tablist">
        <button
          className={`tab-btn ${activeTab === 'practice' ? 'active' : ''}`}
          onClick={() => { setActiveTab('practice'); setViewingHistoryItem(null); }}
          role="tab"
          aria-selected={activeTab === 'practice'}
        >
          💬 Practice Coach
        </button>
        {!currentUser.isGuest && (
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            role="tab"
            aria-selected={activeTab === 'history'}
          >
            📜 Saved History ({history.length})
          </button>
        )}
      </nav>

      {/* ─── Practice Form View ─── */}
      {activeTab === 'practice' && (
        <>
          {/* 1-Click Demo Scenarios Banner */}
          <div className="card" style={{ background: 'var(--color-accent-subtle)', border: '1px solid rgba(99, 102, 241, 0.25)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚡ 1-Click Demo Scenarios (Instant AI Coach Generation)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>Click any preset to load & analyze</span>
            </div>
            <div className="pill-grid">
              {HACKATHON_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  className="preset-btn"
                  onClick={() => {
                    loadPreset(p);
                    triggerAnalysisPayload(p.roughMessage);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Input Card */}
          <div className="card">
            <h2 className="card-title">1. Context & Situation</h2>
            <p className="card-subtitle">Tell the AI coach who you are writing to and what you want to achieve.</p>

            <form onSubmit={handleAnalyze}>
              {/* Recipient Selection */}
              <div className="form-group">
                <label className="form-label">Who are you writing to?</label>
                <select
                  className="form-select"
                  value={recipient}
                  onChange={(e) => { setRecipient(e.target.value); if (e.target.value !== 'Other') setCustomRecipient(''); }}
                >
                  {RECIPIENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {recipient === 'Other' && (
                  <input
                    type="text"
                    className="form-input"
                    style={{ marginTop: '0.5rem' }}
                    placeholder="Specify the recipient (e.g., HR Department, Partner, Teacher)..."
                    value={customRecipient}
                    onChange={(e) => setCustomRecipient(e.target.value)}
                    required
                    maxLength={100}
                  />
                )}
              </div>

              {/* Situation Selection */}
              <div className="form-group">
                <label className="form-label">What is the situation?</label>
                <select
                  className="form-select"
                  value={situation}
                  onChange={(e) => { setSituation(e.target.value); if (e.target.value !== 'Other') setCustomSituation(''); }}
                >
                  {SITUATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {situation === 'Other' && (
                  <input
                    type="text"
                    className="form-input"
                    style={{ marginTop: '0.5rem' }}
                    placeholder="Describe the situation (e.g., Rejecting a collaboration offer, Reporting harassment)..."
                    value={customSituation}
                    onChange={(e) => setCustomSituation(e.target.value)}
                    required
                    maxLength={200}
                  />
                )}
              </div>

              {/* Tone Multi-select */}
              <div className="form-group">
                <label className="form-label">Desired Tone (Select one or more)</label>
                <div className="pill-grid">
                  {TONE_OPTIONS.map((t) => (
                    <div
                      key={t}
                      className={`pill-option ${selectedTones.includes(t) ? 'selected' : ''} ${t === 'Angry' ? 'pill-angry' : ''} ${t === 'Happy' ? 'pill-happy' : ''} ${t === 'Love' ? 'pill-love' : ''}`}
                      onClick={() => toggleTone(t)}
                      role="checkbox"
                      aria-checked={selectedTones.includes(t)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && toggleTone(t)}
                    >
                      {t === 'Angry' && '🔥 '}
                      {t === 'Happy' && '😊 '}
                      {t === 'Love' && '💖 '}
                      {selectedTones.includes(t) ? '✓ ' : ''}{t}
                    </div>
                  ))}
                </div>
                {selectedTones.includes('Angry') && (
                  <p className="tone-hint tone-hint-angry">
                    🔥 Angry tone = Express frustration firmly and assertively, without being abusive or unprofessional.
                  </p>
                )}
                {selectedTones.includes('Happy') && (
                  <p className="tone-hint tone-hint-happy">
                    😊 Happy tone = Genuinely positive, enthusiastic, and uplifting communication.
                  </p>
                )}
                {selectedTones.includes('Love') && (
                  <p className="tone-hint tone-hint-love">
                    💖 Love Mode = Express deep affection, tenderness, and heartfelt care tailored for relationships and loved ones.
                  </p>
                )}
              </div>

              {/* Optional Context */}
              <div className="form-group">
                <label className="form-label">Additional Context (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. Course code, deadline date, or prior conversation..."
                  maxLength={2000}
                />
              </div>

              {/* Rough Message Input */}
              <div className="form-group">
                <label className="form-label">Your Rough Draft Message</label>
                <textarea
                  className="form-textarea"
                  value={roughMessage}
                  onChange={(e) => setRoughMessage(e.target.value)}
                  placeholder="Type what you actually want to say, even if it feels blunt, informal, or awkward..."
                  rows={5}
                  maxLength={5000}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-secondary)', marginTop: '0.35rem' }}>
                  <span>Be honest — the coach is here to help, not judge.</span>
                  <span>{roughMessage.length} / 5000</span>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="error-banner">
                  <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>⚠️ {error}</div>
                  {(error.includes('AUTH_REQUIRED') || error.includes('credentials') || error.includes('API_KEY')) && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', fontWeight: 700 }}
                        onClick={() => {
                          setAiMode('demo');
                          setError(null);
                          showToast('⚡ Switched to Demo Mode');
                        }}
                      >
                        ⚡ Switch to Demo Mode
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Action */}
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? '✨ Analyzing with AI Coach...' : '✨ Improve my message & Generate Coaching →'}
              </button>
            </form>
          </div>

          {/* ─── Loading UX Step Indicator ─── */}
          {isSubmitting && (
            <div className="loading-box">
              <div className="spinner" />
              <p className="loading-step-text">{LOADING_STEPS[loadingStepIndex]}</p>
              <p className="loading-subtext">Evaluating tone, clarity, and accountability...</p>
            </div>
          )}

          {/* ─── Results Presentation View ─── */}
          {activeDisplayResult && !isSubmitting && (
            <div ref={resultRef} style={{ marginTop: '2rem' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  🎯 AI Coaching Output
                </span>
                
                {/* Result View Mode Selector (Choice Bar) */}
                <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                  <button
                    className={`tab-btn ${viewMode === 'full' ? 'active' : ''}`}
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem', fontWeight: 700 }}
                    onClick={() => setViewMode('full')}
                  >
                    ✨ Full AI Coaching
                  </button>
                  <button
                    className={`tab-btn ${viewMode === 'quick' ? 'active' : ''}`}
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem', fontWeight: 700 }}
                    onClick={() => setViewMode('quick')}
                  >
                    ⚡ Quick Improved Only
                  </button>
                </div>

                {activeIsDemo ? (
                  <span className="demo-pill">⚡ DEMO MODE (Curated Example)</span>
                ) : (
                  <span className="live-pill">🟢 Live AI Analysis</span>
                )}
              </div>

              {/* ─── VIEW MODE: QUICK IMPROVED ONLY ─── */}
              {viewMode === 'quick' ? (
                <div>
                  <div className="card" style={{ borderColor: 'var(--color-accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 className="card-title" style={{ margin: 0, color: 'var(--color-accent)' }}>⚡ QUICK IMPROVED VERSION</h3>
                      <button
                        className="btn-primary"
                        style={{ width: 'auto', padding: '0.45rem 1rem', fontSize: '0.875rem' }}
                        onClick={() => handleCopy(activeQuickText)}
                      >
                        📋 Copy Selected Text
                      </button>
                    </div>

                    {/* Quick Tone Selector Tabs */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8125rem', color: 'var(--color-secondary)' }}>
                        Select Tone Variation:
                      </label>
                      <div className="pill-grid">
                        {quickToneOptions.map((opt, i) => (
                          <div
                            key={i}
                            className={`pill-option ${quickToneIndex === i ? 'selected' : ''}`}
                            onClick={() => setQuickToneIndex(i)}
                            style={{ fontSize: '0.8125rem' }}
                          >
                            {opt.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Improved Message Box */}
                    <div className="improved-box" style={{ fontSize: '1.05rem', fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                      {activeQuickText}
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary)', marginTop: '0.85rem' }}>
                      💡 Tip: Switch back to <strong>✨ Full AI Coaching</strong> in the choice bar above for tone score breakdowns, issue analysis, and your reusable communication lesson!
                    </p>
                  </div>
                </div>
              ) : (
                /* ─── VIEW MODE: FULL AI COACHING ─── */
                <div>
                  {/* Differentiator Callout Banner */}
                  <div className="coaching-banner">
                    <div>
                      <span className="coaching-banner-label">🎓 AI Communication Lesson</span>
                      <div className="coaching-banner-text">
                        {activeDisplayResult.communicationTips[0] || 'Learn why your message works to build lifelong communication skills.'}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 1: HOW IT MAY COME ACROSS */}
                  <div className="card">
                    <div className="score-header">
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>HOW IT MAY COME ACROSS</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)', marginTop: '0.2rem' }}>
                          {activeDisplayResult.summary}
                        </p>
                      </div>
                      <div className="score-badge">
                        <span className="score-num">
                          {activeDisplayResult.overallScore > 10
                            ? Math.round(activeDisplayResult.overallScore)
                            : Math.round(activeDisplayResult.overallScore * 10)}
                        </span>
                        <span className="score-max">/ 100</span>
                      </div>
                    </div>

                    {/* Metric Bars */}
                    <div className="metrics-grid">
                      {Object.entries(activeDisplayResult.scores).map(([key, val]) => {
                        const displayVal = val > 10 ? Math.round(val) : Math.round(val * 10);
                        return (
                          <div key={key} className="metric-item">
                            <div className="metric-header">
                              <span style={{ textTransform: 'capitalize' }}>{key}</span>
                              <span>{displayVal} / 100</span>
                            </div>
                            <div className="metric-bar-bg">
                              <div
                                className="metric-bar-fill"
                                style={{ width: `${displayVal}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION 2: WHAT IS WORKING */}
                  <div className="card">
                    <h3 className="card-title">✓ WHAT YOU&apos;RE DOING WELL</h3>
                    <ul className="strength-list">
                      {activeDisplayResult.strengths.map((str, i) => (
                        <li key={i} className="strength-item">
                          <span className="check-icon">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* SECTION 3: WHAT COULD BE BETTER */}
                  <div className="card">
                    <h3 className="card-title">⚠️ WHAT COULD BE BETTER</h3>
                    <p className="card-subtitle">Specific phrases or habits that might trigger misunderstanding or defense.</p>
                    {activeDisplayResult.issues.map((iss, i) => (
                      <div key={i} className="issue-card">
                        <div className="issue-problem">&quot;{iss.problem}&quot;</div>
                        <div className="issue-why"><strong>Why it matters:</strong> {iss.why}</div>
                        <div className="issue-suggestion">💡 {iss.suggestion}</div>
                      </div>
                    ))}
                  </div>

                  {/* SECTION 4: YOUR IMPROVED MESSAGE */}
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h3 className="card-title" style={{ margin: 0 }}>✨ YOUR IMPROVED MESSAGE</h3>
                      <button
                        className="btn-secondary"
                        onClick={() => handleCopy(activeDisplayResult.improvedMessage)}
                      >
                        📋 Copy Text
                      </button>
                    </div>
                    <div className="improved-box" style={{ whiteSpace: 'pre-wrap' }}>
                      {activeDisplayResult.improvedMessage}
                    </div>
                  </div>

                  {/* SECTION 5: ALTERNATIVE TONES */}
                  <div className="card">
                    <h3 className="card-title">🎭 OTHER WAYS TO SAY IT</h3>
                    <p className="card-subtitle">Choose a variation that best matches your personal style.</p>

                    <div className="pill-grid" style={{ marginBottom: '1rem' }}>
                      {activeDisplayResult.alternatives.map((alt, i) => (
                        <div
                          key={i}
                          className={`pill-option ${activeAltIndex === i ? 'selected' : ''}`}
                          onClick={() => setActiveAltIndex(i)}
                        >
                          {alt.tone}
                        </div>
                      ))}
                    </div>

                    {activeDisplayResult.alternatives[activeAltIndex] && (
                      <div>
                        <div className="improved-box" style={{ whiteSpace: 'pre-wrap' }}>
                          {activeDisplayResult.alternatives[activeAltIndex].message}
                        </div>
                        <button
                          className="btn-secondary"
                          onClick={() => handleCopy(activeDisplayResult.alternatives[activeAltIndex].message)}
                        >
                          📋 Copy {activeDisplayResult.alternatives[activeAltIndex].tone} Version
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SECTION 6: WHY THIS WORKS */}
                  <div className="card">
                    <h3 className="card-title">🔍 WHY THIS WORKS</h3>
                    <ul className="strength-list">
                      {activeDisplayResult.whyItWorks.map((item, i) => (
                        <li key={i} className="strength-item">
                          <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{i + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* SECTION 7: REUSABLE COMMUNICATION LESSON */}
                  <div className="card" style={{ background: 'var(--color-accent-subtle)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                    <h3 className="card-title" style={{ color: 'var(--color-accent)' }}>🎓 REUSABLE COMMUNICATION PRINCIPLE</h3>
                    {activeDisplayResult.communicationTips.map((tip, i) => (
                      <p key={i} style={{ fontSize: '0.95rem', color: 'var(--color-primary)', lineHeight: 1.6, fontWeight: 700 }}>
                        &quot;{tip}&quot;
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── History View ─── */}
      {activeTab === 'history' && !currentUser.isGuest && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              Saved History for {currentUser.name} ({currentUser.email})
            </h2>
            {history.length > 0 && (
              <button className="btn-secondary" onClick={handleClearAllHistory} style={{ color: 'var(--color-error)' }}>
                🗑️ Clear History
              </button>
            )}
          </div>

          {historyLoading ? (
            <div className="loading-box">
              <div className="spinner" />
              <p className="loading-step-text">Loading saved history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>No saved sessions yet</h3>
              <p style={{ color: 'var(--color-secondary)', fontSize: '0.875rem' }}>Your analyzed messages as {currentUser.name} will automatically be saved here.</p>
            </div>
          ) : (
            <div>
              {history.map((item) => (
                <div key={item.id} className="card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => { setViewingHistoryItem(item); setActiveTab('practice'); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingRight: '2rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--color-accent)' }}>
                      To: {item.recipient} ({item.situation})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-primary)', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    &quot;{item.roughMessage}&quot;
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-secondary)' }}>
                      <span>Score: <strong>{item.result.overallScore > 10 ? Math.round(item.result.overallScore) : Math.round(item.result.overallScore * 10)} / 100</strong></span>
                      <span>{item.result.issues.length} Issues flagged</span>
                      {item.isDemo ? <span className="demo-pill" style={{ padding: '0.1rem 0.4rem', fontSize: '0.6875rem' }}>Demo</span> : <span className="live-pill" style={{ padding: '0.1rem 0.4rem', fontSize: '0.6875rem' }}>Live AI</span>}
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-error)' }}
                      onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                      title="Delete this session"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Account Switcher Modal ─── */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary)' }}>Switch Account</h3>
              <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowAccountModal(false)}>✕</button>
            </div>

            {/* Custom Email Login */}
            <form onSubmit={handleAccountCustomLogin} style={{ marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--color-accent-subtle)', padding: '0.75rem 0.95rem', borderRadius: 'var(--radius-md)', marginBottom: '0.85rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                  🟢 Sign in with Email:
                </span>
              </div>
              <input
                type="email"
                className="form-input"
                placeholder="your.email@gmail.com"
                value={accountEmailInput}
                onChange={(e) => setAccountEmailInput(e.target.value)}
                style={{ marginBottom: '0.5rem' }}
                required
              />
              <input
                type="password"
                className="form-input"
                placeholder="Enter Password"
                value={accountPassInput}
                onChange={(e) => setAccountPassInput(e.target.value)}
                style={{ marginBottom: '0.75rem' }}
                required
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.7rem', fontWeight: 700 }}>
                Sign In / Register
              </button>
            </form>

            {/* Demo Accounts */}
            <div style={{ marginBottom: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <label className="form-label" style={{ fontSize: '0.8125rem', color: 'var(--color-secondary)' }}>
                1-Click Demo Accounts:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {PRE_REGISTERED_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    className="btn-secondary"
                    style={{ justifyContent: 'space-between', width: '100%', padding: '0.65rem 0.9rem' }}
                    onClick={() => handleAccountSwitch(acc)}
                  >
                    <span><strong>{acc.name}</strong> ({acc.email})</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 700 }}>Login →</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Guest Mode */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <button
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                onClick={handleAccountGuestSwitch}
              >
                👤 Continue as Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Settings & Themes Modal ─── */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-card settings-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>⚙️ Preferences & Themes</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary)', margin: '0.2rem 0 0' }}>
                  Choose your preferred color theme and workspace aesthetic
                </p>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowSettingsModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Theme Grid */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Select Interface Theme</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                  {THEME_OPTIONS.find((t) => t.id === currentTheme)?.name} Active
                </span>
              </label>

              <div className="theme-grid">
                {THEME_OPTIONS.map((th) => (
                  <button
                    key={th.id}
                    className={`theme-card-btn ${currentTheme === th.id ? 'active' : ''}`}
                    onClick={() => handleThemeChange(th.id)}
                    type="button"
                  >
                    <div className="theme-palette-preview">
                      {th.colors.map((c, i) => (
                        <span key={i} className="theme-color-dot" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="theme-card-info">
                      <span className="theme-card-name">{th.name}</span>
                      <span className="theme-card-desc">{th.desc}</span>
                    </div>
                    {currentTheme === th.id && (
                      <span className="theme-active-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Deployment & AI Status Info */}
            <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Production Ready AI Engine
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>
                    Groq Cloud Llama / GPT-OSS Ultra-Fast Server Inference
                  </div>
                </div>
                <span className="badge badge-success">🟢 Connected</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  handleThemeChange('light');
                  showToast('Reset to default Clean Light theme');
                }}
              >
                Reset Default
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0.65rem 1.4rem' }}
                onClick={() => setShowSettingsModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast Notification ─── */}
      <div className={`copy-toast ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
}
