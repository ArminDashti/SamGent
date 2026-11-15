package com.samgent.app

object IntervalConfig {
    val KEYS = listOf(
        "sms",
        "calls",
        "gps",
        "networkSignal",
        "networkType",
        "battery",
        "wifiSignal",
        "wifiSsid",
        "publicIp",
    )

    val DEFAULTS = mapOf(
        "sms" to 900,
        "calls" to 900,
        "gps" to 300,
        "networkSignal" to 300,
        "networkType" to 300,
        "battery" to 600,
        "wifiSignal" to 300,
        "wifiSsid" to 60,
        "publicIp" to 900,
    )

    val LABELS = mapOf(
        "sms" to "SMS (sec)",
        "calls" to "Calls (sec)",
        "gps" to "GPS (sec)",
        "networkSignal" to "Network signal (sec)",
        "networkType" to "Network type (sec)",
        "battery" to "Battery (sec)",
        "wifiSignal" to "Wi‑Fi signal (sec)",
        "wifiSsid" to "Wi‑Fi SSID debounce (sec)",
        "publicIp" to "Public IP (sec)",
    )
}
