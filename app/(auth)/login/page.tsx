import { Suspense } from "react";
import { AuthPage } from "@/components/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthPage />
    </Suspense>
  );
}
