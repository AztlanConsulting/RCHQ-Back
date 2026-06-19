const EMPLOYEE_CONTRACT_TYPE_VALUES = [
  "Nomina",
  "Asimilado a Salario",
  "Honorarios",
  "Voluntariado",
  "Servicio Social",
  "Patronato",
  "Proveedor",
];

const NO_SALARY_CONTRACT_TYPES = [
  "Voluntariado",
  "Servicio Social",
  "Patronato",
  "Proveedor",
];

const CONTRACT_TYPE_BY_NORMALIZED = {
  nomina: "Nomina",
  asalariado: "Asimilado a Salario",
  "asimilado a salario": "Asimilado a Salario",
  asimilado: "Asimilado a Salario",
  honorarios: "Honorarios",
  honorario: "Honorarios",
  voluntariado: "Voluntariado",
  "servicio social": "Servicio Social",
  patronato: "Patronato",
  proveedor: "Proveedor",
};

const normalizeEmployeeContractType = (val) => {
  if (val === null || val === undefined) return val;
  const s = String(val).trim();
  if (s === "") return val;
  const key = s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return CONTRACT_TYPE_BY_NORMALIZED[key] ?? s;
};

const isNoSalaryContract = (type) => NO_SALARY_CONTRACT_TYPES.includes(type);

module.exports = {
  EMPLOYEE_CONTRACT_TYPE_VALUES,
  NO_SALARY_CONTRACT_TYPES,
  normalizeEmployeeContractType,
  isNoSalaryContract,
};
