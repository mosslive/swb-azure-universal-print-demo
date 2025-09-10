terraform {
  required_version = ">=1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = var.tags
}

# App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "${var.app_name}-plan"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = var.app_service_plan_sku

  tags = var.tags
}

# Backend App Service
resource "azurerm_linux_web_app" "backend" {
  name                = "${var.app_name}-backend"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    always_on = var.app_service_plan_sku != "F1"
    
    application_stack {
      node_version = "18-lts"
    }
  }

  app_settings = {
    "NODE_ENV"            = "production"
    "AZURE_CLIENT_ID"     = var.azure_client_id
    "AZURE_CLIENT_SECRET" = var.azure_client_secret
    "AZURE_TENANT_ID"     = var.azure_tenant_id
    "AZURE_AUDIENCE"      = var.azure_audience
    "CORS_ORIGINS"        = "https://${var.app_name}-frontend.azurewebsites.net"
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
  }

  https_only = true

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# Frontend App Service
resource "azurerm_linux_web_app" "frontend" {
  name                = "${var.app_name}-frontend"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    always_on = var.app_service_plan_sku != "F1"
  }

  app_settings = {
    "VITE_AZURE_CLIENT_ID" = var.azure_client_id
    "VITE_AZURE_TENANT_ID" = var.azure_tenant_id
    "VITE_AZURE_SCOPE"     = var.azure_audience
    "VITE_BACKEND_URL"     = "https://${var.app_name}-backend.azurewebsites.net"
    "VITE_REDIRECT_URI"    = "https://${var.app_name}-frontend.azurewebsites.net"
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
  }

  https_only = true

  tags = var.tags
}

# Key Vault (optional, for storing secrets)
resource "azurerm_key_vault" "main" {
  count = var.create_key_vault ? 1 : 0
  
  name                = "${var.app_name}-kv-${random_string.suffix.result}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  enable_rbac_authorization = true
  purge_protection_enabled  = false

  tags = var.tags
}

# Give backend app service access to Key Vault
resource "azurerm_role_assignment" "backend_kv_secrets_user" {
  count = var.create_key_vault ? 1 : 0
  
  scope                = azurerm_key_vault.main[0].id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.backend.identity[0].principal_id
}

# Store client secret in Key Vault
resource "azurerm_key_vault_secret" "client_secret" {
  count = var.create_key_vault ? 1 : 0
  
  name         = "azure-client-secret"
  value        = var.azure_client_secret
  key_vault_id = azurerm_key_vault.main[0].id

  depends_on = [azurerm_role_assignment.backend_kv_secrets_user]
}

# Random string for unique naming
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Data sources
data "azurerm_client_config" "current" {}