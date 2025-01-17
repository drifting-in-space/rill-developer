<script lang="ts">
  import type { DimensionDefinitionEntity } from "$common/data-modeler-state-service/entity-state-service/DimensionDefinitionStateService";
  import type { MeasureDefinitionEntity } from "$common/data-modeler-state-service/entity-state-service/MeasureDefinitionStateService";
  import { getDimensionsByMetricsId } from "$lib/redux-store/dimension-definition/dimension-definition-readables";
  import { bootstrapMetricsExplorer } from "$lib/redux-store/explore/bootstrapMetricsExplorer";
  import { getMetricsExplorerById } from "$lib/redux-store/explore/explore-readables";
  import type { MetricsExplorerEntity } from "$lib/redux-store/explore/explore-slice";
  import { getMeasuresByMetricsId } from "$lib/redux-store/measure-definition/measure-definition-readables";
  import { store } from "$lib/redux-store/store-root";
  import { onMount } from "svelte";
  import type { Readable } from "svelte/store";
  import ExploreContainer from "./ExploreContainer.svelte";
  import ExploreHeader from "./ExploreHeader.svelte";
  import LeaderboardDisplay from "./leaderboards/LeaderboardDisplay.svelte";
  import MetricsTimeSeriesCharts from "./time-series-charts/MetricsTimeSeriesCharts.svelte";

  export let metricsDefId: string;

  let metricsExplorer: Readable<MetricsExplorerEntity>;
  $: metricsExplorer = getMetricsExplorerById(metricsDefId);

  let measures: Readable<Array<MeasureDefinitionEntity>>;
  $: measures = getMeasuresByMetricsId(metricsDefId);

  let dimensions: Readable<Array<DimensionDefinitionEntity>>;
  $: dimensions = getDimensionsByMetricsId(metricsDefId);

  onMount(() => {
    store.dispatch(bootstrapMetricsExplorer(metricsDefId));
  });

  let whichReferenceValue: string;
</script>

<ExploreContainer let:columns>
  <svelte:fragment slot="header">
    <ExploreHeader bind:whichReferenceValue {metricsDefId} />
  </svelte:fragment>
  <svelte:fragment slot="metrics">
    <MetricsTimeSeriesCharts
      {metricsDefId}
      interval={$metricsExplorer?.selectedTimeRange?.interval ||
        $metricsExplorer?.allTimeRange?.interval}
    />
  </svelte:fragment>
  <svelte:fragment slot="leaderboards">
    <LeaderboardDisplay {columns} {whichReferenceValue} {metricsDefId} />
  </svelte:fragment>
</ExploreContainer>
