package com.samgent.app

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.Build
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import android.location.LocationManager
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit

object TelemetryCollectors {
    private val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    private fun nowIso(): String = iso.format(Date())

    @SuppressLint("MissingPermission")
    fun collectGps(context: Context): JSONArray {
        val out = JSONArray()
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
        var best: android.location.Location? = null
        for (p in providers) {
            try {
                val loc = lm.getLastKnownLocation(p) ?: continue
                if (best == null || loc.accuracy < best.accuracy) best = loc
            } catch (_: SecurityException) {
                return out
            }
        }
        if (best != null) {
            out.put(
                JSONObject()
                    .put("lat", best.latitude)
                    .put("lon", best.longitude)
                    .put("accuracyM", best.accuracy.toDouble())
                    .put("recordedAt", nowIso()),
            )
        }
        return out
    }

    @SuppressLint("MissingPermission")
    fun collectNetworkSignal(context: Context): JSONArray {
        val out = JSONArray()
        for (sim in activeSims(context)) {
            val tm = sim.telephony
            val dbm = readDbm(tm)
            out.put(
                JSONObject()
                    .put("simSlot", sim.slot)
                    .put("subscriptionId", sim.subId)
                    .put("dbm", dbm)
                    .put("recordedAt", nowIso()),
            )
        }
        return out
    }

    @SuppressLint("MissingPermission")
    fun collectNetworkType(context: Context): JSONArray {
        val out = JSONArray()
        for (sim in activeSims(context)) {
            out.put(
                JSONObject()
                    .put("simSlot", sim.slot)
                    .put("subscriptionId", sim.subId)
                    .put("networkType", networkTypeLabel(sim.telephony))
                    .put("recordedAt", nowIso()),
            )
        }
        return out
    }

    fun collectBattery(context: Context): JSONArray {
        val out = JSONArray()
        val intent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, 100) ?: 100
        val status = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val pct = if (level >= 0 && scale > 0) (level * 100) / scale else -1
        val charging =
            status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL
        out.put(
            JSONObject()
                .put("levelPct", pct)
                .put("charging", charging)
                .put("recordedAt", nowIso()),
        )
        return out
    }

    @SuppressLint("MissingPermission")
    fun collectWifiSignal(context: Context): JSONArray {
        val out = JSONArray()
        val info = currentWifi(context) ?: return out
        out.put(
            JSONObject()
                .put("ssid", info.ssid)
                .put("rssi", info.rssi)
                .put("event", "sample")
                .put("recordedAt", nowIso()),
        )
        return out
    }

    fun wifiEventPayload(ssid: String?, rssi: Int?, event: String): JSONObject {
        return JSONObject()
            .put("ssid", ssid)
            .put("rssi", rssi)
            .put("event", event)
            .put("recordedAt", nowIso())
    }

    fun collectPublicIp(): JSONArray {
        val out = JSONArray()
        val client = OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .build()
        val req = Request.Builder().url("https://api.ipify.org").get().build()
        client.newCall(req).execute().use { res ->
            if (!res.isSuccessful) return out
            val ip = res.body?.string()?.trim().orEmpty()
            if (ip.isBlank()) return out
            out.put(JSONObject().put("ip", ip).put("recordedAt", nowIso()))
        }
        return out
    }

    data class WifiInfo(val ssid: String?, val rssi: Int?)

    @SuppressLint("MissingPermission")
    fun currentWifi(context: Context): WifiInfo? {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return WifiInfo(null, null)
        val caps = cm.getNetworkCapabilities(network) ?: return WifiInfo(null, null)
        if (!caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
            return WifiInfo(null, null)
        }
        val wm = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        @Suppress("DEPRECATION")
        val info = wm.connectionInfo
        val raw = info?.ssid?.trim('"')
        val ssid = if (raw.isNullOrBlank() || raw == "<unknown ssid>") null else raw
        val rssi = info?.rssi
        return WifiInfo(ssid, rssi)
    }

    private data class Sim(
        val slot: Int,
        val subId: Int,
        val telephony: TelephonyManager,
    )

    @SuppressLint("MissingPermission")
    private fun activeSims(context: Context): List<Sim> {
        val sm = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
        val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        val list = mutableListOf<Sim>()
        val subs = try {
            sm.activeSubscriptionInfoList
        } catch (_: SecurityException) {
            null
        }
        if (subs.isNullOrEmpty()) {
            list.add(Sim(slot = 0, subId = SubscriptionManager.DEFAULT_SUBSCRIPTION_ID, telephony = tm))
            return list
        }
        for (info in subs) {
            val subTm = try {
                tm.createForSubscriptionId(info.subscriptionId)
            } catch (_: Exception) {
                tm
            }
            list.add(Sim(slot = info.simSlotIndex, subId = info.subscriptionId, telephony = subTm))
        }
        return list
    }

    @SuppressLint("MissingPermission")
    private fun readDbm(tm: TelephonyManager): Int? {
        if (Build.VERSION.SDK_INT < 28) return null
        val strength = try {
            tm.signalStrength
        } catch (_: Exception) {
            null
        } ?: return null
        if (Build.VERSION.SDK_INT >= 29) {
            return strength.cellSignalStrengths
                .mapNotNull { runCatching { it.dbm }.getOrNull() }
                .filter { it != Int.MAX_VALUE && it != Int.MIN_VALUE }
                .minOrNull()
        }
        return null
    }

    @SuppressLint("MissingPermission")
    private fun networkTypeLabel(tm: TelephonyManager): String {
        if (Build.VERSION.SDK_INT >= 30) {
            try {
                val display = tm.javaClass.getMethod("getTelephonyDisplayInfo").invoke(tm)
                val override = display.javaClass.getMethod("getOverrideNetworkType").invoke(display) as Int
                // TelephonyDisplayInfo override constants
                when (override) {
                    1, 2 -> return "LTE+" // LTE_CA / LTE_ADVANCED_PRO
                    3, 5 -> return "5G" // NR_NSA / NR_ADVANCED
                }
            } catch (_: Exception) {
                // fall through
            }
        }
        @Suppress("DEPRECATION")
        return when (tm.dataNetworkType) {
            TelephonyManager.NETWORK_TYPE_NR -> "5G"
            TelephonyManager.NETWORK_TYPE_LTE -> "LTE"
            TelephonyManager.NETWORK_TYPE_HSPAP,
            TelephonyManager.NETWORK_TYPE_HSPA,
            TelephonyManager.NETWORK_TYPE_HSUPA,
            TelephonyManager.NETWORK_TYPE_HSDPA,
            -> "HSPA"
            TelephonyManager.NETWORK_TYPE_UMTS -> "UMTS"
            TelephonyManager.NETWORK_TYPE_EDGE -> "EDGE"
            TelephonyManager.NETWORK_TYPE_GPRS -> "GPRS"
            TelephonyManager.NETWORK_TYPE_CDMA,
            TelephonyManager.NETWORK_TYPE_1xRTT,
            -> "CDMA"
            TelephonyManager.NETWORK_TYPE_EVDO_0,
            TelephonyManager.NETWORK_TYPE_EVDO_A,
            TelephonyManager.NETWORK_TYPE_EVDO_B,
            -> "EVDO"
            TelephonyManager.NETWORK_TYPE_IWLAN -> "IWLAN"
            TelephonyManager.NETWORK_TYPE_UNKNOWN -> "unknown"
            else -> "other"
        }
    }
}
