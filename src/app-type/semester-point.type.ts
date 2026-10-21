import { SubjectPoint } from "./subject-point.type";

export interface SemesterPoint {
  year: number;
  semester: number;
  gpa: number;
  subjects: SubjectPoint[];
}
