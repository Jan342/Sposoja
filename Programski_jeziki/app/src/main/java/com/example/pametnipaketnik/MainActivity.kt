package com.example.pametnipaketnik

import android.content.Context
import android.media.MediaPlayer
import android.os.Bundle
import android.util.Base64
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.pametnipaketnik.ui.theme.PametniPaketnikTheme
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PametniPaketnikTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Direct4Me Paketnik",
                            style = MaterialTheme.typography.headlineMedium
                        )
                        Spacer(modifier = Modifier.height(30.dp))

                        Button(
                            onClick = { startScanning(this@MainActivity) },
                            modifier = Modifier.size(width = 200.dp, height = 60.dp)
                        ) {
                            Text("Skeniraj in Odpri")
                        }
                    }
                }
            }
        }
    }

    private fun startScanning(context: Context) {
        val scanner = GmsBarcodeScanning.getClient(context)
        Log.d("D4M", "Odpiram skener...")

        scanner.startScan()
            .addOnSuccessListener { barcode ->
                val rawValue = barcode.rawValue ?: ""
                Log.d("D4M", "Skeniranje uspelo! Surov tekst: $rawValue")

                val cleanUrl = rawValue.removeSuffix("/")

                val parts = cleanUrl.split("/")

                val rawId = parts.find { it.length >= 4 && it.all { char -> char.isDigit() } } ?: ""

                val boxId = rawId.trimStart('0')


            }
    }

}