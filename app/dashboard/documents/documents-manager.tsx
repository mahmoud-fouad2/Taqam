"use client";

import * as React from "react";
import {
  IconUpload,
  IconSearch,
  IconFilter,
  IconFile,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconPhoto,
  IconDownload,
  IconTrash,
  IconCheck,
  IconX,
  IconEye,
  IconClock,
  IconAlertCircle
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { TableEmptyRow } from "@/components/empty-states/table-empty-row";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type Document,
  type DocumentCategory,
  type DocumentStatus,
  documentCategoryLabels,
  documentStatusLabels,
  formatFileSize,
  isDocumentExpired
} from "@/lib/types/documents";
import { documentsService } from "@/lib/api";
import { useEmployees } from "@/hooks/use-employees";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function DocumentsManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const { employees, getEmployeeFullName } = useEmployees();
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<DocumentCategory | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<DocumentStatus | "all">("all");
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [selectedDocument, setSelectedDocument] = React.useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const fetchDocuments = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await documentsService.getAll();
      if (res.success && res.data) {
        setDocuments(res.data);
      } else {
        setDocuments([]);
        setError(res.error ?? t.documents.uploadFailed);
      }
    } catch (e) {
      setDocuments([]);
      setError(e instanceof Error ? e.message : t.documents.uploadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [t.documents.uploadFailed]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Upload form state
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = React.useState<DocumentCategory>("personal");
  const [uploadTitle, setUploadTitle] = React.useState("");
  const [uploadTitleAr, setUploadTitleAr] = React.useState("");
  const [uploadEmployeeId, setUploadEmployeeId] = React.useState<string>("");
  const [uploadDescription, setUploadDescription] = React.useState("");
  const [uploadExpiry, setUploadExpiry] = React.useState("");
  const [uploadIssued, setUploadIssued] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.titleAr?.includes(searchQuery) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Stats
  const stats = {
    total: documents.length,
    pending: documents.filter((d) => d.status === "pending").length,
    approved: documents.filter((d) => d.status === "approved").length,
    expiringSoon: documents.filter((d) => {
      if (!d.expiryDate) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length
  };

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFile || !uploadEmployeeId || !uploadTitle) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await documentsService.upload({
        file: uploadFile,
        employeeId: uploadEmployeeId,
        category: uploadCategory,
        title: uploadTitle,
        titleAr: uploadTitleAr || undefined,
        description: uploadDescription || undefined,
        expiryDate: uploadExpiry || undefined,
        issuedDate: uploadIssued || undefined
      });

      if (!res.success) {
        setActionError(res.error ?? t.documents.uploadFailed);
        return;
      }

      await fetchDocuments();
      resetUploadForm();
      setIsUploadOpen(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t.documents.uploadFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadCategory("personal");
    setUploadTitle("");
    setUploadTitleAr("");
    setUploadEmployeeId("");
    setUploadDescription("");
    setUploadExpiry("");
    setUploadIssued("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle approve/reject
  const handleStatusChange = async (docId: string, newStatus: "approved" | "rejected") => {
    setActionError(null);
    try {
      const res =
        newStatus === "approved"
          ? await documentsService.approve(docId)
          : await documentsService.reject(docId, t.common.rejected);

      if (!res.success) {
        setActionError(res.error ?? t.documents.statusUpdateFailed);
        return;
      }

      await fetchDocuments();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t.documents.statusUpdateFailed);
    }
  };

  // Handle delete
  const handleDelete = async (docId: string) => {
    setActionError(null);
    try {
      const res = await documentsService.delete(docId);
      if (!res.success) {
        setActionError(res.error ?? t.documents.deleteFailed);
        return;
      }
      await fetchDocuments();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t.documents.deleteFailed);
    }
  };

  // Get employee name
  const getEmployeeName = (employeeId: string) => {
    return getEmployeeFullName(employeeId);
  };

  // Get status badge variant
  const getStatusVariant = (
    status: DocumentStatus
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      case "expired":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Get file icon component
  const FileIconComponent = ({ mimeType }: { mimeType: string }) => {
    if (mimeType.includes("pdf")) return <IconFileTypePdf className="h-5 w-5 text-red-500" />;
    if (mimeType.includes("image")) return <IconPhoto className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return <IconFileTypeDoc className="h-5 w-5 text-blue-600" />;
    return <IconFile className="h-5 w-5 text-gray-500" />;
  };

  const handleDownload = async (doc: Document) => {
    setActionError(null);
    try {
      if (doc.url) {
        window.open(doc.url, "_blank");
        return;
      }

      const res = await documentsService.download(doc.id);
      if (!res.success || !res.data) {
        setActionError(res.error ?? t.documents.downloadFailed);
        return;
      }

      const blob =
        res.data instanceof Blob ? res.data : new Blob([res.data as unknown as BlobPart]);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t.documents.downloadFailed);
    }
  };

  return (
    <div className="space-y-6">
      {(error || actionError) && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4">
          {actionError ?? error}
        </div>
      )}
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.documents.totalDocuments}</CardTitle>
            <IconFile className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.documents.pendingApproval}</CardTitle>
            <IconClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.documents.approved}</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.documents.expiringSoon}</CardTitle>
            <IconAlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <IconSearch className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={t.documents.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value as DocumentCategory | "all")}>
            <SelectTrigger className="w-[160px]">
              <IconFilter className="ms-2 h-4 w-4" />
              <SelectValue placeholder={t.common.category} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.documents.allCategories}</SelectItem>
              {Object.entries(documentCategoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label.ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as DocumentStatus | "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t.common.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.attendance.allStatuses}</SelectItem>
              {Object.entries(documentStatusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label.ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Upload Dialog */}
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconUpload className="ms-2 h-4 w-4" />
              {t.documents.upload}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t.documents.uploadDialog}</DialogTitle>
              <DialogDescription>{t.documents.uploadDesc}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* File Input */}
              <div className="space-y-2">
                <Label>{t.documents.chooseFile}</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  aria-label={t.documents.uploadDocument}
                />
                <button
                  type="button"
                  className="hover:border-primary focus-visible:ring-ring w-full cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  onClick={() => fileInputRef.current?.click()}>
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileIconComponent mimeType={uploadFile.type} />
                      <span className="font-medium">{uploadFile.name}</span>
                      <span className="text-muted-foreground">
                        ({formatFileSize(uploadFile.size)})
                      </span>
                    </div>
                  ) : (
                    <>
                      <IconUpload className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                      <p className="text-muted-foreground text-sm">{t.documents.clickToChoose}</p>
                    </>
                  )}
                </button>
              </div>

              {/* Employee Select */}
              <div className="space-y-2">
                <Label>{t.common.employee}</Label>
                <Select value={uploadEmployeeId} onValueChange={setUploadEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.common.selectEmployee} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        {t.documents.noEmployees}
                      </SelectItem>
                    ) : (
                      employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {getEmployeeFullName(emp.id)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>{t.common.category}</Label>
                <Select
                  value={uploadCategory}
                  onValueChange={(v) => setUploadCategory(v as DocumentCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentCategoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label.ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.documents.titleAr}</Label>
                  <Input
                    value={uploadTitleAr}
                    onChange={(e) => setUploadTitleAr(e.target.value)}
                    placeholder={t.documents.exampleId}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.documents.titleEn}</Label>
                  <Input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g., National ID"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>{t.documents.descriptionOptional}</Label>
                <Textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder={t.documents.descriptionPlaceholder}
                  rows={2}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.documents.issueDateOptional}</Label>
                  <Input
                    type="date"
                    value={uploadIssued}
                    onChange={(e) => setUploadIssued(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.documents.expiryDateOptional}</Label>
                  <Input
                    type="date"
                    value={uploadExpiry}
                    onChange={(e) => setUploadExpiry(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isSubmitting || !uploadFile || !uploadEmployeeId || !uploadTitle}>
                {isSubmitting ? t.documents.uploading : t.documents.uploadDoc}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t.documents.title}</CardTitle>
          <CardDescription>
            {t.documents.docListDesc} ({filteredDocuments.length} {t.documents.docCount})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile: Cards */}
          <div className="space-y-3 md:hidden">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <div className="min-w-0 space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-x-3 gap-y-2 md:grid-cols-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredDocuments.length === 0 ? (
              <Empty className="rounded-lg border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconFile className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>{t.common.noData}</EmptyTitle>
                  <EmptyDescription>{t.documents.emptyState}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setIsUploadOpen(true)}>
                    <IconUpload className="ms-2 h-4 w-4" />
                    {t.documents.upload}
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              filteredDocuments.map((doc) => (
                <Card key={doc.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                            <FileIconComponent mimeType={doc.mimeType} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {doc.titleAr || doc.title}
                            </div>
                            <div className="text-muted-foreground truncate text-xs">
                              {formatFileSize(doc.size)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-2 text-sm md:grid-cols-2">
                          <div className="text-muted-foreground">{t.common.employee}</div>
                          <div className="truncate text-start">
                            {getEmployeeName(doc.employeeId)}
                          </div>

                          <div className="text-muted-foreground">{t.common.category}</div>
                          <div className="text-start">
                            <Badge variant="outline">
                              {documentCategoryLabels[doc.category].ar}
                            </Badge>
                          </div>

                          <div className="text-muted-foreground">{t.common.status}</div>
                          <div className="text-start">
                            <Badge variant={getStatusVariant(doc.status)}>
                              {documentStatusLabels[doc.status].ar}
                            </Badge>
                          </div>

                          <div className="text-muted-foreground">{t.common.date}</div>
                          <div className="text-start text-sm">
                            {new Date(doc.uploadedAt).toLocaleDateString("ar-SA")}
                          </div>

                          <div className="text-muted-foreground">{t.common.endDate}</div>
                          <div className="text-start">
                            {doc.expiryDate ? (
                              <span
                                className={
                                  isDocumentExpired(doc) ? "text-red-600" : "text-muted-foreground"
                                }>
                                {new Date(doc.expiryDate).toLocaleDateString("ar-SA")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t.common.view}
                          onClick={() => {
                            setSelectedDocument(doc);
                            setIsPreviewOpen(true);
                          }}>
                          <IconEye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t.common.download}
                          onClick={() => handleDownload(doc)}>
                          <IconDownload className="h-4 w-4" />
                        </Button>

                        {doc.status === "pending" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t.common.accept}
                              className="text-green-600"
                              onClick={() => handleStatusChange(doc.id, "approved")}>
                              <IconCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t.common.reject}
                              className="text-red-600"
                              onClick={() => handleStatusChange(doc.id, "rejected")}>
                              <IconX className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t.common.delete}
                              className="text-destructive">
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t.common.delete}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.documents.deleteConfirmPrefix} &quot;{doc.titleAr || doc.title}
                                &quot;?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(doc.id)}
                                className="bg-destructive">
                                {t.common.delete}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.common.name}</TableHead>
                  <TableHead>{t.common.employee}</TableHead>
                  <TableHead>{t.common.category}</TableHead>
                  <TableHead>{t.common.status}</TableHead>
                  <TableHead>{t.common.date}</TableHead>
                  <TableHead>{t.common.endDate}</TableHead>
                  <TableHead className="text-start">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6">
                      <TableSkeleton columns={7} rows={6} showHeader={false} />
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableEmptyRow
                    colSpan={7}
                    title={t.documents.noDocsTitle}
                    description={t.documents.emptyDescription}
                    icon={<IconFile className="size-5" />}
                    actionLabel={t.documents.uploadDocument}
                    onAction={() => setIsUploadOpen(true)}
                  />
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileIconComponent mimeType={doc.mimeType} />
                          <div>
                            <p className="text-sm font-medium">{doc.titleAr || doc.title}</p>
                            <p className="text-muted-foreground text-xs">
                              {formatFileSize(doc.size)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getEmployeeName(doc.employeeId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{documentCategoryLabels[doc.category].ar}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(doc.status)}>
                          {documentStatusLabels[doc.status].ar}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(doc.uploadedAt).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell>
                        {doc.expiryDate ? (
                          <span
                            className={
                              isDocumentExpired(doc) ? "text-red-600" : "text-muted-foreground"
                            }>
                            {new Date(doc.expiryDate).toLocaleDateString("ar-SA")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t.common.view}
                            onClick={() => {
                              setSelectedDocument(doc);
                              setIsPreviewOpen(true);
                            }}>
                            <IconEye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t.common.download}
                            onClick={() => handleDownload(doc)}>
                            <IconDownload className="h-4 w-4" />
                          </Button>

                          {doc.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t.common.accept}
                                className="text-green-600"
                                onClick={() => handleStatusChange(doc.id, "approved")}>
                                <IconCheck className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t.common.reject}
                                className="text-red-600"
                                onClick={() => handleStatusChange(doc.id, "rejected")}>
                                <IconX className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t.common.delete}
                                className="text-destructive">
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t.common.delete}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t.documents.deleteConfirmPrefix} &quot;{doc.titleAr || doc.title}
                                  &quot;?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(doc.id)}
                                  className="bg-destructive">
                                  {t.common.delete}
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
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="w-full sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t.documents.title}</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">{t.common.title}</p>
                  <p className="font-medium">
                    {selectedDocument.titleAr || selectedDocument.title}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.documents.size}</p>
                  <p className="font-medium">{formatFileSize(selectedDocument.size)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.common.employee}</p>
                  <p className="font-medium">{getEmployeeName(selectedDocument.employeeId)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.common.category}</p>
                  <p className="font-medium">
                    {documentCategoryLabels[selectedDocument.category].ar}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.common.status}</p>
                  <Badge variant={getStatusVariant(selectedDocument.status)}>
                    {documentStatusLabels[selectedDocument.status].ar}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.common.date}</p>
                  <p className="font-medium">
                    {new Date(selectedDocument.uploadedAt).toLocaleDateString("ar-SA")}
                  </p>
                </div>
                {selectedDocument.expiryDate && (
                  <div>
                    <p className="text-muted-foreground">{t.common.endDate}</p>
                    <p
                      className={`font-medium ${
                        isDocumentExpired(selectedDocument) ? "text-red-600" : ""
                      }`}>
                      {new Date(selectedDocument.expiryDate).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                )}
                {selectedDocument.description && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">{t.common.description}</p>
                    <p className="font-medium">{selectedDocument.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
