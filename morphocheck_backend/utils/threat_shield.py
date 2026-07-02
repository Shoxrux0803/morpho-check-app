import hashlib
import os
import re
from dataclasses import dataclass, field
from typing import Iterable, Optional
from urllib.parse import unquote_plus

from fastapi import Request

MAX_BODY_SCAN_BYTES = int(os.getenv("THREAT_SHIELD_MAX_BODY_SCAN_BYTES", "65536"))
AUTO_BLOCK_RISK = int(os.getenv("THREAT_SHIELD_AUTO_BLOCK_RISK", "95"))
BLOCK_RISK = int(os.getenv("THREAT_SHIELD_BLOCK_RISK", "75"))
LOG_RISK = int(os.getenv("THREAT_SHIELD_LOG_RISK", "45"))

SQLI_PATTERNS = [
    r"(?i)\bunion\s+select\b",
    r"(?i)\bselect\b.+\bfrom\b",
    r"(?i)\bor\s+1\s*=\s*1\b",
    r"(?i)\bdrop\s+table\b",
    r"(?i)\binformation_schema\b",
    r"(?i)--\s*$",
]
XSS_PATTERNS = [
    r"(?i)<\s*script\b",
    r"(?i)javascript\s*:",
    r"(?i)onerror\s*=",
    r"(?i)onload\s*=",
    r"(?i)<\s*iframe\b",
]
PATH_TRAVERSAL_PATTERNS = [
    r"\.\./",
    r"\.\.\\",
    r"(?i)%2e%2e%2f",
    r"(?i)%2e%2e%5c",
    r"(?i)/etc/passwd",
    r"(?i)boot\.ini",
]
BOT_PATTERNS = [
    r"(?i)sqlmap",
    r"(?i)nikto",
    r"(?i)nmap",
    r"(?i)acunetix",
    r"(?i)masscan",
    r"(?i)zgrab",
    r"(?i)gobuster",
]
MALWARE_SIGNATURES = {
    b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE": "EICAR test signature",
    b"<?php": "Embedded PHP code",
    b"<script": "Embedded script tag",
    b"MZ": "Windows executable header",
}
ARCHIVE_BOMBS = {".zip", ".rar", ".7z", ".tar", ".gz"}
EXECUTABLE_EXTENSIONS = {
    ".exe", ".dll", ".bat", ".cmd", ".com", ".scr", ".ps1", ".vbs",
    ".js", ".jar", ".msi", ".apk", ".sh", ".php", ".py",
}


@dataclass
class ThreatAssessment:
    risk_score: int = 0
    severity: str = "low"
    threat_type: str = "clean"
    action: str = "allow"
    signals: list[str] = field(default_factory=list)

    @property
    def should_log(self) -> bool:
        return self.risk_score >= LOG_RISK

    @property
    def should_block(self) -> bool:
        return self.risk_score >= BLOCK_RISK

    @property
    def should_auto_block_ip(self) -> bool:
        return self.risk_score >= AUTO_BLOCK_RISK


def _add_signal(assessment: ThreatAssessment, label: str, points: int, threat_type: str):
    assessment.signals.append(label)
    assessment.risk_score = min(100, assessment.risk_score + points)
    if assessment.threat_type == "clean" or points >= 30:
        assessment.threat_type = threat_type


def _scan_patterns(value: str, patterns: Iterable[str], label: str, points: int, threat_type: str, assessment: ThreatAssessment):
    for pattern in patterns:
        if re.search(pattern, value or ""):
            _add_signal(assessment, f"{label}: {pattern}", points, threat_type)
            return


def _finalize(assessment: ThreatAssessment) -> ThreatAssessment:
    if assessment.risk_score >= 90:
        assessment.severity = "critical"
        assessment.action = "auto_block_ip"
    elif assessment.risk_score >= 75:
        assessment.severity = "high"
        assessment.action = "block_request"
    elif assessment.risk_score >= 45:
        assessment.severity = "medium"
        assessment.action = "monitor"
    else:
        assessment.severity = "low"
        assessment.action = "allow"
    return assessment


def assess_request_threat(request: Request, body: bytes = b"") -> ThreatAssessment:
    assessment = ThreatAssessment()
    content_type = (request.headers.get("content-type") or "").lower()
    user_agent = request.headers.get("user-agent") or ""
    raw_target = f"{request.method} {request.url.path}?{request.url.query} {user_agent}"
    target = f"{raw_target} {unquote_plus(raw_target)}"

    _scan_patterns(target, BOT_PATTERNS, "scanner user-agent", 55, "scanner_bot", assessment)
    _scan_patterns(target, PATH_TRAVERSAL_PATTERNS, "path traversal", 70, "path_traversal", assessment)
    _scan_patterns(target, SQLI_PATTERNS, "sql injection", 75, "sql_injection", assessment)
    _scan_patterns(target, XSS_PATTERNS, "xss", 70, "xss", assessment)

    if "multipart/form-data" not in content_type and body:
        raw_sample = body[:MAX_BODY_SCAN_BYTES].decode("utf-8", errors="ignore")
        sample = f"{raw_sample} {unquote_plus(raw_sample)}"
        _scan_patterns(sample, SQLI_PATTERNS, "body sql injection", 75, "sql_injection", assessment)
        _scan_patterns(sample, XSS_PATTERNS, "body xss", 70, "xss", assessment)
        _scan_patterns(sample, PATH_TRAVERSAL_PATTERNS, "body path traversal", 60, "path_traversal", assessment)
        if len(body) > MAX_BODY_SCAN_BYTES:
            _add_signal(assessment, "large request body sampled", 10, "large_payload")

    if not user_agent.strip():
        _add_signal(assessment, "missing user-agent", 20, "suspicious_client")
    if request.url.path.lower().endswith((".env", ".git", "wp-login.php", "xmlrpc.php")):
        _add_signal(assessment, "sensitive file/probe path", 75, "scanner_probe")

    return _finalize(assessment)


def scan_uploaded_file(filename: Optional[str], content: bytes, content_type: Optional[str] = None) -> ThreatAssessment:
    assessment = ThreatAssessment()
    name = (filename or "").lower()
    ext = os.path.splitext(name)[1]
    digest = hashlib.sha256(content).hexdigest()

    if ext in EXECUTABLE_EXTENSIONS:
        _add_signal(assessment, f"dangerous executable extension: {ext}", 85, "malicious_file")
    if ext in ARCHIVE_BOMBS and len(content) > 8 * 1024 * 1024:
        _add_signal(assessment, "large archive upload", 50, "archive_risk")
    for signature, label in MALWARE_SIGNATURES.items():
        if content.startswith(signature) or signature in content[:MAX_BODY_SCAN_BYTES]:
            _add_signal(assessment, label, 90, "malware_signature")
            break
    if b"\x00" in content[:4096] and ext in {".txt", ".csv", ".json", ".html"}:
        _add_signal(assessment, "text extension contains binary bytes", 55, "file_spoofing")
    if content_type and "html" in content_type.lower() and b"<script" in content[:MAX_BODY_SCAN_BYTES].lower():
        _add_signal(assessment, "html upload contains script", 75, "xss_file")

    if assessment.signals:
        assessment.signals.append(f"sha256:{digest}")
    return _finalize(assessment)