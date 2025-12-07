# ai_service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import re

app = FastAPI()

class AnalyzeRequest(BaseModel):
  documentId: str = ""
  text: str = ""
  sections: List[Dict[str, Any]] = []

@app.get("/health")
def health():
  return {"status": "ok"}

@app.post("/analyze-document")
def analyze_document(req: AnalyzeRequest):
  text = req.text or ""
  zones = []

  # --- 1) TODO / placeholder detector ---
  for m in re.finditer(r"\b(TODO|TBD|fix this|fill this)\b", text, flags=re.I):
    start = m.start()
    end = m.end()
    zones.append({
      "id": f"todo-{start}-{end}",
      "type": "todo",
      "startOffset": start,
      "endOffset": end,
      "message": "Placeholder / TODO found. Consider resolving this.",
      "confidence": 0.9,
      "relatedOffsets": []
    })

  # --- 2) Very naive repetition detector (identical sentences) ---
  sentences = re.split(r"(?<=[\.!?])\s+|\n", text)
  seen = {}
  offset = 0
  for s in sentences:
    raw = s
    s_stripped = s.strip()
    if not s_stripped:
      offset += len(raw)
      continue

    if s_stripped in seen:
      prev_offset = seen[s_stripped]
      zones.append({
        "id": f"rep-{prev_offset}-{offset}",
        "type": "repetition",
        "startOffset": offset,
        "endOffset": offset + len(raw),
        "message": "This sentence repeats an earlier one. Consider merging or removing.",
        "confidence": 0.8,
        "relatedOffsets": [
          {"start": prev_offset, "end": prev_offset + len(s_stripped)}
        ]
      })
    else:
      seen[s_stripped] = offset

    offset += len(raw)

  return {"zones": zones}