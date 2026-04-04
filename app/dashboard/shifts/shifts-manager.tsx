"use client";

import * as React from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconClock,
  IconCalendar,
  IconSun,
  IconMoon,
  IconSunset,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type Shift,
  formatTime,
  dayNames,
} from "@/lib/types/attendance";
import { attendanceService } from "@/lib/api";

export function ShiftsManager() {
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [editingShift, setEditingShift] = React.useState<Shift | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await attendanceService.getShifts();
        if (!mounted) return;
        if (res.success && res.data) {
          setShifts(res.data);
        } else {
          setShifts([]);
          setError(res.error || "فشل تحميل الورديات");
        }
      } catch (e) {
        if (!mounted) return;
        setShifts([]);
        setError(e instanceof Error ? e.message : "فشل تحميل الورديات");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    nameAr: "",
    code: "",
    startTime: "08:00",
    endTime: "16:00",
    breakStartTime: "",
    breakEndTime: "",
    flexibleStartMinutes: 15,
    flexibleEndMinutes: 15,
    workDays: [0, 1, 2, 3, 4] as number[],
    overtimeEnabled: true,
    overtimeMultiplier: 1.5,
    color: "#3B82F6",
    isDefault: false,
  });

  // Filter shifts
  const filteredShifts = shifts.filter((shift) =>
    shift.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shift.nameAr.includes(searchQuery) ||
    shift.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      code: "",
      startTime: "08:00",
      endTime: "16:00",
      breakStartTime: "",
      breakEndTime: "",
      flexibleStartMinutes: 15,
      flexibleEndMinutes: 15,
      workDays: [0, 1, 2, 3, 4],
      overtimeEnabled: true,
      overtimeMultiplier: 1.5,
      color: "#3B82F6",
      isDefault: false,
    });
  };

  // Open edit dialog
  const openEditDialog = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      nameAr: shift.nameAr,
      code: shift.code,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakStartTime: shift.breakStartTime || "",
      breakEndTime: shift.breakEndTime || "",
      flexibleStartMinutes: shift.flexibleStartMinutes || 15,
      flexibleEndMinutes: shift.flexibleEndMinutes || 15,
      workDays: shift.workDays,
      overtimeEnabled: shift.overtimeEnabled,
      overtimeMultiplier: shift.overtimeMultiplier || 1.5,
      color: shift.color,
      isDefault: shift.isDefault,
    });
  };

  // Handle save
  const handleSave = () => {
    if (editingShift) {
      // Update
      setShifts((prev) =>
        prev.map((s) =>
          s.id === editingShift.id
            ? {
                ...s,
                ...formData,
                breakDurationMinutes: formData.breakStartTime && formData.breakEndTime
                  ? calculateBreakMinutes(formData.breakStartTime, formData.breakEndTime)
                  : undefined,
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
      setEditingShift(null);
    } else {
      // Create
      const newShift: Shift = {
        id: `shift-${Date.now()}`,
        tenantId: "tenant-1",
        ...formData,
        breakDurationMinutes: formData.breakStartTime && formData.breakEndTime
          ? calculateBreakMinutes(formData.breakStartTime, formData.breakEndTime)
          : undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // If this is default, remove default from others
      if (newShift.isDefault) {
        setShifts((prev) => prev.map((s) => ({ ...s, isDefault: false })));
      }
      
      setShifts((prev) => [...prev, newShift]);
      setIsAddOpen(false);
    }
    resetForm();
  };

  // Handle delete
  const handleDelete = (shiftId: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
  };

  // Toggle work day
  const toggleWorkDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter((d) => d !== day)
        : [...prev.workDays, day].sort(),
    }));
  };

  // Calculate break minutes
  const calculateBreakMinutes = (start: string, end: string): number => {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

  // Get shift icon
  const getShiftIcon = (startTime: string) => {
    const hour = parseInt(startTime.split(":")[0]);
    if (hour >= 6 && hour < 14) return <IconSun className="h-5 w-5 text-yellow-500" />;
    if (hour >= 14 && hour < 20) return <IconSunset className="h-5 w-5 text-orange-500" />;
    return <IconMoon className="h-5 w-5 text-indigo-500" />;
  };

  // Form component (shared between add and edit)
  const ShiftForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>الاسم (عربي)</Label>
          <Input
            value={formData.nameAr}
            onChange={(e) => setFormData((p) => ({ ...p, nameAr: e.target.value }))}
            placeholder="الوردية الصباحية"
          />
        </div>
        <div className="space-y-2">
          <Label>الاسم (إنجليزي)</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            placeholder="Morning Shift"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>الكود</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            placeholder="MORNING"
          />
        </div>
        <div className="space-y-2">
          <Label>اللون</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
              className="w-12 h-10 p-1"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>وقت البداية</Label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>وقت النهاية</Label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>بداية الاستراحة (اختياري)</Label>
          <Input
            type="time"
            value={formData.breakStartTime}
            onChange={(e) => setFormData((p) => ({ ...p, breakStartTime: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>نهاية الاستراحة (اختياري)</Label>
          <Input
            type="time"
            value={formData.breakEndTime}
            onChange={(e) => setFormData((p) => ({ ...p, breakEndTime: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>مرونة الحضور (دقائق)</Label>
          <Input
            type="number"
            value={formData.flexibleStartMinutes}
            onChange={(e) => setFormData((p) => ({ ...p, flexibleStartMinutes: parseInt(e.target.value) || 0 }))}
            min={0}
            max={60}
          />
        </div>
        <div className="space-y-2">
          <Label>مرونة الانصراف (دقائق)</Label>
          <Input
            type="number"
            value={formData.flexibleEndMinutes}
            onChange={(e) => setFormData((p) => ({ ...p, flexibleEndMinutes: parseInt(e.target.value) || 0 }))}
            min={0}
            max={60}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>أيام العمل</Label>
        <div className="flex flex-wrap gap-2">
          {dayNames.ar.map((day, index) => (
            <label
              key={index}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                formData.workDays.includes(index)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted"
              }`}
            >
              <Checkbox
                checked={formData.workDays.includes(index)}
                onCheckedChange={() => toggleWorkDay(index)}
                className="hidden"
              />
              <span className="text-sm">{day}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.overtimeEnabled}
            onCheckedChange={(checked) => setFormData((p) => ({ ...p, overtimeEnabled: checked }))}
          />
          <Label>تفعيل العمل الإضافي</Label>
        </div>
        {formData.overtimeEnabled && (
          <div className="flex items-center gap-2">
            <Label>معامل الأجر:</Label>
            <Input
              type="number"
              value={formData.overtimeMultiplier}
              onChange={(e) => setFormData((p) => ({ ...p, overtimeMultiplier: parseFloat(e.target.value) || 1 }))}
              className="w-20"
              step={0.25}
              min={1}
              max={3}
            />
            <span className="text-muted-foreground">×</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isDefault}
          onCheckedChange={(checked) => setFormData((p) => ({ ...p, isDefault: checked }))}
        />
        <Label>وردية افتراضية</Label>
      </div>
    </div>
  );

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          جاري تحميل الورديات...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          {error}
        </div>
      ) : null}

    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الورديات</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shifts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ورديات نشطة</CardTitle>
            <IconCalendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {shifts.filter((s) => s.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الوردية الافتراضية</CardTitle>
            <IconSun className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {shifts.find((s) => s.isDefault)?.nameAr || "غير محددة"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث في الورديات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <IconPlus className="ms-2 h-4 w-4" />
              إضافة وردية
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة وردية جديدة</DialogTitle>
              <DialogDescription>
                أدخل بيانات الوردية الجديدة
              </DialogDescription>
            </DialogHeader>
            <ShiftForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={!formData.nameAr || !formData.code}>
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Shifts Table */}
      <Card>
        <CardHeader>
          <CardTitle>الورديات</CardTitle>
          <CardDescription>
            قائمة بجميع ورديات العمل ({filteredShifts.length} وردية)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوردية</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead>وقت العمل</TableHead>
                <TableHead>الاستراحة</TableHead>
                <TableHead>أيام العمل</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-start">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <IconClock className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">لا توجد ورديات</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredShifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full border border-border bg-muted"
                          title={shift.color || "default"}
                        />
                        {getShiftIcon(shift.startTime)}
                        <div>
                          <p className="font-medium">{shift.nameAr}</p>
                          <p className="text-xs text-muted-foreground">{shift.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{shift.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {shift.breakDurationMinutes ? (
                        <span className="text-sm text-muted-foreground">
                          {shift.breakDurationMinutes} دقيقة
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {shift.workDays.map((day) => (
                          <span
                            key={day}
                            className="text-xs px-1.5 py-0.5 bg-muted rounded"
                          >
                            {dayNames.ar[day].slice(0, 2)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {shift.isDefault && (
                          <Badge variant="default">افتراضية</Badge>
                        )}
                        {shift.isActive ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            نشطة
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            غير نشطة
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Dialog
                          open={editingShift?.id === shift.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setEditingShift(null);
                              resetForm();
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="تعديل"
                              onClick={() => openEditDialog(shift)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-full sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>تعديل الوردية</DialogTitle>
                              <DialogDescription>
                                تعديل بيانات الوردية &quot;{shift.nameAr}&quot;
                              </DialogDescription>
                            </DialogHeader>
                            <ShiftForm />
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingShift(null);
                                  resetForm();
                                }}
                              >
                                إلغاء
                              </Button>
                              <Button onClick={handleSave}>حفظ التغييرات</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="حذف" className="text-destructive">
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف الوردية</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف &quot;{shift.nameAr}&quot;؟ هذا الإجراء لا يمكن التراجع عنه.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(shift.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
