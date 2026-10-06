import requests
import json

BASE_URL = "http://127.0.0.1:5000"

test_cases = [
    {
        "name": "1. Normal Business Meeting Email",
        "subject": "Sprint Planning Meeting - Agenda for Thursday",
        "content": "Hi Team,\n\nPlease find attached the agenda for our sprint review on Thursday at 2:00 PM. We will go over the feature milestones, code reviews, and test coverage metrics.\n\nLet me know if you would like to add any discussion points.\n\nBest regards,\nAlex"
    },
    {
        "name": "2. High-Urgency Phishing Bank Scam",
        "subject": "URGENT: Your Account Has Been Suspended!",
        "content": "Dear Customer,\n\nWe detected unauthorized login attempts on your banking account. Your access is currently frozen. Please click the secure link below to verify your identity and restore access within 24 hours:\n\nhttp://security-verify-bank-update.xyz/login\n\nFailure to do so will result in permanent suspension.\n\nSecurity Department"
    },
    {
        "name": "3. Short Neutral Email",
        "subject": "",
        "content": "Hello, how are you doing today? Hope everything is going well with your project."
    },
    {
        "name": "4. Promotional Prize Scam",
        "subject": "YOU WON A GIFT CARD!",
        "content": "CONGRATULATIONS! You have been selected as our lucky winner to claim a $1,000 Walmart gift card! Click http://claim-free-rewards.xyz now to receive your instant money payout before it expires!"
    },
    {
        "name": "5. Normal Business Meeting Email (Repeated to test consistency)",
        "subject": "Sprint Planning Meeting - Agenda for Thursday",
        "content": "Hi Team,\n\nPlease find attached the agenda for our sprint review on Thursday at 2:00 PM. We will go over the feature milestones, code reviews, and test coverage metrics.\n\nLet me know if you would like to add any discussion points.\n\nBest regards,\nAlex"
    }
]

print("="*70)
print("PHISHGUARD AI — END-TO-END API INFERENCE AUDIT")
print("="*70)

for tc in test_cases:
    payload = {
        "subject": tc["subject"],
        "content": tc["content"],
        "email_text": tc["content"]
    }
    
    resp = requests.post(f"{BASE_URL}/api/scan-email", json=payload)
    if resp.status_code == 200:
        data = resp.json()
        print(f"\nTest Case: {tc['name']}")
        print(f"  Subject: '{tc['subject']}'")
        print(f"  Text Length: {data.get('text_length')} chars")
        print(f"  Prediction Label: {data.get('prediction')} (is_phishing: {data.get('is_phishing')})")
        print(f"  Phishing Risk: {data.get('phishing_risk')} ({data.get('phishing_risk') * 100:.2f}%)")
        print(f"  Model Confidence: {data.get('model_confidence')} ({data.get('model_confidence') * 100:.2f}%)")
        print(f"  Probabilities: {data.get('probabilities')}")
    else:
        print(f"\nTest Case: {tc['name']} FAILED: {resp.status_code} - {resp.text}")

print("\n" + "="*70)
print("AUDIT COMPLETE")
print("="*70)
