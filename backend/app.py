"""
Backend API for AI-Based Phishing Email Detection (PhishGuard AI)
Connects frontend inference requests to the trained scikit-learn Pipeline model.
"""

from flask import Flask, request, jsonify
try:
    from flask_cors import CORS
    HAS_CORS = True
except ImportError:
    HAS_CORS = False

import os
import joblib
import numpy as np

app = Flask(__name__, static_folder="../frontend", static_url_path="")
if HAS_CORS:
    CORS(app)  # Enable cross-origin requests for local development
else:
    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        return response

# Configuration & Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")
MODEL_PATH = os.path.join(MODELS_DIR, "email_phishing_model.joblib")

# Load Trained Email Model Pipeline on startup
email_model = None
if os.path.exists(MODEL_PATH):
    try:
        email_model = joblib.load(MODEL_PATH)
        print(f"[SUCCESS] Loaded email phishing model from: {MODEL_PATH}")
    except Exception as e:
        print(f"[ERROR] Failed to load model from {MODEL_PATH}: {e}")
else:
    print(f"[WARNING] Model file not found at: {MODEL_PATH}")


@app.route("/")
def index():
    """Serve the frontend homepage."""
    return app.send_static_file("index.html")


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint indicating model readiness."""
    return jsonify({
        "status": "online",
        "service": "PhishGuard AI Backend",
        "email_model_loaded": email_model is not None,
        "version": "1.0.0"
    }), 200


@app.route("/api/scan-email", methods=["POST"])
@app.route("/api/analyze-email", methods=["POST"])
def scan_email():
    """
    Endpoint for Email Phishing Analysis using trained scikit-learn Pipeline
    Expected JSON: { "email_text": "..." } or { "content": "...", "subject": "..." }
    """
    global email_model

    if email_model is None:
        # Attempt to reload if not loaded on startup
        if os.path.exists(MODEL_PATH):
            try:
                email_model = joblib.load(MODEL_PATH)
            except Exception as e:
                return jsonify({
                    "error": "Trained email model failed to load on server.",
                    "details": str(e)
                }), 500
        else:
            return jsonify({
                "error": "Trained model file 'models/email_phishing_model.joblib' was not found on server."
            }), 503

    data = request.get_json(silent=True) or {}
    
    # Accept either 'email_text', 'content', or 'text'
    email_text = data.get("email_text") or data.get("content") or data.get("text") or ""
    subject = data.get("subject", "").strip()

    if not isinstance(email_text, str) or not email_text.strip():
        return jsonify({
            "error": "Email text content is required. Please provide non-empty email content."
        }), 400

    # Combine subject and content if subject is present
    full_text = f"{subject} {email_text}".strip() if subject else email_text.strip()

    try:
        # Pipeline contains TF-IDF + Classifier; pass list of strings directly
        raw_pred = email_model.predict([full_text])[0]
        
        # Determine verified class indices from email_model.classes_
        classes_arr = getattr(email_model, "classes_", [0, 1])
        classes_list = [int(c) if str(c).isdigit() else c for c in classes_arr]
        
        # 0 = Legitimate, 1 = Phishing/Spam
        phish_idx = classes_list.index(1) if 1 in classes_list else 1
        legit_idx = classes_list.index(0) if 0 in classes_list else 0

        # Extract probabilities if predict_proba is supported
        probabilities = None
        model_confidence_decimal = None
        phishing_risk_decimal = None
        confidence_pct = None

        if hasattr(email_model, "predict_proba"):
            proba = email_model.predict_proba([full_text])[0]
            prob_legit = float(proba[legit_idx])
            prob_phish = float(proba[phish_idx])
            
            # Decimal representations (0.0 - 1.0)
            phishing_risk_decimal = round(prob_phish, 4)
            is_phishing_pred = int(raw_pred) == 1
            model_confidence_decimal = round(prob_phish if is_phishing_pred else prob_legit, 4)
            confidence_pct = round(model_confidence_decimal * 100, 2)

            probabilities = {
                "legitimate": round(prob_legit, 4),
                "phishing": round(prob_phish, 4)
            }

            # Requirement 9: Temporary debug log (sanitized, no sensitive email text exposed)
            print(f"[AUDIT DEBUG] Classes: {classes_list} | Pred: {raw_pred} ({'Phishing/Spam' if is_phishing_pred else 'Legitimate'}) | P(Legit)={prob_legit:.4f} | P(Phish)={prob_phish:.4f} | ModelConfidence={model_confidence_decimal:.4f} | PhishingRisk={phishing_risk_decimal:.4f}")

        # Label mapping: 1 = Phishing/Spam, 0 = Legitimate
        is_phishing = int(raw_pred) == 1
        prediction_label = "Phishing/Spam" if is_phishing else "Legitimate"

        # Explainability & Recommendations
        if is_phishing:
            explanation = (
                f"The machine learning model classified this text as Phishing/Spam with a {confidence_pct or 'high'}% confidence score. "
                "The email text exhibits linguistic patterns, urgency cues, or suspicious solicitation indicators commonly observed in phishing campaigns."
            )
            recommendations = [
                "Do not click on any hyperlinks, buttons, or embedded redirects.",
                "Do not download or open any attachments included in this email.",
                "Verify the sender's authentic email address and domain headers.",
                "Never share credentials, PINs, or financial information via email."
            ]
        else:
            explanation = (
                f"The machine learning model classified this text as Legitimate with a {confidence_pct or 'high'}% confidence score. "
                "The message structure, vocabulary, and token distributions align with standard legitimate communication patterns."
            )
            recommendations = [
                "The email appears legitimate based on linguistic classification.",
                "Always follow standard cyber hygiene and verify unexpected requests for sensitive data."
            ]

        return jsonify({
            "status": "success",
            "prediction": prediction_label,
            "is_phishing": is_phishing,
            "label": int(raw_pred),
            "model_confidence": model_confidence_decimal,
            "phishing_risk": phishing_risk_decimal,
            "confidence": confidence_pct,
            "probabilities": probabilities,
            "explanation": explanation,
            "recommendations": recommendations,
            "text_length": len(full_text)
        }), 200

    except Exception as e:
        return jsonify({
            "error": "An error occurred during model inference.",
            "details": str(e)
        }), 500


@app.route("/api/analyze-url", methods=["POST"])
def analyze_url():
    """Placeholder for URL Analysis (to be integrated separately)"""
    return jsonify({
        "status": "pending",
        "message": "URL model integration is scheduled separately."
    }), 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
