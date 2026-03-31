function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Excel opens this as .xls (SpreadsheetML), Cyrillic OK. */
export function downloadProtocolOrdersReportXls(params: {
  sheetName: string;
  fileBase: string;
  headers: string[];
  rows: string[][];
}) {
  const safeSheet = params.sheetName
    .slice(0, 31)
    .replace(/[/\\?*[\]]/g, "")
    .trim() || "Report";
  const headerRow = `<Row>${params.headers.map((header) => `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`).join("")}</Row>`;
  const bodyRows = params.rows
    .map(
      (row) =>
        `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell ?? "")}</Data></Cell>`).join("")}</Row>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">
<Worksheet ss:Name="${escapeXml(safeSheet)}">
<Table>
${headerRow}
${bodyRows}
</Table>
</Worksheet>
</Workbook>`;
  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  triggerDownload(blob, `${params.fileBase}.xls`);
}

type PdfMakeFactory = {
  vfs: Record<string, string>;
  createPdf: (definition: unknown) => { download: (name: string) => void };
};

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object") return false;
  return Object.values(value).every((entry) => typeof entry === "string");
}

function extractPdfVfs(moduleValue: unknown): Record<string, string> | null {
  if (!moduleValue || typeof moduleValue !== "object") return null;

  const moduleRecord = moduleValue as Record<string, unknown>;

  const fromPdfMake = moduleRecord.pdfMake as { vfs?: Record<string, string> } | undefined;
  if (fromPdfMake?.vfs && isStringRecord(fromPdfMake.vfs)) {
    return fromPdfMake.vfs;
  }

  const defaultExport = moduleRecord.default;
  if (!defaultExport || typeof defaultExport !== "object") return null;

  const defaultRecord = defaultExport as Record<string, unknown>;
  const nestedPdfMake = defaultRecord.pdfMake as
    | { vfs?: Record<string, string> }
    | undefined;
  if (nestedPdfMake?.vfs && isStringRecord(nestedPdfMake.vfs)) {
    return nestedPdfMake.vfs;
  }

  if (isStringRecord(defaultRecord)) {
    return defaultRecord;
  }

  return null;
}

export async function downloadProtocolOrdersReportPdf(params: {
  title: string;
  subtitle: string;
  headers: string[];
  rows: string[][];
  fileBase: string;
}): Promise<void> {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const vfsModule = await import("pdfmake/build/vfs_fonts");

  const pdfMake = (pdfMakeModule as { default?: PdfMakeFactory }).default ?? (pdfMakeModule as unknown as PdfMakeFactory);
  const vfs = extractPdfVfs(vfsModule);

  if (!pdfMake?.createPdf || !vfs) {
    throw new Error("pdfmake init failed");
  }

  pdfMake.vfs = vfs;

  const tableBody: unknown[][] = [
    params.headers.map((header) => ({ text: header, style: "tableHeader" })),
    ...params.rows.map((row) =>
      row.map((cell) => ({ text: cell ?? "", style: "tableCell" })),
    ),
  ];

  const docDefinition = {
    pageOrientation: "landscape" as const,
    pageMargins: [12, 14, 12, 14] as [number, number, number, number],
    content: [
      { text: params.title, style: "title" },
      { text: params.subtitle, style: "subtitle", margin: [0, 2, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ["*", 54, 62, 52, 44, 44, 50],
          body: tableBody,
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? "#eef6fc" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#cfe8f5",
          vLineColor: () => "#cfe8f5",
        },
      },
    ],
    styles: {
      title: { fontSize: 14, bold: true },
      subtitle: { fontSize: 9, color: "#555555" },
      tableHeader: { bold: true, fontSize: 8, color: "#334155" },
      tableCell: { fontSize: 7 },
    },
    defaultStyle: {
      font: "Roboto",
    },
  };

  pdfMake.createPdf(docDefinition).download(`${params.fileBase}.pdf`);
}
