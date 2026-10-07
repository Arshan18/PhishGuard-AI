"""
Backend API for AI-Based Phishing Detection (PhishGuard AI)
Connects frontend inference requests to:
1. Email Phishing Model: scikit-learn Pipeline (TF-IDF + Classifier)
2. Malicious URL Model: TensorFlow/Keras Neural Network + StandardScaler (30 UCI features)
"""

import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify

try:
    from flask_cors import CORS
    HAS_CORS = True
except ImportError:
    HAS_CORS = False

from tensorflow.keras.models import load_model
from url_features import extract_url_features, extract_features_df, validate_url, FEATURE_NAMES

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
EMAIL_MODEL_PATH = os.path.join(MODELS_DIR, "email_phishing_model.joblib")
URL_MODEL_PATH = os.path.join(MODELS_DIR, "url_phishing_model.keras")
URL_SCALER_PATH = os.path.join(MODELS_DIR, "url_scaler.joblib")

# 1. Load Trained Email Model Pipeline on startup
email_model = None
if os.path.exists(EMAIL_MODEL_PATH):
    try:
        email_model = joblib.load(EMAIL_MODEL_PATH)
        print(f"[SUCCESS] Loaded email phishing model from: {EMAIL_MODEL_PATH}")
    except Exception as e:
        print(f"[ERROR] Failed to load email model from {EMAIL_MODEL_PATH}: {e}")
else:
    print(f"[WARNING] Email model file not found at: {EMAIL_MODEL_PATH}")

# 2. Load Trained URL Neural Network Model & Scaler on startup
url_model = None
url_scaler = None
if os.path.exists(URL_MODEL_PATH) and os.path.exists(URL_SCALER_PATH):
    try:
        url_scaler = joblib.load(URL_SCALER_PATH)
        url_model = load_model(URL_MODEL_PATH)
        print(f"[SUCCESS] Loaded URL scaler from: {URL_SCALER_PATH}")
        print(f"[SUCCESS] Loaded URL phishing Keras model from: {URL_MODEL_PATH}")
    except Exception as e:
        print(f"[ERROR] Failed to load URL model/scaler: {e}")
else:
    print(f"[WARNING] URL model or scaler file not found at: {URL_MODEL_PATH} / {URL_SCALER_PATH}")


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
        "url_model_loaded": (url_model is not None and url_scaler is not None),
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
        if os.path.exists(EMAIL_MODEL_PATH):
            try:
                email_model = joblib.load(EMAIL_MODEL_PATH)
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

            # Development audit debug log
            print(f"[EMAIL AUDIT] Classes: {classes_list} | Pred: {raw_pred} ({'Phishing/Spam' if is_phishing_pred else 'Legitimate'}) | P(Legit)={prob_legit:.4f} | P(Phish)={prob_phish:.4f} | Confidence={confidence_pct}%")

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
            "error": "An error occurred during email model inference.",
            "details": str(e)
        }), 500


