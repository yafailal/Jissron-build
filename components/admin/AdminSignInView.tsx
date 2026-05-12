"use client";

import { useEffect } from "react";
import { SignInModalProvider } from "@/components/auth/SignInModalProvider";
import { useSignInModal } from "@/context/sign-in-modal-context";
import { Lock } from "lucide-react";

const NAVY = "#1E2A49";

function AutoOpenSignInModal() {
  const { open } = useSignInModal();
  useEffect(() => {
    open();
  }, [open]);
  return null;
}

export function AdminSignInView() {
  return (
    <SignInModalProvider
      title="Admin Interface Login"
      subtitle="Sign in with your admin account."
      warning="Beware if you're not an admin!"
    >
      <div
        className="min-h-screen w-full flex items-center justify-center px-4"
        style={{ backgroundColor: NAVY }}
      >
        <div className="text-center text-white max-w-md">
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur grid place-items-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.01em]">JissrON Admin</h1>
          <p className="text-[13.5px] text-white/70 mt-1.5">
            Sign in with your admin account to continue.
          </p>
        </div>
        <AutoOpenSignInModal />
      </div>
    </SignInModalProvider>
  );
}
