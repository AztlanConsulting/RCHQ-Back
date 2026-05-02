exports.mapProfile = (profile) => {
  return {
    houseName: profile.house.name,
    roleName: profile.role.name,
    name: profile.name,
    surname: profile.surname,
    email: profile.email,
    rfc: profile.rfc,
    curp: profile.curp,
    nss: profile.nss,
    bankAccount: profile.bank_account,
    birthDate: profile.birth_date,
    picture: profile.picture,
  };
};
