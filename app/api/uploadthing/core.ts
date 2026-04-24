import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

async function adminMiddleware() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return { userId: session.user.id };
}

async function userMiddleware() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return { userId: session.user.id };
}

export const ourFileRouter = {
  userAvatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(userMiddleware)
    .onUploadComplete(({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  courseThumbnail: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(adminMiddleware)
    .onUploadComplete(({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  consultantAvatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(adminMiddleware)
    .onUploadComplete(({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  partnerLogo: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } })
    .middleware(adminMiddleware)
    .onUploadComplete(({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  lessonAudio: f({ audio: { maxFileSize: "32MB", maxFileCount: 1 } })
    .middleware(adminMiddleware)
    .onUploadComplete(({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  lessonPdf: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(adminMiddleware)
    .onUploadComplete(({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  receiptUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 }, pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(userMiddleware)
    .onUploadComplete(({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
