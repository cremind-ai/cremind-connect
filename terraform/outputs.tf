output "gmail_pubsub_topic" {
  value       = "projects/${var.project_id}/topics/${google_pubsub_topic.gmail_watch.name}"
  description = "Set this as GMAIL_PUBSUB_TOPIC in wrangler.jsonc; clients pass it to users.watch()."
}

output "push_service_account_email" {
  value       = google_service_account.push.email
  description = "Set this as PUBSUB_SA_EMAIL in wrangler.jsonc (the OIDC `email` the relay verifies)."
}

output "push_audience" {
  value       = var.push_audience
  description = "Set this as PUBSUB_AUDIENCE in wrangler.jsonc."
}
