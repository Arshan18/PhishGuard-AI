"""
URL Feature Extraction Module for PhishGuard AI
Extracts the 30 standard UCI Phishing Websites dataset features from raw URLs.

Academic Note & Technical Honesty:
The 30 features originate from the UCI Phishing Websites Dataset (Mohammad et al.):
1. Pure Lexical & Address Features (12 features):
   - having_IP_Address, URL_Length, Shortining_Service, having_At_Symbol,
     double_slash_redirecting, Prefix_Suffix, having_Sub_Domain, SSLfinal_State,
     port, HTTPS_token, Abnormal_URL, Redirect
2. Content & Webpage Structure Features (8 features):
   - Favicon, Request_URL, URL_of_Anchor, Links_in_tags, SFH,
     on_mouseover, RightClick, Iframe
3. Domain & DNS Heuristics (4 features):
   - Domain_registeration_length, age_of_domain, DNSRecord, Submitting_to_email
4. Reputation & Traffic Metrics (6 features):
   - web_traffic, Page_Rank, Google_Index, Links_pointing_to_page,
     Statistical_report

For features that require live DOM parsing or external third-party API keys (e.g., Google Index API, Alexa API),
this module implements transparent, academically documented static heuristics and safe fallbacks without
executing untrusted malicious code or fabricating live analysis.
"""

import re
from urllib.parse import urlparse
import numpy as np
import pandas as pd

# Exact feature names and order as required by url_scaler.joblib & url_phishing_model.keras
FEATURE_NAMES = [
    "having_IP_Address",
    "URL_Length",
    "Shortining_Service",
    "having_At_Symbol",
    "double_slash_redirecting",
    "Prefix_Suffix",
    "having_Sub_Domain",
    "SSLfinal_State",
    "Domain_registeration_length",
    "Favicon",
    "port",
    "HTTPS_token",
    "Request_URL",
    "URL_of_Anchor",
    "Links_in_tags",
    "SFH",
    "Submitting_to_email",
    "Abnormal_URL",
    "Redirect",
    "on_mouseover",
    "RightClick",
    "popUpWidnow",
    "Iframe",
    "age_of_domain",
    "DNSRecord",
    "web_traffic",
    "Page_Rank",
    "Google_Index",
    "Links_pointing_to_page",
    "Statistical_report"
]

# Known URL shortener domains
SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "goo.gl", "ow.ly", "t.co", "is.gd", "buff.ly",
    "adf.ly", "bitly.com", "bit.do", "cur.lv", "tiny.cc", "cutt.ly", "rb.gy",
    "v.gd", "s.id", "shorturl.at", "trib.al", "lnkd.in", "qr.ae"
}

# Suspicious / high-risk TLDs commonly seen in disposable phishing campaigns
SUSPICIOUS_TLDS = {
    "xyz", "top", "tk", "ml", "ga", "cf", "gq", "buzz", "fit", "rest",
    "click", "link", "work", "loan", "men", "date", "party", "trade", "bid"
}

# Established / high-reputation domains (for web traffic & page rank heuristics)
MAJOR_DOMAINS = {
    "google.com", "youtube.com", "facebook.com", "amazon.com", "wikipedia.org",
    "microsoft.com", "apple.com", "github.com", "linkedin.com", "twitter.com",
    "x.com", "instagram.com", "netflix.com", "yahoo.com", "cloudflare.com",
    "python.org", "mozilla.org", "stackoverflow.com", "w3schools.com"
}

# Common phishing keywords for statistical heuristic analysis
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
    """Ensure URL has an explicit scheme for robust parsing."""
    url = url.strip()
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url):
        return f"http://{url}"
    return url


def validate_url(raw_input: str) -> tuple[bool, str]:
    """
    Validates user input as a syntactically plausible URL or IP address.
    Returns (is_valid, error_message).
    """
    if not isinstance(raw_input, str):
        return False, "Input must be a valid text string."
    
    trimmed = raw_input.strip()
    if not trimmed:
        return False, "URL input is empty. Please enter a valid website URL."
    
    if len(trimmed) > 2048:
        return False, "URL length exceeds maximum permitted limit of 2048 characters."

    # Validate presence of a host or domain or IPv4
    norm = normalize_url(trimmed)
    try:
        parsed = urlparse(norm)
        netloc = parsed.netloc.lower()
        hostname = netloc.split(":")[0] if ":" in netloc else netloc
        if not hostname:
            return False, "Malformed URL: missing hostname or domain."
        
        # Check if hostname looks like an IP (all digits and dots)
        if re.match(r"^[\d\.]+$", hostname):
            if not IPV4_PATTERN.match(hostname):
                return False, "Malformed URL: invalid IPv4 address format (octets must be between 0 and 255)."
            return True, ""
        
        # Domain name validation
        if HEX_IP_PATTERN.match(hostname):
            return True, ""
            
        has_valid_domain = bool(re.match(r"^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$", hostname))
        
        if not has_valid_domain and hostname != "localhost":
            return False, "Malformed URL: invalid domain name or TLD syntax."
        
        return True, ""
    except Exception as e:
        return False, f"Invalid URL structure: {str(e)}"


