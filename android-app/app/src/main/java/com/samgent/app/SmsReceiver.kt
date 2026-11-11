package com.samgent.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val prefs = Prefs(context)
        if (prefs.apiKey.isNullOrBlank()) return
        WorkManager.getInstance(context).enqueue(
            OneTimeWorkRequestBuilder<SyncWorker>().build(),
        )
    }
}
