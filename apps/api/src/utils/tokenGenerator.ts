//api/src/utils/tokenGenerator
import crypto from "crypto";
import bcrypt from "bcrypt";
import "dotenv/config";

const generate6DigitCode = () => {
  return crypto.randomInt(0, 999999).toString().padStart(6, "0");
};

const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// predetermined salt (still reset after restart)
// const saltRounds: number = Number(process.env.BCRYPT_TOKEN);
// const salt = bcrypt.genSaltSync(saltRounds);
// const hashToken = (password: string) => {
//   return bcrypt.hashSync(password, salt);
// };

const hashPassword = (token: string) => {
  const saltRounds = Number(process.env.BCRYPT_TOKEN_PASSWORD);
  return bcrypt.hashSync(token, saltRounds); // bcrypt generates a new salt automatically
};

export { generate6DigitCode, hashToken, hashPassword };
