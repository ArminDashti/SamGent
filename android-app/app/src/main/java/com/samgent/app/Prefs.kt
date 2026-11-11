package com.samgent.app

import android.content.Context

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
}
