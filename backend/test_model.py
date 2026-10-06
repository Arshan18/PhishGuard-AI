import os
import joblib
import numpy as np

base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "..", "models", "email_phishing_model.joblib")

print(f"Loading model from: {model_path}")
model = joblib.load(model_path)

print("Model Type:", type(model))
print("Steps:", getattr(model, "steps", None))
print("Classes:", getattr(model, "classes_", None))

test_emails = [
    ("Normal business email", "Hi team, please find attached the agenda for Thursday sprint review meeting at 2pm. Let me know if you have any questions."),
    ("Urgent phishing bank scam", "URGENT: Your bank account has been suspended due to unauthorized login attempts! Click http://security-verify-bank.xyz/login immediately to verify your identity within 24 hours or your access will be permanently terminated."),
    ("Short neutral greeting", "Hello, how are you doing today? Hope everything is going well."),
    ("Prize scam / spam", "CONGRATULATIONS! You have been selected to win a free $1,000 Walmart gift card! Claim your prize now at http://free-gift-reward.xyz/claim"),
    ("Legit internal check-in", "Hey Alex, following up on our discussion yesterday regarding the quarterly budget spreadsheet. Are you free for lunch today?"),
    ("Security alert scam", "SECURITY ALERT: Suspicious activity detected on your Microsoft Office365 account. Log in at http://msoffice-login-auth.com to prevent suspension."),
    ("Short question", "Hey are you in the office right now?"),
    ("Normal project update", "Attached is the latest documentation draft for the IT college project. Please review section 3 and send feedback by Friday.")
]

print("\n--- TEST RESULTS ---")
for desc, text in test_emails:
    pred = model.predict([text])[0]
    proba = model.predict_proba([text])[0]
    classes = getattr(model, "classes_", [0, 1])
    phish_idx = list(classes).index(1) if 1 in classes else 1
    legit_idx = list(classes).index(0) if 0 in classes else 0
    p_phish = proba[phish_idx]
    p_legit = proba[legit_idx]
    print(f"\n[{desc}]")
    print(f"Text snippet: '{text[:60]}...'")
    print(f"Pred: {pred} ({'Phishing/Spam' if pred == 1 else 'Legitimate'}) | P(Phish): {p_phish:.6f} ({p_phish*100:.2f}%) | P(Legit): {p_legit:.6f} ({p_legit*100:.2f}%)")
