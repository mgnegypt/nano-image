import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, nanaBananaAccounts, imageGenerationTasks, generatedImages, uploadedImages, type NanaBananaAccount, type ImageGenerationTask, type GeneratedImage, type UploadedImage } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// NanaBanana Accounts functions
export async function createNanaBananaAccount(userId: number, email: string, password: string, sessionToken: string): Promise<NanaBananaAccount> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(nanaBananaAccounts).values({
    userId,
    email,
    password,
    sessionToken,
    useCount: 0,
    maxUses: 5,
  });

  const insertedId = Number(result[0].insertId);
  const account = await db.select().from(nanaBananaAccounts).where(eq(nanaBananaAccounts.id, insertedId)).limit(1);
  
  if (!account[0]) throw new Error("Failed to create account");
  return account[0];
}

export async function getUserNanaBananaAccounts(userId: number): Promise<NanaBananaAccount[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(nanaBananaAccounts).where(eq(nanaBananaAccounts.userId, userId));
}

export async function incrementAccountUseCount(accountId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(nanaBananaAccounts)
    .set({ useCount: (await db.select().from(nanaBananaAccounts).where(eq(nanaBananaAccounts.id, accountId)).limit(1))[0]?.useCount || 0 + 1 })
    .where(eq(nanaBananaAccounts.id, accountId));
}

export async function getNanaBananaAccountById(accountId: number): Promise<NanaBananaAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(nanaBananaAccounts).where(eq(nanaBananaAccounts.id, accountId)).limit(1);
  return result[0];
}

// Image Generation Tasks functions
export async function createImageGenerationTask(userId: number, accountId: number, taskId: string, prompt: string, imageUrls?: string[]): Promise<ImageGenerationTask> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(imageGenerationTasks).values({
    userId,
    accountId,
    taskId,
    prompt,
    imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
    status: "pending",
  });

  const insertedId = Number(result[0].insertId);
  const task = await db.select().from(imageGenerationTasks).where(eq(imageGenerationTasks.id, insertedId)).limit(1);
  
  if (!task[0]) throw new Error("Failed to create task");
  return task[0];
}

export async function getImageGenerationTask(taskId: string): Promise<ImageGenerationTask | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(imageGenerationTasks).where(eq(imageGenerationTasks.taskId, taskId)).limit(1);
  return result[0];
}

export async function updateImageGenerationTask(taskId: string, updates: { status?: 'pending' | 'processing' | 'completed' | 'failed'; resultUrl?: string; errorMessage?: string }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(imageGenerationTasks)
    .set(updates)
    .where(eq(imageGenerationTasks.taskId, taskId));
}

export async function getUserImageGenerationTasks(userId: number, limit: number = 10): Promise<ImageGenerationTask[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(imageGenerationTasks)
    .where(eq(imageGenerationTasks.userId, userId))
    .orderBy(desc(imageGenerationTasks.createdAt))
    .limit(limit);
}

// Generated Images functions
export async function createGeneratedImage(userId: number, taskId: number, prompt: string, imageUrl: string, s3Key: string, s3Url: string, isEdited: boolean = false): Promise<GeneratedImage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(generatedImages).values({
    userId,
    taskId,
    prompt,
    imageUrl,
    s3Key,
    s3Url,
    isEdited,
  });

  const insertedId = Number(result[0].insertId);
  const image = await db.select().from(generatedImages).where(eq(generatedImages.id, insertedId)).limit(1);
  
  if (!image[0]) throw new Error("Failed to create generated image");
  return image[0];
}

export async function getUserGeneratedImages(userId: number, limit: number = 20): Promise<GeneratedImage[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(generatedImages)
    .where(eq(generatedImages.userId, userId))
    .orderBy(desc(generatedImages.createdAt))
    .limit(limit);
}

// Uploaded Images functions
export async function createUploadedImage(userId: number, s3Key: string, s3Url: string, mimeType: string): Promise<UploadedImage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(uploadedImages).values({
    userId,
    s3Key,
    s3Url,
    mimeType,
  });

  const insertedId = Number(result[0].insertId);
  const image = await db.select().from(uploadedImages).where(eq(uploadedImages.id, insertedId)).limit(1);
  
  if (!image[0]) throw new Error("Failed to create uploaded image");
  return image[0];
}

export async function getUserUploadedImages(userId: number, limit: number = 10): Promise<UploadedImage[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(uploadedImages)
    .where(eq(uploadedImages.userId, userId))
    .orderBy(desc(uploadedImages.createdAt))
    .limit(limit);
}

export async function deleteUploadedImage(imageId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(uploadedImages).where(eq(uploadedImages.id, imageId));
}
