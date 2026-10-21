/** Trả về từ controller khi muốn custom message trong envelope. */
export class ApiResult<T = unknown> {
  constructor(
    public readonly message: string,
    public readonly data: T,
  ) {}
}
