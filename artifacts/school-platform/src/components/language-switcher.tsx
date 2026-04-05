import { useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: {
            pageLanguage: string;
            includedLanguages?: string;
            autoDisplay?: boolean;
          },
          elementId: string,
        ) => unknown;
      };
    };
  }
}

const TRANSLATE_ELEMENT_ID = "google_translate_element";
const LANG_COOKIE_NAME = "googtrans";

function hideGoogleTranslateChrome() {
  const selectors = [
    ".goog-te-banner-frame",
    ".goog-te-balloon-frame",
    "#goog-gt-tt",
    ".VIpgJd-ZVi9od-ORHb-OEVmcd",
    ".VIpgJd-ZVi9od-aZ2wEe-wOHMyf",
    ".VIpgJd-yAWNEb-L7lbkb",
    "iframe.skiptranslate",
    "body > .skiptranslate",
  ];

  for (const selector of selectors) {
    document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      node.style.display = "none";
      node.style.visibility = "hidden";
      node.style.maxHeight = "0";
      node.style.pointerEvents = "none";
    });
  }

  document.documentElement.style.top = "0px";
  document.body.style.top = "0px";
}

function setGoogleTranslateCookie(language: "en" | "hi") {
  const value = `/en/${language}`;
  document.cookie = `${LANG_COOKIE_NAME}=${value}; path=/`;
  document.cookie = `${LANG_COOKIE_NAME}=${value}; path=/; domain=${window.location.hostname}`;
}

function getLanguageFromCookie(): "en" | "hi" {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LANG_COOKIE_NAME}=`));

  if (!cookie) return "en";
  return cookie.endsWith("/hi") ? "hi" : "en";
}

function applyLanguageToGoogleDropdown(language: "en" | "hi"): boolean {
  const selectField = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!selectField) return false;

  if (selectField.value !== language) {
    selectField.value = language;
    selectField.dispatchEvent(new Event("change"));
  }

  return true;
}

function ensureGoogleTranslateScript() {
  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-google-translate="true"]',
  );
  if (existing) return;

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.setAttribute("data-google-translate", "true");
  document.body.appendChild(script);
}

export function LanguageSwitcher() {
  const [language, setLanguage] = useState<"en" | "hi">(() => getLanguageFromCookie());
  const [isTranslatorReady, setIsTranslatorReady] = useState(false);

  useEffect(() => {
    // Keep English as default language when no prior preference is present.
    setGoogleTranslateCookie(language);
    hideGoogleTranslateChrome();

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,hi",
          autoDisplay: false,
        },
        TRANSLATE_ELEMENT_ID,
      );
      setIsTranslatorReady(true);
    };

    ensureGoogleTranslateScript();

    const observer = new MutationObserver(() => {
      hideGoogleTranslateChrome();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    const cleanupInterval = window.setInterval(() => {
      hideGoogleTranslateChrome();
    }, 400);

    return () => {
      window.clearInterval(cleanupInterval);
      observer.disconnect();
      delete window.googleTranslateElementInit;
    };
  }, []);

  useEffect(() => {
    if (!isTranslatorReady) return;

    const interval = window.setInterval(() => {
      const applied = applyLanguageToGoogleDropdown(language);
      if (applied) window.clearInterval(interval);
    }, 150);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
    }, 3000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [language, isTranslatorReady]);

  const isHindi = useMemo(() => language === "hi", [language]);

  const handleToggleLanguage = () => {
    const nextLanguage: "en" | "hi" = language === "en" ? "hi" : "en";
    setGoogleTranslateCookie(nextLanguage);
    setLanguage(nextLanguage);
  };

  return (
    <>
      <div id={TRANSLATE_ELEMENT_ID} className="google-translate-hidden" aria-hidden="true" />

      <button
        type="button"
        onClick={handleToggleLanguage}
        className="rounded-full border border-gray-300 bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-md backdrop-blur transition hover:bg-white"
        aria-label="Switch language between English and Hindi"
        title="Switch language"
      >
        <span className={isHindi ? "text-gray-400" : "text-gray-900"}>EN</span>
        <span className="mx-1 text-gray-400">|</span>
        <span className={isHindi ? "text-gray-900" : "text-gray-400"}>HI</span>
      </button>
    </>
  );
}
