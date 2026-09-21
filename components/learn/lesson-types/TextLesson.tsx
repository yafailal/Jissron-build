import { getTranslations } from "next-intl/server";

interface TextLessonProps {
  textContent: string | null;
}

export async function TextLesson({ textContent }: TextLessonProps) {
  if (!textContent) {
    const t = await getTranslations("Learn");
    return <p className="text-muted font-medium py-8 text-center">{t("lesson.noContent")}</p>;
  }

  // textContent may be HTML (from the RichTextEditor in admin) or plain text.
  // Render as-is inside a prose wrapper; no sanitization needed since admin-authored only.
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(textContent);

  if (looksLikeHtml) {
    return (
      <div
        className="prose prose-sm sm:prose max-w-none
          prose-headings:font-bold prose-headings:text-ink
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-ink prose-strong:font-bold"
        dangerouslySetInnerHTML={{ __html: textContent }}
      />
    );
  }

  return (
    <div className="whitespace-pre-wrap text-[14px] text-body-text leading-relaxed font-medium">
      {textContent}
    </div>
  );
}
