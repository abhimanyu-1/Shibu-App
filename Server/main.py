from fastapi import FastAPI, HTTPException
import traceback
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import uvicorn
import edge_tts
import tempfile
import base64
from langchain_groq import ChatGroq
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate

# RAG Imports
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter

# Load env variables
load_dotenv()
GROQ_API_KEY = os.getenv("API_KEY")

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI()

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"ERROR: Validation Failed for {request.url}")
    print(f"Body: {exc.body}")
    print(f"Errors: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM
llm = ChatGroq(
    temperature=0.6, 
    model_name="llama-3.3-70b-versatile", 
    groq_api_key=GROQ_API_KEY
)

# Global RAG variables
retriever = None

def initialize_rag():
    global retriever
    print("DEBUG: Initializing RAG System in background...")
    try:
        # 1. Load Data
        if os.path.exists("slang_knowledge_base.txt"):
            loader = TextLoader("slang_knowledge_base.txt", encoding="utf-8")
            documents = loader.load()
            
            # 2. Split Text
            text_splitter = CharacterTextSplitter(chunk_size=100, chunk_overlap=0, separator="\n")
            docs = text_splitter.split_documents(documents)
            
            # 3. Create Embeddings
            print("DEBUG: Loading Embeddings Model... (This may take a while on first run)")
            embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            
            # 4. Create Vector Store
            print("DEBUG: Creating FAISS Index...")
            db = FAISS.from_documents(docs, embeddings)
            retriever = db.as_retriever(search_kwargs={"k": 2}) # Retrieve top 2 matches
            print("DEBUG: RAG System Ready!")
        else:
            print("WARNING: slang_knowledge_base.txt not found. RAG disabled.")
    except Exception as e:
        print(f"CRITICAL ERROR initializing RAG: {e}")
        retriever = None

import asyncio

@app.on_event("startup")
async def startup_event():
    # Run RAG init in a separate thread so it doesn't block startup
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, initialize_rag)

# Store sessions: sessionId -> { chain: LLMChain, question_count: int, name: str }
sessions = {}

class InitRequest(BaseModel):
    session_id: str
    name: str 
    domain: str
    age: str
    experience: str

class ChatRequest(BaseModel):
    session_id: str
    message: str

# Helper to generate audio
from elevenlabs.client import ElevenLabs

# Initialize ElevenLabs
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
import requests
import json

# Initialize Murf
MURF_API_KEY = os.getenv("MURF_API_KEY") or os.getenv("ELEVENLABS_API_KEY") # Backwards compat if user put it there

