import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type Row = Record<string, unknown>;
type Result<T> = { data: T; error: { message: string } | null };
type Filter = { eq(column: string, value: unknown): Filter; lt(column: string, value: unknown): Filter; maybeSingle(): Promise<Result<Row | null>> };
type Select = { eq(column: string, value: unknown): Filter; lt(column: string, value: unknown): Filter; maybeSingle(): Promise<Result<Row | null>> };
type Mutation = PromiseLike<Result<unknown>> & { select(columns?: string): { single(): Promise<Result<Row>> } };
type Table = { select(columns?: string): Select; insert(value: Row | Row[]): Mutation; upsert(value: Row | Row[], options?: { onConflict?: string }): Mutation; update(value: Row): { eq(column: string, value: unknown): PromiseLike<Result<unknown>> }; delete(): { eq(column: string, value: unknown): PromiseLike<Result<unknown>>; lt(column: string, value: unknown): PromiseLike<Result<unknown>> } };
type Schema = { from(table: string): Table };
type Client = Schema & { schema(name: string): Schema };
type RpcClient = Client & { rpc(name:string,args?:Row):PromiseLike<Result<unknown>> };

function failure(error: { message: string } | null) { if (error) throw new Error(`Supabase operation failed: ${error.message}`); }

export interface OperationalExecutor { find(schema:"public"|"raw",table:string,column:string,value:unknown):Promise<Row|null>; insert(schema:"public"|"raw",table:string,value:Row):Promise<void>; insertReturning(schema:"public"|"raw",table:string,value:Row):Promise<Row>; upsert(schema:"public"|"raw",table:string,value:Row,onConflict?:string):Promise<void>; update(schema:"public"|"raw",table:string,column:string,key:unknown,value:Row):Promise<void>; delete(schema:"public"|"raw",table:string,column:string,key:unknown):Promise<void>; deleteExpiredLocks(now:string):Promise<void>; rpc(name:string,args?:Row):Promise<unknown> }

export class SupabaseExecutor implements OperationalExecutor {
  private readonly client: Client;
  constructor(client: Client = createAdminClient() as unknown as Client) { this.client = client; }
  private table(schema: "public" | "raw", table: string) { return (schema === "public" ? this.client : this.client.schema(schema)).from(table); }
  async find(schema: "public" | "raw", table: string, column: string, value: unknown) { const result = await this.table(schema, table).select("*").eq(column, value).maybeSingle(); failure(result.error); return result.data; }
  async insert(schema: "public" | "raw", table: string, value: Row) { const result = await this.table(schema, table).insert(value); failure(result.error); }
  async insertReturning(schema: "public" | "raw", table: string, value: Row) { const result = await this.table(schema, table).insert(value).select("*").single(); failure(result.error); return result.data; }
  async upsert(schema: "public" | "raw", table: string, value: Row, onConflict?: string) { const result = await this.table(schema, table).upsert(value, onConflict ? { onConflict } : undefined); failure(result.error); }
  async update(schema: "public" | "raw", table: string, column: string, key: unknown, value: Row) { const result = await this.table(schema, table).update(value).eq(column, key); failure(result.error); }
  async delete(schema: "public" | "raw", table: string, column: string, key: unknown) { const result = await this.table(schema, table).delete().eq(column, key); failure(result.error); }
  async deleteExpiredLocks(now: string) { const result = await this.table("raw", "sync_locks").delete().lt("expires_at", now); failure(result.error); }
  async rpc(name:string,args:Row={}){const result=await (this.client as RpcClient).rpc(name,args);failure(result.error);return result.data}
}
