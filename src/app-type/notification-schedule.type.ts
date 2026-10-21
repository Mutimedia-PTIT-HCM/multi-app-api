/** Payload đính kèm notification loại "lịch học" — app parse để render. */
export interface SchedulePayload {
  learnTimeClock?: string; // 'HH:mm'
  learnTimeDate?: string; // 'dd/mm/yyyy'
  room?: string;
}
