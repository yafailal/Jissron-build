import { getSiteSettings } from "@/lib/data/homepage";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <>
      {settings && (
        <style>{`
          :root {
            --primary: ${settings.colorPrimary};
            --primary-hover: ${settings.colorPrimaryHover};
            --primary-bright: ${settings.colorPrimaryBright};
            --ink: ${settings.colorInk};
          }
        `}</style>
      )}
      {children}
    </>
  );
}
