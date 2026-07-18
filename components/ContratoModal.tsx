"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { SECCIONES_POR_PLAN, BONUS_ITEMS } from "@/lib/plan-constants";
import { numeroALetras } from "@/lib/numero-a-letras";

// ── types ────────────────────────────────────────────────────────────────────

type PptoCompleto = {
  id: string;
  nombre_cliente: string;
  nombre_proyecto: string;
  conjunto: string;
  plan_base: string;
  precio_base: number | null;
  precio_manual: number | null;
  total_final: number;
  precios_snapshot: Record<string, number>;
  items_plan_estado: Record<string, { aplica: boolean; cantidad: number; descuento: number }>;
  items_ocultos: string[];
  items_manuales: Array<{ id: string; nombre: string; precio: number; cantidad: number }>;
  seleccionados: Record<string, number>;
  version_num: number;
};

export interface ContratoModalProps {
  leadId: string;
  leadNombre: string;
  presupuestoId: string;
  onClose: () => void;
}

// ── empresa (hardcoded) ───────────────────────────────────────────────────────

const EMP = {
  nombre: "CONSTRUCTORA COLOMBIA INVERSIONES SAS",
  nit: "901.590.706-1",
  rep: "YEIMER FIDEL DUARTE RIVERA",
  repCC: "1.098.753.152",
  ciudad: "Bucaramanga",
  banco: "Bancolombia",
  cuenta: "291-000124-05",
};

const HITO_PCTS = [45, 20, 20, 10, 5];
const HITO_DESCS = [
  "el cuál será pagado a la firma del presente contrato",
  "en la tercera semana de ejecución de la obra",
  "en la quinta semana de ejecución, de la obra",
  "en la séptima semana de ejecución, de la obra",
  "pagadero con la finalización de la labor contratada en la cláusula segunda del presente contrato",
];

// ── component ─────────────────────────────────────────────────────────────────

