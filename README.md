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

## 🗄️ Configurando o Supabase (Banco de Dados)

O aplicativo precisa de um banco de dados no Supabase para salvar as transações e enviá-las em tempo real para a tela.

1. Crie uma conta e um novo projeto no [Supabase](https://supabase.com).
2. Acesse o **SQL Editor** no painel do seu projeto e execute o seguinte comando para criar a tabela:
```sql
create table transactions (
  id uuid default gen_random_uuid() primary key,
  descricao text,
  valor numeric,
  categoria text,
  data timestamp with time zone default now()
);
```
3. **Habilitar Tempo Real (Realtime):** Vá no menu lateral em `Database` > `Replication` (ou `Realtime` dependendo da versão do painel) e ative a replicação para a tabela `transactions`. Isso faz a tela atualizar sozinha.
4. Vá em `Project Settings` > `API` para copiar a `URL` e a `anon public key` para colocar no seu arquivo `.env`.

---

## ☁️ Publicando o Backend no Render

Para colocar a Inteligência Artificial e a API na nuvem de graça:

1. Crie uma conta no [Render](https://render.com).
2. Clique em **New** > **Web Service**.
3. Conecte com o seu repositório do Github.
4. Nas configurações do serviço, preencha:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn input_handler:app --host 0.0.0.0 --port $PORT`
5. Na aba **Environment Variables**, adicione todas as chaves do seu arquivo `.env` (GeminiKey, SUPABASE_URL, etc).
6. Clique em **Create Web Service**.
7. *(Opcional mas recomendado)* Siga o passo a passo da próxima seção para configurar o UptimeRobot e garantir que seu backend não durma.

---

## 🤖 Configurando o UptimeRobot (Anti-Sleep)

Para garantir que o seu backend hospedado gratuitamente no Render não "durma" após 15 minutos de inatividade:

1. Crie uma conta gratuita no [UptimeRobot](https://uptimerobot.com/).
2. No painel principal, clique no botão **Add New Monitor** (Adicionar Novo Monitor).
3. Preencha as configurações do monitor conforme abaixo:
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `Wallet App Keep-Alive` (ou qualquer nome de sua preferência)
   - **URL (or IP):** Cole a URL do seu backend hospedado no Render e adicione `/tasks/keepalive` no final (Exemplo: `https://seu-app-backend.onrender.com/tasks/keepalive`)
   - **Monitoring Interval:** `5 minutes` (Isso garante que o Render receba tráfego antes dos 15 minutos de limite)
4. Clique no botão **Create Monitor** e confirme na tela seguinte.

Pronto! Agora o UptimeRobot fará uma requisição a cada 5 minutos na rota de manutenção. Seu servidor ficará 100% do tempo "acordado" (warm), garantindo respostas ultrarrápidas no seu Wallet App!

---

*Projeto desenvolvido como trabalho final do curso de "Desenvolvimento de aplicativos com IA Generativa usando Antigravity".*
