const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type RegisterPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

type RegisterResponse = {
  success: boolean;
  message: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    role: string;
  };
};

export type AuthUser = RegisterResponse['user'] & { isActive?: boolean };

type LoginResponse = {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
};

export class AuthRequestError extends Error {
  field?: string;
  errors?: Record<string, string>;

  constructor(message: string, field?: string, errors?: Record<string, string>) {
    super(message);
    this.name = 'AuthRequestError';
    this.field = field;
    this.errors = errors;
  }
}

export async function registerAccount(payload: RegisterPayload): Promise<RegisterResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AuthRequestError('Không thể kết nối máy chủ. Vui lòng thử lại sau.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AuthRequestError(data.message || 'Đăng ký không thành công.', data.field, data.errors);
  }

  return data as RegisterResponse;
}

export async function loginAccount(identifier: string, password: string): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
  } catch {
    throw new AuthRequestError('Không thể kết nối máy chủ. Vui lòng thử lại sau.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new AuthRequestError(data.message || 'Không thể đăng nhập lúc này.', data.field, data.errors);
  return data as LoginResponse;
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new AuthRequestError(data.message || 'Phiên đăng nhập không hợp lệ.');
  return data.user as AuthUser;
}
