import os
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
from io import StringIO

from core.schemas import ClaimSubmission
from core.config import CLAIMS_DB_PATH
from services.ml_service import load_model, analyze_claim, train_system_logic, save_model

router = APIRouter()

@router.get("/claims", response_model=List[dict])
def get_claims():
    if os.path.exists(CLAIMS_DB_PATH):
        df = pd.read_csv(CLAIMS_DB_PATH)
        return df.fillna("").to_dict(orient="records")
    return []

@router.post("/claims")
def submit_claim(claim: ClaimSubmission):
    existing_model = load_model()
    if not existing_model:
        raise HTTPException(status_code=503, detail="Model not loaded. Please train the system first via Admin Dashboard.")

    cat, urg, risk, score, auth, prio, rank = analyze_claim(existing_model, claim.description, claim.amount, claim.tenure)
    
    record = {
        "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Customer_ID": claim.customer_id,
        "Description": claim.description,
        "Amount": claim.amount,
        "Tenure": claim.tenure,
        "Category": cat,
        "Urgency": urg,
        "Fraud_Risk": risk,
        "Anomaly_Score": score,
        "authenticity_score": auth,
        "priority_score": prio,
        "rank_score": rank,
        "Status": "Pending Review"
    }
    
    df_new = pd.DataFrame([record])
    if not os.path.exists(CLAIMS_DB_PATH):
        df_new.to_csv(CLAIMS_DB_PATH, index=False)
    else:
        df_new.to_csv(CLAIMS_DB_PATH, mode='a', header=False, index=False)
    
    return {"message": "Claim submitted successfully", "data": record}

@router.post("/train")
async def train_model(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    s = str(content, 'utf-8')
    data = StringIO(s)
    
    try:
        df = pd.read_csv(data)
        nlp, fraud, meta = train_system_logic(df)
        save_model(nlp, fraud, meta)
        return {"message": "Training successful", "meta": meta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model/status")
def get_model_status():
    existing_model = load_model()
    if existing_model:
        return {"active": True, "meta": existing_model['meta']}
    return {"active": False, "meta": None}

@router.delete("/claims")
def delete_claim(customer_id: str, timestamp: str):
    if not os.path.exists(CLAIMS_DB_PATH):
        raise HTTPException(status_code=404, detail="No claims database found")
    
    try:
        df = pd.read_csv(CLAIMS_DB_PATH)
        # Ensure correct data types for comparison
        df['Customer_ID'] = df['Customer_ID'].astype(str)
        df['Timestamp'] = df['Timestamp'].astype(str)
        
        # Filter
        mask = (df['Customer_ID'] == customer_id) & (df['Timestamp'] == timestamp)
        
        if not mask.any():
             raise HTTPException(status_code=404, detail="Claim not found")
             
        df = df[~mask]
        df.to_csv(CLAIMS_DB_PATH, index=False)
        return {"message": "Claim deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting claim: {str(e)}")
