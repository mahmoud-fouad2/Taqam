"use client";

import * as React from "react";
import {
  IconPlus,
  IconSearch,
  IconMail,
  IconEye,
  IconEdit,
  IconFilter,
  IconTrash,
  IconBriefcase,
  IconCurrencyDollar,
  IconCalendar,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createJobOffer,
  deleteJobOffer,
  getApplicants,
  getJobOffers,
  getJobPostings,
  updateJobOffer,
  updateOfferStatus,
} from "@/lib/api/recruitment";
import {
  type Applicant,
  type JobOffer,
  type JobPosting,
  offerStatusColors,
  offerStatusLabels,
  type OfferStatus,
  jobTypeLabels,
  type JobType,
} from "@/lib/types/recruitment";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

type OfferFormState = {
  applicantId: string;
  jobPostingId: string;
  offeredSalary: string;
  currency: string;
  jobType: JobType;
  startDate: string;
  probationPeriod: string;
  validUntil: string;
  termsAndConditions: string;
  benefits: string;
  status: OfferStatus;
};

const EMPTY_FORM: OfferFormState = {
  applicantId: "",
  jobPostingId: "",
  offeredSalary: "",
  currency: "SAR",
  jobType: "full-time",
  startDate: "",
  probationPeriod: "3",
  validUntil: "",
  termsAndConditions: "",
  benefits: "",
  status: "draft",
};

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

