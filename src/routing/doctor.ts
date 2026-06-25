import { Client } from "pg";
import * as fs from "fs";

const DATABASE_URL =
  // process.env.DATABASE_PUBLIC_URL ||
  "postgresql://postgres:imKmpjLIOaECgzPUgHBLEVWxIHcwpEgk@roundhouse.proxy.rlwy.net:34846/railway?sslmode=disable";


async function exportDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false,
  });

  try {


    console.log("called")
    await client.connect();

    console.log("Connected successfully");

    // Current database info
    const dbInfo = await client.query(`
      SELECT current_database(), current_user;
    `);

    console.log("Database Info:");
    console.table(dbInfo.rows);

    // All schemas
    const schemas = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      ORDER BY schema_name;
    `);

    console.log("Schemas:");
    console.table(schemas.rows);

    // All tables from all schemas
    const tablesResult = await client.query(`
      SELECT
        table_schema,
        table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name;
    `);

    console.log("Tables Found:");
    console.table(tablesResult.rows);

    const data: any = {};

    for (const table of tablesResult.rows) {
      const schema = table.table_schema;
      const tableName = table.table_name;

      console.log(`Fetching ${schema}.${tableName}`);

      try {
        const result = await client.query(
          `SELECT * FROM "${schema}"."${tableName}"`
        );

        console.log(
          `${schema}.${tableName}: ${result.rows.length} rows`
        );

        data[`${schema}.${tableName}`] = result.rows;
      } catch (err) {
        console.error(
          `Failed to fetch ${schema}.${tableName}`,
          err
        );
      }
    }

    fs.writeFileSync(
      "database-export.json",
      JSON.stringify(data, null, 2)
    );

    console.log(
      `Export completed. ${
        Object.keys(data).length
      } tables exported.`
    );
  } catch (error) {
    console.error("Database Error:", error);
  } finally {
    await client.end();
    console.log("Connection closed");
  }
}

exportDatabase();
