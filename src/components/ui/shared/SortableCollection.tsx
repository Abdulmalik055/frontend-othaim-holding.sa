"use client";

import type { ReactNode } from "react";
import {
  Accessibility,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Draggable,
} from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";

export type SortableAccessibilityMessages = {
  handleLabel: (label: string) => string;
  instructions: string;
  pickedUp: (label: string, position: number, total: number) => string;
  moved: (label: string, position: number, total: number) => string;
  dropped: (label: string, position: number, total: number) => string;
  canceled: (label: string) => string;
};

export type SortableItemRenderContext<T> = {
  item: T;
  index: number;
  itemRef: (element: Element | null) => void;
  handleRef: (element: Element | null) => void;
  isDragging: boolean;
};

export type SortableCollectionProps<T> = {
  items: T[];
  getItemId: (item: T) => string;
  getItemLabel: (item: T) => string;
  onReorder: (items: T[]) => void;
  accessibility: SortableAccessibilityMessages;
  children: (context: SortableItemRenderContext<T>) => ReactNode;
  disabled?: boolean;
};

export function moveSortableItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const reorderedItems = [...items];
  const [movedItem] = reorderedItems.splice(fromIndex, 1);
  reorderedItems.splice(toIndex, 0, movedItem);
  return reorderedItems;
}

function SortableCollectionItem<T>({
  item,
  index,
  getItemId,
  disabled,
  children,
}: {
  item: T;
  index: number;
  getItemId: (item: T) => string;
  disabled?: boolean;
  children: (context: SortableItemRenderContext<T>) => ReactNode;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: getItemId(item),
    index,
    disabled,
  });

  return children({ item, index, itemRef: ref, handleRef, isDragging });
}

export function SortableCollection<T>({
  items,
  getItemId,
  getItemLabel,
  onReorder,
  accessibility,
  children,
  disabled,
}: SortableCollectionProps<T>) {
  const itemById = new Map(items.map((item) => [getItemId(item), item]));
  const total = items.length;

  function getAnnouncementDetails(source: Draggable | null) {
    if (!isSortable(source)) return null;
    const item = itemById.get(String(source.id));
    if (!item) return null;
    return {
      label: getItemLabel(item),
      position: source.index + 1,
    };
  }

  return (
    <DragDropProvider
      plugins={(defaults) => [
        ...defaults,
        Accessibility.configure({
          screenReaderInstructions: {
            draggable: accessibility.instructions,
          },
          announcements: {
            dragstart: (event: DragStartEvent) => {
              const details = getAnnouncementDetails(event.operation.source);
              return details
                ? accessibility.pickedUp(details.label, details.position, total)
                : undefined;
            },
            dragover: (event: DragOverEvent) => {
              const details = getAnnouncementDetails(event.operation.source);
              return details
                ? accessibility.moved(details.label, details.position, total)
                : undefined;
            },
            dragend: (event: DragEndEvent) => {
              const details = getAnnouncementDetails(event.operation.source);
              if (!details) return undefined;
              return event.canceled
                ? accessibility.canceled(details.label)
                : accessibility.dropped(details.label, details.position, total);
            },
          },
        }),
      ]}
      onDragEnd={(event) => {
        if (event.canceled) return;
        const { source } = event.operation;
        if (!isSortable(source) || source.initialIndex === source.index) return;
        onReorder(moveSortableItem(items, source.initialIndex, source.index));
      }}
    >
      {items.map((item, index) => (
        <SortableCollectionItem
          key={getItemId(item)}
          item={item}
          index={index}
          getItemId={getItemId}
          disabled={disabled}
        >
          {children}
        </SortableCollectionItem>
      ))}
    </DragDropProvider>
  );
}
