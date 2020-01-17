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




import "reflect-metadata";
import { AbstractRoutes, injectValidatorService } from "@symlinkde/eco-os-pk-api";
import { Application, Request, Response, NextFunction } from "express";
import { PkApi, MsRegistry, MsOverride } from "@symlinkde/eco-os-pk-models";
import { IRegistry } from "../../infrastructure/registry/IRegistry";
import { registryContainer } from "../../infrastructure/registry";
import { REGISTRY_TYPES } from "../../infrastructure/registry/RegistryTypes";
import { StaticRegistryUtil } from "../../infrastructure/registry/StaticRegistryUtil";

@injectValidatorService
export class RegistryRoute extends AbstractRoutes implements PkApi.IRoute {
  private registry: IRegistry;
  private validatorService!: PkApi.IValidator;
  private postRegistryEntryPattern: PkApi.IValidatorPattern = {
    name: "",
    address: "",
    url: "",
  };

  constructor(app: Application) {
    super(app);

    this.registry = registryContainer.getTagged<IRegistry>(
      REGISTRY_TYPES.IRegistry,
      REGISTRY_TYPES.Kubernetes,
      StaticRegistryUtil.isKubernetes(),
    );
    this.activate();
  }

  public activate(): void {
    this.addRegistryEntry();
    this.getAllRegistryEntries();
    this.getRegistryEntryById();
    this.getRegistryEntriesByName();
    this.updateRegistryEntryById();
    this.removeRegistryEntryById();
    this.exposeRedisConf();
  }

  private addRegistryEntry(): void {
    this.getApp()
      .route("/registry")
      .post((req: MsOverride.IRequest, res: Response, next: NextFunction) => {
        this.validatorService.validate(req.body, this.postRegistryEntryPattern);
        const registryEntry: MsRegistry.IRegistryEntry = req.body as MsRegistry.IRegistryEntry;
        this.registry
          .addRegistryEntry(registryEntry)
          .then((entry) => {
            res.send(entry);
          })
          .catch((err) => {
            next(err);
          });
      });
  }

  private getRegistryEntryById(): void {
    this.getApp()
      .route("/registry/:id")
      .get((req: MsOverride.IRequest, res: Response, next: NextFunction) => {
        this.registry
          .getRegistryEntryById(req.params.id)
          .then((entry) => {
            res.send(entry);
          })
          .catch((err) => {
            next(err);
          });
      });
  }

  private getRegistryEntriesByName(): void {
    this.getApp()
      .route("/registry/search/:name")
      .get((req: MsOverride.IRequest, res: Response, next: NextFunction) => {
        this.registry
          .getRegistryEntriesByName(req.params.name)
          .then((entries) => {
            res.send(entries);
          })
          .catch((err) => {
            next(err);
          });
      });
  }

  private getAllRegistryEntries(): void {
    this.getApp()
      .route("/registry")
      .get((req: Request, res: Response, next: NextFunction) => {
        this.registry
          .getRegistry()
          .then((registry) => {
            res.send(registry);
          })
          .catch((err) => {
            next(err);
          });
      });
  }

  private updateRegistryEntryById(): void {
    this.getApp()
      .route("/registry/:id")
      .put((req: MsOverride.IRequest, res: Response, next: NextFunction) => {
        this.registry
          .updateRegistryEntryById(req.params.id)
          .then((entry) => {
            res.send(entry);
          })
          .catch((err) => {
            next(err);
          });
      });
  }

  private removeRegistryEntryById(): void {
    this.getApp()
      .route("/registry/:id")
      .delete((req: MsOverride.IRequest, res: Response, next: NextFunction) => {
        res.send(this.registry.removeRegistryEntryById(req.params.id));
      });
  }

  private exposeRedisConf(): void {
    this.getApp()
      .route("/registry/config/redis")
      .get((req: Request, res: Response, next: NextFunction) => {
        if (process.env.SECONDLOCK_REDIS_URI === undefined) {
          res.sendStatus(500);
          return;
        }
        const redisConf: Array<string> = process.env.SECONDLOCK_REDIS_URI.split(":");
        res.send({
          host: redisConf[0],
          port: redisConf[1],
        });
      });
  }
}
