variable "project_id" {
  type        = string
  description = "GCP project that owns the Pub/Sub topic and OAuth client."
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "Default region for regional resources."
}

variable "topic_name" {
  type        = string
  default     = "gmail-watch"
  description = "Pub/Sub topic Gmail users.watch() publishes to (must match GMAIL_PUBSUB_TOPIC)."
}

variable "subscription_name" {
  type        = string
  default     = "gmail-watch-push"
  description = "Push subscription that delivers to the relay."
}

variable "relay_push_url" {
  type        = string
  default     = "https://connect.cremind.io/ingress/google/pubsub"
  description = "The relay endpoint Pub/Sub pushes to (must be public HTTPS with a CA cert)."
}

variable "push_audience" {
  type        = string
  default     = "https://connect.cremind.io/ingress/google/pubsub"
  description = "OIDC audience the relay verifies (PUBSUB_AUDIENCE)."
}

variable "ack_deadline_seconds" {
  type    = number
  default = 30
}

variable "message_retention_duration" {
  type    = string
  default = "86400s" # 1 day; nudges are ephemeral, clients self-heal via sync
}
