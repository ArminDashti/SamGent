package com.samgent.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.CoroutineWorker
import androidx.work.workDataOf
import org.json.JSONArray

class WifiReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != ConnectivityManager.CONNECTIVITY_ACTION &&
            intent?.action != "android.net.wifi.STATE_CHANGE"
        ) {
            return
        }
        val prefs = Prefs(context)
        if (prefs.apiKey.isNullOrBlank()) return

        val wifi = TelemetryCollectors.currentWifi(context)
        val ssid = wifi?.ssid
        val prev = prefs.lastWifiSsid
        if (ssid == prev) return

        val now = System.currentTimeMillis()
        val debounceMs = prefs.intervalSec("wifiSsid") * 1000L
        if (now - prefs.lastWifiEventAt < debounceMs) return

        val event = when {
            prev == null && ssid != null -> "connect"
            prev != null && ssid == null -> "disconnect"
            prev != null && ssid != null -> "connect"
            else -> return
        }
        val payload = TelemetryCollectors.wifiEventPayload(ssid ?: prev, wifi?.rssi, event)
        prefs.lastWifiSsid = ssid
        prefs.lastWifiEventAt = now
        prefs.setLastCollectedAt("wifiSsid", now)

        val arr = JSONArray().put(payload)
        WorkManager.getInstance(context).enqueue(
            OneTimeWorkRequestBuilder<WifiEventWorker>()
                .setInputData(workDataOf(WifiEventWorker.KEY_PAYLOAD to arr.toString()))
                .build(),
        )
    }
}

class WifiEventWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val prefs = Prefs(applicationContext)
        if (prefs.apiKey.isNullOrBlank()) return Result.success()
        val raw = inputData.getString(KEY_PAYLOAD) ?: return Result.success()
        return try {
            val wifi = JSONArray(raw)
            SyncEngine.run(applicationContext, prefs, forceAll = false, wifiOnly = wifi)
            Result.success()
        } catch (e: Exception) {
            prefs.lastSyncStatus = "FAIL wifi ${e.message}"
            Result.retry()
        }
    }

    companion object {
        const val KEY_PAYLOAD = "wifiPayload"
    }
}
