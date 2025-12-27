
import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Transaction, AIInsight, Category, Account, Timeframe } from './types';
import { analyzeSpending } from './geminiService';
import { COLORS, Icons } from './constants';

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc1', name: 'Main Checking', type: 'Checking', balance: 5240 },
  { id: 'acc2', name: 'Emergency Fund', type: 'Savings', balance: 12000 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2023-10-01', amount: 1200, category: 'Housing', subCategory: 'Rent', description: 'Rent Payment', type: 'expense', accountId: 'acc1' },
  { id: '2', date: '2023-10-02', amount: 45, category: 'Food', subCategory: 'Groceries', description: 'Grocery Store', type: 'expense', accountId: 'acc1' },
  { id: '3', date: '2023-10-03', amount: 30, category: 'Transport', subCategory: 'Ride Share', description: 'Uber Ride', type: 'expense', accountId: 'acc1' },
  { id: '4', date: '2023-10-04', amount: 120, category: 'Entertainment', subCategory: 'Music', description: 'Concert Ticket', type: 'expense', accountId: 'acc1' },
  { id: '5', date: '2023-10-05', amount: 3500, category: 'Income', subCategory: 'Salary', description: 'Monthly Salary', type: 'income', accountId: 'acc1' },
  { id: '6', date: '2023-10-06', amount: 65, category: 'Food', subCategory: 'Dining Out', description: 'Dinner Out', type: 'expense', accountId: 'acc1' },
  { id: '7', date: '2023-10-07', amount: 80, category: 'Shopping', subCategory: 'Apparel', description: 'New Shoes', type: 'expense', accountId: 'acc1' },
];

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [timeframe, setTimeframe] = useState<Timeframe>('month');
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [prediction, setPrediction] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ai' | 'accounts'>('dashboard');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);

  // New Transaction Form State
  const [newTx, setNewTx] = useState({
    amount: '',
    description: '',
    category: 'Food' as Category,
    subCategory: '',
    type: 'expense' as 'expense' | 'income',
    accountId: INITIAL_ACCOUNTS[0].id,
    date: new Date().toISOString().split('T')[0]
  });

  // New Account Form State
  const [newAcc, setNewAcc] = useState({
    name: '',
    type: 'Checking' as Account['type'],
    balance: ''
  });

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      // Ensure we compare local dates correctly
      const localNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const localD = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (timeframe === 'day') return localD.getTime() === localNow.getTime();
      if (timeframe === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (timeframe === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [transactions, timeframe]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = accounts.reduce((acc, a) => acc + a.balance, 0);
    return { income, expenses, balance, savingsRate: income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0 };
  }, [filteredTransactions, accounts]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const runAIAnalysis = async () => {
    setIsLoadingAI(true);
    const { insights: aiInsights, predictions } = await analyzeSpending(filteredTransactions);
    setInsights(aiInsights);
    setPrediction(predictions);
    setIsLoadingAI(false);
  };

  useEffect(() => {
    runAIAnalysis();
  }, [timeframe, transactions]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: newTx.date,
      amount: parseFloat(newTx.amount),
      category: newTx.category,
      subCategory: newTx.subCategory,
      description: newTx.description,
      type: newTx.type,
      accountId: newTx.accountId
    };

    setTransactions([transaction, ...transactions]);
    setAccounts(accounts.map(acc => {
      if (acc.id === transaction.accountId) {
        return { ...acc, balance: acc.balance + (transaction.type === 'income' ? transaction.amount : -transaction.amount) };
      }
      return acc;
    }));
    setShowAddModal(false);
    setNewTx({ 
      amount: '', 
      description: '', 
      category: 'Food', 
      subCategory: '', 
      type: 'expense', 
      accountId: accounts[0].id,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const account: Account = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAcc.name,
      type: newAcc.type,
      balance: parseFloat(newAcc.balance) || 0
    };
    setAccounts([...accounts, account]);
    setShowAccountModal(false);
    setNewAcc({ name: '', type: 'Checking', balance: '' });
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-64 flex flex-col bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 h-16 flex items-center justify-around md:top-0 md:h-screen md:w-64 md:flex-col md:justify-start md:border-r md:border-t-0 p-4 shadow-sm">
        <div className="hidden md:flex items-center gap-2 mb-10 w-full px-4 pt-4">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
            <Icons.Wallet />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">FinnAI</h1>
        </div>

        <div className="flex w-full md:flex-col gap-1">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <Icons.TrendingUp /> <span className="nav-text">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('transactions')} className={`nav-btn ${activeTab === 'transactions' ? 'active' : ''}`}>
            <Icons.Wallet /> <span className="nav-text">Activity</span>
          </button>
          <button onClick={() => setActiveTab('accounts')} className={`nav-btn ${activeTab === 'accounts' ? 'active' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            <span className="nav-text">Accounts</span>
          </button>
          <button onClick={() => setActiveTab('ai')} className={`nav-btn ${activeTab === 'ai' ? 'active' : ''}`}>
            <Icons.Sparkles /> <span className="nav-text">AI Coach</span>
          </button>
        </div>

        <div className="hidden md:block mt-auto w-full px-2">
          <div className="bg-slate-900 rounded-3xl p-5 text-white overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 p-2 opacity-10"><Icons.Sparkles /></div>
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Net Worth</p>
            <h2 className="text-2xl font-bold">${stats.balance.toLocaleString()}</h2>
            <div className="mt-4 flex gap-2">
               <button onClick={() => setShowAccountModal(true)} className="text-[10px] bg-white/10 hover:bg-white/20 py-1.5 px-3 rounded-lg font-bold transition-colors">Manage Accounts</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Top Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {activeTab === 'dashboard' && 'Financial Hub'}
              {activeTab === 'transactions' && 'Ledger History'}
              {activeTab === 'accounts' && 'Your Vaults'}
              {activeTab === 'ai' && 'AI Intelligence'}
            </h2>
            <p className="text-slate-500 font-medium">Monitoring your financial landscape.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-1 flex">
              {(['day', 'month', 'year'] as Timeframe[]).map(tf => (
                <button 
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${timeframe === tf ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Icons.Plus /> <span>Entry</span>
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat-card bg-indigo-600 text-white">
                <p className="text-indigo-200 text-xs font-bold uppercase mb-1">Total Balance</p>
                <h3 className="text-3xl font-black">${stats.balance.toLocaleString()}</h3>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-indigo-100">
                  <span className="bg-indigo-500 px-2 py-0.5 rounded-full">ALL ACCOUNTS</span>
                </div>
              </div>
              <div className="stat-card">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Income ({timeframe})</p>
                <h3 className="text-3xl font-black text-emerald-500">${stats.income.toLocaleString()}</h3>
                <div className="mt-4 text-[10px] text-slate-400 font-bold">MONITORED GAINS</div>
              </div>
              <div className="stat-card">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Expenses ({timeframe})</p>
                <h3 className="text-3xl font-black text-rose-500">${stats.expenses.toLocaleString()}</h3>
                <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (stats.expenses / (stats.income || 1) * 100))}%` }}></div>
                </div>
              </div>
              <div className="stat-card">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Savings Rate</p>
                <h3 className="text-3xl font-black text-indigo-600">{stats.savingsRate}%</h3>
                <div className="mt-4 text-[10px] font-bold text-slate-400">OF TOTAL REVENUE</div>
              </div>
            </div>

            {/* Main Visuals Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-[450px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-lg">Expense Distribution</h3>
                  <div className="flex gap-2 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Budget</span>
                  </div>
                </div>
                <div className="h-full pb-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name as Category] || COLORS.Other} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200 h-1/2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 text-indigo-500 opacity-20 transform translate-x-4 -translate-y-4 scale-150"><Icons.Sparkles /></div>
                  <h4 className="font-bold flex items-center gap-2 mb-4"><Icons.Sparkles /> AI Analysis</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {prediction || "Calculating your trajectory..."}
                  </p>
                  <button onClick={() => setActiveTab('ai')} className="mt-auto bg-white/10 hover:bg-white/20 transition-all text-xs font-bold py-2.5 px-5 rounded-xl border border-white/10 backdrop-blur-sm">View Full Audit</button>
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 h-1/2">
                   <h4 className="font-bold mb-4">Top Leakages</h4>
                   <div className="space-y-4">
                      {[...categoryData].sort((a,b) => b.value - a.value).slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: COLORS[item.name as Category] || COLORS.Other }}>
                              {item.name[0]}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{item.name}</p>
                              <p className="text-[10px] text-slate-400">{(item.value / (stats.expenses || 1) * 100).toFixed(0)}% of expenses</p>
                            </div>
                          </div>
                          <span className="text-sm font-black">${item.value.toLocaleString()}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
             <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-black text-lg">Transaction Stream</h3>
                <input type="text" placeholder="Search entries..." className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-64" />
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Categorization</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Amount</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/30 transition-colors group">
                           <td className="px-8 py-5">
                              <p className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">{t.description}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Account ID: {t.accountId}</p>
                           </td>
                           <td className="px-8 py-5">
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter" style={{ backgroundColor: `${COLORS[t.category as Category] || COLORS.Other}10`, color: COLORS[t.category as Category] || COLORS.Other }}>
                                  {t.category}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-1 italic">{t.subCategory}</span>
                              </div>
                           </td>
                           <td className="px-8 py-5 text-xs font-bold text-slate-500">{t.date}</td>
                           <td className={`px-8 py-5 text-right font-black text-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-900'}`}>
                             {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-64 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-110 transition-transform"><Icons.Wallet /></div>
                <div className="flex justify-between items-start mb-auto">
                  <div>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{acc.type}</span>
                    <h4 className="text-xl font-black mt-2">{acc.name}</h4>
                  </div>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Available Funds</p>
                   <h3 className="text-3xl font-black">${acc.balance.toLocaleString()}</h3>
                </div>
              </div>
            ))}
            <button 
              onClick={() => setShowAccountModal(true)}
              className="border-2 border-dashed border-slate-200 p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:bg-white"
            >
              <div className="bg-slate-50 p-4 rounded-full group-hover:bg-indigo-50"><Icons.Plus /></div>
              <span className="font-bold text-sm">Add New Account</span>
            </button>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
             <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 max-w-2xl">
                   <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                     <Icons.Sparkles /> AI Auditor Active
                   </div>
                   <h2 className="text-4xl font-black mb-4 leading-tight">Your Financial Intelligence Hub</h2>
                   <p className="text-indigo-100 text-lg leading-relaxed mb-8">
                     Analyzing {filteredTransactions.length} events in your history to build an optimized wealth path.
                   </p>
                   <div className="flex gap-4">
                      <button onClick={runAIAnalysis} disabled={isLoadingAI} className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all">
                        {isLoadingAI ? 'Crunching Numbers...' : 'Rerun Intelligence'}
                      </button>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {insights.map((insight, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all hover:-translate-y-1">
                     <div className="flex items-center justify-between mb-6">
                        <div className={`p-3 rounded-2xl ${insight.impact === 'positive' ? 'bg-emerald-50 text-emerald-600' : insight.impact === 'negative' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                           {insight.type === 'saving_tip' ? <Icons.Sparkles /> : <Icons.TrendingUp />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{insight.type.replace('_', ' ')}</span>
                     </div>
                     <h4 className="text-lg font-black mb-3">{insight.title}</h4>
                     <p className="text-slate-500 text-sm leading-relaxed">{insight.description}</p>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-200">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black">Record Entry</h3>
               <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900"><Icons.Plus className="rotate-45" /></button>
             </div>
             <form onSubmit={handleAddTransaction} className="space-y-5">
                <div className="flex gap-2">
                   <button type="button" onClick={() => setNewTx({...newTx, type: 'expense'})} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${newTx.type === 'expense' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>EXPENSE</button>
                   <button type="button" onClick={() => setNewTx({...newTx, type: 'income'})} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${newTx.type === 'income' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>INCOME</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Date</label>
                    <input required type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Amount</label>
                    <input required type="number" step="0.01" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" />
                  </div>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Description</label>
                   <input required type="text" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="What was this for?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Category</label>
                    <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value as Category})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      {['Housing', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Utilities', 'Other', 'Income'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Sub-Category</label>
                    <input type="text" value={newTx.subCategory} onChange={e => setNewTx({...newTx, subCategory: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Optional" />
                  </div>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Account</label>
                   <select value={newTx.accountId} onChange={e => setNewTx({...newTx, accountId: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                     {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                   </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all shadow-indigo-100">CONFIRM ENTRY</button>
             </form>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black">Open New Vault</h3>
               <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-slate-900"><Icons.Plus className="rotate-45" /></button>
             </div>
             <form onSubmit={handleAddAccount} className="space-y-5">
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Account Name</label>
                   <input required type="text" value={newAcc.name} onChange={e => setNewAcc({...newAcc, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Travel Fund" />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Type</label>
                   <select value={newAcc.type} onChange={e => setNewAcc({...newAcc, type: e.target.value as Account['type']})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                     {['Checking', 'Savings', 'Credit Card', 'Cash'].map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Initial Balance</label>
                   <input required type="number" step="0.01" value={newAcc.balance} onChange={e => setNewAcc({...newAcc, balance: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all shadow-indigo-100">INITIALIZE ACCOUNT</button>
             </form>
          </div>
        </div>
      )}

      <style>{`
        .nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 1.25rem;
          transition: all 0.2s;
          width: 100%;
          color: #64748b;
        }
        @media (min-width: 768px) {
          .nav-btn {
            flex-direction: row;
            gap: 1rem;
          }
        }
        .nav-btn:hover {
          background-color: #f8fafc;
          color: #4f46e5;
        }
        .nav-btn.active {
          background-color: #eef2ff;
          color: #4f46e5;
          font-weight: 800;
        }
        .nav-text {
          font-size: 10px;
          font-weight: 700;
        }
        @media (min-width: 768px) {
          .nav-text {
            font-size: 14px;
          }
        }
        .stat-card {
          padding: 2rem;
          border-radius: 2.5rem;
          background-color: white;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </div>
  );
};

export default App;
