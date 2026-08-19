export const userSelect = {
  id: true,
  name: true,
  telegramId: true,
  systemRole: true,
  lastActiveRole: true,
  createdAt: true,
  updatedAt: true,
  customerProfile: {
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  workerProfile: {
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};
