export interface SocialLink {
  platform: string;
  url: string;
}

interface SocialIconProps {
  platform: string;
  size?: number;
}

export function SocialIcon({ platform, size = 14 }: SocialIconProps) {
  const key = platform.toLowerCase().trim();
  switch (key) {
    case "twitter":
    case "x":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 7a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      );
    case "youtube":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
        </svg>
      );
    case "instagram":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
        </svg>
      );
    case "facebook":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0022 12z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19.6 6.5a5.7 5.7 0 01-3.3-1.1A5.7 5.7 0 0114.6 2h-3.4v13a2.6 2.6 0 11-2.6-2.6c.27 0 .53.04.78.11V9.05a6.05 6.05 0 105.62 6.04V8.94a8.97 8.97 0 004.6 1.27V6.84a5.71 5.71 0 01-.0-.34z" />
        </svg>
      );
    default:
      return null;
  }
}
