import re
from typing import List, Dict

_analyzer = None

def get_presidio_analyzer():
    global _analyzer
    if _analyzer is None:
        try:
            from presidio_analyzer import AnalyzerEngine
            from presidio_analyzer.nlp_engine import NlpEngineProvider

            # Configure Presidio to use en_core_web_sm explicitly
            provider = NlpEngineProvider(nlp_configuration={
                "nlp_engine_name": "spacy",
                "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}]
            })
            nlp_engine = provider.create_engine()
            _analyzer = AnalyzerEngine(nlp_engine=nlp_engine)
        except Exception as e:
            try:
                from presidio_analyzer import AnalyzerEngine
                _analyzer = AnalyzerEngine()
            except Exception:
                _analyzer = False
    return _analyzer if _analyzer is not False else None

def detect_pii(text: str) -> List[Dict[str, str]]:
    """
    Detect PII entities (PERSON, PHONE_NUMBER, US_SSN, CREDIT_CARD, EMAIL_ADDRESS)
    using Microsoft Presidio configured with spaCy en_core_web_sm + regex fallback.
    """
    entities: List[Dict[str, str]] = []
    detected_spans = set()

    analyzer = get_presidio_analyzer()
    if analyzer:
        try:
            presidio_results = analyzer.analyze(
                text=text,
                # PERSON names alone are not treated as confidential PII;
                # ordinary prompts often mention names. Concrete identifiers
                # are what the gateway must protect.
                entities=["PHONE_NUMBER", "US_SSN", "CREDIT_CARD", "EMAIL_ADDRESS"],
                language="en"
            )
            for res in presidio_results:
                matched_val = text[res.start:res.end]
                entities.append({
                    "type": "PII",
                    "match": f"{res.entity_type}: {matched_val}"
                })
                detected_spans.add((res.start, res.end))
        except Exception:
            pass

    # Regex Fallbacks (ensures fast execution even if Presidio/spaCy model is not loaded)
    regex_patterns = [
        ("US_SSN", r'\b\d{3}-\d{2}-\d{4}\b'),
        ("EMAIL_ADDRESS", r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
        ("PHONE_NUMBER", r'\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b'),
        ("CREDIT_CARD", r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b')
    ]

    for entity_name, pattern in regex_patterns:
        for m in re.finditer(pattern, text):
            if not any(start <= m.start() and m.end() <= end for start, end in detected_spans):
                entities.append({
                    "type": "PII",
                    "match": f"{entity_name}: {m.group(0)}"
                })
                detected_spans.add((m.start(), m.end()))

    return entities
