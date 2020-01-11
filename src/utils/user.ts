// admin > shopstaff > user
const getTopRole = roles => {
  const topRole = undefined;
  if (roles) {
    for (let i = 0; i < roles.length; i++) {
      const { name } = roles[i];
      if (name === 'admin') {
        return 'admin';
      }
    }

    for (let i = 0; i < roles.length; i++) {
      const { name } = roles[i];
      if (name === 'shopstaff') {
        return 'shopstaff';
      }
    }

    for (let i = 0; i < roles.length; i++) {
      const { name } = roles[i];
      if (name === 'user') {
        return 'user';
      }
    }
  }
  return topRole;
};

export { getTopRole };
