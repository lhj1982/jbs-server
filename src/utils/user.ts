const isShopStaff = roles => {
  const filteredRoles = roles.filter(_ => {
    const { name } = _;
    return name === 'shopstaff';
  });
  return filteredRoles.length > 0;
};

export { isShopStaff };
