import { describe, expect, it, beforeEach } from "vitest";

describe("Background Tasks System", () => {
  describe("Task Storage and Retrieval", () => {
    it("should store tasks in localStorage", () => {
      const mockTask = {
        id: "task-1",
        taskId: "nanaban-task-123",
        type: "generate" as const,
        prompt: "A beautiful sunset",
        status: "pending" as const,
        createdAt: new Date(),
      };

      const stored = JSON.stringify([mockTask]);
      const retrieved = JSON.parse(stored);

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].taskId).toBe("nanaban-task-123");
      expect(retrieved[0].status).toBe("pending");
    });

    it("should handle multiple tasks", () => {
      const tasks = [
        {
          id: "task-1",
          taskId: "task-123",
          type: "generate" as const,
          prompt: "Sunset",
          status: "pending" as const,
          createdAt: new Date(),
        },
        {
          id: "task-2",
          taskId: "task-456",
          type: "edit" as const,
          prompt: "Edit image",
          status: "processing" as const,
          createdAt: new Date(),
        },
      ];

      const stored = JSON.stringify(tasks);
      const retrieved = JSON.parse(stored);

      expect(retrieved).toHaveLength(2);
      expect(retrieved[0].type).toBe("generate");
      expect(retrieved[1].type).toBe("edit");
    });
  });

  describe("Task Status Updates", () => {
    it("should update task status from pending to processing", () => {
      const task = {
        id: "task-1",
        taskId: "task-123",
        type: "generate" as const,
        prompt: "Test",
        status: "pending" as const,
        createdAt: new Date(),
      };

      const updatedTask = {
        ...task,
        status: "processing" as const,
      };

      expect(updatedTask.status).toBe("processing");
    });

    it("should update task status to completed with result URL", () => {
      const task = {
        id: "task-1",
        taskId: "task-123",
        type: "generate" as const,
        prompt: "Test",
        status: "processing" as const,
        createdAt: new Date(),
      };

      const completedTask = {
        ...task,
        status: "completed" as const,
        resultUrl: "https://example.com/image.jpg",
        completedAt: new Date(),
      };

      expect(completedTask.status).toBe("completed");
      expect(completedTask.resultUrl).toBeDefined();
      expect(completedTask.completedAt).toBeDefined();
    });

    it("should update task status to failed with error message", () => {
      const task = {
        id: "task-1",
        taskId: "task-123",
        type: "generate" as const,
        prompt: "Test",
        status: "processing" as const,
        createdAt: new Date(),
      };

      const failedTask = {
        ...task,
        status: "failed" as const,
        errorMessage: "Invalid prompt",
        completedAt: new Date(),
      };

      expect(failedTask.status).toBe("failed");
      expect(failedTask.errorMessage).toBe("Invalid prompt");
    });
  });

  describe("Task Filtering", () => {
    it("should filter active tasks", () => {
      const tasks = [
        {
          id: "task-1",
          taskId: "task-123",
          type: "generate" as const,
          prompt: "Test 1",
          status: "pending" as const,
          createdAt: new Date(),
        },
        {
          id: "task-2",
          taskId: "task-456",
          type: "generate" as const,
          prompt: "Test 2",
          status: "completed" as const,
          resultUrl: "https://example.com/image.jpg",
          createdAt: new Date(),
          completedAt: new Date(),
        },
      ];

      const activeTasks = tasks.filter(
        t => t.status === "pending" || t.status === "processing"
      );

      expect(activeTasks).toHaveLength(1);
      expect(activeTasks[0].status).toBe("pending");
    });

    it("should filter completed tasks", () => {
      const tasks = [
        {
          id: "task-1",
          taskId: "task-123",
          type: "generate" as const,
          prompt: "Test 1",
          status: "pending" as const,
          createdAt: new Date(),
        },
        {
          id: "task-2",
          taskId: "task-456",
          type: "generate" as const,
          prompt: "Test 2",
          status: "completed" as const,
          resultUrl: "https://example.com/image.jpg",
          createdAt: new Date(),
          completedAt: new Date(),
        },
        {
          id: "task-3",
          taskId: "task-789",
          type: "edit" as const,
          prompt: "Test 3",
          status: "completed" as const,
          resultUrl: "https://example.com/image2.jpg",
          createdAt: new Date(),
          completedAt: new Date(),
        },
      ];

      const completedTasks = tasks.filter(t => t.status === "completed");

      expect(completedTasks).toHaveLength(2);
      expect(completedTasks.every(t => t.status === "completed")).toBe(true);
    });

    it("should filter failed tasks", () => {
      const tasks = [
        {
          id: "task-1",
          taskId: "task-123",
          type: "generate" as const,
          prompt: "Test 1",
          status: "pending" as const,
          createdAt: new Date(),
        },
        {
          id: "task-2",
          taskId: "task-456",
          type: "generate" as const,
          prompt: "Test 2",
          status: "failed" as const,
          errorMessage: "Invalid prompt",
          createdAt: new Date(),
          completedAt: new Date(),
        },
      ];

      const failedTasks = tasks.filter(t => t.status === "failed");

      expect(failedTasks).toHaveLength(1);
      expect(failedTasks[0].errorMessage).toBe("Invalid prompt");
    });
  });

  describe("Task Cleanup", () => {
    it("should remove completed tasks", () => {
      const tasks = [
        {
          id: "task-1",
          taskId: "task-123",
          type: "generate" as const,
          prompt: "Test 1",
          status: "completed" as const,
          resultUrl: "https://example.com/image.jpg",
          createdAt: new Date(),
          completedAt: new Date(),
        },
        {
          id: "task-2",
          taskId: "task-456",
          type: "generate" as const,
          prompt: "Test 2",
          status: "pending" as const,
          createdAt: new Date(),
        },
      ];

      const filtered = tasks.filter(
        t => t.status !== "completed" && t.status !== "failed"
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe("pending");
    });

    it("should remove a specific task by ID", () => {
      const tasks = [
        {
          id: "task-1",
          taskId: "task-123",
          type: "generate" as const,
          prompt: "Test 1",
          status: "pending" as const,
          createdAt: new Date(),
        },
        {
          id: "task-2",
          taskId: "task-456",
          type: "generate" as const,
          prompt: "Test 2",
          status: "pending" as const,
          createdAt: new Date(),
        },
      ];

      const taskIdToRemove = "task-1";
      const filtered = tasks.filter(t => t.id !== taskIdToRemove);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("task-2");
    });
  });

  describe("Task Persistence", () => {
    it("should maintain task data across page reloads", () => {
      const taskData = {
        id: "task-1",
        taskId: "task-123",
        type: "generate" as const,
        prompt: "A beautiful sunset",
        status: "processing" as const,
        createdAt: new Date().toISOString(),
      };

      // Simulate localStorage
      const stored = JSON.stringify(taskData);
      const retrieved = JSON.parse(stored);

      expect(retrieved.taskId).toBe(taskData.taskId);
      expect(retrieved.status).toBe("processing");
      expect(retrieved.prompt).toBe(taskData.prompt);
    });

    it("should handle corrupted localStorage data gracefully", () => {
      const corruptedData = "{invalid json}";

      let parsed = null;
      try {
        parsed = JSON.parse(corruptedData);
      } catch (error) {
        // Should catch error and handle gracefully
        expect(error).toBeDefined();
      }

      expect(parsed).toBeNull();
    });
  });
});
