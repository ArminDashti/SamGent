package com.samgent.app

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import androidx.work.CoroutineWorker
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import org.json.JSONArray

/**
 * Listens for Wi‑Fi connect/disconnect via NetworkCallback.
 * Manifest CONNECTIVITY_CHANGE receivers do not run on modern targetSdk.
 */
object WifiMonitor {
    @Volatile
    private var registered = false

    private var appContext: Context? = null

    private val callback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            appContext?.let { handleChange(it) }
        }

        override fun onLost(network: Network) {
            appContext?.let { handleChange(it) }
        }

        override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
            if (networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                appContext?.let { handleChange(it) }
            }
        }
    }

    fun ensureRegistered(context: Context) {
        if (registered) return
        synchronized(this) {
            if (registered) return
            val app = context.applicationContext
            appContext = app
            val cm = app.getSystemService(ConnectivityManager::class.java) ?: return
            val request = NetworkRequest.Builder()
                .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                .build()
            try {
                cm.registerNetworkCallback(request, callback)
                registered = true
            } catch (_: Exception) {
                // leave unregistered; next ensureRegistered can retry
            }
        }
    }

    private fun handleChange(context: Context) {
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
        // Debounce only; lastWifiSsid / lastCollectedAt stamped after successful upload.
        prefs.lastWifiEventAt = now

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
            val first = wifi.optJSONObject(0)
            if (first != null) {
                val event = first.optString("event")
                prefs.lastWifiSsid = if (event == "disconnect") null else first.optString("ssid").ifBlank { null }
                prefs.setLastCollectedAt("wifiSsid", System.currentTimeMillis())
            }
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
