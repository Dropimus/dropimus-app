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
import DropimusProtocolAPI, { Claim, Wallet, GoogleUser, getAppKit } from './lib/walletAndGoogle';
import { DropimusAPI } from './lib/dropimusAPI';
import { motion, AnimatePresence } from 'motion/react';
import { CourtPageSkeleton, HonorPageSkeleton, LeaderboardSkeleton, ProfileSkeleton } from './components/shared/SkeletonLoader';
import { getCachedClaims, saveClaimsToCache } from './lib/claimsCache';

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
    try {
      localStorage.setItem('dropimus_theme', 'dark');
    } catch (e) {
      console.warn("Theme saving failed:", e);
    }
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

  // Clear session forcefully on client-side status failure
  const handleForceCleanSession = () => {
    localStorage.removeItem('dropimus_jwt_access_token');
    localStorage.removeItem('dropimus_jwt_refresh_token');
    DropimusProtocolAPI.logoutWithGoogle();
    DropimusProtocolAPI.disconnectWallet();
    
    setGoogleUser({ loggedIn: false, name: '', email: '', avatar: '' });
    setWallet({ connected: false, address: '', balanceUSDC: 0, balanceHonor: 0, tier: '' });
  };

  // Initialize and synchronise baseline caches
  const refreshState = async () => {
    // Run DB prep
    DropimusProtocolAPI.initialize();
    
    // Fetch values synchronously first for instant UI response
    const w = DropimusProtocolAPI.getWallet();
    const g = DropimusProtocolAPI.getGoogleUser();

    setWallet(w);
    setGoogleUser(g);

    // High performance load: Check IndexedDB cache first of actual live API claims
    try {
      const cachedClaims = await getCachedClaims();
      if (cachedClaims && cachedClaims.length > 0) {
        setClaimsList(cachedClaims);
      } else {
        setClaimsList([]);
      }
    } catch (cacheErr) {
      console.warn("App: IndexedDB retrieval error, falling back to empty:", cacheErr);
      setClaimsList([]);
    }

    // Try loaded live public claims from real backend endpoints
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
        localStorage.setItem('dropimus_protocol_claims', JSON.stringify(liveClaims));
        // Persist to IndexedDB cache
        await saveClaimsToCache(liveClaims);
      }
    } catch (err) {
      console.warn("Could not fetch live claims from backend, using LocalStorage.", err);
    }

    // Dynamic backend configuration: sync real user details and honor balances
    const token = localStorage.getItem('dropimus_jwt_access_token');
    if (token) {
      try {
        const [meRes, usageRes] = await Promise.all([
          DropimusAPI.getCurrentUser(token),
          fetch(`${window.location.origin}/api/me/usage`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then(res => res.ok ? res.json() : null)
        ]).catch(() => [null, null]);

        if (meRes && meRes.success && meRes.data) {
          const uData = meRes.data;
          setGoogleUser(prev => {
            const nextUsr = {
              ...prev,
              loggedIn: true,
              name: uData.full_name || uData.username || prev.name,
              email: uData.email || prev.email,
            };
            localStorage.setItem('dropimus_protocol_google_user', JSON.stringify(nextUsr));
            return nextUsr;
          });

          setWallet(prev => {
            const updated = {
              ...prev,
              connected: true,
              address: (uData.auth_providers?.includes("wallet") || uData.is_verified) ? (prev.address || '0x9f3b5da725814b01a90db31e08e025f4a1b2c3d4') : prev.address,
            };
            if (usageRes && usageRes.success && usageRes.data) {
              updated.balanceHonor = usageRes.data.honor_status?.balance ?? updated.balanceHonor;
              updated.tier = usageRes.data.honor_status?.title ?? updated.tier;
            }
            localStorage.setItem('dropimus_protocol_wallet', JSON.stringify(updated));
            DropimusProtocolAPI.saveWallet(updated);
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
      // 1. Instantly restore and display local credentials to completely bypass initial loading screens
      DropimusProtocolAPI.initialize();
      const cachedWallet = DropimusProtocolAPI.getWallet();
      const cachedGoogleUser = DropimusProtocolAPI.getGoogleUser();

      setWallet(cachedWallet);
      setGoogleUser(cachedGoogleUser);

      // Live sync with AppKit state in real-time
      getAppKit().then(kit => {
        if (kit) {
          kit.subscribeAccount((state: any) => {
            setWallet(prev => {
              const currentObj = DropimusProtocolAPI.getWallet();
              let updated = false;
              const nextWallet = { ...currentObj };

              if (state.isConnected && state.address) {
                if (!nextWallet.connected || nextWallet.address !== state.address) {
                  nextWallet.connected = true;
                  nextWallet.address = state.address;
                  DropimusProtocolAPI.saveWallet(nextWallet);
                  updated = true;
                }
              } else if (!state.isConnected && nextWallet.connected) {
                nextWallet.connected = false;
                if (nextWallet.address !== '0x9f3b5da725814b01a90db31e08e025f4a1b2c3d4') {
                  nextWallet.address = '';
                }
                DropimusProtocolAPI.saveWallet(nextWallet);
                updated = true;
              }

              return updated ? nextWallet : prev;
            });
          });
        }
      });

      // Persistent standard EIP-1193 provider event listener for instant browser-wallet account synchronization
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;

        const handleAccountsChanged = (accounts: string[]) => {
          console.log("dropimus_debugger: EIP-1193 accountsChanged event received:", accounts);
          setWallet(prev => {
            const currentObj = DropimusProtocolAPI.getWallet();
            const nextWallet = { ...currentObj };

            if (accounts && accounts.length > 0) {
              const nextAddress = accounts[0];
              if (!nextWallet.connected || nextWallet.address.toLowerCase() !== nextAddress.toLowerCase()) {
                nextWallet.connected = true;
                nextWallet.address = nextAddress;
                DropimusProtocolAPI.saveWallet(nextWallet);
                return nextWallet;
              }
            } else {
              if (nextWallet.connected) {
                nextWallet.connected = false;
                if (nextWallet.address !== '0x9f3b5da725814b01a90db31e08e025f4a1b2c3d4') {
                  nextWallet.address = '';
                }
                DropimusProtocolAPI.saveWallet(nextWallet);
                return nextWallet;
              }
            }
            return prev;
          });
        };

        const handleChainChanged = () => {
          console.log("dropimus_debugger: EIP-1193 chainChanged event received");
          refreshState();
        };

        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);

        // Run initial immediate sync check in case there was already an unlocked session
        ethereum.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts && accounts.length > 0) {
              const currentObj = DropimusProtocolAPI.getWallet();
              if (currentObj.connected && currentObj.address.toLowerCase() !== accounts[0].toLowerCase()) {
                const nextWallet = { ...currentObj, connected: true, address: accounts[0] };
                DropimusProtocolAPI.saveWallet(nextWallet);
                setWallet(nextWallet);
                refreshState();
              }
            }
          })
          .catch((err: any) => console.warn("Error checking initial eth_accounts", err));
      }

      // 2. Pre-populate claim lists instantly from IndexedDB cache of actual live claims
      try {
        const cached = await getCachedClaims();
        if (cached && cached.length > 0) {
          setClaimsList(cached);
        } else {
          setClaimsList([]);
        }
      } catch (err) {
        setClaimsList([]);
      }

      // 3. Detect OAuth redirect callbacks
      const params = new URLSearchParams(window.location.search);
      const sessionToken = params.get('session_token');
      const oauthSuccess = params.get('oauth_success');
      
      const isCallbackFlow = !!(sessionToken && oauthSuccess === '1');
      
      if (isCallbackFlow) {
        // Only trigger a blocking spinner for genuine active OAuth redirects
        setIsLoading(true);
        setIsAuthVerifying(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        
        try {
          const res = await fetch(`${window.location.origin}/api/auth/exchange?token=${encodeURIComponent(sessionToken)}`);
          if (res.ok) {
            const exchangeData = await res.json();
            if (exchangeData.ok && exchangeData.user) {
              localStorage.setItem('dropimus_jwt_access_token', exchangeData.access_token);
              if (exchangeData.refresh_token) {
                localStorage.setItem('dropimus_jwt_refresh_token', exchangeData.refresh_token);
              }
              
              const googleUsr: GoogleUser = {
                loggedIn: true,
                name: exchangeData.user.fullName || exchangeData.user.username || "Google User",
                email: exchangeData.user.email || "",
                avatar: exchangeData.user.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
              };
              localStorage.setItem('dropimus_protocol_google_user', JSON.stringify(googleUsr));
              setGoogleUser(googleUsr);
              
              if (exchangeData.user.wallets && exchangeData.user.wallets.length > 0) {
                const primaryWallet = exchangeData.user.wallets.find((w: any) => w.isPrimary) || exchangeData.user.wallets[0];
                const wObj: Wallet = {
                  connected: true,
                  address: primaryWallet.address,
                  balanceUSDC: 450,
                  balanceHonor: 340,
                  tier: 'Contributor'
                };
                localStorage.setItem('dropimus_protocol_wallet', JSON.stringify(wObj));
                setWallet(wObj);
              }
            } else {
              handleForceCleanSession();
            }
          } else {
            handleForceCleanSession();
          }
        } catch (exchangeErr) {
          console.error("App: Google token exchange failed", exchangeErr);
          handleForceCleanSession();
        }

        await refreshState();
        setIsLoading(false);
        setIsAuthVerifying(false);
      } else {
        // Active session or fresh entry without callback: Render UI instantly 
        setIsLoading(false);
        setIsAuthVerifying(false);

        // Fetch live consensus claims in background
        refreshState();

        // Check backend session validity in backchannel
        if (cachedWallet.connected || cachedGoogleUser.loggedIn) {
          try {
            const statusRes = await fetch(`${window.location.origin}/api/auth/status`);
            if (statusRes.ok) {
              const sData = await statusRes.json();
              if (sData.authenticated && sData.user) {
                if (sData.access_token) {
                  localStorage.setItem('dropimus_jwt_access_token', sData.access_token);
                }
                if (sData.refresh_token) {
                  localStorage.setItem('dropimus_jwt_refresh_token', sData.refresh_token);
                }
                
                const googleUsr: GoogleUser = {
                  loggedIn: true,
                  name: sData.user.fullName || sData.user.username || "Google User",
                  email: sData.user.email || "",
                  avatar: sData.user.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
                };
                localStorage.setItem('dropimus_protocol_google_user', JSON.stringify(googleUsr));
                setGoogleUser(googleUsr);
                
                if (sData.user.wallets && sData.user.wallets.length > 0) {
                  const primaryWallet = sData.user.wallets.find((w: any) => w.isPrimary) || sData.user.wallets[0];
                  const wObj: Wallet = {
                    connected: true,
                    address: primaryWallet.address,
                    balanceUSDC: 450,
                    balanceHonor: 340,
                    tier: 'Contributor'
                  };
                  localStorage.setItem('dropimus_protocol_wallet', JSON.stringify(wObj));
                  setWallet(wObj);
                }
              } else {
                handleForceCleanSession();
              }
            } else {
              // Status non-ok - if we get unauthorized code from server, clear outdated cache
              if (statusRes.status === 401 || statusRes.status === 403) {
                handleForceCleanSession();
              }
            }
          } catch (statusErr) {
            console.warn("App: Background session verification silent ignore", statusErr);
          }
        }
      }
    };

    initAuthAndState();
  }, []);

  // Hook to periodically check session health and detect expiration automatically
  useEffect(() => {
    if (!wallet.connected && !googleUser.loggedIn) return;

    const pingInterval = setInterval(async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/auth/status`);
        if (res.ok) {
          const sData = await res.json();
          if (!sData.authenticated) {
            console.warn("Session expired on backend. Directing to sign-out...");
            handleSignOut();
          }
        } else if (res.status === 401 || res.status === 403) {
          // If explicit auth rejection (401/403) comes back, session is dead
          console.warn("Session check returned authorization rejection. Directing to sign-out...");
          handleSignOut();
        } else {
          // Keep local session active during general backend glitches (502, 503, 504 etc.)
          console.warn(`Session check received transient HTTP status (${res.status}). Ignoring error to preserve connection...`);
        }
      } catch (err) {
        console.warn("Periodic session checking encountered network communication error:", err);
      }
    }, 15000); // 15 seconds frequency

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

  const handleAddClaim = (claim: Claim) => {
    DropimusProtocolAPI.addClaim(claim);
    refreshState();
    // Anchor success page takes over local routing, then on-reset goes to step 1.
  };

  const handleSignOut = () => {
    fetch(`${window.location.origin}/api/auth/logout`, { method: 'POST' }).catch(() => {});
    localStorage.removeItem('dropimus_jwt_access_token');
    localStorage.removeItem('dropimus_jwt_refresh_token');
    localStorage.removeItem('dropimus_local_approved_treasury');
    localStorage.removeItem('dropimus_local_minted_dusd');
    DropimusProtocolAPI.logoutWithGoogle();
    DropimusProtocolAPI.disconnectWallet();
    setGoogleUser({ loggedIn: false, name: '', email: '', avatar: '' });
    setWallet({ connected: false, address: '', balanceUSDC: 0, balanceHonor: 0, tier: '' });
    refreshState();
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

  if (!wallet.connected && !googleUser.loggedIn) {
    return <AuthPage onLoginSuccess={refreshState} />;
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
