import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Upload, Zap, Clock } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { TaskNotificationBadge } from "@/components/TaskNotificationBadge";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex flex-col items-center justify-center px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">NanoBanana</h1>
          <p className="text-xl text-purple-200 mb-8">منصة توليد وتعديل الصور بالذكاء الاصطناعي</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl">
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-6 hover:bg-white/15 transition-all">
            <Sparkles className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-white font-semibold mb-2">توليد صور</h3>
            <p className="text-purple-200 text-sm">أنشئ صور مذهلة من وصف نصي باستخدام الذكاء الاصطناعي</p>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-6 hover:bg-white/15 transition-all">
            <Upload className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-white font-semibold mb-2">تعديل الصور</h3>
            <p className="text-purple-200 text-sm">عدّل صورك الموجودة بإضافة تعليمات نصية دقيقة</p>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-6 hover:bg-white/15 transition-all">
            <Zap className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-white font-semibold mb-2">سريع وسهل</h3>
            <p className="text-purple-200 text-sm">إنشاء حسابات تلقائي والتحقق الفوري من البريد</p>
          </Card>
        </div>

        <a href={getLoginUrl()}>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg rounded-lg">
            ابدأ الآن
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950">
      <nav className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span className="text-white font-bold">NanoBanana</span>
          </div>
          <div className="flex items-center gap-4">
            <TaskNotificationBadge />
            <div className="text-purple-200 text-sm">
              مرحباً، {user?.name || user?.email}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/accounts">
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-8 hover:bg-white/15 transition-all cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">إدارة الحسابات</h2>
                  <p className="text-purple-200">إنشاء وإدارة حسابات NanaBanana الخاصة بك</p>
                </div>
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
            </Card>
          </Link>

          <Link href="/generate">
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-8 hover:bg-white/15 transition-all cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">توليد صور</h2>
                  <p className="text-purple-200">أنشئ صور جديدة من وصف نصي</p>
                </div>
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
            </Card>
          </Link>

          <Link href="/edit">
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-8 hover:bg-white/15 transition-all cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">تعديل الصور</h2>
                  <p className="text-purple-200">عدّل صورك الموجودة باستخدام الذكاء الاصطناعي</p>
                </div>
                <Upload className="w-8 h-8 text-purple-400" />
              </div>
            </Card>
          </Link>

          <Link href="/gallery">
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-8 hover:bg-white/15 transition-all cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">معرض الصور</h2>
                  <p className="text-purple-200">عرض جميع الصور التي قمت بإنشاؤها</p>
                </div>
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
            </Card>
          </Link>

          <Link href="/tasks">
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-8 hover:bg-white/15 transition-all cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">المهام الجارية</h2>
                  <p className="text-purple-200">تتبع عمليات التوليد والتعديل الجارية</p>
                </div>
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
