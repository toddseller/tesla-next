"use client";

import { createContext, useContext } from "react";
import type { Units } from "@/lib/units";

const UnitsContext = createContext<Units>({ temperature: "F", wind: "mph" });
export const UnitsProvider = UnitsContext.Provider;
export const useUnits = () => useContext(UnitsContext);
