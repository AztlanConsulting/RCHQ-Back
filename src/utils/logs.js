const {PrismaClient} = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

exports.logFunction = async (employeeId, moment, description, ip) => {
  await prisma.logs.create({
    data: {
      logid: uuidv4(),
      employeeid: employeeId,
      moment: moment,
      description: description,
      ip_address: ip,
    },
  });
};