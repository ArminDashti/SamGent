package com.samgent.app

import android.content.Context
import android.provider.CallLog
import android.provider.Telephony
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object Collectors {
    private val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    fun collectSms(context: Context, limit: Int = 200): JSONArray {
        val out = JSONArray()
        val cursor = context.contentResolver.query(
            Telephony.Sms.CONTENT_URI,
            arrayOf(
                Telephony.Sms._ID,
                Telephony.Sms.ADDRESS,
                Telephony.Sms.BODY,
                Telephony.Sms.DATE,
                Telephony.Sms.TYPE,
            ),
            null,
            null,
            "${Telephony.Sms.DATE} DESC",
        ) ?: return out

        cursor.use {
            var n = 0
            while (it.moveToNext() && n < limit) {
                val id = it.getLong(0)
                val address = it.getString(1) ?: ""
                val body = it.getString(2) ?: ""
                val date = it.getLong(3)
                val type = it.getInt(4)
                val direction = when (type) {
                    Telephony.Sms.MESSAGE_TYPE_SENT -> "sent"
                    else -> "inbox"
                }
                out.put(
                    JSONObject()
                        .put("providerMsgId", id.toString())
                        .put("address", address)
                        .put("body", body)
                        .put("direction", direction)
                        .put("receivedAt", iso.format(Date(date))),
                )
                n++
            }
        }
        return out
    }

    fun collectCalls(context: Context, limit: Int = 200): JSONArray {
        val out = JSONArray()
        val cursor = context.contentResolver.query(
            CallLog.Calls.CONTENT_URI,
            arrayOf(
                CallLog.Calls._ID,
                CallLog.Calls.NUMBER,
                CallLog.Calls.CACHED_NAME,
                CallLog.Calls.TYPE,
                CallLog.Calls.DURATION,
                CallLog.Calls.DATE,
            ),
            null,
            null,
            "${CallLog.Calls.DATE} DESC",
        ) ?: return out

        cursor.use {
            var n = 0
            while (it.moveToNext() && n < limit) {
                val id = it.getLong(0)
                val number = it.getString(1) ?: ""
                val name = it.getString(2)
                val typeInt = it.getInt(3)
                val duration = it.getLong(4)
                val date = it.getLong(5)
                val type = when (typeInt) {
                    CallLog.Calls.INCOMING_TYPE -> "incoming"
                    CallLog.Calls.OUTGOING_TYPE -> "outgoing"
                    CallLog.Calls.MISSED_TYPE -> "missed"
                    CallLog.Calls.REJECTED_TYPE -> "rejected"
                    else -> "unknown"
                }
                val calledAt = iso.format(Date(date))
                out.put(
                    JSONObject()
                        .put("fingerprint", "$id|$number|$calledAt|$type|$duration")
                        .put("number", number)
                        .put("name", name)
                        .put("type", type)
                        .put("durationSec", duration)
                        .put("calledAt", calledAt),
                )
                n++
            }
        }
        return out
    }
}
