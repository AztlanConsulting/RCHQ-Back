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
        where,         // ← usa el where recibido
        select,
        skip:    offset,
        take:    limit,
        orderBy: { start: "desc" },
      }),
      prisma.absence.count({ where }),  // ← mismo where para el total
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