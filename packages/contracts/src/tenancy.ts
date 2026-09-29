export type DataClass = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "SECRET" | "REGULATED";
export type EnvironmentName = "development" | "staging" | "production";

export interface TenantContext {
  tenantId: string;
  companyId: string;
  environment: EnvironmentName;
  dataClass: DataClass;
  region?: string;
}

export interface TenantOwnedResource {
  tenantId: string;
  companyId: string;
}
