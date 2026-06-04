package com.example.pametnipaketnik

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.MediaPlayer
import android.os.Bundle
import android.util.Base64
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.core.content.ContextCompat
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
            val faceAuthClient = remember { FaceAuthClient() }
            val preferences = remember { getSharedPreferences("face_auth", MODE_PRIVATE) }
            var history by remember { mutableStateOf(historyRepository.getHistory()) }
            var searchQuery by remember { mutableStateOf("") }
            var showHistory by remember { mutableStateOf(false) }
            var username by remember { mutableStateOf(preferences.getString("username", "").orEmpty()) }
            var password by remember { mutableStateOf("") }
            var loginChallenge by remember { mutableStateOf("") }
            var loggedIn by remember { mutableStateOf(false) }
            var pendingPhotoFile by remember { mutableStateOf<File?>(null) }
            var pendingAction by remember { mutableStateOf("") }
            var authMessage by remember { mutableStateOf("") }
            var authLoading by remember { mutableStateOf(false) }
            val registerPhotos = remember { mutableStateListOf<File>() }
            lateinit var captureFace: (String) -> Unit

            val permissionLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
                contract = ActivityResultContracts.RequestPermission(),
            ) { granted ->
                if (granted) {
                    captureFace(pendingAction)
                } else {
                    authMessage = "Za Face ID je potrebno dovoljenje za kamero."
                }
            }

            val cameraLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
                contract = ActivityResultContracts.TakePicture(),
            ) { captured ->
                val photo = pendingPhotoFile
                if (!captured || photo == null) {
                    authMessage = "Fotografija ni bila zajeta."
                    return@rememberLauncherForActivityResult
                }

                if (pendingAction == "register") {
                    registerPhotos.add(photo)
                    if (registerPhotos.size < 3) {
                        authMessage = "Zajeta fotografija ${registerPhotos.size} / 3. Zajemi naslednjo."
                        captureFace("register")
                    } else {
                        authLoading = true
                        authMessage = "Registriram obraz..."
                        faceAuthClient.register(username.trim(), password, registerPhotos.toList()) { result ->
                            runOnUiThread {
                                authLoading = false
                                result.onSuccess {
                                    authMessage = "Registracija je uspela. Sedaj se lahko prijavis."
                                    registerPhotos.clear()
                                    password = ""
                                }.onFailure { error ->
                                    authMessage = error.message ?: "Registracija ni uspela."
                                }
                            }
                        }
                    }
                } else if (pendingAction == "login") {
                    authLoading = true
                    authMessage = "Preverjam obraz..."
                    faceAuthClient.login(username.trim(), loginChallenge, photo) { result ->
                        runOnUiThread {
                            authLoading = false
                            result.onSuccess { authenticatedUsername ->
                                preferences.edit()
                                    .putString("username", authenticatedUsername)
                                    .apply()
                                username = authenticatedUsername
                                loggedIn = true
                                password = ""
                                loginChallenge = ""
                                authMessage = ""
                            }.onFailure { error ->
                                authMessage = error.message ?: "Prijava ni uspela."
                            }
                        }
                    }
                }
            }

            captureFace = { action ->
                if (username.isBlank()) {
                    authMessage = "Najprej vnesi uporabnisko ime."
                } else if (
                    ContextCompat.checkSelfPermission(
                        this@MainActivity,
                        Manifest.permission.CAMERA,
                    ) != PackageManager.PERMISSION_GRANTED
                ) {
                    pendingAction = action
                    permissionLauncher.launch(Manifest.permission.CAMERA)
                } else {
                    try {
                        val photo = createFacePhotoFile()
                        pendingPhotoFile = photo
                        pendingAction = action
                        val uri = FileProvider.getUriForFile(
                            this@MainActivity,
                            "${packageName}.fileprovider",
                            photo,
                        )
                        cameraLauncher.launch(uri)
                    } catch (error: Exception) {
                        Log.e("FACE_ID", "Kamere ni bilo mogoce odpreti", error)
                        authMessage = "Kamere ni bilo mogoce odpreti: ${error.message}"
                    }
                }
            }

            val filteredHistory = history.filter { record ->
                record.boxId.contains(searchQuery.trim(), ignoreCase = true)
            }

            PametniPaketnikTheme {
                Box(modifier = Modifier.fillMaxSize()) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        if (!loggedIn) {
                            Text(
                                text = "Face ID prijava",
                                style = MaterialTheme.typography.headlineMedium,
                            )

                            OutlinedTextField(
                                value = username,
                                onValueChange = {
                                    username = it
                                    registerPhotos.clear()
                                    authMessage = ""
                                },
                                label = { Text("Uporabnisko ime") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                            )

                            OutlinedTextField(
                                value = password,
                                onValueChange = {
                                    password = it
                                    authMessage = ""
                                },
                                label = { Text("Geslo") },
                                modifier = Modifier.fillMaxWidth(),
                                visualTransformation = PasswordVisualTransformation(),
                                singleLine = true,
                            )

                            Text("Geslo je prvi faktor, obraz pa drugi faktor prijave.")

                            Button(
                                onClick = {
                                    if (password.length < 6) {
                                        authMessage = "Geslo mora imeti vsaj 6 znakov."
                                    } else {
                                        registerPhotos.clear()
                                        authMessage = "Za registracijo zajemi 3 fotografije obraza."
                                        captureFace("register")
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                enabled = !authLoading,
                            ) {
                                Text("Register")
                            }

                            OutlinedButton(
                                onClick = {
                                    if (username.isBlank() || password.isBlank()) {
                                        authMessage = "Vnesi uporabnisko ime in geslo."
                                    } else {
                                        authLoading = true
                                        authMessage = "Preverjam geslo..."
                                        faceAuthClient.verifyPassword(username.trim(), password) { result ->
                                            runOnUiThread {
                                                authLoading = false
                                                result.onSuccess { challenge ->
                                                    loginChallenge = challenge
                                                    authMessage = "Geslo je pravilno. Preveri se obraz."
                                                    captureFace("login")
                                                }.onFailure { error ->
                                                    authMessage = error.message ?: "Preverjanje gesla ni uspelo."
                                                }
                                            }
                                        }
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                enabled = !authLoading,
                            ) {
                                Text("Login")
                            }

                            if (authLoading) {
                                CircularProgressIndicator()
                            }

                            if (authMessage.isNotBlank()) {
                                Text(authMessage)
                            }
                        } else {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    text = "Direct4Me Paketnik",
                                    style = MaterialTheme.typography.headlineMedium,
                                )
                                TextButton(
                                    onClick = {
                                        loggedIn = false
                                    },
                                ) {
                                    Text("Odjava")
                                }
                            }

                            Text("Prijavljen: $username")

                            Row(
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Button(
                                    onClick = {
                                        startScanning(this@MainActivity)
                                    },
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(56.dp),
                                ) {
                                    Text("Skeniraj in Odpri")
                                }

                                OutlinedButton(
                                    onClick = { showHistory = true },
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(56.dp),
                                ) {
                                    Text("Zgodovina")
                                }
                            }

                            if (showHistory) {
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
                    }

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
                                        history = historyRepository.addOpening(scannedBoxId, "Uspešno")
                                        showHistory = true
                                        Toast.makeText(
                                            this@MainActivity,
                                            "Paketnik ID $scannedBoxId se je uspešno odprl.",
                                            Toast.LENGTH_SHORT,
                                        ).show()
                                    },
                                ) {
                                    Text("DA")
                                }
                            },
                            dismissButton = {
                                TextButton(
                                    onClick = {
                                        showDialog = false
                                        history = historyRepository.addOpening(scannedBoxId, "Neuspešno")
                                        showHistory = true
                                    },
                                ) {
                                    Text("NE")
                                }
                            },
                        )
                    }
                }
            }
        }
    }

    private fun createFacePhotoFile(): File {
        val directory = File(cacheDir, "face_photos").apply { mkdirs() }
        return File.createTempFile("face_", ".jpg", directory)
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
