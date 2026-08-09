# GCP infrastructure for the cremind-connect event plane.
#
# This is operator-run by the Cremind GCP admin (NOT by the Worker). It is
# committed for auditability: anyone can see exactly which Google APIs are
# enabled. It deliberately provisions NO storage of user data, and no push
# infrastructure — Calendar and Drive deliver straight to the relay's webhook,
# which needs nothing on the GCP side beyond domain verification.
#
# NOTE: the OAuth consent screen + "Desktop" OAuth client are created in the
# Cloud Console (Terraform/gcloud cannot fully manage the consent screen). See
# ../SETUP-GCP.md.

# APIs required for the event plane. Gmail stays enabled for gmail.send: the
# shared OAuth client is send-only, so there is no users.watch()/Pub/Sub lane.
resource "google_project_service" "apis" {
  for_each = toset([
    "gmail.googleapis.com",
    "calendar-json.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}