# Helper to generate audio
async def generate_audio(text: str) -> str:
    if not MURF_API_KEY:
        print("WARNING: MURF_API_KEY not found. Using EdgeTTS fallback.")
        # Fallback
        communicate = edge_tts.Communicate(text, "en-US-ChristopherNeural", rate="+15%", pitch="+0Hz")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
            temp_path = fp.name
        await communicate.save(temp_path)
        with open(temp_path, "rb") as audio_file:
            audio_bytes = audio_file.read()
        os.unlink(temp_path)
        return base64.b64encode(audio_bytes).decode('utf-8')

    try:
        # Murf.ai API call
        url = "https://api.murf.ai/v1/speech/generate"
        payload = {
            "voiceId": "Ronnie", 
            "style": "Conversational",
            "modelVersion": "GEN2", # Changing Falcon to GEN2 based on error hint
            "multiNativeLocale": "ml-IN",
            "text": text,
            "rate": 20, 
            "pitch": 0,
            "sampleRate": 48000,
            "format": "MP3",
            "channelType": "MONO"
        }
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "api-key": MURF_API_KEY
        }
        
        # Requests is blocking, strictly should be in threadpool but ok for now or use async client
        # For strict async:
        loop = asyncio.get_event_loop()
        def _post():
            return requests.post(url, json=payload, headers=headers)
        
        response = await loop.run_in_executor(None, _post)
        
        if response.status_code == 200:
            data = response.json()
            audio_url = data.get("audioFile")
            if audio_url:
                # Download the audio file
                def _get():
                    return requests.get(audio_url)
                audio_res = await loop.run_in_executor(None, _get)
                audio_bytes = audio_res.content
                return base64.b64encode(audio_bytes).decode('utf-8')
            else:
                raise Exception(f"No audioFile in response: {data}")
        else:
            raise Exception(f"Murf API Error: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"ERROR Murf.ai: {e}")
        # Fallback
        communicate = edge_tts.Communicate(text, "en-US-ChristopherNeural", rate="+15%", pitch="+0Hz")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
            temp_path = fp.name
        await communicate.save(temp_path)
        with open(temp_path, "rb") as audio_file:
            audio_bytes = audio_file.read()
        os.unlink(temp_path)
        return base64.b64encode(audio_bytes).decode('utf-8')

@app.get("/health")
async def health_check():
    rag_status = "ready" if retriever else "loading_or_disabled"
    return {"status": "ok", "rag_status": rag_status}

@app.post("/start_interview")
async def start_interview(request: InitRequest):
    print(f"DEBUG: Endpoint hit! Session: {request.session_id} for {request.name}")
    print("*" * 50)
    print("DEBUG: API LOADED: V3 (LLMChain + InputKey Fix)")
    print("*" * 50)
    
    context = f"Candidate Name: {request.name}, Domain: {request.domain}, Age: {request.age}, Experience: {request.experience} years."
    
    template = f"""You are Shibu, a highly experienced senior tech veteran from Kerala.
    You are professional but speak in "Manglish" (Malayalam + English).
    Use the following local slang terms if they fit the situation: {{slang_context}}
    
    Candidate Details: {context}
    
    Guidelines:
    1. **Identity**: Shibu Sir. Warm but strict.
    2. **Tone**: Roast vague answers nicely. Use Malayalam script for slang: "അടിപൊളി", "സീൻ", "ശോകം", "പൊളി".
    3. **First Interaction**: Ask for self-introduction.
    4. **Flow**: Ask ONE question at a time. Total 5 questions.
    5. **Vocabulary**: Use the provided slang context to sound authentic.
    6. **Format**: Speak only the dialogue. Do NOT describe actions (e.g., *smiles*, *nods*).
    
    Current conversation:
    {{history}}
    Candidate: {{input}}
    Shibu Sir:"""

    try:
        prompt = PromptTemplate(input_variables=["history", "input", "slang_context"], template=template)
        memory = ConversationBufferMemory(ai_prefix="Shibu Sir", human_prefix="Candidate", input_key="input")
        
        # Switched to LLMChain to support extra variables like slang_context
        chain = LLMChain(
            llm=llm, 
            prompt=prompt, 
            memory=memory,
            verbose=True
        )
        
        # Initial greeting with empty slang context
        initial_input = "Hello. I am the candidate. Please start the interview."
        # We need to manually inject slang_context into the predict call or prompt
        # LangChain's ConversationChain expects specific inputs. 
        # Strategy: We will modify the chain.predict call to include 'slang_context'.
        # But ConversationChain standard memory usage is tricky with extra vars.
        # Simplest fix: Pre-fill the template partial if possible or pass as input.
        # Actually, let's just use .predict(input=..., slang_context="...") if prompt allows.
        
        response_text = chain.predict(input=initial_input, slang_context="No specific slang needed yet.")
        
        sessions[request.session_id] = {
            "chain": chain,
            "question_count": 0,
            "name": request.name
        }
    except Exception as e:
        print(f"ERROR during LLM generation: {e}")
        traceback.print_exc()
        return {"reply": "Error generating response", "audio": None}
    
    try:
        audio_b64 = await generate_audio(response_text)
    except Exception as e:
         print(f"ERROR during Audio generation: {e}")
         audio_b64 = None
    
    return {"reply": response_text, "audio": audio_b64}

@app.post("/chat")
async def chat(request: ChatRequest):
    session = sessions.get(request.session_id)
    if not session:
        return {"reply": "Session expired.", "audio": None}
    
    chain = session["chain"]
    question_count = session["question_count"]
    
    if question_count >= 5:
        final_input = "That was the last answer. Give harsh but fair review. Roast or Praise. Score out of 10. Say Goodbye."
        try:
            reply_text = chain.predict(input=final_input, slang_context="Use slang like 'Pwoli' for good or 'Shokam' for bad.")
            audio_b64 = await generate_audio(reply_text)
            return {"reply": reply_text, "audio": audio_b64, "is_finished": True}
        except Exception as e:
            print(f"ERROR during Final Review: {e}")
            traceback.print_exc()
            return {"reply": "Error generating review", "audio": None}

    # --- RAG RETRIEVAL ---
    slang_context = ""
    if retriever:
        try:
            print(f"DEBUG: Retrieving slang for: {request.message}")
            relevant_docs = retriever.invoke(request.message)
            slang_list = [d.page_content for d in relevant_docs]
            slang_context = "\n".join(slang_list)
            print(f"DEBUG: Retrieved Slang Context: {slang_context}")
        except Exception as e:
            print(f"ERROR Retrieving: {e}")
            slang_context = "No slang found."
    
    try:
        reply_text = chain.predict(input=request.message, slang_context=slang_context)
    except Exception as e:
        print(f"ERROR LLM: {e}")
        traceback.print_exc()
        return {"reply": "Error generating reply", "audio": None}

    session["question_count"] += 1
    
    try:
        audio_b64 = await generate_audio(reply_text)
    except Exception as e:
        audio_b64 = None
        
    return {"reply": reply_text, "audio": audio_b64, "question_count": session["question_count"]}
