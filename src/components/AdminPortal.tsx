import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  DollarSign,
  ExternalLink,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  LogOut,
  TrendingUp,
  RotateCcw,
  Eye,
  EyeOff,
  Sparkles,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import {
  MonetizationConfig,
  saveMonetizationConfig,
  DEFAULT_MONETIZATION_CONFIG,
  loadAdminCredentials,
  saveAdminCredentials,
  isAdminLoggedIn,
  setAdminLoggedIn,
} from '../lib/securityAndMonetization';

interface AdminPortalProps {
  config: MonetizationConfig;
  onUpdateConfig: (newConfig: MonetizationConfig) => void;
  onExitAdmin: () => void;
}

const LOCKOUT_STORAGE_KEY = 'purepixel_admin_lockout_until';
const FAILED_ATTEMPTS_KEY = 'purepixel_admin_failed_attempts';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  config,
  onUpdateConfig,
  onExitAdmin,
}) => {
  const [authenticated, setAuthenticated] = useState<boolean>(() => isAdminLoggedIn());
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState<number>(0);

  // Local editable monetization state
  const [draft, setDraft] = useState<MonetizationConfig>(config);
  const [saveToast, setSaveToast] = useState('');

  // Credentials update state
  const [newAdminId, setNewAdminId] = useState(() => loadAdminCredentials().adminId);
  const [newAdminPassword, setNewAdminPassword] = useState(
    () => loadAdminCredentials().password
  );
  const [credSavedToast, setCredSavedToast] = useState('');

  // Brute-force lockout timer check
  useEffect(() => {
    const checkLockout = () => {
      const raw = sessionStorage.getItem(LOCKOUT_STORAGE_KEY);
      if (!raw) {
        setLockoutRemainingSec(0);
        return;
      }
      const until = parseInt(raw, 10);
      const diff = Math.ceil((until - Date.now()) / 1000);
      if (diff > 0) {
        setLockoutRemainingSec(diff);
      } else {
        sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
        sessionStorage.removeItem(FAILED_ATTEMPTS_KEY);
        setLockoutRemainingSec(0);
      }
    };
    checkLockout();
    const timer = setInterval(checkLockout, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemainingSec > 0) return;

    const creds = loadAdminCredentials();
    if (loginId.trim() === creds.adminId && loginPassword === creds.password) {
      sessionStorage.removeItem(FAILED_ATTEMPTS_KEY);
      sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
      setAdminLoggedIn(true);
      setAuthenticated(true);
      setLoginError('');
    } else {
      const prevAttempts = parseInt(
        sessionStorage.getItem(FAILED_ATTEMPTS_KEY) || '0',
        10
      );
      const nextAttempts = prevAttempts + 1;
      sessionStorage.setItem(FAILED_ATTEMPTS_KEY, String(nextAttempts));

      if (nextAttempts >= 5) {
        const until = Date.now() + 30 * 1000;
        sessionStorage.setItem(LOCKOUT_STORAGE_KEY, String(until));
        setLockoutRemainingSec(30);
        setLoginError(
          'Too many failed login attempts. Brute-force shield activated for 30 seconds.'
        );
      } else {
        setLoginError(
          `Invalid Admin ID or Password (${5 - nextAttempts} attempts remaining).`
        );
      }
    }
  };

  const handleLogout = () => {
    setAdminLoggedIn(false);
    setAuthenticated(false);
    setLoginId('');
    setLoginPassword('');
  };

  const handleSaveMonetization = (e: React.FormEvent) => {
    e.preventDefault();
    saveMonetizationConfig(draft);
    onUpdateConfig(draft);
    setSaveToast('Direct Link settings saved and activated on the live website.');
    setTimeout(() => setSaveToast(''), 3500);
  };

  const handleResetDefault = () => {
    const reset = {
      ...DEFAULT_MONETIZATION_CONFIG,
      totalAdTriggers: draft.totalAdTriggers,
      totalDownloads: draft.totalDownloads,
    };
    setDraft(reset);
    saveMonetizationConfig(reset);
    onUpdateConfig(reset);
    setSaveToast('Restored default Monetag Direct Links.');
    setTimeout(() => setSaveToast(''), 3000);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminId.trim() || !newAdminPassword.trim()) return;
    saveAdminCredentials({
      adminId: newAdminId.trim(),
      password: newAdminPassword,
    });
    setCredSavedToast('Admin credentials updated.');
    setTimeout(() => setCredSavedToast(''), 3000);
  };

  const estimatedRevenue = ((config.totalAdTriggers / 1000) * 6.2).toFixed(2);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center px-4 py-12 text-[#141413]">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E4DD] shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#141413] flex items-center justify-center text-white">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-[#141413]">
                  KlearPix Admin Console
                </h1>
                <p className="text-xs text-[#575653]">
                  Restricted Publisher & Monetization Gateway
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onExitAdmin}
              className="text-xs font-medium text-[#575653] hover:text-[#141413] flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#575653] mb-1.5">
                Admin ID
              </label>
              <input
                type="text"
                required
                disabled={lockoutRemainingSec > 0}
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter Admin ID"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E4DD] bg-[#FAF8F5] text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#0D7A5F] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#575653] mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  disabled={lockoutRemainingSec > 0}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#E6E4DD] bg-[#FAF8F5] text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#0D7A5F] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8A84] hover:text-[#141413] cursor-pointer"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700 font-medium flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>
                  {loginError}
                  {lockoutRemainingSec > 0
                    ? ` Unlocking in ${lockoutRemainingSec}s.`
                    : ''}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={lockoutRemainingSec > 0}
              className={`w-full py-3 rounded-xl font-display font-bold text-sm transition-all cursor-pointer ${
                lockoutRemainingSec > 0
                  ? 'bg-[#8C8A84] text-white cursor-not-allowed'
                  : 'bg-[#0D7A5F] hover:bg-[#095E48] text-white shadow-sm'
              }`}
            >
              {lockoutRemainingSec > 0
                ? `Locked (${lockoutRemainingSec}s)`
                : 'Sign In to Admin Dashboard'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E6E4DD] flex items-center justify-between text-[11px] text-[#575653]">
            <span>Protected by Rate-Limit Shield</span>
            <span className="font-mono">Default: admin / admin123</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#141413]">
      {/* Top Admin Header */}
      <header className="bg-white border-b border-[#E6E4DD] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#141413] flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5 text-[#34D399]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-[#141413]">
                  PurePixel Admin Console
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#0D7A5F] font-semibold">
                  /admin
                </span>
              </div>
              <p className="text-xs text-[#575653]">
                Manage Direct Link Monetization, Click Analytics & Admin Security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExitAdmin}
              className="px-3.5 py-2 rounded-xl border border-[#E6E4DD] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#141413] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Studio</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-[#E6E4DD] p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-[#575653] mb-2">
              <span>Total Direct-Link Ad Triggers</span>
              <TrendingUp className="w-4 h-4 text-[#0D7A5F]" />
            </div>
            <div className="font-display font-extrabold text-3xl text-[#141413] tabular-nums">
              {config.totalAdTriggers}
            </div>
            <p className="text-xs text-[#575653] mt-1">
              Fired on Step 1 (Generate) & Step 2 (Download)
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E6E4DD] p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-[#575653] mb-2">
              <span>Completed Clean File Downloads</span>
              <Sparkles className="w-4 h-4 text-[#0D7A5F]" />
            </div>
            <div className="font-display font-extrabold text-3xl text-[#141413] tabular-nums">
              {config.totalDownloads}
            </div>
            <p className="text-xs text-[#575653] mt-1">
              100% lossless PNG, WebP, JPG & MP4 exports
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E6E4DD] p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-[#575653] mb-2">
              <span>Estimated Session Value ($6.20 CPM)</span>
              <DollarSign className="w-4 h-4 text-[#0D7A5F]" />
            </div>
            <div className="font-display font-extrabold text-3xl text-[#0D7A5F] tabular-nums">
              ${estimatedRevenue}
            </div>
            <p className="text-xs text-[#575653] mt-1">
              Status:{' '}
              <strong className="text-[#141413]">
                {config.enabled ? 'Monetization Active' : 'Paused'}
              </strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Direct Link Configuration Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E6E4DD] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-bold text-lg text-[#141413]">
                  Direct Link (Smartlink) Monetization Setup
                </h2>
                <p className="text-xs text-[#575653]">
                  Paste your Monetag or Adsterra Direct Link URLs below. Every click on Generate or Download opens your ad link in a new tab.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-xs font-medium text-[#575653] hover:text-[#141413] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            </div>

            <form onSubmit={handleSaveMonetization} className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E4DD]">
                <div>
                  <div className="text-sm font-semibold text-[#141413]">
                    Enable Direct-Link Monetization on Public Buttons
                  </div>
                  <div className="text-xs text-[#575653]">
                    When enabled, clicking Remove Watermark or Download opens your Direct Link in a new tab while delivering the user&apos;s clean file.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                  className="w-5 h-5 accent-[#0D7A5F] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E4DD]">
                <div>
                  <div className="text-sm font-semibold text-[#141413]">
                    Enable 3-Second &quot;Preparing Clean HD File&quot; Smart Ad Popup
                  </div>
                  <div className="text-xs text-[#575653]">
                    Shows a 3-second preparation popup with a Sponsor Banner before the final Save HD File button (boosts ad CTR & earnings by 2–3×).
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={draft.interstitialCountdownSec || 3}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        interstitialCountdownSec: parseInt(e.target.value, 10),
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-[#E6E4DD] bg-white text-xs font-semibold text-[#141413]"
                  >
                    <option value={2}>2 sec</option>
                    <option value={3}>3 sec</option>
                    <option value={5}>5 sec</option>
                  </select>
                  <input
                    type="checkbox"
                    checked={draft.smartCountdownModal ?? true}
                    onChange={(e) =>
                      setDraft({ ...draft, smartCountdownModal: e.target.checked })
                    }
                    className="w-5 h-5 accent-[#0D7A5F] rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#575653] mb-1.5">
                    Ad Network Provider
                  </label>
                  <select
                    value={draft.networkName}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        networkName: e.target.value as MonetizationConfig['networkName'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E4DD] bg-[#FAF8F5] text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#0D7A5F]"
                  >
                    <option value="Monetag">Monetag (Direct Link)</option>
                    <option value="Adsterra">Adsterra (Smartlink)</option>
                    <option value="Custom Direct Link">Custom Sponsor / Redirect URL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#575653] mb-1.5">
                    Trigger Frequency
                  </label>
                  <select
                    value={draft.triggerMode}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        triggerMode: e.target.value as MonetizationConfig['triggerMode'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E4DD] bg-[#FAF8F5] text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#0D7A5F]"
                  >
                    <option value="every_download">
                      Dual-Step Trigger (Generate + Download)
                    </option>
                    <option value="once_per_session">Once Per User Session</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#575653] mb-1.5">
                  Primary Direct Link URL #1 (Fires on &quot;Generate Clean Master&quot;)
                </label>
                <input
                  type="url"
                  required
                  value={draft.imageDownloadAdUrl}
                  onChange={(e) =>
                    setDraft({ ...draft, imageDownloadAdUrl: e.target.value })
                  }
                  placeholder="https://omg10.com/4/11542046"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E4DD] bg-[#FAF8F5] font-mono text-xs text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#0D7A5F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#575653] mb-1.5">
                  Secondary Direct Link URL #2 (Fires on &quot;Download Lossless File&quot; & Video Export)
                </label>
                <input
                  type="url"
                  required
                  value={draft.videoExportAdUrl}
                  onChange={(e) =>
                    setDraft({ ...draft, videoExportAdUrl: e.target.value })
                  }
                  placeholder="https://omg10.com/4/11584190"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E4DD] bg-[#FAF8F5] font-mono text-xs text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#0D7A5F]"
                />
              </div>

              {saveToast && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveToast}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <a
                  href={draft.imageDownloadAdUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl border border-[#E6E4DD] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#141413] inline-flex items-center gap-1.5"
                >
                  <span>Test Link #1</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0D7A5F] hover:bg-[#095E48] text-white font-display font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  Save & Activate Direct Links
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Admin Password + Step-by-Step Earning Guide */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E6E4DD] p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="w-4 h-4 text-[#0D7A5F]" />
                <h3 className="font-display font-bold text-base text-[#141413]">
                  Admin Login Security
                </h3>
              </div>
              <p className="text-xs text-[#575653] mb-4">
                Update the Admin ID and Password required to access <code className="font-mono">/admin</code>.
              </p>

              <form onSubmit={handleSaveCredentials} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#575653] mb-1">
                    New Admin ID
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdminId}
                    onChange={(e) => setNewAdminId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DD] bg-[#FAF8F5] text-xs text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#575653] mb-1">
                    New Password
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DD] bg-[#FAF8F5] text-xs text-[#141413]"
                  />
                </div>
                {credSavedToast && (
                  <p className="text-xs text-emerald-700 font-medium">{credSavedToast}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#141413] hover:bg-[#2C2C2A] text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Update Admin Credentials
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-[#E6E4DD] p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-[#0D7A5F]" />
                <h3 className="font-display font-bold text-sm text-[#141413]">
                  How Direct Link Earnings Work
                </h3>
              </div>
              <ol className="text-xs text-[#575653] space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Create a free Publisher account on <strong>Monetag.com</strong> or{' '}
                  <strong>Adsterra.com</strong>.
                </li>
                <li>
                  Create a <strong>Direct Link (Smartlink)</strong> unit—no script approval needed.
                </li>
                <li>
                  Copy your Direct Link URL (e.g. <code className="font-mono">https://omg10.com/4/...</code>) and paste it into the two boxes on the left.
                </li>
                <li>
                  Every time a visitor clicks <strong>Generate Clean Master</strong> or{' '}
                  <strong>Download Lossless File</strong>, your ad page opens in a new tab and your click is credited!
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
