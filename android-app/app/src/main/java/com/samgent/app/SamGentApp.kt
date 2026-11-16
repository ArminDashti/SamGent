package com.samgent.app

import android.app.Application

class SamGentApp : Application() {
    override fun onCreate() {
        super.onCreate()
        WifiMonitor.ensureRegistered(this)
    }
}
