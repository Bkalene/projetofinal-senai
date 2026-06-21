import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
genai.configure(api_key=os.getenv("GeminiKey"))

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
  "forma_pagamento": string (inferida do texto, deve ser estritamente um destes: "pix", "débito", "crédito" ou "dinheiro")
}
"""

try:
    model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)
    
    test_cases = [
        "gastei 10 no pix com pastel",
        "comprei uma blusa de 50 no credito",
        "paguei 20 em dinheiro no mercado",
        "15 no debito na padaria",
        "comprei um lanche por 30"
    ]
    
    for tc in test_cases:
        print(f"\nTESTANDO: {tc}")
        response = model.generate_content(tc)
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        print("PARSED JSON:", json.loads(response_text))
except Exception as e:
    print("EXCEPTION:", e)
