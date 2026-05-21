/**
 * AlarmRecord — the canonical alarm payload, serialized to/from SharedPreferences
 * by AlarmStore and passed across the AlarmReceiver → AlarmService → AlarmActivity
 * intent chain.
 */
package network.frqncy.alarm

import org.json.JSONObject

data class AlarmRecord(
    val id: String,
    val timestamp: Long,
    val moment: String,
    val audioUrl: String?,
    val videoUrl: String?,
    val label: String,
    val repeat: String,
    val fadeInSeconds: Int,
    /**
     * How many times this alarm has been snoozed in the current cycle.
     * Reset to 0 each time the alarm is dismissed-properly (breath-hold) or
     * re-armed for the next day's recurring fire. Capped at SNOOZE_LIMIT — the
     * (limit+1)-th attempt routes the user to the breath-hold dismiss instead
     * of granting another snooze (per Stream 6: snooze-into-oblivion is a
     * failure mode worth designing against).
     */
    val snoozeCount: Int = 0,
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("id", id)
        put("timestamp", timestamp)
        put("moment", moment)
        putOpt("audioUrl", audioUrl)
        putOpt("videoUrl", videoUrl)
        put("label", label)
        put("repeat", repeat)
        put("fadeInSeconds", fadeInSeconds)
        put("snoozeCount", snoozeCount)
    }

    companion object {
        const val SNOOZE_LIMIT = 2

        fun fromJson(json: JSONObject): AlarmRecord = AlarmRecord(
            id = json.getString("id"),
            timestamp = json.getLong("timestamp"),
            moment = json.optString("moment", "morning"),
            audioUrl = json.optString("audioUrl").takeIf { it.isNotEmpty() },
            videoUrl = json.optString("videoUrl").takeIf { it.isNotEmpty() },
            label = json.optString("label", "VBRTN"),
            repeat = json.optString("repeat", "none"),
            fadeInSeconds = json.optInt("fadeInSeconds", 90),
            snoozeCount = json.optInt("snoozeCount", 0),
        )
    }
}
