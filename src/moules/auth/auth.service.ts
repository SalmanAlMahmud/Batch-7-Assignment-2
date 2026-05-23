import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { IUser } from "./auth.interface";
import { pool } from "../../db";
import config from "../../config";



const createUserIntoDB=async(payload:IUser) => {

  const { name,email,password, role,} = payload;
   const hashedPassword = await bcrypt.hash(password, 10);
  const existingUser = await pool.query(
    `
    SELECT * FROM users
    WHERE email = $1
    `,
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("User already exists!");
  }

  const result = await pool.query(
  `
  INSERT INTO users
  (
    name,
    email,
    password,
    role
  )

  VALUES
  (
    $1,
    $2,
    $3,
    COALESCE($4,'contributor')
  )

  RETURNING
    id,
    name,
    email,
    role,
    created_at,
    updated_at
  `,
  [
    name,
    email,
    hashedPassword,
    role ,
  ]
);
  
   delete result.rows[0].passward;
   return result
};


const loginUserIntoDB = async (
  payload: {email: string; password: string}
) => {

  const { email, password } = payload;

  const userData = await pool.query(
    `
    SELECT * FROM users
    WHERE email = $1
    `,
    [email]
  );

  if (userData.rows.length === 0) {
    throw new Error("Invalid credentials!");
  }
  const user = userData.rows[0];


  const matchPassword =
    await bcrypt.compare(
      password,
      user.password
    );


  if (!matchPassword) {
    throw new Error("Invalid credentials!");
  }



  const jwtPayload = {
    id: user.id, 
    name: user.name, 
    email:user.email,
    role: user.role,};



  const token = jwt.sign(jwtPayload, config.jwt_secret as string, { expiresIn: "7d" });
  delete user.password;

  return {token,user};
};


export const authService = {
  createUserIntoDB,
  loginUserIntoDB,
};