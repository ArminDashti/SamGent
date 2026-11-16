package com.samgent.app

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import java.util.concurrent.TimeUnit

class SyncWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val prefs = Prefs(applicationContext)
        if (prefs.apiKey.isNullOrBlank()) return Result.success()
        WifiMonitor.ensureRegistered(applicationContext)
        val forceAll = inputData.getBoolean(KEY_FORCE, false)
        return try {
            val res = SyncEngine.run(applicationContext, prefs, forceAll = forceAll)
            if (!res.optBoolean("skipped", false)) {
                prefs.lastSyncStatus =
                    "OK sms=${res.optInt("smsInserted")} calls=${res.optInt("callsInserted")} " +
                        "gps=${res.optInt("gpsInserted")} bat=${res.optInt("batteryInserted")} · ${System.currentTimeMillis()}"
            }
            // Schedule next only after success — REPLACE + Result.retry() cancels the retry.
            scheduleNext(applicationContext, prefs)
            Result.success()
        } catch (e: Exception) {
            prefs.lastSyncStatus = "FAIL ${e.message}"
            Result.retry()
        }
    }

    companion object {
        private const val UNIQUE = "samgent-sync-once"
        const val KEY_FORCE = "forceAll"

        fun schedule(context: Context, prefs: Prefs = Prefs(context)) {
            scheduleNext(context, prefs)
        }

        fun scheduleNext(context: Context, prefs: Prefs) {
            val delayMs = prefs.nextDueDelayMs()
            val req = OneTimeWorkRequestBuilder<SyncWorker>()
                .setInitialDelay(delayMs, TimeUnit.MILLISECONDS)
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                UNIQUE,
                ExistingWorkPolicy.REPLACE,
                req,
            )
        }

        fun enqueueNow(context: Context, forceAll: Boolean = false) {
            val req = OneTimeWorkRequestBuilder<SyncWorker>()
                .setInputData(workDataOf(KEY_FORCE to forceAll))
                .build()
            WorkManager.getInstance(context).enqueue(req)
        }
    }
}
