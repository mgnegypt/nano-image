import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, Trash2, Clock } from "lucide-react";
import { useBackgroundTasks } from "@/hooks/useBackgroundTasks";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function Tasks() {
  const { isAuthenticated } = useAuth();
  const { activeTasks, completedTasks, failedTasks, removeTask, clearCompleted } =
    useBackgroundTasks();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex items-center justify-center">
        <p className="text-white">يرجى تسجيل الدخول أولاً</p>
      </div>
    );
  }

  const allTasks = [...activeTasks, ...completedTasks, ...failedTasks];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950">
      <nav className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="text-white font-bold cursor-pointer hover:text-purple-400">
              NanoBanana
            </span>
          </Link>
          <h1 className="text-white font-semibold">المهام الجارية</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">المهام الجارية</h2>
            <p className="text-purple-200">
              تتبع جميع عمليات توليد وتعديل الصور حتى بعد مغادرة الصفحة
            </p>
          </div>
          {completedTasks.length > 0 && (
            <Button
              onClick={clearCompleted}
              variant="outline"
              className="text-purple-200 border-purple-400 hover:bg-purple-600/20"
            >
              مسح المكتملة
            </Button>
          )}
        </div>

        {allTasks.length === 0 ? (
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-12 text-center">
            <Clock className="w-12 h-12 text-purple-300 mx-auto mb-4" />
            <p className="text-purple-200 mb-6">لا توجد مهام جارية</p>
            <Link href="/generate">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                ابدأ بإنشاء صورة
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Active Tasks */}
            {activeTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  المهام الجارية ({activeTasks.length})
                </h3>
                <div className="space-y-3">
                  {activeTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="backdrop-blur-md bg-white/10 border border-white/20 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                            <span className="text-purple-300 text-sm font-medium">
                              {task.type === "generate" ? "توليد صورة" : "تعديل صورة"}
                            </span>
                            <span className="text-purple-400 text-xs">
                              {task.status === "pending" ? "قيد الانتظار" : "جاري المعالجة"}
                            </span>
                          </div>
                          <p className="text-white text-sm line-clamp-2">{task.prompt}</p>
                          <p className="text-purple-300 text-xs mt-2">
                            {formatDistanceToNow(new Date(task.createdAt), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTask(task.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  المهام المكتملة ({completedTasks.length})
                </h3>
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="backdrop-blur-md bg-white/10 border border-white/20 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-green-300 text-sm font-medium">مكتملة</span>
                          </div>
                          <p className="text-white text-sm line-clamp-2">{task.prompt}</p>
                          <div className="flex items-center gap-2 mt-3">
                            {task.resultUrl && (
                              <a
                                href={task.resultUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 text-xs underline"
                              >
                                عرض الصورة
                              </a>
                            )}
                            <span className="text-purple-300 text-xs">
                              {formatDistanceToNow(new Date(task.completedAt!), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTask(task.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Failed Tasks */}
            {failedTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  المهام الفاشلة ({failedTasks.length})
                </h3>
                <div className="space-y-3">
                  {failedTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="backdrop-blur-md bg-white/10 border border-red-500/30 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-red-300 text-sm font-medium">فاشلة</span>
                          </div>
                          <p className="text-white text-sm line-clamp-2">{task.prompt}</p>
                          {task.errorMessage && (
                            <p className="text-red-300 text-xs mt-2">{task.errorMessage}</p>
                          )}
                          <p className="text-purple-300 text-xs mt-2">
                            {formatDistanceToNow(new Date(task.completedAt!), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTask(task.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
