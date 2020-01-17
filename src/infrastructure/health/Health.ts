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




import Config from "config";
import { MsRegistry } from "@symlinkde/eco-os-pk-models";
import { Log, LogLevel } from "@symlinkde/eco-os-pk-log";
import { HttpClient } from "@symlinkde/eco-os-pk-http";
import { IRegistry } from "../registry/IRegistry";
import { IHealth } from "./IHealth";
import { injectable } from "inversify";
import { registryContainer } from "../registry";
import { REGISTRY_TYPES } from "../registry/RegistryTypes";
import { StaticRegistryUtil } from "../registry/StaticRegistryUtil";

@injectable()
export class Health implements IHealth {
  private checkInterval: number;
  private currentRegisteredServies: Array<MsRegistry.IRegistryEntry> = [];
  private registry: IRegistry;
  private maxHealthInSeconds: number;
  private shouldPerformServerSideDiscovery: boolean;
  private shoudlPerformClientSideDiscovery: boolean;

  constructor() {
    this.registry = registryContainer.getTagged<IRegistry>(
      REGISTRY_TYPES.IRegistry,
      REGISTRY_TYPES.Kubernetes,
      StaticRegistryUtil.isKubernetes(),
    );

    this.checkInterval = Config.get("checkInterval");
    this.maxHealthInSeconds = Config.get("maxHealthInSeconds");
    this.shoudlPerformClientSideDiscovery = Config.get("performClientSideDiscovery");
    this.shouldPerformServerSideDiscovery = Config.get("performServerSideDiscovery");
  }

  public init(): void {
    this.initHealthLoop();
  }

  private initHealthLoop(): void {
    if (!StaticRegistryUtil.isKubernetes()) {
      setInterval(async () => {
        Log.log("checking services health", LogLevel.info);
        this.registry
          .getRegistry()
          .then((registryEntries) => {
            this.currentRegisteredServies = registryEntries;
            if (this.shoudlPerformClientSideDiscovery && !this.shouldPerformServerSideDiscovery) {
              this.performClientSideDiscovery();
            }
            if (!this.shoudlPerformClientSideDiscovery && this.shouldPerformServerSideDiscovery) {
              this.performServerSideDiscovery();
            }
          })
          .catch((err) => {
            Log.log(err, LogLevel.error);
          });
      }, this.checkInterval);
    } else {
      return;
    }
  }

  private performClientSideDiscovery(): void {
    this.currentRegisteredServies.map((entry) => {
      if (
        entry.lastHeartBeat &&
        entry.id &&
        (new Date().getTime() - new Date(entry.lastHeartBeat).getTime()) / 1000 > this.maxHealthInSeconds
      ) {
        this.registry.updateRegistryEntryByIdAsDead(entry.id);
      }
    });
    return;
  }

  private performServerSideDiscovery(): void {
    this.currentRegisteredServies.map((entry) => {
      if (entry.id) {
        const id = entry.id;

        const httpClient: HttpClient = new HttpClient(entry.url, Config.get("maxHttpTimeout") as number);

        Log.log(`check heartbeat from service ${entry.name} with url ${entry.url}`, LogLevel.info);

        httpClient
          .getClient()
          .get("/heartbeat")
          .then(() => {
            this.registry.updateRegistryEntryById(id);
          })
          .catch(() => {
            this.registry.updateRegistryEntryByIdAsDead(id);
          });
      }
    });
    return;
  }
}
