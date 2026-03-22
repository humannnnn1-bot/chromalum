import React from "react";
import { useTranslation } from "../i18n";

export const LanguageSwitcher = React.memo(function LanguageSwitcher() {
  const { lang, setLang, t } = useTranslation();
  return (
    <button
      onClick={() => setLang(lang === "ja" ? "en" : "ja")}
      style={{ background: "none", border: "1px solid #3a3a5a", color: "#5a5a8a", borderRadius: 3, cursor: "pointer", padding: "0 4px", fontSize: 9, fontWeight: 700 }}
    >
      {t("lang_switch")}
    </button>
  );
});
