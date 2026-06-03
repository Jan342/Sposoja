package com.example.pametnipaketnik

import android.content.Context
import android.media.MediaPlayer
import android.os.Bundle
import android.util.Base64
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.pametnipaketnik.data.OpeningHistoryRepository
import com.example.pametnipaketnik.ui.HistorySection
import com.example.pametnipaketnik.ui.theme.PametniPaketnikTheme
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
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
            val historyRepository = remember { OpeningHistoryRepository(this@MainActivity) }
            var history by remember { mutableStateOf(historyRepository.getHistory()) }
            var searchQuery by remember { mutableStateOf("") }
            var selectedTab by remember { mutableStateOf(0) }
            val filteredHistory = history.filter { record ->
                record.boxId.contains(searchQuery.trim(), ignoreCase = true)
            }

            PametniPaketnikTheme {
                Scaffold(
                    bottomBar = {
                        NavigationBar {
                            NavigationBarItem(
                                selected = selectedTab == 0,
                                onClick = { selectedTab = 0 },
                                icon = {
                                    Text(text = "📷", fontSize = 20.sp)
                                },
                                label = { Text("Skeniraj") }
                            )
                            NavigationBarItem(
                                selected = selectedTab == 1,
                                onClick = { selectedTab = 1 },
                                icon = {
                                    Text(text = "📋", fontSize = 20.sp)
                                },
                                label = { Text("Zgodovina") }
                            )
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        when (selectedTab) {
                            0 -> ScanTab(
                                onScanClick = { startScanning(this@MainActivity) }
                            )
                            1 -> Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(16.dp)
                            ) {
                                HistorySection(
                                    history = filteredHistory,
                                    totalHistoryCount = history.size,
                                    searchQuery = searchQuery,
                                    onSearchQueryChange = { searchQuery = it },
                                    onClearHistory = {
                                        history = historyRepository.clearHistory()
                                        searchQuery = ""
                                    },
                                    modifier = Modifier.weight(1f),
                                )
                            }
                        }

                        if (showDialog) {
                            AlertDialog(
                                onDismissRequest = { showDialog = false },
                                title = { Text("Paketnik") },
                                text = { Text("Ali se je paketnik uspešno odprl?") },
                                confirmButton = {
                                    TextButton(
                                        onClick = {
                                            showDialog = false
                                            showSuccess = true
                                            history = historyRepository.addOpening(scannedBoxId, "Uspešno")
                                            selectedTab = 1
                                            Toast.makeText(
                                                this@MainActivity,
                                                "Paketnik ID $scannedBoxId se je uspešno odprl.",
                                                Toast.LENGTH_SHORT,
                                            ).show()
                                        },
                                    ) { Text("DA") }
                                },
                                dismissButton = {
                                    TextButton(
                                        onClick = {
                                            showDialog = false
                                            history = historyRepository.addOpening(scannedBoxId, "Neuspešno")
                                            selectedTab = 1
                                        },
                                    ) { Text("NE") }
                                },
                            )
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
                            runOnUiThread {
                                processAndPlay(context, data)
                            }
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
                        Toast.LENGTH_SHORT,
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
        } catch (e: Exception) {
            Log.e("D4M", "Splošna napaka v processAndPlay: ${e.message}")
            e.printStackTrace()
        }
    }
}

@Composable
fun ScanTab(onScanClick: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Top
    ) {
        // Title
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "Pametni Paketnik",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = "Direct4Me",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.weight(1f))

        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(240.dp)
                .clip(CircleShape)
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.primary,
                            MaterialTheme.colorScheme.primary.copy(alpha = 0.75f)
                        )
                    )
                )
                .border(
                    width = 4.dp,
                    brush = Brush.linearGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.primaryContainer,
                            MaterialTheme.colorScheme.primary
                        )
                    ),
                    shape = CircleShape
                )
                .clickable { onScanClick() }
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "SKENIRAJ",
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp,
                    letterSpacing = 3.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(28.dp))
        Text(
            text = "Pritisni krog za skeniranje QR kode paketnika",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.weight(1f))
    }
}
