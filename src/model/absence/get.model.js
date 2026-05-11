const prisma = require("../../prisma");

exports.getAllAbsences = async (page, limit, where) => {
  const offset = (page - 1) * limit;

  const select = {
    absence_id: true,
    start:      true,
    end:        true,
    url:        true,
    description: true,
    absence_type: { select: { name: true } },
    employee: {
      select: {
        name:    true,
        picture: true,
        house:   { select: { name: true } },
      },
    },
  };

  try {
    const [absences, total] = await prisma.$transaction([
      prisma.absence.findMany({
        where,         
        select,
        skip:    offset,
        take:    limit,
        orderBy: { start: "desc" },
      }),
      prisma.absence.count({ where }),
    ]);

    return {
      data: absences,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error obteniendo las ausencias: ", error);
    return { success: false };
  }
};