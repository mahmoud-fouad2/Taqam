/**
 * Documents Data Hook - Centralized document management
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import type { Document, DocumentCategory } from "@/lib/types/documents";
import { documentsService } from "@/lib/api";

interface UseDocumentsOptions {
  employeeId?: string;
  category?: DocumentCategory;
  search?: string;
  isExpiringSoon?: boolean;
}

interface UseDocumentsReturn {
  documents: Document[];
  categories: DocumentCategory[];
  isLoading: boolean;
  error: string | null;
  uploadDocument: (file: File, metadata: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  downloadDocument: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useDocuments(options: UseDocumentsOptions = {}): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories] = useState<DocumentCategory[]>([
    "personal",
    "employment",
    "education",
    "financial",
    "medical",
    "legal",
    "other",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await documentsService.getAll({
        employeeId: options.employeeId,
        category: options.category,
      });

      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحميل المستندات");
    } finally {
      setIsLoading(false);
    }
  }, [options.employeeId, options.category]);

  const uploadDocument = useCallback(async (file: File, metadata: Partial<Document>) => {
    try {
      const response = await documentsService.upload({
        file,
        employeeId: metadata.employeeId || "",
        category: metadata.category || "other",
        title: metadata.title || file.name,
        titleAr: metadata.titleAr,
        description: metadata.description,
        expiryDate: metadata.expiryDate,
        issuedDate: metadata.issuedDate,
      });
      if (response.success) {
        await fetchData();
      } else {
        setError(response.error || "فشل رفع المستند");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل رفع المستند");
    }
  }, [fetchData]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      const response = await documentsService.delete(id);
      if (response.success) {
        await fetchData();
      } else {
        setError(response.error || "فشل حذف المستند");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل حذف المستند");
    }
  }, [fetchData]);

  const downloadDocument = useCallback(async (id: string) => {
    try {
      const response = await documentsService.download(id);
      if (response.success && response.data) {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document";
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError(response.error || "فشل تحميل المستند");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحميل المستند");
    }
  }, []);

  const filteredDocuments = useMemo(() => {
    let result = documents;

    if (options.search) {
      const search = options.search.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(search) ||
          d.fileName.toLowerCase().includes(search) ||
          d.description?.toLowerCase().includes(search)
      );
    }

    if (options.isExpiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      result = result.filter(
        (d) => d.expiryDate && new Date(d.expiryDate) <= thirtyDaysFromNow
      );
    }

    return result;
  }, [documents, options.search, options.isExpiringSoon]);

  return {
    documents: filteredDocuments,
    categories,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    refetch: fetchData,
  };
}

export default useDocuments;
