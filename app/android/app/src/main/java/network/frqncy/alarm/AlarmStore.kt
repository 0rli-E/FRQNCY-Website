/**
 * AlarmStore — persistent storage for alarm records.
 *
 * v1: SharedPreferences with JSON-serialized AlarmRecord values, one entry per
 *     alarm id. Direct-boot-aware so BootReceiver can read before user unlock.
 *
 * v1.5 (Phase 1.5 of ROADMAP-2026-04-29.md): migrate to Room with a
 *     directBootAware database for richer querying (recurring rules, snooze
 *     history, audio URI metadata). Migration plan documented at the bottom
 *     of this file.
 *
 * The on-disk shape is: a single SharedPreferences file `frqncy_alarms.xml`
 * with keys `alarm:<id>` → JSON string. Listing all alarms = filter all keys
 * with that prefix and parse. ~50 alarms is fine; beyond that, switch to Room.
 */
package network.frqncy.alarm

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

class AlarmStore(context: Context) {

    // Use createDeviceProtectedStorageContext() so reads work before user
    // unlock — required for BootReceiver on N+ to rehydrate alarms set on a
    // freshly-rebooted device.
    private val ctx: Context = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
        context.createDeviceProtectedStorageContext()
    } else {
        context.applicationContext
    }

    private val prefs: SharedPreferences = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun upsert(record: AlarmRecord) {
        prefs.edit().putString(key(record.id), record.toJson().toString()).apply()
    }

    fun delete(id: String) {
        prefs.edit().remove(key(id)).apply()
    }

    fun get(id: String): AlarmRecord? {
        val raw = prefs.getString(key(id), null) ?: return null
        return runCatching { AlarmRecord.fromJson(JSONObject(raw)) }.getOrNull()
    }

    fun all(): List<AlarmRecord> = prefs.all
        .filterKeys { it.startsWith(KEY_PREFIX) }
        .values
        .filterIsInstance<String>()
        .mapNotNull { runCatching { AlarmRecord.fromJson(JSONObject(it)) }.getOrNull() }

    private fun key(id: String) = "$KEY_PREFIX$id"

    companion object {
        private const val PREFS_NAME = "frqncy_alarms"
        private const val KEY_PREFIX = "alarm:"
    }
}

/*
 * Future Room migration sketch (Phase 1.5):
 *
 * @Entity(tableName = "alarms")
 * data class AlarmEntity(
 *     @PrimaryKey val id: String,
 *     val timestamp: Long,
 *     val moment: String,
 *     val audioUrl: String?,
 *     val videoUrl: String?,
 *     val label: String,
 *     val repeat: String,
 *     val fadeInSeconds: Int,
 *     val lastFiredAt: Long? = null,
 *     val snoozeCount: Int = 0,
 * )
 *
 * @Database(
 *     entities = [AlarmEntity::class],
 *     version = 1,
 *     exportSchema = true,
 * )
 * abstract class AlarmDatabase : RoomDatabase() {
 *     abstract fun alarms(): AlarmDao
 * }
 *
 * Build with `Room.databaseBuilder(deviceProtectedContext, AlarmDatabase::class.java, "alarms.db")`
 * and `.enableMultiInstanceInvalidation()`. KSP > kapt for room-compiler.
 */
