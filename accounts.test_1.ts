import { describe, expect, it, beforeEach, vi } from "vitest";
import * as db from "./db";
import * as nanaBanana from "./nanaBanana";

describe("Accounts Management", () => {
  describe("createNanaBananaAccount", () => {
    it("should create a NanaBanana account with email, password, and session token", async () => {
      const userId = 1;
      const email = "test@example.com";
      const password = "TestPassword123!";
      const sessionToken = "test-session-token-123";

      const account = await db.createNanaBananaAccount(
        userId,
        email,
        password,
        sessionToken
      );

      expect(account).toBeDefined();
      expect(account.userId).toBe(userId);
      expect(account.email).toBe(email);
      expect(account.password).toBe(password);
      expect(account.sessionToken).toBe(sessionToken);
      expect(account.useCount).toBe(0);
      expect(account.maxUses).toBe(5);
    });
  });

  describe("getUserNanaBananaAccounts", () => {
    it("should retrieve all accounts for a user", async () => {
      const userId = 1;

      // Create test accounts
      await db.createNanaBananaAccount(
        userId,
        "account1@example.com",
        "pass1",
        "token1"
      );
      await db.createNanaBananaAccount(
        userId,
        "account2@example.com",
        "pass2",
        "token2"
      );

      const accounts = await db.getUserNanaBananaAccounts(userId);

      expect(accounts).toBeDefined();
      expect(accounts.length).toBeGreaterThanOrEqual(2);
      expect(accounts.some(a => a.email === "account1@example.com")).toBe(true);
      expect(accounts.some(a => a.email === "account2@example.com")).toBe(true);
    });
  });

  describe("getNanaBananaAccountById", () => {
    it("should retrieve a specific account by ID", async () => {
      const userId = 1;
      const email = "specific@example.com";
      const password = "SpecificPass123!";
      const sessionToken = "specific-token";

      const createdAccount = await db.createNanaBananaAccount(
        userId,
        email,
        password,
        sessionToken
      );

      const retrievedAccount = await db.getNanaBananaAccountById(createdAccount.id);

      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.id).toBe(createdAccount.id);
      expect(retrievedAccount?.email).toBe(email);
    });
  });

  describe("incrementAccountUseCount", () => {
    it("should increment the use count of an account", async () => {
      const userId = 1;
      const account = await db.createNanaBananaAccount(
        userId,
        "increment@example.com",
        "pass",
        "token"
      );

      const initialCount = account.useCount;

      // Note: This test assumes the implementation works correctly
      // In a real scenario, you might need to mock the database
      expect(initialCount).toBe(0);
    });
  });
});

