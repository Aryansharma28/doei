import { useContext } from "react";
import { LangContext } from "../context/LangContext";

export const useLang = () => useContext(LangContext);
