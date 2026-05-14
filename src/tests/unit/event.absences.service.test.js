jest.mock("../../model/vacation/get.model", () => ({
    getVacationsInRange: jest.fn(),
}));

jest.mock("../../model/employee/get.model", () => ({
    getHome: jest.fn(),
    findById: jest.fn(),
    getWorkDays: jest.fn(),
}));

jest.mock("../../model/event/get.model", () => ({
    getAllEventTypes: jest.fn(),
    getHouseEventsInRange: jest.fn(),
    getPersonalEventsInRange: jest.fn(),
    getGlobalEventsInRange: jest.fn(),
}));

jest.mock("../../model/absence/get.model", () => ({
    getAbsencesInRange: jest.fn(),
}));

const { getVacationsInRange } = require("../../model/vacation/get.model");
const { getAbsencesInRange } = require("../../model/absence/get.model");
const {
    getHome,
    findById,
    getWorkDays,
} = require("../../model/employee/get.model");
const {
    getHouseEventsInRange,
    getPersonalEventsInRange,
    getGlobalEventsInRange,
} = require("../../model/event/get.model");
const { getEventsInRange } = require("../../service/event/get.service");
const RESPONSES = require("../../utils/responses");

const EMPLOYEE_ID = "employee-id";
const HOUSE_ID = "house-id";

const makeUTCDate = (year, month, day) => {
    return new Date(Date.UTC(year, month - 1, day));
};

const makeUTCTime = (hour, minute = 0) => {
    return new Date(Date.UTC(1970, 0, 1, hour, minute));
};

const makeAbsence = ({
    absenceId = "absence-id",
    start = makeUTCDate(2026, 5, 1),
    end = makeUTCDate(2026, 5, 5),
} = {}) => {
    return {
        absence_id: absenceId,
        employee_id: EMPLOYEE_ID,
        start,
        end,
        description: "Consulta",
        url: "https://example.com/absence.pdf",
        is_deleted: false,
        absence_type: { name: "Medica" },
        employee: {
            employee_id: EMPLOYEE_ID,
            name: "Ana",
            surname: "Ruiz",
            curp: "CURPTEST123456",
        },
    };
};

const makeGlobalEvent = ({
    date,
    name = "Evento global",
    isFreeDay = true,
} = {}) => {
    return {
        date,
        start: makeUTCTime(9),
        end: makeUTCTime(18),
        name,
        description: "",
        is_free_day: isFreeDay,
        event_type: { name: "Festivo" },
    };
};

const makeHouseEvent = ({ date, name = "Evento de casa" } = {}) => {
    return {
        date,
        start: makeUTCTime(9),
        end: makeUTCTime(18),
        name,
        description: "",
        event_type: { name: "General" },
    };
};

const getAbsenceEvent = (result, absenceId = "absence-id") => {
    return result.data.events.find((event) => event.absenceId === absenceId);
};

