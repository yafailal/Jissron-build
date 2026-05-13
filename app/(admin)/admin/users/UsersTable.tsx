"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Star, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { deleteUser, bulkDeleteUsers } from "./actions";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  isFeatured: boolean;
  badges: string[];
  emailVerified: Date | null;
  createdAt: Date;
}

const ROLE_STYLE: Record<string, string> = {
  ADMIN: "bg-primary text-white",
  INSTRUCTOR: "bg-violet-50 text-violet-700 border border-violet-200",
  STUDENT: "bg-bg-soft text-muted border border-line",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  SUSPENDED: "bg-rose-50 text-rose-700 border border-rose-200",
};

interface Props {
  users: UserRow[];
  currentUserId: string;
}

export function UsersTable({ users, currentUserId }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [singleConfirm, setSingleConfirm] = useState<string | null>(null);

  const selectableIds = users.filter((u) => u.id !== currentUserId).map((u) => u.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allSelected) return new Set();
      return new Set(selectableIds);
    });
  }

  async function handleSingleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deleteUser(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("User deleted");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      startTransition(() => router.refresh());
    } finally {
      setDeletingId(null);
      setSingleConfirm(null);
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      const result = await bulkDeleteUsers(Array.from(selected));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { deletedCount, skipped } = result.data!;
      if (deletedCount > 0 && skipped.length === 0) {
        toast.success(`Deleted ${deletedCount} user${deletedCount === 1 ? "" : "s"}`);
      } else if (deletedCount > 0 && skipped.length > 0) {
        toast.success(`Deleted ${deletedCount}, skipped ${skipped.length}`, {
          description: skipped[0]?.reason,
        });
      } else {
        toast.error("No users deleted", { description: skipped[0]?.reason ?? "Check dependencies." });
      }
      setSelected(new Set());
      startTransition(() => router.refresh());
    } finally {
      setBulkDeleting(false);
      setBulkConfirm(false);
    }
  }

  return (
    <>
      {/* Bulk action bar — appears when at least one user is selected */}
      {someSelected && (
        <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-primary-soft border border-primary/20 rounded-md">
          <span className="text-[13px] font-semibold text-ink">
            {selected.size} selected
          </span>
          <Button
            size="sm"
            variant="destructive"
            disabled={bulkDeleting}
            onClick={() => setBulkConfirm(true)}
            className="h-8"
          >
            {bulkDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Delete selected
          </Button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-[12px] text-muted hover:text-ink font-semibold ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-line overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-bg-soft border-b border-line">
            <tr className="text-left">
              <th className="w-8 pl-3 pr-1 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all users"
                  className="rounded border-line"
                  disabled={selectableIds.length === 0}
                />
              </th>
              <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">User</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Email</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Role</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Status</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Badges</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Joined</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const isChecked = selected.has(u.id);
              return (
                <tr
                  key={u.id}
                  className={`border-b border-line last:border-0 transition-colors ${
                    isChecked ? "bg-primary-soft/30" : "hover:bg-bg-soft/40"
                  }`}
                >
                  <td className="w-8 pl-3 pr-1 py-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(u.id)}
                      aria-label={`Select ${u.name ?? u.email}`}
                      disabled={isSelf}
                      title={isSelf ? "You can't select your own account" : undefined}
                      className="rounded border-line disabled:opacity-40"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2.5 group">
                      {u.image ? (
                        <Image
                          src={u.image}
                          alt={u.name ?? u.email}
                          width={28}
                          height={28}
                          className="rounded-full object-cover w-7 h-7"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary text-white grid place-items-center text-[11px] font-bold">
                          {(u.name ?? u.email)[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-ink group-hover:text-primary transition-colors">
                        {u.name ?? "—"}
                      </span>
                      {u.isFeatured && (
                        <Star className="w-3 h-3 text-primary-bright fill-primary-bright shrink-0" />
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wide ${ROLE_STYLE[u.role]}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wide ${STATUS_STYLE[u.status]}`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {u.badges.slice(0, 2).map((b) => (
                        <span
                          key={b}
                          className="inline-flex items-center px-1.5 py-0.5 bg-primary-soft text-primary rounded text-[10px] font-semibold"
                        >
                          {b}
                        </span>
                      ))}
                      {u.badges.length > 2 && (
                        <span className="text-[10px] text-muted">+{u.badges.length - 2}</span>
                      )}
                      {u.badges.length === 0 && <span className="text-[10px] text-muted">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted text-[12px]">
                    {formatDistanceToNow(u.createdAt, { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-0.5 text-primary hover:underline text-[12px] font-semibold"
                      >
                        Edit
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSingleConfirm(u.id)}
                        disabled={isSelf || deletingId === u.id}
                        title={isSelf ? "You can't delete your own account" : "Delete user"}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                        aria-label={`Delete ${u.name ?? u.email}`}
                      >
                        {deletingId === u.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={singleConfirm !== null}
        onOpenChange={(open) => !open && setSingleConfirm(null)}
        title="Delete this user?"
        description="This permanently removes the user account. Enrollments, sessions, and reviews go with it. Orders / instructor-of relationships block deletion — you'll see an error if so."
        confirmLabel="Delete user"
        onConfirm={() => singleConfirm && handleSingleDelete(singleConfirm)}
      />

      <ConfirmDialog
        open={bulkConfirm}
        onOpenChange={setBulkConfirm}
        title={`Delete ${selected.size} user${selected.size === 1 ? "" : "s"}?`}
        description="Each will be deleted only if they have no financial / instructor footprint. Users with orders or courses they teach are skipped."
        confirmLabel="Delete selected"
        onConfirm={handleBulkDelete}
      />
    </>
  );
}
