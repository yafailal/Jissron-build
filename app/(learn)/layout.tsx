import { Toaster } from "@/components/ui/sonner";

// Full-screen layout for the lesson viewer — no marketing nav or footer.
// Inherits root layout (fonts, globals) but nothing else.
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" richColors />
    </>
  );
}
