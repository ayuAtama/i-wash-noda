// apps/api/src/services/authUser.services.ts
import { prisma } from "@/config/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  generate6DigitCode,
  hashToken,
  hashPassword,
  generateSessionId,
  hashSessionId,
  comparePassword,
} from "@/utils/tokenGenerator";
import {
  sendEmailChangeVerification,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendVerifyEmailbyAdmin,
} from "@/utils/mail";
import { signToken } from "@/utils/jwt";
import { HttpError } from "@/utils/httpError";
import {
  addDays,
  addHours,
  differenceInSeconds,
  formatDate,
  formatDistanceStrict,
} from "date-fns";
import { validateMXRecord } from "@/utils/mxRecordValidatior";
import { Role } from "@/generated/prisma/client";
import { UpdateMeDto } from "@/validations/auth.validation";
import { deleteImage } from "@/utils/cloudinary";

export class AuthUserService {
  async register(data: Prisma.UserCreateInput) {
    try {
      // check if the email valid
      if (!data.email || !data.email.includes("@")) {
        throw new HttpError(400, "Invalid email format");
      }

      // // if role included (made by Admin)
      // if (data.role) {
      //   const { result, userId, hashedToken, email, role } =
      //     await prisma.$transaction(async (tx) => {
      //       // 0. handle register error
      //       const existingUserNotCompleted = await tx.user.findUnique({
      //         where: {
      //           email: data.email.toLocaleLowerCase().trim(),
      //           password: null,
      //           is_deleted: false,
      //         },
      //       });

      //       if (existingUserNotCompleted) {
      //         throw new HttpError(
      //           409,
      //           "User already exist but not completed registration"
      //         );
      //       }

      //       // 0.5. check the email's domain (mx record)
      //       const validDomain = await validateMXRecord(
      //         data.email.toLocaleLowerCase().trim()
      //       );
      //       if (!validDomain) {
      //         throw new HttpError(422, "Please retry with real email address");
      //       }

      //       // create user
      //       const user = await tx.user.create({
      //         data,
      //       });

      //       // Generate and store verification token
      //       const token = generate6DigitCode();
      //       const hashedToken = hashToken(token);

      //       const hashedTokenRecord = await tx.verificationToken.create({
      //         data: {
      //           token: hashedToken,
      //           user_id: user.id,
      //           expires_at: addHours(new Date(), 1),
      //         },
      //       });

      //       return {
      //         result: { user },
      //         userId: user.id,
      //         hashedToken: hashedTokenRecord.token,
      //         email: user.email,
      //         role: user.role,
      //       };
      //     });

      //   // email sending
      //   await sendVerifyEmailbyAdmin(email, userId, hashedToken, role);

      //   const finalData = {
      //     ...result,
      //     accessToken: null,
      //   };

      //   // return to controller
      //   return finalData;
      // }

      // handle it using transaction
      const result = await prisma.$transaction(async (tx) => {
        // 0. handle register error
        const existingUserNotCompleted = await tx.user.findUnique({
          where: {
            email: data.email.toLocaleLowerCase().trim(),
            password: null,
            is_deleted: false,
          },
        });

        if (existingUserNotCompleted) {
          throw new HttpError(
            409,
            "User already exist but not completed registration",
          );
        }

        // 0.5. check the email's domain (mx record)
        const validDomain = await validateMXRecord(
          data.email.toLocaleLowerCase().trim(),
        );
        if (!validDomain) {
          throw new HttpError(422, "Please retry with real email address");
        }

        // 1. create user
        // receive role for admin make a user
        const user = await tx.user.create({
          data,
        });

        // 2. Generate and store verification token
        const token = generate6DigitCode();
        const hashedToken = hashToken(token);

        await tx.verificationToken.create({
          data: {
            token: hashedToken,
            expires_at: addHours(new Date(), 1), // 60 Minutes
            user_id: user.id,
          },
        });

        return { user, token, hashedToken };
      });

      // email sending outside transaction (because email sending is slow and prisma transaction will be timeout first)
      await sendVerificationEmail(
        result.user.email,
        result.token,
        result.hashedToken,
      );

      // make a temp access token to continue registration process
      const tokenPayload = {
        sub: result.user.id,
        email: result.user.email,
      };
      // sign the access token using jose (register)
      const accessToken = await signToken(tokenPayload, "365d");

      // finaldata
      const finalData = {
        ...result,
        accessToken,
      };
      // forward the result to the controller
      return finalData;
    } catch (error) {
      // expected user error
      if (error instanceof HttpError) {
        throw error;
      }
      // Otherwise: let Prisma error + others bubble up.
      throw error;
    }
  }

