"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Producto } from "@/lib/data/catalogo";
import { planesBase, getPrecioAdicional } from "@/lib/data/catalogo";

export interface ProductoConCantidad extends Producto {
  cantidad?: number;
}

interface CotizadorState {
  proyecto: string | null;
  planBase: "basico" | "intermedio" | null;
  adicionales: ProductoConCantidad[];
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
}

interface CotizadorActions {
  setProyecto: (proyecto: string) => void;
  setPlanBase: (plan: "basico" | "intermedio") => void;
  addAdicional: (producto: Producto) => void;
  removeAdicional: (id: string) => void;
  toggleAdicional: (producto: Producto) => void;
  incrementarCantidad: (id: string, max?: number) => void;
  decrementarCantidad: (id: string) => void;
  getCantidad: (id: string) => number;
  clearAdicionales: () => void;
  setClienteInfo: (nombre: string, telefono: string, email: string) => void;
  reset: () => void;
  getPrecioPlanBase: () => number;
  getPrecioAdicionales: () => number;
  getTotal: () => number;
  getCantidadAdicionales: () => number;
}

type CotizadorStore = CotizadorState & CotizadorActions;

export const useCotizador = create<CotizadorStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      proyecto: null,
      planBase: null,
      adicionales: [],
      clienteNombre: "",
      clienteTelefono: "",
      clienteEmail: "",

      // Acciones
      setProyecto: (proyecto) => {
        if (process.env.NODE_ENV === "development") {
          console.log("🏢 Proyecto seleccionado:", proyecto);
        }
        set({ proyecto });
      },

      setPlanBase: (plan) => {
        if (process.env.NODE_ENV === "development") {
          console.log("📦 Plan seleccionado:", plan);
        }
        set({ planBase: plan });
      },

      addAdicional: (producto) => {
        const state = get();
        const existe = state.adicionales.some((a) => a.id === producto.id);
        if (existe) {
          if (process.env.NODE_ENV === "development") {
            console.log("⚠️ Producto ya existe:", producto.nombre);
          }
          return;
        }

        const nuevosAdicionales = [
          ...state.adicionales,
          { ...producto, cantidad: 1 },
        ];
        if (process.env.NODE_ENV === "development") {
          console.log("✅ Producto agregado:", producto.nombre);
          console.log("📊 Adicionales actuales:", nuevosAdicionales.length);
        }
        set({ adicionales: nuevosAdicionales });
      },

      toggleAdicional: (producto) =>
        set((state) => {
          const existe = state.adicionales.find((p) => p.id === producto.id);
          if (existe) {
            return {
              adicionales: state.adicionales.filter((p) => p.id !== producto.id),
            };
          }
          return {
            adicionales: [
              ...state.adicionales,
              { ...producto, cantidad: 1 } as ProductoConCantidad,
            ],
          };
        }),

      incrementarCantidad: (id, max = 10) =>
        set((state) => {
          const adicionales = state.adicionales.map((p) => {
            if (p.id === id && (p.cantidad ?? 1) < max) {
              return { ...p, cantidad: (p.cantidad ?? 1) + 1 };
            }
            return p;
          });
          return { adicionales };
        }),

      decrementarCantidad: (id) =>
        set((state) => {
          const adicionales = state.adicionales
            .map((p) => {
              if (p.id === id) {
                const nuevaCantidad = (p.cantidad ?? 1) - 1;
                if (nuevaCantidad <= 0) return null;
                return { ...p, cantidad: nuevaCantidad };
              }
              return p;
            })
            .filter(Boolean) as ProductoConCantidad[];
          return { adicionales };
        }),

      getCantidad: (id) => {
        const producto = get().adicionales.find((p) => p.id === id);
        return producto?.cantidad ?? 0;
      },

      removeAdicional: (id) => {
        const state = get();
        const producto = state.adicionales.find((a) => a.id === id);
        const nuevosAdicionales = state.adicionales.filter((a) => a.id !== id);
        if (process.env.NODE_ENV === "development") {
          console.log("❌ Producto removido:", producto?.nombre);
          console.log("📊 Adicionales restantes:", nuevosAdicionales.length);
        }
        set({ adicionales: nuevosAdicionales });
      },

      clearAdicionales: () => {
        if (process.env.NODE_ENV === "development") {
          console.log("🗑️ Limpiando todos los adicionales");
        }
        set({ adicionales: [] });
      },

      setClienteInfo: (nombre, telefono, email) => {
        if (process.env.NODE_ENV === "development") {
          console.log("👤 Datos del cliente guardados:", { nombre, telefono, email });
        }
        set({
          clienteNombre: nombre,
          clienteTelefono: telefono,
          clienteEmail: email,
        });
      },

      reset: () => {
        if (process.env.NODE_ENV === "development") {
          console.log("🔄 Reset completo del cotizador");
        }
        set({
          proyecto: null,
          planBase: null,
          adicionales: [],
          clienteNombre: "",
          clienteTelefono: "",
          clienteEmail: "",
        });
      },

      // Getters
      getPrecioPlanBase: () => {
        const state = get();
        if (!state.planBase) return 0;
        if (state.planBase === "basico") return planesBase.basico.precio;
        if (state.proyecto === "ciudadela-verde") {
          return planesBase.intermedio.precioCiudadelaVerde;
        }
        return planesBase.intermedio.precio;
      },

      getPrecioAdicionales: () => {
        const state = get();
        
        // Bonos gratis que NO suman al total
        const bonusGratis = ["nicho iluminado", "tendedero", "ducha elegante"];
        
        // Filtrar adicionales que NO son bonos gratis
        const adicionalesQueSeCobran = state.adicionales.filter((item) => {
          const nombreLower = item.nombre.toLowerCase();
          return !bonusGratis.some((b) => nombreLower.includes(b));
        });
        
        return adicionalesQueSeCobran.reduce((sum, item) => {
          // Usar precio dinámico según el plan seleccionado
          const precioItem = getPrecioAdicional(item, state.planBase);
          return sum + precioItem * (item.cantidad ?? 1);
        }, 0);
      },

      getTotal: () => {
        const state = get();
        return state.getPrecioPlanBase() + state.getPrecioAdicionales();
      },

      getCantidadAdicionales: () => {
        const state = get();
        return state.adicionales.length;
      }
    }),
    {
      name: "cotizador-storage",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
