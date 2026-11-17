import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { chooseBalancedStudyGroup, STUDY_GROUPS } from "../backend/lib/study-groups.js";

const migration = await readFile(new URL("../backend/prisma/migrations/20261116170000_replace_study_groups/migration.sql", import.meta.url), "utf8");

test("study groups use the three named research arms", () => {
  assert.deepEqual(STUDY_GROUPS, ["HIT_T", "HIT_A", "LIT"]);
});

test("database migration maps both legacy groups and adds HIT-A", () => {
  assert.match(migration, /RENAME VALUE 'TREATMENT' TO 'HIT_T'/);
  assert.match(migration, /ADD VALUE 'HIT_A'/);
  assert.match(migration, /RENAME VALUE 'CONTROL' TO 'LIT'/);
});

test("balanced assignment randomizes among tied active groups and catches up the least assigned arm", () => {
  const allGroups = new Set(STUDY_GROUPS);
  assert.equal(chooseBalancedStudyGroup(allGroups, new Map(), () => 1), "HIT_A");
  assert.equal(chooseBalancedStudyGroup(allGroups, new Map([
    ["HIT_T", 5], ["HIT_A", 4], ["LIT", 5]
  ])), "HIT_A");
});

test("balanced assignment excludes groups without an active trial order", () => {
  const activeGroups = new Set(["HIT_A", "LIT"]);
  assert.equal(chooseBalancedStudyGroup(activeGroups, new Map([["HIT_A", 2], ["LIT", 3]])), "HIT_A");
  assert.equal(chooseBalancedStudyGroup(new Set(), new Map()), null);
});
