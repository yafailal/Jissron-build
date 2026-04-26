"use client";

import { createContext, useContext } from "react";

interface SignInModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const SignInModalContext = createContext<SignInModalContextValue | null>(null);

export function useSignInModal(): SignInModalContextValue {
  const ctx = useContext(SignInModalContext);
  if (!ctx) throw new Error("useSignInModal must be used inside SignInModalProvider");
  return ctx;
}
