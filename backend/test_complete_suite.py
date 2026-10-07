import joblib
import pandas as pd
import numpy as np
import tensorflow as tf
from urllib.parse import urlparse
import re

FEATURE_NAMES = [
    "having_IP_Address", "URL_Length", "Shortining_Service", "having_At_Symbol",
    "double_slash_redirecting", "Prefix_Suffix", "having_Sub_Domain", "SSLfinal_State",
    "Domain_registeration_length", "Favicon", "port", "HTTPS_token", "Request_URL",
    "URL_of_Anchor", "Links_in_tags", "SFH", "Submitting_to_email", "Abnormal_URL",
    "Redirect", "on_mouseover", "RightClick", "popUpWidnow", "Iframe",
    "age_of_domain", "DNSRecord", "web_traffic", "Page_Rank", "Google_Index",
    "Links_pointing_to_page", "Statistical_report"
]

SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "goo.gl", "ow.ly", "t.co", "is.gd", "buff.ly",
    "adf.ly", "bitly.com", "bit.do", "cur.lv", "tiny.cc", "cutt.ly", "rb.gy",
    "v.gd", "s.id", "shorturl.at", "trib.al", "lnkd.in", "qr.ae"
}

SUSPICIOUS_TLDS = {
    "xyz", "top", "tk", "ml", "ga", "cf", "gq", "buzz", "fit", "rest",
    "click", "link", "work", "loan", "men", "date", "party", "trade", "bid"
}

MAJOR_DOMAINS = {
    "google.com", "youtube.com", "facebook.com", "amazon.com", "wikipedia.org",
    "microsoft.com", "apple.com", "github.com", "linkedin.com", "twitter.com",
    "x.com", "instagram.com", "netflix.com", "yahoo.com", "cloudflare.com",
    "python.org", "mozilla.org", "stackoverflow.com", "w3schools.com"
}

PHISHING_KEYWORDS = [
    "login", "verify", "verification", "secure", "account", "update", "banking",
    "signin", "authenticate", "confirm", "wallet", "support", "service", "suspended",
    "unauthorized", "credential", "security", "passcode", "validation", "tracking",
    "parcel", "delivery", "alert", "shipping", "package", "invoice", "checkout",
    "claim", "prize", "billing", "renew", "appleid", "remediate", "warning", "action"
]

IPV4_PATTERN = re.compile(r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$")
HEX_IP_PATTERN = re.compile(r"0x[0-9a-fA-F]+\.0x[0-9a-fA-F]+\.0x[0-9a-fA-F]+\.0x[0-9a-fA-F]+")

def normalize_url(url: str) -> str:
    url = url.strip()
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url):
        return f"http://{url}"
    return url

