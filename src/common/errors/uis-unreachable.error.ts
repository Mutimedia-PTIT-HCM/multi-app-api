/** UIS không liên lạc được (timeout, non-JSON) — khác với credential bị revoke: được retry, không xoá token. */
export class UisUnreachableError extends Error {
  constructor(message = "UIS unreachable") {
    super(message);
    this.name = "UisUnreachableError";
  }
}
