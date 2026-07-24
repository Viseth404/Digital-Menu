"use client";

type ExcelValue = string | number | boolean | Date | null;

export type ExcelSheet = {
  name: string;
  headers: string[];
  rows: ExcelValue[][];
  currencyColumns?: number[];
  dateColumns?: number[];
};

export async function exportExcelWorkbook(
  filename: string,
  sheets: ExcelSheet[],
) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TeamOne Digital-Menu";
  workbook.created = new Date();

  for (const source of sheets) {
    const sheet = workbook.addWorksheet(source.name, {
      views: [{ state: "frozen", ySplit: 1 }],
      properties: { defaultRowHeight: 20 },
    });
    sheet.addRow(source.headers);
    source.rows.forEach((row) => sheet.addRow(row));
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: {
        row: Math.max(1, source.rows.length + 1),
        column: source.headers.length,
      },
    };

    const header = sheet.getRow(1);
    header.height = 28;
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF18181B" },
    };
    header.alignment = { vertical: "middle" };

    source.headers.forEach((label, index) => {
      const column = sheet.getColumn(index + 1);
      const longest = source.rows.reduce(
        (size, row) => Math.max(size, String(row[index] ?? "").length),
        label.length,
      );
      column.width = Math.min(Math.max(longest + 2, 12), 42);
    });

    source.dateColumns?.forEach((index) => {
      sheet.getColumn(index + 1).numFmt = "yyyy-mm-dd hh:mm";
    });
    source.currencyColumns?.forEach((index) => {
      sheet.getColumn(index + 1).numFmt = "#,##0.00";
    });
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber % 2 === 1) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF4F4F5" },
        };
      }
      row.alignment = { vertical: "top", wrapText: true };
    });
  }

  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
