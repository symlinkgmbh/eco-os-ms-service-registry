/**
 * Copyright 2018-2020 Symlink GmbH
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */




import { PkRedis, MsRegistry } from "@symlinkde/eco-os-pk-models";
import { IRegistry } from "./IRegistry";
import { RegistryStates } from "./RegistryStates";
import { Log, LogLevel } from "@symlinkde/eco-os-pk-log";
import { StaticRegistryUtil } from "./StaticRegistryUtil";
import { redisContainer, REDIS_TYPES } from "@symlinkde/eco-os-pk-redis";
import { CustomRestError, apiResponseCodes } from "@symlinkde/eco-os-pk-api";
import { injectable } from "inversify";

@injectable()
export class Registry implements IRegistry {
  private redisClient: PkRedis.IRedisClient;

  constructor() {
    if (process.env.SECONDLOCK_REDIS_URI === undefined) {
      throw new Error("missing SECONDLOCK_REDIS_URI envrionment variable");
    }

    const redisConf: Array<string> = process.env.SECONDLOCK_REDIS_URI.split(":");
    redisContainer.bind(REDIS_TYPES.REDIS_HOST).toConstantValue(redisConf[0]);
    redisContainer.bind(REDIS_TYPES.REDIS_PORT).toConstantValue(redisConf[1]);
    this.redisClient = redisContainer.get<PkRedis.IRedisClient>(REDIS_TYPES.IRedisClient);
  }

  public async addRegistryEntry(entry: MsRegistry.IRegistryEntry): Promise<MsRegistry.IRegistryEntry> {
    const entryDate: number = Date.now();

    entry.id = entry.id === undefined ? StaticRegistryUtil.createRegistryID() : entry.id;
    entry.lastHeartBeat = entry.lastHeartBeat === undefined ? entryDate : entry.lastHeartBeat;
    entry.humanReadAbleDate = new Date(entry.lastHeartBeat);
    entry.state = entry.state === undefined ? RegistryStates.up : entry.state;
    entry.kubernetes = StaticRegistryUtil.isKubernetes();

    const result: boolean = await this.redisClient.set(entry.id, entry);

    if (!result) {
      Log.log(`error in push service to registry.${JSON.stringify(entry)}`, LogLevel.error);
    }

    Log.log(`add new service to registry: "${entry.name}" || address: "${entry.address}"`, LogLevel.info);

    return entry;
  }

  public async getRegistryEntryById(id: string): Promise<MsRegistry.IRegistryEntry> {
    const result = await this.redisClient.get<MsRegistry.IRegistryEntry>(id);

    if (!result) {
      throw new CustomRestError(
        {
          code: apiResponseCodes.C836.code,
          message: apiResponseCodes.C836.message,
        },
        404,
      );
    }

    return result;
  }

  public async getRegistryEntriesByName(query: string): Promise<MsRegistry.IRegistryEntry> {
    const results = await this.filterRegisteredEntries(query);
    if (results.length < 1) {
      throw new CustomRestError(
        {
          code: apiResponseCodes.C837.code,
          message: apiResponseCodes.C837.message + query,
        },
        404,
      );
    }
    return results[Math.floor(Math.random() * results.length)];
  }

  public async getRegistry(): Promise<Array<MsRegistry.IRegistryEntry>> {
    return await this.redisClient.getAll<MsRegistry.IRegistryEntry>("ms*");
  }

  public async updateRegistryEntryById(id: string): Promise<MsRegistry.IRegistryEntry> {
    const entry = await this.getRegistryEntryById(id);

    const entryDate: number = Date.now();
    entry.lastHeartBeat = entryDate;
    entry.humanReadAbleDate = new Date(entryDate);
    entry.state = RegistryStates.up;

    Log.log(`update service in registry: ${entry.name} || address: ${entry.address}`, LogLevel.info);
    return await this.addRegistryEntry(entry);
  }

  public async updateRegistryEntryByIdAsDead(id: string): Promise<void> {
    await this.removeRegistryEntryById(id);
    return;
  }

  public removeRegistryEntryById(id: string): void {
    this.redisClient.delete(id);
    return;
  }

  private async filterRegisteredEntries(query: string): Promise<Array<MsRegistry.IRegistryEntry>> {
    const registryStore = await this.redisClient.getAll<MsRegistry.IRegistryEntry>("ms*");
    const filteredArray: Array<MsRegistry.IRegistryEntry> = [];
    for (const entry in registryStore) {
      if (registryStore[entry].name === query && registryStore[entry].state === RegistryStates.up) {
        filteredArray.push(registryStore[entry]);
      }
    }
    return filteredArray;
  }
}
