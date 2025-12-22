export interface AccessTokenPayload {
  userId: string;
  type: "access";
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  type: "refresh";
  jti: string;
  iat?: number;
  exp?: number;
}
