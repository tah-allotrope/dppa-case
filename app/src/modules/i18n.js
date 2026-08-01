// PHASE-03 (plans/2026-07-25-guardrail-integrity-and-localization-plan.md): language
// resolution (S3) and per-key English-fallback lookup (S4). Semicolons + double quotes,
// matching theme.js, the nearest sibling module.
import { STRINGS } from "../data/strings.js";

const STORAGE_KEY = "dppa-lang";
const SUPPORTED = ["en", "vi", "zh"];

let activeLang = "en";
const warnedKeys = new Set();

export function resolveLang(
  search = window.location.search,
  storage = window.localStorage,
  navigatorLanguage = navigator.language,
) {
  const params = new URLSearchParams(search);
  const fromSearch = params.get("lang");
  if (SUPPORTED.includes(fromSearch)) {
    try {
      storage.setItem(STORAGE_KEY, fromSearch);
    } catch {
      // storage may be unavailable (e.g. private mode); resolution still succeeds.
    }
    return fromSearch;
  }

  const fromStorage = storage ? storage.getItem(STORAGE_KEY) : null;
  if (SUPPORTED.includes(fromStorage)) return fromStorage;

  const nav = (navigatorLanguage || "").toLowerCase();
  if (nav.startsWith("vi")) return "vi";
  if (nav.startsWith("zh")) return "zh";

  return "en";
}

export function setLang(lang) {
  const normalized = SUPPORTED.includes(lang) ? lang : "en";
  activeLang = normalized;
  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // ignore storage failures
  }
  document.documentElement.lang = normalized;
  return normalized;
}

export function initI18n(search = window.location.search) {
  const lang = resolveLang(search);
  activeLang = lang;
  document.documentElement.lang = lang;
  return lang;
}

export function getActiveLang() {
  return activeLang;
}

export function t(key) {
  const langValue = STRINGS[activeLang]?.[key];
  if (langValue !== undefined && langValue !== "UNTRANSLATED") return langValue;

  const enValue = STRINGS.en[key];
  if (enValue !== undefined) return enValue;

  if (!warnedKeys.has(key)) {
    warnedKeys.add(key);
    console.warn(`i18n: missing key "${key}"`);
  }
  return key;
}
