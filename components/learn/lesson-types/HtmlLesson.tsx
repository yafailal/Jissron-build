import DOMPurify from "isomorphic-dompurify";

interface HtmlLessonProps {
  htmlContent: string | null;
}

export function HtmlLesson({ htmlContent }: HtmlLessonProps) {
  if (!htmlContent) {
    return <p className="text-muted font-500 py-8 text-center">No content yet.</p>;
  }

  const clean = DOMPurify.sanitize(htmlContent);

  return (
    <div
      className="prose prose-sm sm:prose max-w-none
        prose-headings:font-700 prose-headings:text-ink
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-ink prose-strong:font-700
        prose-ul:list-disc prose-ol:list-decimal
        prose-img:rounded-xl prose-img:border prose-img:border-line"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