  async verify(token: string, tempJwtEmail: string | null, userId?: string) {
    try {
      // check if token valid
      if (!token || token.length < 6) {
        throw new HttpError(400, "Invalid token");
      }

      //check if it is a hashed token
      const normalizedToken = token.length > 10 ? token : hashToken(token);

      // check if token matched with hashed token in database
      const record = await prisma.verificationToken.findFirst({
        where: {
          token: normalizedToken,
          //user_id: userId,
          ...(userId ? { user_id: userId } : {}), // by admin
          used: false,
          expires_at: { gt: new Date() },
          ...(tempJwtEmail ? { user: { email: tempJwtEmail } } : {}), // by themself
        },
        include: {
          user: true,
        },
      });

      // throw error if not found
      if (!record) {
        throw new HttpError(400, "Invalid token or expired verification token");
      }

      // update token to used and verified the user
      await prisma.$transaction(async (tx) => {
        // make the token used
        await tx.verificationToken.update({
          where: {
            id: record.id,
          },
          data: {
            used: true,
          },
        });
        // make the user email verified
        await tx.user.update({
          where: {
            id: record.user.id,
          },
          data: {
            emailVerified: true,
          },
        });
      });

      // make a temp access token to continue registration process
      const tokenPayload = {
        sub: record.user.id,
        email: record.user.email,
      };
      // sign the access token using jose (verify)
      const accessToken = await signToken(tokenPayload, "365d");

      // return the result into controller
      return {
        success: true,
        message: "Email verified successfully",
        accessToken,
      };
    } catch (error) {
      //debug the error
      console.log("Here's the error: ", userId);
      // expected user error
      if (error instanceof HttpError) {
        throw error;
      }
      // Otherwise: let Prisma error + others bubble up.
      throw error;
    }
  }

