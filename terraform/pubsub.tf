# The single topic all users' Gmail mailboxes publish to via users.watch().
resource "google_pubsub_topic" "gmail_watch" {
  name       = var.topic_name
  depends_on = [google_project_service.apis]
}

# Gmail's system service account must be allowed to publish to the topic. This is
# the ONLY publisher; end users never touch GCP IAM.
resource "google_pubsub_topic_iam_member" "gmail_publisher" {
  topic  = google_pubsub_topic.gmail_watch.name
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:gmail-api-push@system.gserviceaccount.com"
}

# Dedicated identity for the authenticated push (its email is the `email` claim
# the relay verifies on the OIDC JWT).
resource "google_service_account" "push" {
  account_id   = "cremind-pubsub-push"
  display_name = "Cremind Connect Pub/Sub push identity"
}

# Allow the Pub/Sub service agent to mint OIDC tokens as the push identity.
resource "google_service_account_iam_member" "push_token_creator" {
  service_account_id = google_service_account.push.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:service-${data.google_project.this.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

# Authenticated push subscription -> the relay. The relay verifies the OIDC JWT's
# signature + audience + service-account email before acting.
resource "google_pubsub_subscription" "gmail_push" {
  name  = var.subscription_name
  topic = google_pubsub_topic.gmail_watch.name

  ack_deadline_seconds       = var.ack_deadline_seconds
  message_retention_duration = var.message_retention_duration

  push_config {
    push_endpoint = var.relay_push_url
    oidc_token {
      service_account_email = google_service_account.push.email
      audience              = var.push_audience
    }
  }

  depends_on = [google_service_account_iam_member.push_token_creator]
}
