import { useBackgroundTasks } from "@/hooks/useBackgroundTasks";
import { Link } from "wouter";
import { Clock, AlertCircle } from "lucide-react";

export function TaskNotificationBadge() {
  const { activeTasks, failedTasks } = useBackgroundTasks();

  const totalActive = activeTasks.length;
  const totalFailed = failedTasks.length;

  if (totalActive === 0 && totalFailed === 0) {
    return null;
  }

  return (
    <Link href="/tasks">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 transition-colors cursor-pointer">
        {totalActive > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-purple-400 animate-spin" />
            <span className="text-xs text-purple-300">{totalActive}</span>
          </div>
        )}
        {totalFailed > 0 && (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-300">{totalFailed}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
