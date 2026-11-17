package com.samgent.app

import android.os.Build
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class ApiClient(private val prefs: Prefs) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val json = "application/json; charset=utf-8".toMediaType()

    fun getConfig(): JSONObject {
        val key = prefs.apiKey ?: error("not_configured")
        val req = Request.Builder()
            .url("${prefs.serverUrl}/v1/device/config")
            .header("X-Device-Key", key)
            .get()
            .build()
        client.newCall(req).execute().use { res ->
            val text = res.body?.string().orEmpty()
            if (!res.isSuccessful) error("config_get_failed:${res.code}:$text")
            return JSONObject(text)
        }
    }

    fun putConfig(body: JSONObject): JSONObject {
        val key = prefs.apiKey ?: error("not_configured")
        val req = Request.Builder()
            .url("${prefs.serverUrl}/v1/device/config")
            .header("X-Device-Key", key)
            .put(body.toString().toRequestBody(json))
            .build()
        client.newCall(req).execute().use { res ->
            val text = res.body?.string().orEmpty()
            if (res.code == 409) {
                val conflict = JSONObject(text)
                prefs.applyServerConfig(conflict)
                return conflict
            }
            if (!res.isSuccessful) error("config_put_failed:${res.code}:$text")
            val obj = JSONObject(text)
            prefs.applyServerConfig(obj)
            return obj
        }
    }

    fun ingest(
        sms: JSONArray = JSONArray(),
        calls: JSONArray = JSONArray(),
        gps: JSONArray = JSONArray(),
        networkSignal: JSONArray = JSONArray(),
        networkType: JSONArray = JSONArray(),
        battery: JSONArray = JSONArray(),
        wifi: JSONArray = JSONArray(),
        publicIp: JSONArray = JSONArray(),
    ): JSONObject {
        val key = prefs.apiKey ?: error("not_configured")
        val body = JSONObject()
            .put(
                "deviceInfo",
                JSONObject().put("osVersion", "Android ${Build.VERSION.RELEASE}"),
            )
            .put("sms", sms)
            .put("calls", calls)
            .put("gps", gps)
            .put("networkSignal", networkSignal)
            .put("networkType", networkType)
            .put("battery", battery)
            .put("wifi", wifi)
            .put("publicIp", publicIp)
            .toString()
            .toRequestBody(json)
        val req = Request.Builder()
            .url("${prefs.serverUrl}/v1/ingest")
            .header("X-Device-Key", key)
            .post(body)
            .build()
        client.newCall(req).execute().use { res ->
            val text = res.body?.string().orEmpty()
            if (!res.isSuccessful) error("ingest_failed:${res.code}:$text")
            return JSONObject(text)
        }
    }
}
