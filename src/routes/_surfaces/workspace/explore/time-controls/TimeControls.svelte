<!--
@component
Constructs a TimeRange object – to be used as the filter in MetricsExplorer – by taking as input:
- the time range name (a semantic understanding of the time range, like "Last 6 Hours" or "Last 30 days")
- the time grain (e.g., "hour" or "day")
- the dataset's full time range (so its end time can be used in relative time ranges)
-->
<script lang="ts">
  import { getMetricsExplorerById } from "$lib/redux-store/explore/explore-readables";
  import TimeGrainSelector from "./TimeGrainSelector.svelte";
  import TimeRangeNameSelector from "./TimeRangeNameSelector.svelte";
  import type { Readable } from "svelte/store";
  import type { MetricsExplorerEntity } from "$lib/redux-store/explore/explore-slice";

  export let metricsDefId: string;

  let metricsExplorer: Readable<MetricsExplorerEntity>;
  $: metricsExplorer = getMetricsExplorerById(metricsDefId);
</script>

<div class="flex flex-row">
  <TimeRangeNameSelector {metricsDefId} />
  <TimeGrainSelector {metricsDefId} />
</div>
