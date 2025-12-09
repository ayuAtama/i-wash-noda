export class HttpError extends Error {
  status: number;
  fields?: string[];

  constructor(status: number, message: string, fields?: string[]) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
