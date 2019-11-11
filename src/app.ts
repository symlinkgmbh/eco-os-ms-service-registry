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



import Config from "config";
import { Log, LogLevel } from "@symlinkde/eco-os-pk-log";
import { Api } from "./api/Api";
import { Application } from "express";
import { IHealth, healthContainer } from "./infrastructure/health";
import { HEALTH_TYPES } from "./infrastructure/health/HealthTypes";

export class Bootstrapper {
  public static getInstance(): Bootstrapper {
    if (!Bootstrapper.instance) {
      Bootstrapper.instance = new Bootstrapper();
    }

    return Bootstrapper.instance;
  }

  private static instance: Bootstrapper;
  private api: Api;
  private health: IHealth;

  private constructor() {
    this.api = new Api();
    this.health = healthContainer.get<IHealth>(HEALTH_TYPES.IHealth);
    this.registryExceptionHandler();
    this.registryTerminationHandler();
  }

  public async init(): Promise<Application> {
    try {
      this.initLogSystem();
      this.validateDateEnvironment();
      this.initHealthSystem();
      return await this.api.init();
    } catch (err) {
      Log.log(err, LogLevel.error);
      process.exit(1);
      throw new Error(err);
    }
  }

  private initLogSystem(): void {
    Log.log(`init ${Config.get("name")} ${Config.get("version")}`, LogLevel.info);
    return;
  }

  private initHealthSystem(): void {
    try {
      this.health.init();
    } catch (err) {
      Log.log(err, LogLevel.error);
      process.exit(1);
    }
  }

  private validateDateEnvironment(): void {
    if (!process.env.SECONDLOCK_REDIS_URI) {
      Log.log("missing SECONDLOCK_REDIS_URI environment variable", LogLevel.error);
      throw new Error("missing SECONDLOCK_REDIS_URI environment variable");
    }

    if (process.env.RUN_ON_KUBERNETES !== undefined) {
      Log.log(`support for kubernets: ${process.env.RUN_ON_KUBERNETES}`, LogLevel.info);
    }
  }

  private registryExceptionHandler(): void {
    process.on("uncaughtException", (error) => {
      Log.log(error, LogLevel.error);
    });

    process.on("unhandledRejection", (error) => {
      if (error) {
        Log.log(error, LogLevel.error);
      }
    });
  }

  private registryTerminationHandler(): void {
    process.on("SIGINT", () => {
      process.exit(1);
      return;
    });

    process.on("SIGTERM", () => {
      process.exit(1);
      return;
    });
  }
}
