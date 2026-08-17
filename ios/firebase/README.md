# Firebase configs, one per bundle id

Firebase reads `GoogleService-Info.plist` from the app bundle **by name**, and the
`BUNDLE_ID` inside it must match the app it ships in. A mismatch is silent: the app
starts fine, but the FCM token registers against the wrong Firebase app and push
never arrives.

Every App Store Connect record is built from the same commit, so the config cannot
live at a fixed path. The `Bundle the Firebase config for the active bundle id`
build phase copies `ios/firebase/$(PRODUCT_BUNDLE_IDENTIFIER)/GoogleService-Info.plist`
into the bundle and fails the build when that file is missing.

The bundle id follows the **build configuration**, and debug-vs-release is a separate
axis from which record you are building. So each record owns a pair of configurations:
one to run against Metro, one to archive.

| build configuration | bundle id | mode | build number | where it goes |
|---|---|---|---|---|
| `Debug` | `development.healthene.v2.app` | debug | 106 | local runs, never uploaded |
| `Release-Development` | `development.healthene.v2.app` | release | 108+ | Healthene (internal / dev TestFlight) |
| `Debug-Staging` | `com.healthene.app` | debug | 106 | local runs, never uploaded |
| `Release` | `com.healthene.app` | release | 106+ | Healthene Patient Portal (staging / TestFlight) |
| `Release-Production` | `com.healthene.production.app` | release | 20+ | Healthene (App Store) |

Each added configuration is a verbatim copy of the stock `Release` or `Debug` with only
the bundle id and the build counter changed, so nothing about optimisation, assertions
or bundling differs between records. Production has no debug counterpart: there is no
reason to run a local build against the App Store record.

Never reach for the wrong axis to get the right identifier. Archiving `Debug` because it
happened to carry the internal bundle id is what shipped a development JS bundle to
TestFlight once — the RN bundling script keys `DEV=true` off a `*Debug*` configuration
name, so a Debug archive is a debug build no matter where it is uploaded.

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

Every action of a scheme points at one configuration, so a scheme never straddles two
records:

| scheme | env baked | configuration | bundle id |
|---|---|---|---|
| `healthene_development` | `.env.development` | `Release-Development` | `development.healthene.v2.app` |
| `healthene_developmet_debug` | `.env.development` | `Debug` | `development.healthene.v2.app` |
| `healthene_local_debug` | `.env.local` | `Debug` | `development.healthene.v2.app` |
| `healthene_staging` | `.env.production` | `Release` | `com.healthene.app` |
| `healthene_staging_debug` | `.env.production` | `Debug-Staging` | `com.healthene.app` |
| `healthene_production` | `.env.production` | `Release-Production` | `com.healthene.production.app` |

Staging and production bake the same `.env.production` because they share one backend.
`TestAction` and `AnalyzeAction` stay on `Debug` everywhere — the `HealtheneTests` target
does not exist in the project, so neither action builds anything.

Two schemes deliberately share the `Debug` configuration: `healthene_local_debug` and
`healthene_developmet_debug` differ only in the env file they bake, so they install as
the same app and replace each other. The same is true of a local `Debug` run versus the
internal TestFlight build. Give a scheme its own configuration if it ever needs to sit
on a device alongside the others.

FCM tokens from the internal identifier land in the separate `Healthene PUSH` Firebase
app, so an internal build never competes with staging for a token.

`react-native run-ios` reads the scheme's `LaunchAction` when `--mode` is not passed, so
the npm scripts need no `--mode` to pick the right configuration; where one is passed it
only restates what the scheme already says.

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
