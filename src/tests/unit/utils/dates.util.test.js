const { workday } = require("../../../prisma");
const datesUtil = require("../../../utils/dates");

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
        date: new Date("2026-05-04"),
        is_free_day: true,
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
    });
});
