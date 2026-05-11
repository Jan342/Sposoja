package com.example.pametnipaketnik.ui

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

fun formatOpeningTime(openedAtMillis: Long): String {
    val formatter = SimpleDateFormat("dd. MM. yyyy, HH:mm", Locale.forLanguageTag("sl-SI"))
    return formatter.format(Date(openedAtMillis))
}
