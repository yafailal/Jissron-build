"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSignInModal } from "@/context/sign-in-modal-context";

// Inside the marketing SignInModalProvider. If the URL has `?signin=1`,
// auto-open the modal once on mount. Used so old /signin links and
// NextAuth's default unauthenticated redirect still surface the popup.
export function AutoOpenSignInOnQuery() {
  const { open } = useSignInModal();
  const sp = useSearchParams();
  useEffect(() => {
    if (sp.get("signin") === "1") {
      open();
    }
  }, [sp, open]);
  return null;
}
