export interface RegisterDto {
  email: string;
  password: string;
  // Adicione outros campos conforme o seu DTO de registro
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface TwoFactorLoginDto {
  tempToken: string;
  code: string;
}

export interface TwoFactorCodeDto {
  code: string;
}

export interface AuthResponse {
  accessToken?: string;
  tempToken?: string;
  requiresTwoFactor?: boolean;
  message?: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string; // ou o formato que o seu backend retorna (ex: otpauth url)
}

export interface UserProfile {
  userId: string;
  email: string;
}