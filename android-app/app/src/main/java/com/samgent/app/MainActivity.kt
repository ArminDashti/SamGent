package com.samgent.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.text.InputType
import android.widget.LinearLayout
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.samgent.app.databinding.ActivityMainBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: Prefs
    private val intervalFields = linkedMapOf<String, TextInputEditText>()

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { result ->
        val ok = result.values.all { it }
        binding.status.text = if (ok) "Permissions granted" else "Some permissions denied"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        prefs = Prefs(this)

        binding.serverUrl.setText(prefs.serverUrl)
        binding.apiKey.setText(prefs.apiKey.orEmpty())
        buildIntervalFields()
        refreshStatus()

        binding.btnSave.setOnClickListener { saveConnection() }
        binding.btnPermissions.setOnClickListener { requestPerms() }
        binding.btnSync.setOnClickListener { syncNow() }
        binding.btnSaveIntervals.setOnClickListener { saveIntervals() }

        SyncWorker.schedule(this, prefs)
        if (!prefs.apiKey.isNullOrBlank()) {
            lifecycleScope.launch {
                withContext(Dispatchers.IO) {
                    try {
                        SyncEngine.pullConfig(prefs, ApiClient(prefs))
                    } catch (_: Exception) {
                    }
                }
                fillIntervalFields()
            }
        }
    }

    private fun buildIntervalFields() {
        binding.intervalContainer.removeAllViews()
        intervalFields.clear()
        for (key in IntervalConfig.KEYS) {
            val layout = TextInputLayout(this).apply {
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                ).also { it.topMargin = 8 }
                hint = IntervalConfig.LABELS[key] ?: key
            }
            val edit = TextInputEditText(this).apply {
                inputType = InputType.TYPE_CLASS_NUMBER
                minHeight = (48 * resources.displayMetrics.density).toInt()
                setText(prefs.intervalSec(key).toString())
            }
            layout.addView(edit)
            binding.intervalContainer.addView(layout)
            intervalFields[key] = edit
        }
    }

    private fun fillIntervalFields() {
        for ((key, edit) in intervalFields) {
            edit.setText(prefs.intervalSec(key).toString())
        }
    }

    private fun refreshStatus() {
        val configured = !prefs.apiKey.isNullOrBlank()
        binding.status.text = buildString {
            append(if (configured) "Configured · ${prefs.serverUrl}" else "Not configured")
            append("\n")
            append(prefs.lastSyncStatus)
            if (prefs.configUpdatedAt.isNotBlank()) {
                append("\nConfig: ")
                append(prefs.configUpdatedAt)
            }
        }
    }

    private fun saveConnection() {
        val url = binding.serverUrl.text?.toString()?.trim().orEmpty()
        val key = binding.apiKey.text?.toString()?.trim().orEmpty()
        if (url.isBlank() || key.isBlank()) {
            Toast.makeText(this, "Server URL and API key required", Toast.LENGTH_SHORT).show()
            return
        }
        prefs.serverUrl = url
        prefs.apiKey = key
        refreshStatus()
        SyncWorker.schedule(this, prefs)
        lifecycleScope.launch {
            withContext(Dispatchers.IO) {
                try {
                    SyncEngine.pullConfig(prefs, ApiClient(prefs))
                } catch (_: Exception) {
                }
            }
            fillIntervalFields()
            refreshStatus()
        }
        Toast.makeText(this, "Saved", Toast.LENGTH_SHORT).show()
    }

    private fun saveIntervals() {
        if (prefs.apiKey.isNullOrBlank()) {
            Toast.makeText(this, "Save URL and API key first", Toast.LENGTH_SHORT).show()
            return
        }
        for ((key, edit) in intervalFields) {
            val n = edit.text?.toString()?.toIntOrNull()
            if (n == null || n < 60 || n > 86400) {
                Toast.makeText(this, "Invalid interval for $key (60–86400)", Toast.LENGTH_SHORT).show()
                return
            }
            prefs.setIntervalSec(key, n)
        }
        binding.status.text = "Saving intervals…"
        lifecycleScope.launch {
            try {
                withContext(Dispatchers.IO) {
                    ApiClient(prefs).putConfig(prefs.intervalsJson())
                }
                fillIntervalFields()
                SyncWorker.schedule(this@MainActivity, prefs)
                refreshStatus()
                Toast.makeText(this@MainActivity, "Intervals saved", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                prefs.lastSyncStatus = "FAIL intervals ${e.message}"
                refreshStatus()
            }
        }
    }

    private fun requestPerms() {
        val needed = mutableListOf(
            Manifest.permission.READ_SMS,
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_CALL_LOG,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        )
        if (Build.VERSION.SDK_INT >= 33) {
            needed += Manifest.permission.POST_NOTIFICATIONS
        }
        val missing = needed.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isEmpty()) {
            binding.status.text = "Permissions already granted"
            return
        }
        permissionLauncher.launch(missing.toTypedArray())
    }

    private fun syncNow() {
        if (prefs.apiKey.isNullOrBlank()) {
            Toast.makeText(this, "Save URL and API key first", Toast.LENGTH_SHORT).show()
            return
        }
        binding.status.text = "Syncing…"
        lifecycleScope.launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    SyncEngine.run(this@MainActivity, prefs, forceAll = true)
                }
                val skipped = result.optBoolean("skipped", false)
                prefs.lastSyncStatus = if (skipped) {
                    "OK skipped (nothing due) · now"
                } else {
                    "OK sms=${result.optInt("smsInserted")} calls=${result.optInt("callsInserted")} " +
                        "gps=${result.optInt("gpsInserted")} wifi=${result.optInt("wifiInserted")} · now"
                }
                SyncWorker.schedule(this@MainActivity, prefs)
                refreshStatus()
                Toast.makeText(this@MainActivity, prefs.lastSyncStatus, Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                prefs.lastSyncStatus = "FAIL ${e.message}"
                refreshStatus()
                Toast.makeText(this@MainActivity, prefs.lastSyncStatus, Toast.LENGTH_LONG).show()
            }
        }
    }
}
