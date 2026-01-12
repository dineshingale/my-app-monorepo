import streamlit as st
import pandas as pd
import numpy as np
import os
import joblib
import time
from datetime import datetime
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from io import StringIO

# --- CONFIGURATION ---
MODEL_PATH = "models/trained_brain.pkl"
CLAIMS_DB_PATH = "data/submitted_claims.csv"

st.set_page_config(
    page_title="Smart Claims Processor",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- UTILS & MODEL LOGIC ---

def save_model(nlp_pipeline, iso_forest, training_meta):
    """Persist the trained models to disk."""
    joblib.dump({
        'nlp': nlp_pipeline,
        'fraud': iso_forest,
        'meta': training_meta
    }, MODEL_PATH)

def load_model():
    """Load the trained model from disk."""
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return None

def train_system(df):
    """
    Trains the system on the provided dataframe.
    Expects columns: 'Description', 'Policy_Type', 'Amount', 'Customer_Tenure'
    """
    # 1. NLP Training
    X_text = df['Description']
    y_category = df['Policy_Type'] # Assumes this column exists
    
    nlp_pipeline = Pipeline([
        ('vectorizer', CountVectorizer(stop_words='english')),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    nlp_pipeline.fit(X_text, y_category)

    # 2. Fraud Training (Anomaly Detection)
    # Handle missing or different column names gracefully if possible? 
    # For now, enforce schema or basic mapping
    if 'Amount' in df.columns and 'Customer_Tenure' in df.columns:
        X_numeric = df[['Amount', 'Customer_Tenure']].fillna(0)
        iso_forest = IsolationForest(contamination=0.1, random_state=42)
        iso_forest.fit(X_numeric)
    else:
        iso_forest = None
        st.warning("⚠️ 'Amount' or 'Customer_Tenure' columns missing. Fraud detection disabled.")

    # Meta
    meta = {
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'training_count': len(df)
    }

    return nlp_pipeline, iso_forest, meta

def save_claim(claim_data):
    """Appends a new claim to the CSV file."""
    df_new = pd.DataFrame([claim_data])
    if not os.path.exists(CLAIMS_DB_PATH):
        df_new.to_csv(CLAIMS_DB_PATH, index=False)
    else:
        df_new.to_csv(CLAIMS_DB_PATH, mode='a', header=False, index=False)

def analyze_claim(model_bundle, description, amount, tenure):
    """Run inference using the loaded model."""
    nlp = model_bundle['nlp']
    fraud = model_bundle['fraud']
    
    # NLP
    category = nlp.predict([description])[0]
    
    # Urgency (Rule-based for now, could be ML)
    urgency_keywords = ['emergency', 'severe', 'critical', 'urgent', 'immediately', 'pain', 'crash']
    urgency = "Medium"
    if any(k in description.lower() for k in urgency_keywords):
        urgency = "High"

    # Fraud
    fraud_risk = "Unknown"
    anomaly_score = 0.0
    if fraud:
        features = pd.DataFrame([[amount, tenure]], columns=['Amount', 'Customer_Tenure'])
        pred = fraud.predict(features)[0]
        anomaly_score = fraud.decision_function(features)[0]
        if pred == -1:
            fraud_risk = "High"
        else:
            fraud_risk = "Low"
            
    return category, urgency, fraud_risk, anomaly_score

# --- UI COMPONENTS ---

def sidebar_role_select():
    with st.sidebar:
        st.header("👤 Role Selection")
        role = st.radio("Access Dashboard As:", ["User (Submit Claim)", "Admin (Manage AI)"])
        st.divider()
        st.info("Current Mode: " + role)
        return role

def render_admin_dashboard():
    st.title("🛡️ Admin Command Center")
    tab1, tab2 = st.tabs(["🧠 Train AI Brain", "📊 View Submitted Claims"])

    with tab1:
        st.header("Upload Training Data")
        st.markdown("Upload a CSV file containing historical claims to retrain the categorization and fraud detection models.")
        uploaded_file = st.file_uploader("Choose a CSV file", type="csv")
        
        if uploaded_file:
            df = pd.read_csv(uploaded_file)
            st.dataframe(df.head(), use_container_width=True)
            st.caption(f"Loaded {len(df)} records.")

            if st.button("🚀 Train Model Now", type="primary"):
                with st.status("Training Multi-Modal AI System...", expanded=True) as status:
                    st.write("Initializing NLP Pipeline...")
                    time.sleep(1) # Dramatic effect
                    st.write("Fitting Isolation Forest for Anomaly Detection...")
                    
                    try:
                        nlp, fraud, meta = train_system(df)
                        save_model(nlp, fraud, meta)
                        status.update(label="Training Complete!", state="complete", expanded=False)
                        st.success(f"Model successfully trained on {len(df)} records at {meta['timestamp']}")
                    except Exception as e:
                        st.error(f"Training Failed: {str(e)}")

        # Check existing model status
        existing_model = load_model()
        if existing_model:
            st.divider()
            st.metric("Current Model Status", "Active", f"Trained: {existing_model['meta']['timestamp']}")
            st.json(existing_model['meta'])
        else:
            st.warning("No active model found. Please train the system.")

    with tab2:
        st.header("📝 Submitted Claims Log")
        if os.path.exists(CLAIMS_DB_PATH):
            claims_df = pd.read_csv(CLAIMS_DB_PATH)
            
            # Filters
            filter_cat = st.selectbox("Filter by Category", ["All"] + list(claims_df['Category'].unique()))
            if filter_cat != "All":
                claims_df = claims_df[claims_df['Category'] == filter_cat]
            
            st.dataframe(claims_df, use_container_width=True)
            
            # Analytics
            st.subheader("Quick Review Stats")
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Total Pending", len(claims_df))
            with col2:
                high_risk = len(claims_df[claims_df['Fraud_Risk'] == 'High'])
                st.metric("High Risk Flags", high_risk, delta_color="inverse")
            with col3:
                urgency = len(claims_df[claims_df['Urgency'] == 'High'])
                st.metric("Urgent Requests", urgency)

        else:
            st.info("No claims have been submitted yet.")

def render_user_dashboard():
    st.title("🏥 Claim Submission Portal")
    st.markdown("Please fill out the details below as accurately as possible for faster processing.")

    existing_model = load_model()
    if not existing_model:
        st.error("System Maintenance: Claim processing is currently unavailable (Model not loaded). Please contact support.")
        return

    with st.form("new_claim_form"):
        col1, col2 = st.columns(2)
        with col1:
            customer_id = st.text_input("Customer ID / Policy Number")
            amount = st.number_input("Estimated Claim Amount ($)", min_value=0.0, step=100.0)
        with col2:
            tenure = st.number_input("Years with us (Tenure)", min_value=0, max_value=50, value=1)
            date = st.date_input("Date of Incident")
        
        description = st.text_area("Incident Description", height=150, placeholder="Please describe what happened in detail...")
        
        submitted = st.form_submit_button("Submit Claim")

    if submitted:
        if not description or amount <= 0:
            st.warning("Please provide a description and a valid amount.")
            return

        with st.spinner("Processing Application..."):
            # 1. Analyze immediately using the Brain
            cat, urg, risk, score = analyze_claim(existing_model, description, amount, tenure)
            
            # 2. Save
            claim_record = {
                "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "Customer_ID": customer_id,
                "Description": description,
                "Amount": amount,
                "Tenure": tenure,
                "Category": cat,
                "Urgency": urg,
                "Fraud_Risk": risk,
                "Anomaly_Score": score,
                "Status": "Pending Review"
            }
            save_claim(claim_record)
            
            # 3. Feedback
            time.sleep(1) # Fake processing delay
            st.success("✅ Claim Submitted Successfully!")
            st.balloons()
            
            # Optional Transparency
            with st.expander("View Application Receipt"):
                st.write(f"**Reference ID:** {hash(description)}")
                st.write(f"**Detected Category:** {cat}")
                if risk == "High":
                    st.warning("Note: Your claim requires additional verification due to unusual parameters.")
                else:
                    st.info("Your claim has been fast-tracked.")


# --- MAIN ---

role = sidebar_role_select()

if role.startswith("Admin"):
    render_admin_dashboard()
else:
    render_user_dashboard()
