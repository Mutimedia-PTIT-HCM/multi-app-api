/** GET /schedule/weeks — tổng số tuần + tuần hiện tại của học kỳ. */
export interface SemesterWeeks {
  totalWeeks: number;
  currentWeek: number;
  semesterCode: string;
}
