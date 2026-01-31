// lib/store/cotizador.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Producto } from '@/lib/data/catalogo';
import { planesBase } from '@/lib/data/catalogo';

interface CotizadorState {
  proyecto: string | null;
  planBase: 'basico' | 'intermedio' | null;
  adicionales: Producto[];
  setProyecto: (proyecto: string) => void;
  setPlanBase: (plan: 'basico' | 'intermedio') => void;
  addAdicional: (producto: Producto) => void;
  removeAdicional: (codigo: number) => void;
  clearAdicionales: () => void;
  reset: () => void;
  getPrecioPlanBase: () => number;
  getPrecioAdicionales: () => number;
  getTotal: () => number;
  getCantidadAdicionales: () => number;
}

export const useCotizador = create<CotizadorState>()(
  persist(
    (set, get) => ({
      proyecto: null,
      planBase: null,
      adicionales: [],

      setProyecto: (proyecto) => set({ proyecto }),
      setPlanBase: (plan) => set({ planBase: plan }),
      
      addAdicional: (producto) => {
        const { adicionales } = get();
        if (adicionales.some(a => a.codigo === producto.codigo)) return;
        set({ adicionales: [...adicionales, producto] });
      },
      
      removeAdicional: (codigo) => {
        const { adicionales } = get();
        set({ adicionales: adicionales.filter(a => a.codigo !== codigo) });
      },
      
      clearAdicionales: () => set({ adicionales: [] }),
      reset: () => set({ proyecto: null, planBase: null, adicionales: [] }),

      getPrecioPlanBase: () => {
        const { planBase, proyecto } = get();
        if (!planBase) return 0;
        if (planBase === 'basico') return planesBase.basico.precio;
        if (proyecto === 'ciudadela-verde') return planesBase.intermedio.precioCiudadelaVerde;
        return planesBase.intermedio.precio;
      },
      
      getPrecioAdicionales: () => {
        return get().adicionales.reduce((sum, item) => sum + item.precio, 0);
      },
      
      getTotal: () => {
        return get().getPrecioPlanBase() + get().getPrecioAdicionales();
      },
      
      getCantidadAdicionales: () => {
        return get().adicionales.length;
      }
    }),
    { name: 'cotizador-storage' }
  )
);