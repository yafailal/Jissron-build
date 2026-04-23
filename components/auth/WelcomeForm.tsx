"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="
        w-full h-11 rounded-lg bg-primary text-white font-bold text-sm
        tracking-wide transition-all duration-200
        hover:bg-primary-hover hover:-translate-y-px hover:shadow-btn
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
      "
    >
      {pending ? "Saving…" : "Continue"}
    </button>
  );
}

interface WelcomeFormProps {
  saveProfileAction: (formData: FormData) => Promise<void>;
}

export function WelcomeForm({ saveProfileAction }: WelcomeFormProps) {
  const [avatarUrl, setAvatarUrl] = useState("");

  return (
    <form action={saveProfileAction} className="space-y-5">
      {/* Hidden field carries the uploaded avatar URL */}
      <input type="hidden" name="image" value={avatarUrl} />

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-[13px] font-600 text-ink mb-1.5">
          Your name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="e.g. Yassine Afailal"
          className="
            w-full h-11 px-4 rounded-full border-[1.5px] border-line-strong
            text-sm text-ink font-500 bg-bg-soft placeholder:text-muted
            transition-all duration-200
            focus:outline-none focus:border-primary-bright focus:bg-white
            focus:ring-3 focus:ring-[rgba(0,88,184,0.18)]
          "
        />
      </div>

      {/* Avatar */}
      <div>
        <p className="text-[13px] font-600 text-ink mb-1.5">
          Profile photo <span className="text-muted font-400">(optional)</span>
        </p>
        <ImageUploadField
          endpoint="userAvatar"
          value={avatarUrl}
          onChange={setAvatarUrl}
        />
      </div>

      {/* Currency preference */}
      <div>
        <p className="text-[13px] font-600 text-ink mb-2">Preferred currency</p>
        <div className="flex gap-3">
          {(["MAD", "USD"] as const).map((c) => (
            <label
              key={c}
              className="flex-1 flex items-center gap-2 border-[1.5px] border-line-strong rounded-lg px-4 py-2.5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors"
            >
              <input
                type="radio"
                name="currency"
                value={c}
                defaultChecked={c === "MAD"}
                className="accent-primary"
              />
              <span className="text-sm font-600 text-ink">
                {c === "MAD" ? "MAD — Moroccan Dirham" : "USD — US Dollar"}
              </span>
            </label>
          ))}
        </div>
      </div>

      <SubmitButton />

      <p className="text-center text-[12px] text-muted">
        <Link href="/dashboard" className="hover:text-primary transition-colors">
          Skip for now →
        </Link>
      </p>
    </form>
  );
}
