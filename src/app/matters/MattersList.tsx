"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MattersList({ matters }: { matters: any[] }) {
  const router = useRouter();
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Matters</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matters && matters.length > 0 ? (
          matters.map((matter: any) => (
            <div
              key={matter.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/matters/${matter.id}`)}
              role="button"
              tabIndex={0}
              onKeyPress={e => { if (e.key === 'Enter') router.push(`/matters/${matter.id}`); }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{matter.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-gray-600">Status: {matter.status}</span>
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <div className="col-span-full text-gray-500">No matters found.</div>
        )}
      </div>
    </div>
  );
} 