@app.route("/api/scan-url", methods=["POST"])
@app.route("/api/analyze-url", methods=["POST"])
def scan_url():
    """
    Endpoint for Malicious URL Phishing Analysis using trained Keras Neural Network and StandardScaler.
    Expected JSON: { "url": "https://example.com" }
    """
    global url_model, url_scaler

    if url_model is None or url_scaler is None:
        if os.path.exists(URL_MODEL_PATH) and os.path.exists(URL_SCALER_PATH):
            try:
                url_scaler = joblib.load(URL_SCALER_PATH)
                url_model = load_model(URL_MODEL_PATH)
            except Exception as e:
                return jsonify({
                    "error": "Trained URL model failed to load on server.",
                    "details": str(e),
                    "success": False
                }), 500
        else:
            return jsonify({
                "error": "Trained URL model files ('models/url_phishing_model.keras', 'models/url_scaler.joblib') were not found on server.",
                "success": False
            }), 503

    data = request.get_json(silent=True) or {}
    raw_url = data.get("url") or data.get("url_string") or data.get("link") or data.get("target_url") or ""

    # 1. URL Validation
    is_valid, err_msg = validate_url(raw_url)
    if not is_valid:
        return jsonify({
            "error": err_msg,
            "success": False
        }), 400

    trimmed_url = raw_url.strip()

    try:
        # 2. Extract 30 features according to UCI Phishing specification
        feature_dict = extract_url_features(trimmed_url)
        features_df = extract_features_df(trimmed_url)

        if features_df.shape[1] != 30:
            return jsonify({
                "error": f"Invalid feature extraction count: expected 30 features, got {features_df.shape[1]}.",
                "success": False
            }), 500

        # 3. Scaler transformation
        scaled_features = url_scaler.transform(features_df)

        # 4. Keras model inference (Output: 0 = Legitimate, 1 = Phishing)
        raw_pred = url_model.predict(scaled_features, verbose=0)
        phishing_probability = float(raw_pred[0][0])
        phishing_probability = max(0.0, min(1.0, phishing_probability))

        is_phishing = phishing_probability >= 0.5
        prediction_label = "Phishing" if is_phishing else "Legitimate"

        risk_percentage = round(phishing_probability * 100, 2)
        model_confidence_decimal = round(phishing_probability if is_phishing else (1.0 - phishing_probability), 4)
        confidence_pct = round(model_confidence_decimal * 100, 2)

        # Development debug logging (Part 11)
        raw_feat_vals = [int(v) for v in features_df.values[0]]
        scaled_feat_vals = [round(float(v), 3) for v in scaled_features[0]]
        print(f"\n[URL DEBUG] URL: {trimmed_url}")
        print(f"  Extracted features ({len(raw_feat_vals)}): {raw_feat_vals}")
        print(f"  Scaled features ({len(scaled_feat_vals)}): {scaled_feat_vals}")
        print(f"  Raw model probability: {phishing_probability:.6f}")
        print(f"  Final prediction: {prediction_label.lower()}")
        print(f"  Phishing percentage: {risk_percentage:.2f}%\n")

        # Explainability & Recommendations
        if is_phishing:
            explanation = (
                f"The deep learning neural network model classified this URL as Phishing with a {risk_percentage}% phishing risk score. "
                "The website address exhibits suspicious markers such as multiple subdomains, non-standard TLD, brand impersonation keywords, or lack of trusted SSL certificates."
            )
            recommendations = [
                "Do not open, visit, or submit credentials on this destination.",
                "Verify the official root domain directly via authoritative search engines.",
                "Inspect domain registration details and check for look-alike typo-squatting.",
                "Add this URL to organizational threat intelligence blocklists."
            ]
        else:
            explanation = (
                f"The deep learning neural network model classified this URL as Legitimate with a {risk_percentage}% phishing risk score ({confidence_pct}% model confidence). "
                "The lexical composition, domain syntax, and authority signals correspond with standard authentic web destinations."
            )
            recommendations = [
                "The website structure conforms to standard legitimate domain patterns.",
                "Always verify active HTTPS encryption before entering sensitive information."
            ]

        return jsonify({
            "success": True,
            "status": "success",
            "url": trimmed_url,
            "prediction": prediction_label,
            "is_phishing": is_phishing,
            "phishing_probability": round(phishing_probability, 4),
            "phishing_percentage": risk_percentage,
            "risk_percentage": risk_percentage,
            "phishing_risk": round(phishing_probability, 4),
            "model_confidence": model_confidence_decimal,
            "confidence": risk_percentage,
            "model_confidence_pct": confidence_pct,
            "explanation": explanation,
            "recommendations": recommendations,
            "features": feature_dict,
            "feature_count": 30
        }), 200

    except Exception as e:
        return jsonify({
            "error": "An error occurred during URL model inference.",
            "details": str(e),
            "success": False
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
