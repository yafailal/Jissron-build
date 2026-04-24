interface TextLessonProps {
  textContent: string | null;
}

export function TextLesson({ textContent }: TextLessonProps) {
  if (!textContent) {
    return <p className="text-muted font-500 py-8 text-center">No content yet.</p>;
  }

  // textContent may be HTML (from the RichTextEditor in admin) or plain text.
  // Render as-is inside a prose wrapper; no sanitization needed since admin-authored only.
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(textContent);

  if (looksLikeHtml) {
    return (
      <div
        className="prose prose-sm sm:prose max-w-none
          prose-headings:font-700 prose-headings:text-ink
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-ink prose-strong:font-700"
        dangerouslySetInnerHTML={{ __html: textContent }}
      />
    );
  }

  return (
    <div className="whitespace-pre-wrap text-[14px] text-body-text leading-relaxed font-500">
      {textContent}
    </div>
  );
}
