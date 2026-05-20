import bcrypt from "bcrypt";
import type { IUser } from "./auth.interface";
import { pool } from "../../db/db";
import jwt from "jsonwebtoken";
import config from "../../config";

const createUser = async (payload: IUser) => {
  const { name, email, password, role } = payload;

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name, email, hashedPassword, role || "contributor"],
  );

  return result.rows[0];
};

const loginUser = async (email: string, password: string) => {
  const userResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  const user = userResult.rows[0];

  if (!user) {
    throw new Error("User not found");
  }
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid password");
  }
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt_secret as string,
    { expiresIn: "1d" },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const authService = {
  createUser,
  loginUser,
};
