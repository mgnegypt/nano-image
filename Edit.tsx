import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Edit() {
  const { isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: accounts, isLoading: accountsLoading } = trpc.accounts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: uploadedImages, isLoading: imagesLoading } = trpc.upload.listUploaded.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );

  const uploadImageMutation = trpc.upload.uploadImage.useMutation({
    onSuccess: (data) => {
      setUploadedImage(data.image.s3Url);
      setSelectedImageId(data.image.id);
      toast.success("تم رفع الصورة بنجاح!");
    },
    onError: (error) => {
      toast.error(error.message || "فشل رفع الصورة");
    },
  });

  const editImageMutation = trpc.images.edit.useMutation({
    onSuccess: () => {
      toast.success("تم بدء عملية التعديل!");
      setIsEditing(false);
      setPrompt("");
      setUploadedImage(null);
    },
    onError: (error) => {
      toast.error(error.message || "فشل تعديل الصورة");
      setIsEditing(false);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً (الحد الأقصى 10MB)");
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      await uploadImageMutation.mutateAsync({
        fileName: file.name,
        fileData: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = async () => {
    if (!prompt.trim()) {
      toast.error("يرجى إدخال وصف للتعديل");
      return;
    }

    if (!selectedAccountId) {
      toast.error("يرجى اختيار حساب");
      return;
    }

    if (!selectedImageId) {
      toast.error("يرجى اختيار صورة");
      return;
    }

    setIsEditing(true);
    await editImageMutation.mutateAsync({
      accountId: selectedAccountId,
      uploadedImageId: selectedImageId,
      prompt,
    });
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
          <h1 className="text-white font-semibold">تعديل الصور</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">تعديل الصور</h2>
          <p className="text-purple-200">عدّل صورك الموجودة باستخدام الذكاء الاصطناعي</p>
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

            {/* Image Upload */}
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-6">
              <label className="block text-white font-semibold mb-3">رفع صورة</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadImageMutation.isPending}
                className="w-full border-2 border-dashed border-white/20 rounded-lg p-8 hover:border-purple-400 transition-colors text-center"
              >
                {uploadImageMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2 text-purple-300">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الرفع...
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-purple-200">
                    <Upload className="w-8 h-8" />
                    <span>انقر لاختيار صورة أو اسحبها هنا</span>
                  </div>
                )}
              </button>
            </Card>

            {/* Previously Uploaded Images */}
            {!uploadedImage && imagesLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            )}

            {/* Image Preview */}
            {uploadedImage && (
              <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-6">
                <h3 className="text-white font-semibold mb-4">الصورة المرفوعة</h3>
                <div className="bg-black/30 rounded-lg overflow-hidden">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              </Card>
            )}

            {/* Edit Prompt */}
            {uploadedImage && (
              <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-6">
                <label className="block text-white font-semibold mb-3">وصف التعديل</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="صف التعديلات التي تريد إجراءها على الصورة..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-purple-500 resize-none"
                  rows={6}
                  disabled={isEditing}
                />
                <div className="mt-2 text-sm text-purple-300">
                  {prompt.length} / 1000 حرف
                </div>
              </Card>
            )}

            {/* Edit Button */}
            {uploadedImage && (
              <Button
                onClick={handleEdit}
                disabled={isEditing || !prompt.trim() || !selectedAccountId}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    جاري التعديل...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    تعديل الصورة
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
