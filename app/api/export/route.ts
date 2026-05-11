import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";

import { createClient } from "@/lib/supabase/server";
import { getAdminDataset, getCurrentUser } from "@/lib/eco/server/data";
import { exportRowsToCsv, studentsToExportRows } from "@/lib/eco/export";
import { exportSchema } from "@/lib/eco/validations";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = exportSchema.parse(params);
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);
    const dataset = await getAdminDataset(supabase, {
      page: 1,
      pageSize: 10_000,
    });

    const rows = studentsToExportRows(dataset.students, filters);

    await supabase.from("audit_logs").insert({
      actor_id: user?.id,
      action: "teacher_exported_data",
      entity_type: "export",
      metadata: {
        detail: `Export ${filters.format.toUpperCase()} dibuat.`,
        filters,
        rows: rows.length,
      },
    });

    if (filters.format === "xlsx") {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Eco Decision");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="eco-decision-export.xlsx"',
        },
      });
    }

    const csv = exportRowsToCsv(rows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": 'attachment; filename="eco-decision-export.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Export belum berhasil. Coba lagi sebentar.",
      },
      { status: 500 },
    );
  }
}
