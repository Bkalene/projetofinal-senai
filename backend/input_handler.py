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
    Sua única tarefa é ler a entrada de texto bruto e devolvê-la estritamente como um objeto JSON.
    Não adicione blocos de código (```json), explicações ou qualquer outro texto na resposta.
    O JSON deve ter exatamente as seguintes chaves:
    {
      "categoria": string (inferida do texto, ex: "Transporte", "Alimentação", "Lazer"),
      "valor": float (extraído do texto, assuma BRL),
      "data": string (formato ISO 8601, assuma a data atual ou passada conforme contexto),
      "descricao": string (uma breve descrição do gasto),
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
            # Usar a biblioteca nova retorna response que contém data
            response = supabase.table('transactions').insert(data).execute()
            inserted = response.data
            return {"status": "sucesso", "data": inserted[0] if inserted else data}
        except Exception as e:
            print(f"Erro do Supabase: {e}")
            raise HTTPException(status_code=500, detail="Falha ao inserir no banco.")
    else:
        # Modo fallback apenas leitura do NLP se não tem DB (não deve ocorrer no nosso pipeline MSEP)
        return {"status": "processado_sem_banco", "data": data}

if __name__ == "__main__":
    print("=== Iniciando Servidor Wallet App API (FastAPI) ===")
    uvicorn.run("input_handler:app", host="0.0.0.0", port=8000, reload=True)
