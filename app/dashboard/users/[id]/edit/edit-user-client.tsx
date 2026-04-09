"use client";

import { useState, useEffect } from "react";
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
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

const userSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول مطلوب"),
  lastName: z.string().min(2, "اسم العائلة مطلوب"),
  email: z.string().email(t.common.emailInvalid),
  role: z.enum(["EMPLOYEE", "HR_MANAGER", "MANAGER", "TENANT_ADMIN"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]),
  phone: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
}

interface Props {
  user: UserData;
  locale: "ar" | "en";
}

export default function EditUserClient({ user, locale: _locale }: Props) {
  const locale = useClientLocale();
  const t = getText(locale);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? IconArrowRight : IconArrowLeft;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role as any,
      status: user.status as any,
      phone: user.phone || "",
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "فشل في تحديث المستخدم");
      }

      toast.success(isRtl ? "تم تحديث المستخدم بنجاح" : "User updated successfully");
      router.push(`/dashboard/users/${user.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || (isRtl ? "فشل في تحديث المستخدم" : "Failed to update user"));
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

  const statusOptions = [
    { value: "ACTIVE", label: isRtl ? t.common.active : "Active" },
    { value: "INACTIVE", label: isRtl ? t.common.inactive : "Inactive" },
    { value: "SUSPENDED", label: isRtl ? t.common.suspended : "Suspended" },
    { value: "PENDING_VERIFICATION", label: isRtl ? t.common.pendingActivation : "Pending Verification" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" aria-label={t.common.back} asChild>
          <Link href={`/dashboard/users/${user.id}`}>
            <ArrowIcon className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isRtl ? "تعديل المستخدم" : "Edit User"}
          </h1>
          <p className="text-muted-foreground">
            {`${user.firstName} ${user.lastName}`.trim()}
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
                {isRtl ? "تعديل معلومات المستخدم" : "Edit user information"}
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
                        <Input {...field} />
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
                        <Input {...field} />
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
                        <Input type="email" {...field} />
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
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRtl ? t.common.roleRequired : "Role *"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRtl ? "الحالة *" : "Status *"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((opt) => (
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
                    ? t.common.saveChanges
                    : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/dashboard/users/${user.id}`}>{isRtl ? t.common.cancel : "Cancel"}</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
