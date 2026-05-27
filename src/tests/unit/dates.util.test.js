const { workday } = require("../../prisma");
const datesUtil = require("../../utils/dates");

const START_DATE = new Date("2026-05-01");
const END_DATE = new Date("2026-05-05");
const WORK_DAYS = [
    { workday: { name: "Lunes" } },
    { workday: { name: "Martes" } },
    { workday: { name: "Miércoles" } },
    { workday: { name: "Jueves" } },
    { workday: { name: "Viernes" } },
];
const EVENTS = [
    {
        start: new Date("2026-05-04T00:00:00Z"),
        end: new Date("2026-05-04T23:59:00Z"),
        isFreeDay: true,
    },
];

describe("dates.util", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("Flujo exitoso", () => {
        it("Verifica que funcione sin eventos", async () => {
            const result = datesUtil.calculateUsedDays(
                WORK_DAYS,
                START_DATE,
                END_DATE,
                [],
            );

            expect(result).toBe(3);
        });

        it("Verifica que funcione con eventos", async () => {
            const result = datesUtil.calculateUsedDays(
                WORK_DAYS,
                START_DATE,
                END_DATE,
                EVENTS,
            );

            expect(result).toBe(2);
        });

        it("Verifica que funcione con eventos repetidos", async () => {
            const result = datesUtil.calculateUsedDays(
                WORK_DAYS,
                START_DATE,
                END_DATE,
                [ ...EVENTS, ...EVENTS, ...EVENTS ],
            );

            expect(result).toBe(2);
        });

        it("no descuenta el día siguiente cuando un feriado allDay termina a medianoche", async () => {
            const result = datesUtil.calculateUsedDays(
                WORK_DAYS,
                START_DATE,
                END_DATE,
                [
                    {
                        start: new Date("2026-05-04T00:00:00Z"),
                        end: new Date("2026-05-05T00:00:00Z"),
                        isFreeDay: true,
                    },
                ],
            );

            expect(result).toBe(2);
        });
    });

    describe("getLastIncludedDateForRange", () => {
        it("trata el fin a medianoche como exclusivo cuando el rango avanza de día", () => {
            const result = datesUtil.getLastIncludedDateForRange(
                new Date(Date.UTC(2026, 5, 10, 6)),
                new Date(Date.UTC(2026, 5, 11, 0)),
            );

            expect(result.toISOString()).toBe("2026-06-10T00:00:00.000Z");
        });

        it("mantiene el mismo día cuando el fin no está en medianoche", () => {
            const result = datesUtil.getLastIncludedDateForRange(
                new Date(Date.UTC(2026, 5, 10, 6)),
                new Date(Date.UTC(2026, 5, 10, 23, 59)),
            );

            expect(result.toISOString()).toBe("2026-06-10T00:00:00.000Z");
        });
    });
});
