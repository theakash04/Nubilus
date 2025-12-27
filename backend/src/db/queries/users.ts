import sql from "..";
import { SignUpUser, User } from "../../types/database";

export async function createNewUser(u: SignUpUser) {
  const [user] = await sql<User[]>`
  INSERT INTO users (name, email, password_hash) VALUES (${u.name},${u.email}, ${u.password})
  RETURNING *
  `;
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await sql<User[]>`
    SELECT * FROM users WHERE email = ${email}
   `;
  return user;
}

export async function getUserById(id: string) {
  const [user] = await sql<
    {
      id: string;
      name: string;
      email: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      last_login: string | null;
    }[]
  >`
  SELECT
    u.id,
    u.name,
    u.email,
    u.is_active,
    u.created_at,
    u.updated_at,
    u.last_login
  FROM users u
  WHERE u.id = ${id}::uuid;
`;

  return user;
}

// refresh token functions
interface SaveRefreshTokenArgs {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}
export async function saveRefreshToken(args: SaveRefreshTokenArgs) {
  const { id, userId, tokenHash, expiresAt, ipAddress, userAgent } = args;

  await sql`
    INSERT INTO user_refresh_tokens (
      id,
      user_id,
      token_hash,
      expires_at,
      user_agent,
      ip_address
    )
    VALUES (
      ${id}::uuid,
      ${userId}::uuid,
      ${tokenHash},
      ${expiresAt},
      ${userAgent ?? null},
      ${ipAddress ?? null}
    )
  `;

  const currentDate = new Date();

  await sql`
 UPDATE users
  SET 
    last_login = ${currentDate},
    updated_at = NOW()
  WHERE id = ${userId}::uuid
  `;
}

export async function findAllRefreshTokenByUserId(userId: string) {
  return sql`
    SELECT *
    FROM user_refresh_tokens
    WHERE user_id = ${userId}
      AND revoked = FALSE
  `;
}

export async function findRefreshTokenById(id: string) {
  const [token] = await sql`
    SELECT *
    FROM user_refresh_tokens
    WHERE id = ${id}::uuid
    LIMIT 1
  `;
  return token ?? null;
}

export async function revokeRefreshToken(id: string) {
  await sql`
    UPDATE user_refresh_tokens
    SET revoked = TRUE
    WHERE id = ${id}::uuid
  `;
}
