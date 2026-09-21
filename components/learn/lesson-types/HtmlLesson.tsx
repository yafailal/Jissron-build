import { getTranslations } from "next-intl/server";
import sanitizeHtml from "sanitize-html";

interface HtmlLessonProps {
  htmlContent: string | null;
}

export async function HtmlLesson({ htmlContent }: HtmlLessonProps) {
  if (!htmlContent) {
    const t = await getTranslations("Learn");
    return <p className="text-muted font-medium py-8 text-center">{t("lesson.noContent")}</p>;
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
        prose-headings:font-bold prose-headings:text-ink
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-ink prose-strong:font-bold
        prose-ul:list-disc prose-ol:list-decimal
        prose-img:rounded-xl prose-img:border prose-img:border-line"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
