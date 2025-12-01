import crypto from "crypto";
import bcrypt from "bcrypt";
import "dotenv/config";

const generate6DigitCode = () => {
  return crypto.randomInt(0, 999999).toString().padStart(6, "0");
};

// const hashToken1 = (token: string) => {
//   return crypto.createHash("sha256").update(token).digest("hex");
// };

// predetermined salt
// const saltRounds: number = Number(process.env.BCRYPT_TOKEN);
// const salt = bcrypt.genSaltSync(saltRounds);
// const hashPassword = (password: string) => {
//   return bcrypt.hashSync(password, salt);
// };

const hashToken = (token: string) => {
  const saltRounds = Number(process.env.BCRYPT_TOKEN);
  return bcrypt.hashSync(token, saltRounds); // bcrypt generates a new salt automatically
};

export { generate6DigitCode, hashToken };
