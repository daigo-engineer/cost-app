import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();

  const item = body.item;
  const unit = Number(body.unit || 0);
  const qty = Number(body.qty || 0);
  const discount = Number(body.discount || 0);
  const note = body.note;

  const cost = unit * qty;
  const applied = cost - discount;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: "shered_budget!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
        values: [[
        body.no,        // A: No
        body.category,  // B: 大項目
        body.item,      // C: 項目
        unit,           // D: 単価
        qty,            // E: 数量
        cost,           // F: 費用
        discount,       // G: ディスカウント
        applied,        // H: 適用金額
        body.note,      // I: 備考
        ]],
    },
  });

  return NextResponse.json({ ok: true });
}


