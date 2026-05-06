/**
 * AccessibilityPreferences — bridge between settings.html toggles and
 * AlarmService runtime behavior.
 *
 * The web layer writes to localStorage (key `frqncy.accessibility.haptic_wake`,
 * boolean true/false). The native side can't read localStorage directly, so a
 * companion @capacitor/preferences write mirrors the value into the Android
 * SharedPreferences file `CapacitorStorage` under the same key. The Capacitor
 * Preferences plugin uses that exact file by default.
 *
 * AlarmService.onStartCommand reads via this object before deciding whether
 * to play audio or vibrate.
 */
package network.frqncy.alarm

import android.content.Context

object AccessibilityPreferences {
    private const val PREFS = "CapacitorStorage"
    private const val HAPTIC_WAKE_KEY = "frqncy.accessibility.haptic_wake"

    fun isHapticWake(context: Context): Boolean {
        // Capacitor's @capacitor/preferences plugin stores values as JSON
        // strings (the value "true" appears as the string "true"). Read both
        // string and boolean for forward compat.
        val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val raw = prefs.getString(HAPTIC_WAKE_KEY, null)
        return raw == "true" || raw == "1"
    }
}
