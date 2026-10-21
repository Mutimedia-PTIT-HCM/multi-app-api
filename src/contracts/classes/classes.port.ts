export interface IClassesService {
  updateRole(studentCode: string, role: number): Promise<void>;
  queueClassSync(studentCode: string): Promise<string>;
}
