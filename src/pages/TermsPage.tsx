/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, ChevronLeft, Scale, AlertTriangle, Coins, FileText, CheckCircle } from 'lucide-react';
import { C, FONTS } from '../tokens';
import Btn from '../components/shared/Btn';

interface TermsPageProps {
  onBack: () => void;
}

export function TermsPage({ onBack }: TermsPageProps) {
  return (
    <div
      id="terms-container"
      className="max-w-4xl mx-auto px-6 py-10 md:py-16 animate-fadeIn"
      style={{
        color: C.text,
        fontFamily: FONTS.body,
      }}
    >
      {/* Back button */}
      <div className="mb-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 text-xs text-gray-400 hover:translate-x-[-2px] transition-all duration-200 cursor-pointer text-left font-semibold uppercase tracking-wider"
          style={{ color: C.sub }}
        >
          <ChevronLeft size={16} /> Back to Authentication Gate
        </button>
      </div>

      {/* Header Banner */}
      <div 
        className="p-8 md:p-12 rounded-[28px] border mb-10 text-left"
        style={{
          background: C.card,
          borderColor: C.border,
          boxShadow: '0 24px 50px rgba(0,0,0,0.1)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-5 mb-6">
          <div 
            className="flex items-center justify-center w-14 h-14 rounded-full border shrink-0"
            style={{ background: C.deep, borderColor: C.border }}
          >
            <Scale size={24} style={{ color: C.text }} />
          </div>
          <div>
            <h1 
              className="text-2xl md:text-3xl font-black tracking-tight mb-2"
              style={{ fontFamily: FONTS.display, color: C.text }}
            >
              Terms of Agreement & Consensus Policy
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-mono font-semibold" style={{ color: C.sub }}>
              Last Updated: June 13, 2026 • Dropimus Protocol v1.4
            </p>
          </div>
        </div>

        <p className="text-xs md:text-sm leading-relaxed max-w-2xl" style={{ color: C.sub }}>
          Please review this document thoroughly before interacting with the Dropimus Protocol. By accessing this reputational consensus engine, you explicitly consent to these legally-binding provisions.
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-8 text-left">
        
        {/* SECTION 1: NATURE OF SERVICE */}
        <div 
          className="p-6 md:p-8 rounded-[24px] border"
          style={{ background: C.card, borderColor: C.border, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-start gap-4 mb-4">
            <Shield size={18} className="mt-0.5 shrink-0" style={{ color: C.text }} />
            <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wider font-mono" style={{ color: C.text }}>
              1. Non-Financial Nature of Reputational Voting
            </h3>
          </div>
          <div className="text-xs md:text-[13px] space-y-3.5 leading-relaxed pl-8" style={{ color: C.sub }}>
            <p>
              Dropimus operates strictly as an on-chain <strong className="font-medium" style={{ color: C.text }}>Reputational Consensus Engine</strong>. It does NOT constitute an exchange, investment advisor, broker, or financial marketplace. 
            </p>
            <p>
              The "Honor" points and standard "USDC" staked on consensus outcomes are deployed on-chain to measure predictive accuracy, filter spam, and ensure skin-in-the-game for consensus resolution. These outcomes represent crowdsourced confidence indexing and should <strong className="text-yellow-400 font-semibold">never be construed as financial advice, investment evaluation, or speculative gaming</strong>.
            </p>
          </div>
        </div>

        {/* SECTION 2: NO WARRANTIES & ACCURACY */}
        <div 
          className="p-6 md:p-8 rounded-[24px] border"
          style={{ background: C.card, borderColor: C.border, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-start gap-4 mb-4">
            <AlertTriangle size={18} className="text-[#FFC107] mt-0.5 shrink-0" />
            <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wider font-mono" style={{ color: C.text }}>
              2. Absolute Disclaimer of Warranties
            </h3>
          </div>
          <div className="text-xs md:text-[13px] space-y-3.5 leading-relaxed pl-8" style={{ color: C.sub }}>
            <p>
              The protocol and its associated web applet are provided <strong className="font-medium" style={{ color: C.text }}>"AS IS" and "AS AVAILABLE"</strong> without any warranty of any kind, express or implied.
            </p>
            <p>
              Dropimus makes no claims, warranties, or guarantees regarding the uptime, correctness, or final resolution parameters of any crowdsourced claims. The resolution values are determined algorithmically, either via third-party Decentralized Oracles or consensus-weighted participant responses. You accept that resolution decisions are final, unappealable, and binding on all cryptographic keys.
            </p>
          </div>
        </div>

        {/* SECTION 3: LIQUID COLLATERAL RISKS */}
        <div 
          className="p-6 md:p-8 rounded-[24px] border"
          style={{ background: C.card, borderColor: C.border, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-start gap-4 mb-4">
            <Coins size={18} className="mt-0.5 shrink-0" style={{ color: C.text }} />
            <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wider font-mono" style={{ color: C.text }}>
              3. Collision Staking & Reputation Loss Risks
            </h3>
          </div>
          <div className="text-xs md:text-[13px] text-gray-400 space-y-3.5 leading-relaxed pl-8">
            <p>
              Upon submitting a "Consensus Call" or anchoring a consensus parameter, collateral (including but not limited to USDC deposits or Honor points) is allocated dynamically to secondary smart contracts.
            </p>
            <p>
              If your chosen side (e.g. Proven or Faded) aligns against the ultimately resolved consensus state, <strong className="text-red-400 font-semibold">you will lose your staked reputation points and USDC collateral completely</strong>. The protocol operates strictly on trustless, mathematically-programmed equations; absolutely no refunds, reversions, or user mitigations can be issued under any circumstances.
            </p>
          </div>
        </div>

        {/* SECTION 4: LOCAL REGULATIONS */}
        <div 
          className="p-6 md:p-8 rounded-[24px] border"
          style={{ background: C.card, borderColor: C.border, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-start gap-4 mb-4">
            <FileText size={18} className="mt-0.5 shrink-0" style={{ color: C.text }} />
            <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wider font-mono" style={{ color: C.text }}>
              4. Regional Jurisdiction & RESTRICTED COUNTRIES
            </h3>
          </div>
          <div className="text-xs md:text-[13px] space-y-3.5 leading-relaxed pl-8" style={{ color: C.sub }}>
            <p>
              Users are solely responsible for compliance with local regulations. Access to voting features may be geo-restricted or legally forbidden in certain jurisdictions (including but not limited to the United States of America, sanctioned OFAC regions, and specific EU territories).
            </p>
            <p>
              You warrant that you are not a citizen or resident of any forbidden territory and are accessing this network entirely at your own risk.
            </p>
          </div>
        </div>

        {/* SECTION 5: LIMITATION OF LIABILITY */}
        <div 
          className="p-6 md:p-8 rounded-[24px] border"
          style={{ background: C.card, borderColor: C.border, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-start gap-4 mb-4">
            <CheckCircle size={18} className="mt-0.5 shrink-0" style={{ color: C.text }} />
            <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wider font-mono" style={{ color: C.text }}>
              5. Limitation of Liability & Indemnity
            </h3>
          </div>
          <div className="text-xs md:text-[13px] space-y-3.5 leading-relaxed pl-8" style={{ color: C.sub }}>
            <p>
              In no event shall Dropimus, its core operators, contractors, or builders be held liable for any direct, indirect, incidental, special, exemplary, punitive, or consequential damages (including loss of wallet custody, system hacks, oracle errors, smart contract vulnerabilities, or capital liquidation).
            </p>
            <p>
              You agree to fully defend, indemnify, and hold harmless all contributors and developers from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your interaction with the consensus court.
            </p>
          </div>
        </div>

      </div>

      {/* Accept and close button */}
      <div className="mt-14 mb-10 text-center">
        <Btn
          variant="primary"
          onClick={onBack}
          style={{ 
            padding: '16px 44px', 
            fontSize: '13px', 
            minWidth: '220px',
            borderRadius: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 800
          }}
        >
          Dismiss & Accept
        </Btn>
      </div>
    </div>
  );
}

export default TermsPage;
