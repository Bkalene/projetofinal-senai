import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, BarChart3 as BarChartIcon, List, Send, Loader2, ChevronLeft, ChevronRight, Edit2, Trash2, X, TrendingUp, Mic, MicOff, CreditCard } from 'lucide-react';
import './index.css';

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf'];

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta gravação de voz.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      sendTextToBackend(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Erro no reconhecimento:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const [currentDate, setCurrentDate] = useState(new Date());

  const [editingTx, setEditingTx] = useState(null);
  const [editForm, setEditForm] = useState({ descricao: '', categoria: '', valor: '', data: '' });

  const fetchTransactions = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('data', startOfMonth.toISOString())
      .lte('data', endOfMonth.toISOString())
      .order('data', { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar dados iniciais:", error);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [currentDate]);

  useEffect(() => {
    const channel = supabase.channel('realtime:public:transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, [currentDate]);

  const sendTextToBackend = async (textToProcess) => {
    if (!textToProcess.trim()) return;

    setIsProcessing(true);
    setFeedbackMsg('');

    try {
      const response = await fetch('https://projetofinal-senai.onrender.com/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToProcess })
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com a API Python');
      }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    sendTextToBackend(inputText);
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;
    try {
      await supabase.from('transactions').delete().eq('id', id);
    } catch (err) {
      console.error('Erro ao excluir', err);
    }
  };

  const openEditModal = (tx) => {
    setEditingTx(tx);
    const dateStr = tx.data ? new Date(tx.data).toISOString().split('T')[0] : '';
    setEditForm({
      descricao: tx.descricao || '',
      categoria: tx.categoria || '',
      valor: tx.valor || '',
      data: dateStr
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      let dt = editForm.data ? new Date(editForm.data) : new Date();
      await supabase.from('transactions').update({
        descricao: editForm.descricao,
        categoria: editForm.categoria,
        valor: parseFloat(editForm.valor),
        data: dt.toISOString()
      }).eq('id', editingTx.id);
      setEditingTx(null);
    } catch (err) {
      console.error('Erro ao atualizar', err);
    }
  };

  const chartDataBar = useMemo(() => {
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

  const chartDataLine = useMemo(() => {
    const days = {};
    transactions.forEach(tx => {
      const dateObj = new Date(tx.data);
      const dayStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      const val = parseFloat(tx.valor) || 0;
      if (!days[dayStr]) days[dayStr] = 0;
      days[dayStr] += val;
    });

    const sortedDates = Object.keys(days).sort((a,b) => {
        const [da, ma] = a.split('/').map(Number);
        const [db, mb] = b.split('/').map(Number);
        if (ma !== mb) return ma - mb;
        return da - db;
    });

    let cumulative = 0;
    return sortedDates.map(dayStr => {
      cumulative += days[dayStr];
      return {
        day: dayStr,
        daily: days[dayStr],
        total: cumulative
      };
    });
  }, [transactions]);

  const chartDataPayment = useMemo(() => {
    const payments = {};
    transactions.forEach(tx => {
      let pay = tx.forma_pagamento;
      
      // Fallback inteligente: Se a coluna forma_pagamento não existir no Supabase 
      // ou for nula, tentamos adivinhar pela descrição.
      if (!pay) {
        const desc = (tx.descricao || '').toLowerCase();
        if (desc.includes('pix')) pay = 'pix';
        else if (desc.includes('crédito') || desc.includes('credito')) pay = 'credito';
        else if (desc.includes('débito') || desc.includes('debito')) pay = 'debito';
        else if (desc.includes('dinheiro') || desc.includes('espécie')) pay = 'dinheiro';
        else pay = 'Outros';
      }

      // Capitalize first letter for better UI
      pay = pay.charAt(0).toUpperCase() + pay.slice(1);
      
      const val = parseFloat(tx.valor) || 0;
      if (!payments[pay]) payments[pay] = 0;
      payments[pay] += val;
    });

    return Object.keys(payments).map(pay => ({
      name: pay,
      value: payments[pay]
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalGasto = chartDataBar.reduce((acc, curr) => acc + curr.value, 0);
  const maiorCategoria = chartDataBar.length > 0 ? chartDataBar[0].name : 'N/A';
  const maiorGasto = chartDataBar.length > 0 ? chartDataBar[0].value : 0;

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const currentMonthName = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <div className="dashboard-container">
      {editingTx && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button aria-label="Fechar modal" className="close-btn" onClick={() => setEditingTx(null)}><X size={24} /></button>
            <h2>Editar Transação</h2>
            <form onSubmit={handleUpdate} className="edit-form">
              <div className="form-group">
                <label>Descrição</label>
                <input type="text" name="descricao" autoComplete="off" value={editForm.descricao} onChange={e => setEditForm({...editForm, descricao: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <input type="text" name="categoria" autoComplete="off" value={editForm.categoria} onChange={e => setEditForm({...editForm, categoria: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input type="number" name="valor" step="0.01" value={editForm.valor} onChange={e => setEditForm({...editForm, valor: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Data</label>
                <input type="date" name="data" value={editForm.data} onChange={e => setEditForm({...editForm, data: e.target.value})} required />
              </div>
              <button type="submit" className="save-btn">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      <header>
        <h1>Wallet App</h1>
        <p>Controle Inteligente baseado em NLP</p>
      </header>

      <div className="month-selector">
        <button aria-label="Mês anterior" onClick={handlePrevMonth}><ChevronLeft size={24} /></button>
        <h2>{currentMonthName}</h2>
        <button aria-label="Próximo mês" onClick={handleNextMonth}><ChevronRight size={24} /></button>
      </div>

      <div className="card full-width">
        <form onSubmit={handleSubmit} className="nlp-form">
          <input 
            type="text" 
            name="nlp_input"
            autoComplete="off"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ex: Gastei 45 reais com Uber ontem…"
            disabled={isProcessing}
            className="nlp-input"
          />
          <button 
            type="button"
            aria-label="Ditar por voz"
            onClick={startListening}
            disabled={isProcessing || isListening}
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            title="Ditar por voz"
          >
            {isListening ? <Mic className="spinner" size={20} /> : <Mic size={20} />}
          </button>
          <button 
            type="submit" 
            disabled={isProcessing || (!inputText.trim() && !isListening)}
            className="nlp-btn"
          >
            {isProcessing ? <><Loader2 className="spinner" size={20} /> …</> : <><Send size={20} /> Enviar</>}
          </button>
        </form>
        {feedbackMsg && <span className="feedback-msg">{feedbackMsg}</span>}
      </div>

      <div className="summary-cards full-width">
         <div className="summary-card">
           <span className="summary-label">Total Gasto ({currentMonthName})</span>
           <span className="summary-value">R$ {totalGasto.toFixed(2)}</span>
         </div>
         <div className="summary-card">
           <span className="summary-label">Maior Gasto do Mês</span>
           <span className="summary-value">{maiorCategoria} (R$ {maiorGasto.toFixed(2)})</span>
         </div>
      </div>

      <div className="card">
        <h2><BarChartIcon size={24} color="#60a5fa" /> Distribuição de Gastos</h2>
        {loading ? (
          <div className="chart-container"><p>Carregando…</p></div>
        ) : chartDataBar.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataBar} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  formatter={(value) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ borderRadius: '12px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartDataBar.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-container"><p>Nenhum dado encontrado.</p></div>
        )}
      </div>

      <div className="card">
        <h2><TrendingUp size={24} color="#34d399" /> Evolução no Mês</h2>
        {loading ? (
          <div className="chart-container"><p>Carregando…</p></div>
        ) : chartDataLine.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartDataLine} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  formatter={(value, name) => [`R$ ${value.toFixed(2)}`, name === 'total' ? 'Acumulado' : 'Diário']}
                  contentStyle={{ borderRadius: '12px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line type="monotone" dataKey="total" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="daily" stroke="#60a5fa" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-container"><p>Nenhum dado encontrado.</p></div>
        )}
      </div>

      <div className="card">
        <h2><CreditCard size={24} color="#fbbf24" /> Métodos de Pagamento</h2>
        {loading ? (
          <div className="chart-container"><p>Carregando…</p></div>
        ) : chartDataPayment.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataPayment} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  formatter={(value) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ borderRadius: '12px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartDataPayment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-container"><p>Nenhum dado encontrado.</p></div>
        )}
      </div>

      <div className="card">
        <h2><List size={24} color="#a78bfa" /> Histórico de Transações</h2>
        {loading ? (
          <p>Carregando…</p>
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
                  <div className="transaction-actions-wrapper">
                    <div className="transaction-value">
                      -R$ {parseFloat(tx.valor || 0).toFixed(2)}
                    </div>
                    <div className="transaction-actions">
                      <button aria-label="Editar transação" className="action-btn edit" onClick={() => openEditModal(tx)}><Edit2 size={18} /></button>
                      <button aria-label="Excluir transação" className="action-btn delete" onClick={() => handleDelete(tx.id)}><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>Você ainda não tem despesas registradas neste mês.</p>
        )}
      </div>
    </div>
  );
}

export default App;
