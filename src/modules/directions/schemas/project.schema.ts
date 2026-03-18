export type ProjectStage =
  | "initialization"
  | "planning"
  | "execution"
  | "closure"
  | "done";

export type Project = {
  id: number;
  name: string;
  lastUpdated: string; // ISO date
  ownerName: string;
  stage: ProjectStage;
  stagePercent: number;
  region: string;
  tasksTotal: number;
  tasksDone: number;
  participants: number;
};
