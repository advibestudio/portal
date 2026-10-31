import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { AffiliatePartner, ReferralDiscountSettings } from '@/content/types';
import { useStore } from '@/lib/store';
import {
  ADVIBE_REFERRAL_STORAGE_KEY,
  captureReferralFromUrl,
  getActiveAttribution,
  checkDiscountEligibility,
  type StoredAttribution,
  type EligibilityResult,
} from '@/lib/referral';

export interface ApplyCodeResult {
  success: boolean;
  message: string;
  affiliate?: AffiliatePartner;
}

export interface ReferralStoreContextType {
  attribution: StoredAttribution | null;
  claimDiscount: boolean;
  setClaimDiscount: (claim: boolean) => void;
  isAffiliateAttributed: boolean;
  checkEligibility: (params?: {
    email?: string;
    whatsapp?: string;
    offerId?: string;
    price?: number;
  }) => EligibilityResult;
  applyReferralCode: (code: string) => ApplyCodeResult;
  clearReferral: () => void;
  discountPercent: number;
}

const ReferralStoreContext = createContext<ReferralStoreContextType | null>(null);

export function ReferralProvider({ children }: { children: React.ReactNode }) {
  const { content, leads } = useStore();
  const affiliates = content.affiliates;
  const settings = content.referralSettings;

  // Active referral attribution from URL or localStorage
  const [attribution, setAttribution] = useState<StoredAttribution | null>(() => {
    const fromUrl = captureReferralFromUrl(affiliates, settings);
    if (fromUrl) return fromUrl;
    return getActiveAttribution(affiliates, settings?.attributionWindowDays);
  });

  const [claimDiscount, setClaimDiscount] = useState<boolean>(true);

  // Sync with URL or storage updates
  useEffect(() => {
    // 1. Check if URL contains referral code
    const fromUrl = captureReferralFromUrl(affiliates, settings);
    if (fromUrl) {
      setAttribution(fromUrl);
      return;
    }

    // 2. Validate current storage attribution against updated affiliates list
    const current = getActiveAttribution(affiliates, settings?.attributionWindowDays);
    setAttribution(current);
  }, [affiliates, settings]);

  // Listen to cross-tab storage changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADVIBE_REFERRAL_STORAGE_KEY) {
        const updated = getActiveAttribution(affiliates, settings?.attributionWindowDays);
        setAttribution(updated);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [affiliates, settings]);

  /**
   * Applies and validates an affiliate referral code entered by the customer.
   * Only active, approved affiliate partner codes qualify to unlock the 5% discount.
   */
  const applyReferralCode = useCallback(
    (rawCode: string): ApplyCodeResult => {
      const code = (rawCode || '').trim().toUpperCase();
      if (!code) {
        return { success: false, message: 'Please enter a referral code.' };
      }

      const affiliate = (affiliates || []).find((a) => a.code.toUpperCase() === code);

      if (!affiliate) {
        return {
          success: false,
          message: `Referral code "${code}" is not recognized. Please verify the code and try again.`,
        };
      }

      if (!affiliate.approved || affiliate.status !== 'active') {
        return {
          success: false,
          message: `Partner code "${code}" is currently deactivated or expired. The 5% discount is only available via active partner codes.`,
        };
      }

      // Valid active affiliate code: establish attribution
      const newAttribution: StoredAttribution = {
        code: affiliate.code,
        affiliateId: affiliate.id,
        affiliateName: affiliate.name,
        capturedAt: Date.now(),
        sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
        viaAffiliateLink: true, // Captured partner referral attribution
      };

      try {
        localStorage.setItem(ADVIBE_REFERRAL_STORAGE_KEY, JSON.stringify(newAttribution));
      } catch {
        // ignore storage errors
      }

      setAttribution(newAttribution);
      setClaimDiscount(true); // Default to opting in to the exclusive discount

      return {
        success: true,
        message: `Partner code ${affiliate.code} applied! You've unlocked the exclusive 5% discount.`,
        affiliate,
      };
    },
    [affiliates]
  );

  /**
   * Clears referral attribution
   */
  const clearReferral = useCallback(() => {
    try {
      localStorage.removeItem(ADVIBE_REFERRAL_STORAGE_KEY);
    } catch {
      // ignore
    }
    setAttribution(null);
  }, []);

  /**
   * Evaluates discount eligibility against business rules
   */
  const checkEligibility = useCallback(
    (params?: {
      email?: string;
      whatsapp?: string;
      offerId?: string;
      price?: number;
    }): EligibilityResult => {
      return checkDiscountEligibility({
        email: params?.email,
        whatsapp: params?.whatsapp,
        offerId: params?.offerId || 'strategy',
        price: params?.price || 0,
        attribution,
        affiliates,
        settings,
        existingLeads: leads,
      });
    },
    [attribution, affiliates, settings, leads]
  );

  const isAffiliateAttributed = Boolean(attribution && attribution.viaAffiliateLink);
  const discountPercent = settings?.discountPercent || 5;

  const value = useMemo<ReferralStoreContextType>(
    () => ({
      attribution,
      claimDiscount,
      setClaimDiscount,
      isAffiliateAttributed,
      checkEligibility,
      applyReferralCode,
      clearReferral,
      discountPercent,
    }),
    [
      attribution,
      claimDiscount,
      isAffiliateAttributed,
      checkEligibility,
      applyReferralCode,
      clearReferral,
      discountPercent,
    ]
  );

  return <ReferralStoreContext.Provider value={value}>{children}</ReferralStoreContext.Provider>;
}

export function useReferralStore(): ReferralStoreContextType {
  const ctx = useContext(ReferralStoreContext);
  if (!ctx) {
    throw new Error('useReferralStore must be used within a ReferralProvider');
  }
  return ctx;
}
