import { createContext } from "react";

export const LangContext = createContext({
  lang: "en",
  t: (k) => k,
  fmtDate: () => ""
});
