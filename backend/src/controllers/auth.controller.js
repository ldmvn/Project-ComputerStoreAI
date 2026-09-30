import { validateLoginInput, validateRegisterInput } from '../validators/auth.validator.js';
import { getCurrentUser, loginUser, registerUser } from '../services/auth.service.js';

export async function register(req, res, next) {
  const { errors, values } = validateRegisterInput(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, message: 'Dữ liệu đăng ký không hợp lệ.', errors });
  }

  try {
    const user = await registerUser(values);
    return res.status(201).json({ success: true, message: 'Đăng ký tài khoản thành công.', user });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  const { errors, values } = validateLoginInput(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin đăng nhập.', errors });
  }

  try {
    const { token, user } = await loginUser(values);
    return res.status(200).json({ success: true, message: 'Đăng nhập thành công.', token, user });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.userId);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return next(error);
  }
}
