# Firebase configs, one per bundle id

Firebase reads `GoogleService-Info.plist` from the app bundle **by name**, and the
`BUNDLE_ID` inside it must match the app it ships in. A mismatch is silent: the app
starts fine, but the FCM token registers against the wrong Firebase app and push
never arrives.

Every App Store Connect record is built from the same commit, so the config cannot
live at a fixed path. The `Bundle the Firebase config for the active bundle id`
build phase copies `ios/firebase/$(PRODUCT_BUNDLE_IDENTIFIER)/GoogleService-Info.plist`
into the bundle and fails the build when that file is missing.

| build configuration | bundle id | build number | where it goes |
|---|---|---|---|
| `Debug` | `development.healthene.v2.app` | 106 | local builds only, never uploaded |
| `Release-Development` | `development.healthene.v2.app` | 108+ | Healthene (internal / dev TestFlight) |
| `Release` | `com.healthene.app` | 106+ | Healthene Patient Portal (staging / TestFlight) |
| `Release-Production` | `com.healthene.production.app` | 20+ | Healthene (App Store) |

`Release-Development` is a verbatim copy of `Release` with the bundle id and the build
counter swapped, so an internal build is optimised exactly like staging and the App
Store. Archiving `Debug` to get the internal identifier is what shipped a development
JS bundle to TestFlight once — the RN bundling script keys `DEV=true` off a `*Debug*`
configuration name, so a Debug archive is a debug build no matter where it is uploaded.

`CURRENT_PROJECT_VERSION` is per configuration: each record keeps its own counter, so
a build number is never ambiguous between records. Production starts at 20 because 19
belongs to 1.0.13 in that record; `Release-Development` starts at 108 to clear
everything already uploaded to the internal record. Bump the counter of the record you
are shipping — App Store Connect only requires the number to climb within its own
record, so the counters never have to agree.

Because one commit produces differently numbered builds per record, tag the commit you
archive per record, e.g. `staging/2.0.0-107`, `production/2.0.0-20` and
`development/2.0.0-108` on the same commit. A single tag naming one number cannot
describe them all.

Schemes: `healthene_development` archives `Release-Development` and bakes
`.env.development`; `healthene_staging` archives `Release` and `healthene_production`
archives `Release-Production`, both baking `.env.production` — staging and production
share one backend. FCM tokens from the internal identifier land in the separate
`Healthene PUSH` Firebase app, so an internal build never competes with staging for a
token.

Note that the bundle id follows the **build configuration**, not the scheme, so a
scheme name is not a promise about the identifier it builds. `healthene_staging_debug`
builds `Debug` and therefore gets the internal identifier while still talking to the
`.env.production` backend, and any local `Debug` install now replaces the internal
TestFlight build rather than sitting beside it, because the two share an identifier.
Give an environment its own configuration if that combination ever needs to be exact.

## Adding an environment

1. Firebase console → Project settings → *Add app* → iOS, with that bundle id
   (project `healthene-cloud-messagin-b0832`, team `8CVNT5LNMY`).
2. Upload the APNs Auth Key under Cloud Messaging for the new app, or push will not
   be delivered to it.
3. Download `GoogleService-Info.plist` and put it at
   `ios/firebase/<bundle id>/GoogleService-Info.plist`.
4. Point a build configuration's `PRODUCT_BUNDLE_IDENTIFIER` at the same bundle id. If
   that means a **new** configuration, copy the closest existing one at both the target
   and the project level, add it to both `XCConfigurationList`s, declare it in the
   `Podfile` (`'<name>' => :release`) and re-run `npm run ios:pods` — CocoaPods
   generates no xcconfig for a configuration it was not told about, and the build fails
   on the missing `Pods-Healthene.<name>.xcconfig`.
