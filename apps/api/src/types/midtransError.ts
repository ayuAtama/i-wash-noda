type MidtransError = Error & {
  httpStatusCode?: number;
  ApiResponse?: {
    error_messages?: string[];
  };
};
