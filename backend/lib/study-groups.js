export const STUDY_GROUPS = Object.freeze(["HIT_T", "HIT_A", "LIT"]);

export function chooseBalancedStudyGroup(activeGroups, counts, randomIndex = (length) => Math.floor(Math.random() * length)) {
  const availableGroups = STUDY_GROUPS.filter((group) => activeGroups.has(group));
  if (!availableGroups.length) return null;

  const minimumCount = Math.min(...availableGroups.map((group) => counts.get(group) || 0));
  const leastAssignedGroups = availableGroups.filter((group) => (counts.get(group) || 0) === minimumCount);
  return leastAssignedGroups[randomIndex(leastAssignedGroups.length)];
}
