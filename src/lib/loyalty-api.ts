import { useQuery } from "@tanstack/react-query";
import { request } from "./catalog";
import { useAuth } from "./auth";
export type AdminLoyaltyWallet = { _id: string; balance: number; lifetimeEarned: number; lifetimeRedeemed: number; referralCode: string; userId?: { _id?: string; name?: string; email?: string; phone?: string } | string };
export type AdminLoyaltySummary = { wallets: number; pointsIssued: number; pointsRedeemed: number; successfulReferrals: number; topWallets: AdminLoyaltyWallet[] };
export type AdminLedger = { _id: string; type: string; points: number; balanceAfter: number; description?: string; createdAt: string; userId?: { _id?: string; name?: string; email?: string } | string };
export const getAdminLoyaltySummary = (token:string|null) => request<AdminLoyaltySummary>("/api/loyalty/admin/summary", {method:"GET"}, {token});
export const getAdminLoyaltyLedger = (token:string|null) => request<AdminLedger[]>("/api/loyalty/admin/ledger?limit=200", {method:"GET"}, {token});
export function useAdminLoyaltySummary(){ const {token}=useAuth(); return useQuery({queryKey:["admin-loyalty","summary"],enabled:Boolean(token),queryFn:async()=> (await getAdminLoyaltySummary(token)).data,staleTime:30_000}); }
export function useAdminLoyaltyLedger(){ const {token}=useAuth(); return useQuery({queryKey:["admin-loyalty","ledger"],enabled:Boolean(token),queryFn:async()=> (await getAdminLoyaltyLedger(token)).data,staleTime:30_000}); }
