"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface FormData {
  clientName: string;
  caseType: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

interface FormErrors {
  clientName?: string;
  caseType?: string;
  description?: string;
}

export default function CRM() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    caseType: "",
    description: "",
    priority: "medium",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client name is required";
    }
    if (!formData.caseType) {
      newErrors.caseType = "Case type is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .insert([
          {
            client_name: formData.clientName.trim(),
            case_type: formData.caseType,
            description: formData.description.trim(),
            priority: formData.priority,
            status: 'open',
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Case created successfully');

      // Reset form
      setFormData({
        clientName: "",
        caseType: "",
        description: "",
        priority: "medium",
      });
      setErrors({});

      // Redirect to dashboard using router
      router.push('/');
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create case. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Case</h1>

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <form className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-24 w-full" />
                </div>
                <div className="flex justify-end gap-4">
                  <Skeleton className="h-10 w-32" />
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Client Name</label>
                  <Input
                    value={formData.clientName}
                    onChange={(e) => {
                      setFormData({ ...formData, clientName: e.target.value });
                      if (errors.clientName) {
                        setErrors({ ...errors, clientName: undefined });
                      }
                    }}
                    placeholder="Enter client name"
                    required
                    disabled={isLoading}
                    className={errors.clientName ? "border-red-500" : ""}
                  />
                  {errors.clientName && (
                    <p className="text-sm text-red-500">{errors.clientName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Case Type</label>
                  <Select
                    value={formData.caseType}
                    onValueChange={(value) => {
                      setFormData({ ...formData, caseType: value });
                      if (errors.caseType) {
                        setErrors({ ...errors, caseType: undefined });
                      }
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={errors.caseType ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select case type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document_review">Document Review</SelectItem>
                      <SelectItem value="legal_research">Legal Research</SelectItem>
                      <SelectItem value="case_analysis">Case Analysis</SelectItem>
                      <SelectItem value="contract_review">Contract Review</SelectItem>
                      <SelectItem value="compliance_check">Compliance Check</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.caseType && (
                    <p className="text-sm text-red-500">{errors.caseType}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description) {
                        setErrors({ ...errors, description: undefined });
                      }
                    }}
                    placeholder="Enter case description"
                    required
                    disabled={isLoading}
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Case'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 