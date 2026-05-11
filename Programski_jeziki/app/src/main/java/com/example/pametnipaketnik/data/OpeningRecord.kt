package com.example.pametnipaketnik.data

data class OpeningRecord(
    val boxId: String,
    val openedAtMillis: Long,
    val status: String = "Odprto",
)
