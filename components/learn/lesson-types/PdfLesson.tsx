"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { searchPlugin } from "@react-pdf-viewer/search";
import { fullScreenPlugin } from "@react-pdf-viewer/full-screen";
import { AlertCircle, ZoomIn, ZoomOut, Search, Maximize2, X } from "lucide-react";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";
import "@react-pdf-viewer/full-screen/lib/styles/index.css";

interface PdfLessonProps {
  pdfUrl: string | null;
}

// Worker is served from a CDN so we don't need to ship pdf.worker.min.js ourselves.
const PDFJS_VERSION = "3.11.174";
const WORKER_URL = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;

export function PdfLesson({ pdfUrl }: PdfLessonProps) {
  const t = useTranslations("Learn");
  const [searchOpen, setSearchOpen] = useState(false);

  const zoom = zoomPlugin();
  const search = searchPlugin();
  const fullScreen = fullScreenPlugin();

  // @react-pdf-viewer ships render-prop components but its TS types don't expose
  // the `children: (props) => ReactNode` overload. Cast to any so we can customize
  // the toolbar buttons inline.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ZoomInButton = zoom.ZoomInButton as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ZoomOutButton = zoom.ZoomOutButton as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CurrentScale = zoom.CurrentScale as any;
  const { Search: SearchBox } = search;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const EnterFullScreenButton = fullScreen.EnterFullScreenButton as any;

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertCircle size={32} className="text-muted/40" />
        <p className="text-[14px] font-semibold text-ink">{t("lesson.pdfUnavailable")}</p>
        <p className="text-[13px] text-muted font-medium">{t("lesson.audioCheckBack")}</p>
      </div>
    );
  }

  return (
    <Worker workerUrl={WORKER_URL}>
      <div className="-mx-4 sm:-mx-6 border-b border-line overflow-hidden bg-white">
        {/* Custom toolbar */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-line bg-bg-soft">
          <div className="flex items-center gap-1">
            <ZoomOutButton>
              {(props: any) => (
                <button
                  type="button"
                  onClick={props.onClick}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted hover:text-ink hover:bg-bg-hover transition-colors"
                  title={t("pdf.zoomOut")}
                >
                  <ZoomOut size={15} />
                </button>
              )}
            </ZoomOutButton>
            <span className="min-w-[52px] text-center text-[12px] font-semibold text-ink tabular-nums">
              <CurrentScale>
                {(props: any) => <span>{Math.round(props.scale * 100)}%</span>}
              </CurrentScale>
            </span>
            <ZoomInButton>
              {(props: any) => (
                <button
                  type="button"
                  onClick={props.onClick}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted hover:text-ink hover:bg-bg-hover transition-colors"
                  title={t("pdf.zoomIn")}
                >
                  <ZoomIn size={15} />
                </button>
              )}
            </ZoomInButton>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen((s) => !s)}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                searchOpen
                  ? "bg-primary text-white"
                  : "text-muted hover:text-ink hover:bg-bg-hover"
              }`}
              title={t("pdf.search")}
            >
              {searchOpen ? <X size={15} /> : <Search size={15} />}
            </button>
            <EnterFullScreenButton>
              {(props: any) => (
                <button
                  type="button"
                  onClick={props.onClick}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted hover:text-ink hover:bg-bg-hover transition-colors"
                  title={t("pdf.fullscreen")}
                >
                  <Maximize2 size={15} />
                </button>
              )}
            </EnterFullScreenButton>
          </div>
        </div>

        {/* Search bar (collapsible) */}
        {searchOpen && (
          <div className="px-3 py-2 border-b border-line bg-white pdf-search-host">
            <SearchBox>
              {(renderSearchProps) => (
                <div className="flex items-center gap-1.5">
                  <Search size={13} className="text-muted shrink-0" />
                  <input
                    type="text"
                    placeholder={t("pdf.searchPlaceholder")}
                    value={renderSearchProps.keyword}
                    onChange={(e) => renderSearchProps.setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        renderSearchProps.search();
                      }
                    }}
                    className="flex-1 h-7 text-[12.5px] px-2 border border-line rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35"
                  />
                  {renderSearchProps.numberOfMatches > 0 && (
                    <span className="text-[11px] text-muted whitespace-nowrap tabular-nums">
                      {renderSearchProps.currentMatch} / {renderSearchProps.numberOfMatches}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => renderSearchProps.jumpToPreviousMatch()}
                    disabled={renderSearchProps.numberOfMatches === 0}
                    className="h-7 px-3 text-[11px] font-semibold border border-line rounded-full text-muted hover:text-ink hover:bg-bg-soft disabled:opacity-40"
                  >
                    {t("pdf.prev")}
                  </button>
                  <button
                    type="button"
                    onClick={() => renderSearchProps.jumpToNextMatch()}
                    disabled={renderSearchProps.numberOfMatches === 0}
                    className="h-7 px-3 text-[11px] font-semibold border border-line rounded-full text-muted hover:text-ink hover:bg-bg-soft disabled:opacity-40"
                  >
                    {t("pdf.next")}
                  </button>
                </div>
              )}
            </SearchBox>
          </div>
        )}

        {/* Viewer */}
        <div style={{ height: "78vh", minHeight: "500px" }}>
          <Viewer
            fileUrl={pdfUrl}
            plugins={[zoom, search, fullScreen]}
            defaultScale={1.1}
          />
        </div>
      </div>
    </Worker>
  );
}
