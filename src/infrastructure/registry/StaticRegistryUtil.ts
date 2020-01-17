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




export class StaticRegistryUtil {
  public static createRegistryID(): string {
    return `ms.${this.s4()}-${this.s4()}-${this.s4()}-${this.s4()}`;
  }

  public static s4(): string {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  public static isKubernetes(): boolean {
    if (process.env.RUN_ON_KUBERNETES === undefined || process.env.RUN_ON_KUBERNETES === "false") {
      return false;
    }

    return true;
  }
}
