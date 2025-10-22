class InternalServerError extends Error {
  public statusCode: number;

  constructor(message = 'Internal server error') {
    super(message);
    this.statusCode = 500;
  }
}

export default InternalServerError;
