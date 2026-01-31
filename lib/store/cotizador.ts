"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Producto } from "@/lib/data/catalogo";
import { planesBase } from "@/lib/data/catalogo";

export interface CotizadorState {
  proyecto: string | null;
  planBase: "basico" | "intermedio" | null;
  adicionales: Producto[];
}

interface CotizadorActions {
  setProyecto: (proyecto: string) => void;
  setPlanBase: (plan: "basico" | "intermedio") => void;
  addAdicional: (producto: Producto) => void;
  removeAdicional: (codigo: number) => void;
  clearAdicionales: () => void;
  reset: () => void;
}

interface CotizadorStore extends CotizadorState, CotizadorActions {
  getPrecioPlanBase: () => number;
  getPrecioAdicionales: () => number;
  getTotal: () => number;
  getCantidadAdicionales: () => number;
}

const initialState: CotizadorState = {
  proyecto: null,
  planBase: null,
  adicionales: []
};

function isCiudadelaVerde(proyecto: string | null): boolean {
  return (proyecto?.toLowerCase().replace(/\s+/g, "-") ?? "") === "ciudadela-verde";
}

export const useCotizadorStore = create<CotizadorStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProyecto: (proyecto) => set({ proyecto }),

      setPlanBase: (plan) => set({ planBase: plan }),

      addAdicional: (producto) =>
        set((state) => {
          const existe = state.adicionales.some((p) => p.codigo === producto.codigo);
          if (existe) return state;
          return { adicionales: [...state.adicionales, producto] };
        }),

      removeAdicional: (codigo) =>
        set((state) => ({
          adicionales: state.adicionales.filter((p) => p.codigo !== codigo)
        })),

      clearAdicionales: () => set({ adicionales: [] }),

      reset: () => set(initialState),

      getPrecioPlanBase: () => {
        const { planBase, proyecto } = get();
        if (!planBase) return 0;
        if (planBase === "basico") return planesBase.basico.precio;
        if (planBase === "intermedio") {
          return isCiudadelaVerde(proyecto)
            ? planesBase.intermedio.precioCiudadelaVerde
            : planesBase.intermedio.precio;
        }
        return 0;
      },

      getPrecioAdicionales: () => {
        return get().adicionales.reduce((sum, p) => sum + p.precio, 0);
      },

      getTotal: () => {
        return get().getPrecioPlanBase() + get().getPrecioAdicionales();
      },

      getCantidadAdicionales: () => {
        return get().adicionales.length;
      }
    }),
    { name: "cotizador-storage" }
  )
);

export { useCotizadorStore as useCotizador };
