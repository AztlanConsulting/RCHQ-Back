exports.mapProfile = (e) => {
  return {
    houseName: e.house.name,
    roleName: e.role.name,
    name: e.name,
    surname: e.surname,
    email: e.email,
    rfc: e.rfc,
    curp: e.curp,
    nss: e.nss,
    bankAccount: e.bank_account,
    birthDate: e.birth_date,
    picture: e.picture,
  };
};