  async resendVerificationEmail(email: string) {
    try {
      // normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // find the user
      const user = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (!user)
        throw new HttpError(404, "User not found please register first!");
      if (user.emailVerified && user.password !== null)
        throw new HttpError(409, "Email already verified");

      // generate new token sending and cookie if email verified and token expired

      if (!user.emailVerified && user.password === null) {
        // Find the latest token for this user
        const existingToken = await prisma.verificationToken.findFirst({
          where: {
            user_id: user.id,
            used: false,
            expires_at: { gt: new Date() },
          },
          orderBy: { created_at: "desc" },
        });

        // Rate limiting: allow resend only every 60 seconds
        if (existingToken) {
          const secondsSinceLastToken = differenceInSeconds(
            new Date(),
            existingToken.created_at,
          );

          // Example limit: 60 seconds between sends
          if (secondsSinceLastToken < 60) {
            const wait = 60 - secondsSinceLastToken;
            throw new HttpError(
              429,
              `Please wait ${formatDistanceStrict(0, wait * 1000)} before requesting another verification email.`,
            );
          }

          // Mark old token as used to prevent reuse
          await prisma.verificationToken.update({
            where: { id: existingToken.id },
            data: { used: true },
          });
        }

        // Generate a new token
        const rawToken = generate6DigitCode();
        const hashedToken = hashToken(rawToken);

        // Store new token
        const newToken = await prisma.verificationToken.create({
          data: {
            user_id: user.id,
            token: hashedToken,
            expires_at: addHours(new Date(), 1), // 1 hour
          },
        });

        // resend the email to user (self registered)
        if (user.role === "customer") {
          await sendVerificationEmail(user.email, rawToken, newToken.token);
        }

        // resend the email to user (admin registered)
        if (user.role !== "customer") {
          await sendVerifyEmailbyAdmin(
            user.email,
            user.id,
            newToken.token,
            user.role,
          );
        }

        // make a temp access token to continue registration process
        const tokenPayload = {
          sub: user.id,
          email: user.email,
        };
        // sign the access token using jose(resend)
        const accessToken = await signToken(tokenPayload, "365d");

        // return the result into controller
        return {
          success: true,
          status: "unverified",
          accessToken,
        };
      }

      // if the email verified but not complete the registration
      if (user.emailVerified && user.password === null) {
        // make a temp access token to continue registration process
        const tokenPayload = {
          sub: user.id,
          email: user.email,
        };
        // sign the access token using jose(resend)
        const accessToken = await signToken(tokenPayload, "365d");

        // return the result into controller
        return {
          success: true,
          status: "verified",
          accessToken,
        };
      }

      // return if the user email verified
      return {
        success: true,
        status: "verified and completed registration",
        accessToken: null,
      };
    } catch (error) {
      // expected user error
      if (error instanceof HttpError) {
        throw error;
      }
      // Otherwise: let Prisma error + others bubble up.
      throw error;
    }
  }

