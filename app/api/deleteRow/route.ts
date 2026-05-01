import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: Request) {
  const { index } = await req.json();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: "ROWS",
              startIndex: index + 1, // 1 行目はヘッダーなので +1
              endIndex: index + 2,
            },
          },
        },
      ],
    },
  });

  return NextResponse.json({ ok: true });
}
