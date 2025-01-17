<script lang="ts">
  /**
   * Leaderboard.svelte
   * -------------------------
   * This is the "implemented" feature of the leaderboard, meant to be used
   * in the application itself.
   */
  import type { DimensionDefinitionEntity } from "$common/data-modeler-state-service/entity-state-service/DimensionDefinitionStateService";
  import LeaderboardContainer from "$lib/components/leaderboard/LeaderboardContainer.svelte";
  import LeaderboardHeader from "$lib/components/leaderboard/LeaderboardHeader.svelte";
  import LeaderboardList from "$lib/components/leaderboard/LeaderboardList.svelte";
  import LeaderboardListItem from "$lib/components/leaderboard/LeaderboardListItem.svelte";
  import Tooltip from "$lib/components/tooltip/Tooltip.svelte";
  import TooltipContent from "$lib/components/tooltip/TooltipContent.svelte";
  import TooltipShortcutContainer from "$lib/components/tooltip/TooltipShortcutContainer.svelte";
  import TooltipTitle from "$lib/components/tooltip/TooltipTitle.svelte";
  import { getDimensionById } from "$lib/redux-store/dimension-definition/dimension-definition-readables";
  import {
    humanizeGroupValues,
    NicelyFormattedTypes,
    ShortHandSymbols,
  } from "$lib/util/humanize-numbers";
  import type { Readable } from "svelte/store";
  import LeaderboardEntrySet from "./DimensionLeaderboardEntrySet.svelte";

  export let dimensionId: string;
  /** The reference value is the one that the bar in the LeaderboardListItem
   * gets scaled with. For a summable metric, the total is a reference value,
   * or for a count(*) metric, the reference value is the total number of rows.
   */
  export let referenceValue: number;
  export let values;

  export let formatPreset: NicelyFormattedTypes;
  export let leaderboardFormatScale: ShortHandSymbols;
  export let isSummableMeasure = false;

  type ActiveValues = [string, boolean];
  export let activeValues: ActiveValues[];
  export let slice = 7;
  export let seeMoreSlice = 50;
  let seeMore = false;
  $: atLeastOneActive = !!activeValues?.some(([_, isActivated]) => isActivated);

  let dimension: Readable<DimensionDefinitionEntity>;
  $: dimension = getDimensionById(dimensionId);
  let displayName: string;
  // TODO: select based on label?
  $: displayName = $dimension?.labelSingle?.length
    ? $dimension?.labelSingle
    : $dimension?.dimensionColumn;

  /** figure out how many selected values are currently hidden */
  // $: hiddenSelectedValues = values.filter((di, i) => {
  //   return activeValues.includes(di.label) && i > slice - 1 && !seeMore;
  // });

  $: values = formatPreset
    ? humanizeGroupValues(values, formatPreset, {
        scale: leaderboardFormatScale,
      })
    : humanizeGroupValues(values, NicelyFormattedTypes.HUMANIZE, {
        scale: leaderboardFormatScale,
      });

  // get all values that are selected but not visible.
  // we'll put these at the bottom w/ a divider.
  $: selectedValuesThatAreBelowTheFold = activeValues
    .filter(([label, isActive]) => {
      return (
        // the value is active.
        isActive &&
        // the value is visible within the fold.
        !values.slice(0, !seeMore ? slice : seeMoreSlice).some((value) => {
          return value.label === label;
        })
      );
    })
    .map(([label]) => {
      const existingValue = values.find((value) => value.label === label);
      // return the existing value, or if it does not exist, just return the label.
      return existingValue ? { ...existingValue } : { label };
    })
    .sort((a, b) => {
      return b.value - a.value;
    });
</script>

<LeaderboardContainer focused={atLeastOneActive}>
  <LeaderboardHeader isActive={atLeastOneActive}>
    <div
      slot="title"
      class:text-gray-500={atLeastOneActive}
      class:italic={atLeastOneActive}
    >
      <Tooltip location="top" distance={16}>
        <span>
          {displayName}
        </span>
        <TooltipContent slot="tooltip-content">
          <TooltipTitle>
            <svelte:fragment slot="name">
              {displayName}
            </svelte:fragment>
            <svelte:fragment slot="description">dimension</svelte:fragment>
          </TooltipTitle>
          <TooltipShortcutContainer>
            <div>
              {#if $dimension?.description}
                {$dimension.description}
              {:else}
                the leaderboard metrics for {displayName}
              {/if}
            </div>
          </TooltipShortcutContainer>
        </TooltipContent>
      </Tooltip>
    </div>
  </LeaderboardHeader>
  <LeaderboardList>
    <!-- place the leaderboard entries that are above the fold here -->
    <LeaderboardEntrySet
      values={values.slice(0, !seeMore ? slice : seeMoreSlice)}
      {activeValues}
      {atLeastOneActive}
      {referenceValue}
      {isSummableMeasure}
      on:select-item
    />
    <!-- place the selected values that are not above the fold here -->
    {#if selectedValuesThatAreBelowTheFold.length}
      <hr />
      <LeaderboardEntrySet
        values={selectedValuesThatAreBelowTheFold}
        {activeValues}
        {atLeastOneActive}
        {referenceValue}
        {isSummableMeasure}
        on:select-item
      />
      <hr />
    {/if}
    {#if values.length === 0}
      <div class="p-1 italic text-gray-500">no available values</div>
    {/if}

    {#if values.length > slice}
      <Tooltip location="right">
        <LeaderboardListItem
          value={0}
          color="bg-gray-100"
          on:click={() => {
            seeMore = !seeMore;
          }}
        >
          <div class="italic text-gray-500" slot="title">
            See {#if seeMore}Less{:else}More{/if}
          </div>
        </LeaderboardListItem>
        <TooltipContent slot="tooltip-content">See More Items</TooltipContent>
      </Tooltip>
    {/if}
  </LeaderboardList>
</LeaderboardContainer>