  async completeUserDataRegistration(
    temp_jwt: {
      email?: string;
    },
    email: string,
    data: Prisma.UserCreateInput,
    userAgent: string | null,
  ) {
    try {
      // temp_jwt check
      if (temp_jwt.email !== email) {
        throw new HttpError(400, "Invalid token");
      }

      // handle the password hasing
      const rawPassword = String(data.password);
      const hashedPassword = hashPassword(rawPassword);

      // update the user's data using hashed password
      const updatedData = {
        ...data,
        password: hashedPassword,
      };

      // use transaction for safety
      const { updatedUser, sessionId } = await prisma.$transaction(
        async (tx) => {
          // 1. Fetch user first
          const user = await tx.user.findUnique({
            where: { email },
            select: { emailVerified: true },
          });

          if (!user) {
            throw new HttpError(404, "User not found");
          }

          if (!user.emailVerified) {
            throw new HttpError(400, "Email not verified");
          }

          // 2. Update only if verified
          const updatedUser = await tx.user.update({
            where: { email },
            data: updatedData,
          });

          // 3. Generate and store session into database
          const sessionId = generateSessionId();
          const hashedSessionId = hashSessionId(sessionId);
          const uA = userAgent;
          await prisma.session.create({
            data: {
              userId: updatedUser.id,
              token: hashedSessionId,
              expiresAt: addDays(new Date(), 7), // 7 days
              userAgent: uA,
            },
          });

          // return the result
          return { updatedUser, sessionId };
        },
      );

      // make a full jwt access token
      const accessTokenPayload = {
        sub: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      };

      const accessToken = await signToken(accessTokenPayload, "15m");

      // make a refresh token payload fisrt
      const refreshTokenPayload = {
        sub: updatedUser.id,
        sid: sessionId,
      };

      // make a refresh token (signed)
      const refreshToken = await signToken(refreshTokenPayload, "7d");

      // return the result to controller
      return {
        success: true,
        message: "User data updated successfully",
        dataUser: updatedUser,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      // expected user error
      if (error instanceof HttpError) {
        throw error;
      }
      // Otherwise: let Prisma error + others bubble up.
      throw error;
    }
  }

  async logout(sub: string) {
    try {
      // store the userId first
      const userId = sub;

      // prisma session clear
      await prisma.session.deleteMany({
        where: {
          userId: userId,
        },
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  async login(
    email: string,
    password: string,
    userAgent: string | null,
    ip: string,
  ) {
    try {
      // check if there're the user and password first
      const userPassword = password;
      const userEmail = email.toLocaleLowerCase().trim();
      if (!userEmail && !userPassword) {
        throw new HttpError(400, "Invalid email or password");
      }

      // get the user data in database first
      const updateData = await prisma.user.findUnique({
        where: {
          email: userEmail,
        },
      });

      // throw error if the user not found
      if (!updateData) {
        throw new HttpError(404, "User not found");
      }

      // ask the user to continue register first if the password is null or not verified
      if (!updateData.password || !updateData.emailVerified) {
        throw new HttpError(400, "Please complete your registration first");
      }

      // check if the password match with the database
      const isPasswordMatch = comparePassword(
        userPassword,
        updateData.password,
      );

      // throw error if the password not match
      if (!isPasswordMatch) {
        throw new HttpError(400, "Invalid password please try again");
      }

      // if the password match, create the access token and refresh token
      // generate the session id and store it in database using tx
      const { sessionId } = await prisma.$transaction(async (tx) => {
        // generate sessionid and hash it
        const sessionId = generateSessionId();
        const hashedSessionId = hashSessionId(sessionId);
        const uA = userAgent;

        //store it in database
        await tx.session.create({
          data: {
            userId: updateData.id,
            token: hashedSessionId,
            expiresAt: addDays(new Date(), 7), // 7 days
            userAgent: uA,
            ipAddress: ip,
          },
        });

        // return the session id
        return { sessionId };
      });

      // make a jwt access token first
      const accessTokenPayload = {
        sub: updateData.id,
        email: updateData.email,
        role: updateData.role,
      };
      const accessToken = await signToken(accessTokenPayload, "15m");

      // make a refresh token then
      const refreshTokenPayload = {
        sub: updateData.id,
        sid: sessionId,
      };
      const refreshToken = await signToken(refreshTokenPayload, "7d");

      // return the result to controller
      return {
        success: true,
        message: `Login with email ${updateData.email} was successfull`,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }

  async refreshAccessToken(sub: string, sid: string) {
    try {
      // hash the session id
      const hashedSessionId = hashSessionId(sid);

      // get the user data first
      const updateData = await prisma.user.findUnique({
        where: {
          id: sub,
        },
      });

      // throw error if the user not found
      if (!updateData) {
        throw new HttpError(404, "User not found");
      }

      // check if the session id is valid
      const sessionId = await prisma.session.findUnique({
        where: {
          userId: updateData.id,
          token: hashedSessionId,
        },
      });
      if (!sessionId) {
        throw new HttpError(401, "Unauthorized no session id in database");
      }

      // make a new fresh access token
      const accessTokenPayload = {
        sub: updateData.id,
        email: updateData.email,
        role: updateData.role,
      };
      const accessToken = await signToken(accessTokenPayload, "15m");

      // rotate a refresh token after make a new access token
      const { newRefreshToken } = await prisma.$transaction(async (tx) => {
        // generate new session id and hash it
        const newSessionId = generateSessionId();
        const newHashedSessionId = hashSessionId(newSessionId);

        // store it in database
        await tx.session.update({
          where: {
            id: sessionId.id,
            token: hashedSessionId,
          },
          data: {
            userId: updateData.id,
            token: newHashedSessionId,
            expiresAt: addDays(new Date(), 7), // 7 days
          },
        });

        // return the new refresh session id
        return { newRefreshToken: newSessionId };
      });

      // make a new payload for rortated refresh token
      const newRefreshTokenPayload = {
        sub: updateData.id,
        sid: newRefreshToken,
      };
      const refreshToken = await signToken(newRefreshTokenPayload, "7d");

      // return the result to controller
      return {
        success: true,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }

  async resetRequest(email: string) {
    try {
      // get the user data using email
      const updateData = await prisma.user.findUnique({
        where: {
          email: email,
          password: {
            not: null,
          },
          emailVerified: true,
        },
      });

      // throw error if the user not found
      if (!updateData) {
        throw new HttpError(404, "User not found");
      }

      // generate random token and hash it
      const resetToken = generateSessionId();
      const hashedResetToken = hashSessionId(resetToken);

      // store it in database
      const { token } = await prisma.passwordResetToken.create({
        data: {
          user_id: updateData.id,
          token: hashedResetToken,
          expires_at: addHours(new Date(), 1),
          used: false,
        },
      });

      // send the reset email
      await sendPasswordResetEmail(email, token);

      // generate temp jwt for reset password
      const payload = {
        sub: updateData.id,
        email: updateData.email,
      };

      // generate temp jwt
      const tempJwt = await signToken(payload);

      // return the result to controller
      return {
        success: true,
        message: `Password reset link sent to ${email}`,
        updateData,
        tempJwt,
      };
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(
    jwt_email: string,
    email: string,
    verificationToken: string,
    password: string,
  ) {
    try {
      // check if the email valid and match with jwt email
      if (email !== jwt_email) {
        throw new HttpError(401, "Unauthorized, email not match");
      }

      // get the user data using email
      const updateData = await prisma.user.findUnique({
        where: {
          email: email,
          password: {
            not: null,
          },
          emailVerified: true,
        },
      });

      // throw error if the user not found
      if (!updateData) {
        throw new HttpError(404, "User not found");
      }

      // check if the verification token avlid
      const record = await prisma.passwordResetToken.findFirst({
        where: {
          user_id: updateData.id,
          expires_at: { gt: new Date() },
          used: false,
          token: verificationToken,
        },
      });
      if (!record) {
        throw new HttpError(401, "Unauthorized, verification token not found");
      }
      if (record.token !== verificationToken) {
        throw new HttpError(401, "Unauthorized, verification token not match");
      }

      // revoke the token (in transaction)
      await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.update({
          where: {
            id: record.id,
          },
          data: {
            used: true,
          },
        });
      });

      // hash the password
      const hashedPassword = hashPassword(password);

      // update the password (use transaction for safety)
      await prisma.$transaction(async (tx) => {
        // update the user's password
        await tx.user.update({
          where: {
            email: email,
            id: updateData.id,
            emailVerified: true,
          },
          data: {
            password: hashedPassword,
          },
        });
      });

      // return the result to controller
      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  async fetchMe(sub: string) {
    try {
      // get the user data in database
      const updateData = await prisma.user.findUnique({
        where: {
          id: sub,
        },
      });
      if (!updateData) throw new HttpError(404, "User not found");

      // format the data
      const user = {
        name: updateData.name,
        email: updateData.email,
        "pending email": updateData.pending_email,
        "email verified": updateData.emailVerified,
        role: updateData.role,
        image: updateData.image,
        "created at": formatDate(updateData.createdAt, "PP HH:mm"),
        "updated at": formatDate(updateData.updatedAt, "PP HH:mm"),
      };

      //return the result to controller
      return { message: "User fetched successfully", success: true, user };
    } catch (error) {
      throw error;
    }
  }

  async updateMe(sub: string, data: UpdateMeDto) {
    try {
      // format the data
      const userId = sub;
      const { name, password } = data;

      // hash the password
      let hashedPassword = null as string | null;
      if (password) {
        hashedPassword = hashPassword(password);
      }

      // payload the data
      const payload = {
        name,
        ...(hashedPassword ? { password: hashedPassword } : {}),
        //or
        // ...(hashedPassword && { password: hashedPassword }),
      };

      // update the user's data accordingly
      const updateData = await prisma.user.update({
        where: {
          id: userId,
        },
        data: payload,
      });

      // format the data
      const user = {
        name: updateData.name,
        email: updateData.email,
        password: "New password created: ******",
        "created at": formatDate(updateData.createdAt, "PP HH:mm"),
        "updated at": formatDate(updateData.updatedAt, "PP HH:mm"),
      };

      // return the result to controller
      return user;
    } catch (error) {
      throw error;
    }
  }

  async emailRequestChange(sub: string, email: string) {
    try {
      // get the user data first
      const user = await prisma.user.findUnique({
        where: {
          id: sub,
        },
      });
      if (!user) throw new HttpError(404, "User not found");

      // store the new email to database (in transaction)
      const { token, tempJwt } = await prisma.$transaction(async (tx) => {
        // generate random token and hash it
        const newEmailToken = generateSessionId();
        const hashedNewEmailToken = hashSessionId(newEmailToken);

        // update the user's pending email
        const userNewEmail = await tx.user.update({
          where: {
            id: user.id,
            emailVerified: true,
          },
          data: {
            pending_email: email,
          },
        });

        // store the hashed token into database for verification
        const token = await tx.verificationToken.create({
          data: {
            user_id: userNewEmail.id,
            token: hashedNewEmailToken,
            used: false,
            expires_at: addHours(new Date(), 1),
          },
        });

        // set temp_jwt to confirm real user
        const tempJwtPayload = {
          sub: userNewEmail.id,
          email: email,
        };

        // sign the temp_jwt payload
        const tempJwt = await signToken(tempJwtPayload, "1h");

        // return the token
        return { token: token.token, tempJwt: tempJwt };
      });

      // send the email
      await sendEmailChangeVerification(email, token);

      // return the result to controller
      return {
        success: true,
        message: `Email change request to ${email} sent successfully`,
        tempJwt,
      };
    } catch (error) {
      throw error;
    }
  }

  async setNewEmail(
    jwt_email: string,
    newEmail: string,
    oldEmail: string,
    verificationToken: string,
  ) {
    try {
      //log temp
      console.log(jwt_email, newEmail, oldEmail, verificationToken);
      // get the user using email
      const user = await prisma.user.findUnique({
        where: {
          email: oldEmail,
          password: {
            not: null,
          },
          emailVerified: true,
        },
      });
      if (!user) throw new HttpError(404, "User not found");

      // check if the verification token valid
      const tokenRecord = await prisma.verificationToken.findFirst({
        where: {
          user_id: user.id,
          expires_at: { gt: new Date() },
          used: false,
          token: verificationToken,
        },
      });
      if (!tokenRecord)
        throw new HttpError(400, "Invalid token, please retry again later");

      // revoke the token and change the email to pending email
      const { userNewEmail } = await prisma.$transaction(async (tx) => {
        // revoke the token
        await tx.verificationToken.update({
          where: {
            id: tokenRecord.id,
          },
          data: {
            used: true,
          },
        });

        // change the email to pending email and delete the old one
        const userNewEmail = await tx.user.update({
          where: {
            id: user.id,
            emailVerified: true,
          },
          data: {
            email: newEmail,
            pending_email: null,
          },
        });

        return { userNewEmail };
      });

      // format the result
      const result = {
        name: userNewEmail.name,
        email: userNewEmail.email,
        "pending email": userNewEmail.pending_email,
        "email verified": userNewEmail.emailVerified,
        role: userNewEmail.role,
        image: userNewEmail.image,
        "created at": formatDate(userNewEmail.createdAt, "PP HH:mm"),
        "updated at": formatDate(userNewEmail.updatedAt, "PP HH:mm"),
      };

      // return to controller
      return result;
    } catch (error) {
      throw error;
    }
  }

  async updateAvatar(userId: string, imageUrl: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      });

      if (!user) {
        throw new HttpError(404, "User not found");
      }

      if (user.image) {
        await deleteImage(user.image);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { image: imageUrl },
        select: { image: true },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw error;
    }
  }

  async deleteAvatar(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      });

      if (!user) {
        throw new HttpError(404, "User not found");
      }

      if (user.image) {
        await deleteImage(user.image);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { image: null },
        select: { image: true },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw error;
    }
  }
}
