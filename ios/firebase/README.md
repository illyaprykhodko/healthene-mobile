# Firebase configs, one per bundle id

Firebase reads `GoogleService-Info.plist` from the app bundle **by name**, and the
`BUNDLE_ID` inside it must match the app it ships in. A mismatch is silent: the app
starts fine, but the FCM token registers against the wrong Firebase app and push
never arrives.

Both App Store Connect records are built from the same commit, so the config cannot
live at a fixed path. The `Bundle the Firebase config for the active bundle id`
build phase copies `ios/firebase/$(PRODUCT_BUNDLE_IDENTIFIER)/GoogleService-Info.plist`
into the bundle and fails the build when that file is missing.

| build configuration | bundle id | App Store Connect record |
|---|---|---|
| `Debug`, `Release` | `com.healthene.app` | Healthene Patient Portal (staging / TestFlight) |
| `Release-Production` | `com.healthene.production.app` | Healthene (App Store) |

Schemes: `healthene_staging` archives `Release`, `healthene_production` archives
`Release-Production`. Both bake `.env.production` — staging and production share one
backend.

## Adding an environment

1. Firebase console → Project settings → *Add app* → iOS, with that bundle id
   (project `healthene-cloud-messagin-b0832`, team `8CVNT5LNMY`).
2. Upload the APNs Auth Key under Cloud Messaging for the new app, or push will not
   be delivered to it.
3. Download `GoogleService-Info.plist` and put it at
   `ios/firebase/<bundle id>/GoogleService-Info.plist`.
4. Point a build configuration's `PRODUCT_BUNDLE_IDENTIFIER` at the same bundle id —
   no other wiring is needed.
