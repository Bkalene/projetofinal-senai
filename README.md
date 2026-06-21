# Wallet App - Controle Inteligente (NLP) 🚀

🌐 **Acesse o projeto online:** [https://projetofinal-senai-git-main-brisa-kalene-s-projects.vercel.app/](https://projetofinal-senai-git-main-brisa-kalene-s-projects.vercel.app/)

Um aplicativo de gestão financeira inteligente "End-to-End" focado no processamento de linguagem natural (NLP). Desenvolvido a partir da metodologia MSEP (Mão na massa, Stack Completa, End-to-End e Publicação).

O Wallet App permite que você registre seus gastos de forma natural (Ex: *"Gastei 50 reais de Uber hoje"*). A inteligência artificial entende, extrai a categoria, valor e data, salvando tudo no banco de dados e refletindo instantaneamente em um Dashboard moderno e reativo.

---

## 📱 Transforme em App no Celular (PWA-like)

Você pode instalar a Carteira Digital no seu celular para acessá-la rapidamente como um aplicativo nativo:
1. Abra o site no **Google Chrome** pelo seu celular.
2. Toque no ícone de três pontinhos no canto superior direito do navegador.
3. Selecione a opção **"Adicionar à tela inicial"** (Add to Home screen).
4. Confirme. O ícone da Carteira Digital aparecerá junto com os seus outros aplicativos!

---

## ⚙️ Funcionalidades Implementadas

- **Input Natural:** Basta digitar ou falar (se usar o teclado de voz) frases como no dia a dia.
- **Processamento IA:** O Gemini extrai `categoria`, `valor`, `descricao`, `data` e se é "Gasto" ou "Receita" via prompt avançado.
- **Gráficos Dinâmicos:** 
  - Gráfico de Entradas vs Saídas.
  - Distribuição de gastos por categoria.
  - O gráfico de Formas de Pagamento isola as receitas para evitar distorções visuais.
- **Conselheiro Financeiro Diário:** Uma dica diária focada nos seus gastos recentes, alertando sobre desperdícios.
- **Sistema de Metas (Orçamento):** Defina limites de gastos para categorias específicas. Barras de progresso dinâmicas (verde, amarelo, vermelho) avisam quando você está próximo de ultrapassar ou se já estourou o limite.
- **Chatbot Financeiro Interativo:** Um assistente virtual inteligente integrado ao painel. Ele sabe exatamente quanto você gastou, onde e quando, e responde perguntas diretas (ex: *"Quanto eu já gastei com alimentação esse mês?"*).
- **Tempo Real (Supabase):** Ao gravar no Supabase, o banco dispara um evento para o React, que atualiza todos os gráficos sem precisar de refresh de página.
- **Design Responsivo & Premium:** Layout otimizado tanto para Desktop (telas grandes) quanto para Celular, com Glassmorphism, gradientes e uma interface focada na usabilidade (ex: botões vitais sempre visíveis e dimensionados para toque).

---

## ⏰ Infraestrutura de Alta Disponibilidade (Anti-Sleep do Render)

O backend deste projeto está hospedado gratuitamente na plataforma **Render**. No plano gratuito, serviços web "dormem" (ficam inativos) após 15 minutos sem requisições, o que causaria uma demora irritante (cold start) no primeiro uso do dia.

**Como resolvemos isso:**
1. Criamos uma rota dedicada (`GET /tasks/keepalive`) no próprio aplicativo backend (FastAPI).
2. Utilizamos o serviço **UptimeRobot** para fazer um "ping" nessa rota a cada 5 minutos.
3. Como 5 minutos é um intervalo menor do que os 15 minutos exigidos pelo Render para a inatividade, o servidor **nunca dorme**. Ele permanece sempre "quente" (warm) e responde quase instantaneamente quando você manda uma transação via aplicativo.

---

## 🏗️ Arquitetura e Stack Tecnológica

O projeto foi construído separando rigidamente as responsabilidades:

- **Frontend (UI/UX):** React.js (Vite)
  - Estilização premium via CSS (`index.css`)
  - Gráficos renderizados via `recharts`
  - Ícones do `lucide-react`
- **Backend (API & NLP):** Python + FastAPI
  - Servidor ultrarrápido com `uvicorn`
  - Processamento de Linguagem Natural e Integração via **Google Gemini API** (Modelo `gemini-1.5-flash`)
- **Banco de Dados (Persistência & Realtime):** PostgreSQL no **Supabase**
  - Configuração de Row Level Security (RLS)
  - Transmissão de eventos em tempo real via WebSockets (`supabase_realtime`)

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
Crie um arquivo `.env` na raiz do projeto (e/ou nas pastas backend/frontend conforme configurado) com as chaves:
```env
GeminiKey=SUA_CHAVE_GEMINI
VITE_SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA_SUPABASE
SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA_SUPABASE
```

---

*Projeto desenvolvido como trabalho final.*
