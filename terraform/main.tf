# GCP infrastructure for the cremind-connect event plane.
#
# This is operator-run by the Cremind GCP admin (NOT by the Worker). It is
# committed for auditability: anyone can see exactly which topic exists, who may
# publish to it, and where pushes are delivered. It deliberately provisions NO
# storage of user data.
#
# NOTE: the OAuth consent screen + "Desktop" OAuth client are created in the
# Cloud Console (Terraform/gcloud cannot fully manage the consent screen). See
# ../SETUP.md.

data "google_project" "this" {
  project_id = var.project_id
}

# APIs required for the event plane.
resource "google_project_service" "apis" {
  for_each = toset([
    "pubsub.googleapis.com",
    "gmail.googleapis.com",
    "calendar-json.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}
