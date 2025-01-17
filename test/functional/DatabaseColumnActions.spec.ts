import { TestBase } from "@adityahegde/typescript-test-utils";
import type { SinonSpy } from "sinon";
import { numericHistograms } from "../data/HistogramSummary.data";
import { FunctionalTestBase } from "./FunctionalTestBase";

@FunctionalTestBase.Suite
export class DatabaseColumns extends FunctionalTestBase {
  private databaseDispatchSpy: SinonSpy;

  private async testHistogramSummary(input, output) {
    const [model] = this.getModels("tableName", "model_0");
    await this.clientDataModelerService.dispatch("updateModelQuery", [
      model.id,
      input,
    ]);
    await this.waitForModels();
    const [, derivedModel] = this.getModels("tableName", "model_0");
    expect(derivedModel.profile[0].summary.histogram).toEqual(output);
  }

  public async setup() {
    await super.setup();

    this.databaseDispatchSpy = this.sandbox.spy(
      this.serverDataModelerService.getDatabaseService(),
      "dispatch"
    );
  }

  @FunctionalTestBase.BeforeEachTest()
  public async setupTests() {
    await this.clientDataModelerService.dispatch("clearAllModels", []);
    await this.clientDataModelerService.dispatch("addModel", [
      { name: "model_0", query: "" },
    ]);
  }

  @TestBase.Test()
  public async histogramsShouldComputeFromColumn() {
    for (const item of numericHistograms) {
      await this.testHistogramSummary(item.input, item.output);
    }
  }
}
