import UIKit
import React
import FirebaseCore
import React_RCTAppDelegate
import ReactAppDependencyProvider
@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // NOTE Apple documents `registerForRemoteNotifications()` as a call an app makes on
    // every launch regardless of current status, and nothing here did. React Native
    // Firebase has two call sites and neither covers us: its JS entry point returns early
    // when `isRegisteredForRemoteNotifications` is already YES (RNFBMessagingModule.m:325),
    // and the flag survives from an earlier launch; its other call site rides
    // `UIApplicationDidFinishLaunchingNotification` (RNFBMessaging+NSNotificationCenter.m:93).
    // RNFB's own `requestPermission` would also register (RNFBMessagingModule.m:304), but
    // this app asks through notifee instead, so that path never runs either.
    //
    // Without this call iOS never re-delivers the APNs device token, `getAPNSToken()` stays
    // nil for the whole session, no FCM token is ever minted, and the device is unreachable
    // by push while looking perfectly healthy — permission granted, no error anywhere.
    application.registerForRemoteNotifications()

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Healthene",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // MARK: - APNs registration
  //
  // NOTE observability only — the hand-off itself works. GoogleUtilities swizzles both
  // methods and forwards to the React Native Firebase interceptors, which is how the
  // token reaches FIRMessaging; implementing them here changes no behaviour.
  //
  // They exist because their absence made the outage above completely silent: with no
  // `didFailToRegisterForRemoteNotificationsWithError`, a device that never registered
  // was indistinguishable from a healthy one, and reading the device log for these two
  // lines is the fastest way to tell the two apart next time.
  //
  // Do not reach for `Messaging.messaging().apnsToken` here: FirebaseMessaging is an
  // implementation detail of RNFBMessaging and exports no module map to this target, so
  // `import FirebaseMessaging` does not compile without declaring the pod first.
  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    // NOTE never log the token itself — it is a device identifier.
    NSLog("[APNs] device token received, %d bytes", deviceToken.count)
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    NSLog("[APNs] registration FAILED: %@", error.localizedDescription)
  }

  // Deep link support (healthene://...)
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal links support (https://...)
  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
