import os
import sys
import json
import datetime
import uvicorn
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client, Client
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Carrega variáveis de ambiente
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Configuração do Gemini
GEMINI_KEY = os.getenv("GeminiKey")
if not GEMINI_KEY:
    print("Erro: Chave do Gemini (GeminiKey) não encontrada no .env")
    sys.exit(1)

genai.configure(api_key=GEMINI_KEY)

# Configuração do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Erro ao inicializar Supabase: {e}")
else:
    print("Aviso: Chaves do Supabase não configuradas no backend.")

# FastAPI Setup
app = FastAPI(title="Wallet App NLP API")

# Permite chamadas locais do Frontend React (Vite geralmente roda na 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir tudo localmente para facilitar
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransactionRequest(BaseModel):
    text: str

def process_nlp(text_input: str):
    system_instruction = """
    Você é um tradutor puro de NLP financeiro.
    Sua tarefa é ler a entrada de texto bruto e devolvê-la estritamente como um objeto JSON.
    Identifique se o texto representa um GASTO ou uma RECEITA (ganho, salário, entrada de dinheiro).
    Se for uma RECEITA, a chave "categoria" deve ser OBRIGATORIAMENTE "Receita".
    Se for um GASTO, infira a "categoria" normalmente (ex: "Transporte", "Alimentação", "Lazer").
    
    Não adicione blocos de código (```json), explicações ou qualquer outro texto na resposta.
    O JSON deve ter exatamente as seguintes chaves:
    {
      "categoria": string (veja regra acima: se for ganho/entrada de dinheiro, DEVE ser "Receita"),
      "valor": float (extraído do texto, assuma BRL e sempre positivo),
      "data": string (formato ISO 8601, assuma a data atual ou passada conforme contexto),
      "descricao": string (uma breve descrição do gasto ou ganho),
      "forma_pagamento": string (inferida do texto, deve ser estritamente um destes: "pix", "debito", "credito" ou "dinheiro" - sem acentos)
    }
    """
    
    today_iso = datetime.datetime.now().isoformat()
    prompt = f"Data atual: {today_iso}\nTexto do usuário: {text_input}"

    model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)
    
    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        return json.loads(response_text)
    except Exception as e:
        print(f"Erro ao processar NLP no Gemini: {e}")
        return None

@app.post("/transaction")
def create_transaction(req: TransactionRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="O texto não pode ser vazio.")

    print(f"Processando entrada via API: {req.text}")
    data = process_nlp(req.text)
    
    if not data:
        raise HTTPException(status_code=500, detail="Falha ao extrair dados usando Gemini.")

    # Normalizar a forma de pagamento para evitar erros de acentuação ou variação
    if "forma_pagamento" in data and isinstance(data["forma_pagamento"], str):
        fp = data["forma_pagamento"].lower()
        if "pix" in fp:
            data["forma_pagamento"] = "pix"
        elif "deb" in fp or "déb" in fp:
            data["forma_pagamento"] = "debito"
        elif "cred" in fp or "créd" in fp:
            data["forma_pagamento"] = "credito"
        elif "dinh" in fp or "espécie" in fp or "especie" in fp:
            data["forma_pagamento"] = "dinheiro"
        else:
            data["forma_pagamento"] = "dinheiro"

    if supabase:
        try:
            # Remover 'forma_pagamento' porque a coluna não existe no banco de dados e quebra a inserção
            data_to_insert = data.copy()
            data_to_insert.pop("forma_pagamento", None)
            
            # Usar a biblioteca nova retorna response que contém data
            response = supabase.table('transactions').insert(data_to_insert).execute()
            inserted = response.data
            return {"status": "sucesso", "data": inserted[0] if inserted else data}
        except Exception as e:
            print(f"Erro do Supabase: {e}")
            raise HTTPException(status_code=500, detail="Falha ao inserir no banco.")
    else:
        # Modo fallback apenas leitura do NLP se não tem DB (não deve ocorrer no nosso pipeline MSEP)
        return {"status": "processado_sem_banco", "data": data}

class AdvisorRequest(BaseModel):
    receita: float
    gasto: float
    metas_status: str = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: str

@app.post("/advisor")
def financial_advisor(req: AdvisorRequest):
    system_instruction = """
    Você é um conselheiro financeiro amigável, direto e inspirador.
    O usuário vai lhe fornecer o total de Receitas e o total de Gastos do mês atual.
    Sua tarefa é dar UMA dica financeira rápida de como economizar ou investir, focada na proporção de receita vs gastos informada.
    Sua resposta deve ter no máximo 2 frases curtas. Não use jargões difíceis.
    """
    
    prompt = f"Minha Receita do mês: R${req.receita:.2f}. Meus Gastos do mês: R${req.gasto:.2f}."
    
    if req.metas_status:
        prompt += f"\nE aqui está o status das Metas por Categoria do usuário:\n{req.metas_status}\nPor favor, leve essas metas em consideração ao dar sua dica se ele estiver perto de estourar algum limite!"
    model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)
    
    try:
        response = model.generate_content(prompt)
        return {"tip": response.text.strip()}
    except Exception as e:
        print(f"Erro ao gerar dica: {e}")
        raise HTTPException(status_code=500, detail="Falha ao gerar conselho.")

@app.post("/chat")
def financial_chat(req: ChatRequest):
    try:
        system_instruction = f"""Você é um assistente financeiro pessoal de elite, amigável e direto.
O usuário está conversando com você no painel do Wallet App.
Responda às perguntas dele baseando-se EXCLUSIVAMENTE nestes dados do mês atual:
{req.context}

Siga as diretrizes:
1. Seja conciso e vá direto ao ponto, não enrole.
2. Se o usuário perguntar sobre algo que não está nos dados, informe que você só tem acesso aos dados fornecidos.
3. Use formatação Markdown (negrito, listas) para deixar a leitura fácil no chat.
"""
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction,
            generation_config={"temperature": 0.4}
        )

        formatted_messages = []
        for msg in req.messages:
            formatted_messages.append({
                "role": "model" if msg.role == "assistant" else "user",
                "parts": [msg.content]
            })

        response = model.generate_content(formatted_messages)
        return {"response": response.text}

    except Exception as e:
        print(f"Erro no chat: {e}")
        raise HTTPException(status_code=500, detail="Falha no chat.")

@app.api_route("/keepalive", methods=["GET", "HEAD"])
def keep_alive():
    """Rota para o UptimeRobot bater a cada 5 minutos e impedir o Render de dormir."""
    # Como não temos token de instagram ou contagem de seguidores neste app, 
    # apenas retornamos um status de sucesso.
    return {"status": "awake", "message": "O servidor está acordado e pronto!"}

if __name__ == "__main__":
    print("=== Iniciando Servidor Wallet App API (FastAPI) ===")
    uvicorn.run("input_handler:app", host="0.0.0.0", port=8000, reload=True)
