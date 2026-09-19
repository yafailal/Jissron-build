"use client";

import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { X, GripVertical } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TagInputProps {
  name: string;
  label: string;
  description?: string;
}

interface TagInputInnerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label: string;
  description?: string;
}

function SortableTag({ tag, onRemove }: { tag: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <span
      ref={setNodeRef}
      style={style}
      className={`inline-flex items-center gap-1 bg-primary-soft text-primary text-[12px] font-semibold pl-1 pr-2 py-0.5 rounded ${
        isDragging ? "cursor-grabbing" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-primary/60 hover:text-primary transition-colors"
        aria-label={`Drag to reorder ${tag}`}
      >
        <GripVertical className="w-3 h-3" />
      </button>
      {tag}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-red-500 transition-colors"
        aria-label={`Remove ${tag}`}
      >
        <X size={11} />
      </button>
    </span>
  );
}

function TagInputInner({ value, onChange, label, description }: TagInputInnerProps) {
  const [inputValue, setInputValue] = useState("");
  const tags = Array.isArray(value) ? value : [];

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function addTag(raw: string) {
    const tag = raw.trim();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setInputValue("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = tags.indexOf(String(active.id));
    const newIndex = tags.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(tags, oldIndex, newIndex));
  }

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="min-h-[40px] flex flex-wrap gap-1.5 items-center p-2 rounded-lg border border-line bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tags} strategy={horizontalListSortingStrategy}>
            {tags.map((tag) => (
              <SortableTag key={tag} tag={tag} onRemove={() => removeTag(tag)} />
            ))}
          </SortableContext>
        </DndContext>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && addTag(inputValue)}
          placeholder="Type and press Enter or comma"
          className="flex-1 min-w-[140px] border-none shadow-none focus-visible:ring-0 p-0 text-[13px] h-auto"
        />
      </div>
      {description && <FormDescription>{description} Drag the grip handle to reorder.</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}

export function TagInput({ name, label, description }: TagInputProps) {
  const form = useFormContext();
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <TagInputInner value={field.value} onChange={field.onChange} label={label} description={description} />
      )}
    />
  );
}
