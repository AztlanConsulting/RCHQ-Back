const {
    getShiftDurationMinutes,
    getScheduledWeekdayNumbers,
    resolveScheduledWeekdayNumbers,
    mapShiftToApi,
    shiftsConflict,
    findShiftConflictMessage,
} = require("../../utils/employeeShifts");

const LUNES_ID = "wd-lunes";
const MARTES_ID = "wd-martes";

describe("employeeShifts utils", () => {
    it("calcula duración de turno diurno", () => {
        const minutes = getShiftDurationMinutes({
            start: "09:00",
            end: "18:00",
            startWorkdayName: "Lunes",
            endWorkdayName: "Lunes",
        });

        expect(minutes).toBe(9 * 60);
    });

    it("calcula duración de turno nocturno en días distintos", () => {
        const minutes = getShiftDurationMinutes({
            start: "22:00",
            end: "04:00",
            startWorkdayName: "Lunes",
            endWorkdayName: "Martes",
        });

        expect(minutes).toBe(6 * 60);
    });

    it("incluye ambos weekdays en turnos que cruzan medianoche (Regla A)", () => {
        const weekdays = getScheduledWeekdayNumbers([
            {
                start_workday: { name: "Lunes" },
                end_workday: { name: "Martes" },
                start: "22:00",
                end: "04:00",
            },
        ]);

        expect(weekdays).toEqual([1, 2]);
    });

    it("resuelve weekdays desde formato legacy employee_workday", () => {
        const weekdays = resolveScheduledWeekdayNumbers([
            { workday: { name: "Viernes" } },
        ]);

        expect(weekdays).toEqual([5]);
    });

    it("mapea turno Prisma a API", () => {
        const apiShift = mapShiftToApi({
            shift_id: "shift-1",
            start_workday_id: "wd-1",
            end_workday_id: "wd-2",
            start: new Date("1970-01-01T09:30:00.000Z"),
            end: new Date("1970-01-01T18:15:00.000Z"),
            is_all_day: false,
            start_workday: { name: "Lunes" },
            end_workday: { name: "Martes" },
        });

        expect(apiShift).toEqual({
            shiftId: "shift-1",
            startWorkdayId: "wd-1",
            endWorkdayId: "wd-2",
            startWorkdayName: "Lunes",
            endWorkdayName: "Martes",
            start: "09:30",
            end: "18:15",
            allDay: false,
        });
    });

    it("detecta turnos duplicados exactos", () => {
        const shift = {
            startWorkdayId: LUNES_ID,
            endWorkdayId: LUNES_ID,
            start: "08:00",
            end: "17:00",
            allDay: false,
        };

        expect(shiftsConflict(shift, { ...shift })).toBe(true);
        expect(findShiftConflictMessage([shift, { ...shift }])).toMatch(/repetir el mismo turno/i);
    });

    it("detecta solapamiento parcial en el mismo día", () => {
        const morning = {
            startWorkdayId: LUNES_ID,
            endWorkdayId: LUNES_ID,
            start: "08:00",
            end: "12:00",
            allDay: false,
        };
        const overlapping = {
            startWorkdayId: LUNES_ID,
            endWorkdayId: LUNES_ID,
            start: "10:00",
            end: "14:00",
            allDay: false,
        };

        expect(shiftsConflict(morning, overlapping)).toBe(true);
        expect(findShiftConflictMessage([morning, overlapping])).toMatch(/solapan/i);
    });

    it("permite turnos distintos en días distintos", () => {
        const monday = {
            startWorkdayId: LUNES_ID,
            endWorkdayId: LUNES_ID,
            start: "08:00",
            end: "17:00",
            allDay: false,
        };
        const tuesday = {
            startWorkdayId: MARTES_ID,
            endWorkdayId: MARTES_ID,
            start: "08:00",
            end: "17:00",
            allDay: false,
        };

        expect(shiftsConflict(monday, tuesday)).toBe(false);
        expect(findShiftConflictMessage([monday, tuesday])).toBeNull();
    });
});
