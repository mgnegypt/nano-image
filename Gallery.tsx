import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Download, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Gallery() {
  const { isAuthenticated } = useAuth();

  const { data: images, isLoading } = trpc.images.list.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = imageName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("تم تحميل الصورة!");
    } catch (error) {
      toast.error("فشل تحميل الصورة");
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
          <h1 className="text-white font-semibold">معرض الصور</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">معرض الصور</h2>
          <p className="text-purple-200">عرض جميع الصور التي قمت بإنشاؤها وتعديلها</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <Card
                key={image.id}
                className="backdrop-blur-md bg-white/10 border border-white/20 overflow-hidden hover:border-purple-400 transition-all group"
              >
                <div className="relative bg-black/30 overflow-hidden h-64">
                  <img
                    src={image.s3Url}
                    alt={image.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(image.s3Url, `image-${image.id}.png`)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-purple-200 text-sm line-clamp-2 mb-3">{image.prompt}</p>
                  <div className="flex items-center justify-between text-xs text-purple-300">
                    <span>
                      {new Date(image.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                    {image.isEdited && (
                      <span className="bg-purple-500/20 px-2 py-1 rounded">معدلة</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-12 text-center">
            <p className="text-purple-200 mb-6">لم تقم بإنشاء أي صور حتى الآن</p>
            <Link href="/generate">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                ابدأ بإنشاء صورة
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
