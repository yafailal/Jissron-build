"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/admin/FormSection";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { TagInput } from "@/components/admin/TagInput";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ConsultantSchema, type ConsultantFormValues, DAYS, DAY_LABELS } from "./schema";
import { DualCurrencyInput } from "@/components/admin/DualCurrencyInput";
import { createConsultant, updateConsultant, deleteConsultant } from "./actions";
import { cn } from "@/lib/utils";
import type { Consultant, User } from "@prisma/client";

type ConsultantWithUser = Consultant & { user: Pick<User, "id" | "name" | "email" | "image"> };

interface Props {
  consultant?: ConsultantWithUser;
  availableUsers: Pick<User, "id" | "name" | "email">[];
}

export function ConsultantForm({ consultant, availableUsers }: Props) {
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [userMode, setUserMode] = useState<"existing" | "new">(
    consultant ? "existing" : "existing"
  );
  const isEdit = !!consultant;

  const availability = consultant?.availability as { day: string; hours: string }[] | null;
  const existingDays = availability?.map((a) => a.day) ?? [];
  const existingHours = availability?.[0]?.hours ?? "";

  const form = useForm<ConsultantFormValues>({
    resolver: zodResolver(ConsultantSchema),
    defaultValues: consultant
      ? {
          userId: consultant.userId,
          bio: consultant.bio,
          tagline: consultant.tagline ?? "",
          ratePerSessionMadCents: (consultant as Consultant & { ratePerSessionMadCents: number }).ratePerSessionMadCents ?? 0,
          ratePerSessionUsdCents: (consultant as Consultant & { ratePerSessionUsdCents: number }).ratePerSessionUsdCents ?? 0,
          durationMins: consultant.durationMins,
          skills: consultant.skills,
          avatarUrl: consultant.avatarGradient ?? "",
          acceptsNew: consultant.acceptsNew,
          isFeatured: consultant.isFeatured,
          availableDays: existingDays,
          typicalHours: existingHours,
        }
      : {
          userId: "",
          newUserName: "",
          newUserEmail: "",
          bio: "",
          tagline: "",
          ratePerSessionMadCents: 0,
          ratePerSessionUsdCents: 0,
          durationMins: 30,
          skills: [],
          avatarUrl: "",
          acceptsNew: true,
          isFeatured: false,
          availableDays: ["mon", "tue", "wed", "thu", "fri"],
          typicalHours: "09:00-17:00 UTC",
        },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: ConsultantFormValues) {
    try {
      if (isEdit) {
        const result = await updateConsultant(consultant.id, values);
        if (result.ok) toast.success("Consultant saved");
        else toast.error(result.error ?? "Failed to save");
      } else {
        const result = await createConsultant(values);
        if (result.ok && result.data) {
          toast.success("Consultant created");
          router.push(`/admin/consultants/${result.data.id}`);
        } else {
          toast.error((result as { ok: false; error: string }).error ?? "Failed to create");
        }
      }
    } catch {
      toast.error("Unexpected error");
    }
  }

  function onInvalid(errors: object) {
    toast.error(`Fix required fields: ${Object.keys(errors).join(", ")}`);
  }

  const selectedDays = form.watch("availableDays") ?? [];

  function toggleDay(day: string) {
    const current = form.getValues("availableDays") ?? [];
    if (current.includes(day)) {
      form.setValue("availableDays", current.filter((d) => d !== day));
    } else {
      form.setValue("availableDays", [...current, day]);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        {/* Sticky save bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-bg-soft/90 backdrop-blur-sm border-b border-line py-3 mb-6 -mx-6 px-6">
          <p className="text-[12px] text-muted">
            {isEdit ? "Editing consultant" : "New consultant"} · ⌘S to save
          </p>
          <div className="flex gap-2">
            {isEdit && (
              <Button type="button" variant="outline" size="sm" className="text-red-600" onClick={() => setDeleteConfirm(true)}>
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/consultants")}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create consultant"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* User selection */}
          {!isEdit && (
            <FormSection title="User account" description="Link this consultant to an existing user, or create a new account.">
              <div className="flex gap-2 mb-4">
                {(["existing", "new"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setUserMode(mode)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors",
                      userMode === mode
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-line text-muted hover:text-ink"
                    )}
                  >
                    {mode === "existing" ? "Pick existing user" : "Create new user"}
                  </button>
                ))}
              </div>

              {userMode === "existing" ? (
                <FormField control={form.control} name="userId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select user</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="">Select a user…</option>
                        {availableUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name ?? u.email} ({u.email})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="newUserName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ""} placeholder="Jane Smith" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="newUserEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ""} type="email" placeholder="jane@example.com" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}
            </FormSection>
          )}

          {isEdit && (
            <FormSection title="User">
              <div className="flex items-center gap-3 p-3 bg-bg-soft rounded-lg border border-line">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {(consultant.user.name ?? consultant.user.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-ink">{consultant.user.name}</p>
                  <p className="text-[12px] text-muted">{consultant.user.email}</p>
                </div>
              </div>
            </FormSection>
          )}

          {/* Profile */}
          <FormSection title="Profile">
            <FormField control={form.control} name="tagline" render={({ field }) => (
              <FormItem>
                <FormLabel>Tagline</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} placeholder="e.g. Full-stack engineer with 10 years in fintech" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Consultant bio…" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="avatarUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar</FormLabel>
                <FormControl>
                  <ImageUploadField
                    endpoint="consultantAvatar"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </FormSection>

          {/* Skills */}
          <FormSection title="Skills" description="Tags shown on the consultant card.">
            <TagInput name="skills" label="Skills" description="Press Enter or comma to add." />
          </FormSection>

          {/* Pricing */}
          <FormSection title="Pricing">
            <div className="space-y-4">
              <DualCurrencyInput
                label="Rate per session"
                madField="ratePerSessionMadCents"
                usdField="ratePerSessionUsdCents"
              />
              <FormField control={form.control} name="durationMins" render={({ field }) => (
                <FormItem>
                  <FormLabel>Session duration (min)</FormLabel>
                  <FormControl><Input {...field} type="number" min={15} max={240} className="w-32" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </FormSection>

          {/* Availability */}
          <FormSection title="Availability" description="Simplified availability — full calendar slots coming later.">
            <div>
              <p className="text-[12px] font-medium text-muted mb-2">Available days</p>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors",
                      selectedDays.includes(day)
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-line text-muted hover:text-ink"
                    )}
                  >
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
            </div>
            <FormField control={form.control} name="typicalHours" render={({ field }) => (
              <FormItem>
                <FormLabel>Typical hours</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="09:00-17:00 UTC" className="w-48" />
                </FormControl>
                <p className="text-[11px] text-muted">Free text — e.g. &ldquo;09:00-17:00 UTC&rdquo;</p>
                <FormMessage />
              </FormItem>
            )} />
          </FormSection>

          {/* Settings */}
          <FormSection title="Settings">
            <div className="space-y-4">
              <FormField control={form.control} name="acceptsNew" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel>Accepts new bookings</FormLabel>
                  </div>
                </FormItem>
              )} />
              <FormField control={form.control} name="isFeatured" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel>Featured on homepage</FormLabel>
                  </div>
                </FormItem>
              )} />
            </div>
          </FormSection>
        </div>
      </form>

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Delete consultant?"
        description="This will remove the consultant profile. The linked user account will remain."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!consultant) return;
          const result = await deleteConsultant(consultant.id);
          if (result.ok) {
            toast.success("Consultant deleted");
            router.push("/admin/consultants");
          } else {
            toast.error(result.error);
          }
        }}
      />
    </Form>
  );
}
