/** job_id rAthena (3rd) → nome usado em JOB_SPRITES / JobSprite */
const MAP: Record<number, string> = {
  4060: "Rune Knight",
  4061: "Warlock",
  4062: "Ranger",
  4063: "Arch Bishop",
  4064: "Mechanic",
  4065: "Guillotine Cross",
  4073: "Royal Guard",
  4074: "Sorcerer",
  4075: "Minstrel",
  4076: "Wanderer",
  4077: "Sura",
  4078: "Genetic",
  4079: "Shadow Chaser",
};

export function jobLabelFromId(jobId: number): string {
  return MAP[jobId] ?? `Job ${jobId}`;
}
