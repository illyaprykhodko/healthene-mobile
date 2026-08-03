# Firebase configs, one per bundle id

Firebase reads `GoogleService-Info.plist` from the app bundle **by name**, and the
`BUNDLE_ID` inside it must match the app it ships in. A mismatch is silent: the app
starts fine, but the FCM token registers against the wrong Firebase app and push
never arrives.

Both App Store Connect records are built from the same commit, so the config cannot
live at a fixed path. The `Bundle the Firebase config for the active bundle id`
build phase copies `ios/firebase/$(PRODUCT_BUNDLE_IDENTIFIER)/GoogleService-Info.plist`
into the bundle and fails the build when that file is missing.

| build configuration | bundle id | build number | where it goes |
|---|---|---|---|
| `Debug` | `development.healthene.v2.app` | follows staging | local builds only, never uploaded |
| `Release` | `com.healthene.app` | 106+ | Healthene Patient Portal (staging / TestFlight) |
| `Release-Production` | `com.healthene.production.app` | 20+ | Healthene (App Store) |

`CURRENT_PROJECT_VERSION` is per configuration: each record keeps its own counter, so
a build number is never ambiguous between staging and the App Store. Production starts
at 20 because 19 belongs to 1.0.13 in that record. Bump the counter of the record you
are shipping — App Store Connect only requires the number to climb within its own
record, so the two never have to agree.

Because one commit produces two differently numbered builds, tag the commit you
archive per record, e.g. `staging/2.0.0-106` and `production/2.0.0-20` on the same
commit. A single tag naming one number cannot describe both.

Schemes: `healthene_staging` archives `Release`, `healthene_production` archives
`Release-Production`. Both bake `.env.production` — staging and production share one
backend. Keeping `Debug` on its own identifier means a local build installs beside
the TestFlight app instead of replacing it, and its FCM tokens land in the separate
`Healthene PUSH` Firebase app.

Note that the bundle id follows the **build configuration**, not the scheme. Two
schemes therefore do not line up with their names: `healthene_development` launches
and archives `Release`, so it builds the staging identifier, and
`healthene_staging_debug` builds `Debug`, so it gets the development identifier while
still talking to the `.env.production` backend. Give an environment its own
configuration if that combination ever needs to be exact.

## Adding an environment

1. Firebase console → Project settings → *Add app* → iOS, with that bundle id
   (project `healthene-cloud-messagin-b0832`, team `8CVNT5LNMY`).
2. Upload the APNs Auth Key under Cloud Messaging for the new app, or push will not
   be delivered to it.
3. Download `GoogleService-Info.plist` and put it at
   `ios/firebase/<bundle id>/GoogleService-Info.plist`.
4. Point a build configuration's `PRODUCT_BUNDLE_IDENTIFIER` at the same bundle id —
   no other wiring is needed.
