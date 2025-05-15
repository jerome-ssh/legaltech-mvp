"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function PracticeAreaAdminPage() {
  const { user, isLoaded } = useUser();
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Check admin role
  useEffect(() => {
    if (!isLoaded || !user) return;
    setRoleLoading(true);
    const checkRole = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (error || !data) {
        setIsAdmin(false);
      } else {
        setIsAdmin(data.role === "admin");
      }
      setRoleLoading(false);
    };
    checkRole();
  }, [isLoaded, user]);

  const fetchAreas = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from("practice_areas").select("id, name, description");
      if (error) throw error;
      setAreas(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchAreas();
  }, [isAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from("practice_areas").insert({
        name: form.name,
        description: form.description,
      });
      if (error) throw error;
      setForm({ name: "", description: "" });
      await fetchAreas();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (area: any) => {
    setEditingId(area.id);
    setEditForm({ name: area.name, description: area.description });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from("practice_areas").update({
        name: editForm.name,
        description: editForm.description,
      }).eq("id", editingId);
      if (error) throw error;
      setEditingId(null);
      await fetchAreas();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    setError(null);
    try {
      const { error } = await supabase.from("practice_areas").delete().eq("id", id);
      if (error) throw error;
      setShowDelete(null);
      await fetchAreas();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  if (roleLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /> Checking permissions...</div>;
  if (!isAdmin) return <div className="text-red-500">Access denied.</div>;
  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Practice Areas (Admin)</h1>
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col md:flex-row gap-2 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input name="name" value={form.name} onChange={handleChange} required disabled={formLoading} />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Description</label>
          <Input name="description" value={form.description} onChange={handleChange} required disabled={formLoading} />
        </div>
        <Button type="submit" disabled={formLoading} className="flex gap-2 items-center w-full md:w-auto">
          {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
        </Button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map(a => (
          <Card key={a.id} className="relative">
            {editingId === a.id ? (
              <form onSubmit={handleEditSubmit} className="p-4 space-y-2">
                <Input name="name" value={editForm.name} onChange={handleEditChange} required disabled={editLoading} />
                <Input name="description" value={editForm.description} onChange={handleEditChange} required disabled={editLoading} />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditingId(null)} disabled={editLoading}>Cancel</Button>
                  <Button type="submit" disabled={editLoading}>{editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}</Button>
                </div>
              </form>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>{a.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 mb-2">{a.description}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="icon" variant="outline" onClick={() => handleEdit(a)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="destructive" onClick={() => setShowDelete(a.id)}><Trash className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
                {showDelete === a.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10">
                    <div className="bg-white rounded-lg p-4 shadow-lg flex flex-col gap-4">
                      <div>Delete <span className="font-bold">{a.name}</span>? This cannot be undone.</div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setShowDelete(null)} disabled={deleteLoading === a.id}><X className="w-4 h-4" /> Cancel</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)} disabled={deleteLoading === a.id}>{deleteLoading === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}</Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        ))}
        {areas.length === 0 && <div className="col-span-full text-gray-500">No practice areas found.</div>}
      </div>
    </div>
  );
} 