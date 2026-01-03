import dotenv from "dotenv";
import { createNewUser, getUserByEmail } from "./queries/users";
import bcrypt from "bcrypt";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
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

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    console.log("User already exists, skipping seed.");
    return;
  }

  const hashedPass = await bcrypt.hash(password, saltRounds);
  await createNewUser({ name, email, password: hashedPass });
  console.log("user created successfully!");
}

async function seed() {
  try {
    await seedUser();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
