package com.example.pametnipaketnik.data

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

class OpeningHistoryRepository(context: Context) {
    private val preferences: SharedPreferences = context.getSharedPreferences(
        "opening_history",
        Context.MODE_PRIVATE,
    )

    fun getHistory(): List<OpeningRecord> {
        val rawHistory = preferences.getString(KEY_HISTORY, "[]").orEmpty()
        val jsonArray = JSONArray(rawHistory)

        return buildList {
            for (index in 0 until jsonArray.length()) {
                val item = jsonArray.getJSONObject(index)
                add(
                    OpeningRecord(
                        boxId = item.getString("boxId"),
                        openedAtMillis = item.getLong("openedAtMillis"),
                        status = item.optString("status", "Odprto"),
                    ),
                )
            }
        }.sortedByDescending { it.openedAtMillis }
    }

    fun addOpening(boxId: String): List<OpeningRecord> {
        val updatedHistory = listOf(
            OpeningRecord(
                boxId = boxId,
                openedAtMillis = System.currentTimeMillis(),
            ),
        ) + getHistory()

        saveHistory(updatedHistory)
        return updatedHistory
    }

    fun clearHistory(): List<OpeningRecord> {
        preferences.edit().remove(KEY_HISTORY).apply()
        return emptyList()
    }

    private fun saveHistory(history: List<OpeningRecord>) {
        val jsonArray = JSONArray()
        history.forEach { record ->
            jsonArray.put(
                JSONObject()
                    .put("boxId", record.boxId)
                    .put("openedAtMillis", record.openedAtMillis)
                    .put("status", record.status),
            )
        }

        preferences.edit()
            .putString(KEY_HISTORY, jsonArray.toString())
            .apply()
    }

    private companion object {
        const val KEY_HISTORY = "history"
    }
}
