# Security Audit: attack-path-optimizer.html

**Date:** 2026-02-27
**Scope:** `attack-path-optimizer.html` (sole active file, 4446 lines)
**Status:** Remediation complete (2026-03-02) — 10 of 12 issues resolved, 2 deferred

---

## HIGH Severity

### 1. Unpinned CDN Dependencies Without SRI Hashes
**Lines 8-10** | **RESOLVED 2026-03-02**

Pinned exact versions (`react@18.3.1`, `react-dom@18.3.1`, `@babel/standalone@7.26.9`) with `integrity="sha384-..."` and `crossorigin="anonymous"` on all script tags.

### 2. No Content Security Policy
**RESOLVED 2026-03-02**

Added `<meta http-equiv="Content-Security-Policy">` with directives: `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `font-src https://fonts.gstatic.com`, `connect-src https://raw.githubusercontent.com`, `img-src 'self' data: blob:`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`. Note: `unsafe-inline` and `unsafe-eval` both required by Babel Standalone (see #3) — it injects transpiled code as inline `<script>` elements and uses `new Function()` internally.

---

## MEDIUM Severity

### 3. Babel Standalone Requires `unsafe-eval`
**Lines 10, 33** | **DEFERRED** — architectural change

The entire app (~4400 lines of JSX) is compiled at runtime via Babel's `eval()`/`new Function()`. This:
- Forces `'unsafe-eval'` in any CSP, significantly weakening it
- Adds ~3MB to page load (Babel Standalone)
- Expands the attack surface

**Fix:** Pre-compile JSX to plain JS, remove Babel Standalone entirely. Requires build toolchain change.

### 4. No Clickjacking Protection
**RESOLVED 2026-03-02**

Added `frame-ancestors 'none'` in CSP meta tag + frame-busting JS (`if (window.top !== window.self)`) at top of script.

### 5. CSV Formula Injection
**RESOLVED 2026-03-02**

Added `sanitizeCSVCell()` utility that prefixes cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` with a single quote. Applied to all user-controlled string fields in `exportCSV` and `exportRemediationPlan`.

### 6. PopoutPanel Uses innerHTML
**RESOLVED 2026-03-02**

Replaced `win.document.head.innerHTML = ...` with `document.createElement()`/`appendChild()` for the `<link>` element and `style.textContent` for the `<style>` element.

---

## LOW Severity

### 7. Google Fonts Privacy Leak
**Lines 7, 2087** | **DEFERRED** — deployment model change

Self-hosting Google Fonts changes the standalone single-file deployment model. TODO comment added. SRI hashes (#1) and CSP (#2) mitigate integrity risks; privacy leak remains.

### 8. unpkg.com Privacy Leak
**Lines 8-10** | **DEFERRED** — deployment model change

Self-hosting React/ReactDOM changes the standalone single-file deployment model. TODO comment added. SRI hashes (#1) protect integrity; privacy leak remains.

### 9. Hash Parameters Lack Strict Validation
**RESOLVED 2026-03-02**

Added allowlist validation in `decodeHashToState`: `dataSource` (`stix`/`builtin`), `envPreset` (keys of `ENV_PRESETS`), `sectorFilter` (`all`/`government`/`financial`), `budget` (range 1-10), `selectedPlatforms` (validated against `ALL_PLATFORMS`), `controlPreset` (keys of `CONTROL_PRESETS`). Invalid values are silently dropped (app uses defaults).

### 10. No Upload Size Limit
**RESOLVED 2026-03-02**

Added `file.size > 100 * 1024 * 1024` guard to both `handleStixFileUpload` and `handleNavigatorImport`. Oversized files show error and are not read.

### 11. STIX Fetch Uses Unpinned master Branch
**RESOLVED 2026-03-02**

Changed fetch URL from `cti/master/` to `cti/ATT%26CK-v16.1/` and cache key from `enterprise-attack-v5` to `enterprise-attack-v16.1`.

### 12. No Fetch Cancellation
**RESOLVED 2026-03-02**

Added `AbortController` in the `dataSource` `useEffect`. `loadStixData()` now accepts a `signal` parameter passed to `fetch()`. Cleanup function calls `controller.abort()`. Promise handlers check `signal.aborted` before updating state.

---

## Positive Findings

- **No `innerHTML` / `dangerouslySetInnerHTML` in application code** — all rendering uses React JSX (auto-escaped)
- **Safe `JSON.parse()` deserialization** — localStorage and upload parsing wrapped in try/catch
- **No `eval()` / `new Function()` in application code** — only Babel uses these internally
- **STIX description cleaning** — regex strips markdown/citations before display

---

## Remediation Summary

| Issue | Severity | Status | Date |
|-------|----------|--------|------|
| #1 CDN pinning + SRI | HIGH | **Resolved** | 2026-03-02 |
| #2 Content Security Policy | HIGH | **Resolved** | 2026-03-02 |
| #3 Babel unsafe-eval | MEDIUM | Deferred | — |
| #4 Clickjacking protection | MEDIUM | **Resolved** | 2026-03-02 |
| #5 CSV formula injection | MEDIUM | **Resolved** | 2026-03-02 |
| #6 PopoutPanel innerHTML | MEDIUM | **Resolved** | 2026-03-02 |
| #7 Google Fonts privacy | LOW | Deferred | — |
| #8 unpkg.com privacy | LOW | Deferred | — |
| #9 Hash validation | LOW | **Resolved** | 2026-03-02 |
| #10 Upload size limit | LOW | **Resolved** | 2026-03-02 |
| #11 STIX URL pinning | LOW | **Resolved** | 2026-03-02 |
| #12 Fetch cancellation | LOW | **Resolved** | 2026-03-02 |
