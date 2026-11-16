package com.samgent.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val prefs = Prefs(context)
        if (prefs.apiKey.isNullOrBlank()) return
        // Force collect so a new SMS is not skipped while sms interval is not due.
        SyncWorker.enqueueNow(context, forceAll = true)
    }
}