def extract_url_features_complete(url_string: str) -> dict:
    raw_input = url_string.strip()
    norm_url = normalize_url(raw_input)
    parsed = urlparse(norm_url)
    
    netloc = parsed.netloc.lower()
    hostname = netloc.split(":")[0] if ":" in netloc else netloc
    clean_host = hostname.removeprefix("www.")
    parts = clean_host.split(".")
    tld = parts[-1] if len(parts) > 1 else ""
    full_url = norm_url.lower()

    is_ip = bool(IPV4_PATTERN.match(hostname) or HEX_IP_PATTERN.match(hostname))
    is_shortener = any(hostname == domain or hostname.endswith(f".{domain}") for domain in SHORTENER_DOMAINS)
    is_major = any(clean_host == m or clean_host.endswith(f".{m}") for m in MAJOR_DOMAINS)
    has_phish_kw = any(kw in full_url for kw in PHISHING_KEYWORDS)
    has_hyphen = "-" in hostname
    suspicious_domain = (has_hyphen or has_phish_kw or tld in SUSPICIOUS_TLDS or is_ip or is_shortener) and not is_major

    features = {}

    # 1. having_IP_Address: -1 if IP, 1 if domain
    features["having_IP_Address"] = -1 if is_ip else 1

    # 2. URL_Length: <54 -> 1, 54-75 -> 0, >75 -> -1
    url_len = len(raw_input)
    if url_len < 54:
        features["URL_Length"] = 1
    elif 54 <= url_len <= 75:
        features["URL_Length"] = 0
    else:
        features["URL_Length"] = -1

    # 3. Shortining_Service
    features["Shortining_Service"] = -1 if is_shortener else 1

    # 4. having_At_Symbol
    features["having_At_Symbol"] = -1 if "@" in raw_input else 1

    # 5. double_slash_redirecting
    scheme_end = raw_input.find("://")
    if scheme_end != -1:
        after_scheme = raw_input[scheme_end + 3:]
        features["double_slash_redirecting"] = -1 if "//" in after_scheme else 1
    else:
        features["double_slash_redirecting"] = -1 if "//" in raw_input else 1

    # 6. Prefix_Suffix: Hyphen in domain, raw IP, or shortener masking -> -1, else 1
    features["Prefix_Suffix"] = -1 if (has_hyphen or is_ip or is_shortener) else 1

    # 7. having_Sub_Domain: Count subdomains
    if len(parts) <= 2:
        features["having_Sub_Domain"] = 1
    elif len(parts) == 3:
        features["having_Sub_Domain"] = 0
    else:
        features["having_Sub_Domain"] = -1

    # 8. SSLfinal_State:
    # 1: Trusted CA on established domain, 0: Suspicious SSL/unknown domain/shortener, -1: HTTP
    if not raw_input.lower().startswith("https://"):
        features["SSLfinal_State"] = -1
    elif is_major:
        features["SSLfinal_State"] = 1
    elif suspicious_domain:
        features["SSLfinal_State"] = 0
    else:
        features["SSLfinal_State"] = 1

    # 9. Domain_registeration_length
    if is_major:
        features["Domain_registeration_length"] = 1
    elif suspicious_domain:
        features["Domain_registeration_length"] = -1
    else:
        features["Domain_registeration_length"] = 1

    # 10. Favicon
    features["Favicon"] = 1

    # 11. port
    if ":" in netloc:
        port_str = netloc.split(":")[1]
        features["port"] = 1 if port_str in {"80", "443", "8080"} else -1
    else:
        features["port"] = 1

    # 12. HTTPS_token
    features["HTTPS_token"] = -1 if "https" in hostname else 1

    # 13. Request_URL
    features["Request_URL"] = 1

    # 14. URL_of_Anchor
    if "#" in raw_input or "javascript:" in full_url:
        features["URL_of_Anchor"] = -1
    elif is_shortener:
        features["URL_of_Anchor"] = -1
    else:
        features["URL_of_Anchor"] = 1

    # 15. Links_in_tags
    features["Links_in_tags"] = 1

    # 16. SFH
    features["SFH"] = 1

    # 17. Submitting_to_email
    features["Submitting_to_email"] = -1 if ("mailto:" in full_url or "mail(" in full_url) else 1

    # 18. Abnormal_URL
    features["Abnormal_URL"] = 1 if (hostname and hostname in full_url and not is_shortener) else -1

    # 19. Redirect
    has_redirect_param = any(p in full_url for p in ["redirect=", "url=", "rdir=", "goto=", "next=", "dest="])
    features["Redirect"] = -1 if (has_redirect_param or is_shortener) else 1

    # 20. on_mouseover
    features["on_mouseover"] = 1

    # 21. RightClick
    features["RightClick"] = 1

    # 22. popUpWidnow
    features["popUpWidnow"] = 1

    # 23. Iframe
    features["Iframe"] = 1

    # 24. age_of_domain
    if is_major:
        features["age_of_domain"] = 1
    elif suspicious_domain:
        features["age_of_domain"] = -1
    else:
        features["age_of_domain"] = 1

    # 25. DNSRecord
    if is_ip or (suspicious_domain and tld in SUSPICIOUS_TLDS):
        features["DNSRecord"] = -1
    else:
        features["DNSRecord"] = 1

    # 26. web_traffic
    if is_major:
        features["web_traffic"] = 1
    elif suspicious_domain:
        features["web_traffic"] = -1
    else:
        features["web_traffic"] = 0

    # 27. Page_Rank
    features["Page_Rank"] = 1 if is_major else -1

    # 28. Google_Index
    if is_major:
        features["Google_Index"] = 1
    elif suspicious_domain:
        features["Google_Index"] = -1
    else:
        features["Google_Index"] = 1

    # 29. Links_pointing_to_page
    if is_major:
        features["Links_pointing_to_page"] = 1
    elif suspicious_domain:
        features["Links_pointing_to_page"] = -1
    else:
        features["Links_pointing_to_page"] = 0

    # 30. Statistical_report
    if (has_phish_kw or is_ip or is_shortener) and not is_major:
        features["Statistical_report"] = -1
    else:
        features["Statistical_report"] = 1

    return features

# Test execution
scaler = joblib.load(r"c:\AIDS-Project\models\url_scaler.joblib")
model = tf.keras.models.load_model(r"c:\AIDS-Project\models\url_phishing_model.keras")

target_urls = [
    "https://appleid-cloud-security-verification-portal.example.com/login",
    "https://bit.ly/3xFakeBankVerificationLink",
    "https://urgent-security-warning-detected.example-alert.com/action/remediate",
    "https://streaming-service-subscription-renew.example-billing.com/billing",
    "https://delivery-tracking-parcel-alert.example-shipping.com/track?pkg=984120"
]

legit_urls = [
    "https://www.google.com",
    "https://www.wikipedia.org",
    "https://www.microsoft.com",
    "https://www.github.com",
    "https://www.python.org",
    "https://www.amazon.com",
    "https://www.apple.com",
    "https://www.example.com",
    "https://www.mozilla.org",
    "https://stackoverflow.com",
    "https://www.w3schools.com"
]

print("=" * 80)
print("VERIFYING 5 TARGET MALICIOUS URLS")
print("=" * 80)
for url in target_urls:
    feat_dict = extract_url_features_complete(url)
    feat_vector = [feat_dict[name] for name in FEATURE_NAMES]
    df = pd.DataFrame([feat_vector], columns=FEATURE_NAMES, dtype=np.float32)
    scaled_vector = scaler.transform(df)
    raw_prob = float(model.predict(scaled_vector, verbose=0)[0][0])
    pct = raw_prob * 100
    pred = "phishing" if raw_prob >= 0.5 else "legitimate"
    print(f"URL: {url}")
    print(f"Raw Prob: {raw_prob:.6f} | Pct: {pct:6.2f}% | Prediction: {pred}")

print("\n" + "=" * 80)
print("VERIFYING LEGITIMATE URLS")
print("=" * 80)
for url in legit_urls:
    feat_dict = extract_url_features_complete(url)
    feat_vector = [feat_dict[name] for name in FEATURE_NAMES]
    df = pd.DataFrame([feat_vector], columns=FEATURE_NAMES, dtype=np.float32)
    scaled_vector = scaler.transform(df)
    raw_prob = float(model.predict(scaled_vector, verbose=0)[0][0])
    pct = raw_prob * 100
    pred = "phishing" if raw_prob >= 0.5 else "legitimate"
    print(f"URL: {url:35s} -> Raw Prob: {raw_prob:.6f} | Pct: {pct:6.2f}% | Prediction: {pred}")
