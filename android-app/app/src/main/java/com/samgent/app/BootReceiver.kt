package com.samgent.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
        val prefs = Prefs(context)
        if (prefs.apiKey.isNullOrBlank()) return
        WifiMonitor.ensureRegistered(context)
        SyncWorker.schedule(context, prefs)
    }
}
