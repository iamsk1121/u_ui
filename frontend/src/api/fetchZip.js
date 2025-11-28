export async function downloadZipStream(testList, excelOptions, signal, onProgress) {
  const res = await fetch("http://localhost:8000/api/pms/download-zip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testList, excelOptions }),
    signal,
  });

  if (!res.ok) throw new Error("ZIP/XLSX download failed");

  const reader = res.body.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    onProgress?.(value.length);
  }

  const blob = new Blob(chunks, { type: res.headers.get("Content-Type") });

  const today = new Date().toISOString().slice(0, 10);

  let filename;
  const opts = excelOptions;

  if (opts.summary && !opts.rawdata && !opts.overkill && !opts.underkill) {
    filename = `SUMMARY_${today}.xlsx`;
  } else {
    filename = `AI_RESULT_${today}.zip`;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
