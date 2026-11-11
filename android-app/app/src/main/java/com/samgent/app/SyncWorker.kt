package com.samgent.app

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

class SyncWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val prefs = Prefs(applicationContext)
        if (prefs.apiKey.isNullOrBlank()) return Result.success()
        return try {
            val api = ApiClient(prefs)
            val sms = Collectors.collectSms(applicationContext)
            val calls = Collectors.collectCalls(applicationContext)
            val res = api.ingest(sms, calls)
            prefs.lastSyncStatus =
                "OK ${res.optInt("smsInserted")} sms / ${res.optInt("callsInserted")} calls · ${System.currentTimeMillis()}"
            Result.success()
        } catch (e: Exception) {
            prefs.lastSyncStatus = "FAIL ${e.message}"
            Result.retry()
        }
    }

    companion object {
        private const val UNIQUE = "samgent-sync"

        fun schedule(context: Context) {
            val req = PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE,
                ExistingPeriodicWorkPolicy.UPDATE,
                req,
            )
        }
    }
}
