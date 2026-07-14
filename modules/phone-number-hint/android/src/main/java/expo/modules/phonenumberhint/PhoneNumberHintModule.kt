package expo.modules.phonenumberhint

import android.app.Activity
import android.content.IntentSender
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest
import com.google.android.gms.auth.api.identity.Identity
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val REQUEST_CODE_PHONE_NUMBER_HINT = 42710

class PhoneNumberHintModule : Module() {
  // Only one hint request can be in flight at a time — the picker is a
  // modal system dialog, so a second concurrent call isn't a real scenario.
  private var pendingPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("PhoneNumberHint")

    AsyncFunction("getPhoneNumberHint") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "No current activity to launch the phone number picker from", null)
        return@AsyncFunction
      }

      pendingPromise = promise

      val request = GetPhoneNumberHintIntentRequest.builder().build()
      Identity.getSignInClient(activity)
        .getPhoneNumberHintIntent(request)
        .addOnSuccessListener { pendingIntent ->
          try {
            activity.startIntentSenderForResult(
              pendingIntent.intentSender,
              REQUEST_CODE_PHONE_NUMBER_HINT,
              null,
              0,
              0,
              0
            )
          } catch (e: IntentSender.SendIntentException) {
            resolvePending(null, e)
          }
        }
        .addOnFailureListener { e ->
          // No hint available (no SIM, outdated Play Services, etc.) — this
          // is an expected, non-exceptional outcome for the caller.
          resolvePending(null, null)
        }
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode != REQUEST_CODE_PHONE_NUMBER_HINT) return@OnActivityResult

      val activity = appContext.currentActivity
      if (payload.resultCode != Activity.RESULT_OK || payload.data == null || activity == null) {
        resolvePending(null, null)
        return@OnActivityResult
      }

      val phoneNumber = try {
        Identity.getSignInClient(activity).getPhoneNumberFromIntent(payload.data!!)
      } catch (e: Exception) {
        null
      }
      resolvePending(phoneNumber, null)
    }
  }

  private fun resolvePending(phoneNumber: String?, error: Exception?) {
    val promise = pendingPromise ?: return
    pendingPromise = null
    if (error != null) {
      promise.reject("PHONE_NUMBER_HINT_FAILED", error.message ?: "Failed to launch phone number picker", error)
    } else {
      promise.resolve(phoneNumber)
    }
  }
}
