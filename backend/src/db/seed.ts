import dotenv from "dotenv";
import { createNewUser } from "./queries/users";
import bcrypt from "bcrypt";
dotenv.config();
const saltRounds = 10;

async function seedUser() {
  console.log("Seeding user!");
  const name = process.env.UNAME;
  const email = process.env.UEMAIL;
  const password = process.env.UPASS;

  if (!name || !email || !password) {
    throw new Error("Missing required environment variables: UNAME, UEMAIL, UPASS");
  }
  const hashedPass = await bcrypt.hash(password, saltRounds);
  await createNewUser({ name, email, password: hashedPass });
  console.log("user created successfully!");
}

async function seed() {
  await seedUser();
  process.exit(1);
}

seed();
