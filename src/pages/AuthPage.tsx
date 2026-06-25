/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Check, 
  RefreshCw, 
  Shield, 
  Cpu, 
  Key, 
  Plus,
  Mail,
  User,
  Scale,
  ExternalLink,
  Activity,
  Terminal,
  Fingerprint,
  Globe,
  Database,
  AlertCircle,
  X
} from 'lucide-react';
import { C, FONTS } from '../tokens';
import DropimusProtocolAPI, { Wallet, GoogleUser, getAppKit } from '../lib/walletAndGoogle';
import { DropimusAPI } from '../lib/dropimusAPI';
import { motion, AnimatePresence } from 'motion/react';
import { TermsPage } from './TermsPage';
import { prefetchActiveClaims } from '../lib/claimsCache';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const isManualConnectingRef = React.useRef(false);
  // Navigation & Terms View States
  const [viewingTerms, setViewingTerms] = useState(false);

  // Connection status states
  const [googleConnected, setGoogleConnected] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  
  // SIWE and signing progress states
  const [customAddress, setCustomAddress] = useState('');
  const [siweNonce, setSiweNonce] = useState('');
  const [siweMessage, setSiweMessage] = useState('');
  const [signatureProgress, setSignatureProgress] = useState<'idle' | 'requesting' | 'verifying' | 'success'>('idle');
  const [showSIWELayout, setShowSIWELayout] = useState(false);

  // Wallet and Google Real integration states
  const [walletAuthError, setWalletAuthError] = useState<string | null>(null);
  const [activeChain, setActiveChain] = useState<string>('base-sepolia');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  // Premium, production-ready toast notifications state
  const [toasts, setToasts] = useState<{ id: string; type: 'error' | 'success' | 'info'; message: string }[]>([]);

  // Policy acceptance checkbox state
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    try {
      return localStorage.getItem('dropimus_concordance_accepted') === 'true';
    } catch {
      return false;
    }
  });

  const saveTermsAcceptance = (val: boolean) => {
    setHasAcceptedTerms(val);
    try {
      localStorage.setItem('dropimus_concordance_accepted', val ? 'true' : 'false');
    } catch (e) {
      console.warn("localStorage persistence error:", e);
    }
  };

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToasts(prev => {
      // De-duplicate: If a toast with the exact same message is currently displaying, do not append a new one.
      if (prev.some(t => t.message === message)) {
        return prev;
      }
      const id = Math.random().toString(36).substring(2, 9);
      setTimeout(() => {
        setToasts(current => current.filter(t => t.id !== id));
      }, 4500);
      return [...prev, { id, type, message }];
    });
  };

  useEffect(() => {
    DropimusProtocolAPI.initialize();
    const cachedWallet = DropimusProtocolAPI.getWallet();
    const cachedGoogle = DropimusProtocolAPI.getGoogleUser();

    setGoogleConnected(cachedGoogle.loggedIn);
    if (cachedGoogle.loggedIn) {
      setGoogleUser(cachedGoogle);
    }
    setWalletConnected(cachedWallet.connected);
    if (cachedWallet.address) {
      setCustomAddress(cachedWallet.address);
    }

    // Background prefetching of active claims
    prefetchActiveClaims().catch((err) => {
      console.warn("AuthPage: background prefetch failed", err);
    });

    // Subscribe to AppKit state for instant triggers
    let unsubscribe: (() => void) | null = null;
    const initAppKitSubscription = async () => {
      const kit = await getAppKit();
      if (kit) {
        unsubscribe = kit.subscribeAccount((state: any) => {
          if (state.isConnected && state.address) {
            setWalletConnected(true);
            setCustomAddress(state.address);
            
            const currWallet = DropimusProtocolAPI.getWallet();
            const hasToken = !!localStorage.getItem('dropimus_jwt_access_token');
            const forceShowSIWE = !currWallet.connected || !hasToken || currWallet.address !== state.address;

            triggerSIWEWithAddress(state.address, isManualConnectingRef.current || forceShowSIWE);
          } else {
            const currWallet = DropimusProtocolAPI.getWallet();
            if (!currWallet.connected) {
              setWalletConnected(false);
            }
          }
        });
      }
    };
    initAppKitSubscription();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const triggerSIWEWithAddress = async (addr: string, isManual = false) => {
    if (isManual) {
      setShowSIWELayout(true);
      setSignatureProgress('requesting');
    }
    setCustomAddress(addr);
    setWalletAuthError(null);

    try {
      const nonceRes = await DropimusAPI.getNonce('base-sepolia', addr);
      if (nonceRes && nonceRes.success && nonceRes.data) {
        const liveNonce = nonceRes.data.nonce;
        const liveIssuedAt = nonceRes.data.issued_at;
        
        const resolvedChain = (nonceRes.data as any).chain || 'base-sepolia';
        setActiveChain(resolvedChain);

        const formattedMsg = `Sign in to Dropimus\n\n` +
          `Address: ${addr}\n` +
          `Chain: ${resolvedChain}\n` +
          `Nonce: ${liveNonce}\n` +
          `Issued At: ${liveIssuedAt}`;

        setSiweNonce(liveNonce);
        setSiweMessage(formattedMsg);
        setSignatureProgress('idle');
        if (isManual) {
          setShowSIWELayout(true);
          showToast("Nonce retrieved successfully. Awaiting identity signature.", "info");
        }
      } else {
        throw new Error("Unable to fetch fresh nonce from server.");
      }
    } catch (e: any) {
      console.warn("SIWE Nonce fetching failed:", e);
      if (isManual) {
        const errMsg = e.message || "Failed to establish secure session with backend. Please try again.";
        setWalletAuthError(errMsg);
        showToast(errMsg, "error");
        setSignatureProgress('idle');
      }
    }
  };

  const triggerSIWESignature = async () => {
    setSignatureProgress('verifying');
    setWalletAuthError(null);
    const addr = customAddress;

    try {
      if (!addr) {
        throw new Error("No connected wallet address found.");
      }

      let signature = '';
      let provider: any = null;

      try {
        const kit = await getAppKit();
        if (kit) {
          provider = kit.getWalletProvider();
        }
      } catch (err) {
        console.warn("Failed to retrieve AppKit provider:", err);
      }

      if (!provider && typeof window !== 'undefined' && (window as any).ethereum) {
        provider = (window as any).ethereum;
      }

      if (provider && provider.request) {
        try {
          signature = await provider.request({
            method: 'personal_sign',
            params: [siweMessage, addr]
          });
        } catch (signErr: any) {
          console.warn("User personal_sign failed:", signErr);
          throw new Error(signErr.message || "Signature request rejected by wallet.");
        }
      } else {
        throw new Error("No active web3 provider found. Please connect your wallet via AppKit.");
      }

      if (!signature) {
        throw new Error("No cryptographic signature. Please review your wallet's prompts and try again.");
      }

      const authRes = await DropimusAPI.authenticateWallet({
        chain: activeChain,
        address: addr,
        nonce: siweNonce,
        message: siweMessage,
        signed_message: signature
      });

      if (authRes && authRes.success && authRes.data) {
        localStorage.setItem('dropimus_jwt_access_token', authRes.data.access_token);
        if (authRes.data.refresh_token) {
          localStorage.setItem('dropimus_jwt_refresh_token', authRes.data.refresh_token);
        }

        const wallet = DropimusProtocolAPI.getWallet();
        wallet.address = addr;
        wallet.connected = true;
        DropimusProtocolAPI.saveWallet(wallet);

        showToast("Sovereign identity successfully anchored to court!", "success");
        setSignatureProgress('success');
        setWalletConnected(true);

        setTimeout(() => {
          onLoginSuccess();
        }, 1200);
      } else {
        throw new Error(authRes.detail || "Authentication rejected by backend.");
      }
    } catch (e: any) {
      console.error("Authentication failed:", e);
      const errMsg = e.message || "Wallet verification failed. Please try again.";
      setWalletAuthError(errMsg);
      showToast(errMsg, "error");
      setSignatureProgress('idle');
    }
  };

  const handleOpenAppKit = async () => {
    isManualConnectingRef.current = true;
    setWalletAuthError(null);
    const kit = await getAppKit();
    if (kit) {
      try {
        kit.open();
      } catch (e) {
        console.warn("AppKit.open failed: ", e);
      }
    } else {
      const errMsg = "Web3 wallet connection is currently unavailable in this sandbox frame. Please use Google authentication or open this app in a new tab.";
      setWalletAuthError(errMsg);
      showToast(errMsg, "error");
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setGoogleAuthError(null);
    try {
      const res = await fetch(`${window.location.origin}/api/auth/google/login`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error("Invalid response from Google OAuth server.");
      }
    } catch (err: any) {
      console.error("Google login initiation error:", err);
      const errMsg = "Google Authentication is currently unavailable. Please try using a wallet or verify your connection.";
      setGoogleAuthError(errMsg);
      showToast(errMsg, "error");
      setIsGoogleLoading(false);
    }
  };

  // Switch to legal-grade Terms and Conditions screen
  if (viewingTerms) {
    return (
      <div className="min-h-screen py-10 px-4" style={{ background: C.canvas }}>
        <TermsPage onBack={() => {
          setViewingTerms(false);
          saveTermsAcceptance(true);
          showToast("Sovereign compliance acknowledged.", "success");
        }} />
      </div>
    );
  }

  return (
    <div
      id="auth-page-container"
      className="relative grid grid-cols-1 lg:grid-cols-12 min-h-screen w-full overflow-hidden"
      style={{
        background: C.canvas,
        color: C.text,
        fontFamily: FONTS.body,
      }}
    >
      {/* LEFT COLUMN: Premium protocol visualization and actual network metrics */}
      <div 
        className="lg:col-span-5 hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-white/[0.04]"
        style={{
          background: 'radial-gradient(ellipse at top left, #0b0b0e 0%, #030303 100%)'
        }}
      >
        {/* Elegant structural vector grid overlay */}
        <svg className="absolute inset-0 w-full h-full text-white/[0.015] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="45" height="45" patternUnits="userSpaceOnUse">
              <path d="M 45 0 L 0 0 0 45" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>

        {/* Ambient moving liquid orbs in left sidebar */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-white/[0.015] blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-white/[0.008] blur-[100px] pointer-events-none" />

        {/* Top Header section */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <img src="/src/assets/images/dlogo.png" alt="Mini Logo" className="w-7 h-7 object-contain rounded-full" />
          </div>
          <div>
            <span className="text-sm font-black tracking-[0.2em] text-white block uppercase" style={{ fontFamily: FONTS.display }}>
              DROPIMUS
            </span>
            <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block">
              Consortium Court v1.2.6
            </span>
          </div>
        </div>

        {/* Center Section: Beautiful Rotating Abstract Consensus graph */}
        <div className="relative z-10 my-auto py-12 flex flex-col items-center">
          <div className="w-64 h-64 relative mb-10 flex items-center justify-center">
            {/* Spinning decorative background ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border border-white/[0.03] rounded-full"
            />
            {/* Dashed outer ring rotating backwards */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 border border-dashed border-white/[0.06] rounded-full"
            />
            
            {/* Symmetrical digital vector nodes cluster */}
            <svg className="w-full h-full absolute" viewBox="0 0 100 100">
              {/* Central Reputation Base Block */}
              <circle cx="50" cy="50" r="7" fill="rgb(255,255,255)" className="opacity-10" />
              <circle cx="50" cy="50" r="4" fill="rgb(255,255,255)" fillOpacity="0.8" />
              <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

              {/* Connecting Concordance Paths */}
              <line x1="50" y1="50" x2="25" y2="30" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="50" y1="50" x2="75" y2="30" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="50" y1="50" x2="30" y2="75" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="50" y1="50" x2="70" y2="75" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2 2" />

              {/* Orbital Nodes (Validators) */}
              <circle cx="25" cy="30" r="3" fill="#FFFFFF" />
              <circle cx="75" cy="30" r="3.2" fill="#E6C15C" />
              <circle cx="30" cy="75" r="2.5" fill="#FFFFFF" className="opacity-40" />
              <circle cx="70" cy="75" r="3" fill="#FFFFFF" />

              {/* Pulsing ring indicator */}
              <motion.circle
                cx="75"
                cy="30"
                r="7"
                fill="none"
                stroke="#E6C15C"
                strokeWidth="0.5"
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.circle
                cx="25"
                cy="30"
                r="6"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="0.5"
                animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
            </svg>

            {/* Float visual branding labels inside the mandala */}
            <div className="absolute text-[8px] font-mono tracking-widest text-zinc-500 bg-zinc-950/80 px-2 py-0.5 border border-white/5 rounded backdrop-blur" style={{ top: '15%', left: '8%' }}>
              WALLET_A
            </div>
            <div className="absolute text-[8px] font-mono tracking-widest text-[#E6C15C] bg-zinc-950/80 px-2 py-0.5 border border-[#E6C15C]/10 rounded backdrop-blur" style={{ top: '15%', right: '5%' }}>
              ACTIVE_ARBITER
            </div>
          </div>

          <div className="text-center max-w-sm">
            <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-[0.25em] font-mono block mb-2 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full inline-block">
              Sovereign Truth Engine
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight mt-2" style={{ fontFamily: FONTS.display }}>
              Anchored Reputational Consensus
            </h2>
            <p className="text-zinc-400 text-xs leading-relaxed mt-3 px-4">
              Secure evaluation consensus wallets. Leverage verified cryptographic models on the Base Sepolia ledger and earn dual rewards.
            </p>
          </div>
        </div>

        {/* Footer section: Ticking consensus activities log */}
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 tracking-wider font-mono mb-2">
            <Terminal size={12} className="text-zinc-500" />
            CONCORDANCE STREAM LIVE
          </div>
          <TickerLogsTerminal />
          <div className="mt-4 text-[9px] text-zinc-600 font-mono tracking-wide">
            © 2026 DROPIMUS LABS • ALL REPUTATIONAL PROTOCOLS SECURED BY CONSENSUS DECAY
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Minimalist glassmorphism authentication card with generous premium padding */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-4 sm:p-8 md:p-12 relative bg-[#040405] min-h-screen">
        
        {/* Ambient drift glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-white/[0.012] blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 px-4 sm:px-0">
          
          <motion.div
            key="login-hub"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            id="auth-panel-wrapper"
            className="relative w-full p-8 sm:p-12 md:p-14 rounded-[36px] text-center border transition-all duration-300"
            style={{
              background: C.card,
              borderColor: C.border,
              boxShadow: '0 50px 100px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.02)',
              backdropFilter: 'blur(30px)',
            }}
          >
            {/* Protocol Identity Header */}
            <div id="auth-logo-section" className="mb-10">
              <div
                id="brand-logo-image-container"
                className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-2xl border border-white/[0.05] shadow-2xl overflow-hidden bg-black/40 hover:scale-[1.03] duration-300 transition-transform cursor-pointer"
                style={{
                  boxShadow: `0 0 45px ${C.blueGlow}`,
                }}
              >
                <img
                  src="/src/assets/images/dlogo.png"
                  alt="Dropimus Logo"
                  className="w-14 h-14 object-contain rounded-full"
                />
              </div>

              <h1
                id="auth-title"
                className="text-2xl font-black tracking-[0.16em] text-white leading-tight mb-2 uppercase"
                style={{ fontFamily: FONTS.display }}
              >
                DROPIMUS COURT
              </h1>
              <p
                id="auth-subtitle"
                className="text-[9px] font-extrabold uppercase tracking-[0.35em] text-zinc-500 mb-6 font-mono"
              >
                Consensus Gate Terminal
              </p>

              <p
                id="auth-intro-desc"
                className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-sm mx-auto"
              >
                Build on-chain reputational value. Authenticate via a verified Web3 wallet or Google proxy session key to access the sovereign consensus court.
              </p>
            </div>

            {/* Primary Web3 Wallet Login Section */}
            <div className="flex flex-col gap-4 text-left">
              
              {/* Action Link Button: Connect Web3 Wallet */}
              <button
                onClick={handleOpenAppKit}
                className="w-full h-14 flex items-center justify-center gap-3 px-6 rounded-xl font-extrabold text-xs tracking-wider uppercase bg-white text-black hover:bg-neutral-200 hover:scale-[1.012] active:scale-[0.988] transition-all duration-200 cursor-pointer text-center disabled:opacity-50 shadow-lg"
                disabled={isGoogleLoading}
                style={{
                  opacity: 1.0,
                }}
              >
                <Key size={14} /> Connect Secure Wallet
              </button>

              {/* Wallet Connection Error handler */}
              {walletAuthError && (
                <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs leading-relaxed font-mono mt-1">
                  <span className="font-extrabold text-red-300 block mb-1">Authentication Error:</span>
                  {walletAuthError}
                </div>
              )}

              {/* Cryptographic SIWE Payload Signature Container */}
              {showSIWELayout && !walletAuthError && (
                <div className="p-4 bg-black/60 rounded-xl border border-white/[0.04] mt-1 animate-fadeIn">
                  {signatureProgress === 'idle' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-500 tracking-wider font-mono uppercase">
                          SIWE SIGNING REQUEST
                        </span>
                        <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-400 font-mono uppercase font-semibold">
                          {activeChain}
                        </span>
                      </div>
                      <div
                        className="p-3 bg-black/80 rounded-lg text-[9px] font-mono text-zinc-400 leading-relaxed max-h-24 overflow-y-auto text-left whitespace-pre-wrap border border-white/[0.02]"
                      >
                        {siweMessage}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={triggerSIWESignature}
                          className="flex-1 h-10 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                        >
                          Sign Consensus Assertion Key
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const k = await getAppKit();
                              if (k) {
                                await k.disconnect();
                              }
                            } catch (e) {
                              console.warn("AppKit disconnect failed:", e);
                            }
                            // Reset local states
                            setShowSIWELayout(false);
                            setWalletConnected(false);
                            setCustomAddress('');
                            DropimusProtocolAPI.disconnectWallet();
                            showToast("Wallet disconnected.", "info");
                          }}
                          className="px-3 h-10 rounded-lg bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 text-red-400 font-bold text-xs hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                          title="Disconnect Wallet"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}

                  {signatureProgress === 'requesting' && (
                    <div className="flex flex-col items-center gap-2 py-3 text-center">
                      <RefreshCw size={16} className="text-white animate-spin" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Awaiting Wallet Signature...
                        </span>
                        <span className="text-[9px] text-zinc-500 block mt-0.5 leading-normal">
                          Confirm the request inside your connected wallet.
                        </span>
                      </div>
                    </div>
                  )}

                  {signatureProgress === 'verifying' && (
                    <div className="flex flex-col items-center gap-2 py-3 text-center">
                      <Cpu size={16} className="text-amber-400 animate-pulse" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Resolving Concordance Proof...
                        </span>
                        <span className="text-[9px] text-zinc-500 block font-mono mt-0.5 leading-normal">
                          Generating session keys on Base
                        </span>
                      </div>
                    </div>
                  )}

                  {signatureProgress === 'success' && (
                    <div className="flex flex-col items-center gap-2 py-2 text-center">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                        <Check size={12} className="text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-400 block">
                          Identity Successfully Anchored
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Alternative real Google sign-in */}
              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-white/[0.06]"></div>
                <span className="flex-shrink mx-4 text-[9px] uppercase font-bold tracking-[0.3em] text-zinc-600 font-mono">OR SECURE RECOVERY</span>
                <div className="flex-grow border-t border-white/[0.06]"></div>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full h-14 flex items-center justify-center gap-3 px-6 rounded-xl font-extrabold text-xs tracking-wider uppercase border border-white/[0.08] text-white hover:bg-white/[0.03] hover:border-white/15 hover:scale-[1.012] active:scale-[0.988] transition-all duration-200 cursor-pointer text-center disabled:opacity-50"
                disabled={isGoogleLoading}
                style={{
                  background: 'rgba(255,255,255,0.01)',
                }}
              >
                {isGoogleLoading ? (
                  <RefreshCw size={14} className="text-zinc-500 animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5 text-zinc-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.24 10.285V13.4h6.86c-.277 1.56-1.602 4.585-6.86 4.585-4.54 0-8.24-3.76-8.24-8.385s3.7-8.385 8.24-8.385c2.58 0 4.307 1.095 5.297 2.045l2.465-2.37C18.435 1.155 15.62 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z" />
                  </svg>
                )}
                {isGoogleLoading ? "Synchronizing OAuth Identity..." : "Continue with Google Network"}
              </button>

              {/* Google Errors */}
              {googleAuthError && (
                <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs leading-relaxed font-mono mt-1">
                  <span className="font-extrabold text-red-300 block mb-1">Google Sign-in Error:</span>
                  {googleAuthError}
                </div>
              )}

            </div>

            {/* Sticky disclaimer policy links */}
            <div className="mt-10 border-t border-white/[0.04] pt-6 text-center">
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                By accessing, you acknowledge compliance with our <br />
                <button
                  onClick={() => setViewingTerms(true)}
                  className="text-white/75 hover:text-white underline underline-offset-4 font-semibold focus:outline-none cursor-pointer mt-1.5 transition-colors"
                >
                  Consensus Concordance Policy & Agreement
                </button>
              </p>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Premium Toast Messages Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl"
              style={{
                background: toast.type === 'error' 
                  ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.85) 0%, rgba(69, 10, 10, 0.95) 100%)' 
                  : toast.type === 'success' 
                    ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.85) 0%, rgba(2, 44, 34, 0.95) 100%)' 
                    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
                borderColor: toast.type === 'error' 
                  ? 'rgba(239, 68, 68, 0.35)' 
                  : toast.type === 'success' 
                    ? 'rgba(52, 211, 153, 0.35)' 
                    : 'rgba(148, 163, 184, 0.35)',
              }}
            >
              <div className="mt-0.5 flex-shrink-0">
                {toast.type === 'error' && <AlertCircle size={16} className="text-red-400" />}
                {toast.type === 'success' && <Check size={16} className="text-emerald-400" />}
                {toast.type === 'info' && <Cpu size={16} className="text-sky-400" />}
              </div>
              <div className="flex-1 text-xs font-semibold text-zinc-100 leading-normal text-left">
                {toast.message}
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer flex-shrink-0 flex items-center justify-center p-0.5 rounded-full hover:bg-white/5"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}

// Sub-component designed strictly for background running intervals
// Resolves structural whole-page re-renders on every tick (rendering bypass)
const TickerLogsTerminal = React.memo(() => {
  const [tickerLogs, setTickerLogs] = useState<string[]>([
    "Wallet consensus synched on block #4,892,109",
    "Proof validated on claim #104: BTC/USDC above threshold",
    "Consensus weight finalized with 142.50M Honor points",
    "SIWE session assigned to validator 0xWozny...5f4",
    "Validation lock engaged on claim #102"
  ]);

  useEffect(() => {
    const messages = [
      "Securing dual-staking assertion pool with 12,500 USDC...",
      "Consensus finality resolved in < 2.3s on Base Sepolia.",
      "Arbitrage resolution: Consensus accuracy threshold matched 87.5%",
      "Consortia signature verified for Wallet #502",
      "Analyzing forensic on-chain metrics stream...",
      "Block #4,892,112 proposed: 489 claims active in verification queue.",
      "Vanguard court lock updated: Current finality grade [A+]",
      "Wallet consensus synched on block #4,892,114",
      "Validator 0xTimCook...fa5 joined concordance pool",
      "Validator 0xCraigF...a12 assigned as arbiter"
    ];

    const interval = setInterval(() => {
      setTickerLogs(prev => {
        const next = [...prev];
        if (next.length > 5) next.shift();
        const randMsg = messages[Math.floor(Math.random() * messages.length)];
        next.push(randMsg);
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/40 border border-white/[0.04] p-3 rounded-xl font-mono text-[9px] text-zinc-500 flex flex-col gap-1.5 h-[105px] overflow-hidden select-none">
      {tickerLogs.map((log, index) => {
        const isBlock = log.includes("block");
        const isJoined = log.includes("joined") || log.includes("assigned");
        return (
          <div key={index} className="flex items-center gap-2 truncate animate-fadeIn">
            <span className={`w-1 h-1 rounded-full ${isBlock ? 'bg-emerald-500' : isJoined ? 'bg-amber-400' : 'bg-zinc-500'}`} />
            <span className={isBlock ? 'text-zinc-300' : isJoined ? 'text-amber-400/90' : 'text-zinc-400'}>
              {log}
            </span>
          </div>
        );
      })}
    </div>
  );
});
TickerLogsTerminal.displayName = 'TickerLogsTerminal';

export default AuthPage;
