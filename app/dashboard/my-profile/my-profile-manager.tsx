"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { 
  User, Mail, Phone, MapPin, Building2, Calendar, CreditCard,
  Shield, Edit, Save, X, Camera, FileText, AlertCircle, Loader2
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { EmployeeDocument, EmployeeProfile } from '@/lib/types/self-service';

type ProfileApiResponse = {
  data?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    phone: string | null;
    role: string;
    status: string;
    lastLoginAt: string | null;
    employee?: {
      id: string;
      employeeNumber: string;
      firstNameAr: string | null;
      lastNameAr: string | null;
      nationalId: string | null;
      dateOfBirth: string | null;
      gender: 'MALE' | 'FEMALE' | null;
      nationality: string | null;
      maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | null;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
      } | null;
      emergencyContact?: {
        name?: string;
        relationship?: string;
        phone?: string;
        email?: string;
      } | null;
      bankInfo?: {
        bankName: string;
        accountNumber: string;
        iban?: string;
        swiftCode?: string;
      } | null;
      hireDate: string;
      employmentType: string;
      workLocation: string | null;
      department?: { id: string; name: string; nameAr: string | null } | null;
      jobTitle?: { id: string; name: string; nameAr: string | null } | null;
      manager?: { id: string; firstName: string; lastName: string } | null;
    } | null;
    tenant?: { id: string; name: string; nameAr: string | null; logo: string | null } | null;
  };
  error?: string;
};

type DocumentsApiResponse = {
  data?: Array<{
    id: string;
    title: string;
    titleAr: string | null;
    url: string;
    expiryDate: string | null;
    createdAt: string;
    category: string;
  }>;
  error?: string;
};

type DocumentItem = NonNullable<DocumentsApiResponse['data']>[number];

function mapGenderToUi(value: 'MALE' | 'FEMALE' | null | undefined): 'male' | 'female' {
  if (value === 'FEMALE') return 'female';
  return 'male';
}

function mapMaritalStatusToUi(
  value: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | null | undefined
): EmployeeProfile['maritalStatus'] {
  switch (value) {
    case 'SINGLE':
      return 'single';
    case 'MARRIED':
      return 'married';
    case 'DIVORCED':
      return 'divorced';
    case 'WIDOWED':
      return 'widowed';
    default:
      return undefined;
  }
}

function mapUiGenderToDb(value: 'male' | 'female'): 'MALE' | 'FEMALE' {
  return value === 'female' ? 'FEMALE' : 'MALE';
}

function mapUiMaritalStatusToDb(
  value: EmployeeProfile['maritalStatus']
): 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | null {
  switch (value) {
    case 'single':
      return 'SINGLE';
    case 'married':
      return 'MARRIED';
    case 'divorced':
      return 'DIVORCED';
    case 'widowed':
      return 'WIDOWED';
    default:
      return null;
  }
}

function mapDocumentToEmployeeDocument(doc: DocumentItem): EmployeeDocument {
  return {
    id: doc.id,
    name: doc.titleAr || doc.title,
    type: 'other',
    fileUrl: doc.url,
    expiryDate: doc.expiryDate || undefined,
    uploadedAt: doc.createdAt,
  };
}

function mapProfileApiToEmployeeProfile(api: NonNullable<ProfileApiResponse['data']>, documents: EmployeeDocument[]): EmployeeProfile {
  const employee = api.employee;

  return {
    id: employee?.id ?? api.id,
    employeeNumber: employee?.employeeNumber ?? '-',
    firstName: employee?.firstNameAr || api.firstName,
    lastName: employee?.lastNameAr || api.lastName,
    firstNameEn: api.firstName,
    lastNameEn: api.lastName,
    email: api.email,
    phone: api.phone ?? '',
    avatar: api.avatar ?? undefined,
    departmentId: employee?.department?.id ?? '',
    departmentName: employee?.department?.nameAr || employee?.department?.name || '-',
    jobTitleId: employee?.jobTitle?.id ?? '',
    jobTitle: employee?.jobTitle?.nameAr || employee?.jobTitle?.name || '-',
    managerId: employee?.manager?.id ?? undefined,
    managerName: employee?.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : undefined,
    hireDate: employee?.hireDate ?? new Date().toISOString(),
    birthDate: employee?.dateOfBirth ?? undefined,
    gender: mapGenderToUi(employee?.gender ?? null),
    maritalStatus: mapMaritalStatusToUi(employee?.maritalStatus ?? null),
    nationality: employee?.nationality ?? undefined,
    nationalId: employee?.nationalId ?? undefined,
    address: employee?.address ?? undefined,
    emergencyContact: employee?.emergencyContact
      ? {
          name: employee.emergencyContact.name ?? '',
          relationship: employee.emergencyContact.relationship ?? '',
          phone: employee.emergencyContact.phone ?? '',
          email: employee.emergencyContact.email ?? undefined,
        }
      : undefined,
    bankInfo: employee?.bankInfo ?? undefined,
    documents,
  };
}

