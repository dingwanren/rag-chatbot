"use client";

import { signup } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();
  
  const [state, formAction] = useActionState<
    { success: boolean; error?: string } | null,
    FormData
  >(async (prevState, formData) => {
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // 客户端密码匹配验证
    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }

    // 验证密码长度
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const result = await signup(formData);

    if (result.success) {
      onSuccess?.();
      router.push("/");
      router.refresh();
      return null;
    }

    return { success: false, error: result.error };
  }, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          name="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Choose a password"
          name="password"
          autoComplete="new-password"
          required
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={6}
        />
      </div>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full">
        Register
      </Button>
    </form>
  );
}
