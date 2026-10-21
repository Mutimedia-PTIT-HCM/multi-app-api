export interface SubjectPoint {
  subjectCode: string;
  subjectName: string;
  credits: number;
  attendance: number | null; // CC (K3)
  midterm: number | null; // KT (K1)
  exercise: number | null; // Se (B1)
  practice: number | null; // TH (K2)
  exam: number | null; // Thi
  final: number | null; // TK
}
