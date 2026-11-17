import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseTrialOrderCsv } from "../trial-order-parser.mjs";

const csvUrl = new URL("../trial-orders/T12-AllVersions.csv", import.meta.url);
const csv = await readFile(csvUrl, "utf8");
const validCsv = (() => {
  const rows = csv.trimEnd().split(/\r?\n/);
  const eIndex = rows[0].split(",").findIndex((column) => column.trim().toLowerCase() === "e");
  return rows.map((line, index) => {
    if (index === 0) return line;
    const cells = line.split(",");
    cells[eIndex] = String((index - 1) % 13);
    return cells.join(",");
  }).join("\n");
})();

test("imports all 30 versions with exactly 24 valid T/A/E trials", () => {
  const versions = parseTrialOrderCsv(validCsv);
  assert.equal(versions.length, 30);
  for (const version of versions) {
    assert.equal(version.trials.length, 24, version.code);
    assert.deepEqual(version.trials.map((trial) => trial.day), Array.from({ length: 24 }, (_, index) => index + 1));
    for (const trial of version.trials) {
      assert.ok([0, 1].includes(trial.t));
      assert.ok([0, 1].includes(trial.a));
      assert.ok(Number.isInteger(trial.e) && trial.e >= 0 && trial.e <= 12);
      assert.ok(trial.tLabel && trial.aLabel);
    }
  }
});

test("rejects a version with a missing trial day", () => {
  const lines = validCsv.trimEnd().split(/\r?\n/);
  lines.splice(1, 1);
  assert.throws(() => parseTrialOrderCsv(lines.join("\n")), /v1 必须恰好有 24 行/);
});

test("rejects non-binary cue values and out-of-range E scores", () => {
  const lines = validCsv.trimEnd().split(/\r?\n/);
  lines[1] = lines[1].replace(/^v1,1,[^,]+/, "v1,1,2");
  assert.throws(() => parseTrialOrderCsv(lines.join("\n")), /T\/A/);
  const invalidScore = validCsv.trimEnd().split(/\r?\n/);
  const cells = invalidScore[1].split(",");
  cells[4] = "13";
  invalidScore[1] = cells.join(",");
  assert.throws(() => parseTrialOrderCsv(invalidScore.join("\n")), /E 应为 0 到 12/);
});

test("rejects a CSV without the AllVersions columns", () => {
  assert.throws(() => parseTrialOrderCsv("version,day\nv1,1"), /找不到必需列/);
});

test("the stored trial file stays unchanged but is rejected until its E data is updated", () => {
  assert.throws(() => parseTrialOrderCsv(csv), /E 应为 0 到 12/);
});
