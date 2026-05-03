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
  const category = body.category;

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
  const sheetId = 329503197;

  // ① シート全体を読み込む
  const read = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "shered_budget!A2:I",
    });

  const rows = read.data.values || [];

  // ② 追加したいカテゴリの最後の行を探す

    // 正規化関数
    const normalize = (s) => s.replace(/\s+/g, "").normalize("NFKC");
    const target = normalize(body.category);

    let lastRowIndexOnSheet = -1;

    // 生の rows をループして、最後にそのカテゴリが出現する「行インデックス」を見つける
    for (let i = 0; i < rows.length; i++) {
    const cat = normalize(rows[i][1] || ""); // B列（カテゴリ）
    if (cat === target) {
        lastRowIndexOnSheet = i; // 0-indexed の行番号を保持
    }
    }

    // もしそのカテゴリがまだ1つもなければ、一番最後に追加
    let insertRowNumber;
    if (lastRowIndexOnSheet === -1) {
    insertRowNumber = rows.length + 2; // ヘッダー分などを考慮
    } else {
    // 最後に見つかった行の「次」の行番号（1-indexed）
    // rows[0] がスプレッドシートの2行目(A2)から始まっている場合、
    // シート上の行番号は i + 2 となるため、その次は i + 3
    insertRowNumber = lastRowIndexOnSheet + 3; 
    }

    const insertIndex = insertRowNumber;


  // ③ 行を挿入
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.SHEET_ID,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: insertIndex - 1,
              endIndex: insertIndex,
            },
            inheritFromBefore: false,
          },
        },
      ],
    },
  });

  // ④ 挿入した行にデータを書き込む
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `shered_budget!A${insertIndex}:I${insertIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        "",           // No は後で再採番
        category,
        item,
        unit,
        qty,
        cost,
        discount,
        applied,
        note,
      ]],
    },
  });

  // ⑤ 全体の No を再採番
  const read2 = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "shered_budget!A2:I",
  });

  const rows2 = read2.data.values || [];
  const newNos = rows2.map((_, i) => [i + 1]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: "shered_budget!A2:A",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: newNos },
  });

  return NextResponse.json({ ok: true });
}
