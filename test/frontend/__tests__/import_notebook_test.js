import { lastElement, saveScreenshot, getTestScreenshotPath, setupPage } from "../helpers/common"
import { getCellIds, waitForCellOutput, importNotebook, getPlutoUrl, prewarmPluto, writeSingleLineInPlutoInput } from "../helpers/pluto"

describe("PlutoImportNotebook", () => {
    beforeAll(async () => {
        setupPage(page)
        await prewarmPluto(page)
    })

    beforeEach(async () => {
        await page.goto(getPlutoUrl(), { waitUntil: "networkidle0" })
    })

    afterEach(async () => {
        await saveScreenshot(page, getTestScreenshotPath())
    })

    test.each([
        ["function_sum_notebook.jl", "3"],
        ["simple_sum_notebook.jl", "6"],
    ])("should import notebook %s with last cell output %s", async (notebookName, expectedLastCellOutput) => {
        await importNotebook(notebookName)
        const cellIds = await getCellIds(page)
        const outputs = await Promise.all(cellIds.map((cellId) => waitForCellOutput(page, cellId)))
        expect(lastElement(outputs)).toBe(expectedLastCellOutput)
    })

    it("should add a new cell and re-evaluate the notebook", async () => {
        await importNotebook("function_sum_notebook.jl")
        // Add a new cell
        let lastPlutoCellId = lastElement(await getCellIds(page))
        await waitForCellOutput(page, lastPlutoCellId)

        await page.click(`pluto-cell[id="${lastPlutoCellId}"] .add_cell.after`)
        await page.waitForTimeout(500)

        // Use the previously defined sum function in the new cell
        lastPlutoCellId = lastElement(await getCellIds(page))
        await writeSingleLineInPlutoInput(page, `pluto-cell[id="${lastPlutoCellId}"] pluto-input`, "sum(2, 3)")

        // Run cells
        await page.click(".runallchanged")
        const lastCellContent = await waitForCellOutput(page, lastPlutoCellId)
        expect(lastCellContent).toBe("5")
    })
})
