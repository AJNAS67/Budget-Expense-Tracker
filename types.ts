
export type Category = 'Housing' | 'Food' | 'Transport' | 'Shopping' | 'Entertainment' | 'Health' | 'Utilities' | 'Other' | 'Income';

export interface Account {
  id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Cash';
  balance: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: Category;
  subCategory: string;
  description: string;
  type: 'expense' | 'income';
  accountId: string;
}

export interface AIInsight {
  title: string;
  description: string;
  type: 'prediction' | 'saving_tip' | 'analysis';
  impact?: 'positive' | 'negative' | 'neutral';
}

export type Timeframe = 'day' | 'month' | 'year';
