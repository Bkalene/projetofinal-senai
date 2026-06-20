# Wallet App - Controle Inteligente (NLP) 🚀

🌐 **Acesse o projeto online:** [https://projetofinal-senai-git-main-brisa-kalene-s-projects.vercel.app/](https://projetofinal-senai-git-main-brisa-kalene-s-projects.vercel.app/)

Um aplicativo de gestão financeira inteligente "End-to-End" focado no processamento de linguagem natural (NLP). Desenvolvido a partir da metodologia MSEP (Mão na massa, Stack Completa, End-to-End e Publicação).

O Wallet App permite que você registre seus gastos de forma natural (Ex: *"Gastei 50 reais de Uber hoje"*). A inteligência artificial entende, extrai a categoria, valor e data, salvando tudo no banco de dados e refletindo instantaneamente em um Dashboard moderno e reativo.

---

## 🏗️ Arquitetura e Stack Tecnológica

O projeto foi construído separando rigidamente as responsabilidades:

- **Frontend (UI/UX):** React.js (Vite)
  - Estilização premium com "Glassmorphism"
  - Gráficos renderizados via `recharts`
  - Ícones do `lucide-react`
- **Backend (API & NLP):** Python + FastAPI
  - Servidor ultrarrápido com `uvicorn`
  - Processamento de Linguagem Natural via **Google Gemini API** (Modelo `gemini-3.5-flash`)
- **Banco de Dados (Persistência & Realtime):** PostgreSQL no **Supabase**
  - Configuração de Row Level Security (RLS)
  - Transmissão de eventos de atualização de dados em tempo real via WebSockets (`supabase_realtime`)

---

## ⚙️ Funcionalidades

- **Input Natural:** Basta digitar frases como você fala no dia a dia.
- **Processamento IA:** O Gemini extrai `categoria`, `valor`, `descricao` e `data` via prompt em JSON.
- **Tempo Real:** Ao gravar no Supabase, o banco dispara um evento para o React, que atualiza o gráfico de barras sem precisar de refresh de página.
- **Gráficos Dinâmicos:** Um gráfico de barras que consolida o gasto por categoria.
- **Histórico Completo:** Lista de todas as transações formatadas em BRL.

---

## 🛠️ Como Rodar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/Bkalene/projetofinal-senai.git
cd projetofinal-senai
```

### 2. Configurar o Backend (Python)
```bash
cd backend
python -m venv venv

# Ativar o ambiente virtual (Windows)
.\venv\Scripts\activate

# Instalar dependências
pip install fastapi uvicorn pydantic google-genai supabase python-dotenv

# Iniciar o servidor
python input_handler.py
```
> O backend iniciará na porta `http://localhost:8000`

### 3. Configurar o Frontend (React)
Abra um novo terminal na pasta raiz do projeto.
```bash
cd frontend
npm install
npm run dev
```
> O frontend iniciará na porta `http://localhost:5173`

### 4. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com as chaves:
```env
GeminiKey=SUA_CHAVE_GEMINI
VITE_SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA_SUPABASE
SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA_SUPABASE
```

---

*Projeto desenvolvido como trabalho final.*
