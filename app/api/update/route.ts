import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: Request) {
  const { row, rowData } = await req.json(); // rowData として配列を受け取る

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const sheetRowNumber = Number(row) + 1; //[cite: 7]

  // 送られてきたデータから数値を抽出して再計算
  const unit = Number(rowData[3] || 0); // 単価
  const qty = Number(rowData[4] || 0);  // 数量
  const discount = Number(rowData[6] || 0); // 割引

  const cost = unit * qty;
  const applied = cost - discount;

  // 更新用データの作成
  const updatedRow = [...rowData];
  updatedRow[5] = cost;     // F列: 費用
  updatedRow[7] = applied;  // H列: 適用金額

  // まとめてスプレッドシートを更新[cite: 7]
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `shered_budget!A${sheetRowNumber}:I${sheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { 
      values: [updatedRow] 
    },
  });

  return NextResponse.json({ ok: true });
}