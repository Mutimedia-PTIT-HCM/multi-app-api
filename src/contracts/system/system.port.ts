export interface ISystemService {
  getCurrentSemester(): Promise<string>;
  setCurrentSemester(semesterCode: string): Promise<void>;
  nextSemester(semesterCode: string): string;
}
