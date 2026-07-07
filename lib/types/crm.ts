export interface ClienteGroup {
  key: string;               // teléfono normalizado (fallback: email)
  nombre: string;            // nombre de la cotización más reciente
  telefono: string | null;
  email: string;
  cotizaciones: Lead[];      // ordenadas más reciente primero
  etapaMasAvanzada: string;  // columna Kanban donde va la tarjeta
  valorMax: number;          // cotización más alta del cliente
}

export interface Lead {
  id: string;
  created_at: string;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string | null;
  proyecto_nombre: string;
  plan_tipo: string;
  plan_nombre: string;
  total: number;
  pdf_url: string | null;
  numero_cotizacion: string;
  estado_crm: string;
  ultima_interaccion: string;
  pdf_abierto: boolean;
  prioridad: string;
  posicion_kanban: number;
  adicionales?: { nombre: string; precio: number }[];
}

export interface Nota {
  id: string;
  created_at: string;
  nota: string;
  tipo: string;
  autor: string;
}

export interface Estado {
  id: string;
  nombre: string;
  color: string;
  icon: string;
}
