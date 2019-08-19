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

export interface IServiceMapEntry {
  name: string;
  kubernetesName: string;
  port: string;
}

export const serviceMap: Array<IServiceMapEntry> = [
  {
    name: "eco-os-user-service",
    kubernetesName: "user",
    port: "8004",
  },
  {
    name: "eco-os-service-config",
    kubernetesName: "conf",
    port: "8002",
  },
  {
    name: "eco-os-key-service",
    kubernetesName: "key",
    port: "8007",
  },
  {
    name: "eco-os-mail-service",
    kubernetesName: "mail",
    port: "8006",
  },
  {
    name: "eco-os-content-service",
    kubernetesName: "content",
    port: "8009",
  },
  {
    name: "eco-os-auth-service",
    kubernetesName: "auth",
    port: "8005",
  },
  {
    name: "eco-os-public-api-service",
    kubernetesName: "public-api",
    port: "9000",
  },
  {
    name: "eco-os-i18n-service",
    kubernetesName: "i18n",
    port: "8010",
  },
  {
    name: "eco-os-ip-protection-service",
    kubernetesName: "ip-protection",
    port: "8011",
  },
  {
    name: "eco-os-queue-service",
    kubernetesName: "queue",
    port: "8012",
  },
  {
    name: "eco-os-queue-worker-service",
    kubernetesName: "queue-worker",
    port: "8013",
  },
  {
    name: "eco-os-metrics-service",
    kubernetesName: "metrics",
    port: "8014",
  },
  {
    name: "eco-os-federation-service",
    kubernetesName: "federation",
    port: "8015",
  },
  {
    name: "eco-os-license-service",
    kubernetesName: "license",
    port: "8016",
  },
];
