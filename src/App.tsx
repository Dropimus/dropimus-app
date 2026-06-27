/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { C, FONTS } from './tokens';
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import CourtPage from './pages/CourtPage';
import ClaimDetailPage from './pages/ClaimDetailPage';
import AnchorPage from './pages/AnchorPage';
import HonorPage from './pages/HonorPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import { Claim, Wallet, GoogleUser } from './lib/walletAndGoogle';
import { DropimusAPI } from './lib/dropimusAPI';
import { motion, AnimatePresence } from 'motion/react';
import { CourtPageSkeleton, HonorPageSkeleton, LeaderboardSkeleton, ProfileSkeleton } from './components/shared/SkeletonLoader';
import { API_BASE } from './lib/apiBase';
import { authFetch, onSessionExpired } from './lib/authClient';

const num = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

const shortAddr = (a: string) =>
  a && a.startsWith('0x') && a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : (a || '');

/**
 * Map a backend claim (plain /claims or enriched /market/claims) into the UI
 * Claim shape. Sentiment and attribution are read from real fields only — any
 * missing value resolves to empty/zero, never fabricated.
 */
const mapBackendClaim = (c: any): Claim => {
  const daysLeft = c.resolution_date
    ? Math.max(0, Math.ceil((new Date(c.resolution_date).getTime() - Date.now()) / 86400000))
    : 0;

  const rawCat = c.category || '';
  const formattedCat = rawCat ? rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase() : '';

  // Real sentiment — market endpoint nests it under `market`, otherwise top-level.
  const m = c.market || c;
  const believe = num(m.believe_weight ?? m.proven_weight ?? m.yes_weight ?? m.believe ?? c.proven);
  const doubt = num(m.doubt_weight ?? m.faded_weight ?? m.no_weight ?? m.doubt ?? c.faded);
  const believePct = num(m.believe_pct ?? m.proven_pct ?? m.consensus_pct);
  let proven = 0, faded = 0;
  if (believe !== null && doubt !== null && believe + doubt > 0) {
    proven = believe; faded = doubt;
  } else if (believePct !== null) {
    proven = believePct; faded = 100 - believePct;
  }

  const callers = num(m.total_calls ?? m.participant_count ?? m.callers ?? c.callers) ?? 0;
  const capital = num(c.capital_staked ?? c.capital_stake ?? c.capital ?? m.total_capital) ?? 0;

  const anchorerAddr = c.anchorer_address || c.anchorer || c.submitter_address || '';
  const anchorerName = c.anchorer_username || c.anchorer_name || c.submitted_by_username
    || c.anchorer?.username || c.submitter?.username || '';

  return {
    id: c.id,
    title: c.title || 'Untitled Claim',
    category: formattedCat,
    chain: c.chain || 'Base',
    anchorer: typeof anchorerAddr === 'string' ? anchorerAddr : '',
    anchorerName: anchorerName || '',
    tier: c.tier || c.anchorer_tier || '',
    capital: Math.round(capital) || 0,
    honorStaked: num(c.honor_stake ?? c.honorStaked ?? m.total_honor) ?? 0,
    callers,
    proven,
    faded,
    status: c.status || 'open',
    daysLeft,
    description: c.description || '',
    calls: c.calls || [],
    resolutionDate: c.resolution_date || c.resolutionDate,
    metric: c.metric || '',
    source: c.source || '',
    txHash: c.anchor_tx_hash || c.txHash || '',
  };
};

