"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  MessageSquare,
  Mail,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { formatoPrecio } from "@/lib/utils/format";
import type { Lead } from "@/lib/types/crm";

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  onWhatsApp: () => void;
  onReenviarEmail: () => void;
  onEliminar?: () => void;
}

export function LeadCard({
  lead,
  onClick,
  onWhatsApp,
  onReenviarEmail,
  onEliminar,
}: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const esGanado = lead.estado_crm === "CONTRATO_FIRMADO";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-move border-brand-border bg-brand-dark transition-all hover:border-brand-primary ${
        esGanado ? "animate-pulse border-2 border-brand-primary" : ""
      }`}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div
            className="flex-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <h4 className="mb-1 cursor-pointer text-sm font-semibold text-brand-text hover:text-brand-primary">
              {lead.cliente_nombre}
            </h4>
            <p className="truncate text-xs text-brand-textSecondary">
              {lead.cliente_email}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4 text-brand-textSecondary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-brand-border bg-brand-card"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onWhatsApp();
                }}
                className="cursor-pointer text-brand-text"
              >
                <MessageSquare className="mr-2 h-4 w-4 text-green-500" />
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onReenviarEmail();
                }}
                className="cursor-pointer text-brand-text"
              >
                <Mail className="mr-2 h-4 w-4 text-blue-500" />
                Re-enviar Email
              </DropdownMenuItem>
              {lead.pdf_url && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(lead.pdf_url!, "_blank");
                  }}
                  className="cursor-pointer text-brand-text"
                >
                  <ExternalLink className="mr-2 h-4 w-4 text-purple-500" />
                  Ver PDF
                </DropdownMenuItem>
              )}
              {onEliminar && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEliminar();
                  }}
                  className="cursor-pointer text-red-400 hover:text-red-300"
                >
                  <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-textSecondary">
              {lead.proyecto_nombre}
            </span>
            {lead.pdf_abierto ? (
              <Eye className="h-3 w-3 text-green-500" />
            ) : (
              <EyeOff className="h-3 w-3 text-gray-500" />
            )}
          </div>

          <div className="text-lg font-bold text-brand-primary">
            {formatoPrecio(lead.total)}
          </div>

          <div className="flex items-center justify-between">
            <Badge className="bg-gray-700 text-xs">
              {lead.numero_cotizacion}
            </Badge>
            <span className="text-xs text-brand-textSecondary">
              {new Date(lead.created_at).toLocaleDateString("es-CO", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
