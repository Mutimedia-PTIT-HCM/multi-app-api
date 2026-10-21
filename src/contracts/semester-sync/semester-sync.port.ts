/** Port đồng bộ học kỳ (cron). */
export interface ISemesterSyncService {
  checkSemester(): Promise<void>;
}
