# Security Audit: attack-path-optimizer.html

**Date:** 2026-02-27
**Scope:** `attack-path-optimizer.html` (sole active file, 4446 lines)
**Status:** Findings documented, remediation pending

---

## HIGH Severity

### 1. Unpinned CDN Dependencies Without SRI Hashes
**Lines 8-10**

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
```

- `react@18` resolves to latest 18.x — not pinned to exact version
- Babel has no version specifier at all
- No `integrity` (SRI) attributes on any script tag
- Babel tag missing `crossorigin` attribute

**Attack scenario:** CDN compromise or malicious package version injects arbitrary JS into every user session.

**Fix:** Pin exact versions (`react@18.3.1`, etc.), add `integrity="sha384-..."` and `crossorigin="anonymous"` on all script tags.

### 2. No Content Security Policy
No `<meta http-equiv="Content-Security-Policy">` tag exists. Any XSS vector would have unrestricted access to the page. Note: Babel Standalone forces `'unsafe-eval'` in any CSP (see issue #3).

**Fix:** Add CSP meta tag. Full CSP effectiveness requires removing Babel Standalone first.

---

## MEDIUM Severity

### 3. Babel Standalone Requires `unsafe-eval`
**Lines 10, 33**

The entire app (~4400 lines of JSX) is compiled at runtime via Babel's `eval()`/`new Function()`. This:
- Forces `'unsafe-eval'` in any CSP, significantly weakening it
- Adds ~3MB to page load (Babel Standalone)
- Expands the attack surface

**Fix:** Pre-compile JSX to plain JS, remove Babel Standalone entirely.

### 4. No Clickjacking Protection

No `frame-ancestors` CSP directive, no `X-Frame-Options`, no frame-busting JS. The app could be embedded in an attacker's iframe to trick users into clicking "Apply Optimal" or "Mark as Remediated".

**Fix:** Add `frame-ancestors 'none'` to CSP + frame-busting JS at top of script.

### 5. CSV Formula Injection
**Lines ~2709-2747, ~2791-2833**

CSV exports (`exportCSV`, `exportRemediationPlan`) write technique names/descriptions directly into cells. Data sourced from uploaded STIX files could contain payloads like `=CMD("calc")` that execute when opened in Excel.

**Fix:** Prefix any CSV cell value starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with a single quote (`'`).

### 6. PopoutPanel Uses innerHTML
**Lines 2086-2094**

Pop-out windows set `win.document.head.innerHTML` with hardcoded strings. Currently safe (no user data interpolated), but the pattern is fragile and pop-out windows inherit no CSP.

**Fix:** Use `document.createElement()` / `appendChild()` instead of `innerHTML`.

---

## LOW Severity

### 7. Google Fonts Privacy Leak
**Lines 7, 2087**

Every page load (+ every pop-out) sends visitor IP/User-Agent/Referer to `fonts.googleapis.com` and `fonts.gstatic.com`. For a cybersecurity posture tool, this reveals which organizations are using it.

**Fix:** Self-host JetBrains Mono woff2 files in a `fonts/` directory, replace `<link>` with `@font-face`.

### 8. unpkg.com Privacy Leak
**Lines 8-10**

Three requests to `unpkg.com` on every page load also leak visitor info to a third party.

**Fix:** Self-host React and ReactDOM.

### 9. Hash Parameters Lack Strict Validation
**Lines ~2156-2173**

`decodeHashToState` accepts arbitrary strings for `dataSource`, `envPreset`, etc. without allowlist validation. Values flow into React state safely (no HTML injection), but crafted shared URLs could present misleading assessment configurations.

**Fix:** Add allowlist validation for `dataSource`, `envPreset`, `sectorFilter`, and range check for `budget`.

### 10. No Upload Size Limit
**Lines ~2575-2591**

`handleStixFileUpload` reads files via `FileReader` without checking `file.size`. A multi-GB file could crash the browser tab.

**Fix:** Add `if (file.size > 100 * 1024 * 1024) { setUploadError("File too large"); return; }`.

### 11. STIX Fetch Uses Unpinned master Branch
**Line ~1225**

```javascript
fetch("https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json")
```

Fetches from `master` branch which can change at any time. A repository compromise would serve malicious STIX data.

**Fix:** Pin to a specific release tag (e.g., `ATT%26CK-v16.1`).

### 12. No Fetch Cancellation
**Lines ~2422-2443**

Rapid data source toggling fires multiple concurrent fetches without `AbortController`.

**Fix:** Add `AbortController` to cancel in-flight requests when data source changes.

---

## Positive Findings

- **No `innerHTML` / `dangerouslySetInnerHTML` in application code** — all rendering uses React JSX (auto-escaped)
- **Safe `JSON.parse()` deserialization** — localStorage and upload parsing wrapped in try/catch
- **No `eval()` / `new Function()` in application code** — only Babel uses these internally
- **STIX description cleaning** — regex strips markdown/citations before display

---

## Remediation Priority

| Tier | Action | Issues |
|------|--------|--------|
| **1 — Now** | Pin CDN versions + add SRI hashes | #1 |
| **1 — Now** | Add CSV formula injection protection | #5 |
| **2 — Soon** | Pre-compile JSX, remove Babel Standalone | #3 |
| **2 — Soon** | Add CSP meta tag + frame protection | #2, #4 |
| **2 — Soon** | Replace PopoutPanel innerHTML with DOM API | #6 |
| **3 — Later** | Self-host fonts and dependencies | #7, #8 |
| **3 — Later** | Input validation, size limits, fetch cancellation | #9-12 |
