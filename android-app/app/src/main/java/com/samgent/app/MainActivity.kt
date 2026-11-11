package com.samgent.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.samgent.app.databinding.ActivityMainBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: Prefs

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
        refreshStatus()

        binding.btnSave.setOnClickListener { saveConnection() }
        binding.btnPermissions.setOnClickListener { requestPerms() }
        binding.btnSync.setOnClickListener { syncNow() }

        SyncWorker.schedule(this)
    }

    private fun refreshStatus() {
        val configured = !prefs.apiKey.isNullOrBlank()
        binding.status.text = buildString {
            append(if (configured) "Configured · ${prefs.serverUrl}" else "Not configured")
            append("\n")
            append(prefs.lastSyncStatus)
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
        Toast.makeText(this, "Saved", Toast.LENGTH_SHORT).show()
    }

    private fun requestPerms() {
        val needed = mutableListOf(
            Manifest.permission.READ_SMS,
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_CALL_LOG,
            Manifest.permission.READ_PHONE_STATE,
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
                    val api = ApiClient(prefs)
                    val sms = Collectors.collectSms(this@MainActivity)
                    val calls = Collectors.collectCalls(this@MainActivity)
                    api.ingest(sms, calls)
                }
                prefs.lastSyncStatus =
                    "OK ${result.optInt("smsInserted")} sms / ${result.optInt("callsInserted")} calls · now"
                refreshStatus()
            } catch (e: Exception) {
                prefs.lastSyncStatus = "FAIL ${e.message}"
                refreshStatus()
            }
        }
    }
}
