"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ProfileFormValues = {
  username: string;
  email: string;
  bio: string;
  urls?: { value: string }[];
};

export function ProfileForm({ locale }: { locale: "ar" | "en" }) {
  const isRtl = locale === "ar";

  const profileFormSchema: z.ZodType<ProfileFormValues> = z.object({
    username: z
      .string()
      .min(2, {
        message: isRtl
          ? "اسم المستخدم يجب ألا يقل عن حرفين."
          : "Username must be at least 2 characters.",
      })
      .max(30, {
        message: isRtl
          ? "اسم المستخدم يجب ألا يزيد عن 30 حرفًا."
          : "Username must not be longer than 30 characters.",
      }),
    email: z
      .string({
        required_error: isRtl
          ? "يرجى اختيار بريد إلكتروني لعرضه."
          : "Please select an email to display.",
      })
      .email({
        message: isRtl ? "صيغة البريد الإلكتروني غير صحيحة." : "Invalid email address.",
      }),
    bio: z
      .string()
      .min(4, { message: isRtl ? "النبذة قصيرة جدًا." : "Bio is too short." })
      .max(160, { message: isRtl ? "النبذة طويلة جدًا." : "Bio is too long." }),
    urls: z
      .array(
        z.object({
          value: z.string().url({
            message: isRtl ? "يرجى إدخال رابط صحيح." : "Please enter a valid URL.",
          }),
        })
      )
      .optional(),
  });

  const defaultValues: Partial<ProfileFormValues> = {
    username: "",
    email: "",
    bio: "",
    urls: [],
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange"
  });

  const { fields, append } = useFieldArray({
    name: "urls",
    control: form.control
  });

  function onSubmit(data: ProfileFormValues) {}

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isRtl ? "اسم المستخدم" : "Username"}</FormLabel>
              <FormControl>
                <Input placeholder={isRtl ? "مثال: taqam" : "e.g. shadcn"} {...field} />
              </FormControl>
              <FormDescription>
                {isRtl
                  ? "هذا هو الاسم الظاهر للآخرين داخل النظام. يمكنك تغييره مرة كل 30 يومًا."
                  : "This is your public display name. You can only change this once every 30 days."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isRtl ? "البريد الإلكتروني" : "Email"}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={isRtl ? "example@company.com" : "example@company.com"}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {isRtl
                  ? "سيتم ربط البريد الإلكتروني بالحساب عند تفعيل الربط بقاعدة البيانات."
                  : "Email will be linked to your account once database integration is enabled."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isRtl ? "نبذة" : "Bio"}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={isRtl ? "اكتب نبذة قصيرة عنك" : "Tell us a little bit about yourself"}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {isRtl
                  ? "يمكنك الإشارة إلى المستخدمين أو الجهات باستخدام @."
                  : "You can @mention other users and organizations to link to them."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`urls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && "sr-only")}>
                    {isRtl ? "روابط" : "URLs"}
                  </FormLabel>
                  <FormDescription className={cn(index !== 0 && "sr-only")}>
                    {isRtl
                      ? "أضف روابط لموقعك أو حسابات التواصل الاجتماعي."
                      : "Add links to your website, blog, or social media profiles."}
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder={isRtl ? "https://..." : "https://..."}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append({ value: "" })}>
            {isRtl ? "إضافة رابط" : "Add URL"}
          </Button>
        </div>
        <Button type="submit">{isRtl ? "تحديث الملف" : "Update profile"}</Button>
      </form>
    </Form>
  );
}
