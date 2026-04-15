const prisma = require("../prisma");

const Logs = {

  async create(logData) {
    const data = {
      log_id: logData.log_id,
      employee_id: logData.employee_id,
      moment: logData.moment,
      action_id: logData.action_id,
      affected: logData.affected,
      ip_address: logData.ip_address
    };

    return await prisma.logs.create({ data });
  }
};

module.exports = Logs;