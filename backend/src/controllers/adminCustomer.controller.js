import * as service from '../services/adminCustomer.service.js';

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

export const stats = asyncHandler(async (_req, res) => {
  const data = await service.getCustomerStats();
  res.json(data);
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, search, filter, sortBy } = req.query;
  const result = await service.listCustomers({
    page: page ? parseInt(page) : 1,
    limit: limit ? Math.min(parseInt(limit), 100) : 20,
    search,
    filter,
    sortBy,
  });
  res.json(result);
});

export const detail = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID không hợp lệ.' });
  const customer = await service.getCustomer(id);
  if (!customer) return res.status(404).json({ message: 'Khách hàng không tồn tại.' });
  res.json({ customer });
});