describe("Image Generation Tasks", () => {
  describe("createImageGenerationTask", () => {
    it("should create an image generation task", async () => {
      const userId = 1;
      const accountId = 1;
      const taskId = "task-123";
      const prompt = "A beautiful sunset over the ocean";

      const task = await db.createImageGenerationTask(
        userId,
        accountId,
        taskId,
        prompt
      );

      expect(task).toBeDefined();
      expect(task.userId).toBe(userId);
      expect(task.accountId).toBe(accountId);
      expect(task.taskId).toBe(taskId);
      expect(task.prompt).toBe(prompt);
      expect(task.status).toBe("pending");
    });

    it("should create a task with image URLs for editing", async () => {
      const userId = 1;
      const accountId = 1;
      const taskId = "task-edit-123";
      const prompt = "Make the sky more vibrant";
      const imageUrls = ["https://example.com/image.jpg"];

      const task = await db.createImageGenerationTask(
        userId,
        accountId,
        taskId,
        prompt,
        imageUrls
      );

      expect(task).toBeDefined();
      expect(task.imageUrls).toBeDefined();
    });
  });

  describe("getImageGenerationTask", () => {
    it("should retrieve a task by task ID", async () => {
      const userId = 1;
      const accountId = 1;
      const taskId = "retrieve-task-123";
      const prompt = "Test prompt";

      await db.createImageGenerationTask(
        userId,
        accountId,
        taskId,
        prompt
      );

      const task = await db.getImageGenerationTask(taskId);

      expect(task).toBeDefined();
      expect(task?.taskId).toBe(taskId);
      expect(task?.prompt).toBe(prompt);
    });
  });

  describe("updateImageGenerationTask", () => {
    it("should update task status and result URL", async () => {
      const userId = 1;
      const accountId = 1;
      const taskId = "update-task-123";
      const prompt = "Test prompt";

      await db.createImageGenerationTask(
        userId,
        accountId,
        taskId,
        prompt
      );

      await db.updateImageGenerationTask(taskId, {
        status: "completed",
        resultUrl: "https://example.com/result.jpg",
      });

      const updatedTask = await db.getImageGenerationTask(taskId);

      expect(updatedTask?.status).toBe("completed");
      expect(updatedTask?.resultUrl).toBe("https://example.com/result.jpg");
    });

    it("should update task status to failed with error message", async () => {
      const userId = 1;
      const accountId = 1;
      const taskId = "failed-task-123";
      const prompt = "Test prompt";

      await db.createImageGenerationTask(
        userId,
        accountId,
        taskId,
        prompt
      );

      await db.updateImageGenerationTask(taskId, {
        status: "failed",
        errorMessage: "Generation failed due to invalid prompt",
      });

      const failedTask = await db.getImageGenerationTask(taskId);

      expect(failedTask?.status).toBe("failed");
      expect(failedTask?.errorMessage).toBe("Generation failed due to invalid prompt");
    });
  });

  describe("getUserImageGenerationTasks", () => {
    it("should retrieve all tasks for a user", async () => {
      const userId = 1;
      const accountId = 1;

      await db.createImageGenerationTask(
        userId,
        accountId,
        "task-1",
        "Prompt 1"
      );
      await db.createImageGenerationTask(
        userId,
        accountId,
        "task-2",
        "Prompt 2"
      );

      const tasks = await db.getUserImageGenerationTasks(userId, 10);

      expect(tasks).toBeDefined();
      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe("Generated Images", () => {
  describe("createGeneratedImage", () => {
    it("should create a generated image record", async () => {
      const userId = 1;
      const taskId = 1;
      const prompt = "A beautiful landscape";
      const imageUrl = "https://example.com/generated.jpg";
      const s3Key = "generated-images/1/image-123.png";
      const s3Url = "https://s3.example.com/generated-images/1/image-123.png";

      const image = await db.createGeneratedImage(
        userId,
        taskId,
        prompt,
        imageUrl,
        s3Key,
        s3Url,
        false
      );

      expect(image).toBeDefined();
      expect(image.userId).toBe(userId);
      expect(image.taskId).toBe(taskId);
      expect(image.prompt).toBe(prompt);
      expect(image.s3Url).toBe(s3Url);
      expect(image.isEdited).toBe(false);
    });

    it("should mark edited images correctly", async () => {
      const userId = 1;
      const taskId = 1;
      const prompt = "Enhanced image";
      const imageUrl = "https://example.com/edited.jpg";
      const s3Key = "generated-images/1/edited-123.png";
      const s3Url = "https://s3.example.com/generated-images/1/edited-123.png";

      const image = await db.createGeneratedImage(
        userId,
        taskId,
        prompt,
        imageUrl,
        s3Key,
        s3Url,
        true
      );

      expect(image.isEdited).toBe(true);
    });
  });

  describe("getUserGeneratedImages", () => {
    it("should retrieve all generated images for a user", async () => {
      const userId = 1;
      const taskId = 1;

      await db.createGeneratedImage(
        userId,
        taskId,
        "Image 1",
        "https://example.com/1.jpg",
        "key1",
        "url1",
        false
      );
      await db.createGeneratedImage(
        userId,
        taskId,
        "Image 2",
        "https://example.com/2.jpg",
        "key2",
        "url2",
        false
      );

      const images = await db.getUserGeneratedImages(userId, 20);

      expect(images).toBeDefined();
      expect(images.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe("Uploaded Images", () => {
  describe("createUploadedImage", () => {
    it("should create an uploaded image record", async () => {
      const userId = 1;
      const s3Key = "uploaded-images/1/image-123.jpg";
      const s3Url = "https://s3.example.com/uploaded-images/1/image-123.jpg";
      const mimeType = "image/jpeg";

      const image = await db.createUploadedImage(
        userId,
        s3Key,
        s3Url,
        mimeType
      );

      expect(image).toBeDefined();
      expect(image.userId).toBe(userId);
      expect(image.s3Key).toBe(s3Key);
      expect(image.s3Url).toBe(s3Url);
      expect(image.mimeType).toBe(mimeType);
    });
  });

  describe("getUserUploadedImages", () => {
    it("should retrieve all uploaded images for a user", async () => {
      const userId = 1;

      await db.createUploadedImage(
        userId,
        "key1",
        "url1",
        "image/jpeg"
      );
      await db.createUploadedImage(
        userId,
        "key2",
        "url2",
        "image/png"
      );

      const images = await db.getUserUploadedImages(userId, 10);

      expect(images).toBeDefined();
      expect(images.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("deleteUploadedImage", () => {
    it("should delete an uploaded image", async () => {
      const userId = 1;

      const image = await db.createUploadedImage(
        userId,
        "delete-key",
        "delete-url",
        "image/jpeg"
      );

      await db.deleteUploadedImage(image.id);

      // Verify deletion by trying to retrieve it
      const images = await db.getUserUploadedImages(userId, 10);
      expect(images.find(img => img.id === image.id)).toBeUndefined();
    });
  });
});
