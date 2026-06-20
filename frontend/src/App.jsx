import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, BarChart3 as BarChartIcon, List, Send, Loader2 } from 'lucide-react';
import './index.css';

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf'];

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Novos estados para o formulário NLP
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar dados iniciais:", error);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();

    const channel = supabase.channel('realtime:public:transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        console.log('Mudança recebida em tempo real!', payload);
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setFeedbackMsg('');

    try {
      const response = await fetch('http://localhost:8000/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com a API Python');
      }

      // Se sucesso, o próprio Supabase Realtime vai atualizar a tela!
      setInputText('');
      setFeedbackMsg('Processado com sucesso!');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setFeedbackMsg('Erro ao processar. Verifique o backend.');
    } finally {
      setIsProcessing(false);
    }
  };

  const chartData = useMemo(() => {
    const categories = {};
    transactions.forEach(tx => {
      const cat = tx.categoria || 'Outros';
      const val = parseFloat(tx.valor) || 0;
      if (!categories[cat]) categories[cat] = 0;
      categories[cat] += val;
    });

    return Object.keys(categories).map(cat => ({
      name: cat,
      value: categories[cat]
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalGasto = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="dashboard-container">
      <header>
        <h1>Wallet App</h1>
        <p>Controle Inteligente baseado em NLP</p>
      </header>

      {/* Nova seção de Entrada de Dados (Frontend) */}
      <div className="card" style={{ gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%', gap: '1rem' }}>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ex: Gastei 45 reais com Uber ontem..."
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--text-main)',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button 
            type="submit" 
            disabled={isProcessing || !inputText.trim()}
            style={{
              padding: '0 2rem',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
              color: 'white',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            {isProcessing ? <><Loader2 className="spinner" size={20} /> Inteligência Artificial...</> : <><Send size={20} /> Enviar</>}
          </button>
        </form>
        {feedbackMsg && <span style={{ position: 'absolute', top: '-20px', right: '2rem', color: '#34d399', fontSize: '0.9rem' }}>{feedbackMsg}</span>}
      </div>

      <div className="card">
        <h2><BarChartIcon size={24} color="#60a5fa" /> Distribuição de Gastos</h2>
        {loading ? (
          <div className="chart-container"><p>Sincronizando com o Supabase...</p></div>
        ) : chartData.length > 0 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '-20px', zIndex: 10, position: 'relative' }}>
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Total</span>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                R$ {totalGasto.toFixed(2)}
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    formatter={(value) => `R$ ${value.toFixed(2)}`}
                    contentStyle={{ borderRadius: '12px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="chart-container"><p>Nenhum dado encontrado.</p></div>
        )}
      </div>

      <div className="card">
        <h2><List size={24} color="#a78bfa" /> Histórico de Transações</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : transactions.length > 0 ? (
          <div className="transaction-list">
            {transactions.map(tx => {
              const dataFormatada = tx.data ? new Date(tx.data).toLocaleDateString('pt-BR') : 'Data não informada';
              return (
                <div key={tx.id} className="transaction-item">
                  <div className="transaction-info">
                    <span className="transaction-desc">{tx.descricao || 'Sem descrição'}</span>
                    <span className="transaction-cat">{tx.categoria || 'Outros'}</span>
                    <span className="transaction-date">{dataFormatada}</span>
                  </div>
                  <div className="transaction-value">
                    -R$ {parseFloat(tx.valor || 0).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>Você ainda não tem despesas registradas.</p>
        )}
      </div>
    </div>
  );
}

export default App;
