import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { no } = await req.json(); // ← No. を受け取る

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const sheetId = 329503197;

  // No. は 1 から始まるので、シートの行番号は No+1
  const rowNumber = Number(no) + 1;

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
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });

  // ② シート全体を読み込む
  const read = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "shered_budget!A2:I",
  });

  const rows = read.data.values || [];

  // ③ 全体を 1 から再採番
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
