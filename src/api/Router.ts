/**
 * Copyright 2018-2019 Symlink GmbH
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



import { Application } from "express";
import { PkApi } from "@symlinkde/eco-os-pk-models";
import { Heartbeat, MetricsRoute, LicenseBeat, ConfigBeat } from "./routes";
import { RegistryRoute } from "./routes/Registry";

export class Router implements PkApi.IRouter {
  protected heartbeat: Heartbeat | undefined;
  protected licenseBeat: LicenseBeat | undefined;
  protected configBeat: ConfigBeat | undefined;
  protected registry: RegistryRoute | undefined;
  protected metrics: MetricsRoute | undefined;

  private app: Application;

  constructor(_app: Application) {
    this.app = _app;
  }

  public initRoutes(): void {
    this.heartbeat = new Heartbeat(this.app);
    this.licenseBeat = new LicenseBeat(this.app);
    this.configBeat = new ConfigBeat(this.app);
    this.metrics = new MetricsRoute(this.app);
    this.registry = new RegistryRoute(this.app);
    return;
  }
}
