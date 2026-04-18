import paladinImg from "@/assets/jobs/paladin.png";
import warlockImg from "@/assets/jobs/warlock.png";
import sorcererImg from "@/assets/jobs/sorcerer.png";
import rangerImg from "@/assets/jobs/ranger.png";
import minstrelImg from "@/assets/jobs/minstrel.png";
import wandererImg from "@/assets/jobs/wanderer.png";
import guillotineImg from "@/assets/jobs/guillotine.png";
import shadowChaserImg from "@/assets/jobs/shadow-chaser.png";
import archbishopImg from "@/assets/jobs/archbishop.png";
import runeKnightImg from "@/assets/jobs/rune-knight.png";
import suraImg from "@/assets/jobs/sura.png";
import geneticImg from "@/assets/jobs/genetic.png";
import maestroImg from "@/assets/jobs/maestro.png";

export const JOB_SPRITES: Record<string, string> = {
  Mechanic: geneticImg,
  "Royal Guard": paladinImg,
  "Warlock": warlockImg,
  "Sorcerer": sorcererImg,
  "Ranger": rangerImg,
  "Minstrel": minstrelImg,
  "Wanderer": wandererImg,
  "Guillotine Cross": guillotineImg,
  "Shadow Chaser": shadowChaserImg,
  "Arch Bishop": archbishopImg,
  "Rune Knight": runeKnightImg,
  "Sura": suraImg,
  "Genetic": geneticImg,
  "Maestro": maestroImg,
};

export const JOB_CLASSES = Object.keys(JOB_SPRITES);

export function getJobSprite(job: string): string {
  return JOB_SPRITES[job] || paladinImg;
}
