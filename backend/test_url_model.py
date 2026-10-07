"""
Local Verification Script for Malicious URL Phishing Detection Model
Tests URL validation, 30-feature extraction, scaler transformation, and Keras model inference.
"""

import os
import sys
import re
import joblib
import pandas as pd
import numpy as np

# Add backend directory to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from url_features import extract_url_features, extract_features_df, validate_url, FEATURE_NAMES

# TensorFlow / Keras Model Loading
from tensorflow.keras.models import load_model

MODELS_DIR = os.path.join(BASE_DIR, "..", "models")
MODEL_PATH = os.path.join(MODELS_DIR, "url_phishing_model.keras")
SCALER_PATH = os.path.join(MODELS_DIR, "url_scaler.joblib")

print("=" * 80)
print("PHISHGUARD AI - MALICIOUS URL MODEL STANDALONE TEST SUITE")
print("=" * 80)

# 1. Load Scaler and Model
print(f"[*] Loading Scaler from: {SCALER_PATH}")
url_scaler = joblib.load(SCALER_PATH)
print(f"[+] Scaler loaded. Features expected: {url_scaler.n_features_in_}")

print(f"[*] Loading Keras Model from: {MODEL_PATH}")
url_model = load_model(MODEL_PATH)
print(f"[+] Model loaded. Input shape: {url_model.input_shape}, Output shape: {url_model.output_shape}")

# Verify Feature names match
scaler_names = list(url_scaler.feature_names_in_)
assert scaler_names == FEATURE_NAMES, "Feature names or order mismatch between extractor and scaler!"
print(f"[+] Verified all {len(FEATURE_NAMES)} features match scaler schema exactly.")

# Test cases
test_urls = [
    ("Safe Authority Domain (Google)", "https://www.google.com"),
    ("Synthetic Suspicious URL", "https://secure-account-verification-example.com/login"),
    ("IP-based Banking Scam", "http://192.168.1.1/paypal/login.php"),
    ("Subdomain Spoofing Scam", "http://paypal-account-security-update.suspicious-domain.xyz/login/verify.php"),
    ("Legitimate Developer Portal", "https://www.github.com/security"),
    ("Shortened Link", "https://bit.ly/3xFakeBankLogin")
]

print("\n" + "-" * 80)
print("RUNNING URL PREDICTION PIPELINE ON TEST CASES")
print("-" * 80)

for label, raw_url in test_urls:
    print(f"\n[TEST CASE]: {label}")
    print(f"  Input URL: {raw_url}")
    
    # Feature extraction
    features_df = extract_features_df(raw_url)
    assert features_df.shape == (1, 30), f"Invalid feature shape: {features_df.shape}"
    print(f"  Extracted 30 features count: {features_df.shape[1]}")
    
    # Scale features
    scaled_vec = url_scaler.transform(features_df)
    print(f"  Scaled feature vector shape: {scaled_vec.shape}")
    
    # Model predict
    raw_pred = url_model.predict(scaled_vec, verbose=0)
    phishing_prob = float(raw_pred[0][0])
    
    # Classification: 0 = Legitimate, 1 = Phishing
    is_phishing = phishing_prob >= 0.5
    prediction = "Phishing" if is_phishing else "Legitimate"
    risk_pct = round(phishing_prob * 100, 2)
    
    print(f"  Model Phishing Probability: {phishing_prob:.6f}")
    print(f"  Risk Percentage: {risk_pct}%")
    print(f"  Final Prediction: {prediction} (is_phishing={is_phishing})")

# Test 3: Malformed URLs Handling
print("\n" + "-" * 80)
print("TESTING MALFORMED / INVALID URLS")
print("-" * 80)

malformed_inputs = [
    ("", "Empty string"),
    ("   ", "Whitespace only"),
    ("just-random-text-no-domain", "Random text without valid TLD/host"),
    ("http://", "Protocol only"),
    ("://invalid-url", "Missing scheme"),
    ("http://192.168.1.300", "Invalid IP octet")
]

for bad_url, desc in malformed_inputs:
    is_valid, err = validate_url(bad_url)
    print(f"Input: '{bad_url}' ({desc}) -> Valid: {is_valid} | Error: '{err}'")

print("\n" + "=" * 80)
print("ALL LOCAL URL TESTS COMPLETED SUCCESSFULLY")
print("=" * 80)
