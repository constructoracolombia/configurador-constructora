"use client";

import { useState } from "react";
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
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
  FileText,
} from "lucide-react";
import { formatoPrecio } from "@/lib/utils/format";
import type { ClienteGroup, Lead } from "@/lib/types/crm";

interface ClienteGroupCardProps {
  group: ClienteGroup;
  onCotizacionClick: (lead: Lead) => void;
  onWhatsApp: () => void;
  onEliminar: (lead: Lead) => void;
  eliminandoId?: string | null;
}

export function ClienteGroupCard({
  group,
  onCotizacionClick,
  onWhatsApp,
  onEliminar,
  eliminandoId,
}: ClienteGroupCardProps) {
  const [expandido, setExpandido] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isMulti = group.cotizaciones.length > 1;
  const isDeleting = group.cotizaciones.some((c) => eliminandoId === c.id);
  const esGanado = group.etapaMasAvanzada === "CONTRATO_FIRMADO";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative cursor-move border-brand-border bg-brand-dark transition-all hover:border-brand-primary ${
        esGanado ? "animate-pulse border-2 border-brand-primary" : ""
      } ${isDeleting ? "pointer-events-none opacity-50" : ""}`}
    >
      {isDeleting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-brand-dark/80">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-red-500" />
            <span className="text-xs font-medium text-red-400">Eliminando...</span>
          </div>
        </div>
      )}

      <CardContent className="space-y-3 p-4">
        {/* Cabecera: nombre + badge multi + acciones */}
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (isMulti) setExpandido((v) => !v);
              else onCotizacionClick(group.cotizaciones[0]);
            }}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="text-sm font-semibold text-brand-text hover:text-brand-primary">
                {group.nombre}
              </h4>
              {isMulti && (
                <Badge className="bg-brand-primary/20 text-[10px] font-semibold text-brand-primary ring-1 ring-brand-primary/30">
                  {group.cotizaciones.length} cotiz.
                </Badge>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-brand-textSecondary">
              {group.telefono ?? group.email}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {isMulti && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpandido((v) => !v); }}
                className="flex h-7 w-7 items-center justify-center rounded text-brand-textSecondary hover:text-brand-text"
              >
                {expandido ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4 text-brand-textSecondary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-brand-border bg-brand-card">
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onWhatsApp(); }}
                  className="cursor-pointer text-brand-text"
                >
                  <MessageSquare className="mr-2 h-4 w-4 text-green-500" />
                  WhatsApp
                </DropdownMenuItem>
                {isMulti ? (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); setExpandido(true); }}
                    className="cursor-pointer text-brand-text"
                  >
                    <FileText className="mr-2 h-4 w-4 text-brand-primary" />
                    Ver cotizaciones
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onEliminar(group.cotizaciones[0]); }}
                    className="cursor-pointer text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Valor máximo */}
        <div className="text-lg font-bold text-brand-primary">
          {formatoPrecio(group.valorMax)}
          {isMulti && (
            <span className="ml-1.5 text-[10px] font-normal text-brand-textSecondary">
              mayor cotiz.
            </span>
          )}
        </div>

        {/* Cotización única — info básica */}
        {!isMulti && (
          <div className="flex items-center justify-between">
            <Badge className="bg-gray-700 text-xs">
              {group.cotizaciones[0].numero_cotizacion}
            </Badge>
            <span className="truncate text-xs text-brand-textSecondary">
              {group.cotizaciones[0].proyecto_nombre}
            </span>
          </div>
        )}

        {/* Expansión: lista de cotizaciones individuales */}
        {isMulti && expandido && (
          <div
            className="mt-1 space-y-2 border-t border-brand-border pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            {group.cotizaciones.map((cot) => (
              <div
                key={cot.id}
                className="flex items-center gap-2 rounded bg-brand-card/60 px-3 py-2"
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => onCotizacionClick(cot)}
                >
                  <p className="truncate text-xs font-medium text-brand-text hover:text-brand-primary">
                    {cot.proyecto_nombre}
                  </p>
                  <p className="text-[10px] text-brand-textSecondary">
                    {cot.numero_cotizacion} ·{" "}
                    {new Date(cot.created_at).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-brand-primary">
                  {formatoPrecio(cot.total)}
                </span>
                <button
                  onClick={() => onEliminar(cot)}
                  disabled={eliminandoId === cot.id}
                  className="shrink-0 rounded p-1 text-brand-textSecondary transition hover:text-red-400 disabled:opacity-50"
                >
                  {eliminandoId === cot.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
