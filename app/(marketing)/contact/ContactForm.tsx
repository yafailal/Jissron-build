"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, Check } from "lucide-react";
import { toast } from "sonner";
import { submitContactMessage } from "@/lib/actions/contact";

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  if (sent) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500 grid place-items-center mb-3">
          <Check className="w-5 h-5 text-white" />
        </div>
        <p className="text-[14px] font-700 text-emerald-800 mb-1">Message sent</p>
        <p className="text-[12.5px] text-emerald-700">
          We&apos;ll reply to <span className="font-700">{email}</span> as soon as we can.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r = await submitContactMessage({ name, email, subject, message, website });
          if (r.ok) {
            setSent(true);
          } else {
            toast.error(r.error);
          }
        });
      }}
      className="bg-white border border-line rounded-xl p-5 space-y-4"
    >
      <input
        type="text"
        name="website"
        autoComplete="off"
        tabIndex={-1}
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute -left-[9999px] w-px h-px overflow-hidden"
        aria-hidden="true"
      />

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-700 uppercase tracking-wider text-muted mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className="w-full h-10 px-3 rounded-md border border-line text-[13px] text-ink bg-white focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-700 uppercase tracking-wider text-muted mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={200}
            className="w-full h-10 px-3 rounded-md border border-line text-[13px] text-ink bg-white focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-700 uppercase tracking-wider text-muted mb-1">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          minLength={3}
          maxLength={150}
          placeholder="What's this about?"
          className="w-full h-10 px-3 rounded-md border border-line text-[13px] text-ink bg-white focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors"
        />
      </div>

      <div>
        <label className="block text-[11px] font-700 uppercase tracking-wider text-muted mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          placeholder="Tell us what's on your mind."
          className="w-full px-3 py-2.5 rounded-md border border-line text-[13px] text-ink bg-white focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors resize-y"
        />
        <p className="text-[10.5px] text-muted mt-1 text-right">{message.length}/5000</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-md bg-primary text-white text-[13px] font-700 hover:bg-primary-hover transition-colors disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send message
          </>
        )}
      </button>
    </form>
  );
}
