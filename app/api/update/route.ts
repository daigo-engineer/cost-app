import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: Request) {
  const { row, col, value } = await req.json();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  // 編集する列だけを更新
  const colLetter = String.fromCharCode(65 + col);
  const range = `shered_budget!${colLetter}${row + 2}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[value]],
    },
  });

  return NextResponse.json({ ok: true });
}
