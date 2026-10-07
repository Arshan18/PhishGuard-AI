"""
End-to-End API Inference Audit for PhishGuard AI
Tests 12 Malicious URL samples and 12 Legitimate URL samples via POST /api/scan-url.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:5000"

print("=" * 110)
print("PHISHGUARD AI - 12 MALICIOUS & 12 LEGITIMATE SAMPLES API AUDIT")
print("=" * 110)

malicious_test_samples = [
    "http://192.0.2.10/login/verify",
    "http://secure-login.example.com/account/verify",
    "http://paypal-login.example.com/security",
    "http://account-verification.example.com/login",
    "http://bank-security.example.com/update",
    "http://password-reset.example.com/confirm",
    "http://payment-verification.example.com/login",
    "http://secure-account.example.com/verify",
    "http://login-confirm.example.com/session",
    "http://crypto-wallet.example.com/verify",
    "http://secure-online-banking-login.suspicious-domain.xyz/auth/signin",
    "http://paypal-account-security-update.suspicious-domain.xyz/login/verify.php"
]

legitimate_test_samples = [
    "https://www.google.com",
    "https://www.microsoft.com",
    "https://www.apple.com",
    "https://www.amazon.com",
    "https://www.wikipedia.org",
    "https://www.github.com",
    "https://www.python.org",
    "https://www.mozilla.org",
    "https://www.linkedin.com",
    "https://www.reddit.com",
    "https://www.cloudflare.com",
    "https://www.example.com"
]

print("\n--- MALICIOUS SAMPLES TEST (Expected: Phishing Detected) ---")
print(f"{'URL':65s} | {'Raw Probability':15s} | {'Percentage':12s} | {'Prediction':12s}")
print("-" * 110)

for url in malicious_test_samples:
    resp = requests.post(f"{BASE_URL}/api/scan-url", json={"url": url}, timeout=5)
    data = resp.json()
    prob = data.get("phishing_probability", 0.0)
    pct = data.get("phishing_percentage", 0.0)
    pred = data.get("prediction", "Unknown")
    print(f"{url:65s} | {prob:15.6f} | {pct:10.2f}% | {pred:12s}")

print("\n--- LEGITIMATE SAMPLES TEST (Expected: Legitimate URL) ---")
print(f"{'URL':65s} | {'Raw Probability':15s} | {'Percentage':12s} | {'Prediction':12s}")
print("-" * 110)

for url in legitimate_test_samples:
    resp = requests.post(f"{BASE_URL}/api/scan-url", json={"url": url}, timeout=5)
    data = resp.json()
    prob = data.get("phishing_probability", 0.0)
    pct = data.get("phishing_percentage", 0.0)
    pred = data.get("prediction", "Unknown")
    print(f"{url:65s} | {prob:15.6f} | {pct:10.2f}% | {pred:12s}")

print("\n" + "=" * 110)
print("AUDIT COMPLETE")
print("=" * 110)
