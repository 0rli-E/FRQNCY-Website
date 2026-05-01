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
    }

    companion object {
        fun fromJson(json: JSONObject): AlarmRecord = AlarmRecord(
            id = json.getString("id"),
            timestamp = json.getLong("timestamp"),
            moment = json.optString("moment", "morning"),
            audioUrl = json.optString("audioUrl").takeIf { it.isNotEmpty() },
            videoUrl = json.optString("videoUrl").takeIf { it.isNotEmpty() },
            label = json.optString("label", "FRQNCY"),
            repeat = json.optString("repeat", "none"),
            fadeInSeconds = json.optInt("fadeInSeconds", 90),
        )
    }
}
