package com.example.pametnipaketnik

import android.content.Context
import android.media.MediaPlayer
import android.os.Bundle
import android.util.Base64
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
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

    private var scannedBoxId by mutableStateOf("")
    private var showDialog by mutableStateOf(false)
    private var showSuccess by mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PametniPaketnikTheme {
                Box(
                    modifier = Modifier.fillMaxSize()
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
                        Spacer(modifier = Modifier.height(25.dp))

                    if (showDialog) {
                        AlertDialog(
                            onDismissRequest = {
                                showDialog = false
                            },

                            title = {
                                Text("Paketnik")
                            },

                            text = {
                                Text("Ali se je paketnik uspešno odprl?")
                            },
                            confirmButton = {

                                TextButton(
                                    onClick = {
                                        showDialog = false
                                        showSuccess = true
                                                Toast.makeText(
                                                    this@MainActivity,
                                                    "Paketnik ID $scannedBoxId se je uspešno odprl.",
                                                    Toast.LENGTH_SHORT
                                                ).show()
                                    }
                                ) {
                                    Text("DA")
                                }
                            },

                            dismissButton = {
                                TextButton(
                                    onClick = {
                                        showDialog = false
                                    }
                                ) {
                                    Text("NE")
                                }

                            }
                        )
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
                showSuccess = false
                val rawValue = barcode.rawValue ?: ""
                Log.d("D4M", "Skeniranje uspelo! Tekst: $rawValue")

                val cleanUrl = rawValue.removeSuffix("/")

                val parts = cleanUrl.split("/")

                val rawId = parts.find { it.length >= 4 && it.all { char -> char.isDigit() } } ?: ""

                val boxId = rawId.trimStart('0')

                if (boxId.isNotEmpty()) {
                    scannedBoxId = boxId
                    Log.d("D4M", "Box ID: $boxId")
                    playToken(context, boxId)
                } else {
                    Log.e("D4M", "ID-ja ni bilo mogoče dobiti iz: $rawValue")
                }
            }
    }

    private fun playToken(context: Context, boxId: String) {
        val client = OkHttpClient()
        val json = JSONObject().apply {
            put("boxId", boxId)
            put("tokenFormat", 5)
        }

        val request = Request.Builder()
            .url("https://api-d4me-stage.direct4.me/sandbox/v1/Access/openbox")
            .addHeader("Authorization", "Bearer 9ea96945-3a37-4638-a5d4-22e89fbc998f")
            .post(json.toString().toRequestBody("application/json".toMediaType()))
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("D4M", "API napaka: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                Log.d("D4M", "HTTP CODE: ${response.code}")
                val responseBody = response.body?.string()
                if (responseBody != null) {
                    try {
                        val data = JSONObject(responseBody).optString("data")
                        if (data.isNotEmpty()) {
                            processAndPlay(context, data)
                        }
                    } catch (e: Exception) {
                        Log.e("D4M", "Napaka pri branju JSON: ${e.message}")
                    }
                }
            }
        })
    }

    fun processAndPlay(context: Context, base64Data: String) {
        try {
            val clean = base64Data.trim().replace("\"", "")
            val bytes = Base64.decode(clean, Base64.DEFAULT)
            val tempFile = File(context.cacheDir, "token.wav")

            var success = false
            try {
                java.util.zip.GZIPInputStream(bytes.inputStream()).use { input ->
                    FileOutputStream(tempFile).use { output ->
                        input.copyTo(output)
                    }
                }
                success = true
                Log.d("D4M", "Uspešno odpakirano z GZIP")
            } catch (_: Exception) {
                Log.d("D4M", "GZIP ni uspel.")
            }

            if (!success) {
                FileOutputStream(tempFile).use { output ->
                    output.write(bytes)
                }
                Log.d("D4M", "Zapisano kot WAV.")
            }
            if (tempFile.exists() && tempFile.length() > 0) {
                runOnUiThread {
                    Toast.makeText(
                        context,
                        "Predvajam token za paketnik ID $scannedBoxId",
                        Toast.LENGTH_SHORT
                    ).show()
                }
                val mp = MediaPlayer()
                try {
                        mp.setDataSource(tempFile.absolutePath)
                        mp.prepare()
                        mp.start()
                        Log.d("D4M", "Uspešno piska!")
                        mp.setOnCompletionListener {
                            it.release()
                            runOnUiThread {
                                showDialog = true
                            }
                        }
                } catch (e: Exception) {
                    Log.e("D4M", "Končna napaka: ${e.message}")
                    mp.release()
                    runOnUiThread {
                        Toast.makeText(context, "Napaka pri predvajanju zvoka", Toast.LENGTH_SHORT)
                            .show()
                    }
                }
            } else {
                runOnUiThread {
                    Toast.makeText(context, "Napaka: Zvočna datoteka je prazna", Toast.LENGTH_SHORT)
                        .show()
                }
            }
        }
        catch (e: Exception) {
            Log.e("D4M", "Splošna napaka v processAndPlay: ${e.message}")
            e.printStackTrace()
        }
    }
}
