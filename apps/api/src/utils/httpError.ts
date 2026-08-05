export class HttpError extends Error {
  status: number;
  fields?: string[];
  code?: string;

  constructor(
    status: number,
    message: string,
    fields?: string[],
    code?: string,
  ) {
    super(message);
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}
