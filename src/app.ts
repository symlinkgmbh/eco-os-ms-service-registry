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

  public init(): Promise<Application> {
    return new Promise((resolve, reject) => {
      Promise.all([this.initLogSystem(), this.printAdditionalInformation(), this.initHealthSystem()])
        .then(() => {
          resolve(this.api.init());
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private initLogSystem(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        resolve(Log.log(`init ${Config.get("name")} ${Config.get("version")}`, LogLevel.info));
      } catch (err) {
        Log.log(err, LogLevel.error);
        reject(err);
      }
    });
  }

  private initHealthSystem(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.health.init();
        resolve();
      } catch (err) {
        Log.log(err, LogLevel.error);
        reject(err);
      }
    });
  }

  private printAdditionalInformation(): Promise<void> {
    return new Promise((resolve) => {
      if (!process.env.SECONDLOCK_REDIS_URI) {
        Log.log("missing SECONDLOCK_REDIS_URI environment variable", LogLevel.error);
        throw new Error("missing SECONDLOCK_REDIS_URI environment variable");
      }

      if (process.env.RUN_ON_KUBERNETES !== undefined) {
        Log.log(`support for kubernets: ${process.env.RUN_ON_KUBERNETES}`, LogLevel.info);
      }
      resolve();
    });
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
