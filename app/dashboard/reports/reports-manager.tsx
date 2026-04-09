'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  FileText, Star, Clock, Download, Calendar, Play, 
  Search, Filter, Grid, List, BarChart3, PieChart, 
  Table, FileSpreadsheet, Printer, Mail, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  type ReportDefinition,
  type ReportCategory,
  type ScheduledReport,
  reportCategoryLabels,
  scheduleFrequencyLabels,
} from '@/lib/types/reports';
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export default function ReportsManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [reports, setReports] = useState<ReportDefinition[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);

  const fetchJson = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(url, { cache: 'no-store', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((json as any)?.error || 'Request failed');
    }
    return json as T;
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [defsRes, schRes] = await Promise.all([
        fetchJson<{ data: ReportDefinition[] }>('/api/reports/definitions'),
        fetchJson<{ data: ScheduledReport[] }>('/api/reports/scheduled'),
      ]);

      setReports(defsRes.data ?? []);
      setScheduledReports(schRes.data ?? []);
    } catch (e: any) {
      setReports([]);
      setScheduledReports([]);
      setError(e?.message || 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [fetchJson]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [reports, searchTerm, categoryFilter]);

  const favoriteReports = useMemo(() => reports.filter((r) => r.isFavorite), [reports]);

  const toggleFavorite = useCallback(async (id: string) => {
    // Optimistic update
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)));
    try {
      const res = await fetchJson<{ data: ReportDefinition }>(
        `/api/reports/definitions/${encodeURIComponent(id)}/favorite`,
        { method: 'PATCH' }
      );
      setReports((prev) => prev.map((r) => (r.id === id ? res.data : r)));
    } catch {
      // Revert
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)));
    }
  }, [fetchJson]);

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'chart': return <BarChart3 className="h-4 w-4" />;
      case 'pivot': return <PieChart className="h-4 w-4" />;
      case 'table': return <Table className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: ReportCategory) => {
    const colors: Record<ReportCategory, string> = {
      'hr': 'bg-blue-100 text-blue-800',
      'payroll': 'bg-green-100 text-green-800',
      'attendance': 'bg-purple-100 text-purple-800',
      'leaves': 'bg-orange-100 text-orange-800',
      'performance': 'bg-yellow-100 text-yellow-800',
      'recruitment': 'bg-pink-100 text-pink-800',
      'training': 'bg-indigo-100 text-indigo-800',
      'custom': 'bg-gray-100 text-gray-800',
    };
    return colors[category];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.common.reports}</h1>
          <p className="text-muted-foreground">{t.reports.createAndRun}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ms-2" />
          {t.reports.pNewCustomReport}
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">{t.reports.allReports}</TabsTrigger>
          <TabsTrigger value="favorites">{t.reports.favorites} ({favoriteReports.length})</TabsTrigger>
          <TabsTrigger value="scheduled">{t.reports.scheduled} ({scheduledReports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {error && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t.reports.searchReports}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="ps-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t.common.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.onboarding.allCategories}</SelectItem>
                    {Object.entries(reportCategoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1 border rounded-md p-1">
                  <Button 
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Grid/List */}
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{t.reports.loadingReports}</p>
              </CardContent>
            </Card>
          ) : filteredReports.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{t.reports.noReports}</p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        {getFormatIcon(report.format)}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        aria-label={t.ideas.preference}
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleFavorite(report.id);
                        }}
                      >
                        <Star className={`h-4 w-4 ${report.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-2">{report.name}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className={getCategoryColor(report.category)}>
                        {reportCategoryLabels[report.category]}
                      </Badge>
                      {report.lastRun && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(report.lastRun).toLocaleDateString('ar-SA')}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedReport(report);
                          setIsRunDialogOpen(true);
                        }}
                      >
                        <Play className="h-4 w-4 ms-1" />{t.common.submit}</Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {filteredReports.map((report) => (
                    <div 
                      key={report.id} 
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          {getFormatIcon(report.format)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{report.name}</h4>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getCategoryColor(report.category)}>
                          {reportCategoryLabels[report.category]}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          aria-label={t.ideas.preference}
                          onClick={() => void toggleFavorite(report.id)}
                        >
                          <Star className={`h-4 w-4 ${report.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setIsRunDialogOpen(true);
                          }}
                        >
                          <Play className="h-4 w-4 ms-1" />{t.common.submit}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favoriteReports.map((report) => (
              <Card key={report.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      {getFormatIcon(report.format)}
                    </div>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <CardTitle className="text-lg mt-2">{report.name}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setSelectedReport(report);
                      setIsRunDialogOpen(true);
                    }}
                  >
                    <Play className="h-4 w-4 ms-1" />{t.reports.run}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.reports.scheduledReports}</CardTitle>
              <CardDescription>{t.reports.scheduledDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.reports.noScheduled}</p>
                ) : scheduledReports.map((scheduled) => (
                  <div 
                    key={scheduled.id} 
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        scheduled.isActive ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Calendar className={`h-5 w-5 ${
                          scheduled.isActive ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{scheduled.reportName}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{scheduleFrequencyLabels[scheduled.frequency]}</span>
                          <span>•</span>
                          <span>{scheduled.time}</span>
                          <span>•</span>
                          <span>{scheduled.format.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-start">
                        <p className="text-xs text-muted-foreground">{t.reports.nextRun}</p>
                        <p className="text-sm font-medium">
                          {new Date(scheduled.nextRun).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <Badge variant={scheduled.isActive ? 'default' : 'secondary'}>
                        {scheduled.isActive ? t.reports.activeStatus : t.reports.stoppedStatus}
                      </Badge>
                      <Button variant="outline" size="sm">{t.common.edit}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Run Report Dialog */}
      <Dialog open={isRunDialogOpen} onOpenChange={setIsRunDialogOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>{t.reports.run}</DialogTitle>
            <DialogDescription>{selectedReport?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.leaveRequests.period}</Label>
              <Select defaultValue="current-month">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{t.common.today}</SelectItem>
                  <SelectItem value="this-week">{t.common.thisWeek}</SelectItem>
                  <SelectItem value="current-month">{t.common.thisMonth}</SelectItem>
                  <SelectItem value="last-month">{t.common.lastMonth}</SelectItem>
                  <SelectItem value="this-year">{t.common.thisYear}</SelectItem>
                  <SelectItem value="custom">{t.reports.customPeriod}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.reports.exportFormat}</Label>
              <Select defaultValue="view">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">{t.reports.viewOnly}</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsRunDialogOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={() => setIsRunDialogOpen(false)}>
              <Play className="h-4 w-4 ms-2" />{t.common.submit}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
