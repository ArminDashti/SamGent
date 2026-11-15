package com.samgent.app

import android.content.Context
import org.json.JSONObject

class Prefs(context: Context) {
    private val sp = context.getSharedPreferences("samgent", Context.MODE_PRIVATE)

    var serverUrl: String
        get() = sp.getString("serverUrl", "http://10.0.2.2:3980") ?: "http://10.0.2.2:3980"
        set(value) = sp.edit().putString("serverUrl", value.trimEnd('/')).apply()

    var apiKey: String?
        get() = sp.getString("apiKey", null)
        set(value) = sp.edit().putString("apiKey", value).apply()

    var lastSyncStatus: String
        get() = sp.getString("lastSyncStatus", "Never synced") ?: "Never synced"
        set(value) = sp.edit().putString("lastSyncStatus", value).apply()

    var configUpdatedAt: String
        get() = sp.getString("configUpdatedAt", "") ?: ""
        set(value) = sp.edit().putString("configUpdatedAt", value).apply()

    var lastWifiSsid: String?
        get() = sp.getString("lastWifiSsid", null)
        set(value) = sp.edit().putString("lastWifiSsid", value).apply()

    var lastWifiEventAt: Long
        get() = sp.getLong("lastWifiEventAt", 0L)
        set(value) = sp.edit().putLong("lastWifiEventAt", value).apply()

    fun intervalSec(key: String): Int {
        val def = IntervalConfig.DEFAULTS[key] ?: 300
        return sp.getInt("interval_$key", def)
    }

    fun setIntervalSec(key: String, sec: Int) {
        sp.edit().putInt("interval_$key", sec.coerceIn(60, 86400)).apply()
    }

    fun lastCollectedAt(key: String): Long = sp.getLong("lastCollected_$key", 0L)

    fun setLastCollectedAt(key: String, epochMs: Long) {
        sp.edit().putLong("lastCollected_$key", epochMs).apply()
    }

    fun applyServerConfig(obj: JSONObject) {
        for (key in IntervalConfig.KEYS) {
            if (obj.has(key)) setIntervalSec(key, obj.optInt(key, intervalSec(key)))
        }
        if (obj.has("updatedAt")) configUpdatedAt = obj.optString("updatedAt", configUpdatedAt)
    }

    fun intervalsJson(): JSONObject {
        val o = JSONObject()
        for (key in IntervalConfig.KEYS) {
            o.put(key, intervalSec(key))
        }
        if (configUpdatedAt.isNotBlank()) o.put("updatedAt", configUpdatedAt)
        return o
    }

    fun isDue(key: String, nowMs: Long = System.currentTimeMillis()): Boolean {
        val last = lastCollectedAt(key)
        if (last <= 0L) return true
        return nowMs - last >= intervalSec(key) * 1000L
    }

    fun nextDueDelayMs(nowMs: Long = System.currentTimeMillis()): Long {
        var minRemain = Long.MAX_VALUE
        for (key in IntervalConfig.KEYS) {
            if (key == "wifiSsid") continue
            val intervalMs = intervalSec(key) * 1000L
            val last = lastCollectedAt(key)
            val remain = if (last <= 0L) 0L else (last + intervalMs - nowMs).coerceAtLeast(0L)
            if (remain < minRemain) minRemain = remain
        }
        if (minRemain == Long.MAX_VALUE) minRemain = 60_000L
        return minRemain.coerceIn(60_000L, 15 * 60_000L)
    }
}
