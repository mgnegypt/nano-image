import { useEffect, useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface BackgroundTask {
  id: string;
  taskId: string;
  type: "generate" | "edit";
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
  resultUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

const STORAGE_KEY = "background_tasks";
const POLL_INTERVAL = 3000; // 3 seconds

export function useBackgroundTasks() {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
      try {
        const parsed = JSON.parse(storedTasks);
        setTasks(parsed);
      } catch (error) {
        console.error("Failed to parse stored tasks:", error);
      }
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Check task status
  const pendingTask = tasks.find(t => t.status === "pending" || t.status === "processing");
  const { data: taskStatusData } = trpc.images.checkStatus.useQuery(
    { taskId: pendingTask?.taskId || "" },
    {
      enabled: !!pendingTask,
      refetchInterval: POLL_INTERVAL,
    }
  );

  // Update task status when data changes
  useEffect(() => {
    if (taskStatusData && pendingTask) {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.taskId === pendingTask.taskId) {
            const updatedTask = {
              ...task,
              status: taskStatusData.status as BackgroundTask["status"],
              resultUrl: taskStatusData.resultUrl,
              errorMessage: taskStatusData.errorMessage,
              completedAt: taskStatusData.status === "completed" || taskStatusData.status === "failed" ? new Date() : undefined,
            };

            // Show notification
            if (taskStatusData.status === "completed") {
              toast.success(`تم إكمال المهمة: ${task.prompt.substring(0, 50)}...`);
            } else if (taskStatusData.status === "failed") {
              toast.error(`فشلت المهمة: ${taskStatusData.errorMessage || "خطأ غير معروف"}`);
            }

            return updatedTask;
          }
          return task;
        })
      );
    }
  }, [taskStatusData]);

  // Add a new background task
  const addTask = useCallback((task: Omit<BackgroundTask, "id" | "createdAt">) => {
    const newTask: BackgroundTask = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date(),
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  // Remove a task
  const removeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  // Clear completed tasks
  const clearCompleted = useCallback(() => {
    setTasks(prev =>
      prev.filter(t => t.status !== "completed" && t.status !== "failed")
    );
  }, []);

  // Get active tasks
  const activeTasks = tasks.filter(
    t => t.status === "pending" || t.status === "processing"
  );

  // Get completed tasks
  const completedTasks = tasks.filter(t => t.status === "completed");

  // Get failed tasks
  const failedTasks = tasks.filter(t => t.status === "failed");

  return {
    tasks,
    activeTasks,
    completedTasks,
    failedTasks,
    addTask,
    removeTask,
    clearCompleted,
    isLoading,
  };
}
