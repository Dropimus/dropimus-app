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
      const liveRes = await DropimusAPI.getPublicClaims();
      if (liveRes && liveRes.success && liveRes.data && liveRes.data.claims) {
        const liveClaims = liveRes.data.claims.map((c: any) => {
          const daysLeft = c.resolution_date 
            ? Math.max(0, Math.ceil((new Date(c.resolution_date).getTime() - Date.now()) / 86400000)) 
            : 14;

          const rawCat = c.category || 'Crypto';
          const formattedCat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();

          return {
            id: c.id,
            title: c.title || 'Untitled Claim',
            category: formattedCat,
            chain: 'Base',
            anchorer: c.anchorer || '0x9f3b...a2c1',
            tier: 'Contributor',
            capital: Math.round(parseFloat(c.capital_stake || c.capital || '5')),
            honorStaked: c.honor_stake || c.honorStaked || 100,
            callers: c.callers || 1,
            proven: c.proven !== undefined ? c.proven : 100,
            faded: c.faded !== undefined ? c.faded : 0,
            status: c.status || 'open',
            daysLeft: daysLeft,
            description: c.description || '',
            calls: c.calls || [],
            resolutionDate: c.resolution_date || c.resolutionDate,
            metric: c.metric || 'Price',
            source: c.source || 'Oracle Feed',
            txHash: c.anchor_tx_hash || c.txHash || '0x...'
          };
        });
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
              address: (uData.auth_providers?.includes('wallet') || uData.is_verified) ? (prev.address || '0x9f3b5da725814b01a90db31e08e025f4a1b2c3d4') : prev.address,
            };
            if (usageRes && usageRes.success && usageRes.data) {
              updated.balanceHonor = usageRes.data.honor_status?.balance ?? updated.balanceHonor;
              updated.tier = usageRes.data.honor_status?.title ?? updated.tier;
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
                avatar: exchangeData.user.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
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
        const token = localStorage.getItem('dropimus_jwt_access_token');
        if (token) {
          try {
            // Probe a Bearer-aware endpoint. /auth/status is validated against a
            // cookie session and returns authenticated:false for a valid JWT/
            // wallet session, so it must NOT gate a token login. /users/me
            // honors the Bearer token (authFetch refreshes it on a 401).
            const meRes = await authFetch('/api/users/me', {}, { signOutOnFailure: false });
            if (meRes.ok) {
              const meJson = await meRes.json().catch(() => null);
              const u = meJson?.data;
              if (u) {
                authGoogleUser = {
                  loggedIn: true,
                  name: u.full_name || u.fullName || u.username || 'Dropimus User',
                  email: u.email || '',
                  avatar: u.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
                };

                if (u.address) {
                  authWallet = {
                    connected: true,
                    address: u.address,
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
              // 401 that couldn't be refreshed (signOutOnFailure:false keeps the
              // UI from flashing) — the stored token is dead, clear it.
              handleForceCleanSession();
            }
          } catch (statusErr) {
            console.warn('App: Background session verification silent ignore', statusErr);
            handleForceCleanSession();
          }
        } else {
          handleForceCleanSession();
        }
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
