export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthActionResponse {
  status: 'ok';
  message: string;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
}
