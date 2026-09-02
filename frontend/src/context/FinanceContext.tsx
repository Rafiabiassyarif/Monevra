import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Wallet, Budget, Goal } from '../types';
import { useAuth } from './AuthContext';
import { apiRequest } from '../lib/api';

export interface Profile {
  name: string;
  email: string;
  currency: string;
  language?: string;
  phone?: string;
  avatar?: string | null;
  twoFactorEnabled?: boolean;
  notifEmail?: boolean;
  notifPush?: boolean;
  gemini_api_key?: string;
}

interface FinancePayload {
  profile: Profile;
  transactions: Transaction[];
  wallets: Wallet[];
  budgets: Budget[];
  goals: Goal[];
}

interface FinanceContextType {
  transactions: Transaction[];
  wallets: Wallet[];
  budgets: Budget[];
  goals: Goal[];
  profile: Profile;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteAllTransactions: () => Promise<void>;
  addWallet: (wallet: Omit<Wallet, 'id' | 'balance'> & { initialBalance: number }) => Promise<void>;
  updateWallet: (id: string, wallet: Partial<Omit<Wallet, 'id'>>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: string, budget: Omit<Budget, 'id'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, goal: Omit<Goal, 'id'>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  getTotalBalance: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpense: () => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profile, setProfile] = useState<Profile>({ name: '', email: '', currency: 'IDR', language: 'id', phone: '', avatar: null, twoFactorEnabled: false });

  const resetState = () => {
    setTransactions([]);
    setWallets([]);
    setBudgets([]);
    setGoals([]);
    setProfile({ name: '', email: '', currency: 'IDR', language: 'id', phone: '', avatar: null, twoFactorEnabled: false });
  };

  const loadFinance = async () => {
    if (!user) {
      resetState();
      return;
    }
    const userId = user.id || user.uid;
    const data = await apiRequest<FinancePayload>(`/users/${userId}/finance`);
    setProfile(data.profile);
    setTransactions(data.transactions || []);
    setWallets(data.wallets || []);
    setBudgets(data.budgets || []);
    setGoals(data.goals || []);
  };

  useEffect(() => {
    loadFinance().catch(console.error);
  }, [user?.id, user?.uid]);

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(tx),
    });
    await loadFinance();
  };

  const updateTransaction = async (id: string, updatedTx: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedTx),
    });
    await loadFinance();
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    const userId = user.id || user.uid;
    const txToDelete = transactions.find(t => t.id === id);
    await apiRequest(`/users/${userId}/transactions/${id}`, { method: 'DELETE' });

    if (txToDelete) {
      const walletToUpdate = wallets.find(w => w.name === txToDelete.wallet);
      if (walletToUpdate) {
        const delta = txToDelete.status === 'Completed' ? (txToDelete.type === 'income' ? txToDelete.amount : -Number(txToDelete.amount)) : 0;
        await updateWallet(walletToUpdate.id, { balance: walletToUpdate.balance - delta });
      }
    }
    await loadFinance();
  };

  const deleteAllTransactions = async () => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/transactions`, { method: 'DELETE' });
    await loadFinance();
  };

  const addWallet = async (wallet: Omit<Wallet, 'id' | 'balance'> & { initialBalance: number }) => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/wallets`, {
      method: 'POST',
      body: JSON.stringify(wallet),
    });
    await loadFinance();
  };

  const updateWallet = async (id: string, updatedWallet: Partial<Omit<Wallet, 'id'>>) => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/wallets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedWallet),
    });
    await loadFinance();
  };

  const deleteWallet = async (id: string) => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/wallets/${id}`, { method: 'DELETE' });
    await loadFinance();
  };

  const addBudget = async (budget: Omit<Budget, 'id'>) => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/budgets`, {
      method: 'POST',
      body: JSON.stringify(budget),
    });
    await loadFinance();
  };

  const updateBudget = async (id: string, budget: Omit<Budget, 'id'>) => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budget),
    });
    await loadFinance();
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/budgets/${id}`, { method: 'DELETE' });
    await loadFinance();
  };

  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/goals`, {
      method: 'POST',
      body: JSON.stringify(goal),
    });
    await loadFinance();
  };

  const updateGoal = async (id: string, goal: Omit<Goal, 'id'>) => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goal),
    });
    await loadFinance();
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/goals/${id}`, { method: 'DELETE' });
    await loadFinance();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const userId = user.id || user.uid;
    await apiRequest(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    await loadFinance();
  };

  const getTotalBalance = () => wallets.reduce((acc, w) => acc + w.balance, 0);

  const getMonthlyIncome = () => {
    const now = new Date();
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'income' && t.status === 'Completed' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, t) => acc + Number(t.amount), 0);
  };

  const getMonthlyExpense = () => {
    const now = new Date();
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && t.status === 'Completed' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, t) => acc + Number(t.amount), 0);
  };

  return (
    <FinanceContext.Provider value={{
      transactions, wallets, budgets, goals, profile,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      deleteAllTransactions,
      addWallet,
      updateWallet,
      deleteWallet,
      addBudget, updateBudget, deleteBudget,
      addGoal, updateGoal, deleteGoal,
      updateProfile,
      getTotalBalance, getMonthlyIncome, getMonthlyExpense,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
