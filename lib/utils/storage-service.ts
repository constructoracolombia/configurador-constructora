import { supabase } from "@/lib/supabase/client";

/**
 * Sube un PDF de presupuesto a Supabase Storage y retorna la URL pública
 */
export async function subirPresupuesto(
  blob: Blob,
  fileName: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    // Generar nombre único con timestamp
    const timestamp = Date.now();
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_");
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`;

    // 1. Subir el archivo al bucket 'presupuestos'
    const { data, error: uploadError } = await supabase.storage
      .from("presupuestos")
      .upload(uniqueFileName, blob, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error subiendo archivo:", uploadError);
      return {
        success: false,
        error: uploadError.message,
      };
    }

    if (!data) {
      return {
        success: false,
        error: "No se recibió confirmación de la subida",
      };
    }

    // 2. Obtener la URL pública
    const { data: urlData } = supabase.storage
      .from("presupuestos")
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      return {
        success: false,
        error: "No se pudo obtener la URL pública",
      };
    }

    return {
      success: true,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error("Error inesperado al subir presupuesto:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Elimina archivos antiguos del bucket (opcional, para limpieza)
 */
export async function limpiarPresupuestosAntiguos(
  diasAntiguedad: number = 30
) {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

    const { data: archivos, error } = await supabase.storage
      .from("presupuestos")
      .list();

    if (error || !archivos) return;

    const archivosAntiguos = archivos.filter((archivo) => {
      const timestamp = parseInt(archivo.name.split("_")[0]);
      if (isNaN(timestamp)) return false;
      const fechaArchivo = new Date(timestamp);
      return fechaArchivo < fechaLimite;
    });

    if (archivosAntiguos.length > 0) {
      const pathsAEliminar = archivosAntiguos.map((a) => a.name);
      await supabase.storage.from("presupuestos").remove(pathsAEliminar);

      console.log(`Limpiados ${archivosAntiguos.length} archivos antiguos`);
    }
  } catch (error) {
    console.error("Error limpiando archivos antiguos:", error);
  }
}