def extract_url_features(url_string: str) -> dict:
    """
    Extracts 30 categorical features (-1, 0, 1) according to the UCI Phishing Dataset specification.
    
    Value semantics:
      1  = Legitimate pattern
      0  = Suspicious / moderate pattern
     -1  = Phishing indicator pattern
    """
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

    # 1. having_IP_Address: Phishing (-1) if IP address is used instead of domain; Legitimate (1) otherwise.
    features["having_IP_Address"] = -1 if is_ip else 1

    # 2. URL_Length: <54 -> 1 (Legitimate), 54-75 -> 0 (Suspicious), >75 -> -1 (Phishing)
    url_len = len(raw_input)
    if url_len < 54:
        features["URL_Length"] = 1
    elif 54 <= url_len <= 75:
        features["URL_Length"] = 0
    else:
        features["URL_Length"] = -1

    # 3. Shortining_Service: Phishing (-1) if domain is a known shortener; Legitimate (1) otherwise.
    features["Shortining_Service"] = -1 if is_shortener else 1

    # 4. having_At_Symbol: Phishing (-1) if '@' is in URL; Legitimate (1) otherwise.
    features["having_At_Symbol"] = -1 if "@" in raw_input else 1

    # 5. double_slash_redirecting: Phishing (-1) if '//' appears after scheme (index > 7); Legitimate (1) otherwise.
    scheme_end = raw_input.find("://")
    if scheme_end != -1:
        after_scheme = raw_input[scheme_end + 3:]
        features["double_slash_redirecting"] = -1 if "//" in after_scheme else 1
    else:
        features["double_slash_redirecting"] = -1 if "//" in raw_input else 1

    # 6. Prefix_Suffix: Phishing (-1) if '-' is in domain name (impersonation/prefix-suffix trick), raw IP, or shortener; Legitimate (1) otherwise.
    features["Prefix_Suffix"] = -1 if (has_hyphen or is_ip or is_shortener) else 1

    # 7. having_Sub_Domain: Count subdomains after stripping www and TLD
    # <= 1 dot in base domain -> 1 (Legitimate), 2 dots -> 0 (Suspicious), >2 dots -> -1 (Phishing)
    if len(parts) <= 2:
        features["having_Sub_Domain"] = 1
    elif len(parts) == 3:
        features["having_Sub_Domain"] = 0
    else:
        features["having_Sub_Domain"] = -1

    # 8. SSLfinal_State:
    # UCI Dataset: 1 = Trusted CA & Certificate Age >= 1 year; 0 = Suspicious SSL/unverified domain; -1 = No SSL / HTTP
    if not raw_input.lower().startswith("https://"):
        features["SSLfinal_State"] = -1
    elif is_major:
        features["SSLfinal_State"] = 1
    elif suspicious_domain:
        features["SSLfinal_State"] = 0
    else:
        features["SSLfinal_State"] = 1

    # 9. Domain_registeration_length: Phishing (-1) if expiring/registered <= 1 yr; Legitimate (1) if > 1 yr.
    if is_major:
        features["Domain_registeration_length"] = 1
    elif suspicious_domain:
        features["Domain_registeration_length"] = -1
    else:
        features["Domain_registeration_length"] = 1

    # 10. Favicon: External favicon origin -> -1; Internal -> 1. Safe default: 1
    features["Favicon"] = 1

    # 11. port: Non-standard open port in URL -> -1; standard (none or 80/443/8080) -> 1
    if ":" in netloc:
        port_str = netloc.split(":")[1]
        features["port"] = 1 if port_str in {"80", "443", "8080"} else -1
    else:
        features["port"] = 1

    # 12. HTTPS_token: Phishing (-1) if 'https' is injected as a token in the domain name; Legitimate (1) otherwise.
    features["HTTPS_token"] = -1 if "https" in hostname else 1

    # 13. Request_URL: % of external objects. Static Fallback: 1
    features["Request_URL"] = 1

    # 14. URL_of_Anchor: % of external or empty anchors (#).
    if "#" in raw_input or "javascript:" in full_url or is_shortener:
        features["URL_of_Anchor"] = -1
    else:
        features["URL_of_Anchor"] = 1

    # 15. Links_in_tags: % of links in <meta>, <script>, <link>. Static Fallback: 1
    features["Links_in_tags"] = 1

    # 16. SFH (Server Form Handler): Empty or about:blank -> -1; else 1. Static Fallback: 1
    features["SFH"] = 1

    # 17. Submitting_to_email: Phishing (-1) if mailto: or mail() in URL/action; else 1
    features["Submitting_to_email"] = -1 if ("mailto:" in full_url or "mail(" in full_url) else 1

    # 18. Abnormal_URL: Hostname missing or not present in URL structure -> -1; else 1
    features["Abnormal_URL"] = 1 if (hostname and hostname in full_url and not is_shortener) else -1

    # 19. Redirect: Multiple redirects or redirect query parameters -> -1; else 1
    has_redirect_param = any(p in full_url for p in ["redirect=", "url=", "rdir=", "goto=", "next=", "dest="])
    features["Redirect"] = -1 if (has_redirect_param or is_shortener) else 1

    # 20. on_mouseover: Status bar alteration. Static Fallback: 1
    features["on_mouseover"] = 1

    # 21. RightClick: Right-click disabled. Static Fallback: 1
    features["RightClick"] = 1

    # 22. popUpWidnow: Popup forms. Static Fallback: 1
    features["popUpWidnow"] = 1

    # 23. Iframe: Invisible iframe usage. Static Fallback: 1
    features["Iframe"] = 1

    # 24. age_of_domain: Age >= 6 months -> 1; < 6 months -> -1
    if is_major:
        features["age_of_domain"] = 1
    elif suspicious_domain:
        features["age_of_domain"] = -1
    else:
        features["age_of_domain"] = 1

    # 25. DNSRecord: Resolvable host -> 1; unresolvable / invalid -> -1
    if is_ip or (suspicious_domain and tld in SUSPICIOUS_TLDS):
        features["DNSRecord"] = -1
    else:
        features["DNSRecord"] = 1

    # 26. web_traffic: Alexa rank < 100,000 -> 1; > 100,000 -> 0; no traffic -> -1
    if is_major:
        features["web_traffic"] = 1
    elif suspicious_domain:
        features["web_traffic"] = -1
    else:
        features["web_traffic"] = 0

    # 27. Page_Rank: PageRank >= 0.2 -> 1; < 0.2 -> -1
    features["Page_Rank"] = 1 if is_major else -1

    # 28. Google_Index: Indexed in Google -> 1; not indexed -> -1
    if is_major:
        features["Google_Index"] = 1
    elif suspicious_domain:
        features["Google_Index"] = -1
    else:
        features["Google_Index"] = 1

    # 29. Links_pointing_to_page: > 2 links -> 1; 1-2 -> 0; 0 -> -1
    if is_major:
        features["Links_pointing_to_page"] = 1
    elif suspicious_domain:
        features["Links_pointing_to_page"] = -1
    else:
        features["Links_pointing_to_page"] = 0

    # 30. Statistical_report: Matches known phishing keywords or suspicious combinations -> -1; else 1
    if (has_phish_kw or is_ip or is_shortener) and not is_major:
        features["Statistical_report"] = -1
    else:
        features["Statistical_report"] = 1

    return features


def extract_features_df(url_string: str) -> pd.DataFrame:
    """
    Extracts the exact 30 features and returns a pandas DataFrame with shape (1, 30)
    retaining column names to match url_scaler schema.
    """
    feature_dict = extract_url_features(url_string)
    
    if len(feature_dict) != 30:
        raise ValueError(f"Expected 30 features, but extracted {len(feature_dict)} features.")
    
    vector = [feature_dict[name] for name in FEATURE_NAMES]
    return pd.DataFrame([vector], columns=FEATURE_NAMES, dtype=np.float32)


def extract_features_vector(url_string: str) -> np.ndarray:
    """
    Extracts the exact 30 features and returns a 2D numpy array with shape (1, 30)
    ordered exactly according to FEATURE_NAMES.
    """
    df = extract_features_df(url_string)
    return df.values
