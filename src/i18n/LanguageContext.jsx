import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "./translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem("nemesis_lang") || "az");

  useEffect(() => {
    localStorage.setItem("nemesis_lang", lang);
  }, [lang]);

  const text = translations[lang] || translations.az;

  return (
    <LanguageContext.Provider value={{ lang, setLang, text }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}