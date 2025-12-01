import crypto from "crypto";

const generate6DigitCode = () => {
  return crypto.randomInt(0, 999999).toString().padStart(6, "0");
};

const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export { generate6DigitCode, hashToken };
