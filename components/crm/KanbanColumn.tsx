"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadCard } from "./LeadCard";

export interface KanbanLead {
  id: string;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono?: string | null;
  proyecto_nombre: string;
  plan_nombre: string;
  total: number;
  pdf_url?: string | null;
  numero_cotizacion: string;
  estado_crm?: string;
  created_at: string;
  pdf_abierto?: boolean;
}

interface Estado {
  id: string;
  nombre: string;
  color: string;
  icon: string;
}

interface KanbanColumnProps {
  estado: Estado;
  leads: KanbanLead[];
  onLeadClick: (lead: KanbanLead) => void | Promise<void>;
  onWhatsApp: (lead: KanbanLead) => void;
  onReenviarEmail: (lead: KanbanLead) => void;
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
