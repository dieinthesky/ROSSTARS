import { getJobSprite } from "@/data/jobs";
import { jobLabelFromId } from "@/data/jobIds";

interface JobSpriteProps {
  job?: string;
  jobId?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-14 w-14",
  lg: "h-24 w-24",
};

export default function JobSprite({ job, jobId, size = "md", className = "" }: JobSpriteProps) {
  const label = job ?? (jobId != null ? jobLabelFromId(jobId) : "Rune Knight");
  return (
    <img
      src={getJobSprite(label)}
      alt={label}
      className={`${sizes[size]} object-contain ${className}`}
      loading="lazy"
    />
  );
}
