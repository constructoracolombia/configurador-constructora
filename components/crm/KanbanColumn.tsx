"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClienteGroupCard } from "./ClienteGroupCard";
import type { ClienteGroup, Lead, Estado } from "@/lib/types/crm";

interface KanbanColumnProps {
  estado: Estado;
  groups: ClienteGroup[];
  onCotizacionClick: (lead: Lead) => void | Promise<void>;
  onWhatsApp: (group: ClienteGroup) => void;
  onEliminar: (lead: Lead) => void;
  eliminandoId?: string | null;
}

export function KanbanColumn({
  estado,
  groups,
  onCotizacionClick,
  onWhatsApp,
  onEliminar,
  eliminandoId,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: estado.id });
  const groupKeys = useMemo(() => groups.map((g) => g.key), [groups]);

  return (
    <Card
      ref={setNodeRef}
      className={`border-brand-border bg-brand-card transition-all ${
        isOver ? "ring-2 ring-brand-primary" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm text-brand-text">
          <span className="flex items-center gap-2">
            <span>{estado.icon}</span>
            {estado.nombre}
          </span>
          <Badge className={`${estado.color} text-white`}>
            {groups.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[400px] space-y-3">
        <SortableContext items={groupKeys} strategy={verticalListSortingStrategy}>
          {groups.map((group) => (
            <ClienteGroupCard
              key={group.key}
              group={group}
              onCotizacionClick={onCotizacionClick}
              onWhatsApp={() => onWhatsApp(group)}
              onEliminar={onEliminar}
              eliminandoId={eliminandoId}
            />
          ))}
        </SortableContext>
        {groups.length === 0 && (
          <p className="py-8 text-center text-xs text-brand-textSecondary">
            No hay clientes en esta etapa
          </p>
        )}
      </CardContent>
    </Card>
  );
}
