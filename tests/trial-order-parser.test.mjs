import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseTrialOrderCsv } from "../trial-order-parser.mjs";

const csvUrl = new URL("../trial-orders/T12-AllVersions.csv", import.meta.url);
const csv = await readFile(csvUrl, "utf8");

test("imports all 30 versions with exactly 24 valid T/A/E trials", () => {
  const versions = parseTrialOrderCsv(csv);
  assert.equal(versions.length, 30);
  for (const version of versions) {
    assert.equal(version.trials.length, 24, version.code);
    assert.deepEqual(version.trials.map((trial) => trial.day), Array.from({ length: 24 }, (_, index) => index + 1));
    for (const trial of version.trials) {
      assert.ok([0, 1].includes(trial.t));
      assert.ok([0, 1].includes(trial.a));
      assert.ok(Number.isInteger(trial.e) && trial.e >= -1 && trial.e <= 10);
      assert.ok(trial.tLabel && trial.aLabel);
    }
  }
});

test("rejects a version with a missing trial day", () => {
  const lines = csv.trimEnd().split(/\r?\n/);
  lines.splice(1, 1);
  assert.throws(() => parseTrialOrderCsv(lines.join("\n")), /v1 必须恰好有 24 行/);
});

test("rejects non-binary cue values and out-of-range E scores", () => {
  const lines = csv.trimEnd().split(/\r?\n/);
  lines[1] = lines[1].replace(/^v1,1,[^,]+/, "v1,1,2");
  assert.throws(() => parseTrialOrderCsv(lines.join("\n")), /T\/A 应为 0 或 1/);
  const invalidScore = csv.trimEnd().split(/\r?\n/);
  const cells = invalidScore[1].split(",");
  cells[4] = "11";
  invalidScore[1] = cells.join(",");
  assert.throws(() => parseTrialOrderCsv(invalidScore.join("\n")), /E 应为 -1 到 10/);
});

test("rejects a CSV without the AllVersions columns", () => {
  assert.throws(() => parseTrialOrderCsv("version,day\nv1,1"), /找不到必需列/);
});
