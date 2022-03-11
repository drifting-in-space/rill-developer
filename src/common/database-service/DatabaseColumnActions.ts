import {DatabaseActions} from "./DatabaseActions";
import type {CategoricalSummary, NumericSummary, TimeRangeSummary} from "$lib/types";
import type {DatabaseMetadata} from "$common/database-service/DatabaseMetadata";
import {sanitizeColumn} from "$common/utils/queryUtils";
import {TIMESTAMPS} from "$lib/duckdb-data-types";

const TOP_K_COUNT = 50;

export class DatabaseColumnActions extends DatabaseActions {
    public async getTopKAndCardinality(metadata: DatabaseMetadata, tableName: string, columnName: string,
                                       func = "count(*)"): Promise<CategoricalSummary> {
        return {
            topK: await this.getTopKOfColumn(metadata, tableName, columnName, func),
            cardinality: await this.getCardinalityOfColumn(metadata, tableName, columnName),
        };
    }

    public async getNullCount(metadata: DatabaseMetadata,
                              tableName: string, columnName: string): Promise<number> {
        const sanitizedColumName = sanitizeColumn(columnName);
        const [nullity] = await this.databaseClient.execute(
            `SELECT COUNT(*) as count FROM '${tableName}' WHERE ${sanitizedColumName} IS NULL;`);
        return nullity.count;
    }

    public async getDescriptiveStatistics(metadata: DatabaseMetadata,
                                          tableName: string, columnName: string): Promise<NumericSummary> {
        const sanitizedColumnName = sanitizeColumn(columnName);
        const [results] = await this.databaseClient.execute(`
            SELECT
                min(${sanitizedColumnName}) as min,
                reservoir_quantile(${sanitizedColumnName}, 0.25) as q25,
                reservoir_quantile(${sanitizedColumnName}, 0.5)  as q50,
                reservoir_quantile(${sanitizedColumnName}, 0.75) as q75,
                max(${sanitizedColumnName}) as max,
                avg(${sanitizedColumnName})::FLOAT as mean,
                stddev_pop(${sanitizedColumnName}) as sd
            FROM '${tableName}';
       `);
        return { statistics: results };
    }

    public async getNumericHistogram(metadata: DatabaseMetadata,
                                              tableName: string, columnName: string, columnType: string): Promise<NumericSummary> {
        const sanitizedColumnName = sanitizeColumn(columnName);
        // use approx_count_distinct to get the immediate cardinality of this column.
        // FIXME: we don't need to re-compute cardinality here. Instead we should be calculating it
        // for every column by default.
        const [buckets] = await this.databaseClient.execute(`SELECT approx_count_distinct(${sanitizedColumnName}) as count from ${tableName}`);
        const bucketSize = Math.min(40, buckets.count);
        const result = await this.databaseClient.execute(`
          WITH data_table AS (
            SELECT ${TIMESTAMPS.has(columnType) ? `epoch(${sanitizedColumnName})` : `${sanitizedColumnName}::DOUBLE`} as ${sanitizedColumnName} 
            FROM ${tableName}
            WHERE ${sanitizedColumnName} IS NOT NULL
          ), S AS (
            SELECT 
              min(${sanitizedColumnName}) as minVal,
              max(${sanitizedColumnName}) as maxVal,
              (max(${sanitizedColumnName}) - min(${sanitizedColumnName})) as range
              FROM data_table
          ), values AS (
            SELECT ${sanitizedColumnName} as value from data_table
            WHERE ${sanitizedColumnName} IS NOT NULL
          ), buckets AS (
            SELECT
              range as bucket,
              (range) * (select range FROM S) / ${bucketSize} + (select minVal from S) as low,
              (range + 1) * (select range FROM S) / ${bucketSize} + (select minVal from S) as high
            FROM range(0, ${bucketSize}, 1)
          ),
          histogram_stage AS (
          SELECT
              bucket,
              low,
              high,
              count(values.value) as count
            FROM buckets
            LEFT JOIN values ON (values.value >= low and values.value < high)
            GROUP BY bucket, low, high
            ORDER BY BUCKET
          ),
          -- calculate the right edge, sine in histogram_stage we don't look at the values that
          -- might be the largest.
          right_edge AS (
            SELECT count(*) as c from values WHERE value = (select maxVal from S)
          )
          SELECT 
            bucket,
            low,
            high,
            -- fill in the case where we've filtered out the highest value and need to recompute it, otherwise use count.
            CASE WHEN high = (SELECT max(high) from histogram_stage) THEN count + (select c from right_edge) ELSE count END AS count
            FROM histogram_stage
	      `);
        return { histogram: result };
    }

    public async getTimeRange(metadata: DatabaseMetadata,
                              tableName: string, columnName: string): Promise<TimeRangeSummary> {
        const sanitizedColumnName = sanitizeColumn(columnName);
        const [ranges] = await this.databaseClient.execute(`
	        SELECT
		    min(${sanitizedColumnName}) as min, max(${sanitizedColumnName}) as max, 
		    max(${sanitizedColumnName}) - min(${sanitizedColumnName}) as interval
		    FROM '${tableName}';
	    `);
        return ranges;
    }

    private async getTopKOfColumn(metadata: DatabaseMetadata,
                          tableName: string, columnName: string, func = "count(*)"): Promise<any> {
        const sanitizedColumnName = sanitizeColumn(columnName);
        return this.databaseClient.execute(`
            SELECT ${sanitizedColumnName} as value, ${func} AS count from '${tableName}'
            GROUP BY ${sanitizedColumnName}
            ORDER BY count desc
            LIMIT ${TOP_K_COUNT};
        `);
    }

    private async getCardinalityOfColumn(metadata: DatabaseMetadata,
                                 tableName: string, columnName: string): Promise<number> {
        const sanitizedColumnName = sanitizeColumn(columnName);
        const [results] = await this.databaseClient.execute(
            `SELECT approx_count_distinct(${sanitizedColumnName}) as count from '${tableName}';`);
        return results.count;
    }
}