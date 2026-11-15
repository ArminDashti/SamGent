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
        val sms = if (forceAll || prefs.isDue("sms", now)) {
            Collectors.collectSms(context).also { prefs.setLastCollectedAt("sms", now) }
        } else {
            JSONArray()
        }
        val calls = if (forceAll || prefs.isDue("calls", now)) {
            Collectors.collectCalls(context).also { prefs.setLastCollectedAt("calls", now) }
        } else {
            JSONArray()
        }
        val gps = if (forceAll || prefs.isDue("gps", now)) {
            TelemetryCollectors.collectGps(context).also { prefs.setLastCollectedAt("gps", now) }
        } else {
            JSONArray()
        }
        val networkSignal = if (forceAll || prefs.isDue("networkSignal", now)) {
            TelemetryCollectors.collectNetworkSignal(context).also {
                prefs.setLastCollectedAt("networkSignal", now)
            }
        } else {
            JSONArray()
        }
        val networkType = if (forceAll || prefs.isDue("networkType", now)) {
            TelemetryCollectors.collectNetworkType(context).also {
                prefs.setLastCollectedAt("networkType", now)
            }
        } else {
            JSONArray()
        }
        val battery = if (forceAll || prefs.isDue("battery", now)) {
            TelemetryCollectors.collectBattery(context).also {
                prefs.setLastCollectedAt("battery", now)
            }
        } else {
            JSONArray()
        }
        val wifiSignal = if (forceAll || prefs.isDue("wifiSignal", now)) {
            TelemetryCollectors.collectWifiSignal(context).also {
                prefs.setLastCollectedAt("wifiSignal", now)
            }
        } else {
            JSONArray()
        }
        val wifi = JSONArray()
        for (i in 0 until wifiSignal.length()) wifi.put(wifiSignal.getJSONObject(i))
        if (wifiOnly != null) {
            for (i in 0 until wifiOnly.length()) wifi.put(wifiOnly.getJSONObject(i))
        }
        val publicIp = if (forceAll || prefs.isDue("publicIp", now)) {
            TelemetryCollectors.collectPublicIp().also {
                prefs.setLastCollectedAt("publicIp", now)
            }
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
            return JSONObject().put("ok", true).put("skipped", true)
        }

        return api.ingest(
            sms = sms,
            calls = calls,
            gps = gps,
            networkSignal = networkSignal,
            networkType = networkType,
            battery = battery,
            wifi = wifi,
            publicIp = publicIp,
        )
    }
}
