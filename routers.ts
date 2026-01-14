import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as nanaBanana from "./nanaBanana";
import { storagePut, storageGet } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // NanaBanana Accounts Management
  accounts: router({
    // Get user's NanaBanana accounts
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserNanaBananaAccounts(ctx.user.id);
    }),

    // Create a new NanaBanana account
    create: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        const accountData = await nanaBanana.createNanaBananaAccount();
        const account = await db.createNanaBananaAccount(
          ctx.user.id,
          accountData.email,
          accountData.password,
          accountData.sessionToken
        );
        return {
          success: true,
          account,
        };
      } catch (error) {
        console.error("Error creating account:", error);
        throw new Error("Failed to create NanaBanana account");
      }
    }),

    // Get account details
    get: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ input }) => {
        return db.getNanaBananaAccountById(input.accountId);
      }),
  }),

  // Image Generation
  images: router({
    // Get user's generated images
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        return db.getUserGeneratedImages(ctx.user.id, input.limit);
      }),

    // Generate new image
    generate: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        prompt: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const account = await db.getNanaBananaAccountById(input.accountId);
          if (!account || account.userId !== ctx.user.id) {
            throw new Error("Account not found or unauthorized");
          }

          // Check if account has remaining uses
          if (account.useCount >= account.maxUses) {
            throw new Error("Account has reached maximum uses");
          }

          // Create task on NanaBanana
          const taskId = await nanaBanana.createOrEditImage(
            account.sessionToken,
            input.prompt
          );

          // Save task to database
          const task = await db.createImageGenerationTask(
            ctx.user.id,
            input.accountId,
            taskId,
            input.prompt
          );

          return {
            success: true,
            task,
          };
        } catch (error) {
          console.error("Error generating image:", error);
          throw new Error("Failed to generate image");
        }
      }),

    // Edit existing image
    edit: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        uploadedImageId: z.number(),
        prompt: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const account = await db.getNanaBananaAccountById(input.accountId);
          if (!account || account.userId !== ctx.user.id) {
            throw new Error("Account not found or unauthorized");
          }

          const uploadedImage = await db.getUserUploadedImages(ctx.user.id, 1);
          const image = uploadedImage.find(img => img.id === input.uploadedImageId);
          if (!image) {
            throw new Error("Uploaded image not found");
          }

          // Create task on NanaBanana with image URL
          const taskId = await nanaBanana.createOrEditImage(
            account.sessionToken,
            input.prompt,
            [image.s3Url]
          );

          // Save task to database
          const task = await db.createImageGenerationTask(
            ctx.user.id,
            input.accountId,
            taskId,
            input.prompt,
            [image.s3Url]
          );

          return {
            success: true,
            task,
          };
        } catch (error) {
          console.error("Error editing image:", error);
          throw new Error("Failed to edit image");
        }
      }),

    // Check task status
    checkStatus: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          const task = await db.getImageGenerationTask(input.taskId);
          if (!task || task.userId !== ctx.user.id) {
            throw new Error("Task not found or unauthorized");
          }

          const account = await db.getNanaBananaAccountById(task.accountId);
          if (!account) {
            throw new Error("Account not found");
          }

          // Check status on NanaBanana
          const status = await nanaBanana.checkTaskStatus(input.taskId, account.sessionToken);

          // Update task in database
          await db.updateImageGenerationTask(input.taskId, {
            status: status.status,
            resultUrl: status.resultUrl,
            errorMessage: status.errorMessage,
          });

          return status;
        } catch (error) {
          console.error("Error checking task status:", error);
          throw new Error("Failed to check task status");
        }
      }),

    // Save generated image
    save: protectedProcedure
      .input(z.object({
        taskId: z.string(),
        imageUrl: z.string(),
        prompt: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const task = await db.getImageGenerationTask(input.taskId);
          if (!task || task.userId !== ctx.user.id) {
            throw new Error("Task not found or unauthorized");
          }

          // Download image
          const imageBuffer = await nanaBanana.downloadImage(input.imageUrl);

          // Upload to S3
          const s3Key = `generated-images/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
          const { url: s3Url } = await storagePut(s3Key, imageBuffer, "image/png");

          // Save to database
          const generatedImage = await db.createGeneratedImage(
            ctx.user.id,
            task.id,
            input.prompt,
            input.imageUrl,
            s3Key,
            s3Url,
            false
          );

          // Increment account use count
          await db.incrementAccountUseCount(task.accountId);

          return {
            success: true,
            image: generatedImage,
          };
        } catch (error) {
          console.error("Error saving image:", error);
          throw new Error("Failed to save image");
        }
      }),

    // Get tasks
    getTasks: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ ctx, input }) => {
        return db.getUserImageGenerationTasks(ctx.user.id, input.limit);
      }),
  }),

  // File Upload
  upload: router({
    // Upload image for editing
    uploadImage: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const buffer = Buffer.from(input.fileData, 'base64');
          const s3Key = `uploaded-images/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          const { url: s3Url } = await storagePut(s3Key, buffer, "image/jpeg");

          const uploadedImage = await db.createUploadedImage(
            ctx.user.id,
            s3Key,
            s3Url,
            "image/jpeg"
          );

          return {
            success: true,
            image: uploadedImage,
          };
        } catch (error) {
          console.error("Error uploading image:", error);
          throw new Error("Failed to upload image");
        }
      }),

    // Get uploaded images
    listUploaded: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ ctx, input }) => {
        return db.getUserUploadedImages(ctx.user.id, input.limit);
      }),

    // Delete uploaded image
    deleteUploaded: protectedProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await db.deleteUploadedImage(input.imageId);
          return { success: true };
        } catch (error) {
          console.error("Error deleting image:", error);
          throw new Error("Failed to delete image");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
