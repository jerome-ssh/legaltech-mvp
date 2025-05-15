"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Trash, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function TeamManagementPage() {
  const { user, isLoaded } = useUser();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ role: "", status: "" });
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

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("case_team_members")
        .select("id, role, status, profiles:profile_id(first_name, last_name, email), cases:case_id(name)");
      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchMembers();
  }, [isAdmin]);

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setEditForm({ role: m.role, status: m.status });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from("case_team_members").update({
        role: editForm.role,
        status: editForm.status,
      }).eq("id", editingId);
      if (error) throw error;
      setEditingId(null);
      await fetchMembers();
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
      const { error } = await supabase.from("case_team_members").delete().eq("id", id);
      if (error) throw error;
      setShowDelete(null);
      await fetchMembers();
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
      <h1 className="text-2xl font-bold mb-6">Team Management (Admin)</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(m => (
          <Card key={m.id} className="relative">
            {editingId === m.id ? (
              <form onSubmit={handleEditSubmit} className="p-4 space-y-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Input name="role" value={editForm.role} onChange={handleEditChange} required disabled={editLoading} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select name="status" value={editForm.status} onChange={handleEditChange} disabled={editLoading} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditingId(null)} disabled={editLoading}>Cancel</Button>
                  <Button type="submit" disabled={editLoading}>{editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}</Button>
                </div>
              </form>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>{m.profiles?.first_name} {m.profiles?.last_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 mb-2">Email: {m.profiles?.email}</div>
                  <div className="text-sm text-gray-500 mb-2">Role: {m.role}</div>
                  <div className="text-sm text-gray-500 mb-2">Status: {m.status}</div>
                  <div className="text-sm text-gray-500 mb-2">Case: {m.cases?.name}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="icon" variant="outline" onClick={() => handleEdit(m)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="destructive" onClick={() => setShowDelete(m.id)}><Trash className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
                {showDelete === m.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10">
                    <div className="bg-white rounded-lg p-4 shadow-lg flex flex-col gap-4">
                      <div>Remove <span className="font-bold">{m.profiles?.first_name} {m.profiles?.last_name}</span> from <span className="font-bold">{m.cases?.name}</span>? This cannot be undone.</div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setShowDelete(null)} disabled={deleteLoading === m.id}><X className="w-4 h-4" /> Cancel</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(m.id)} disabled={deleteLoading === m.id}>{deleteLoading === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}</Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        ))}
        {members.length === 0 && <div className="col-span-full text-gray-500">No team members found.</div>}
      </div>
    </div>
  );
} 