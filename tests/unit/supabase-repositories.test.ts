import { describe,expect,it } from "vitest";
import { SupabaseNormalizedRepository,SupabaseRawRecordRepository,SupabaseSyncLockRepository,SupabaseSyncRunRepository } from "@/services/supabase";
import type { OperationalExecutor } from "@/services/supabase/executor";

class MemoryExecutor implements OperationalExecutor {
  rows=new Map<string,Record<string,unknown>>(); calls:{operation:string;schema:string;table:string;value?:Record<string,unknown>}[]=[];
  key(schema:string,table:string,value:unknown){return`${schema}.${table}.${String(value)}`}
  async find(schema:"public"|"raw",table:string,_column:string,value:unknown){return this.rows.get(this.key(schema,table,value))??null}
  async insert(schema:"public"|"raw",table:string,value:Record<string,unknown>){this.calls.push({operation:"insert",schema,table,value});const id=value.id??value.omie_id??value.entity_type??"generated";if(this.rows.has(this.key(schema,table,id)))throw new Error("duplicate");this.rows.set(this.key(schema,table,id),value)}
  async insertReturning(schema:"public"|"raw",table:string,value:Record<string,unknown>){const row={id:"run-1",...value};await this.insert(schema,table,row);return row}
  async upsert(schema:"public"|"raw",table:string,value:Record<string,unknown>){this.calls.push({operation:"upsert",schema,table,value});const id=value.omie_id??value.entity_type;this.rows.set(this.key(schema,table,id),value)}
  async update(schema:"public"|"raw",table:string,_column:string,key:unknown,value:Record<string,unknown>){this.calls.push({operation:"update",schema,table,value});this.rows.set(this.key(schema,table,key),{...(this.rows.get(this.key(schema,table,key))??{}),...value})}
  async delete(schema:"public"|"raw",table:string,_column:string,key:unknown){this.calls.push({operation:"delete",schema,table});this.rows.delete(this.key(schema,table,key))}
  async deleteExpiredLocks(_now:string){this.calls.push({operation:"delete-expired",schema:"raw",table:"sync_locks"})}
  async rpc(name:string,args:Record<string,unknown>={}){this.calls.push({operation:"rpc",schema:"public",table:name,value:args});if(name==="operational_start_sync")return"run-1";if(name==="operational_acquire_sync_lock"){const entity=args.entity;if(this.rows.has(this.key("raw","sync_locks",entity)))throw new Error("duplicate");this.rows.set(this.key("raw","sync_locks",entity),args)}if(name==="operational_release_sync_lock")this.rows.delete(this.key("raw","sync_locks",args.entity));return null}
}

describe("concrete Supabase repositories",()=>{
  it("stores RAW through a service-role-only RPC",async()=>{const db=new MemoryExecutor(),repo=new SupabaseRawRecordRepository(db);await repo.store({entityType:"customers",omieId:"10",rawJson:{codigo:10},payloadHash:"hash",source:"omie_api",fetchedAt:"2026-08-20T00:00:00.000Z",syncRunId:"run"});expect(db.calls[0]).toMatchObject({operation:"rpc",table:"operational_store_raw",value:{payload:{omie_id:"10",payload_hash:"hash"}}})});
  it("returns inserted, unchanged and updated by persisted source hash",async()=>{const db=new MemoryExecutor(),repo=new SupabaseNormalizedRepository<{omieId:string;name:string}>("customers",r=>({legal_name:r.name}),db);expect(await repo.upsert({omieId:"1",name:"A"},"h1")).toBe("inserted");expect(await repo.upsert({omieId:"1",name:"A"},"h1")).toBe("unchanged");expect(await repo.upsert({omieId:"1",name:"B"},"h2")).toBe("updated")});
  it("records complete sync statistics through restricted RPCs",async()=>{const db=new MemoryExecutor(),repo=new SupabaseSyncRunRepository(db);const id=await repo.start("customers");await repo.finish(id,{fetched:5,inserted:2,updated:1,unchanged:1,failed:1});expect(db.calls.at(-1)).toMatchObject({operation:"rpc",table:"operational_finish_sync",value:{summary:{fetched:5,inserted:2,updated:1,unchanged:1,failed:1}}})});
  it("uses a database unique lock rather than UI state",async()=>{const db=new MemoryExecutor(),repo=new SupabaseSyncLockRepository(db);await repo.acquire("customers","run-1");await expect(repo.acquire("customers","run-2")).rejects.toThrow("duplicate");await repo.release("customers");expect(db.calls.map(c=>c.operation)).toContain("rpc")});
});