export default function MyProfileManager() {
  const { update: updateSession } = useSession();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const employeeIdForDocs = useMemo(() => {
    if (!profile) return null;
    // If user has no employee record, profile.id is userId.
    if (profile.employeeNumber === '-' || !profile.employeeNumber) return null;
    return profile.id;
  }, [profile]);

  async function loadProfile() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      const json = (await res.json()) as ProfileApiResponse;

      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch profile');
      }

      if (!json.data) {
        throw new Error('Invalid profile response');
      }

      let documents: EmployeeDocument[] = [];
      const employeeId = json.data.employee?.id;
      if (employeeId) {
        const docsRes = await fetch(`/api/documents?employeeId=${encodeURIComponent(employeeId)}`, {
          cache: 'no-store',
        });
        const docsJson = (await docsRes.json()) as DocumentsApiResponse;
        if (docsRes.ok && Array.isArray(docsJson.data)) {
          documents = docsJson.data.map(mapDocumentToEmployeeDocument);
        }
      }

      const mapped = mapProfileApiToEmployeeProfile(json.data, documents);
      setProfile(mapped);
      setEditedProfile(mapped);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load profile';
      toast.error(message);
      setProfile(null);
      setEditedProfile(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleSave = async () => {
    if (!editedProfile || !profile) return;
    setIsSaving(true);
    try {
      // Update user-level fields
      const userPayload = {
        firstName: editedProfile.firstNameEn || editedProfile.firstName,
        lastName: editedProfile.lastNameEn || editedProfile.lastName,
        phone: editedProfile.phone,
        avatar: editedProfile.avatar,
      };

      const userRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload),
      });

      const userJson = await userRes.json();
      if (!userRes.ok) {
        throw new Error(userJson.error || 'Failed to update profile');
      }

      // Refresh NextAuth session (sidebar avatar/name) if supported
      try {
        await updateSession({
          avatar: userJson?.data?.avatar ?? editedProfile.avatar,
          firstName: userJson?.data?.firstName,
          lastName: userJson?.data?.lastName,
          name: `${userJson?.data?.firstName ?? ''} ${userJson?.data?.lastName ?? ''}`.trim(),
        } as any);
      } catch {
        // Ignore session update errors
      }

      // Update employee-level fields when employee exists
      const hasEmployee = profile.employeeNumber !== '-' && !!profile.employeeNumber;
      if (hasEmployee) {
        const employeePayload = {
          firstNameAr: editedProfile.firstName,
          lastNameAr: editedProfile.lastName,
          phone: editedProfile.phone,
          email: editedProfile.email,
          nationalId: editedProfile.nationalId,
          dateOfBirth: editedProfile.birthDate || null,
          gender: mapUiGenderToDb(editedProfile.gender),
          maritalStatus: mapUiMaritalStatusToDb(editedProfile.maritalStatus),
          nationality: editedProfile.nationality || null,
          address: editedProfile.address || null,
          emergencyContact: editedProfile.emergencyContact || null,
        };

        const empRes = await fetch(`/api/employees/${encodeURIComponent(profile.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeePayload),
        });
        const empJson = await empRes.json();
        if (!empRes.ok) {
          throw new Error(empJson.error || 'Failed to update employee profile');
        }
      }

      toast.success('تم حفظ التغييرات');
      setIsEditing(false);
      await loadProfile();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const openAvatarPicker = () => {
    fileInputRef.current?.click();
  };

  const onAvatarSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    if (!editedProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('الملف المختار ليس صورة');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('حجم الصورة كبير (الحد 3MB)');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.set('file', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'فشل رفع الصورة');
      }

      const url = json?.data?.url as string | undefined;
      if (!url) throw new Error('فشل رفع الصورة');

      setEditedProfile((p) => (p ? { ...p, avatar: url } : p));
      toast.success('تم تحديث الصورة');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل رفع الصورة';
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  const openDocumentPicker = () => {
    if (!employeeIdForDocs) {
      toast.error('لا يوجد ملف موظف مرتبط بهذا الحساب');
      return;
    }
    documentInputRef.current?.click();
  };

  const onDocumentSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!employeeIdForDocs) {
      toast.error('لا يوجد ملف موظف مرتبط بهذا الحساب');
      return;
    }

    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('employeeId', employeeIdForDocs);
      formData.set('title', file.name);
      formData.set('category', 'PERSONAL');

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'فشل رفع المستند');
      }

      toast.success('تم رفع المستند');
      await loadProfile();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل رفع المستند';
      toast.error(message);
    } finally {
      setIsUploadingDoc(false);
      if (e.target) e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">ملفي الشخصي</h1>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="h-24" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile || !editedProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">ملفي الشخصي</h1>
          <p className="text-muted-foreground">تعذر تحميل الملف الشخصي</p>
        </div>
        <Button variant="outline" onClick={() => void loadProfile()}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">ملفي الشخصي</h1>
          <p className="text-muted-foreground">عرض وتعديل معلوماتك الشخصية</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 me-2" />
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 me-2" />
                {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 me-2" />
              تعديل البيانات
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={(isEditing ? (editedProfile?.avatar || profile.avatar) : profile.avatar) || undefined}
                  alt=""
                />
                <AvatarFallback className="text-2xl">
                  {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="absolute bottom-0 start-0 h-8 w-8 rounded-full"
                  aria-label="تغيير الصورة"
                  onClick={openAvatarPicker}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="اختيار صورة الملف الشخصي"
                onChange={onAvatarSelected}
              />
            </div>
            <div className="text-center sm:text-start flex-1">
              <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
              <p className="text-muted-foreground">{profile.jobTitle}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2 sm:justify-start">
                <Badge variant="secondary">{profile.departmentName}</Badge>
                <Badge variant="outline">#{profile.employeeNumber}</Badge>
              </div>
            </div>
            <div className="text-center sm:text-start">
              <p className="text-sm text-muted-foreground">تاريخ الانضمام</p>
              <p className="font-medium">{new Date(profile.hireDate).toLocaleDateString('ar-SA')}</p>
              <p className="text-sm text-muted-foreground mt-2">المدير المباشر</p>
              <p className="font-medium">{profile.managerName || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">البيانات الشخصية</TabsTrigger>
          <TabsTrigger value="contact">معلومات الاتصال</TabsTrigger>
          <TabsTrigger value="bank">البيانات البنكية</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                المعلومات الشخصية
              </CardTitle>
              <CardDescription>البيانات الأساسية والشخصية</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>الاسم الأول (عربي)</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.firstName}
                    onChange={(e) => setEditedProfile({...editedProfile, firstName: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{profile.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>الاسم الأخير (عربي)</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.lastName}
                    onChange={(e) => setEditedProfile({...editedProfile, lastName: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{profile.lastName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>الاسم الأول (إنجليزي)</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.firstNameEn || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, firstNameEn: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{profile.firstNameEn || '-'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>الاسم الأخير (إنجليزي)</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.lastNameEn || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, lastNameEn: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{profile.lastNameEn || '-'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>تاريخ الميلاد</Label>
                {isEditing ? (
                  <Input 
                    type="date"
                    value={editedProfile.birthDate || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, birthDate: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">
                    {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('ar-SA') : '-'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>الجنس</Label>
                {isEditing ? (
                  <Select 
                    value={editedProfile.gender}
                    onValueChange={(value: 'male' | 'female') => setEditedProfile({...editedProfile, gender: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">
                    {profile.gender === 'male' ? 'ذكر' : 'أنثى'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>الحالة الاجتماعية</Label>
                {isEditing ? (
                  <Select 
                    value={editedProfile.maritalStatus || ''}
                    onValueChange={(value: 'single' | 'married' | 'divorced' | 'widowed') => 
                      setEditedProfile({...editedProfile, maritalStatus: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">أعزب</SelectItem>
                      <SelectItem value="married">متزوج</SelectItem>
                      <SelectItem value="divorced">مطلق</SelectItem>
                      <SelectItem value="widowed">أرمل</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">
                    {profile.maritalStatus === 'single' ? 'أعزب' : 
                     profile.maritalStatus === 'married' ? 'متزوج' : 
                     profile.maritalStatus === 'divorced' ? 'مطلق' : 'أرمل'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>الجنسية</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.nationality || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, nationality: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{profile.nationality || '-'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>رقم الهوية</Label>
                <p className="text-sm font-medium p-2 bg-muted rounded flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {profile.nationalId || '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                معلومات الاتصال
              </CardTitle>
              <CardDescription>بيانات التواصل والعنوان</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <p className="text-sm font-medium p-2 bg-muted rounded flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {profile.email}
                </p>
              </div>
              <div className="space-y-2">
                <Label>رقم الجوال</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {profile.phone}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <Separator className="my-4" />
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  العنوان
                </h4>
              </div>
              <div className="space-y-2">
                <Label>الشارع</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.address?.street || ''}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile, 
                      address: { ...(editedProfile.address || {}), street: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{profile.address?.street || '-'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>المدينة</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.address?.city || ''}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile, 
                      address: { ...(editedProfile.address || {}), city: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{profile.address?.city || '-'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>الدولة</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.address?.country || ''}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile, 
                      address: { ...(editedProfile.address || {}), country: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{profile.address?.country || '-'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>الرمز البريدي</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.address?.postalCode || ''}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile, 
                      address: { ...(editedProfile.address || {}), postalCode: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{profile.address?.postalCode || '-'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Separator className="my-4" />
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  جهة اتصال الطوارئ
                </h4>
              </div>
              <div className="space-y-2">
                <Label>الاسم</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.emergencyContact?.name || ''}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile, 
                      emergencyContact: { ...(editedProfile.emergencyContact || { name: '', relationship: '', phone: '' }), name: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{profile.emergencyContact?.name || '-'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>صلة القرابة</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.emergencyContact?.relationship || ''}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile, 
                      emergencyContact: { ...(editedProfile.emergencyContact || { name: '', relationship: '', phone: '' }), relationship: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{profile.emergencyContact?.relationship || '-'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                {isEditing ? (
                  <Input 
                    value={editedProfile.emergencyContact?.phone || ''}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile, 
                      emergencyContact: { ...(editedProfile.emergencyContact || { name: '', relationship: '', phone: '' }), phone: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-sm font-medium p-2 bg-muted rounded">{profile.emergencyContact?.phone || '-'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Info Tab */}
        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                البيانات البنكية
              </CardTitle>
              <CardDescription>معلومات الحساب البنكي لتحويل الراتب</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>اسم البنك</Label>
                <p className="text-sm font-medium p-2 bg-muted rounded">{profile.bankInfo?.bankName || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>رقم الحساب</Label>
                <p className="text-sm font-medium p-2 bg-muted rounded">{profile.bankInfo?.accountNumber || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>رقم الآيبان</Label>
                <p className="text-sm font-medium p-2 bg-muted rounded">{profile.bankInfo?.iban || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>رمز SWIFT</Label>
                <p className="text-sm font-medium p-2 bg-muted rounded">{profile.bankInfo?.swiftCode || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    لتحديث البيانات البنكية، يرجى التواصل مع قسم الموارد البشرية
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                المستندات
              </CardTitle>
              <CardDescription>الوثائق والمستندات الشخصية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(profile.documents || []).length === 0 ? (
                  <div className="md:col-span-2 lg:col-span-3 text-sm text-muted-foreground">
                    لا توجد مستندات بعد.
                  </div>
                ) : (
                  (profile.documents || []).map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {doc.expiryDate ? `ينتهي: ${new Date(doc.expiryDate).toLocaleDateString('ar-SA')}` : '—'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')}
                      >
                        عرض
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" onClick={openDocumentPicker} disabled={isUploadingDoc}>
                  <Camera className="h-4 w-4 me-2" />
                  {isUploadingDoc ? 'جاري الرفع...' : 'رفع مستند جديد'}
                </Button>
                <input
                  ref={documentInputRef}
                  type="file"
                  className="hidden"
                  aria-label="رفع مستند جديد"
                  onChange={(e) => void onDocumentSelected(e)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
