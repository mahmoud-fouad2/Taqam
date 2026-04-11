"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  FileText,
  Calendar,
  AlertCircle,
  CreditCard,
  GraduationCap,
  Clock,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  type Notification,
  type NotificationType,
  notificationTypeLabels
} from "@/lib/types/self-service";
import { notificationsService } from "@/lib/api";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export default function NotificationsManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [notificationsRaw, setNotificationsRaw] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await notificationsService.getAll({ page: 1, pageSize: 100 });
        if (!isMounted) return;
        setNotificationsRaw(res.success && res.data ? res.data.notifications : []);
        if (!res.success) setLoadError(res.error || t.notifications.loadFailed);
      } catch (e) {
        if (!isMounted) return;
        setNotificationsRaw([]);
        setLoadError(e instanceof Error ? e.message : t.notifications.loadFailed);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [t.notifications.loadFailed]);

  const markAsRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
    void notificationsService.markAsRead(id);
  };

  const markAllAsRead = () => {
    setReadIds(new Set(notificationsRaw.map((n) => n.id)));
    void notificationsService.markAllAsRead();
  };

  const deleteNotification = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]));
    void notificationsService.delete(id);
  };

  const notifications = useMemo<Notification[]>(() => {
    return notificationsRaw
      .filter((n) => !deletedIds.has(n.id))
      .map((n) => ({
        ...n,
        isRead: n.isRead || readIds.has(n.id)
      }));
  }, [notificationsRaw, deletedIds, readIds]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "request-status":
        return <FileText className="h-5 w-5" />;
      case "approval-needed":
        return <Clock className="h-5 w-5" />;
      case "reminder":
        return <Bell className="h-5 w-5" />;
      case "announcement":
        return <AlertCircle className="h-5 w-5" />;
      case "payslip":
        return <CreditCard className="h-5 w-5" />;
      case "document-expiry":
        return <AlertCircle className="h-5 w-5" />;
      case "training":
        return <GraduationCap className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case "approval-needed":
        return "bg-yellow-100 text-yellow-600";
      case "payslip":
        return "bg-green-100 text-green-600";
      case "document-expiry":
        return "bg-red-100 text-red-600";
      case "training":
        return "bg-blue-100 text-blue-600";
      case "announcement":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} ${t.notifications.dayUnit} ${t.notifications.daysAgo}`;
    if (hours > 0) return `${hours} ${t.notifications.hourUnit} ${t.notifications.hoursAgo}`;
    if (minutes > 0)
      return `${minutes} ${t.notifications.minuteUnit} ${t.notifications.minutesAgo}`;
    return t.notifications.now;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.common.notifications}</h1>
          <p className="text-muted-foreground">
            {isLoading
              ? t.notifications.loading
              : loadError
                ? loadError
                : unreadCount > 0
                  ? `${unreadCount} ${t.notifications.unreadNotifications}`
                  : t.notifications.noNewNotifications}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="ms-2 h-4 w-4" />
              {t.notifications.markAllRead}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList>
          <TabsTrigger value="notifications">{t.common.notifications}</TabsTrigger>
          <TabsTrigger value="settings">{t.notifications.settings}</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Filter className="text-muted-foreground h-4 w-4" />
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t.notifications.filterNotifications} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.notifications.all}</SelectItem>
                    <SelectItem value="unread">{t.notifications.unread}</SelectItem>
                    {Object.entries(notificationTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="secondary">{filteredNotifications.length}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {filteredNotifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <BellOff className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                    <p className="text-muted-foreground">{t.common.noNotifications}</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                        !notification.isRead ? "bg-muted/50 border-primary/20" : "hover:bg-muted/30"
                      }`}>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4
                              className={`font-semibold ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                              {notification.title}
                            </h4>
                            <p className="text-muted-foreground mt-1 text-sm">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {notificationTypeLabels[notification.type]}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}>
                              <Trash2 className="text-muted-foreground h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t.notifications.preferences}
              </CardTitle>
              <CardDescription>{t.notifications.preferencesDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">{t.notifications.emailNotifications}</h4>
                {[
                  {
                    id: "email-requests",
                    label: t.notifications.requestUpdates,
                    description: t.notifications.requestUpdatesDesc
                  },
                  {
                    id: "email-approvals",
                    label: t.notifications.approvalRequests,
                    description: t.notifications.approvalRequestsDesc
                  },
                  {
                    id: "email-payslip",
                    label: t.notifications.payslipNotif,
                    description: t.notifications.payslipNotifDesc
                  },
                  {
                    id: "email-documents",
                    label: t.notifications.documentExpiry,
                    description: t.notifications.documentExpiryDesc
                  }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor={item.id} className="font-medium">
                        {item.label}
                      </Label>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </div>
                    <Switch id={item.id} defaultChecked />
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t pt-6">
                <h4 className="font-semibold">{t.notifications.appNotifications}</h4>
                {[
                  {
                    id: "app-all",
                    label: t.notifications.allNotifications,
                    description: t.notifications.allNotificationsDesc
                  },
                  {
                    id: "app-announcements",
                    label: t.notifications.announcements,
                    description: t.notifications.announcementsDesc
                  },
                  {
                    id: "app-reminders",
                    label: t.notifications.reminders,
                    description: t.notifications.remindersDesc
                  }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor={item.id} className="font-medium">
                        {item.label}
                      </Label>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </div>
                    <Switch id={item.id} defaultChecked />
                  </div>
                ))}
              </div>

              <div className="border-t pt-6">
                <Button>{t.common.saveChanges}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