// Memoized Liquid-morphism ambient background blobs with organic breathing animations
const AmbientBackground = React.memo(({ activePage }: { activePage: string }) => {
  return (
    <motion.div
      key={activePage}
      initial={{ scale: 0.95, opacity: 0.8, rotate: -1 }}
      animate={{
        scale: [1, 1.05, 0.98, 1.01, 1],
        opacity: [0.85, 1, 0.95, 1, 1],
        rotate: [0, 1.5, -1, 0.5, 0],
      }}
      transition={{
        duration: 0.6,
        ease: "easeOut"
      }}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.12, 0.93, 1.08, 1],
          x: [0, 25, -15, 12, 0],
          y: [0, -15, 20, -8, 0],
          borderRadius: ["50% 50% 50% 50%", "42% 58% 50% 50%", "58% 42% 55% 45%", "50% 50% 50% 50%", "50% 50% 50% 50%"]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: 'absolute',
          top: '12%',
          left: '10%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{
          scale: [1, 0.92, 1.15, 0.95, 1],
          x: [0, -22, 20, -10, 0],
          y: [0, 18, -15, 10, 0],
          borderRadius: ["50% 50% 50% 50%", "55% 45% 48% 52%", "42% 58% 52% 48%", "50% 50% 50% 50%", "50% 50% 50% 50%"]
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '5%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 82, 255, 0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
});

AmbientBackground.displayName = 'AmbientBackground';

