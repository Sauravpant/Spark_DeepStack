import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getTransactions,
  getTransaction,
  createTransaction,
  getCreditSales,
  updateCreditSale,
} from "@/services/transaction.service";
import { queryClient } from "@/lib/queryClient";
import type {
  CreateTransactionPayload,
  UpdateCreditSalePayload,
  CreditStatus,
} from "@/types";

export function useTransactions(shopId: string) {
  return useQuery({
    queryKey: ["transactions", shopId],
    queryFn: () => getTransactions(shopId),
    enabled: !!shopId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
  });
}

export function useTransaction(shopId: string, transactionId: string) {
  return useQuery({
    queryKey: ["transactions", shopId, transactionId],
    queryFn: () => getTransaction(shopId, transactionId),
    enabled: !!shopId && !!transactionId,
  });
}

export function useCreateTransaction(shopId: string) {
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) =>
      createTransaction(shopId, payload),
    onSuccess: (newTx) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", shopId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", shopId] });
      void queryClient.refetchQueries({ queryKey: ["transactions", shopId] });
      void queryClient.refetchQueries({ queryKey: ["dashboard", shopId] });
      // Credit transactions affect customer balance
      if (newTx.customer_id) {
        queryClient.invalidateQueries({ queryKey: ["customers", shopId] });
        queryClient.invalidateQueries({ queryKey: ["credit-sales", shopId] });
        void queryClient.refetchQueries({ queryKey: ["customers", shopId] });
        void queryClient.refetchQueries({ queryKey: ["credit-sales", shopId] });
      }
      // Transactions deduct product stock
      queryClient.invalidateQueries({ queryKey: ["products", shopId] });
      void queryClient.refetchQueries({ queryKey: ["products", shopId] });
      toast.success("Transaction recorded!");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to record transaction",
      );
    },
  });
}

export function useCreditSales(shopId: string, status?: CreditStatus) {
  return useQuery({
    queryKey: ["credit-sales", shopId, status],
    queryFn: () => getCreditSales(shopId, status),
    enabled: !!shopId,
  });
}

export function useUpdateCreditSale(shopId: string) {
  return useMutation({
    mutationFn: ({
      creditSaleId,
      payload,
    }: {
      creditSaleId: string;
      payload: UpdateCreditSalePayload;
    }) => updateCreditSale(shopId, creditSaleId, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["credit-sales", shopId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", shopId] });
      void queryClient.refetchQueries({ queryKey: ["credit-sales", shopId] });
      void queryClient.refetchQueries({ queryKey: ["transactions", shopId] });
      // Paying off credit changes customer balance
      queryClient.invalidateQueries({ queryKey: ["customers", shopId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", shopId] });
      void queryClient.refetchQueries({ queryKey: ["customers", shopId] });
      void queryClient.refetchQueries({ queryKey: ["dashboard", shopId] });
      toast.success(
        updated.status === "paid" ?
          "Payment recorded! Balance updated."
        : "Credit sale updated",
      );
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update credit sale",
      );
    },
  });
}