function stringifyBenefits(benefits: JobOffer["benefits"]) {
  return benefits.map((benefit) => benefit.name).join("\n");
}

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function buildFormState(offer: JobOffer): OfferFormState {
  return {
    applicantId: offer.applicantId,
    jobPostingId: offer.jobPostingId,
    offeredSalary: String(offer.offeredSalary || ""),
    currency: offer.currency || "SAR",
    jobType: offer.jobType,
    startDate: toDateInputValue(offer.startDate),
    probationPeriod: String(offer.probationPeriod ?? 0),
    validUntil: toDateInputValue(offer.validUntil),
    termsAndConditions: offer.termsAndConditions || "",
    benefits: stringifyBenefits(offer.benefits),
    status: offer.status,
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ar-SA");
}

export function JobOffersManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [offers, setOffers] = React.useState<JobOffer[]>([]);
  const [applicants, setApplicants] = React.useState<Applicant[]>([]);
  const [jobs, setJobs] = React.useState<JobPosting[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedOffer, setSelectedOffer] = React.useState<JobOffer | null>(null);
  const [editingOffer, setEditingOffer] = React.useState<JobOffer | null>(null);
  const [isViewSheetOpen, setIsViewSheetOpen] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [form, setForm] = React.useState<OfferFormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [busyOfferId, setBusyOfferId] = React.useState<string | null>(null);
  const [deleteOfferId, setDeleteOfferId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [offersRes, applicantsRes, jobsRes] = await Promise.all([
        getJobOffers(),
        getApplicants(),
        getJobPostings(),
      ]);
      setOffers(offersRes);
      setApplicants(applicantsRes);
      setJobs(jobsRes);
    } catch (loadError) {
      setOffers([]);
      setApplicants([]);
      setJobs([]);
      setError(loadError instanceof Error ? loadError.message : t.jobOffers.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [t.jobOffers.loadFailed]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredOffers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return offers.filter((offer) => {
      const matchesQuery =
        !query ||
        offer.applicantName.toLowerCase().includes(query) ||
        offer.jobTitle.toLowerCase().includes(query) ||
        offer.applicantEmail.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || offer.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [offers, searchQuery, statusFilter]);

  const stats = React.useMemo(
    () => ({
      total: offers.length,
      draft: offers.filter((offer) => offer.status === "draft").length,
      sent: offers.filter((offer) => offer.status === "sent").length,
      accepted: offers.filter((offer) => offer.status === "accepted").length,
    }),
    [offers]
  );

  function updateForm<K extends keyof OfferFormState>(key: K, value: OfferFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateDialog() {
    setForm(EMPTY_FORM);
    setEditingOffer(null);
    setIsFormOpen(true);
  }

  function openEditDialog(offer: JobOffer) {
    setEditingOffer(offer);
    setForm(buildFormState(offer));
    setIsFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    setIsFormOpen(open);
    if (!open) {
      setEditingOffer(null);
      setForm(EMPTY_FORM);
    }
  }

  async function handleSave() {
    if (!form.applicantId || !form.jobPostingId || !form.offeredSalary || !form.startDate || !form.validUntil) {
      toast.error(t.jobOffers.fillRequired);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const applicant = applicants.find((item) => item.id === form.applicantId);
      const job = jobs.find((item) => item.id === form.jobPostingId);

      const payload = {
        applicantId: form.applicantId,
        jobPostingId: form.jobPostingId,
        departmentId: job?.departmentId || undefined,
        offeredSalary: Number(form.offeredSalary),
        currency: form.currency,
        jobType: form.jobType,
        startDate: `${form.startDate}T00:00:00.000Z`,
        probationPeriod: Number(form.probationPeriod || 0),
        validUntil: `${form.validUntil}T23:59:59.000Z`,
        termsAndConditions: form.termsAndConditions || undefined,
        benefits: splitLines(form.benefits),
        status: form.status,
        applicantName: applicant?.firstName ? `${applicant.firstName} ${applicant.lastName}` : undefined,
      };

      const saved = editingOffer
        ? await updateJobOffer(editingOffer.id, payload)
        : await createJobOffer(payload);

      setOffers((current) =>
        editingOffer
          ? current.map((offer) => (offer.id === editingOffer.id ? saved : offer))
          : [saved, ...current]
      );
      if (selectedOffer?.id === saved.id) {
        setSelectedOffer(saved);
      }
      handleFormOpenChange(false);
      toast.success(editingOffer ? t.jobOffers.offerUpdated : t.jobOffers.offerCreated);
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : editingOffer ? t.jobOffers.updateFailed : t.jobOffers.createFailed);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(offerId: string, status: OfferStatus) {
    setBusyOfferId(offerId);
    try {
      const updated = await updateOfferStatus(offerId, status);
      setOffers((current) => current.map((offer) => (offer.id === offerId ? updated : offer)));
      if (selectedOffer?.id === offerId) {
        setSelectedOffer(updated);
      }
      toast.success(t.jobOffers.statusUpdated);
    } catch (statusError) {
      toast.error(statusError instanceof Error ? statusError.message : t.jobOffers.statusUpdateFailed);
    } finally {
      setBusyOfferId(null);
    }
  }

  async function handleDelete() {
    if (!deleteOfferId) {
      return;
    }

    setBusyOfferId(deleteOfferId);
    try {
      await deleteJobOffer(deleteOfferId);
      setOffers((current) => current.filter((offer) => offer.id !== deleteOfferId));
      if (selectedOffer?.id === deleteOfferId) {
        setSelectedOffer(null);
        setIsViewSheetOpen(false);
      }
      setDeleteOfferId(null);
      toast.success(t.jobOffers.deletedSuccess);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : t.jobOffers.deleteFailed);
    } finally {
      setBusyOfferId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.jobOffers.totalOffers}</CardTitle>
            <IconBriefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.jobOffers.drafts}</CardTitle>
            <IconEdit className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.jobOffers.sent}</CardTitle>
            <IconMail className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.common.accepted}</CardTitle>
            <IconCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t.jobOffers.title}</CardTitle>
              <CardDescription>{t.jobOffers.subtitle}</CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <IconPlus className="ms-2 h-4 w-4" />
              {t.jobOffers.pNewOffer}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.jobOffers.searchPlaceholder}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <IconFilter className="ms-2 h-4 w-4" />
                <SelectValue placeholder={t.common.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.attendance.allStatuses}</SelectItem>
                {Object.entries(offerStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.jobOffers.candidate}</TableHead>
                  <TableHead>{t.onboarding.jobCol}</TableHead>
                  <TableHead>{t.jobOffers.offeredSalary}</TableHead>
                  <TableHead>{t.common.startDate}</TableHead>
                  <TableHead>{t.common.status}</TableHead>
                  <TableHead className="text-start">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      {t.jobOffers.pLoadingJobOffers}
                    </TableCell>
                  </TableRow>
                ) : filteredOffers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      {t.jobOffers.pNoMatchingOffersFound}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOffers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{offer.applicantName}</p>
                          <p className="text-sm text-muted-foreground">{offer.applicantEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{offer.jobTitle}</TableCell>
                      <TableCell>
                        {offer.offeredSalary.toLocaleString("ar-SA")} {offer.currency}
                      </TableCell>
                      <TableCell>{formatDate(offer.startDate)}</TableCell>
                      <TableCell>
                        <Badge className={offerStatusColors[offer.status]}>{offerStatusLabels[offer.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedOffer(offer);
                              setIsViewSheetOpen(true);
                            }}>
                              <IconEye className="ms-2 h-4 w-4" />{t.common.viewDetails}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(offer)}>
                              <IconEdit className="ms-2 h-4 w-4" />
                              {t.jobOffers.pEditOffer}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {offer.status !== "sent" && (
                              <DropdownMenuItem disabled={busyOfferId === offer.id} onClick={() => void handleStatusChange(offer.id, "sent")}>
                                <IconMail className="ms-2 h-4 w-4" />
                                {t.jobOffers.pMarkAsSent}
                              </DropdownMenuItem>
                            )}
                            {offer.status !== "accepted" && (
                              <DropdownMenuItem disabled={busyOfferId === offer.id} onClick={() => void handleStatusChange(offer.id, "accepted")}>
                                <IconCheck className="ms-2 h-4 w-4" />
                                {t.jobOffers.pMarkAsAccepted}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteOfferId(offer.id)}>
                              <IconTrash className="ms-2 h-4 w-4" />{t.common.delete}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent className="w-full sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingOffer ? t.jobOffers.editOffer : t.jobOffers.createOffer}</DialogTitle>
            <DialogDescription>
              {editingOffer
                ? t.jobOffers.editDesc
                : t.jobOffers.createDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t.jobOffers.candidate}</Label>
              <Select value={form.applicantId} onValueChange={(value) => updateForm("applicantId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.jobOffers.chooseCandidate} />
                </SelectTrigger>
                <SelectContent>
                  {applicants.map((applicant) => (
                    <SelectItem key={applicant.id} value={applicant.id}>
                      {applicant.firstName} {applicant.lastName} - {applicant.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t.onboarding.jobCol}</Label>
              <Select value={form.jobPostingId} onValueChange={(value) => updateForm("jobPostingId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.jobOffers.chooseJob} />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t.leaveTypes.salary}</Label>
                <Input type="number" value={form.offeredSalary} onChange={(event) => updateForm("offeredSalary", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t.salaryStructures.currency}</Label>
                <Input value={form.currency} onChange={(event) => updateForm("currency", event.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t.jobOffers.workType}</Label>
                <Select value={form.jobType} onValueChange={(value) => updateForm("jobType", value as JobType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(jobTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t.common.status}</Label>
                <Select value={form.status} onValueChange={(value) => updateForm("status", value as OfferStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(offerStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>{t.common.startDate}</Label>
                <Input type="date" value={form.startDate} onChange={(event) => updateForm("startDate", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t.jobOffers.probationPeriod}</Label>
                <Input type="number" value={form.probationPeriod} onChange={(event) => updateForm("probationPeriod", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t.jobOffers.validUntil}</Label>
                <Input type="date" value={form.validUntil} onChange={(event) => updateForm("validUntil", event.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t.jobPostings.benefits}</Label>
              <Textarea rows={4} value={form.benefits} onChange={(event) => updateForm("benefits", event.target.value)} placeholder={t.jobOffers.benefitsPlaceholder} />
            </div>

            <div className="grid gap-2">
              <Label>{t.jobOffers.termsAndConditions}</Label>
              <Textarea rows={4} value={form.termsAndConditions} onChange={(event) => updateForm("termsAndConditions", event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleFormOpenChange(false)}>{t.common.cancel}</Button>
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              {editingOffer ? t.common.saveChanges : t.jobOffers.saveOffer}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{selectedOffer?.jobTitle}</SheetTitle>
            <SheetDescription>{t.jobOffers.offerDetails}</SheetDescription>
          </SheetHeader>
          {selectedOffer && (
            <div className="space-y-6 py-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.jobOffers.candidate}</p>
                <p className="text-lg font-semibold">{selectedOffer.applicantName}</p>
                <p className="text-sm text-muted-foreground">{selectedOffer.applicantEmail}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <IconCurrencyDollar className="h-4 w-4" />
                      {t.jobOffers.pOfferedSalary}
                    </CardDescription>
                    <CardTitle>
                      {selectedOffer.offeredSalary.toLocaleString("ar-SA")} {selectedOffer.currency}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <IconCalendar className="h-4 w-4" />
                      {t.jobOffers.pStartDate}
                    </CardDescription>
                    <CardTitle>{formatDate(selectedOffer.startDate)}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t.common.status}</p>
                <Badge className={offerStatusColors[selectedOffer.status]}>{offerStatusLabels[selectedOffer.status]}</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t.jobPostings.benefits}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedOffer.benefits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t.jobOffers.noBenefits}</p>
                  ) : (
                    selectedOffer.benefits.map((benefit) => (
                      <Badge key={`${selectedOffer.id}-${benefit.name}`} variant="outline">
                        {benefit.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t.jobOffers.termsAndConditions}</p>
                <p className="rounded-lg bg-muted p-3 text-sm">{selectedOffer.termsAndConditions || t.jobOffers.noExtraTerms}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t.jobOffers.validity}</p>
                <p className="font-medium">{t.jobOffers.validUntilPrefix} {formatDate(selectedOffer.validUntil)}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(deleteOfferId)} onOpenChange={(open) => !open && setDeleteOfferId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.jobOffers.deleteTitle}</DialogTitle>
            <DialogDescription>{t.jobOffers.pTheOfferWillBePermanentlyDelet}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOfferId(null)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={busyOfferId === deleteOfferId}>{t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
