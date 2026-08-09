variable "project_id" {
  type        = string
  description = "GCP project that owns the enabled APIs and the OAuth client."
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "Default region for regional resources."
}
