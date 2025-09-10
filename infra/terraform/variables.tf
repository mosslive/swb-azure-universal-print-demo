variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "swb-azure-print-demo"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "rg-swb-azure-print-demo"
}

variable "location" {
  description = "Azure region where resources will be created"
  type        = string
  default     = "East US"
}

variable "app_service_plan_sku" {
  description = "SKU of the App Service Plan"
  type        = string
  default     = "B1"
  validation {
    condition = contains(["F1", "B1", "B2", "B3", "S1", "S2", "S3", "P1v2", "P2v2", "P3v2"], var.app_service_plan_sku)
    error_message = "Invalid App Service Plan SKU. Must be one of: F1, B1, B2, B3, S1, S2, S3, P1v2, P2v2, P3v2."
  }
}

variable "azure_client_id" {
  description = "Azure AD Application Client ID"
  type        = string
}

variable "azure_client_secret" {
  description = "Azure AD Application Client Secret"
  type        = string
  sensitive   = true
}

variable "azure_tenant_id" {
  description = "Azure AD Tenant ID"
  type        = string
}

variable "azure_audience" {
  description = "Azure AD Application Audience (API Scope)"
  type        = string
}

variable "create_key_vault" {
  description = "Whether to create a Key Vault for storing secrets"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "SWB Azure Universal Print Demo"
    Environment = "Development"
    ManagedBy   = "Terraform"
  }
}