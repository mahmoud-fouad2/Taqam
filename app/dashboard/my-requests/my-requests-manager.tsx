'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  Plus, Search, Filter, Calendar, Clock, CheckCircle2, 
  XCircle, AlertCircle, FileText, MessageSquare, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  type SelfServiceRequest,
  type SelfServiceRequestType,
  selfServiceRequestTypeLabels,
  requestStatusLabels,
  requestStatusColors,
} from '@/lib/types/self-service';
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export default function MyRequestsManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [requests, setRequests] = useState<SelfServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SelfServiceRequest | null>(null);
  const [newRequest, setNewRequest] = useState({
    type: 'ticket' as SelfServiceRequestType,
    title: '',
    description: '',
  });

  const refresh = async () => {
    try {
      setError(null);
      const res = await fetch('/api/my-requests', { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to fetch');
      }
      const body = await res.json();
      setRequests(Array.isArray(body?.data?.items) ? body.data.items : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load requests');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesType = typeFilter === 'all' || request.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, searchTerm, statusFilter, typeFilter]);

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const handleSubmitRequest = async () => {
    try {
      setError(null);
      const res = await fetch('/api/my-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ticket',
          title: newRequest.title,
          description: newRequest.description,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to submit request');
      }
      const body = await res.json();
      const created = body?.data as SelfServiceRequest | undefined;
      if (created) {
        setRequests((prev) => [created, ...prev]);
      } else {
        await refresh();
      }
      setIsDialogOpen(false);
      setNewRequest({ type: 'ticket' as SelfServiceRequestType, title: '', description: '' });
    } catch (e: any) {
      setError(e?.message || 'Failed to submit request');
    }
  };

  const cancelSelectedRequest = async () => {
    if (!selectedRequest) return;

    const meta = (selectedRequest.metadata || {}) as any;
    const source = meta.source as string | undefined;
    const sourceId = meta.sourceId as string | undefined;
    if (!source || !sourceId) {
      setError(t.myRequests.cannotCancel);
      return;
    }

    try {
      setError(null);
      if (source === 'leave') {
        const res = await fetch(`/api/leaves/${sourceId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(t.myRequests.cancelLeaveFailed);
      } else if (source === 'attendance') {
        const res = await fetch(`/api/attendance-requests/${sourceId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(t.myRequests.cancelAttendanceFailed);
      } else if (source === 'ticket') {
        const res = await fetch(`/api/tickets/${sourceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CLOSED' }),
        });
        if (!res.ok) throw new Error(t.myRequests.closeTicketFailed);
      } else if (source === 'training') {
        const res = await fetch(`/api/training/enrollments/${sourceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'withdrawn' }),
        });
        if (!res.ok) throw new Error(t.myRequests.withdrawTrainingFailed);
      } else {
        throw new Error(t.myRequests.cannotCancelType);
      }

      await refresh();
      setSelectedRequest(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to cancel request');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.myRequests.title}</h1>
          <p className="text-muted-foreground">{t.myRequests.subtitle}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ms-2" />{t.myRequests.newRequest}</Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md">
            <DialogHeader>
              <DialogTitle>{t.myRequests.submitNewRequest}</DialogTitle>
              <DialogDescription>{t.myRequests.chooseTypeAndDetails}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t.myRequests.requestType}</Label>
                <Select 
                  value={newRequest.type}
                  onValueChange={(value: SelfServiceRequestType) => 
                    setNewRequest({...newRequest, type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.myRequests.selectRequestType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ticket">{selfServiceRequestTypeLabels.ticket}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.myRequests.requestTitle}</Label>
                <Input 
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                  placeholder={t.myRequests.enterClearTitle}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.common.details}</Label>
                <Textarea 
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  placeholder={t.myRequests.addDetails}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t.common.cancel}</Button>
              <Button onClick={handleSubmitRequest} disabled={!newRequest.type || !newRequest.title}>{t.common.submitRequest}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.myRequests.totalRequests}</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.evaluations.underReview}</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.common.accepted}</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.common.rejected}</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.myRequests.searchRequests}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.myRequests.requestType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.allTypes}</SelectItem>
                {Object.entries(selfServiceRequestTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.common.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.allStatuses}</SelectItem>
                {Object.entries(requestStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>{t.myRequests.requestList}</CardTitle>
          <CardDescription>{filteredRequests.length} {t.myRequests.requestCount}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="border rounded-lg p-3 text-sm text-red-700 bg-red-50">
                {error}
              </div>
            )}
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{isLoading ? t.common.loading : t.myRequests.pNoRequestsFound}</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <p className="text-sm text-muted-foreground mb-2">{t.myRequests.approvalPath}</p>
                      <div>
                        <h4 className="font-semibold">{request.title}</h4>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {selfServiceRequestTypeLabels[request.type]}
                          </Badge>
                          <Badge className={requestStatusColors[request.status]}>
                            {requestStatusLabels[request.status]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-start text-sm text-muted-foreground">
                      <p>{new Date(request.createdAt).toLocaleDateString('ar-SA')}</p>
                      <p>{new Date(request.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  {request.approvers.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-2">{t.myRequests.approvalPath}</p>
                      <div className="flex items-center gap-2">
                        {request.approvers.map((approver, index) => (
                          <div key={approver.id} className="flex items-center gap-1">
                            <span className={`h-2 w-2 rounded-full ${
                              approver.status === 'approved' ? 'bg-green-500' :
                              approver.status === 'rejected' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`} />
                            <span className="text-xs">{approver.name}</span>
                            {index < request.approvers.length - 1 && (
                              <span className="text-muted-foreground mx-1">←</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.myRequests.requestDetails}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t.myRequests.requestType}</p>
                  <p className="font-medium">{selfServiceRequestTypeLabels[selectedRequest.type]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.common.status}</p>
                  <Badge className={requestStatusColors[selectedRequest.status]}>
                    {requestStatusLabels[selectedRequest.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.myRequests.submissionDate}</p>
                  <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.myRequests.lastUpdated}</p>
                  <p className="font-medium">{new Date(selectedRequest.updatedAt).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.common.title}</p>
                <p className="font-medium">{selectedRequest.title}</p>
              </div>
              {selectedRequest.description && (
                <div>
                  <p className="text-sm text-muted-foreground">{t.common.details}</p>
                  <p className="text-sm">{selectedRequest.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t.myRequests.approvalPath}</p>
                <div className="space-y-2">
                  {selectedRequest.approvers.map((approver) => (
                    <div key={approver.id} className="flex items-center justify-between border rounded p-2">
                      <div className="flex items-center gap-2">
                        {approver.status === 'approved' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : approver.status === 'rejected' ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="font-medium">{approver.name}</span>
                        <span className="text-sm text-muted-foreground">({approver.role})</span>
                      </div>
                      {approver.actionAt && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(approver.actionAt).toLocaleDateString('ar-SA')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedRequest?.status === 'pending' && (
              <Button variant="destructive" onClick={cancelSelectedRequest}>{t.myRequests.cancelRequest}</Button>
            )}
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>{t.common.close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
