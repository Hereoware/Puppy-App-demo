export function parseTrialOrderCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted && char === '"' && source[i + 1] === '"') { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(value.trim()); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(value.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = []; value = "";
    } else value += char;
  }
  if (quoted) throw new Error("CSV 中存在未闭合的引号。");
  row.push(value.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  if (rows.length < 2) throw new Error("CSV 里没有 trial 数据。");

  const headers = rows[0].map((header) => header.trim().toLowerCase().replace(/\s+/g, ""));
  const column = (...names) => headers.findIndex((header) => names.includes(header));
  const indexes = {
    version: column("version"), day: column("day"), t: column("t"), a: column("a"), e: column("e"),
    tLabel: column("t_label", "tlabel"), aLabel: column("a_label", "alabel")
  };
  if (Object.values(indexes).some((index) => index < 0)) {
    throw new Error("找不到必需列。请导出 AllVersions 工作表，列名须包含 version、day、T、A、E、T_label、A_label。");
  }

  const grouped = new Map();
  for (const cells of rows.slice(1)) {
    const get = (field) => cells[indexes[field]] ?? "";
    const code = get("version");
    if (!code) continue;
    const trial = { day: Number(get("day")), t: Number(get("t")), a: Number(get("a")), e: Number(get("e")), tLabel: get("tLabel"), aLabel: get("aLabel") };
    if (!Number.isInteger(trial.day) || trial.day < 1 || trial.day > 24 || ![0, 1].includes(trial.t) || ![0, 1].includes(trial.a) || !Number.isInteger(trial.e) || trial.e < -1 || trial.e > 10 || !trial.tLabel || !trial.aLabel) {
      throw new Error(`${code} 有无效数据：T/A 应为 0 或 1，E 应为 -1 到 10 的整数，每天需要标签。`);
    }
    if (!grouped.has(code)) grouped.set(code, []);
    grouped.get(code).push(trial);
  }

  const versions = Array.from(grouped, ([code, trials]) => {
    const days = new Set(trials.map((trial) => trial.day));
    if (trials.length !== 24 || days.size !== 24) throw new Error(`${code} 必须恰好有 24 行，并且第 1–24 天各出现一次。`);
    return { code, trials: trials.sort((left, right) => left.day - right.day) };
  });
  if (!versions.length) throw new Error("没有找到任何版本。");
  return versions;
}
