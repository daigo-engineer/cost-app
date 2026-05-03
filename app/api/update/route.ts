import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: Request) {
  const { row, col, value } = await req.json(); // row は 0-based index

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  // A2 が rows[0] → シート上の行番号は row + 2
  const sheetRowNumber = Number(row) + 2;

  // ① 行全体を読み込む
  const read = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: `shered_budget!A${sheetRowNumber}:I${sheetRowNumber}`,
  });

  const current = read.data.values?.[0] || [];

  // ② 編集されたセルを反映
  current[col] = value;

  // ③ 再計算（単価 × 数量 → 費用、費用 − 割引 → 適用金額）
  const unit = Number(current[3] || 0);
  const qty = Number(current[4] || 0);
  const discount = Number(current[6] || 0);

  const cost = unit * qty;
  const applied = cost - discount;

  current[5] = cost;     // 費用
  current[7] = applied;  // 適用金額

  // ④ 行全体を書き戻す
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `shered_budget!A${sheetRowNumber}:I${sheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [current] },
  });

  return NextResponse.json({ ok: true });
}
