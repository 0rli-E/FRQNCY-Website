package network.frqncy.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import network.frqncy.alarm.FrqncyAlarmPlugin

/**
 * MainActivity — Capacitor 7 host activity.
 *
 * Plugins from npm packages (e.g. @capacitor/preferences) are auto-discovered
 * via the generated `capacitor.build.gradle`. **Custom in-app plugins like
 * FrqncyAlarm must be registered explicitly** — and `registerPlugin` MUST be
 * called BEFORE `super.onCreate()`. Capacitor walks the registered list when
 * the bridge boots; anything registered after will be invisible to JS.
 */
class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(FrqncyAlarmPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
