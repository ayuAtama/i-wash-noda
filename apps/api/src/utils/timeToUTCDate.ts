function timeToUtcDate(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);

  // IMPORTANT: use UTC setters
  const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));

  return date;
}

export default timeToUtcDate;
