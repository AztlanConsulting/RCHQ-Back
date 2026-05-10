exports.mapAbsence = (absence) => {
    if (!absence) return undefined;

    return {
        absenceId:   absence.absence_id,
        start:       absence.start,
        end:         absence.end,
        url:         absence.url,
        description: absence.description,
        absenceType: absence.absence_type?.name ?? null,
        employee: {
            name:    absence.employee?.name    ?? null,
            picture: absence.employee?.picture ?? null,
            house:   absence.employee?.house?.name ?? null,
        },
    };
};