export default function App() {
  // Page routing state
  const [activePage, setActivePage] = useState<'court' | 'honor' | 'anchor' | 'leaderboard' | 'profile'>('court');
  
  // Theme is permanently locked to dark
  const theme = 'dark';

  // Sync theme attribute to HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);
  
  // Responsive State
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Selected single claim analysis detail flow state
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null);
  const [initialExpandCall, setInitialExpandCall] = useState<boolean>(false);

  // Core authenticated state caches
  const [wallet, setWallet] = useState<Wallet>({ connected: false, address: '', balanceUSDC: 0, balanceHonor: 0, tier: '' });
  const [googleUser, setGoogleUser] = useState<GoogleUser>({ loggedIn: false, name: '', email: '', avatar: '' });
  const [claimsList, setClaimsList] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthVerifying, setIsAuthVerifying] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  // Clear session forcefully on client-side status failure
  const handleForceCleanSession = () => {
    localStorage.removeItem('dropimus_jwt_access_token');
    localStorage.removeItem('dropimus_jwt_refresh_token');
    setGoogleUser({ loggedIn: false, name: '', email: '', avatar: '' });
    setWallet({ connected: false, address: '', balanceUSDC: 0, balanceHonor: 0, tier: '' });
    setClaimsList([]);
    setAuthenticated(false);
  };

  // Initialize and synchronise baseline caches
  const refreshState = async () => {
    // Fetch live public claims from the backend
    setClaimsList([]);

    try {
      const liveRes = await DropimusAPI.getMarketClaims();
      const rawClaims: any[] =
        (liveRes?.data?.claims) ??
        (Array.isArray(liveRes?.data) ? liveRes.data : null) ??
        (liveRes?.claims) ??
        (Array.isArray(liveRes) ? liveRes : null) ??
        [];
      if (Array.isArray(rawClaims) && rawClaims.length > 0) {
        const liveClaims = rawClaims.map(mapBackendClaim);
        setClaimsList(liveClaims);
      } else {
        setClaimsList([]);
      }
    } catch (err) {
      console.warn("Could not fetch live claims from backend:", err);
      setClaimsList([]);
    }

    const token = localStorage.getItem('dropimus_jwt_access_token');
    if (token) {
      try {
        const [meRes, usageRes] = await Promise.all([
          DropimusAPI.getCurrentUser(token),
          authFetch('/api/me/usage').then(res => res.ok ? res.json() : null)
        ]).catch(() => [null, null]);

        if (meRes && meRes.success && meRes.data) {
          const uData = meRes.data;
          setGoogleUser(prev => ({
            ...prev,
            loggedIn: true,
            name: uData.full_name || uData.username || prev.name,
            email: uData.email || prev.email,
          }));

          setWallet(prev => {
            const updated = {
              ...prev,
              connected: true,
              address: uData.address || prev.address,
            };
            const ud = usageRes?.data;
            if (usageRes && usageRes.success && ud) {
              // Tolerant of the usage payload shape (honor lives under various keys).
              const hs = ud.honor_status || ud.honor || {};
              const honor = num(hs.balance ?? hs.honor_points ?? hs.total ?? hs.current ?? ud.honor_balance ?? ud.honor_points);
              if (honor !== null) updated.balanceHonor = honor;
              const tier = hs.title ?? hs.tier ?? ud.account_tier?.name ?? ud.tier ?? ud.tier_name;
              if (tier) updated.tier = tier;
            }
            return updated;
          });
        }
      } catch (err) {
        console.warn("App: Live background profile/usage sync failed", err);
      }
    }
  };

  useEffect(() => {
    const initAuthAndState = async () => {
      setWallet({ connected: false, address: '', balanceUSDC: 0, balanceHonor: 0, tier: '' });
      setGoogleUser({ loggedIn: false, name: '', email: '', avatar: '' });

      let isAuthenticated = false;
      let authWallet: Wallet | null = null;
      let authGoogleUser: GoogleUser | null = null;

      const params = new URLSearchParams(window.location.search);
      const sessionToken = params.get('session_token');
      const oauthSuccess = params.get('oauth_success');
      const isCallbackFlow = !!(sessionToken && oauthSuccess === '1');

      if (isCallbackFlow) {
        setIsAuthVerifying(true);
        setIsLoading(true);
        window.history.replaceState({}, document.title, window.location.pathname);

        try {
          const res = await fetch(`${API_BASE}/api/auth/exchange?token=${encodeURIComponent(sessionToken)}`, {
            credentials: 'include'
          });

          if (res.ok) {
            const exchangeData = await res.json();
            if (exchangeData.ok && exchangeData.user) {
              localStorage.setItem('dropimus_jwt_access_token', exchangeData.access_token);
              if (exchangeData.refresh_token) {
                localStorage.setItem('dropimus_jwt_refresh_token', exchangeData.refresh_token);
              }

              authGoogleUser = {
                loggedIn: true,
                name: exchangeData.user.full_name || exchangeData.user.fullName || exchangeData.user.username || 'Google User',
                email: exchangeData.user.email || '',
                avatar: exchangeData.user.avatar || '',
              };

              if (exchangeData.user.wallets && exchangeData.user.wallets.length > 0) {
                const primaryWallet = exchangeData.user.wallets.find((w: any) => w.isPrimary) || exchangeData.user.wallets[0];
                authWallet = {
                  connected: true,
                  address: primaryWallet.address,
                  balanceUSDC: 0,
                  balanceHonor: 0,
                  tier: 'Novice'
                };
              }

              isAuthenticated = true;
            } else {
              handleForceCleanSession();
            }
          } else {
            handleForceCleanSession();
          }
        } catch (exchangeErr) {
          console.error('App: Google token exchange failed', exchangeErr);
          handleForceCleanSession();
        }
      } else {
        // ── Returning user (no OAuth redirect) ───────────────────────────────
        // Optimistic boot: if there's a stored token, render the app shell
        // INSTANTLY from cached identity and verify in the background. This
        // removes the long full-screen spinner — the per-page skeletons cover
        // the brief data load instead of blocking the whole UI on the network.
        const token = localStorage.getItem('dropimus_jwt_access_token');
        if (!token) {
          setAuthenticated(false);
          setIsLoading(false);
          setIsAuthVerifying(false);
          return;
        }

        try {
          const cachedG = JSON.parse(localStorage.getItem('dropimus_protocol_google_user') || 'null');
          if (cachedG?.loggedIn) setGoogleUser(cachedG);
        } catch { /* ignore */ }
        try {
          const cachedW = JSON.parse(localStorage.getItem('dropimus_protocol_wallet') || 'null');
          if (cachedW?.connected) setWallet(cachedW);
        } catch { /* ignore */ }

        setAuthenticated(true);
        setIsAuthVerifying(false); // show the app now
        setIsLoading(true);        // per-page skeletons while data loads

        // Background verify + hydrate + load — never blocks first paint.
        (async () => {
          try {
            const meRes = await authFetch('/api/users/me', {}, { signOutOnFailure: false });
            if (meRes.ok) {
              const u = (await meRes.json().catch(() => null))?.data;
              if (u) {
                setGoogleUser(prev => ({
                  ...prev,
                  loggedIn: true,
                  name: u.full_name || u.fullName || u.username || prev.name || 'Dropimus User',
                  email: u.email || prev.email || '',
                  avatar: u.avatar || prev.avatar || '',
                }));
                if (u.address) setWallet(prev => ({ ...prev, connected: true, address: u.address }));
              } else {
                handleForceCleanSession();
                setIsLoading(false);
                return;
              }
            } else {
              handleForceCleanSession();
              setIsLoading(false);
              return;
            }
          } catch {
            // Transient network/CORS — keep the optimistic session; the periodic
            // check resolves a genuinely dead session.
          }
          await refreshState();
          setIsLoading(false);
        })();
        return;
      }

      if (authGoogleUser) {
        setGoogleUser(authGoogleUser);
      }
      if (authWallet) {
        setWallet(authWallet);
      }

      if (isAuthenticated) {
        setAuthenticated(true);
        setIsLoading(true);
        await refreshState();
        setIsLoading(false);
      } else {
        setAuthenticated(false);
        setIsLoading(false);
      }

      setIsAuthVerifying(false);
    };

    initAuthAndState();
  }, []);

  // Hook to periodically check session health and detect expiration automatically
  useEffect(() => {
    if (!wallet.connected && !googleUser.loggedIn) return;

    // Sign out only when a refresh genuinely fails (authClient calls this).
    onSessionExpired(handleSignOut);

    const pingInterval = setInterval(async () => {
      try {
        // Probe a Bearer-aware endpoint, not /auth/status (cookie-based, which
        // falsely reports a token session as unauthenticated). authFetch
        // refreshes the access token on a 401 and retries; it only triggers
        // sign-out (via onSessionExpired -> handleSignOut) if the refresh itself
        // genuinely fails. Any non-401 status preserves the local session.
        await authFetch('/api/users/me');
      } catch (err) {
        console.warn("Periodic session check network error (ignored):", err);
      }
    }, 30000); // 30s frequency

    return () => clearInterval(pingInterval);
  }, [wallet.connected, googleUser.loggedIn]);

  // Back trigger to lobbies
  const handleClearSelectedClaim = () => {
    setSelectedClaimId(null);
  };

  const handleSelectClaim = (claim: Claim) => {
    setSelectedClaimId(claim.id);
    setInitialExpandCall(false);
  };

  const handleMakeCallClickInCard = (claim: Claim) => {
    setSelectedClaimId(claim.id);
    setInitialExpandCall(true);
  };

  const handleAddClaim = async (claim: Claim) => {
    await refreshState();
  };

  const handleSignOut = () => {
    fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' }).catch(() => {});
    localStorage.removeItem('dropimus_jwt_access_token');
    localStorage.removeItem('dropimus_jwt_refresh_token');
    setGoogleUser({ loggedIn: false, name: '', email: '', avatar: '' });
    setWallet({ connected: false, address: '', balanceUSDC: 0, balanceHonor: 0, tier: '' });
    setClaimsList([]);
    setAuthenticated(false);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Find active claim object
  const activeClaimObject = selectedClaimId ? claimsList.find(c => c.id === selectedClaimId) : null;

  // Global loading overlay during initial auth verification
  if (isAuthVerifying) {
    return (
      <div
        style={{
          background: C.canvas,
          color: C.text,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONTS.body,
          WebkitFontSmoothing: 'antialiased',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <AmbientBackground activePage="court" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', zIndex: 10 }}>
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-white/5" />
            <div className="absolute inset-x-0 w-16 h-16 rounded-full border-2 border-t-emerald-500 animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-xs font-bold font-mono tracking-widest text-zinc-400 uppercase mb-1">
              Dropimus Protocol
            </h2>
            <p className="text-[10px] font-mono text-zinc-500 animate-pulse">
              Verifying secure session layers...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', background: C.canvas, color: C.text, fontFamily: FONTS.body }}>
        <AuthPage onLoginSuccess={async () => {
          setIsAuthVerifying(true);
          setAuthenticated(true);
          setIsLoading(true);
          await refreshState();
          setIsLoading(false);
          setIsAuthVerifying(false);
        }} />
      </div>
    );
  }

  return (
    <div
      style={{
        background: C.canvas,
        color: C.text,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONTS.body,
        WebkitFontSmoothing: 'antialiased',
        position: 'relative',
      }}
    >
      {/* Liquid-morphism ambient background blobs with organic breathing animations */}
      <AmbientBackground activePage={activePage} />

      {/* 1. Sticky Liquid Morphism Header App bar */}
      <TopBar
        wallet={wallet}
        googleUser={googleUser}
        onUpdate={refreshState}
        activePage={activePage}
        setActivePage={(page) => {
          setSelectedClaimId(null); // Clear selected claim on tab/page switches
          setActivePage(page);
        }}
        onClearSelectedClaim={handleClearSelectedClaim}
      />

      {/* 2. Scrollable Body Content Stage (Clearance for BottomNav) */}
      <main style={{ flex: 1, padding: isDesktop ? '30px 24px 60px' : '20px 0 100px' }}>
        
        {/* If claim detail analysis is selected, override rendering entirely */}
        {activeClaimObject ? (
          <ClaimDetailPage
            claim={activeClaimObject}
            onBack={handleClearSelectedClaim}
            onUpdate={refreshState}
            walletConnected={wallet.connected}
            walletAddress={wallet.address}
            walletBalanceHonor={wallet.balanceHonor}
            walletBalanceUSDC={wallet.balanceUSDC}
            initialExpand={initialExpandCall}
          />
        ) : (
          /* Render designated nav view with smooth cross-fade page transition */
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{ width: '100%' }}
            >
              {activePage === 'court' && (
                isLoading ? (
                  <CourtPageSkeleton />
                ) : (
                  <CourtPage
                    claims={claimsList}
                    onSelectClaim={handleSelectClaim}
                    onMakeCall={handleMakeCallClickInCard}
                  />
                )
              )}

              {activePage === 'honor' && (
                isLoading ? (
                  <HonorPageSkeleton />
                ) : (
                  <HonorPage
                    wallet={wallet}
                  />
                )
              )}

              {activePage === 'anchor' && (
                <AnchorPage
                  onAddClaim={handleAddClaim}
                  walletBalanceUSDC={wallet.balanceUSDC}
                  wallet={wallet}
                />
              )}

              {activePage === 'leaderboard' && (
                isLoading ? (
                  <LeaderboardSkeleton />
                ) : (
                  <LeaderboardPage />
                )
              )}

              {activePage === 'profile' && (
                isLoading ? (
                  <ProfileSkeleton />
                ) : (
                  <ProfilePage
                    wallet={wallet}
                    googleUser={googleUser}
                    claims={claimsList}
                    onSelectClaim={handleSelectClaim}
                    onSignOut={handleSignOut}
                  />
                )
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* 3. Constant Fixed Bottom Nav block (with elevated center Anchor command key) */}
      <BottomNav
        activePage={activePage}
        setActivePage={(page) => {
          setSelectedClaimId(null); // Clear detailed flow selection on tab change
          setActivePage(page);
        }}
        onClearSelectedClaim={handleClearSelectedClaim}
      />
    </div>
  );
}
