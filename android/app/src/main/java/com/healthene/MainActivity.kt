package com.healthene
import android.os.Bundle;
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Healthene"
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    // NOTE Health Connect asks for permissions through an ActivityResult contract, and a
    // launcher can only be registered while the activity is being created. Without this the
    // delegate's `requestPermission` stays uninitialised and the first permission request
    // crashes the app with UninitializedPropertyAccessException — there is no runtime fallback.
    // Expo projects get this from the library's config plugin; a bare project wires it by hand.
    HealthConnectPermissionDelegate.setPermissionDelegate(this)
  }
  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
