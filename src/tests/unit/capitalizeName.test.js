const { capitalizeName } = require("../../utils/capitalizeName");

describe("capitalizeName", () => {
    it("capitaliza la primera letra de cada palabra", () => {
        expect(capitalizeName("juan manuel")).toBe("Juan Manuel");
        expect(capitalizeName("lopez")).toBe("Lopez");
        expect(capitalizeName("maría josé")).toBe("María José");
    });

    it("normaliza mayúsculas mixtas", () => {
        expect(capitalizeName("GARCIA")).toBe("Garcia");
        expect(capitalizeName("jUaN")).toBe("Juan");
    });

    it("recorta espacios extra", () => {
        expect(capitalizeName("  ana   lopez  ")).toBe("Ana Lopez");
    });
});
