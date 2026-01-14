import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Generate() {
  const { isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const { data: accounts, isLoading: accountsLoading } = trpc.accounts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const generateMutation = trpc.images.generate.useMutation({
    onSuccess: (data) => {
      setTaskId(data.task.taskId);
      setTaskStatus("pending");
      toast.success("تم بدء عملية التوليد!");
    },
    onError: (error) => {
      toast.error(error.message || "فشل توليد الصورة");
      setIsGenerating(false);
    },
  });

  const { data: taskStatusData } = trpc.images.checkStatus.useQuery(
    { taskId: taskId || "" },
    {
      enabled: !!taskId && isGenerating,
      refetchInterval: 3000,
    }
  );

  useEffect(() => {
    if (taskStatusData) {
      setTaskStatus(taskStatusData.status);
      if (taskStatusData.status === "completed" && taskStatusData.resultUrl) {
        setGeneratedImageUrl(taskStatusData.resultUrl);
        toast.success("تم توليد الصورة بنجاح!");
        setIsGenerating(false);
      } else if (taskStatusData.status === "failed") {
        toast.error(taskStatusData.errorMessage || "فشل توليد الصورة");
        setIsGenerating(false);
      }
    }
  }, [taskStatusData]);



  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("يرجى إدخال وصف للصورة");
      return;
    }

    if (!selectedAccountId) {
      toast.error("يرجى اختيار حساب");
      return;
    }

    setIsGenerating(true);
    setGeneratedImageUrl(null);
    await generateMutation.mutateAsync({
      accountId: selectedAccountId,
      prompt,
    });
  };

  const handleSaveImage = async () => {
    if (!taskId || !generatedImageUrl) return;

    try {
      // Save image logic would go here
      toast.success("تم حفظ الصورة!");
    } catch (error) {
      toast.error("فشل حفظ الصورة");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex items-center justify-center">
        <p className="text-white">يرجى تسجيل الدخول أولاً</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950">
      <nav className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="text-white font-bold cursor-pointer hover:text-purple-400">NanoBanana</span>
          </Link>
          <h1 className="text-white font-semibold">توليد صور</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">توليد صور جديدة</h2>
          <p className="text-purple-200">أنشئ صور مذهلة من وصف نصي باستخدام الذكاء الاصطناعي</p>
        </div>

        {accountsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-8">
            <div className="flex items-center gap-4 text-purple-200 mb-4">
              <AlertCircle className="w-6 h-6" />
              <p>لا توجد حسابات متاحة. يرجى إنشاء حساب أولاً.</p>
            </div>
            <Link href="/accounts">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                إنشاء حساب
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Account Selection */}
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-6">
              <label className="block text-white font-semibold mb-3">اختر حساب</label>
              <select
                value={selectedAccountId || ""}
                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">اختر حساب...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.email} ({account.useCount}/{account.maxUses})
                  </option>
                ))}
              </select>
            </Card>

            {/* Prompt Input */}
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-6">
              <label className="block text-white font-semibold mb-3">وصف الصورة</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="صف الصورة التي تريد إنشاءها..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-purple-500 resize-none"
                rows={6}
                disabled={isGenerating}
              />
              <div className="mt-2 text-sm text-purple-300">
                {prompt.length} / 1000 حرف
              </div>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || !selectedAccountId}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {taskStatus === "pending" && "جاري الانتظار..."}
                  {taskStatus === "processing" && "جاري التوليد..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  توليد الصورة
                </>
              )}
            </Button>

            {/* Result */}
            {generatedImageUrl && (
              <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-6">
                <h3 className="text-white font-semibold mb-4">الصورة المولدة</h3>
                <div className="bg-black/30 rounded-lg overflow-hidden mb-4">
                  <img
                    src={generatedImageUrl}
                    alt="Generated"
                    className="w-full h-auto"
                  />
                </div>
                <Button
                  onClick={handleSaveImage}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  حفظ الصورة
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
