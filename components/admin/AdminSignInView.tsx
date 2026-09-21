"use client";

import { useEffect } from "react";
import { SignInModalProvider } from "@/components/auth/SignInModalProvider";
import { useSignInModal } from "@/context/sign-in-modal-context";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

const BAND = "linear-gradient(135deg, #064e3b 0%, #0b6b53 62%, #0e7a5a 100%)";

function AutoOpenSignInModal() {
  const { open } = useSignInModal();
  useEffect(() => {
    open();
  }, [open]);
  return null;
}

export function AdminSignInView() {
  const t = useTranslations("AdminCommon");
  return (
    <SignInModalProvider
      title={t("signInTitle")}
      subtitle={t("signInSubtitle")}
      warning={t("signInWarning")}
    >
      <div
        className="min-h-screen w-full flex items-center justify-center px-4"
        style={{ background: BAND }}
      >
        <div className="text-center text-white max-w-md">
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur grid place-items-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.01em]">{t("adminTitle")}</h1>
          <p className="text-[13.5px] text-white/70 mt-1.5">
            {t("signInContinue")}
          </p>
        </div>
        <AutoOpenSignInModal />
      </div>
    </SignInModalProvider>
  );
}
