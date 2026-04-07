"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegisterFormProps = {
  locale: "ar" | "en";
  labels: {
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    submit: string;
  };
};

export function RegisterForm({ locale, labels }: RegisterFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setError(locale === "ar" ? "يرجى إدخال البيانات المطلوبة" : "Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password }),
      });

      const data = (await res.json().catch(() => null)) as null | { error?: string };

      if (!res.ok) {
        setError(
          data?.error || (locale === "ar" ? "تعذر إنشاء الحساب" : "Unable to create account")
        );
        return;
      }

      router.replace(locale === "en" ? "/en/login" : "/login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            {labels.name}
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            className="h-11 w-full"
            placeholder={labels.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            {labels.email}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-11 w-full"
            placeholder={labels.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            {labels.password}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="h-11 w-full"
            placeholder={labels.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="h-11 w-full" disabled={isLoading}>
        {isLoading ? (locale === "ar" ? "جاري الإنشاء..." : "Creating...") : labels.submit}
      </Button>
    </form>
  );
}
