interface AdminFeedbackBannerProps {
  tone: "success" | "error" | "info";
  message: string;
}

const toneClasses: Record<AdminFeedbackBannerProps["tone"], string> = {
  success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
  error: "border-red-400/20 bg-red-500/10 text-red-100",
  info: "border-white/10 bg-white/5 text-white/80",
};

export function AdminFeedbackBanner({
  tone,
  message,
}: AdminFeedbackBannerProps) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${toneClasses[tone]}`}>
      {message}
    </div>
  );
}
