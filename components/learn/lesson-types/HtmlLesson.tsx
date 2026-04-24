import sanitizeHtml from "sanitize-html";

interface HtmlLessonProps {
  htmlContent: string | null;
}

export function HtmlLesson({ htmlContent }: HtmlLessonProps) {
  if (!htmlContent) {
    return <p className="text-muted font-500 py-8 text-center">No content yet.</p>;
  }

  const clean = sanitizeHtml(htmlContent, {
    allowedTags: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "em", "u", "s", "ul", "ol", "li", "a", "code", "pre", "blockquote", "img", "br", "hr", "table", "thead", "tbody", "tr", "th", "td"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });

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
