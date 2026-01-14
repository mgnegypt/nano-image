import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Calendar, Mail, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Accounts() {
  const { user, isAuthenticated } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const { data: accounts, isLoading, refetch } = trpc.accounts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createAccountMutation = trpc.accounts.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الحساب بنجاح!");
      refetch();
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error(error.message || "فشل إنشاء الحساب");
      setIsCreating(false);
    },
  });

  const handleCreateAccount = async () => {
    setIsCreating(true);
    await createAccountMutation.mutateAsync();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ إلى الحافظة");
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
          <h1 className="text-white font-semibold">إدارة الحسابات</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">حسابات NanaBanana</h2>
            <p className="text-purple-200">إدارة حساباتك وتتبع الاستخدام</p>
          </div>
          <Button
            onClick={handleCreateAccount}
            disabled={isCreating || isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                إنشاء حساب جديد
              </>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <Card
                key={account.id}
                className="backdrop-blur-md bg-white/10 border border-white/20 p-6 hover:bg-white/15 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold break-all">{account.email}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-purple-300 text-sm">
                        {account.useCount}/{account.maxUses} استخدام
                      </span>
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                          style={{ width: `${(account.useCount / account.maxUses) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2 text-purple-200 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(account.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-200 text-sm">
                    <Mail className="w-4 h-4" />
                    <span className="break-all">{account.email}</span>
                    <button
                      onClick={() => copyToClipboard(account.email)}
                      className="ml-auto text-purple-400 hover:text-purple-300"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs text-purple-300 bg-purple-500/10 p-2 rounded">
                    {account.useCount >= account.maxUses ? (
                      <span className="text-red-400">تم استنزاف جميع الاستخدامات</span>
                    ) : (
                      <span>متبقي {account.maxUses - account.useCount} استخدام</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-12 text-center">
            <p className="text-purple-200 mb-6">لم تقم بإنشاء أي حسابات حتى الآن</p>
            <Button
              onClick={handleCreateAccount}
              disabled={isCreating}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  إنشاء حساب جديد
                </>
              )}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
