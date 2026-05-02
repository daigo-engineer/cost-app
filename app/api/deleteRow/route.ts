import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: Request) {
  const { index } = await req.json();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const sheetId = 329503197; // ← あなたの gid を入れる

  // ① 行削除
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: index + 1, // ヘッダーを除く
              endIndex: index + 2,
            },
          },
        },
      ],
    },
  });

  // ② シート全体を読み込む
  const read = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "shered_budget!A2:D",
  });

  const rows = read.data.values || [];

  // ③ A列（No）を再採番
  const newNos = rows.map((_, i) => [i + 1]);

  // ④ A列だけ書き換え
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: "shered_budget!A2:A",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: newNos,
    },
  });

  return NextResponse.json({ ok: true });
}