export function ContratoModal({ leadId, leadNombre, presupuestoId, onClose }: ContratoModalProps) {
  const [ppto, setPpto] = useState<PptoCompleto | null>(null);
  const [catMap, setCatMap] = useState<Map<string, string>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const [form, setForm] = useState({
    numero_contrato: "",
    nombre_contratante: "",
    cedula_contratante: "",
    fecha_firma: new Date().toISOString().split("T")[0]!,
    duracion_dias: 30,
  });

  // ── load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    void (async () => {
      const { data: pptoData } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("id", presupuestoId)
        .single();

      if (pptoData) {
        setPpto(pptoData as PptoCompleto);
        setForm((f) => ({ ...f, nombre_contratante: pptoData.nombre_cliente ?? "" }));

        const selIds = Object.keys(pptoData.seleccionados || {});
        if (selIds.length > 0) {
          const { data: cats } = await supabase
            .from("catalogo_items")
            .select("id, nombre")
            .in("id", selIds);
          if (cats) setCatMap(new Map(cats.map((c: { id: string; nombre: string }) => [c.id, c.nombre])));
        }
      }

      // Auto-generate contract number
      const { data: lastC } = await supabase
        .from("contratos")
        .select("numero_contrato")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextNum = 1;
      if (lastC?.numero_contrato) {
        const match = /(\d+)$/.exec(lastC.numero_contrato);
        if (match?.[1]) nextNum = parseInt(match[1]) + 1;
      }
      setForm((f) => ({ ...f, numero_contrato: `B${String(nextNum).padStart(4, "0")}` }));
      setCargando(false);
    })();
  }, [presupuestoId]);

  // ── PDF generation ───────────────────────────────────────────────────────────
  const generarPDF = async () => {
    if (!ppto) return;
    if (!form.nombre_contratante.trim() || !form.cedula_contratante.trim() || !form.numero_contrato.trim()) {
      alert("Completa todos los campos requeridos.");
      return;
    }

    setGenerando(true);
    setErrorGuardar(null);

    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, H = 297;
      const mL = 20, mR = 20;
      const cW = W - mL - mR;
      let y = 0;

      const lh = (sz: number) => sz * 0.3528 * 1.35;

      const checkPage = (need: number) => {
        if (y + need > H - 18) {
          doc.addPage();
          drawHeader();
          y = 22;
        }
      };

      const addPara = (
        text: string,
        sz = 9,
        style: "normal" | "bold" | "italic" = "normal",
        align: "left" | "center" = "left",
        after = 3,
        x = mL,
        w = cW
      ) => {
        doc.setFont("helvetica", style);
        doc.setFontSize(sz);
        const lines = doc.splitTextToSize(text, w) as string[];
        const h = lines.length * lh(sz) + after;
        checkPage(h);
        doc.text(lines, align === "center" ? W / 2 : x, y, { align });
        y += h;
      };

      const drawHeader = () => {
        doc.setFillColor(230, 230, 230);
        doc.rect(0, 0, W, 10, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 80);
        doc.text("CONTRATO DE OBRA CIVIL - V. 012", mL, 6.5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(11, 52, 110);
        doc.text("Constructora", W - mR - 1, 5, { align: "right" });
        doc.text("Colombia", W - mR - 1, 9, { align: "right" });
        doc.setTextColor(0, 0, 0);
      };

      // ── PAGE 1 ─────────────────────────────────────────────────────────────
      drawHeader();
      y = 18;

      addPara("CONTRATO DE OBRA CIVIL", 12, "bold", "center", 2);
      addPara(`Contrato No. ${form.numero_contrato}`, 11, "bold", "center", 6);

      const lugar = [
        ppto.nombre_proyecto ? ppto.nombre_proyecto.toUpperCase() : "",
        ppto.conjunto ? `DEL CONJUNTO ${ppto.conjunto.toUpperCase()}` : "",
      ].filter(Boolean).join(" ");

      const valorLetras = numeroALetras(ppto.total_final);

      const introText =
        `Entre los suscritos ${form.nombre_contratante}, quien se identifica con cédula de ciudadanía número ` +
        `${form.cedula_contratante} de ${EMP.ciudad}, quien en adelante se denominará EL CONTRATANTE y ` +
        `${EMP.nombre}, identificada con NIT ${EMP.nit} con domicilio principal en la ciudad de ${EMP.ciudad}, ` +
        `representada legalmente por ${EMP.rep}, identificado con cédula de ciudadanía número ${EMP.repCC}, ` +
        `quien en el texto del presente contrato se denominará EL CONTRATISTA, hemos decidido celebrar el presente ` +
        `contrato de obra que se regirá por las normas civiles y comerciales que regulan la materia, según las ` +
        `siguientes cláusulas.`;
      addPara(introText, 9, "normal", "left", 5);

      addPara("CONDICIONES CONTRACTUALES", 10, "bold", "center", 3);

      const hitosText = HITO_PCTS.map((pct, i) => {
        const valor = Math.round(ppto.total_final * pct / 100);
        return `• El ${pct}% del total del contrato, ${HITO_DESCS[i]}. $${valor.toLocaleString("es-CO")}.`;
      }).join("\n");

      // CONDICIONES table
      autoTable(doc, {
        startY: y,
        margin: { left: mL, right: mR },
        head: [],
        body: [
          [
            { content: "Objeto del Contrato", styles: { fontStyle: "bold", cellWidth: 52 } },
            "Por medio de este contrato EL CONTRATISTA se obliga a favor DE EL (LA) (LOS) CONTRATANTE a realizar la ejecución de una obra civil, de conformidad con lo establecido en la CLÁUSULA SEGUNDA del presente contrato y el ANEXO 1, donde se encuentran detalladas las actividades propias de la ejecución del presente contrato.",
          ],
          [
            { content: "Lugar de ejecución o de\nubicación del inmueble", styles: { fontStyle: "bold", cellWidth: 52 } },
            { content: lugar, styles: { fontStyle: "bold", textColor: [0, 0, 180] as [number, number, number] } },
          ],
          [
            { content: "Valor total", styles: { fontStyle: "bold", cellWidth: 52 } },
            { content: valorLetras, styles: { fontStyle: "bold", textColor: [0, 0, 180] as [number, number, number] } },
          ],
          [
            { content: "Modalidad de pago", styles: { fontStyle: "bold", cellWidth: 52 } },
            { content: `Los pagos se realizarán de conformidad con los siguientes hitos:\n${hitosText}`, styles: { textColor: [0, 0, 180] as [number, number, number] } },
          ],
          [
            { content: "Cláusula penal", styles: { fontStyle: "bold", cellWidth: 52 } },
            "3% sobre el total del valor del contrato.",
          ],
          [
            { content: "Fecha de ejecución", styles: { fontStyle: "bold", cellWidth: 52 } },
            {
              content: `${form.duracion_dias} días hábiles contados a partir de la firma del acta de inicio indicado en el parágrafo primero de la cláusula primera`,
              styles: { textColor: [0, 0, 180] as [number, number, number] },
            },
          ],
          [
            { content: "Garantía", styles: { fontStyle: "bold", cellWidth: 52 } },
            "Seis meses (6) contado a partir de la entrega de la obra ejecutada.\n(sujeto a las garantías de fabrica para los materiales)",
          ],
        ],
        styles: { fontSize: 8.5, cellPadding: 3, lineColor: [0, 0, 0] as [number, number, number], lineWidth: 0.3 },
        columnStyles: { 0: { cellWidth: 52 }, 1: { cellWidth: cW - 52 } },
        tableLineColor: [0, 0, 0] as [number, number, number],
        tableLineWidth: 0.3,
      });
      y = ((doc as any).lastAutoTable?.finalY ?? y) + 4;

      // ── CLÁUSULA PRIMERA ────────────────────────────────────────────────────
      addPara(
        "CLÁUSULA PRIMERA: OBJETO. EL CONTRATISTA se obliga para con EL CONTRATANTE a cumplir con el objeto " +
        "indicado en las CONDICIONES CONTRACTUALES, así como aquellas actividades inherentes al desarrollo de este. " +
        "De igual manera EL CONTRATISTA debe cumplir con la propuesta técnico-económica de la obra presentada, la " +
        "cual hace parte integral del presente contrato. Así mismo, deberá cumplir con los diseños técnicos y " +
        "especificaciones técnicas entregados por EL CONTRATANTE.",
        9
      );
      addPara(
        "PARÁGRAFO PRIMERO: ACTA DE INICIO. Una vez suscrito el presente contrato, EL CONTRATISTA iniciará la " +
        "ejecución de los trabajos respectivos, previa suscripción del ACTA DE INICIO por ambas partes, y se realice " +
        "la entrega de los diseños y especificaciones técnicos que serán entregadas por LA CONTRATANTE.",
        9, "normal", "left", 2
      );
      addPara(
        "PARÁGRAFO SEGUNDO: DOCUMENTOS QUE HACEN PARTE DE ESTE CONTRATO. Forman parte integrante del " +
        "presente contrato y tendrán la misma fuerza vinculante y validez, los siguientes documentos: oferta(s), " +
        "comunicaciones; tratativas precontractuales; ordenes de servicio y/u órdenes de compra; correos electrónicos " +
        "que se crucen LAS PARTES antes, durante y después de finalizada la relación contractual y que guarden relación " +
        "con el desarrollo del objeto del presente contrato; modificaciones formalizadas mediante otrosí. Los documentos " +
        "mencionados anteriormente forman parte integral del mismo y definen las actividades, alcance y obligaciones de " +
        "este. No obstante, ante cualquier dificultad o contradicción, las partes manifiestan que, lo estipulado en el " +
        "presente contrato, prevalecerá sobre los demás documentos aquí enlistados.",
        9, "normal", "left", 4
      );

      // ── CLÁUSULA SEGUNDA ────────────────────────────────────────────────────
      addPara(
        "CLÁUSULA SEGUNDA: ALCANCE DE LA OBRA A EJECUTAR POR EL CONTRATISTA ejecutará las actividades que se " +
        "describen a continuación, de conformidad con los metros cuadrados y unidades indicadas a continuación:",
        9, "normal", "left", 3
      );

      // Build activity table
      const tableBody: any[][] = [];
      const secciones = SECCIONES_POR_PLAN[ppto.plan_base] ?? [];
      const ocultosSet = new Set(ppto.items_ocultos || []);
      const grayHdr = { fontStyle: "bold" as const, fillColor: [220, 220, 220] as [number, number, number] };

      for (const { seccion, items } of secciones) {
        const visibles = items.filter((n) => !ocultosSet.has(`${seccion}_${n}`));
        const aplicados = visibles.filter((n) => (ppto.items_plan_estado[n]?.aplica ?? true) !== false);
        if (aplicados.length === 0) continue;
        tableBody.push([{ content: seccion.toUpperCase(), colSpan: 3, styles: grayHdr }]);
        for (const nombre of aplicados) {
          const qty = ppto.items_plan_estado[nombre]?.cantidad ?? 1;
          tableBody.push([nombre, "SI", String(qty)]);
        }
      }

      const selEntries = Object.entries(ppto.seleccionados);
      if (selEntries.length > 0) {
        tableBody.push([{ content: "ADICIONALES GENERAL", colSpan: 3, styles: grayHdr }]);
        for (const [id, qty] of selEntries) {
          tableBody.push([catMap.get(id) ?? "Ítem adicional", "SI", String(qty)]);
        }
      }

      if (ppto.items_manuales.length > 0) {
        tableBody.push([{ content: "PERSONALIZADOS", colSpan: 3, styles: grayHdr }]);
        for (const item of ppto.items_manuales) {
          tableBody.push([item.nombre, "SI", String(item.cantidad)]);
        }
      }

      tableBody.push([
        { content: "TOTAL", colSpan: 2, styles: { fontStyle: "bold" as const, halign: "right" as const } },
        { content: `$${ppto.total_final.toLocaleString("es-CO")}`, styles: { fontStyle: "bold" as const } },
      ]);

      tableBody.push([{
        content: "BONUS GRATIS - Te llevas todos estos Bonus con tu remodelación",
        colSpan: 3,
        styles: { fontStyle: "bold" as const, fillColor: [200, 240, 200] as [number, number, number] },
      }]);
      for (const b of BONUS_ITEMS) {
        tableBody.push([b, "GRATIS", ""]);
      }

      const tblTitle = `Constructora Colombia Remodela - ${ppto.conjunto || ppto.nombre_proyecto || ""}`;
      autoTable(doc, {
        startY: y,
        margin: { left: mL, right: mR },
        head: [
          [{ content: tblTitle, colSpan: 3, styles: { halign: "center" as const, fontStyle: "bold" as const, fillColor: [240, 240, 240] as [number, number, number] } }],
          [
            { content: "Ítem", styles: { fontStyle: "bold" as const } },
            { content: "¿Aplica? (SI/NO)", styles: { fontStyle: "bold" as const, halign: "center" as const } },
            { content: "Cantidad/Área", styles: { fontStyle: "bold" as const, halign: "center" as const } },
          ],
        ],
        body: tableBody,
        styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0] as [number, number, number], lineWidth: 0.2 },
        columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 35, halign: "center" as const }, 2: { cellWidth: 28, halign: "center" as const } },
        showHead: "everyPage",
      });
      y = ((doc as any).lastAutoTable?.finalY ?? y) + 3;

      addPara("* Tiempo de entrega de 30 días hábiles.", 8, "italic", "left", 1);
      addPara("* Te enviamos avances semanales de tu apartamento por Whatsapp.", 8, "italic", "left", 1);
      addPara("* Se realiza esta cotización con precio de enchape de 40 mil pesos el metro cuadrado.", 8, "italic", "left", 4);

      addPara("PARÁGRAFO PRIMERO: Las obras a ejecutar serán las establecidas en esta cláusula, en el evento que EL CONTRATISTA, requiera obras adicionales deberá notificarlo por escrito AL CONTRATATANTE con el fin de establecer el costo y tiempo de ejecución, todo lo cual deberá realizarse mediante otrosí al presente contrato.", 9, "normal", "left", 2);
      addPara("PARÁGRAFO SEGUNDO: Se deja la acotación que el enchape cotizado y al que hace referencia la presente CLÁUSULA corresponde a la cerámica por valor de CUARENTA MIL PESOS MCTE ($40.000) M2 en el evento que EL CONTRATISTA, solicite la instalación de un enchape por encima de este valor deberá notificarlo por escrito y pagar los dineros adicionales que esto conlleve.", 9, "normal", "left", 2);
      addPara("PARÁGRAFO TERCERO: Los ítems de ejecución que hayan sido cotizados, aprobados y cuantificados en metros cuadrados (M2), deberán ser debidamente sustentados por el CONTRATISTA respecto de su ejecución real para la facturación. En caso de requerir la ejecución de Metros cuadrados adicionales a los aquí contemplados, el CONTRATISTA deberá presentar un informe técnico para solicitar autorización por escrito a LA CONTRATANTE, para su ejecución y posterior facturación.", 9, "normal", "left", 4);

      // ── CLÁUSULA TERCERA ────────────────────────────────────────────────────
      addPara("CLÁUSULA TERCERA: DURACIÓN. LAS PARTES han definido que la duración del presente contrato será la indicada en las CONDICIONES CONTRACTUALES, y tendrá su inicio real de acuerdo con la fecha que las partes registren en el acta de inicio. El contrato podrá ser renovado o prorrogado por mutuo acuerdo entre las partes. En este caso, las partes deberán acordar si la renovación o prorroga será por períodos iguales o diferentes a la inicial, siempre y cuando estas modificaciones consten por otrosí suscrito por ambas partes. En caso de no renovarse, el presente contrato se tendrá por terminado al vencimiento del plazo pactado sin necesidad de formalidad alguna por cualquiera de las Partes.", 9);
      addPara("PARÁGRAFO PRIMERO: En caso de presentarse retrasos en la entrega de materiales por circunstancias relacionadas con asuntos no atribuibles AL CONTRATISTA, o que estén enmarcadas en aquellos eventos relacionados con causales de fuerza mayor o caso fortuito y/o Cualquier novedad relacionada con la entrega de materiales que pueda afectar los cronogramas de trabajo pactados en el acta de inicio, será informada de manera inmediata por el medio más expedito. En dado caso, LAS PARTES estarán en la obligación de revisar en un término máximo de dos (2) días los ajustes al cronograma de trabajo, sin que tal situación implique incumplimiento al contrato.", 9, "normal", "left", 2);
      addPara("PARÁGRAFO SEGUNDO: SUSPENSIÓN. El plazo para la ejecución del objeto del presente contrato podrá ser suspendido por mutuo acuerdo entre las partes. Unilateralmente, sólo podrá suspenderse por causa extraña, fuerza mayor y caso fortuito conforme a lo estipulado en la CLÁUSULA DÉCIMA SEXTA. En caso de reanudación de la ejecución del objeto del presente contrato, los plazos indicados en este contrato se prorrogarán por un tiempo igual al de la suspensión. En caso de no poder superarse esta causal dentro de un plazo superior a 30 días calendario, se configurará la terminación de este contrato, sin que dicha terminación genere indemnización a favor de ninguna de las partes.", 9, "normal", "left", 4);

      // ── CLÁUSULA CUARTA ─────────────────────────────────────────────────────
      addPara(
        `CLÁUSULA CUARTA: VALOR DEL CONTRATO Y FORMA DE PAGO. LA CONTRATANTE pagará a EL CONTRATISTA la suma ` +
        `indicada en las CONDICIONES CONTRACTUALES a la cuenta de ahorros No. ${EMP.cuenta} del Banco ${EMP.banco} ` +
        `a nombre de ${EMP.nombre} con Nit. ${EMP.nit.replace(/\./g, "")} por los servicios descritos en el presente ` +
        `contrato en la forma y plazos allí acordados, una vez hayan sido efectivamente prestados y hayan sido recibidos ` +
        `a satisfacción por EL CONTRATANTE.`,
        9
      );
      addPara("El valor indicado en las condiciones contractuales podrá estar sujeto a cambios conforme a las variaciones abruptas del mercado, lo cual deberá ser sustentado por EL CONTRATISTA y notificado con antelación AL CONTRATANTE, con el fin de aceptar el incremento propuesto.", 9, "normal", "left", 4);

      // ── CLÁUSULA QUINTA ─────────────────────────────────────────────────────
      addPara("CLÁUSULA QUINTA. OBLIGACIONES DEL CONTRATISTA:", 9, "bold", "left", 2);
      const obligC = [
        "DISPONIBILIDAD Y CONTINUIDAD EN LA PRESTACIÓN DEL SERVICIO: EL CONTRATISTA se obliga a garantizar, durante la duración del contrato, la disponibilidad necesaria para la prestación del servicio, y a establecer planes de contingencia y continuidad del servicio que le permitan garantizar su continuidad y capacidad de retorno a la operación normal ante eventos imprevistos, salvo por aquellas circunstancias que constituyan fuerza mayor o caso fortuito.",
        "GARANTÍAS: EL CONTRATISTA se obliga a constituir las garantías indicadas en las CONDICIONES CONTRACTUALES, mantenerlas vigentes durante todo el tiempo de ejecución del contrato, incluyendo los períodos de reactivación posteriores a la suspensión si es que a ello hubiera lugar y a adecuar los montos en caso de que resulte procedente.",
        "PERSONAL Y RECURSOS DISPUESTOS PARA EL DESARROLLO DEL CONTRATO: EL CONTRATISTA se obliga a emplear personal idóneo para la prestación del servicio, a quienes deberá instruir adecuadamente para el desarrollo de las labores encomendadas, y respecto de quienes deberá cumplir con las obligaciones laborales, en especial aquellas relacionadas con el Sistema de Gestión de Seguridad y Salud en el Trabajo, así como la verificación de los pagos y aportes al sistema de seguridad social integral, verificando que todo el personal involucrado cuente con afiliación y efectúe los aportes al sistema integral de seguridad social. De igual forma, EL CONTRATISTA se obliga a emplear y poner a disposición de LA CONTRATANTE todos los recursos técnicos y humanos requeridos para cumplir con las obligaciones del presente contrato que hayan sido indicados en la propuesta técnico-económica. EL CONTRATISTA tendrá autonomía técnica, administrativa y directiva de conformidad con las limitaciones y especificaciones establecidas en el CONTRATO y, por lo tanto, su personal no estará laboralmente vinculado y/o subordinado a LA CONTRATANTE, ni será intermediario, agente o representante suyo, ni la obligará ante terceros. EL CONTRATISTA ejecutará el objeto del CONTRATO a través de su propio personal.",
        "INFORMES: EL CONTRATISTA se compromete a suministrar la información solicitada por EL CONTRATANTE, así como aquellos hechos o circunstancias, previstas o imprevistas, sobrevinientes o no, que dada su importancia deban ser conocida por LA CONTRATANTE, así como aquella que pueda influir negativa o positivamente en el desarrollo y ejecución del objeto del presente contrato. Mantener informado a LA CONTRATANTE del desarrollo del trabajo encomendado, asistir a las reuniones a las que sea convocado, y en general, rendir los informes, aclararlos, adicionarlos y complementarlos de manera oportuna.",
        "GESTION DE LA OBRA: Retirar a la terminación de las labores sus equipos; efectuar la remoción de escombros, desperdicios y materiales sobrantes, disponiéndolos en los botaderos legalmente autorizados; hacer la limpieza general del sitio de los trabajos para entregar las instalaciones despejadas y dejar los espacios que ocupó en el mismo estado de conservación y limpieza que los recibió.",
      ];
      for (let i = 0; i < obligC.length; i++) addPara(`${i + 1}. ${obligC[i]!}`, 9, "normal", "left", 2);
      y += 2;

      // ── CLÁUSULA SEXTA ──────────────────────────────────────────────────────
      addPara("CLÁUSULA SEXTA: OBLIGACIONES DE LA CONTRATANTE.", 9, "bold", "left", 2);
      const obligT = [
        "PAGO DE LOS HONORARIOS: LA CONTRATANTE se obliga a pagar de manera puntual y en la forma establecida el valor indicado en las CONDICIONES CONTRACTUALES.",
        "SUMINISTRO DE INFORMACIÓN: proveer toda la información, diseños, especificaciones técnicas y colaboración que requiera EL CONTRATISTA, para la realización de la labor encomendada. La documentación que se encuentre en su poder y se requiera para el correcto desarrollo del objeto, deberá ser entregada en los tiempos pactados con el CONTRATISTA.",
        "REPORTE DE DEFICIENCIAS EN EL SERVICIO: Reportar a EL CONTRATISTA en forma oportuna, las deficiencias o anomalías que detecte en el desarrollo del objeto contractual, así como las sugerencias que estime convenientes sobre los servicios prestados y sobre posibles mejoras al mismo, siempre y cuando consten en la oferta técnico comercial presentada por el CONTRATISTA y/o en los diseños y especificaciones técnicas que hayan sido entregadas.",
        "COMUNICACIONES: Atender con diligencia las inquietudes que presente EL CONTRATISTA y comunicar los procesos establecidos para garantizar la prestación de los servicios.",
      ];
      for (let i = 0; i < obligT.length; i++) addPara(`${i + 1}. ${obligT[i]!}`, 9, "normal", "left", 2);
      y += 2;

      // ── CLÁUSULAS 7–17 ──────────────────────────────────────────────────────
      addPara("CLÁUSULA SEPTIMA: INDEPENDENCIA DE LAS PARTES. En ejecución del presente contrato, ambas partes actuarán por su propia cuenta, con absoluta autonomía e independencia técnica administrativa y directiva. De esta manera, ninguna de ellas, ni sus empleados, contratistas o subcontratistas estarán sujeta a subordinación laboral alguna en virtud del presente contrato.", 9, "normal", "left", 4);

      addPara("CLÁUSULA OCTAVA: TERMINACIÓN DEL CONTRATO. El contrato podrá terminarse por cualquiera de las siguientes causales:", 9, "bold", "left", 2);
      const causales = [
        "Por finalización del término contractual inicial.",
        "Por presentarse la inejecución total, ejecución parcial o la ejecución tardía o defectuosa, o el incumplimiento de las obligaciones pactadas en este contrato y sus anexos. Por mutuo acuerdo entre LAS PARTES.",
        "Por la alteración o manipulación no autorizada de equipos y/o información de EL CONTRATANTE por parte del personal de EL CONTRATISTA.",
        "Adicional a las causales anteriores, cualquiera de las partes podrá dar por terminado el presente contrato en cualquier tiempo, dando previo aviso con 30 días calendario de antelación, sin justificar el porqué de su decisión. Esta terminación no dará lugar a indemnización alguna a favor del CONTRATISTA, y solo se le pagará el valor de los trabajos ejecutados a satisfacción de EL CONTRATANTE hasta la fecha de terminación, basado el valor en las tarifas pactadas. Adicionalmente, le serán pagados los gastos en que razonablemente haya incurrido para la ejecución del contrato, así como el costo de los materiales y elementos que haya adquirido para la ejecución de las labores y que fueran indispensables para la obra, independientemente de la etapa o porcentaje de ejecución. En caso de terminación anticipada de los servicios de que trata este contrato, independientemente del motivo, EL CONTRATISTA se compromete a transferir ordenadamente a EL CONTRATANTE los servicios, funciones, materiales adquiridos y operaciones ejecutados por él bajo este contrato, ya sea a otro proveedor de servicios o a LA CONTRATANTE mismo.",
      ];
      for (let i = 0; i < causales.length; i++) addPara(`${i + 1}. ${causales[i]!}`, 9, "normal", "left", 2);
      y += 2;

      addPara("CLÁUSULA NOVENA: CAMBIOS Y/O ADICIONES EN LAS OBRAS.", 9, "bold", "left", 2);
      const cambios = [
        "Durante la ejecución de la obra EL CONTRATANTE podrá ordenar los cambios que considere necesarios. Si por estos cambios se afecta el tiempo de ejecución y/o la cantidad de la obra, las partes deberán acordar los términos de dichos cambios, antes de ordenarlos y dejar constancia escrita del acuerdo entre las partes, la cual deberá ir firmada por las Partes del presente Contrato. EL CONTRATANTE no efectuará pagos por concepto de cambios de obra o trabajos adicionales que no estén debidamente diligenciados y aprobados por las partes.",
        "Las obras adicionales (mayores cantidades de obra), en caso de requerirse deberán ser aprobadas por LA CONTRATANTE de manera previa a su ejecución; las obras extras para su ejecución en obra y su pago deberán ser aprobadas por EL CONTRATANTE de manera previa. EL CONTRATISTA expedirá una factura acompañada de su respectiva Acta de soporte aprobada. Las obras extras o adicionales realizadas sin previa aprobación serán ejecutadas por cuenta y riesgo de EL CONTRATISTA sin que LA CONTRATANTE se obligue a su pago.",
        "Todo gasto no estipulado en el listado de cantidades, especificaciones técnicas (entregadas por LA CONTRATANTE), gastos generales o términos de referencia se considera un costo extra y su valor y pago depende de su previa autorización por parte de EL CONTRATANTE. El valor indicado en el listado de cantidades, propuesta técnico comercial y precios unitarios no será reajustable e incluye todos los precios de mano de obra, materiales, herramientas, equipos e insumos utilizados, análisis de factor de riesgos previsibles y gastos generales del proyecto, así como cualquier gasto, costo, viáticos, desplazamientos o cualquier tipo de erogación directa o indirecta en que tenga que incurrir EL CONTRATISTA para el cumplimiento de este.",
        "Para efectos del contrato se consideran como obras extras aquellas no previstas en la cotización y en la CLÁUSULA SEGUNDA: ALCANCE DE LA OBRA A EJECUTAR y aquellas que no se encuentran descrita en las CONDICIONES CONTRACTUALES, y que por su naturaleza son requeridas para la completa terminación y adecuado funcionamiento de la obra contratada. En todo caso, requerirán aprobación por escrito de EL CONTRATANTE.",
        "LA CONTRATANTE se reserva el derecho de ordenar en cualquier momento la ejecución obras extras y adicionales, o cambios de especificaciones que den lugar a substitución de ítems en desarrollo del contrato, siempre y cuando los trabajos hagan parte inseparable de la obra contratada, o sean necesarios para protegerla. Los costos estimados se adicionarán al valor del contrato y serán reconocidos por LA CONTRATANTE.",
        "EL CONTRATISTA contrae la obligación de acatar las órdenes recibidas al respecto, realizando las obras y suministrando los materiales necesarios, después de concertar los precios y suscribir las Actas de cambio de obra preparadas de común acuerdo con EL CONTRATANTE.",
        "Las obras adicionales se pagarán de acuerdo con los precios unitarios establecidos en el contrato original. En caso de variación de precios en el mercado, se tomará como base para el reconocimiento el valor indicado en cotizaciones previas presentadas por el CONTRATISTA.",
        "Las obras extras serán cotizadas por EL CONTRATISTA mediante análisis de precios sustentados con precios de mercado, desperdicios razonables y cotizaciones ciertas, susceptibles de ser confrontados por EL CONTRATANTE con análisis y cotizaciones similares (mínimo 2) antes de llegar a un acuerdo. El costo directo convenido para cada ítem será afectado por el factor AIU (Administración, Imprevistos y Utilidad) del contrato.",
      ];
      for (let i = 0; i < cambios.length; i++) addPara(`${i + 1}. ${cambios[i]!}`, 9, "normal", "left", 2);
      y += 2;

      addPara("CLÁUSULA DÉCIMA: CLÁUSULA PENAL. En caso de incumplimiento de todas o alguna de las obligaciones por cualquiera de LAS PARTES, la parte incumplida pagará a la otra parte que ha cumplido o se ha allanado a cumplir, a título de sanción, el valor indicado en las CONDICIONES CONTRACTUALES, sin que esto conlleve a entender extinguida la obligación principal ni la posibilidad de solicitar y acreditar perjuicios, la cual puede ser exigida sin necesidad de requerimiento judicial ni extrajudicial alguno y sin perjuicio de la exigibilidad de la garantía por incumplimiento del contrato o las multas adicionales a que haya lugar, lo que no priva a que cualquiera de las partes pretenda el cobro de los perjuicios que en tal evento se causaren.", 9, "normal", "left", 4);

      addPara("CLÁUSULA DÉCIMA PRIMERA: SOLUCIÓN DE PROBLEMAS. Cualquier situación relacionada con este contrato se intentará solucionar por la vía del arreglo directo entre LAS PARTES, en un plazo no mayor a 30 días calendario, en caso de no lograrlo, serán libres de acudir ante la justicia ordinaria de la República de Colombia u otro Mecanismo Alternativo de Solución de Conflictos.", 9, "normal", "left", 4);
      addPara("CLÁUSULA DÉCIMA SEGUNDA. LEY APLICABLE: La ley aplicable al presente contrato será la colombiana.", 9, "normal", "left", 4);
      addPara("CLÁUSULA DÉCIMA TERCERA: MÉRITO EJECUTIVO. El presente contrato constituye título de recaudo ejecutivo, ya que se trata de una obligación clara, expresa y exigible.", 9, "normal", "left", 4);
      addPara("CLÁUSULA DÉCIMA CUARTA. Si cualquier disposición de este contrato fuere declarada nula, inexistente, ilegal o ineficaz, la parte restante del Acuerdo permanecerá vigente, salvo disposición legal en contrario o en el caso de que dicha disposición nula, inexistente, ilegal o ineficaz afecte la naturaleza y obligaciones esenciales del presente Acuerdo, caso en el cual las Partes se comprometen a celebrar un nuevo Acuerdo en términos y condiciones similares.", 9, "normal", "left", 4);
      addPara("CLÁUSULA DÉCIMA QUINTA: INDEPENDENCIA DE LAS PARTES. En ejecución del presente contrato, ambas partes actuarán por su propia cuenta, con absoluta autonomía e independencia técnica administrativa y directiva. De esta manera, ninguna de ellas estará sujeta a subordinación laboral alguna en virtud del presente contrato.", 9, "normal", "left", 4);
      addPara(
        "CLÁUSULA DÉCIMA SEXTA: TRATAMIENTO DE CAUSA EXTRAÑA. Ninguna de las PARTES estará en mora de cumplir lo pactado cuando el incumplimiento, total o parcial, se deba a causas o circunstancias constitutivas de fuerza mayor o caso fortuito, o actos de terceros. En el evento que sobrevengan hechos, actos o circunstancias extraordinarias, irresistibles e imprevisibles ajenas a la voluntad de las partes, y todas aquellas situaciones posteriores a la celebración del contrato, que modifiquen o alteren el equilibrio económico del cumplimiento del contrato o que generen pérdida para el negocio acordado; eventos tales como: alta devaluación del peso Colombiano frente al dólar americano, fijación de controles cambiarios por parte de la autoridad competente que conduzca a variaciones en la tasa de cambio, eventuales restricciones a las importaciones, fijación, incremento y aprobación de aranceles e impuestos para la importación y comercialización de los productos en el territorio, escasez o restricciones para el aprovisionamiento y transporte del producto, entre otros; las partes deberán notificarse mediante comunicación escrita por el medio más expedito y/o al medio de notificación elegido por la PARTE, la cual deberá ser enviada por la parte afectada con la finalidad de plantear y dar inicio a una etapa de renegociación de las condiciones del contrato que permita restablecer el equilibrio del mismo. Dicha etapa de renegociación de condiciones comerciales tendrá un plazo máximo de un (1) mes contado desde su inicio, plazo que una vez finalizado sin acuerdo alguno entre las partes, dará lugar a la terminación del contrato sin cobro de sanción y/o indemnización, ni tampoco facultará a estas a hacer efectivas las pólizas tomadas por el contratista para respaldar el cumplimiento de este contrato, debiendo las partes reconocer las obligaciones que fueron ejecutadas hasta ese momento, y realizar los actos que se encuentran pendientes con relación a las obligaciones ya adquiridas y que pudiesen ejecutarse sin alteración alguna. Todas estas acciones deben de llevarse a cabo en un plazo que no exceda 30 días calendario a la fecha efectiva de terminación establecida de común acuerdo por las partes bajo la causal acaecida indicada en la presente CLÁUSULA, con la finalidad de que se puedan extender los paz y salvos recíprocos efectivos entre los intervinientes.",
        9, "normal", "left", 4
      );

      // ── CLÁUSULA 17 + cierre ────────────────────────────────────────────────
      const DIAS_ES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve", "treinta", "treinta y uno"];
      const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      const fd = new Date(form.fecha_firma + "T12:00:00");
      const diaNum = fd.getDate();
      const diaStr = DIAS_ES[diaNum] ?? String(diaNum);
      const mesStr = MESES_ES[fd.getMonth()]!;

      addPara(
        `CLÁUSULA DÉCIMA SEPTIMA ESTIPULACIONES CONTRACTUALES ANTERIORES. Las partes manifiestan que no reconocerán validez a estipulaciones verbales relacionadas y anteriores con el presente contrato, el cual constituye el acuerdo completo e íntegro entre ellas y reemplaza sin dejar efecto alguno cualquier otro acuerdo verbal o escrito celebrado con anterioridad. Con la firma del presente documento se reemplaza cualquier otro acuerdo verbal o escrito. Para constancia y en señal de aceptación, LAS PARTES suscriben el presente documento en la ciudad de Bucaramanga el día ${diaStr} (${diaNum}) de ${mesStr} de ${fd.getFullYear()}.`,
        9, "normal", "left", 8
      );

      // ── FIRMA ───────────────────────────────────────────────────────────────
      checkPage(40);
      const sigY = y;
      const colW2 = cW / 2 - 5;
      const col2X = mL + cW / 2 + 5;

      doc.setLineWidth(0.3);
      doc.rect(mL, sigY, colW2, 28);
      doc.rect(col2X, sigY, colW2, 28);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(11, 52, 110);
      doc.text(form.nombre_contratante.toUpperCase(), mL + colW2 / 2, sigY + 10, { align: "center" });
      doc.text(`C.C. ${form.cedula_contratante} DE BUCARAMANGA`, mL + colW2 / 2, sigY + 15, { align: "center" });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text("EL CONTRATANTE", mL + colW2 / 2, sigY + 25, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(EMP.rep, col2X + colW2 / 2, sigY + 5, { align: "center" });
      doc.text(`C.C. ${EMP.repCC}`, col2X + colW2 / 2, sigY + 11, { align: "center" });
      doc.text("REPRESENTANTE LEGAL NIT.", col2X + colW2 / 2, sigY + 17, { align: "center" });
      doc.text(EMP.nit.split("-")[0]!.trim(), col2X + colW2 / 2, sigY + 22, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text("EL CONTRATISTA", col2X + colW2 / 2, sigY + 25, { align: "center" });

      y = sigY + 33;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text("Minuta: JVLO    Revisó: AR.    Elaboró: JVLO", mL, y);
      doc.setTextColor(0, 0, 0);

      // ── Download ─────────────────────────────────────────────────────────────
      const slug = form.nombre_contratante.split(" ")[0] ?? "Cliente";
      doc.save(`Contrato-${form.numero_contrato}-${slug}.pdf`);

      // ── Save to DB ───────────────────────────────────────────────────────────
      const { error: dbErr } = await supabase.from("contratos").insert({
        lead_id: leadId,
        presupuesto_id: presupuestoId,
        numero_contrato: form.numero_contrato,
        nombre_contratante: form.nombre_contratante,
        cedula_contratante: form.cedula_contratante,
        fecha_firma: form.fecha_firma,
        duracion_dias: form.duracion_dias,
        pdf_url: null,
      });

      if (dbErr) {
        if (dbErr.code === "23505") setErrorGuardar("El número de contrato ya existe — cámbialo y vuelve a intentar.");
        else setErrorGuardar(dbErr.message);
      } else {
        setGuardado(true);
      }
    } catch (err) {
      console.error("Error generando contrato:", err);
      setErrorGuardar("Error generando el PDF. Revisa la consola.");
    } finally {
      setGenerando(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────────
  const inp = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const lbl = "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <div className="relative my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-[#111D2E] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">📄 Generar Contrato</h2>
            <p className="text-xs text-amber-400">{leadNombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-6">
          {cargando ? (
            <p className="py-8 text-center text-sm text-gray-500">Cargando datos del presupuesto…</p>
          ) : !ppto ? (
            <p className="py-8 text-center text-sm text-red-500">No se pudo cargar el presupuesto.</p>
          ) : guardado ? (
            <div className="py-8 text-center">
              <div className="mb-3 text-4xl">✅</div>
              <p className="font-semibold text-gray-800">Contrato {form.numero_contrato} generado y guardado.</p>
              <p className="mt-1 text-sm text-gray-500">El PDF se descargó automáticamente.</p>
              <button onClick={onClose} className="mt-6 rounded-lg bg-[#111D2E] px-6 py-2 text-sm font-semibold text-white hover:bg-[#1a2d46]">
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {/* Preview */}
              <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm">
                <span className="font-semibold text-amber-700">Total contrato: </span>
                <span className="font-bold text-amber-900">$ {ppto.total_final.toLocaleString("es-CO")}</span>
                <span className="ml-3 text-amber-600">· V{ppto.version_num}</span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>N.º Contrato *</label>
                    <input className={inp} value={form.numero_contrato}
                      onChange={(e) => setForm((f) => ({ ...f, numero_contrato: e.target.value }))} />
                  </div>
                  <div>
                    <label className={lbl}>Fecha de firma *</label>
                    <input type="date" className={inp} value={form.fecha_firma}
                      onChange={(e) => setForm((f) => ({ ...f, fecha_firma: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Nombre completo del contratante *</label>
                  <input className={inp} value={form.nombre_contratante}
                    onChange={(e) => setForm((f) => ({ ...f, nombre_contratante: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Cédula del contratante *</label>
                    <input className={inp} value={form.cedula_contratante}
                      onChange={(e) => setForm((f) => ({ ...f, cedula_contratante: e.target.value }))} />
                  </div>
                  <div>
                    <label className={lbl}>Duración (días hábiles) *</label>
                    <input type="number" min={1} className={inp} value={form.duracion_dias}
                      onChange={(e) => setForm((f) => ({ ...f, duracion_dias: parseInt(e.target.value) || 30 }))} />
                  </div>
                </div>
              </div>

              {errorGuardar && (
                <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{errorGuardar}</p>
              )}

              <div className="mt-6 flex gap-3">
                <button onClick={onClose} className="h-11 flex-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  onClick={() => void generarPDF()}
                  disabled={generando}
                  className="h-11 flex-1 rounded-lg bg-[#B0894F] text-sm font-bold text-white hover:bg-[#9a7642] disabled:opacity-50"
                >
                  {generando ? "⏳ Generando…" : "📄 Generar y Descargar PDF"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