describe("event.get.service", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        findById.mockResolvedValue({ employee_id: EMPLOYEE_ID });
        getHome.mockResolvedValue({ house_id: HOUSE_ID });
        getHouseEventsInRange.mockResolvedValue([]);
        getPersonalEventsInRange.mockResolvedValue([]);
        getGlobalEventsInRange.mockResolvedValue([]);
        getVacationsInRange.mockResolvedValue([]);
        getAbsencesInRange.mockResolvedValue([]);
        getWorkDays.mockResolvedValue([
            { workday: { name: "Lunes" } },
            { workday: { name: "Martes" } },
            { workday: { name: "Viernes" } },
        ]);
    });

    it("agrega ausencias al calendario con dias habiles calculados", async () => {
        const startDate = makeUTCDate(2026, 5, 1);
        const endDate = makeUTCDate(2026, 5, 8);

        getGlobalEventsInRange.mockResolvedValue([
            makeGlobalEvent({
                date: makeUTCDate(2026, 5, 4),
                name: "Descanso global",
            }),
            makeGlobalEvent({
                date: makeUTCDate(2026, 5, 7),
                name: "Fuera de ausencia",
            }),
        ]);

        getAbsencesInRange.mockResolvedValue([makeAbsence()]);

        const result = await getEventsInRange(
            EMPLOYEE_ID,
            "2026-05-01",
            "2026-05-08",
        );

        const absenceEvent = getAbsenceEvent(result);

        expect(result.code).toBe(RESPONSES.EVENTS.FOUND);
        expect(getAbsencesInRange).toHaveBeenCalledWith(
            EMPLOYEE_ID,
            startDate,
            endDate,
        );
        expect(getWorkDays).toHaveBeenCalledWith(EMPLOYEE_ID);
        expect(absenceEvent).toMatchObject({
            absenceId: "absence-id",
            employeeId: EMPLOYEE_ID,
            name: "Ana Ruiz",
            type: "Medica",
            subtitle: "CURPTEST123456",
            description: "Consulta",
            link: "https://example.com/absence.pdf",
            usedDays: 2,
            focus: "ausencias",
            scope: "personal",
            lastsAllDay: true,
        });
        expect(absenceEvent.start).toEqual(makeUTCDate(2026, 5, 1));
        expect(absenceEvent.startDate).toEqual(makeUTCDate(2026, 5, 1));
        expect(absenceEvent.endDate).toEqual(makeUTCDate(2026, 5, 5));
        expect(absenceEvent.end).toEqual(makeUTCDate(2026, 5, 6));
    });

    it("descuenta eventos de casa como dias no laborables de la ausencia", async () => {
        getHouseEventsInRange.mockResolvedValue([
            makeHouseEvent({
                date: makeUTCDate(2026, 5, 5),
                name: "Actividad de casa",
            }),
        ]);

        getGlobalEventsInRange.mockResolvedValue([
            makeGlobalEvent({
                date: makeUTCDate(2026, 5, 4),
                name: "Descanso global",
            }),
        ]);

        getAbsencesInRange.mockResolvedValue([makeAbsence()]);

        const result = await getEventsInRange(
            EMPLOYEE_ID,
            "2026-05-01",
            "2026-05-08",
        );

        expect(getAbsenceEvent(result)).toMatchObject({
            usedDays: 1,
        });
    });

    it("no descuenta dos veces si hay evento global y de casa el mismo dia", async () => {
        getHouseEventsInRange.mockResolvedValue([
            makeHouseEvent({
                date: makeUTCDate(2026, 5, 4),
            }),
        ]);

        getGlobalEventsInRange.mockResolvedValue([
            makeGlobalEvent({
                date: makeUTCDate(2026, 5, 4),
            }),
        ]);

        getAbsencesInRange.mockResolvedValue([makeAbsence()]);

        const result = await getEventsInRange(
            EMPLOYEE_ID,
            "2026-05-01",
            "2026-05-08",
        );

        expect(getAbsenceEvent(result)).toMatchObject({
            usedDays: 2,
        });
    });

    it("no descuenta globales no libres ni eventos personales", async () => {
        getGlobalEventsInRange.mockResolvedValue([
            makeGlobalEvent({
                date: makeUTCDate(2026, 5, 4),
                isFreeDay: false,
            }),
        ]);

        getPersonalEventsInRange.mockResolvedValue([
            {
                personal_event: {
                    start: new Date("2026-05-05T15:00:00.000Z"),
                    end: new Date("2026-05-05T16:00:00.000Z"),
                    name: "Evento personal",
                    event_type: { name: "General" },
                },
            },
        ]);

        getAbsencesInRange.mockResolvedValue([makeAbsence()]);

        const result = await getEventsInRange(
            EMPLOYEE_ID,
            "2026-05-01",
            "2026-05-08",
        );

        expect(getAbsenceEvent(result)).toMatchObject({
            usedDays: 3,
        });
    });

    it("calcula cero dias habiles si la ausencia cae solo en dias no laborales", async () => {
        getAbsencesInRange.mockResolvedValue([
            makeAbsence({
                start: makeUTCDate(2026, 5, 2),
                end: makeUTCDate(2026, 5, 3),
            }),
        ]);

        const result = await getEventsInRange(
            EMPLOYEE_ID,
            "2026-05-01",
            "2026-05-08",
        );

        expect(getAbsenceEvent(result)).toMatchObject({
            usedDays: 0,
        });
    });

    it("retorna EMPLOYEE.NOT_FOUND si el empleado no existe", async () => {
        findById.mockResolvedValueOnce(null);

        const result = await getEventsInRange(
            EMPLOYEE_ID,
            "2026-05-01",
            "2026-05-08",
        );

        expect(result).toEqual({
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        });
        expect(getAbsencesInRange).not.toHaveBeenCalled();
    });
});
