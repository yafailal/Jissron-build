import crypto from "crypto";

// Bunny Stream signed URL generation — server-side only.
// Reference: https://docs.bunny.net/docs/stream-embedding-videos-token-authentication
//
// IP-based token restriction is NOT enabled on this library.
// If you enable it in the Bunny dashboard, add userIp to the hash input:
//   `tokenAuthKey + videoGuid + expiresAt + userIp`

export const BUNNY_SIGNED_URL_EXPIRY_SECONDS = 28800; // 8 hours

/**
 * Generates a Bunny Stream signed embed token.
 *
 * Algorithm (from Bunny docs):
 *   1. Concatenate: TokenAuthenticationKey + VideoGUID + ExpirationTimestamp
 *   2. SHA-256 hash the result
 *   3. Hex-encode the digest (lowercase)
 */
function generateBunnySignedToken({
  videoGuid,
  expiresAt,
}: {
  videoGuid: string;
  expiresAt: number; // Unix timestamp (seconds)
}): string {
  const tokenAuthKey = process.env.BUNNY_STREAM_TOKEN_AUTH_KEY;
  if (!tokenAuthKey) {
    throw new Error("BUNNY_STREAM_TOKEN_AUTH_KEY is not set");
  }

  const hashInput = tokenAuthKey + videoGuid + expiresAt.toString();
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

/**
 * Returns the full signed iframe embed URL for a Bunny Stream video.
 * Must only be called from server components or server actions.
 */
export function generateBunnyEmbedUrl(videoGuid: string): string {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  if (!libraryId) {
    throw new Error("BUNNY_STREAM_LIBRARY_ID is not set");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + BUNNY_SIGNED_URL_EXPIRY_SECONDS;
  const token = generateBunnySignedToken({ videoGuid, expiresAt });

  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}?token=${token}&expires=${expiresAt}`;
}

/**
 * Returns embed URL for a GUID that may or may not be set.
 * Returns null if videoGuid is missing or env vars are unconfigured.
 * Safe to call — swallows config errors gracefully for the UI.
 */
export function tryGenerateBunnyEmbedUrl(videoGuid: string | null | undefined): string | null {
  if (!videoGuid) return null;
  try {
    return generateBunnyEmbedUrl(videoGuid);
  } catch {
    return null;
  }
}
