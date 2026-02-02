"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadCard } from "./LeadCard";
import type { Lead, Estado } from "@/lib/types/crm";

interface KanbanColumnProps {
  estado: Estado;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void | Promise<void>;
  onWhatsApp: (lead: Lead) => void;
  onReenviarEmail: (lead: Lead) => void;
}

export function KanbanColumn({
  estado,
  leads,
  onLeadClick,
  onWhatsApp,
  onReenviarEmail,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: estado.id,
  });

  const leadsIds = useMemo(() => leads.map((l) => l.id), [leads]);

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
            {leads.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[400px] space-y-3">
        <SortableContext
          items={leadsIds}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead)}
              onWhatsApp={() => onWhatsApp(lead)}
              onReenviarEmail={() => onReenviarEmail(lead)}
            />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <p className="py-8 text-center text-xs text-brand-textSecondary">
            No hay leads en esta etapa
          </p>
        )}
      </CardContent>
    </Card>
  );
}
