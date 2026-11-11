package com.samgent.app

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

    fun ingest(sms: JSONArray, calls: JSONArray): JSONObject {
        val key = prefs.apiKey ?: error("not_configured")
        val body = JSONObject()
            .put("sms", sms)
            .put("calls", calls)
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
