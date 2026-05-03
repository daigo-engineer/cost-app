"use client"

import { useEffect, useState } from "react"

const COLORS = ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0"];

export default function Home() {
  const [rows, setRows] = useState<string[][]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{row: number, col: number} | null>(null);
  // セル更新
  async function saveCell(row: number, col: number, value: string) {
    await fetch("/api/update", {
      method: "POST",
      body: JSON.stringify({ row, col, value }),
    });
    location.reload();
  }

  // 行削除
  async function deleteRow(index: number) {
    await fetch("/api/deleteRow", {
      method: "POST",
      body: JSON.stringify({ index }),
    });
    location.reload();
  }

  useEffect(() => {
    fetch("/api/sheet")
      .then(res => res.json())
      .then(data => {
        setRows(data.data)
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="p-4">読み込み中…</p>
  if (rows.length === 0) return <p className="p-4">データがありません</p>

  const [header, ...body] = rows

  // 大項目ごとにグループ化
  const grouped = body.reduce((acc, row) => {
    const category = row[1] || "未分類"; // B列
    if (!acc[category]) acc[category] = [];
    acc[category].push(row);
    return acc;
  }, {} as Record<string, string[][]>);

  // 合計金額
  const total = body.reduce((sum, row) => sum + Number(row[7] || 0), 0)

  // 全体円グラフ用（カテゴリごとの小計）
  const pieData = Object.entries(grouped).map(([category, rowsInCategory]) => {
    const subtotal = rowsInCategory.reduce(
      (sum, row) => sum + Number(row[7] || 0),
      0
    );

    return {
      label: category,   // カテゴリ名
      value: subtotal    // 小計
    };
  })
  .sort((a, b) => b.value - a.value);


  return (
    <div className="p-6 pb-96 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">
        結婚式費用一覧
      </h1>

      {Object.entries(grouped).map(([category, rowsInCategory]) => {
        const subtotal = rowsInCategory.reduce(
          (sum, row) => sum + Number(row[7] || 0),
          0
        );

        const pieDataForCategory = rowsInCategory
          .map(row => ({
            label: row[2],
            value: Number(row[7] || 0)
          }))
          .filter(d => d.value > 0)
          .sort((a, b) => b.value - a.value);

        return (
          <div key={category} className="mb-16">

            {/* 大項目 + 小計 */}
            <h2 className="text-2xl font-bold mb-2">
              {category}（小計：{subtotal.toLocaleString()} 円）
            </h2>

            {/* カテゴリ専用の円グラフ */}
            <div className="flex flex-row items-start space-x-8 mt-4 mb-6">
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold mb-2">{category} の内訳</h3>
                <PieChart data={pieDataForCategory} />
              </div>

              <div className="space-y-2">
                {pieDataForCategory.map((d, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <span
                      className="block w-4 h-4 rounded shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-gray-800">
                      {d.label}：{d.value.toLocaleString()}円
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* カテゴリ内のテーブル */}
            <div className="w-full overflow-x-auto">
              <table className="min-w-max border border-gray-500 border-collapse bg-white/80 backdrop-blur-sm rounded-lg shadow">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 whitespace-nowrap">No.</th>
                    <th className="border p-2 whitespace-nowrap">項目</th>
                    <th className="border p-2 whitespace-nowrap">単価</th>
                    <th className="border p-2 whitespace-nowrap">数量</th>
                    <th className="border p-2 whitespace-nowrap">費用</th>
                    <th className="border p-2 whitespace-nowrap">ディスカウント</th>
                    <th className="border p-2 whitespace-nowrap">適用金額</th>
                    <th className="border p-2 whitespace-nowrap">備考</th>
                    <th className="border p-2 whitespace-nowrap">操作</th>
                  </tr>
                </thead>

                <tbody>
                  {rowsInCategory.map((row, i) => (
                    <tr key={row[0]}>
                      <td className="border p-2 whitespace-nowrap">{row[0]}</td>
                      <td className="border p-2 whitespace-nowrap">{row[2]}</td>
                      <td className="border p-2 whitespace-nowrap">{row[3]}</td>
                      <td className="border p-2 whitespace-nowrap">{row[4]}</td>
                      <td className="border p-2 whitespace-nowrap">{row[5]}</td>
                      <td className="border p-2 whitespace-nowrap">{row[6]}</td>
                      <td className="border p-2 whitespace-nowrap">{row[7]}</td>
                      <td className="border p-2 whitespace-nowrap">{row[8]}</td>

                      <td className="border p-2 whitespace-nowrap text-center">
                        <button
                          className="text-red-500"
                          onClick={() => deleteRow(i)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


          </div>
        );
      })}


      {/* 合計金額 */}
      <h2 className="text-2xl font-bold mt-8 mb-4">
        中計費用（中計：{total.toLocaleString()} 円）
      </h2>

      <h2 className="text-2xl font-bold mt-8 mb-4">
        合計費用（合計（Tax in）：{Math.floor(total * 1.1).toLocaleString()} 円）
      </h2>

      {/* 円グラフ＋凡例（横並び） */}
      <div className="mt-6 flex flex-row items-start space-x-8 w-full">
        {/* 円グラフ */}
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2">費用の割合</h2>
          <PieChart data={pieData} />
        </div>

        {/* 凡例（グラフの右側） */}
        <div className="space-y-2">
          {pieData.map((d, i) => (
            <div key={i} className="flex items-center space-x-2">
              <span
                className="block w-4 h-4 rounded shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-gray-800">
                {d.label}：{d.value.toLocaleString()}円
              </span>
            </div>
          ))}
        </div>
      </div>



      {/* 追加フォーム */}
      <form
        className="mb-[200px]"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const nextNo = body.length + 1;

          const data = {
            no: nextNo,
            category: (form.category as HTMLSelectElement).value,
            item: (form.item as HTMLInputElement).value,
            unit: (form.unit as HTMLInputElement).value,
            qty: (form.qty as HTMLInputElement).value,
            discount: (form.discount as HTMLInputElement).value,
            note: (form.note as HTMLInputElement).value,
          };

          await fetch("/api/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          location.reload();
        }}
      >
        <h2 className="font-bold mb-2">項目を追加</h2>

        <select name="category" className="border p-2 mr-2">
          <option value="料理＆ドリンク">料理＆ドリンク</option>
          <option value="ウェディングセレモニー">ウェディングセレモニー</option>
          <option value="エンターテイメント">エンターテイメント</option>
          <option value="【Beauty①】フラワーエンゲージメント">【Beauty①】フラワーエンゲージメント</option>
          <option value="【Beauty②】メイク＆ドレッシング">【Beauty②】メイク＆ドレッシング</option>
          <option value="【Beauty③】ドレス">【Beauty③】ドレス</option>
          <option value="写真＆動画">写真＆動画</option>
          <option value="【Guest①】ギフト">【Guest①】ギフト</option>
          <option value="【Guest②】ペーパーアイテム">【Guest②】ペーパーアイテム</option>
          <option value="その他">その他</option>
        </select>
        <input name="item" placeholder="項目" className="border p-2 mr-2" />
        <input name="unit" placeholder="単価" className="border p-2 mr-2" />
        <input name="qty" placeholder="数量" className="border p-2 mr-2" />
        <input name="discount" placeholder="ディスカウント" className="border p-2 mr-2" />
        <input name="note" placeholder="備考" className="border p-2 mr-2" />


        <button className="bg-pink-500 text-white px-4 py-2 rounded">
          追加
        </button>
      </form>
      <div className="h-[300px]"></div> 
    </div>
  )
}

function PieChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  let cumulative = 0

  return (
    <svg width="220" height="220" viewBox="0 0 42 42">
      {data.map((d, i) => {
        const start = (cumulative / total) * 100
        cumulative += d.value
        const end = (cumulative / total) * 100

        return (
          <circle
            key={i}
            r="15.915"
            cx="21"
            cy="21"
            fill="transparent"
            strokeWidth="10"
            strokeDasharray={`${end - start} ${100 - (end - start)}`}
            strokeDashoffset={-start}
            stroke={COLORS[i % COLORS.length]}
          />
        )
      })}
    </svg>
  )
}

