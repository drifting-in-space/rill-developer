import duckdb from "duckdb";
import type { DatabaseConfig } from "$common/config/DatabaseConfig";

interface DuckDB {
  // TODO: define concrete styles
  all: (...args: Array<unknown>) => unknown;
  exec: (...args: Array<unknown>) => unknown;
  prepare: (...args: Array<unknown>) => unknown;
}

/**
 * Runs a duckdb instance. Database name can be configured {@link DatabaseConfig}
 *
 * There is only one db right now.
 * But in the future we can easily add an interface to this and have different implementations.
 */
export class DuckDBClient {
  protected db: DuckDB;

  protected onCallback: () => void;
  protected offCallback: () => void;

  // this is a singleton class because
  // duckdb doesn't work well with multiple connections to same db from same process
  // if we ever need to have different connections modify this to have a map of database to instance
  private static instance: DuckDBClient;
  private constructor(private readonly databaseConfig: DatabaseConfig) {}
  public static getInstance(databaseConfig: DatabaseConfig) {
    if (!this.instance) this.instance = new DuckDBClient(databaseConfig);
    return this.instance;
  }

  public async init(): Promise<void> {
    if (this.databaseConfig.skipDatabase || this.db) return;
    // we can later on swap this over to WASM and update data loader
    this.db = new duckdb.Database(this.databaseConfig.databaseName);
    this.db.exec("PRAGMA threads=60;PRAGMA log_query_path='./log';");
  }

  public execute<Row = Record<string, unknown>>(
    query: string,
    log = false
  ): Promise<Array<Row>> {
    this.onCallback?.();
    if (log) console.log(query);
    return new Promise((resolve, reject) => {
      try {
        this.db.all(query, (err, res) => {
          if (err !== null) {
            reject(err);
          } else {
            this.offCallback?.();
            resolve(res);
          }
        });
      } catch (err) {
        if (log) console.error(err);
        reject(err);
      }
    });
  }

  public prepare(query: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.prepare(query, (err, stmt) => {
        if (err !== null) reject(err);
        else resolve(stmt);
      });
    });
  }
}
