import os
import logging
import time
from src.llm import get_llm
from datasets import Dataset
from dotenv import load_dotenv
from ragas import evaluate
from ragas.metrics import answer_relevancy, faithfulness
from src.shared.common_fn import load_embedding_model 
from ragas.dataset_schema import SingleTurnSample
from ragas.metrics import BleuScore, RougeScore, SemanticSimilarity, ContextEntityRecall,Faithfulness,ResponseRelevancy
from ragas.metrics._factual_correctness import FactualCorrectness
from ragas.llms import LangchainLLMWrapper
from langchain_openai import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from ragas.embeddings import LangchainEmbeddingsWrapper
import nltk
from typing import Optional
from langdetect import detect
from ragas.utils import RAGAS_SUPPORTED_LANGUAGE_CODES

nltk.download('punkt')
load_dotenv()

EMBEDDING_MODEL = os.getenv("RAGAS_EMBEDDING_MODEL")
EMBEDDING_FUNCTION, _ = load_embedding_model(EMBEDDING_MODEL)


lang_code_to_name = {
    'en': 'english',
    'hi': 'hindi',
    'mr': 'marathi',
    'zh': 'chinese',
    'es': 'spanish',
    'am': 'amharic',
    'ar': 'arabic',
    'hy': 'armenian',
    'bg': 'bulgarian',
    'ur': 'urdu',
    'ru': 'russian',
    'pl': 'polish',
    'fa': 'persian',
    'nl': 'dutch',
    'da': 'danish',
    'fr': 'french',
    'my': 'burmese',
    'el': 'greek',
    'it': 'italian',
    'ja': 'japanese',
    'de': 'deutsch',
    'kk': 'kazakh',
    'sk': 'slovak'
}

def detect_language(text):
    detected_lang_code = detect(text)
    detected_lang_name = lang_code_to_name.get(detected_lang_code)
    
    if detected_lang_name in RAGAS_SUPPORTED_LANGUAGE_CODES:
        return detected_lang_name
    else:
        return None


async def ragas_metrics(question: str, contexts: list, answers: list, model_name:str, reference: Optional[str] = None):
    try:
        if "diffbot" in model_name or "ollama" in model_name:
            raise ValueError(f"Unsupported model for evaluation: {model_name}")
        
        llm, model_name = get_llm(model=model_name)
        ragas_llm = LangchainLLMWrapper(llm)
        embeddings = EMBEDDING_FUNCTION
        embedding_model = LangchainEmbeddingsWrapper(embeddings=embeddings)
        
        rouge_scorer = RougeScore()
        semantic_scorer = SemanticSimilarity(embeddings=embedding_model)
        entity_recall_scorer = ContextEntityRecall(llm=ragas_llm)
        faithfulness = Faithfulness(llm=ragas_llm)
        response_relevancy = ResponseRelevancy(llm=ragas_llm, embeddings=embedding_model)
        
        metrics = []
        language = detect_language(question)
      
        
        if not language:
            logging.exception("Language not found")
            return {"error": str(e)}
        
        if language == "english":
            for response, context in zip(answers, contexts):
                metric = {  "rouge_score": "Not Available", 
                            "semantic_score": "Not Available",
                            "context_entity_recall_score": "Not Available", 
                            "faithfulness_score": "Not Available",
                            "response_relevancy_score": "Not Available"
                        }
                
                if reference:
                    sample = SingleTurnSample(response=response, reference=reference)
                    metric["rouge_score"] = round(await rouge_scorer.single_turn_ascore(sample), 4)
                    metric["semantic_score"] = round(await semantic_scorer.single_turn_ascore(sample), 4)
                    
                    #if gemin
                    sample = SingleTurnSample(reference=reference, retrieved_contexts=[context])
                    metric["context_entity_recall_score"] = round(await entity_recall_scorer.single_turn_ascore(sample ), 4)
                
                #if "gemini" not in model_name:
                sample = SingleTurnSample(user_input=question, response=response, retrieved_contexts=[context])
                metric["faithfulness_score"] = round(await faithfulness.single_turn_ascore(sample), 4)
                metric["response_relevancy_score"] = round(await response_relevancy.single_turn_ascore(sample), 4)
                
                metrics.append(metric)
            
        else:
            
            adapted_prompts = await entity_recall_scorer.adapt_prompts(language=language, llm=ragas_llm)
            entity_recall_scorer.set_prompts(**adapted_prompts)

            adapted_prompts = await faithfulness.adapt_prompts(language=language, llm=ragas_llm)
            faithfulness.set_prompts(**adapted_prompts)

            adapted_prompts = await response_relevancy.adapt_prompts(language=language, llm=ragas_llm)
            response_relevancy.set_prompts(**adapted_prompts)

            for response, context in zip(answers, contexts):
                if reference:
                    sample = SingleTurnSample(user_input=question, response=response, reference=reference,retrieved_contexts=[context])
                    metrics.append({
                        "rouge_score": "Not Available",
                        "semantic_score": "Not Available",
                        "context_entity_recall_score": round(await entity_recall_scorer.single_turn_ascore(sample), 4),
                        "faithfulness_score": round(await faithfulness.single_turn_ascore(sample),4),
                        "response_relevancy_score": round(await response_relevancy.single_turn_ascore(sample),4)
                        })
                else:
                    sample = SingleTurnSample(user_input=question, response=response,retrieved_contexts=[context])
                    metrics.append({
                        "rouge_score": "Not Available",
                        "semantic_score": "Not Available",
                        "context_entity_recall_score": "Not Available",
                        "faithfulness_score": await faithfulness.single_turn_ascore(sample),
                        "response_relevancy_score": await response_relevancy.single_turn_ascore(sample)
                        }) 
        
        
        return metrics
    except Exception as e:
        logging.exception("Error in ragas_metrics")
        return {"error": str(e)}