"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconArrowRight, IconArrowLeft, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { getText } from "@/lib/i18n/text";
import { useClientLocale } from "@/lib/i18n/use-client-locale";

function createUserSchema(t: ReturnType<typeof getText>) {
  return z.object({
    firstName: z.string().min(2, "الاسم الأول مطلوب (حرفين على الأقل)"),
    lastName: z.string().min(2, "اسم العائلة مطلوب (حرفين على الأقل)"),
    email: z.string().email(t.common.emailInvalid),
    password: z.string().min(6, t.common.passwordMinLength),
    role: z.enum(["EMPLOYEE", "HR_MANAGER", "MANAGER", "TENANT_ADMIN"], {
      required_error: "الدور مطلوب",
    }),
    phone: z.string().optional(),
  });
}

type UserFormData = z.infer<ReturnType<typeof createUserSchema>>;

export default function AddUserPage() {
  const locale = useClientLocale();
  const t = getText(locale);
  const userSchema = useMemo(() => createUserSchema(t), [t]);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? IconArrowRight : IconArrowLeft;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      phone: "",
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "فشل في إضافة المستخدم");
      }

      toast.success(isRtl ? "تم إضافة المستخدم بنجاح" : "User added successfully");
      router.push("/dashboard/users");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || (isRtl ? "فشل في إضافة المستخدم" : "Failed to add user"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { value: "EMPLOYEE", label: isRtl ? t.common.employee : "Employee" },
    { value: "HR_MANAGER", label: isRtl ? t.common.hrManager : "HR Manager" },
    { value: "MANAGER", label: isRtl ? t.common.manager : "Manager" },
    { value: "TENANT_ADMIN", label: isRtl ? t.common.companyAdmin : "Tenant Admin" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" aria-label={t.common.back} asChild>
          <Link href="/dashboard/users">
            <ArrowIcon className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isRtl ? "إضافة مستخدم جديد" : "Add New User"}
          </h1>
          <p className="text-muted-foreground">
            {isRtl ? "قم بإدخال بيانات المستخدم الجديد" : "Enter new user details"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconUser className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>{isRtl ? t.common.details : "User Details"}</CardTitle>
              <CardDescription>
                {isRtl ? "المعلومات الأساسية للمستخدم" : "Basic user information"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRtl ? t.common.firstName : "First Name *"}</FormLabel>
                      <FormControl>
                        <Input placeholder={isRtl ? "أحمد" : "Ahmed"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRtl ? t.common.lastName : "Last Name *"}</FormLabel>
                      <FormControl>
                        <Input placeholder={isRtl ? t.common.namePlaceholder : "Mohammed"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRtl ? t.common.emailRequired : "Email *"}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRtl ? t.common.phone : "Phone"}</FormLabel>
                      <FormControl>
                        <Input placeholder="+966500000000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRtl ? "كلمة المرور *" : "Password *"}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormDescription>
                        {isRtl ? "6 أحرف على الأقل" : "At least 6 characters"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRtl ? t.common.roleRequired : "Role *"}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isRtl ? "اختر الدور" : "Select role"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? isRtl
                      ? t.common.saving
                      : "Saving..."
                    : isRtl
                    ? "إضافة المستخدم"
                    : "Add User"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/users">{isRtl ? t.common.cancel : "Cancel"}</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
